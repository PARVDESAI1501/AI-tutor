import traceback
import json
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
Return valid JSON ONLY (no markdown fences):
{{
    "title": "Title",
    "overview": "2-3 sentence overview",
    "key_concepts": [{{"concept": "Name", "explanation": "Explanation"}}],
    "sections": [{{"heading": "Heading", "content": "Content", "key_points": ["Point 1"]}}],
    "conclusion": "Conclusion"
}}
MATERIAL:\n{content}"""

def get_flashcards_prompt(content: str) -> str:
    return f"""Create 10 educational flashcards from this material.
Return valid JSON ONLY (no markdown fences):
{{
    "flashcards": [{{"front": "Question", "back": "Answer", "difficulty": "easy"}}]
}}
MATERIAL:\n{content}"""

def get_quiz_prompt(content: str) -> str:
    return f"""Create 8 multiple choice questions from this material.
Return valid JSON ONLY (no markdown fences):
{{
    "questions": [{{"question": "Question", "type": "multiple_choice", "options": ["A) Opt1", "B) Opt2", "C) Opt3", "D) Opt4"], "correct_answer": "A", "explanation": "Why"}}]
}}
MATERIAL:\n{content}"""

def get_podcast_prompt(content: str) -> str:
    return f"""Create a lively 2-person podcast script discussing this material.
Hosts: "Alex" (Explainative) and "Sam" (Curious/Host).
Style: Conversational, engaging, like a real radio show. Use "Um", "Exactly", "Wow".
Length: 10 exchanges.
Return valid JSON ONLY (no markdown fences):
{{
    "title": "Podcast Title",
    "script": [
        {{"speaker": "Sam", "text": "Welcome back! Today we're diving into..."}},
        {{"speaker": "Alex", "text": "Thanks Sam! This is a fascinating topic because..."}}
    ]
}}
MATERIAL:\n{content}"""

PROMPT_BUILDERS = {
    "summary": get_summary_prompt,
    "flashcards": get_flashcards_prompt,
    "quiz": get_quiz_prompt,
    "podcast": get_podcast_prompt
}

@router.post("/generate")
async def generate_material(request: GenerateRequest):
    if request.material_type not in PROMPT_BUILDERS:
        raise HTTPException(status_code=400, detail="Invalid type")

    supabase = get_supabase_client()

    # Check cache first
    try:
        existing = supabase.table("study_materials").select("*").eq("source_id", request.source_id).eq("material_type", request.material_type).execute()
        if existing.data:
            return {"content": existing.data[0]["content"], "cached": True}
    except Exception: pass

    # Fetch chunks (limit to top 20 to speed up generation)
    chunks = supabase.table("chunks").select("content").eq("source_id", request.source_id).order("chunk_index").limit(20).execute()
    if not chunks.data: raise HTTPException(status_code=400, detail="No content")

    full_content = "\n".join([c["content"] for c in chunks.data])[:8000]
    prompt = PROMPT_BUILDERS[request.material_type](full_content)

    try:
        # Generate raw JSON response
        result = LLMService().generate_json(prompt)
        
        # Save to DB
        supabase.table("study_materials").insert({"source_id": request.source_id, "user_id": request.user_id, "material_type": request.material_type, "content": result}).execute()
        return {"content": result, "cached": False}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Generation failed. The AI timed out or returned invalid format. Try again.")
