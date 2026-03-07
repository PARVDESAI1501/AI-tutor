"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Youtube,
  Loader2,
  CheckCircle2,
  XCircle,
  File,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UploadDialogProps {
  userId: string;
}

export function UploadDialog({ userId }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("file");

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");

  // Processing state
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "done" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);

  const router = useRouter();

  // ─────────────────────────────────────────────
  // File Selection
  // ─────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedExtensions = [".pdf", ".pptx", ".docx"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setStatusMessage("Please upload a PDF, PPTX, or DOCX file.");
      setStatus("error");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage("File is too large. Maximum size is 10MB.");
      setStatus("error");
      return;
    }

    setSelectedFile(file);
    setFileTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension for title
    setStatus("idle");
    setStatusMessage("");
  };

  // ─────────────────────────────────────────────
  // File Upload Handler
  // ─────────────────────────────────────────────
  const handleFileUpload = async () => {
    if (!selectedFile || !fileTitle.trim()) return;

    setUploading(true);
    setStatus("uploading");
    setStatusMessage("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("user_id", userId);
      formData.append("title", fileTitle.trim());

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      const data = await response.json();
      setSourceId(data.source_id);
      setStatus("processing");
      setStatusMessage("Processing document... This may take a minute.");

      // Start polling for status
      pollStatus(data.source_id);
    } catch (error: any) {
      setStatus("error");
      setStatusMessage(error.message || "Upload failed. Please try again.");
      setUploading(false);
    }
  };

  // ─────────────────────────────────────────────
  // YouTube Upload Handler
  // ─────────────────────────────────────────────
  const handleYoutubeUpload = async () => {
    if (!youtubeUrl.trim()) return;

    // Basic YouTube URL validation
    const youtubeRegex =
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setStatus("error");
      setStatusMessage("Please enter a valid YouTube URL.");
      return;
    }

    setUploading(true);
    setStatus("uploading");
    setStatusMessage("Fetching video transcript...");

    try {
      const response = await fetch(`${API_URL}/api/youtube`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          user_id: userId,
          title: youtubeTitle.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to process YouTube video");
      }

      const data = await response.json();
      setSourceId(data.source_id);
      setStatus("processing");
      setStatusMessage("Processing transcript... This may take a minute.");

      // Start polling for status
      pollStatus(data.source_id);
    } catch (error: any) {
      setStatus("error");
      setStatusMessage(
        error.message || "Failed to process video. Please try again.",
      );
      setUploading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Poll Processing Status
  // ─────────────────────────────────────────────
  const pollStatus = async (sid: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/source/${sid}/status`);
        const data = await response.json();

        if (data.status === "ready") {
          clearInterval(interval);
          setStatus("done");
          setStatusMessage(
            `Done! Created ${data.chunk_count} chunks. Redirecting...`,
          );
          setUploading(false);

          // Wait a moment then refresh dashboard
          setTimeout(() => {
            setOpen(false);
            resetState();
            router.refresh();
          }, 1500);
        } else if (data.status === "error") {
          clearInterval(interval);
          setStatus("error");
          setStatusMessage(
            data.error || "Processing failed. Please try again.",
          );
          setUploading(false);
        }
        // If still "processing", keep polling
      } catch (error) {
        // Network error during polling — keep trying
        console.error("Polling error:", error);
      }
    }, 2000); // Poll every 2 seconds

    // Safety: stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (status === "processing") {
        setStatus("error");
        setStatusMessage("Processing timed out. Please try again.");
        setUploading(false);
      }
    }, 300000);
  };

  // ─────────────────────────────────────────────
  // Reset State
  // ─────────────────────────────────────────────
  const resetState = () => {
    setSelectedFile(null);
    setFileTitle("");
    setYoutubeUrl("");
    setYoutubeTitle("");
    setUploading(false);
    setStatus("idle");
    setStatusMessage("");
    setSourceId(null);
  };

  // ─────────────────────────────────────────────
  // Status Icon
  // ─────────────────────────────────────────────
  const StatusIcon = () => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "done":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Content
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Learning Material</DialogTitle>
          <DialogDescription>
            Upload a document or paste a YouTube URL to start learning with AI.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" disabled={uploading}>
              <FileText className="mr-2 h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="youtube" disabled={uploading}>
              <Youtube className="mr-2 h-4 w-4" />
              YouTube URL
            </TabsTrigger>
          </TabsList>

          {/* ── File Upload Tab ── */}
          <TabsContent value="file" className="space-y-4 mt-4">
            {/* File Selector */}
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to select a file</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, PPTX, or DOCX (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Title Input */}
            {selectedFile && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  placeholder="Document title"
                />
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleFileUpload}
              disabled={!selectedFile || !fileTitle.trim() || uploading}
              className="w-full"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploading ? "Processing..." : "Upload & Process"}
            </Button>
          </TabsContent>

          {/* ── YouTube Tab ── */}
          <TabsContent value="youtube" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">YouTube URL</label>
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Title{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Input
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
                placeholder="Video title"
                disabled={uploading}
              />
            </div>

            <Button
              onClick={handleYoutubeUpload}
              disabled={!youtubeUrl.trim() || uploading}
              className="w-full"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Youtube className="mr-2 h-4 w-4" />
              )}
              {uploading ? "Processing..." : "Process Video"}
            </Button>
          </TabsContent>
        </Tabs>

        {/* ── Status Message ── */}
        {statusMessage && (
          <div
            className={`flex items-center gap-3 p-3 rounded-lg mt-2 ${
              status === "error"
                ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                : status === "done"
                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                  : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
            }`}
          >
            <StatusIcon />
            <p className="text-sm">{statusMessage}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
