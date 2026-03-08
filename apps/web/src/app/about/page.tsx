import { AppLayout } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap, Upload, MessageSquare, FileText,
  Layers, HelpCircle, Zap, Youtube, BookOpen, Shield,
  Clock, Sparkles,
} from "lucide-react";

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-5">
              <GraduationCap className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">AI-Tutor</h1>
          <p className="text-lg text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
            Your personal AI study companion. Upload any learning material
            and instantly get help understanding it — through conversation,
            summaries, flashcards, and quizzes.
          </p>
        </div>

        {/* What You Can Do */}
        <h2 className="text-2xl font-bold mb-6">What You Can Do</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {[
            {
              icon: Upload,
              title: "Upload Any Material",
              desc: "Drop in your PDFs, PowerPoints, Word documents, or paste a YouTube video link. We handle the rest.",
              color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
            },
            {
              icon: MessageSquare,
              title: "Chat With Your Content",
              desc: "Ask questions in plain language. Get accurate answers pulled directly from your materials with references.",
              color: "bg-green-100 dark:bg-green-900/30 text-green-600",
            },
            {
              icon: FileText,
              title: "Generate Summaries",
              desc: "Get organized summaries that break down complex material into key concepts and clear explanations.",
              color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
            },
            {
              icon: Layers,
              title: "Study With Flashcards",
              desc: "Automatically created flashcards help you memorize key terms and concepts through active recall.",
              color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
            },
            {
              icon: HelpCircle,
              title: "Test With Quizzes",
              desc: "Challenge yourself with AI-generated quizzes. Get instant feedback and explanations for every answer.",
              color: "bg-red-100 dark:bg-red-900/30 text-red-600",
            },
            {
              icon: Sparkles,
              title: "Learn Your Way",
              desc: "Whether you prefer reading summaries, flipping through cards, or testing yourself — choose what works for you.",
              color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600",
            },
          ].map((item) => (
            <Card key={item.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`rounded-xl p-2.5 flex-shrink-0 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Supported Formats */}
        <h2 className="text-2xl font-bold mb-6">Supported Formats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: FileText, label: "PDF", desc: "Textbooks, papers, notes", color: "text-red-500" },
            { icon: FileText, label: "PowerPoint", desc: "Lecture slides", color: "text-orange-500" },
            { icon: FileText, label: "Word", desc: "Documents, essays", color: "text-blue-500" },
            { icon: Youtube, label: "YouTube", desc: "Video lectures", color: "text-red-600" },
          ].map((f) => (
            <Card key={f.label} className="text-center hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <f.icon className={`h-8 w-8 mx-auto mb-2 ${f.color}`} />
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Why AI-Tutor */}
        <h2 className="text-2xl font-bold mb-6">Why AI-Tutor?</h2>
        <div className="space-y-4 mb-12">
          {[
            { icon: Zap, title: "Instant Results", desc: "Upload your material and start learning within seconds. No waiting, no setup." },
            { icon: BookOpen, title: "Learn From YOUR Content", desc: "Unlike generic AI, every answer comes from your specific study material — nothing made up." },
            { icon: Shield, title: "Private & Secure", desc: "Your documents and conversations are private. Only you can see your content." },
            { icon: Clock, title: "Study Anytime", desc: "Access your materials and AI tutor 24/7 from any device with a browser." },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Ready to study smarter?</h3>
            <p className="text-muted-foreground">
              Upload your first document and experience AI-powered learning.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
