"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    index: number;
    content: string;
    page: number | null;
    similarity: number;
  }>;
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  sources,
  isStreaming,
}: ChatMessageProps) {
  // Remove source citation markers from displayed content
  const cleanContent = content.replace(/<!--SOURCES:[\s\S]*?-->/, "").trim();

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        role === "user" ? "bg-primary/5 ml-8" : "bg-muted/50 mr-8",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-green-600 text-white",
        )}
      >
        {role === "user" ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {role === "user" ? "You" : "AI Tutor"}
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {cleanContent.split("\n").map((line, i) => {
            if (line.startsWith("# ")) {
              return (
                <h1 key={i} className="text-lg font-bold mt-3 mb-1">
                  {line.replace("# ", "")}
                </h1>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <h2 key={i} className="text-base font-bold mt-3 mb-1">
                  {line.replace("## ", "")}
                </h2>
              );
            }
            if (line.startsWith("### ")) {
              return (
                <h3 key={i} className="text-sm font-bold mt-2 mb-1">
                  {line.replace("### ", "")}
                </h3>
              );
            }
            if (line.startsWith("- ") || line.startsWith("* ")) {
              return (
                <li key={i} className="ml-4">
                  {line.replace(/^[-*] /, "")}
                </li>
              );
            }
            if (line.trim() === "") {
              return <br key={i} />;
            }
            return (
              <p key={i} className="mb-1">
                {line}
              </p>
            );
          })}

          {/* Streaming cursor */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
          )}
        </div>

        {/* Source Citations */}
        {sources && sources.length > 0 && !isStreaming && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              📚 Sources Referenced
            </p>
            <div className="space-y-1">
              {sources.map((source) => (
                <div
                  key={source.index}
                  className="text-xs bg-background border rounded px-2 py-1"
                >
                  <span className="font-medium text-primary">
                    [Source {source.index}]
                  </span>
                  {source.page && (
                    <span className="text-muted-foreground">
                      {" "}
                      Page {source.page}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {" "}
                    — {source.content.substring(0, 100)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
