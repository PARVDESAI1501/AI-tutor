from fastapi import APIRouter, HTTPException
from app.utils.supabase import get_supabase_client

router = APIRouter(prefix="/api", tags=["Sources"])


@router.delete("/source/{source_id}")
async def delete_source(source_id: str, user_id: str):
    """Delete a source and all associated data."""

    supabase = get_supabase_client()

    # Verify source exists
    try:
        source_result = (
            supabase.table("sources")
            .select("id, user_id, file_path, source_type")
            .eq("id", source_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Source not found")

    if not source_result.data:
        raise HTTPException(status_code=404, detail="Source not found")

    if source_result.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    print(f"[Delete] Deleting source {source_id}...")

    # Delete file from storage
    if source_result.data.get("file_path"):
        try:
            supabase.storage.from_("documents").remove(
                [source_result.data["file_path"]]
            )
            print("[Delete] Removed file from storage")
        except Exception as e:
            print(f"[Delete] Storage delete skipped: {e}")

    # Delete study materials (ignore errors)
    try:
        supabase.table("study_materials").delete().eq("source_id", source_id).execute()
    except Exception:
        pass

    # Delete messages via conversations (ignore errors)
    try:
        convs = (
            supabase.table("conversations")
            .select("id")
            .eq("source_id", source_id)
            .execute()
        )
        if convs.data:
            for conv in convs.data:
                try:
                    supabase.table("messages").delete().eq(
                        "conversation_id", conv["id"]
                    ).execute()
                except Exception:
                    pass
    except Exception:
        pass

    # Delete conversations (ignore errors)
    try:
        supabase.table("conversations").delete().eq("source_id", source_id).execute()
    except Exception:
        pass

    # Delete chunks (ignore errors)
    try:
        supabase.table("chunks").delete().eq("source_id", source_id).execute()
    except Exception:
        pass

    # Delete the source itself
    try:
        supabase.table("sources").delete().eq("id", source_id).execute()
        print("[Delete] ✅ Source deleted successfully")
    except Exception as e:
        print(f"[Delete] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete: {e}")

    return {"status": "deleted", "source_id": source_id}
