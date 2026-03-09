import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Bot, FileText, Settings, Video, Mic } from "lucide-react";

export default function GuidePage() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quick Guide</h1>
          <p className="text-muted-foreground mt-2">Learn how to make the most out of your AI-Tutor.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-blue-500"/> Adding Content</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p><strong>Documents:</strong> Upload PDF, PPTX, or DOCX up to 10MB.</p>
              <p><strong>Media:</strong> Upload local Audio/Video files (up to 25MB). AI will transcribe them using Groq Whisper.</p>
              <p><strong>Web & YouTube:</strong> Paste any article URL or YouTube link (must have captions).</p>
              <p><strong>Live Record:</strong> Use the Mic tab to record lectures straight from your browser.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-green-500"/> Chatting with AI</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>The AI only knows what is inside your uploaded document. It will explicitly cite [Source X] to prove where it got the answer.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-purple-500"/> Study Tools</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Click on any ready source in My Library to access:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Summaries:</strong> Structured breakdowns of the content.</li>
                <li><strong>Flashcards:</strong> Interactive flip-cards. Mark them as "Known" to track progress.</li>
                <li><strong>Quizzes:</strong> AI-generated multiple choice tests with instant grading.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
