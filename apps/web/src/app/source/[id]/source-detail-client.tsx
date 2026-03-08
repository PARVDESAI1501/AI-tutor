"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContentViewer } from "@/components/content-viewer";
import { StudyToolsPanel } from "@/components/study-tools-panel";
import { StudyTimer } from "@/components/study-timer";
import { DifficultyMeter } from "@/components/difficulty-meter";
import {
  GraduationCap,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

interface Source {
  id: string;
  title: string;
  source_type: string;
  youtube_url: string | null;
  status: string;
}

interface Chunk {
  content: string;
  page_number: number | null;
  chunk_index: number;
}

interface SourceDetailClientProps {
  source: Source;
  chunks: Chunk[];
  userId: string;
}

export function SourceDetailClient({
  source,
  chunks,
  userId,
}: SourceDetailClientProps) {
  const [showViewer, setShowViewer] = useState(true);

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold truncate max-w-md">
                {source.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowViewer(!showViewer)}
            >
              {showViewer ? (
                <>
                  <PanelLeftClose className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Hide Source</span>
                </>
              ) : (
                <>
                  <PanelLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Show Source</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {showViewer && (
          <div className="w-1/2 border-r overflow-hidden flex flex-col">
            {/* Study Tools Above Content */}
            <div className="p-3 border-b space-y-2">
              <StudyTimer sourceTitle={source.title} />
              <DifficultyMeter
                chunkCount={chunks.length}
                sourceType={source.source_type}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <ContentViewer
                sourceType={source.source_type}
                youtubeUrl={source.youtube_url}
                title={source.title}
                chunks={chunks}
              />
            </div>
          </div>
        )}

        <div className={showViewer ? "w-1/2" : "w-full"}>
          <StudyToolsPanel
            sourceId={source.id}
            userId={userId}
            sourceTitle={source.title}
          />
        </div>
      </div>
    </div>
  );
}
