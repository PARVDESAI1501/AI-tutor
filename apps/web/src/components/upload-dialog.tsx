"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Youtube,
  Globe,
  Mic,
  FileAudio,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface OptionCardProps {
  icon: any;
  label: string;
  desc: string;
  onClick: () => void;
  color: string;
}

export function UploadDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "select" | "file" | "media" | "web" | "text" | "record"
  >("select");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "done" | "error"
  >("idle");
  const [msg, setMsg] = useState("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setActiveTab("select");
        setFile(null);
        setTitle("");
        setUrl("");
        setText("");
        setStatus("idle");
        setMsg("");
        setAudioBlob(null);
        setRecording(false);
      }, 300);
    }
  }, [open]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setTitle(f.name.split(".")[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setStatus("uploading");
    setMsg("Uploading file to server...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    formData.append("title", title || "Untitled");

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      poll(await res.json().then((d) => d.source_id));
    } catch (err: unknown) {
      setStatus("error");
      setMsg(
        err instanceof Error
          ? err.message
          : "Network Error: Is the Python backend running?",
      );
    }
  };

  const uploadWeb = async (isYoutube: boolean) => {
    if (!url.trim()) return;
    setStatus("uploading");

    const urls = url
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u);
    setMsg(`Sending request to server...`);

    try {
      const sourceIds = [];
      for (const singleUrl of urls) {
        const res = await fetch(`${API_URL}/api/web`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: singleUrl,
            user_id: userId,
            title: title || singleUrl,
            type: isYoutube ? "youtube" : "web",
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server Error: ${res.status}`);
        }
        const data = await res.json();
        sourceIds.push(data.source_id);
      }
      if (sourceIds.length > 0) poll(sourceIds[0], urls.length);
    } catch (err: any) {
      setStatus("error");
      setMsg(
        err.message === "Failed to fetch"
          ? "Network Error: Is the Python backend running on port 8000?"
          : err.message,
      );
    }
  };

  const uploadText = async () => {
    if (!text) return;
    setStatus("uploading");
    setMsg("Processing text...");
    try {
      const res = await fetch(`${API_URL}/api/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          user_id: userId,
          title: title || "Pasted Text",
        }),
      });
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      poll(await res.json().then((d) => d.source_id));
    } catch (err: unknown) {
      setStatus("error");
      setMsg("Network Error: Is the Python backend running?");
    }
  };

  const poll = (sid: string, count: number = 1) => {
    setStatus("processing");
    setMsg(
      count > 1
        ? `AI is analyzing ${count} sources...`
        : "AI is analyzing content...",
    );

    const int = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/source/${sid}/status`);

        if (!res.ok) {
          clearInterval(int);
          setStatus("error");
          setMsg(
            "Failed: The source lacked readable content and was auto-discarded.",
          );
          setTimeout(() => {
            setOpen(false);
            router.refresh();
          }, 4000);
          return;
        }

        const data = await res.json();
        if (data.status === "ready") {
          clearInterval(int);
          setStatus("done");
          setMsg("Done! Redirecting...");
          setTimeout(() => {
            setOpen(false);
            router.refresh();
          }, 1000);
        } else if (data.status === "error") {
          clearInterval(int);
          setStatus("error");
          setMsg(`Processing Error: ${data.error}`);
        }
      } catch (e) {
        clearInterval(int);
        setStatus("error");
        setMsg("Network connection lost during processing.");
      }
    }, 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setFile(new File([blob], "recording.webm", { type: "audio/webm" }));
        setTitle("Lecture Recording");
      };
      mediaRecorder.current.start();
      setRecording(true);
    } catch (e) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const OptionCard = ({
    icon: Icon,
    label,
    desc,
    onClick,
    color,
  }: OptionCardProps) => (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 h-40 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:bg-accent/50 transition-all shadow-sm hover:shadow-md group"
    >
      <div className={`p-3 rounded-full mb-3 ${color} bg-opacity-10`}>
        <Icon className={`w-8 h-8 ${color.replace("bg-", "text-")}`} />
      </div>
      <span className="font-semibold text-sm">{label}</span>
      <span className="text-xs text-muted-foreground mt-1 text-center">
        {desc}
      </span>
    </motion.button>
  );

  if (!mounted)
    return (
      <Button suppressHydrationWarning>
        <Upload className="mr-2 h-4 w-4" /> Add Source
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          suppressHydrationWarning
          size="lg"
          className="shadow-lg shadow-primary/20 rounded-full px-6"
        >
          <Upload className="mr-2 h-4 w-4" /> Add Source
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-background/80 backdrop-blur-xl border-border/50">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold">
            {activeTab === "select" ? "Add to Library" : "Upload Content"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2">
          <AnimatePresence mode="wait">
            {activeTab === "select" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-4"
              >
                <OptionCard
                  icon={FileText}
                  label="Document"
                  desc="PDF, DOCX, PPTX"
                  color="bg-blue-500"
                  onClick={() => setActiveTab("file")}
                />
                <OptionCard
                  icon={Globe}
                  label="Website / YouTube"
                  desc="Paste multiple URLs"
                  color="bg-red-500"
                  onClick={() => setActiveTab("web")}
                />
                <OptionCard
                  icon={FileAudio}
                  label="Audio / Video"
                  desc="MP3, MP4, WAV"
                  color="bg-yellow-500"
                  onClick={() => setActiveTab("media")}
                />
                <OptionCard
                  icon={FileText}
                  label="Paste Text"
                  desc="Raw text input"
                  color="bg-green-500"
                  onClick={() => setActiveTab("text")}
                />
                <OptionCard
                  icon={Mic}
                  label="Record Audio"
                  desc="Live lecture"
                  color="bg-purple-500"
                  onClick={() => setActiveTab("record")}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("select")}
                  className="mb-2 -ml-2 text-muted-foreground"
                >
                  ← Back to options
                </Button>

                {activeTab === "file" && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-accent/50 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        accept=".pdf,.pptx,.docx"
                        onChange={handleFile}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer block"
                      >
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">
                          Click to select file
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOCX, PPTX (Max 10MB)
                        </p>
                      </label>
                    </div>
                    {file && (
                      <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                    <Input
                      placeholder="Title (Optional)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <Button
                      onClick={uploadFile}
                      disabled={!file || status !== "idle"}
                      className="w-full"
                    >
                      {status === "uploading" ? (
                        <Loader2 className="animate-spin mr-2" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}{" "}
                      Upload
                    </Button>
                  </div>
                )}

                {activeTab === "web" && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste URLs here. You can paste multiple links separated by commas or new lines."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Input
                      placeholder="Group Title (Optional)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => uploadWeb(true)}
                        disabled={!url || status !== "idle"}
                        variant="outline"
                        className="h-12"
                      >
                        <Youtube className="mr-2 h-4 w-4 text-red-500" />{" "}
                        Process YouTube
                      </Button>
                      <Button
                        onClick={() => uploadWeb(false)}
                        disabled={!url || status !== "idle"}
                        variant="outline"
                        className="h-12"
                      >
                        <Globe className="mr-2 h-4 w-4 text-blue-500" /> Process
                        Website
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === "media" && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-accent/50 transition-colors">
                      <input
                        type="file"
                        id="media-upload"
                        accept="audio/*,video/*"
                        onChange={handleFile}
                        className="hidden"
                      />
                      <label
                        htmlFor="media-upload"
                        className="cursor-pointer block"
                      >
                        <FileAudio className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">
                          Select Audio or Video
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          MP3, MP4, WAV (Max 25MB)
                        </p>
                      </label>
                    </div>
                    {file && (
                      <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                    <Button
                      onClick={uploadFile}
                      disabled={!file || status !== "idle"}
                      className="w-full"
                    >
                      Transcribe & Upload
                    </Button>
                  </div>
                )}

                {activeTab === "text" && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste your notes or text here..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-[200px] resize-none"
                    />
                    <Input
                      placeholder="Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <Button
                      onClick={uploadText}
                      disabled={!text || status !== "idle"}
                      className="w-full"
                    >
                      Process Text
                    </Button>
                  </div>
                )}

                {activeTab === "record" && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-6">
                    {!recording && !audioBlob ? (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={startRecording}
                        className="h-24 w-24 rounded-full bg-red-500/10 text-red-500 border-2 border-red-500 flex items-center justify-center"
                      >
                        <Mic className="h-10 w-10" />
                      </motion.button>
                    ) : recording ? (
                      <div className="text-center space-y-4">
                        <div className="animate-pulse text-red-500 font-bold tracking-widest">
                          RECORDING...
                        </div>
                        <Button
                          onClick={stopRecording}
                          variant="destructive"
                          size="lg"
                          className="rounded-full px-8"
                        >
                          Stop Recording
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4 w-full">
                        <div className="flex items-center justify-center gap-2 text-green-500 font-medium">
                          <CheckCircle2 className="h-5 w-5" /> Recording
                          Captured
                        </div>
                        <Input
                          placeholder="Recording Title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                        <Button onClick={uploadFile} className="w-full">
                          Upload & Transcribe
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setAudioBlob(null);
                            setFile(null);
                          }}
                          className="text-xs text-muted-foreground"
                        >
                          Discard & Record Again
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {msg && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/50 p-4 rounded-xl flex items-center gap-3"
                  >
                    {status === "processing" || status === "uploading" ? (
                      <Loader2 className="animate-spin text-primary flex-shrink-0" />
                    ) : status === "done" ? (
                      <CheckCircle2 className="text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="text-red-500 flex-shrink-0" />
                    )}
                    <p className="text-sm font-medium">{msg}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
