import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Youtube, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import { UploadDialog } from "@/components/upload-dialog";
import { DeleteSourceButton } from "@/components/delete-source-button";
import { AppLayout } from "@/components/app-layout";
import { DashboardSearch } from "./dashboard-search";

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

  const counts = {
    all: allSources?.length || 0,
    pdf: allSources?.filter((s) => s.source_type === "pdf").length || 0,
    pptx: allSources?.filter((s) => s.source_type === "pptx").length || 0,
    docx: allSources?.filter((s) => s.source_type === "docx").length || 0,
    youtube: allSources?.filter((s) => s.source_type === "youtube").length || 0,
  };

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hi, {firstName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              {counts.all === 0
                ? "Upload your first document to start learning"
                : `You have ${counts.all} source${counts.all !== 1 ? "s" : ""} ready to study`}
            </p>
          </div>
          <UploadDialog userId={user.id} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-2.5">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts.all}</p>
                <p className="text-xs text-muted-foreground">Sources</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-green-100 dark:bg-green-900/30 p-2.5">
                <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{chatCount || 0}</p>
                <p className="text-xs text-muted-foreground">Conversations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-purple-100 dark:bg-purple-900/30 p-2.5">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{materialCount || 0}</p>
                <p className="text-xs text-muted-foreground">Study Materials</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <DashboardSearch currentQuery={searchQuery} currentType={typeFilter} counts={counts} />

        {/* Source Cards */}
        {sources && sources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {sources.map((source) => {
              const isReady = source.status === "ready";
              const cardContent = (
                <Card className={`transition-all duration-200 h-full group border ${isReady ? "cursor-pointer hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5" : "opacity-70"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {source.source_type === "youtube" ? (
                          <div className="rounded-xl bg-red-100 dark:bg-red-900/30 p-2.5 flex-shrink-0">
                            <Youtube className="h-5 w-5 text-red-500" />
                          </div>
                        ) : (
                          <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-2.5 flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold line-clamp-2 text-sm group-hover:text-primary transition-colors">
                            {source.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {source.source_type.toUpperCase()} • {new Date(source.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <DeleteSourceButton sourceId={source.id} userId={user.id} sourceTitle={source.title} />
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          source.status === "ready" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : source.status === "processing" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : source.status === "error" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}>
                          {source.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              if (isReady) return <Link key={source.id} href={`/source/${source.id}`}>{cardContent}</Link>;
              return <div key={source.id}>{cardContent}</div>;
            })}
          </div>
        ) : (
          <div className="text-center py-20 mt-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl bg-primary/10 p-6">
                <Upload className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No results found" : "Start learning"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery
                ? `Nothing matches "${searchQuery}". Try different words.`
                : "Upload a document or paste a YouTube link to begin."}
            </p>
            {!searchQuery && <UploadDialog userId={user.id} />}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
