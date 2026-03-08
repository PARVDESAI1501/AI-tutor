import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SourceDetailClient } from "./source-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SourcePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: source } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .single();

  if (!source) {
    redirect("/dashboard");
  }

  const { data: chunks } = await supabase
    .from("chunks")
    .select("content, page_number, chunk_index")
    .eq("source_id", id)
    .order("chunk_index", { ascending: true });

  return (
    <SourceDetailClient
      source={source}
      chunks={chunks || []}
      userId={user.id}
    />
  );
}
