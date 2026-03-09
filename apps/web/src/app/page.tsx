"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/tilt-card";
import { GraduationCap, MessageSquare, FileText, Layers, HelpCircle, ArrowRight, Sparkles, Upload, Headphones } from "lucide-react";

export default function HomePage() {
  const staggerContainer: Variants = { 
    hidden: { opacity: 0 }, 
    show: { opacity: 1, transition: { staggerChildren: 0.1 } } 
  };
  
  const fadeUp: Variants = { 
    hidden: { opacity: 0, y: 30 }, 
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } 
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Abstract Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 blur-[100px]"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.5, 1] }} 
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-green-500/5 to-orange-500/5 blur-[120px]"
        />
      </div>

      <header className="border-b border-border/40 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 shadow-lg shadow-primary/20">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">AI-Tutor</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login"><Button variant="ghost" className="font-medium hover:bg-muted/50">Sign In</Button></Link>
            <Link href="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="font-medium shadow-lg shadow-primary/25 rounded-full px-6">Get Started</Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6 text-center">
          <motion.div initial="hidden" animate="show" variants={staggerContainer} className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-background/50 backdrop-blur-md mb-8 shadow-sm">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Next-Gen Learning Platform</span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-8 leading-[1.05]">
              Your Personal AI <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x">
                Research Assistant.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload documents, audio, or links. Get instant summaries, audio overviews, citations, and answers grounded in your sources.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex justify-center">
              <Link href="/signup">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(139, 92, 246, 0.4)" }} 
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center h-14 px-8 text-lg font-bold text-white bg-foreground dark:bg-white dark:text-black rounded-full transition-all"
                >
                  Try It Free <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* 3D Feature Grid */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight mb-4">Powerful Features</h2>
              <p className="text-xl text-muted-foreground">Everything you need to understand complex material.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
              {[
                { icon: MessageSquare, title: "Source-Grounded Chat", desc: "Answers are strictly based on your uploads, with citations linking back to the exact paragraph.", color: "text-blue-500", bg: "bg-blue-500/10" },
                { icon: Headphones, title: "Audio Overviews", desc: "Turn your documents into an engaging AI podcast conversation between two hosts.", color: "text-pink-500", bg: "bg-pink-500/10" },
                { icon: Layers, title: "Study Tools", desc: "Auto-generated flashcards and quizzes help you memorize key concepts faster.", color: "text-purple-500", bg: "bg-purple-500/10" },
                { icon: Upload, title: "Universal Import", desc: "We support PDF, PPTX, DOCX, MP3, MP4, and Website Links via web scraping.", color: "text-orange-500", bg: "bg-orange-500/10" },
              ].map((f, i) => (
                <TiltCard key={i} className="min-h-[280px]">
                  <div className="p-8 h-full flex flex-col justify-center">
                    <div className={`h-14 w-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 shadow-inner`}>
                      <f.icon className={`h-7 w-7 ${f.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">{f.desc}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
