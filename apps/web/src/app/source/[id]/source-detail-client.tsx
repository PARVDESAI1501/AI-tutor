"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContentViewer } from "@/components/content-viewer";
import { StudyToolsPanel } from "@/components/study-tools-panel";
import { StudyTimer } from "@/components/study-timer";
import { DifficultyMeter } from "@/components/difficulty-meter";
import { GraduationCap, ArrowLeft, PanelTopClose, PanelTop } from "lucide-react";

interface SourceDetailClientProps {
  source: any;
  chunks: any[];
  userId: string;
}

export function SourceDetailClient({ source, chunks, userId }: SourceDetailClientProps) {
  // Mobile starts with viewer hidden to save memory
  const [showViewer, setShowViewer] = useState(false);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
      <header className="border-b bg-background/95 backdrop-blur z-20 flex-shrink-0">
        <div className="flex items-center justify-between px-2 sm:px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base truncate max-w-[150px] sm:max-w-md">
                {source.title}
              </span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowViewer(!showViewer)} className="flex-shrink-0 text-xs sm:text-sm">
            {showViewer ? <><PanelTopClose className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> <span className="hidden sm:inline">Hide Source</span></> : <><PanelTop className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> <span className="hidden sm:inline">Show Source</span></>}
          </Button>
        </div>
      </header>

      {/* Main Content - Flex Col on Mobile, Row on Desktop */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {showViewer && (
          <div className="w-full md:w-1/2 h-[40vh] md:h-full border-b md:border-b-0 md:border-r overflow-hidden flex flex-col z-10 bg-background shadow-md md:shadow-none">
            <div className="p-2 sm:p-3 border-b space-y-2 flex-shrink-0 hidden sm:block">
              <div className="flex gap-2">
                <div className="flex-1"><StudyTimer sourceTitle={source.title} /></div>
                <div className="flex-1"><DifficultyMeter chunkCount={chunks.length} sourceType={source.source_type} /></div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <ContentViewer sourceType={source.source_type} youtubeUrl={source.youtube_url} title={source.title} chunks={chunks} />
            </div>
          </div>
        )}

        <div className={`w-full ${showViewer ? "h-[60vh] md:h-full md:w-1/2" : "h-full"} flex flex-col`}>
          <StudyToolsPanel sourceId={source.id} userId={userId} sourceTitle={source.title} />
        </div>
      </div>
    </div>
  );
}
