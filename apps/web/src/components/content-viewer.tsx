"use client";

import { FileText, Youtube } from "lucide-react";

interface ContentViewerProps {
  sourceType: string;
  youtubeUrl?: string | null;
  title: string;
  chunks?: Array<{
    content: string;
    page_number: number | null;
    chunk_index: number;
  }>;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:v=)([0-9A-Za-z_-]{11})/,
    /(?:youtu\.be\/)([0-9A-Za-z_-]{11})/,
    /(?:embed\/)([0-9A-Za-z_-]{11})/,
    /(?:shorts\/)([0-9A-Za-z_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function ContentViewer({
  sourceType,
  youtubeUrl,
  title,
  chunks,
}: ContentViewerProps) {
  if (sourceType === "youtube" && youtubeUrl) {
    const videoId = extractVideoId(youtubeUrl);

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            <h2 className="font-semibold truncate">{title}</h2>
          </div>
        </div>
        <div className="flex-1 bg-black">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>Could not load video</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold truncate">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {chunks?.length || 0} content sections extracted
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chunks && chunks.length > 0 ? (
          chunks.map((chunk, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Section {chunk.chunk_index + 1}
                </span>
                {chunk.page_number && (
                  <span className="text-xs text-muted-foreground">
                    Page {chunk.page_number}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {chunk.content}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-10">
            No content available
          </div>
        )}
      </div>
    </div>
  );
}
