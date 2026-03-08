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
    return f"""Analyze the following study material and generate a comprehensive structured summary.

Return valid JSON with EXACTLY this structure:
{{
    "title": "A descriptive title for the summary",
    "overview": "2-3 sentence overview of the entire material",
    "key_concepts": [
        {{"concept": "Concept name", "explanation": "Clear explanation of the concept"}}
    ],
    "sections": [
        {{
            "heading": "Section heading",
            "content": "Detailed content for this section",
            "key_points": ["Important point 1", "Important point 2"]
        }}
    ],
    "conclusion": "A brief concluding summary"
}}

Generate at least 3 key concepts and 2-4 sections. Be thorough and educational.

MATERIAL:
{content}"""


def get_flashcards_prompt(content: str) -> str:
    return f"""Create educational flashcards from the following material.
Generate 10-15 flashcards covering all the key concepts, terms, and important details.

Return valid JSON with EXACTLY this structure:
{{
    "flashcards": [
        {{
            "front": "Question or term (clear and specific)",
            "back": "Answer or definition (comprehensive but concise)",
            "difficulty": "easy"
        }}
    ]
}}

The "difficulty" field must be one of: "easy", "medium", "hard".
Make sure flashcards cover different aspects of the material.

MATERIAL:
{content}"""


def get_quiz_prompt(content: str) -> str:
    return f"""Create a quiz from the following material.
Generate 10 questions of varying difficulty levels.

Return valid JSON with EXACTLY this structure:
{{
    "questions": [
        {{
            "question": "Clear, specific question text",
            "type": "multiple_choice",
            "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
            "correct_answer": "A",
            "explanation": "Why this answer is correct"
        }}
    ]
}}

Rules:
- The "correct_answer" must be just the letter: "A", "B", "C", or "D"
- Every option must start with the letter: "A) ...", "B) ...", "C) ...", "D) ..."
- Include questions of varying difficulty

MATERIAL:
{content}"""


PROMPT_BUILDERS = {
    "summary": get_summary_prompt,
    "flashcards": get_flashcards_prompt,
    "quiz": get_quiz_prompt,
}


@router.post("/generate")
async def generate_material(request: GenerateRequest):
    """Generate study material (summary, flashcards, or quiz) from a source."""

    print(f"[Generate] Received request: type={request.material_type}, source={request.source_id}")

    if request.material_type not in PROMPT_BUILDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid material type: {request.material_type}. Must be: summary, flashcards, quiz",
        )

    supabase = get_supabase_client()

    # Verify source exists and is ready
    try:
        source_result = (
            supabase.table("sources")
            .select("id, status, title")
            .eq("id", request.source_id)
            .single()
            .execute()
        )
    except Exception as e:
        print(f"[Generate] Error fetching source: {e}")
        raise HTTPException(status_code=404, detail="Source not found")

    if not source_result.data:
        raise HTTPException(status_code=404, detail="Source not found")

    if source_result.data["status"] != "ready":
        raise HTTPException(status_code=400, detail="Source is not ready yet")

    print(f"[Generate] Source found: {source_result.data['title']}")

    # Check if material already exists (cache)
    try:
        existing = (
            supabase.table("study_materials")
            .select("*")
            .eq("source_id", request.source_id)
            .eq("user_id", request.user_id)
            .eq("material_type", request.material_type)
            .execute()
        )

        if existing.data and len(existing.data) > 0:
            print(f"[Generate] Returning cached {request.material_type}")
            return {
                "material_type": request.material_type,
                "content": existing.data[0]["content"],
                "id": existing.data[0]["id"],
                "cached": True,
            }
    except Exception as e:
        print(f"[Generate] Cache check failed (non-critical): {e}")

    # Fetch all chunks for this source
    try:
        chunks_result = (
            supabase.table("chunks")
            .select("content, chunk_index")
            .eq("source_id", request.source_id)
            .order("chunk_index", desc=False)
            .execute()
        )
    except Exception as e:
        print(f"[Generate] Error fetching chunks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch content: {e}")

    if not chunks_result.data:
        raise HTTPException(status_code=400, detail="No content found for this source")

    print(f"[Generate] Found {len(chunks_result.data)} chunks")

    # Combine chunks (limit to ~15000 chars)
    full_content = "\n\n".join([c["content"] for c in chunks_result.data])
    if len(full_content) > 15000:
        full_content = full_content[:15000] + "\n\n[Content truncated]"

    print(f"[Generate] Content length: {len(full_content)} chars")

    # Build prompt using the function (avoids curly brace issues)
    prompt = PROMPT_BUILDERS[request.material_type](full_content)

    # Generate with LLM
    print(f"[Generate] Calling LLM for {request.material_type}...")

    try:
        llm = LLMService()
        result = llm.generate_json(prompt)
        print(f"[Generate] LLM returned successfully")
    except Exception as e:
        print(f"[Generate] LLM error: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate {request.material_type}. Please try again.",
        )

    # Save to database
    try:
        saved = (
            supabase.table("study_materials")
            .insert({
                "source_id": request.source_id,
                "user_id": request.user_id,
                "material_type": request.material_type,
                "content": result,
            })
            .execute()
        )
        print(f"[Generate] ✅ {request.material_type} saved to database")
    except Exception as e:
        print(f"[Generate] Warning: Failed to cache result: {e}")
        return {
            "material_type": request.material_type,
            "content": result,
            "id": None,
            "cached": False,
        }

    return {
        "material_type": request.material_type,
        "content": result,
        "id": saved.data[0]["id"] if saved.data else None,
        "cached": False,
    }


@router.get("/materials/{source_id}")
async def get_materials(source_id: str, user_id: str):
    """Get all generated study materials for a source."""

    supabase = get_supabase_client()

    result = (
        supabase.table("study_materials")
        .select("*")
        .eq("source_id", source_id)
        .eq("user_id", user_id)
        .execute()
    )

    return result.data or []
