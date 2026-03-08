import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap, MessageSquare, FileText, Layers,
  HelpCircle, Upload, Youtube, ArrowRight, Sparkles,
  BookOpen, Clock, Shield, Zap, CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AI-Tutor</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost">Sign In</Button></Link>
            <Link href="/signup"><Button>Get Started Free</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          AI-Powered Learning Platform
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
          Turn Any Document Into an
          <span className="text-primary"> Interactive Study Session</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Upload your lecture slides, textbooks, or YouTube videos.
          Instantly chat with your content, generate summaries, study with
          flashcards, and test yourself with quizzes.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/signup">
            <Button size="lg" className="text-base px-8 w-full sm:w-auto">
              Start Learning Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">No credit card required. Free forever.</p>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to smarter studying</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", icon: Upload, title: "Upload", desc: "Drop in your PDFs, slides, docs, or paste a YouTube link", color: "from-blue-500 to-blue-600" },
              { step: "2", icon: Sparkles, title: "AI Analyzes", desc: "Our AI reads and understands every page of your material", color: "from-purple-500 to-purple-600" },
              { step: "3", icon: GraduationCap, title: "Study", desc: "Chat, summarize, make flashcards, and take quizzes", color: "from-green-500 to-green-600" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`rounded-2xl bg-gradient-to-br ${item.color} p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-xs font-bold text-primary mb-1">STEP {item.step}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything You Need to Study</h2>
          <p className="text-muted-foreground">Powerful AI tools designed for real learning</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            { icon: MessageSquare, title: "AI Chat", desc: "Ask questions about your content and get accurate, cited answers", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
            { icon: FileText, title: "Summaries", desc: "Get organized summaries that highlight what matters most", color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
            { icon: Layers, title: "Flashcards", desc: "Auto-generated cards for quick memorization and review", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600" },
            { icon: HelpCircle, title: "Quizzes", desc: "Test your knowledge with instant feedback and explanations", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
          ].map((f) => (
            <Card key={f.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className={`rounded-xl ${f.color} p-3 w-fit mx-auto mb-4`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Supported Formats */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Works With Your Materials</h2>
            <p className="text-muted-foreground">Upload any of these formats</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: FileText, label: "PDF Files", color: "text-red-500" },
              { icon: FileText, label: "PowerPoint", color: "text-orange-500" },
              { icon: FileText, label: "Word Docs", color: "text-blue-500" },
              { icon: Youtube, label: "YouTube Videos", color: "text-red-600" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 bg-background border rounded-xl px-5 py-3 shadow-sm">
                <f.icon className={`h-5 w-5 ${f.color}`} />
                <span className="font-medium text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Why Students Love AI-Tutor</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { icon: BookOpen, title: "Learns YOUR Content", desc: "Every answer comes from your materials — nothing made up or generic" },
            { icon: Zap, title: "Instant Results", desc: "Upload and start studying in under a minute" },
            { icon: Shield, title: "Private & Secure", desc: "Your documents stay private. Only you can access your content" },
            { icon: Clock, title: "Study Anytime", desc: "Your AI tutor is available 24/7 on any device" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4 p-4">
              <div className="rounded-full bg-primary/10 p-2 flex-shrink-0 mt-0.5">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Study Smarter?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join students who are transforming how they learn. Upload your first document and see the difference.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-base px-8">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI-Tutor</span>
          </div>
          <p className="text-sm text-muted-foreground">AI-powered study platform for modern learners</p>
        </div>
      </footer>
    </div>
  );
}
