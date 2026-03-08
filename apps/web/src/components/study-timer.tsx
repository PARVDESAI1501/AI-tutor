"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

interface StudyTimerProps {
  sourceTitle: string;
}

export function StudyTimer({ sourceTitle }: StudyTimerProps) {
  const [seconds, setSeconds] = useState(25 * 60); // 25 min default
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      if (!isBreak) {
        setSessionsCompleted((prev) => prev + 1);
        setIsBreak(true);
        setSeconds(5 * 60); // 5 min break
      } else {
        setIsBreak(false);
        setSeconds(25 * 60);
      }
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, seconds, isBreak]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = isBreak
    ? ((5 * 60 - seconds) / (5 * 60)) * 100
    : ((25 * 60 - seconds) / (25 * 60)) * 100;

  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setSeconds(25 * 60);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Circular Progress */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${progress}, 100`}
                  className={isBreak ? "text-green-500" : "text-primary"}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {isBreak ? (
                  <Coffee className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="text-xs font-bold">
                    {minutes}:{secs.toString().padStart(2, "0")}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">
                {isBreak ? "Break Time" : "Study Session"}
              </p>
              <p className="text-xs text-muted-foreground">
                {sessionsCompleted} session{sessionsCompleted !== 1 ? "s" : ""} completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={reset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
