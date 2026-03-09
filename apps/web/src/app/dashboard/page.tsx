import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/app-layout";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const searchQuery = params.q || "";
  const typeFilter = params.type || "all";

  let query = supabase.from("sources").select("*").order("created_at", { ascending: false });
  if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);
  if (typeFilter && typeFilter !== "all") query = query.eq("source_type", typeFilter);
  const { data: sources } = await query;

  const { data: allSources } = await supabase.from("sources").select("source_type");
  const { count: chatCount } = await supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const { count: materialCount } = await supabase.from("study_materials").select("id", { count: "exact", head: true }).eq("user_id", user.id);

  // Added the missing 'audio' and 'web' counts for the new features!
  const counts = {
    all: allSources?.length || 0,
    pdf: allSources?.filter((s) => s.source_type === "pdf").length || 0,
    pptx: allSources?.filter((s) => s.source_type === "pptx").length || 0,
    docx: allSources?.filter((s) => s.source_type === "docx").length || 0,
    youtube: allSources?.filter((s) => s.source_type === "youtube").length || 0,
    audio: allSources?.filter((s) => ["audio", "video", "record"].includes(s.source_type)).length || 0,
    web: allSources?.filter((s) => ["web", "text"].includes(s.source_type)).length || 0,
  };

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";

  return (
    <AppLayout>
      <DashboardClient
        sources={sources || []}
        counts={counts}
        chatCount={chatCount || 0}
        materialCount={materialCount || 0}
        firstName={firstName}
        userId={user.id}
        searchQuery={searchQuery}
        typeFilter={typeFilter}
      />
    </AppLayout>
  );
}
