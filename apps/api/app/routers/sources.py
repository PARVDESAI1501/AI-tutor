from fastapi import APIRouter, HTTPException
from app.utils.supabase import get_supabase_client

router = APIRouter(prefix="/api", tags=["Sources"])


@router.delete("/source/{source_id}")
async def delete_source(source_id: str, user_id: str):
    """Delete a source and all associated data (chunks, conversations, messages, study materials)."""

    supabase = get_supabase_client()

    # Verify source exists and belongs to user
    source_result = (
        supabase.table("sources")
        .select("id, user_id, file_path, source_type")
        .eq("id", source_id)
        .single()
        .execute()
    )

    if not source_result.data:
        raise HTTPException(status_code=404, detail="Source not found")

    if source_result.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this source")

    print(f"[Delete] Deleting source {source_id}...")

    # Delete file from storage (if it exists)
    if source_result.data.get("file_path"):
        try:
            supabase.storage.from_("documents").remove([source_result.data["file_path"]])
            print(f"[Delete] Removed file from storage")
        except Exception as e:
            print(f"[Delete] Warning: Could not remove file from storage: {e}")

    # Delete study materials
    try:
        supabase.table("study_materials").delete().eq("source_id", source_id).execute()
        print(f"[Delete] Removed study materials")
    except Exception as e:
        print(f"[Delete] Warning: study_materials delete: {e}")

    # Delete messages (via conversations)
    try:
        convs = (
            supabase.table("conversations")
            .select("id")
            .eq("source_id", source_id)
            .execute()
        )
        if convs.data:
            for conv in convs.data:
                supabase.table("messages").delete().eq("conversation_id", conv["id"]).execute()
        print(f"[Delete] Removed messages")
    except Exception as e:
        print(f"[Delete] Warning: messages delete: {e}")

    # Delete conversations
    try:
        supabase.table("conversations").delete().eq("source_id", source_id).execute()
        print(f"[Delete] Removed conversations")
    except Exception as e:
        print(f"[Delete] Warning: conversations delete: {e}")

    # Delete chunks
    try:
        supabase.table("chunks").delete().eq("source_id", source_id).execute()
        print(f"[Delete] Removed chunks")
    except Exception as e:
        print(f"[Delete] Warning: chunks delete: {e}")

    # Delete the source itself
    try:
        supabase.table("sources").delete().eq("id", source_id).execute()
        print(f"[Delete] ✅ Source deleted successfully")
    except Exception as e:
        print(f"[Delete] Error deleting source: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete source: {e}")

    return {"status": "deleted", "source_id": source_id}
