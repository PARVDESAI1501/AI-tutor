import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  MessageSquare,
  FileText,
  Brain,
  Zap,
  Upload,
  Youtube,
  ArrowRight,
  Github,
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
          <div className="flex items-center gap-3">
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
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          Powered by Google Gemini AI
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
          Learn Smarter with
          <span className="text-primary"> AI-Powered</span> Tutoring
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Upload any document or YouTube video. Get instant AI summaries,
          flashcards, quizzes, and chat with an AI tutor that knows your
          content inside out.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 w-full sm:w-auto">
              Start Learning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">1. Upload</h3>
            <p className="text-muted-foreground text-sm">
              Upload PDFs, PowerPoints, Word docs, or paste a YouTube URL
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">2. AI Processes</h3>
            <p className="text-muted-foreground text-sm">
              Content is parsed, chunked, and embedded for intelligent retrieval
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                <GraduationCap className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">3. Learn</h3>
            <p className="text-muted-foreground text-sm">
              Chat with AI, generate summaries, flashcards, and test with quizzes
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1">AI Chat Tutor</h3>
                <p className="text-muted-foreground text-sm">
                  Ask questions and get cited answers from your materials
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1">Smart Summaries</h3>
                <p className="text-muted-foreground text-sm">
                  Structured summaries of any document in one click
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1">Flashcards</h3>
                <p className="text-muted-foreground text-sm">
                  Auto-generated cards for spaced repetition learning
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1">Quiz Mode</h3>
                <p className="text-muted-foreground text-sm">
                  Test knowledge with AI quizzes and explanations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Supported Formats */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Supported Formats
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { icon: FileText, label: "PDF", color: "text-red-500" },
            { icon: FileText, label: "PowerPoint", color: "text-orange-500" },
            { icon: FileText, label: "Word", color: "text-blue-500" },
            { icon: Youtube, label: "YouTube", color: "text-red-600" },
          ].map((format) => (
            <div
              key={format.label}
              className="flex items-center gap-2 border rounded-lg px-4 py-2"
            >
              <format.icon className={`h-5 w-5 ${format.color}`} />
              <span className="font-medium text-sm">{format.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Built With</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Next.js",
              "FastAPI",
              "TypeScript",
              "Python",
              "Supabase",
              "pgvector",
              "Google Gemini",
              "Tailwind CSS",
              "LangChain",
            ].map((tech) => (
              <span
                key={tech}
                className="bg-background border rounded-full px-4 py-1.5 text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Learn Smarter?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Join now and transform how you study with AI-powered tools.
          Completely free.
        </p>
        <Link href="/signup">
          <Button size="lg" className="text-lg px-8">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI-Tutor</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with Next.js, FastAPI, Supabase & Google Gemini AI
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
