import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.llm import LLMService
from app.utils.supabase import get_supabase_client

router = APIRouter(prefix="/api", tags=["Generation"])

class GenerateRequest(BaseModel):
    source_id: str
    user_id: str
    material_type: str

def get_summary_prompt(content: str) -> str:
    return f"""Analyze the following study material and generate a structured summary.
Return valid JSON:
{{
    "title": "Title",
    "overview": "2-3 sentence overview",
    "key_concepts": [{{"concept": "Name", "explanation": "Explanation"}}],
    "sections": [{{"heading": "Heading", "content": "Content", "key_points": ["Point 1"]}}],
    "conclusion": "Conclusion"
}}
Generate 3+ key concepts and 2-3 sections. Be concise but thorough.

MATERIAL:
{content}"""

def get_flashcards_prompt(content: str) -> str:
    return f"""Create 10 educational flashcards from this material.
Return valid JSON:
{{
    "flashcards": [{{"front": "Question", "back": "Answer", "difficulty": "easy"}}]
}}
Difficulty: "easy", "medium", or "hard". Cover different topics.

MATERIAL:
{content}"""

def get_quiz_prompt(content: str) -> str:
    return f"""Create 8 multiple choice questions from this material.
Return valid JSON:
{{
    "questions": [{{"question": "Question", "type": "multiple_choice", "options": ["A) Opt1", "B) Opt2", "C) Opt3", "D) Opt4"], "correct_answer": "A", "explanation": "Why"}}]
}}
correct_answer must be "A", "B", "C", or "D". Vary difficulty.

MATERIAL:
{content}"""

PROMPT_BUILDERS = {"summary": get_summary_prompt, "flashcards": get_flashcards_prompt, "quiz": get_quiz_prompt}

@router.post("/generate")
async def generate_material(request: GenerateRequest):
    if request.material_type not in PROMPT_BUILDERS:
        raise HTTPException(status_code=400, detail="Invalid type. Use: summary, flashcards, quiz")

    supabase = get_supabase_client()

    try:
        source_result = supabase.table("sources").select("id, status, title").eq("id", request.source_id).single().execute()
    except Exception:
        raise HTTPException(status_code=404, detail="Source not found")

    if not source_result.data or source_result.data["status"] != "ready":
        raise HTTPException(status_code=400, detail="Source not found or not ready")

    # Check cache
    try:
        existing = supabase.table("study_materials").select("*").eq("source_id", request.source_id).eq("user_id", request.user_id).eq("material_type", request.material_type).execute()
        if existing.data and len(existing.data) > 0:
            return {"material_type": request.material_type, "content": existing.data[0]["content"], "id": existing.data[0]["id"], "cached": True}
    except Exception:
        pass

    # Fetch chunks — LIMIT to 30 most important chunks instead of all 473
    chunks_result = supabase.table("chunks").select("content, chunk_index").eq("source_id", request.source_id).order("chunk_index", desc=False).limit(30).execute()

    if not chunks_result.data:
        raise HTTPException(status_code=400, detail="No content found")

    # Use only 8000 chars to speed up generation
    full_content = "\n\n".join([c["content"] for c in chunks_result.data])
    if len(full_content) > 8000:
        full_content = full_content[:8000] + "\n\n[Content truncated for processing]"

    prompt = PROMPT_BUILDERS[request.material_type](full_content)

    try:
        llm = LLMService()
        result = llm.generate_json(prompt)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Generation failed. Try again.")

    try:
        saved = supabase.table("study_materials").insert({"source_id": request.source_id, "user_id": request.user_id, "material_type": request.material_type, "content": result}).execute()
        return {"material_type": request.material_type, "content": result, "id": saved.data[0]["id"] if saved.data else None, "cached": False}
    except Exception:
        return {"material_type": request.material_type, "content": result, "id": None, "cached": False}

@router.get("/materials/{source_id}")
async def get_materials(source_id: str, user_id: str):
    supabase = get_supabase_client()
    result = supabase.table("study_materials").select("*").eq("source_id", source_id).eq("user_id", user_id).execute()
    return result.data or []
