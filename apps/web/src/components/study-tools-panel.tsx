"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileText, Layers, HelpCircle, Loader2, AlertCircle, RefreshCw, Headphones, PenTool } from "lucide-react";

// LAZY LOAD HEAVY COMPONENTS
const ChatPanel = dynamic(() => import("@/components/chat-panel").then(m => m.ChatPanel), { loading: () => <Loader2 className="animate-spin m-auto mt-10" /> });
const NotesEditor = dynamic(() => import("@/components/notes-editor").then(m => m.NotesEditor));
const SummaryView = dynamic(() => import("@/components/summary-view").then(m => m.SummaryView));
const FlashcardViewer = dynamic(() => import("@/components/flashcard-viewer").then(m => m.FlashcardViewer), { ssr: false }); 
const QuizMode = dynamic(() => import("@/components/quiz-mode").then(m => m.QuizMode));
const AudioOverview = dynamic(() => import("@/components/audio-overview").then(m => m.AudioOverview), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function StudyToolsPanel({ sourceId, userId, sourceTitle }: any) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [summary, setSummary] = useState<any>({ loading: false, data: null, error: null });
  const [flashcards, setFlashcards] = useState<any>({ loading: false, data: null, error: null });
  const [quiz, setQuiz] = useState<any>({ loading: false, data: null, error: null });
  const [podcast, setPodcast] = useState<any>({ loading: false, data: null, error: null });

  useEffect(() => setMounted(true), []);

  const generate = async (type: string, setter: any) => {
    setter({ loading: true, data: null, error: null });
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: sourceId, user_id: userId, material_type: type }),
      });
      if (!res.ok) throw new Error("Failed to generate.");
      const result = await res.json();
      setter({ loading: false, data: result.content, error: null });
    } catch (e: any) { setter({ loading: false, data: null, error: e.message }); }
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === "summary" && !summary.data) generate("summary", setSummary);
    if (val === "flashcards" && !flashcards.data) generate("flashcards", setFlashcards);
    if (val === "quiz" && !quiz.data) generate("quiz", setQuiz);
    if (val === "podcast" && !podcast.data) generate("podcast", setPodcast);
  };

  const renderLoad = (t: string) => (<div className="flex flex-col items-center justify-center h-full p-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mb-4"/><p className="text-muted-foreground text-sm">Generating {t}... (Takes 15-30s)</p></div>);
  const renderErr = (e: string, retry: any) => (<div className="flex flex-col items-center justify-center h-full p-8 text-center"><AlertCircle className="h-8 w-8 text-red-500 mb-2"/><p className="text-red-500 mb-4 text-sm">{e}</p><Button onClick={retry} variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4"/>Retry</Button></div>);

  if (!mounted) return <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full w-full">
      <TabsList className="flex w-full overflow-x-auto rounded-none border-b h-12 bg-background/95 backdrop-blur px-2 justify-start sm:justify-center no-scrollbar">
        <TabsTrigger value="chat" className="text-xs rounded-none whitespace-nowrap"><MessageSquare className="h-3.5 w-3.5 mr-1.5"/>Chat</TabsTrigger>
        <TabsTrigger value="notes" className="text-xs rounded-none whitespace-nowrap"><PenTool className="h-3.5 w-3.5 mr-1.5"/>Notes</TabsTrigger>
        <TabsTrigger value="podcast" className="text-xs rounded-none whitespace-nowrap"><Headphones className="h-3.5 w-3.5 mr-1.5"/>Audio</TabsTrigger>
        <TabsTrigger value="summary" className="text-xs rounded-none whitespace-nowrap"><FileText className="h-3.5 w-3.5 mr-1.5"/>Sum</TabsTrigger>
        <TabsTrigger value="flashcards" className="text-xs rounded-none whitespace-nowrap"><Layers className="h-3.5 w-3.5 mr-1.5"/>Cards</TabsTrigger>
        <TabsTrigger value="quiz" className="text-xs rounded-none whitespace-nowrap"><HelpCircle className="h-3.5 w-3.5 mr-1.5"/>Quiz</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden bg-background/50 relative">
        <TabsContent value="chat" className="h-full m-0 border-0 outline-none absolute inset-0"><ChatPanel sourceId={sourceId} userId={userId} sourceTitle={sourceTitle} /></TabsContent>
        <TabsContent value="notes" className="h-full m-0 border-0 outline-none absolute inset-0"><NotesEditor sourceId={sourceId} userId={userId} /></TabsContent>
        <TabsContent value="podcast" className="h-full m-0 border-0 outline-none absolute inset-0 overflow-y-auto">{podcast.loading ? renderLoad("Audio Overview") : podcast.error ? renderErr(podcast.error, () => generate("podcast", setPodcast)) : podcast.data && <AudioOverview data={podcast.data} />}</TabsContent>
        <TabsContent value="summary" className="h-full m-0 border-0 outline-none absolute inset-0 overflow-y-auto">{summary.loading ? renderLoad("Summary") : summary.error ? renderErr(summary.error, () => generate("summary", setSummary)) : summary.data && <SummaryView data={summary.data} />}</TabsContent>
        <TabsContent value="flashcards" className="h-full m-0 border-0 outline-none absolute inset-0 overflow-y-auto">{flashcards.loading ? renderLoad("Flashcards") : flashcards.error ? renderErr(flashcards.error, () => generate("flashcards", setFlashcards)) : flashcards.data && <FlashcardViewer data={flashcards.data} />}</TabsContent>
        <TabsContent value="quiz" className="h-full m-0 border-0 outline-none absolute inset-0 overflow-y-auto">{quiz.loading ? renderLoad("Quiz") : quiz.error ? renderErr(quiz.error, () => generate("quiz", setQuiz)) : quiz.data && <QuizMode data={quiz.data} />}</TabsContent>
      </div>
    </Tabs>
  );
}
