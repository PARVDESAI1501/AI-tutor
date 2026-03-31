"use client";
import { useReducer, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

interface StudyTimerProps {
  sourceTitle: string;
}

type TimerState = {
  seconds: number;
  isRunning: boolean;
  isBreak: boolean;
  sessionsCompleted: number;
};

type TimerAction = { type: "TICK" } | { type: "TOGGLE" } | { type: "RESET" };

const initialState: TimerState = {
  seconds: 25 * 60,
  isRunning: false,
  isBreak: false,
  sessionsCompleted: 0,
};

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "TICK": {
      if (state.seconds <= 1) {
        if (!state.isBreak) {
          return {
            ...state,
            seconds: 5 * 60,
            isBreak: true,
            sessionsCompleted: state.sessionsCompleted + 1,
          };
        } else {
          return {
            ...state,
            seconds: 25 * 60,
            isBreak: false,
            isRunning: false,
          };
        }
      }
      return { ...state, seconds: state.seconds - 1 };
    }
    case "TOGGLE":
      return { ...state, isRunning: !state.isRunning };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function StudyTimer({ sourceTitle }: StudyTimerProps) {
  const [state, dispatch] = useReducer(timerReducer, initialState);
  const { seconds, isRunning, isBreak, sessionsCompleted } = state;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        dispatch({ type: "TICK" });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const totalTime = isBreak ? 5 * 60 : 25 * 60;
  const progress = ((totalTime - seconds) / totalTime) * 100;

  return (
    <Card className="border-dashed bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted/30"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                  className={
                    isBreak
                      ? "text-green-500 transition-all duration-500"
                      : "text-primary transition-all duration-500"
                  }
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {isBreak ? (
                  <Coffee className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="text-[10px] font-bold">
                    {minutes}:{secs.toString().padStart(2, "0")}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isBreak ? "Break Time" : "Study Session"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {sessionsCompleted} sessions done
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10"
              onClick={() => dispatch({ type: "TOGGLE" })}
            >
              {isRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10"
              onClick={() => dispatch({ type: "RESET" })}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
