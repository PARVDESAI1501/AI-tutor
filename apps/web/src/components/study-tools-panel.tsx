"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/chat-panel";
import { SummaryView } from "@/components/summary-view";
import { FlashcardViewer } from "@/components/flashcard-viewer";
import { QuizMode } from "@/components/quiz-mode";
import { AudioOverview } from "@/components/audio-overview";
import { NotesEditor } from "@/components/notes-editor";
import { MessageSquare, FileText, Layers, HelpCircle, Loader2, AlertCircle, RefreshCw, Headphones, PenTool } from "lucide-react";

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
      if (!res.ok) throw new Error("Failed to generate. Please try again.");
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

  const renderLoad = (t: string) => (<div className="flex flex-col items-center justify-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin text-primary mb-4"/><p className="text-muted-foreground">Generating {t}... (This takes 15-30s)</p></div>);
  const renderErr = (e: string, retry: any) => (<div className="flex flex-col items-center justify-center h-full p-8"><AlertCircle className="h-8 w-8 text-red-500 mb-2"/><p className="text-red-500 mb-4">{e}</p><Button onClick={retry} variant="outline"><RefreshCw className="mr-2 h-4 w-4"/>Retry</Button></div>);

  if (!mounted) return <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full w-full">
      <TabsList className="grid w-full grid-cols-6 rounded-none border-b h-12 bg-background/95 backdrop-blur">
        <TabsTrigger value="chat" className="text-xs rounded-none"><MessageSquare className="h-4 w-4 sm:mr-2"/><span className="hidden sm:block">Chat</span></TabsTrigger>
        <TabsTrigger value="notes" className="text-xs rounded-none"><PenTool className="h-4 w-4 sm:mr-2"/><span className="hidden sm:block">Notes</span></TabsTrigger>
        <TabsTrigger value="podcast" className="text-xs rounded-none"><Headphones className="h-4 w-4 sm:mr-2"/><span className="hidden sm:block">Audio</span></TabsTrigger>
        <TabsTrigger value="summary" className="text-xs rounded-none"><FileText className="h-4 w-4 sm:mr-2"/><span className="hidden sm:block">Sum</span></TabsTrigger>
        <TabsTrigger value="flashcards" className="text-xs rounded-none"><Layers className="h-4 w-4 sm:mr-2"/><span className="hidden sm:block">Cards</span></TabsTrigger>
        <TabsTrigger value="quiz" className="text-xs rounded-none"><HelpCircle className="h-4 w-4 sm:mr-2"/><span className="hidden sm:block">Quiz</span></TabsTrigger>
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
