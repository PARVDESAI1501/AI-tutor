import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, FileText, Clock, ArrowRight } from "lucide-react";

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get conversations with source info
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, sources(title, source_type)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Get recent messages count per conversation
  const { data: messageCounts } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", (conversations || []).map(c => c.id));

  const countMap: Record<string, number> = {};
  messageCounts?.forEach(m => {
    countMap[m.conversation_id] = (countMap[m.conversation_id] || 0) + 1;
  });

  // Get study materials
  const { data: materials } = await supabase
    .from("study_materials")
    .select("*, sources(title, source_type)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground mt-1">Your past conversations and generated materials</p>
        </div>

        {/* Chat History */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Chat Conversations
          </h2>
          {conversations && conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <Link key={conv.id} href={`/source/${conv.source_id}`}>
                  <Card className="hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{conv.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(conv.sources as any)?.title || "Unknown source"} • {countMap[conv.id] || 0} messages
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(conv.updated_at).toLocaleDateString()}
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No conversations yet. Start chatting with your documents!</CardContent></Card>
          )}
        </div>

        {/* Generated Materials */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generated Materials
          </h2>
          {materials && materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {materials.map((mat) => {
                const typeLabels: Record<string, string> = { summary: "📝 Summary", flashcards: "🃏 Flashcards", quiz: "❓ Quiz" };
                const typeColors: Record<string, string> = { summary: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300", flashcards: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300", quiz: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" };
                return (
                  <Link key={mat.id} href={`/source/${mat.source_id}`}>
                    <Card className="hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[mat.material_type] || ""}`}>
                            {typeLabels[mat.material_type] || mat.material_type}
                          </span>
                          <p className="text-sm font-medium mt-2">{(mat.sources as any)?.title || "Unknown"}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(mat.created_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No materials generated yet. Try generating summaries, flashcards, or quizzes!</CardContent></Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
