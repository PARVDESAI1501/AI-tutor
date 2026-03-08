"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/chat-panel";
import { SummaryView } from "@/components/summary-view";
import { FlashcardViewer } from "@/components/flashcard-viewer";
import { QuizMode } from "@/components/quiz-mode";
import { ExportButton } from "@/components/export-button";
import {
  MessageSquare, FileText, Layers, HelpCircle,
  Loader2, AlertCircle, RefreshCw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface StudyToolsPanelProps {
  sourceId: string;
  userId: string;
  sourceTitle: string;
}

interface MaterialState {
  loading: boolean;
  data: any | null;
  error: string | null;
}

export function StudyToolsPanel({ sourceId, userId, sourceTitle }: StudyToolsPanelProps) {
  const [activeTab, setActiveTab] = useState("chat");
  const [summary, setSummary] = useState<MaterialState>({ loading: false, data: null, error: null });
  const [flashcards, setFlashcards] = useState<MaterialState>({ loading: false, data: null, error: null });
  const [quiz, setQuiz] = useState<MaterialState>({ loading: false, data: null, error: null });

  const generateMaterial = async (
    type: "summary" | "flashcards" | "quiz",
    setter: React.Dispatch<React.SetStateAction<MaterialState>>
  ) => {
    setter({ loading: true, data: null, error: null });
    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: sourceId, user_id: userId, material_type: type }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to generate ${type}`);
      }
      const result = await response.json();
      if (!result.content) throw new Error("No content received");
      setter({ loading: false, data: result.content, error: null });
    } catch (error: any) {
      setter({ loading: false, data: null, error: error.message });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "summary" && !summary.data && !summary.loading) generateMaterial("summary", setSummary);
    if (value === "flashcards" && !flashcards.data && !flashcards.loading) generateMaterial("flashcards", setFlashcards);
    if (value === "quiz" && !quiz.data && !quiz.loading) generateMaterial("quiz", setQuiz);
  };

  const renderLoading = (type: string) => (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Generating {type}...</p>
    </div>
  );

  const renderError = (type: string, error: string, retry: () => void) => (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-sm text-red-600">{error}</p>
      <Button onClick={retry} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />Try Again
      </Button>
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
      <TabsList className="grid w-full grid-cols-4 rounded-none border-b bg-background h-12">
        <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-muted rounded-none">
          <MessageSquare className="h-3.5 w-3.5" />Chat
        </TabsTrigger>
        <TabsTrigger value="summary" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-muted rounded-none">
          <FileText className="h-3.5 w-3.5" />Summary
        </TabsTrigger>
        <TabsTrigger value="flashcards" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-muted rounded-none">
          <Layers className="h-3.5 w-3.5" />Flashcards
        </TabsTrigger>
        <TabsTrigger value="quiz" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-muted rounded-none">
          <HelpCircle className="h-3.5 w-3.5" />Quiz
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
        <ChatPanel sourceId={sourceId} userId={userId} sourceTitle={sourceTitle} />
      </TabsContent>

      <TabsContent value="summary" className="flex-1 m-0 overflow-hidden">
        {summary.loading && renderLoading("summary")}
        {summary.error && renderError("summary", summary.error, () => generateMaterial("summary", setSummary))}
        {summary.data && (
          <div className="flex flex-col h-full">
            <div className="flex justify-end p-2 border-b">
              <ExportButton content={summary.data} type="summary" title={sourceTitle} />
            </div>
            <div className="flex-1 overflow-auto">
              <SummaryView data={summary.data} />
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="flashcards" className="flex-1 m-0 overflow-hidden">
        {flashcards.loading && renderLoading("flashcards")}
        {flashcards.error && renderError("flashcards", flashcards.error, () => generateMaterial("flashcards", setFlashcards))}
        {flashcards.data && (
          <div className="flex flex-col h-full">
            <div className="flex justify-end p-2 border-b">
              <ExportButton content={flashcards.data} type="flashcards" title={sourceTitle} />
            </div>
            <div className="flex-1 overflow-auto">
              <FlashcardViewer data={flashcards.data} />
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="quiz" className="flex-1 m-0 overflow-hidden">
        {quiz.loading && renderLoading("quiz")}
        {quiz.error && renderError("quiz", quiz.error, () => generateMaterial("quiz", setQuiz))}
        {quiz.data && (
          <div className="flex flex-col h-full">
            <div className="flex justify-end p-2 border-b">
              <ExportButton content={quiz.data} type="quiz" title={sourceTitle} />
            </div>
            <div className="flex-1 overflow-auto">
              <QuizMode data={quiz.data} />
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
