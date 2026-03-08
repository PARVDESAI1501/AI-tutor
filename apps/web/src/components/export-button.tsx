"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  content: any;
  type: "summary" | "flashcards" | "quiz";
  title: string;
}

export function ExportButton({ content, type, title }: ExportButtonProps) {
  const [copied, setCopied] = useState(false);

  const formatAsText = (): string => {
    if (type === "summary") {
      let text = `# ${content.title}\n\n`;
      text += `${content.overview}\n\n`;
      text += `## Key Concepts\n\n`;
      content.key_concepts?.forEach((kc: any) => {
        text += `**${kc.concept}**: ${kc.explanation}\n\n`;
      });
      content.sections?.forEach((s: any) => {
        text += `## ${s.heading}\n\n${s.content}\n\n`;
        s.key_points?.forEach((p: string) => {
          text += `- ${p}\n`;
        });
        text += "\n";
      });
      text += `## Conclusion\n\n${content.conclusion}\n`;
      return text;
    }

    if (type === "flashcards") {
      let text = `# Flashcards: ${title}\n\n`;
      content.flashcards?.forEach((fc: any, i: number) => {
        text += `## Card ${i + 1} [${fc.difficulty}]\n`;
        text += `**Q:** ${fc.front}\n`;
        text += `**A:** ${fc.back}\n\n`;
      });
      return text;
    }

    if (type === "quiz") {
      let text = `# Quiz: ${title}\n\n`;
      content.questions?.forEach((q: any, i: number) => {
        text += `## Question ${i + 1}\n`;
        text += `${q.question}\n\n`;
        q.options?.forEach((o: string) => {
          text += `${o}\n`;
        });
        text += `\n**Answer:** ${q.correct_answer}\n`;
        text += `**Explanation:** ${q.explanation}\n\n`;
      });
      return text;
    }

    return JSON.stringify(content, null, 2);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatAsText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const text = formatAsText();
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}-${type}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}-${type}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? "Copied!" : "Copy to Clipboard"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadText}>
          <FileText className="h-4 w-4 mr-2" />
          Download as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadJSON}>
          <Download className="h-4 w-4 mr-2" />
          Download as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
