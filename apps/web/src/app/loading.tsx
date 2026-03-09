import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground animate-pulse">Loading AI-Tutor...</p>
    </div>
  );
}
