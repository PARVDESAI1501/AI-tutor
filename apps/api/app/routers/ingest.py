import traceback
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.models.schemas import IngestResponse, YouTubeIngestResponse, SourceStatusResponse
from app.services.parser import DocumentParser
from app.services.chunker import TextChunker
from app.services.embedder import EmbeddingService
from app.utils.supabase import get_supabase_client

router = APIRouter(prefix="/api", tags=["Ingestion"])

class WebIngestRequest(BaseModel):
    url: str
    user_id: str
    title: Optional[str] = None
    type: str # "youtube" or "web"

class TextIngestRequest(BaseModel):
    text: str
    user_id: str
    title: str

@router.post("/upload", response_model=IngestResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Form(...),
    title: str = Form(...),
):
    try:
        file_bytes = await file.read()
        
        # Max size 25MB
        if len(file_bytes) > 25 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds 25MB limit")

        ext = file.filename.split('.')[-1].lower() if file.filename else ""
        
        if ext in ['pdf', 'pptx', 'docx']:
            source_type = ext
        elif ext in ['mp3', 'mp4', 'wav', 'm4a', 'webm', 'mpeg', 'mpga']:
            source_type = 'audio' if ext in ['mp3', 'wav', 'm4a', 'mpeg', 'mpga'] else 'video'
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")

        supabase = get_supabase_client()
        file_path = f"{user_id}/{file.filename}"
        
        try:
            supabase.storage.from_("documents").upload(path=file_path, file=file_bytes, file_options={"upsert": "true"})
        except Exception as e:
            print(f"Storage upload warning (safe to ignore for media): {e}")

        result = supabase.table("sources").insert({
            "user_id": user_id, 
            "title": title, 
            "source_type": source_type, 
            "file_path": file_path, 
            "status": "processing"
        }).execute()
        
        source_id = result.data[0]["id"]
        background_tasks.add_task(process_file, source_id, user_id, file_bytes, source_type, file.filename)
        return IngestResponse(status="processing", source_id=source_id, message="Processing started")
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/web", response_model=YouTubeIngestResponse)
async def ingest_web(request: WebIngestRequest, background_tasks: BackgroundTasks):
    try:
        supabase = get_supabase_client()
        result = supabase.table("sources").insert({
            "user_id": request.user_id, 
            "title": request.title or request.url, 
            "source_type": request.type, 
            "youtube_url": request.url, 
            "status": "processing"
        }).execute()
        
        source_id = result.data[0]["id"]
        background_tasks.add_task(process_web, source_id, request.user_id, request.url, request.type)
        return YouTubeIngestResponse(source_id=source_id, status="processing", message="Started")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/text", response_model=IngestResponse)
async def ingest_text(request: TextIngestRequest, background_tasks: BackgroundTasks):
    try:
        supabase = get_supabase_client()
        result = supabase.table("sources").insert({
            "user_id": request.user_id, 
            "title": request.title, 
            "source_type": "text", 
            "status": "processing"
        }).execute()
        
        source_id = result.data[0]["id"]
        background_tasks.add_task(process_raw_text, source_id, request.user_id, request.text)
        return IngestResponse(status="processing", source_id=source_id, message="Started")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/source/{source_id}/status")
async def get_source_status(source_id: str):
    supabase = get_supabase_client()
    res = supabase.table("sources").select("*").eq("id", source_id).single().execute()
    if not res.data: raise HTTPException(status_code=404)
    chunks = supabase.table("chunks").select("id", count="exact").eq("source_id", source_id).execute()
    return {"status": res.data["status"], "chunk_count": chunks.count or 0, "error": res.data.get("metadata", {}).get("error")}

# --- Background Tasks ---
def process_file(source_id, user_id, file_bytes, source_type, filename):
    try:
        parser = DocumentParser()
        if source_type in ['audio', 'video']:
            pages = parser.parse_audio_video(file_bytes, filename)
        else:
            pages = getattr(parser, f"parse_{source_type}")(file_bytes)
        run_pipeline(source_id, user_id, pages)
    except Exception as e:
        mark_error(source_id, str(e))

def process_web(source_id, user_id, url, type_):
    try:
        parser = DocumentParser()
        pages = parser.parse_youtube(url) if type_ == "youtube" else parser.parse_website(url)
        run_pipeline(source_id, user_id, pages)
    except Exception as e:
        mark_error(source_id, str(e))

def process_raw_text(source_id, user_id, text):
    try:
        pages = DocumentParser().parse_text(text)
        run_pipeline(source_id, user_id, pages)
    except Exception as e:
        mark_error(source_id, str(e))

def run_pipeline(source_id, user_id, pages):
    supabase = get_supabase_client()
    chunks = TextChunker().chunk_pages(pages)
    embeddings = EmbeddingService().embed_texts([c["content"] for c in chunks])
    
    rows = [{"source_id": source_id, "user_id": user_id, "content": c["content"], "chunk_index": c["chunk_index"], "page_number": c.get("page_number"), "embedding": e, "metadata": c.get("metadata", {})} for c, e in zip(chunks, embeddings)]
    
    for i in range(0, len(rows), 50):
        supabase.table("chunks").insert(rows[i:i+50]).execute()
        
    supabase.table("sources").update({"status": "ready"}).eq("id", source_id).execute()

def mark_error(source_id, error):
    traceback.print_exc()
    get_supabase_client().table("sources").update({"status": "error", "metadata": {"error": str(error)}}).eq("id", source_id).execute()
