"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, BarChart3, BookOpen } from "lucide-react";

interface DifficultyMeterProps {
  chunkCount: number;
  sourceType: string;
}

export function DifficultyMeter({ chunkCount, sourceType }: DifficultyMeterProps) {
  // Estimate difficulty based on content volume
  const estimatedPages = Math.ceil(chunkCount * 1.5);
  const readingTimeMin = Math.ceil(chunkCount * 2);

  let difficulty: "Easy" | "Medium" | "Hard" | "Advanced";
  let difficultyColor: string;
  let difficultyWidth: string;

  if (chunkCount <= 5) {
    difficulty = "Easy";
    difficultyColor = "bg-green-500";
    difficultyWidth = "25%";
  } else if (chunkCount <= 15) {
    difficulty = "Medium";
    difficultyColor = "bg-yellow-500";
    difficultyWidth = "50%";
  } else if (chunkCount <= 30) {
    difficulty = "Hard";
    difficultyColor = "bg-orange-500";
    difficultyWidth = "75%";
  } else {
    difficulty = "Advanced";
    difficultyColor = "bg-red-500";
    difficultyWidth = "100%";
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Content Overview</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            difficulty === "Easy" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            : difficulty === "Medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
            : difficulty === "Hard" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          }`}>
            {difficulty}
          </span>
        </div>

        {/* Difficulty Bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${difficultyColor}`}
            style={{ width: difficultyWidth }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            ~{estimatedPages} pages
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{readingTimeMin} min to study
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
