import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Upload, FileText, Youtube } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { UploadDialog } from "@/components/upload-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { DeleteSourceButton } from "@/components/delete-source-button";
import { DashboardSearch } from "./dashboard-search";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const searchQuery = params.q || "";
  const typeFilter = params.type || "all";

  // Build query
  let query = supabase
    .from("sources")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply search filter
  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  // Apply type filter
  if (typeFilter && typeFilter !== "all") {
    query = query.eq("source_type", typeFilter);
  }

  const { data: sources } = await query;

  // Get counts for filter badges
  const { data: allSources } = await supabase
    .from("sources")
    .select("source_type");

  const counts = {
    all: allSources?.length || 0,
    pdf: allSources?.filter((s) => s.source_type === "pdf").length || 0,
    pptx: allSources?.filter((s) => s.source_type === "pptx").length || 0,
    docx: allSources?.filter((s) => s.source_type === "docx").length || 0,
    youtube: allSources?.filter((s) => s.source_type === "youtube").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI-Tutor</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Library</h1>
            <p className="text-muted-foreground mt-1">
              {counts.all} source{counts.all !== 1 ? "s" : ""} uploaded
            </p>
          </div>
          <UploadDialog userId={user.id} />
        </div>

        {/* Search and Filters */}
        <DashboardSearch
          currentQuery={searchQuery}
          currentType={typeFilter}
          counts={counts}
        />

        {/* Content Grid */}
        {sources && sources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {sources.map((source) => (
              <Link
                key={source.id}
                href={
                  source.status === "ready" ? `/source/${source.id}` : "#"
                }
                className={
                  source.status !== "ready"
                    ? "pointer-events-none opacity-60"
                    : ""
                }
              >
                <Card className="hover:shadow-md transition-all cursor-pointer h-full group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {source.source_type === "youtube" ? (
                          <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2 flex-shrink-0">
                            <Youtube className="h-4 w-4 text-red-500" />
                          </div>
                        ) : (
                          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2 flex-shrink-0">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold line-clamp-2 text-sm group-hover:text-primary transition-colors">
                            {source.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {source.source_type.toUpperCase()} •{" "}
                            {new Date(source.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Delete Button + Status */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <DeleteSourceButton
                          sourceId={source.id}
                          userId={user.id}
                          sourceTitle={source.title}
                        />
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            source.status === "ready"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : source.status === "processing"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              : source.status === "error"
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                          }`}
                        >
                          {source.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 mt-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-6">
                <Upload className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No results found" : "No content yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery
                ? `No sources matching "${searchQuery}". Try a different search.`
                : "Upload a PDF, PowerPoint, Word document, or paste a YouTube URL to get started."}
            </p>
            {!searchQuery && <UploadDialog userId={user.id} />}
          </div>
        )}
      </main>
    </div>
  );
}
