import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest
from app.services.rag import RAGService
from app.utils.supabase import get_supabase_client

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post("/chat")
async def chat(request: ChatRequest):
    """RAG-powered chat endpoint with Server-Sent Events streaming."""

    supabase = get_supabase_client()

    # Verify the source exists and is ready
    source_result = (
        supabase.table("sources")
        .select("id, status, title")
        .eq("id", request.source_id)
        .single()
        .execute()
    )

    if not source_result.data:
        raise HTTPException(status_code=404, detail="Source not found")

    if source_result.data["status"] != "ready":
        raise HTTPException(
            status_code=400,
            detail="Source is not ready yet. Please wait for processing to complete.",
        )

    # Verify chunks exist
    chunks_count = (
        supabase.table("chunks")
        .select("id", count="exact")
        .eq("source_id", request.source_id)
        .execute()
    )

    if not chunks_count.count or chunks_count.count == 0:
        raise HTTPException(
            status_code=400,
            detail="No content chunks found for this source.",
        )

    rag = RAGService()

    def event_stream():
        """Generate Server-Sent Events."""
        try:
            full_response = ""

            for token in rag.chat_stream(
                query=request.message,
                source_id=request.source_id,
                user_id=request.user_id,
                conversation_history=request.history,
                supabase=supabase,
            ):
                full_response += token
                # Send each token as an SSE event
                data = json.dumps({"token": token})
                yield f"data: {data}\n\n"

            # Send completion signal
            yield "data: [DONE]\n\n"

            # Save messages to database if conversation_id exists
            if request.conversation_id:
                try:
                    # Extract the actual response (without source citations)
                    clean_response = full_response
                    sources_data = []

                    if "<!--SOURCES:" in full_response:
                        parts = full_response.split("<!--SOURCES:")
                        clean_response = parts[0].strip()
                        sources_json = parts[1].replace("-->", "").strip()
                        sources_data = json.loads(sources_json)

                    # Save user message
                    supabase.table("messages").insert(
                        {
                            "conversation_id": request.conversation_id,
                            "role": "user",
                            "content": request.message,
                        }
                    ).execute()

                    # Save assistant message
                    supabase.table("messages").insert(
                        {
                            "conversation_id": request.conversation_id,
                            "role": "assistant",
                            "content": clean_response,
                            "sources": sources_data,
                        }
                    ).execute()

                    # Update conversation timestamp
                    supabase.table("conversations").update(
                        {
                            "updated_at": "now()",
                        }
                    ).eq("id", request.conversation_id).execute()

                except Exception as e:
                    print(f"[Chat] Failed to save messages: {e}")

        except Exception as e:
            error_data = json.dumps({"error": str(e)})
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/conversations")
async def create_conversation(
    source_id: str,
    user_id: str,
):
    """Create a new conversation for a source."""

    supabase = get_supabase_client()

    result = (
        supabase.table("conversations")
        .insert(
            {
                "source_id": source_id,
                "user_id": user_id,
                "title": "New Chat",
            }
        )
        .execute()
    )

    return result.data[0]


@router.get("/conversations/{source_id}")
async def get_conversations(source_id: str, user_id: str):
    """Get all conversations for a source."""

    supabase = get_supabase_client()

    result = (
        supabase.table("conversations")
        .select("*")
        .eq("source_id", source_id)
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )

    return result.data


@router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str):
    """Get all messages for a conversation."""

    supabase = get_supabase_client()

    result = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=True)
        .execute()
    )

    return result.data
