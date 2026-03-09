"use client";

import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Youtube, BookOpen, MessageSquare, Sparkles, Globe, Mic, FileAudio, Upload } from "lucide-react";
import { UploadDialog } from "@/components/upload-dialog";
import { DeleteSourceButton } from "@/components/delete-source-button";
import { DashboardSearch } from "./dashboard-search";
import { TiltCard } from "@/components/tilt-card";

interface DashboardClientProps {
  sources: any[];
  counts: any;
  chatCount: number;
  materialCount: number;
  firstName: string;
  userId: string;
  searchQuery: string;
  typeFilter: string;
}

// SPEED UP: Reduced staggerChildren from 0.1 to 0.03 for instant loading
const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const item: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } } };

const getSourceIcon = (type: string) => {
  if (type === "youtube") return <Youtube className="h-6 w-6 text-red-500" />;
  if (type === "web") return <Globe className="h-6 w-6 text-green-500" />;
  if (type === "audio" || type === "video") return <FileAudio className="h-6 w-6 text-yellow-500" />;
  if (type === "record") return <Mic className="h-6 w-6 text-purple-500" />;
  return <FileText className="h-6 w-6 text-blue-500" />;
};

export function DashboardClient({ sources, counts, chatCount, materialCount, firstName, userId, searchQuery, typeFilter }: DashboardClientProps) {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Library</h1>
          <p className="text-muted-foreground mt-1 text-base">Manage your knowledge base and study materials.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/source/global" className="flex-1 sm:flex-none">
            <Button variant="secondary" className="w-full shadow-sm hover:shadow-md transition-all border border-primary/20">
              <MessageSquare className="mr-2 h-4 w-4 text-primary" />
              Global Chat
            </Button>
          </Link>
          <div className="flex-1 sm:flex-none"><UploadDialog userId={userId} /></div>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Sources", val: counts.all, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "AI Chats", val: chatCount, icon: MessageSquare, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Materials", val: materialCount, icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={item}>
            <TiltCard className="h-28">
              <div className="p-5 flex items-center justify-between h-full">
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-black">{stat.val}</p>
                </div>
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center`}><stat.icon className={`h-6 w-6 ${stat.color}`} /></div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DashboardSearch currentQuery={searchQuery} currentType={typeFilter} counts={counts as any} />
      </motion.div>

      {sources.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {sources.map((source) => {
              const isReady = source.status === "ready";
              return (
                <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} key={source.id}>
                  <Link href={isReady ? `/source/${source.id}` : "#"} className={!isReady ? "pointer-events-none" : ""}>
                    <motion.div whileHover={isReady ? { scale: 1.02 } : {}} whileTap={isReady ? { scale: 0.98 } : {}} className="h-full">
                      <div className={`h-full relative rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-colors ${isReady ? "hover:border-primary/50" : "opacity-60 grayscale"}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center shadow-inner">{getSourceIcon(source.source_type)}</div>
                          <div className="flex flex-col items-end gap-2">
                            <DeleteSourceButton sourceId={source.id} userId={userId} sourceTitle={source.title} />
                            <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full ${source.status === "ready" ? "bg-green-500/20 text-green-500" : source.status === "processing" ? "bg-yellow-500/20 text-yellow-500 animate-pulse" : "bg-red-500/20 text-red-500"}`}>
                              {source.status}
                            </span>
                          </div>
                        </div>
                        <h3 className="font-bold text-lg line-clamp-2 mb-1">{source.title}</h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{source.source_type} • {new Date(source.created_at).toLocaleDateString()}</p>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 rounded-3xl border-dashed border-2 border-border/50">
          <Upload className="h-12 w-12 text-primary/50 mx-auto mb-4" />
          <h3 className="text-xl font-bold tracking-tight mb-2">No sources found</h3>
          <p className="text-muted-foreground text-sm">Upload a document or paste a link to begin learning.</p>
        </motion.div>
      )}
    </div>
  );
}
