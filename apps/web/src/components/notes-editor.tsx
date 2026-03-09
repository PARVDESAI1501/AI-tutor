"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

export function NotesEditor({ sourceId, userId }: { sourceId: string, userId: string }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadNote = async () => {
      const { data } = await supabase.from("notes").select("content").eq("source_id", sourceId).eq("user_id", userId).single();
      if (data) setContent(data.content);
      setLoading(false);
    };
    loadNote();
  }, [sourceId, userId, supabase]);

  const handleSave = async (value: string) => {
    setContent(value);
    setSaving(true);
    
    await supabase.from("notes").upsert(
      { source_id: sourceId, user_id: userId, content: value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,source_id" }
    );
    
    setTimeout(() => setSaving(false), 500);
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full relative">
      <Textarea
        className="flex-1 resize-none border-0 focus-visible:ring-0 p-6 text-base leading-relaxed h-full bg-background"
        placeholder="Start typing your notes here..."
        value={content}
        onChange={(e) => handleSave(e.target.value)}
      />
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-1 rounded-full border border-border/50 flex items-center gap-2">
        {saving ? <><Loader2 className="h-3 w-3 animate-spin"/> Saving...</> : <><Save className="h-3 w-3"/> Saved</>}
      </div>
    </div>
  );
}
