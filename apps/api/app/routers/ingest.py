import traceback
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Form, HTTPException
from app.models.schemas import (
    IngestResponse,
    YouTubeIngestRequest,
    YouTubeIngestResponse,
    SourceStatusResponse,
)
from app.services.parser import DocumentParser
from app.services.chunker import TextChunker
from app.services.embedder import EmbeddingService
from app.utils.supabase import get_supabase_client

router = APIRouter(prefix="/api", tags=["Ingestion"])


# ─────────────────────────────────────────────────────
# ENDPOINT: Upload a file (PDF, PPTX, DOCX)
# ─────────────────────────────────────────────────────
@router.post("/upload", response_model=IngestResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Form(...),
    title: str = Form(...),
):
    """Upload a document file and trigger async ingestion."""

    # Validate file type
    allowed_types = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    }

    # Also check by file extension as fallback
    extension_map = {
        ".pdf": "pdf",
        ".pptx": "pptx",
        ".docx": "docx",
    }

    # Determine file type
    source_type = None
    if file.content_type in allowed_types:
        source_type = allowed_types[file.content_type]
    else:
        for ext, stype in extension_map.items():
            if file.filename and file.filename.lower().endswith(ext):
                source_type = stype
                break

    if not source_type:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, PPTX, DOCX",
        )

    # Read file bytes
    file_bytes = await file.read()

    # Validate file size (max 10MB)
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail="File too large. Maximum size is 10MB."
        )

    supabase = get_supabase_client()

    # Upload file to Supabase Storage
    file_path = f"{user_id}/{file.filename}"
    try:
        supabase.storage.from_("documents").upload(
            path=file_path,
            file=file_bytes,
            file_options={
                "content-type": file.content_type or "application/octet-stream"
            },
        )
    except Exception as e:
        # If file already exists, remove and re-upload
        if "Duplicate" in str(e) or "already exists" in str(e):
            supabase.storage.from_("documents").remove([file_path])
            supabase.storage.from_("documents").upload(
                path=file_path,
                file=file_bytes,
                file_options={
                    "content-type": file.content_type or "application/octet-stream"
                },
            )
        else:
            raise HTTPException(
                status_code=500, detail=f"Storage upload failed: {str(e)}"
            )

    # Create source record in database
    source_data = {
        "user_id": user_id,
        "title": title,
        "source_type": source_type,
        "file_path": file_path,
        "status": "processing",
    }
    result = supabase.table("sources").insert(source_data).execute()
    source_id = result.data[0]["id"]

    # Trigger background processing
    background_tasks.add_task(
        process_file,
        source_id=source_id,
        user_id=user_id,
        file_bytes=file_bytes,
        source_type=source_type,
    )

    return IngestResponse(
        status="processing",
        source_id=source_id,
        message=f"File '{title}' uploaded. Processing started.",
    )


# ─────────────────────────────────────────────────────
# ENDPOINT: Ingest a YouTube URL
# ─────────────────────────────────────────────────────
@router.post("/youtube", response_model=YouTubeIngestResponse)
async def ingest_youtube(
    request: YouTubeIngestRequest,
    background_tasks: BackgroundTasks,
):
    """Ingest a YouTube video by URL."""

    supabase = get_supabase_client()
    parser = DocumentParser()

    # Validate URL by extracting video ID
    try:
        parser._extract_video_id(request.url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    # Use provided title or generate from URL
    title = request.title or parser.get_youtube_title(request.url)

    # Create source record
    source_data = {
        "user_id": request.user_id,
        "title": title,
        "source_type": "youtube",
        "youtube_url": request.url,
        "status": "processing",
    }
    result = supabase.table("sources").insert(source_data).execute()
    source_id = result.data[0]["id"]

    # Trigger background processing
    background_tasks.add_task(
        process_youtube,
        source_id=source_id,
        user_id=request.user_id,
        url=request.url,
    )

    return YouTubeIngestResponse(
        source_id=source_id,
        status="processing",
        message=f"YouTube video '{title}' ingestion started.",
    )


# ─────────────────────────────────────────────────────
# ENDPOINT: Check source processing status
# ─────────────────────────────────────────────────────
@router.get("/source/{source_id}/status", response_model=SourceStatusResponse)
async def get_source_status(source_id: str):
    """Check the processing status of a source."""

    supabase = get_supabase_client()

    # Get source
    result = (
        supabase.table("sources").select("*").eq("id", source_id).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Source not found")

    # Count chunks
    chunks_result = (
        supabase.table("chunks")
        .select("id", count="exact")
        .eq("source_id", source_id)
        .execute()
    )

    error_msg = None
    if result.data.get("metadata") and isinstance(result.data["metadata"], dict):
        error_msg = result.data["metadata"].get("error")

    return SourceStatusResponse(
        source_id=source_id,
        status=result.data["status"],
        chunk_count=chunks_result.count or 0,
        error=error_msg,
    )


# ─────────────────────────────────────────────────────
# BACKGROUND TASKS
# ─────────────────────────────────────────────────────
def process_file(
    source_id: str,
    user_id: str,
    file_bytes: bytes,
    source_type: str,
):
    """Background task: parse file → chunk → embed → store."""

    supabase = get_supabase_client()

    try:
        parser = DocumentParser()
        chunker = TextChunker()
        embedder = EmbeddingService()

        # 1. PARSE — extract text from file
        print(f"[{source_id}] Step 1/4: Parsing {source_type} file...")
        parse_method = getattr(parser, f"parse_{source_type}")
        pages = parse_method(file_bytes)

        if not pages:
            raise ValueError("No text content could be extracted from the file.")

        print(f"[{source_id}] Extracted {len(pages)} pages/sections")

        # 2. CHUNK — split into smaller pieces
        print(f"[{source_id}] Step 2/4: Chunking text...")
        chunks = chunker.chunk_pages(pages)

        if not chunks:
            raise ValueError("No chunks could be created from the extracted text.")

        print(f"[{source_id}] Created {len(chunks)} chunks")

        # 3. EMBED — generate vector embeddings
        print(f"[{source_id}] Step 3/4: Generating embeddings...")
        texts = [c["content"] for c in chunks]
        embeddings = embedder.embed_texts(texts)
        print(f"[{source_id}] Generated {len(embeddings)} embeddings")

        # 4. STORE — save chunks + embeddings to database
        print(f"[{source_id}] Step 4/4: Storing in database...")
        store_chunks(supabase, source_id, user_id, chunks, embeddings)

        # Update source status to ready
        supabase.table("sources").update({"status": "ready"}).eq(
            "id", source_id
        ).execute()
        print(f"[{source_id}] ✅ Processing complete!")

    except Exception as e:
        print(f"[{source_id}] ❌ Error: {str(e)}")
        traceback.print_exc()
        supabase.table("sources").update(
            {
                "status": "error",
                "metadata": {"error": str(e)},
            }
        ).eq("id", source_id).execute()


def process_youtube(source_id: str, user_id: str, url: str):
    """Background task: parse YouTube transcript → chunk → embed → store."""

    supabase = get_supabase_client()

    try:
        parser = DocumentParser()
        chunker = TextChunker()
        embedder = EmbeddingService()

        # 1. PARSE
        print(f"[{source_id}] Step 1/4: Fetching YouTube transcript...")
        pages = parser.parse_youtube(url)

        if not pages:
            raise ValueError(
                "No transcript found for this video. "
                "The video may not have captions/subtitles."
            )

        print(f"[{source_id}] Extracted {len(pages)} transcript segments")

        # 2. CHUNK
        print(f"[{source_id}] Step 2/4: Chunking text...")
        chunks = chunker.chunk_pages(pages)
        print(f"[{source_id}] Created {len(chunks)} chunks")

        # 3. EMBED
        print(f"[{source_id}] Step 3/4: Generating embeddings...")
        texts = [c["content"] for c in chunks]
        embeddings = embedder.embed_texts(texts)
        print(f"[{source_id}] Generated {len(embeddings)} embeddings")

        # 4. STORE
        print(f"[{source_id}] Step 4/4: Storing in database...")
        store_chunks(supabase, source_id, user_id, chunks, embeddings)

        # Update status
        supabase.table("sources").update({"status": "ready"}).eq(
            "id", source_id
        ).execute()
        print(f"[{source_id}] ✅ Processing complete!")

    except Exception as e:
        print(f"[{source_id}] ❌ Error: {str(e)}")
        traceback.print_exc()
        supabase.table("sources").update(
            {
                "status": "error",
                "metadata": {"error": str(e)},
            }
        ).eq("id", source_id).execute()


def store_chunks(
    supabase,
    source_id: str,
    user_id: str,
    chunks: list[dict],
    embeddings: list[list[float]],
):
    """Store chunks and their embeddings in Supabase in batches."""

    batch_size = 50  # Supabase handles batches well
    rows = []

    for chunk, embedding in zip(chunks, embeddings):
        rows.append(
            {
                "source_id": source_id,
                "user_id": user_id,
                "content": chunk["content"],
                "chunk_index": chunk["chunk_index"],
                "page_number": chunk.get("page_number"),
                "embedding": embedding,
                "metadata": chunk.get("metadata", {}),
            }
        )

    # Insert in batches
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        supabase.table("chunks").insert(batch).execute()

    print(f"  Stored {len(rows)} chunks in database")
