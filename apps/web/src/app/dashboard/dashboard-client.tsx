"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Youtube, BookOpen, MessageSquare, Sparkles, Globe, Mic, FileAudio } from "lucide-react";
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

const getSourceIcon = (type: string) => {
  if (type === "youtube") return <Youtube className="h-6 w-6 text-red-500" />;
  if (type === "web") return <Globe className="h-6 w-6 text-green-500" />;
  if (type === "audio" || type === "video") return <FileAudio className="h-6 w-6 text-yellow-500" />;
  if (type === "record") return <Mic className="h-6 w-6 text-purple-500" />;
  return <FileText className="h-6 w-6 text-blue-500" />;
};

export function DashboardClient({ sources, counts, chatCount, materialCount, firstName, userId, searchQuery, typeFilter }: DashboardClientProps) {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">My Library</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage your knowledge base and study materials.</p>
        </div>
        <UploadDialog userId={userId} />
      </motion.div>

      {/* 3D Hover Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Sources", val: counts.all, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "AI Chats", val: chatCount, icon: MessageSquare, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Materials Generated", val: materialCount, icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, type: "spring" }}>
            <TiltCard className="h-32">
              <div className="p-6 flex items-center justify-between h-full">
                <div>
                  <p className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-5xl font-black">{stat.val}</p>
                </div>
                <div className={`h-16 w-16 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      <DashboardSearch currentQuery={searchQuery} currentType={typeFilter} counts={counts as any} />

      {/* Fluid Gliding Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {sources.map((source) => {
            const isReady = source.status === "ready";
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key={source.id}
              >
                <Link href={isReady ? `/source/${source.id}` : "#"} className={!isReady ? "pointer-events-none" : ""}>
                  <motion.div whileHover={isReady ? { scale: 1.03 } : {}} whileTap={isReady ? { scale: 0.98 } : {}} className="h-full">
                    <div className={`h-full relative rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-colors ${isReady ? "hover:border-primary/50" : "opacity-60 grayscale"}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center shadow-inner">
                          {getSourceIcon(source.source_type)}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <DeleteSourceButton sourceId={source.id} userId={userId} sourceTitle={source.title} />
                          <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full ${source.status === "ready" ? "bg-green-500/20 text-green-500" : source.status === "processing" ? "bg-yellow-500/20 text-yellow-500 animate-pulse" : "bg-red-500/20 text-red-500"}`}>
                            {source.status}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-bold text-xl line-clamp-2 mb-2">{source.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                        {source.source_type} • {new Date(source.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {sources.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 rounded-3xl border-dashed border-2 border-border/50">
          <Upload className="h-16 w-16 text-primary/50 mx-auto mb-6" />
          <h3 className="text-2xl font-bold tracking-tight mb-2">No sources found</h3>
          <p className="text-muted-foreground">Upload a document or paste a link to begin learning.</p>
        </motion.div>
      )}
    </div>
  );
}
