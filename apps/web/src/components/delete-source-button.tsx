"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DeleteSourceButtonProps {
  sourceId: string;
  userId: string;
  sourceTitle: string;
}

export function DeleteSourceButton({
  sourceId,
  userId,
  sourceTitle,
}: DeleteSourceButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/source/${sourceId}?user_id=${userId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleting(false);
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" suppressHydrationWarning>
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-red-500"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          suppressHydrationWarning
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Delete Source</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{sourceTitle}&quot;? This will
            permanently remove the document, all AI-generated content, chat
            history, summaries, flashcards, and quizzes. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
