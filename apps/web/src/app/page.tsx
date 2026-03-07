import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  MessageSquare,
  FileText,
  Brain,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI-Tutor</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Learn Smarter with
          <span className="text-primary"> AI-Powered</span> Tutoring
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Upload any document or YouTube video. Get instant AI summaries,
          flashcards, quizzes, and chat with an AI tutor that knows your content
          inside out.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Learning Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">AI Chat Tutor</h3>
            <p className="text-muted-foreground text-sm">
              Ask questions about your content and get accurate, cited answers
            </p>
          </div>
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Smart Summaries</h3>
            <p className="text-muted-foreground text-sm">
              Get structured summaries of any document in one click
            </p>
          </div>
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Brain className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Flashcards</h3>
            <p className="text-muted-foreground text-sm">
              Auto-generated flashcards for effective spaced repetition
            </p>
          </div>
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Quiz Mode</h3>
            <p className="text-muted-foreground text-sm">
              Test your knowledge with AI-created quizzes and explanations
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with Next.js, FastAPI, Supabase & Google Gemini AI
        </div>
      </footer>
    </div>
  );
}
