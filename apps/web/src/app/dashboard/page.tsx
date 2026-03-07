import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Upload, FileText, Youtube } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's sources
  const { data: sources } = await supabase
    .from("sources")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI-Tutor</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Library</h1>
            <p className="text-muted-foreground mt-1">
              Upload documents or YouTube videos to start learning
            </p>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Content
          </Button>
        </div>

        {/* Content Grid */}
        {sources && sources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map((source) => (
              <Card
                key={source.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    {source.source_type === "youtube" ? (
                      <Youtube className="h-5 w-5 text-red-500 mt-0.5" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                    )}
                    <div>
                      <h3 className="font-semibold line-clamp-2">
                        {source.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {source.source_type.toUpperCase()} •{" "}
                        {new Date(source.created_at).toLocaleDateString()}
                      </p>
                      <span
                        className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                          source.status === "ready"
                            ? "bg-green-100 text-green-700"
                            : source.status === "processing"
                              ? "bg-yellow-100 text-yellow-700"
                              : source.status === "error"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {source.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-6">
                <Upload className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">No content yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upload a PDF, PowerPoint, Word document, or paste a YouTube URL to
              get started with AI-powered learning.
            </p>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Your First Document
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
