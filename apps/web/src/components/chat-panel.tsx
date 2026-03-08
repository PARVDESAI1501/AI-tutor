"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/chat-message";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, Bot } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: any[];
}

interface ChatPanelProps {
  sourceId: string;
  userId: string;
  sourceTitle: string;
}

export function ChatPanel({ sourceId, userId, sourceTitle }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Create or load conversation
  useEffect(() => {
    loadOrCreateConversation();
  }, [sourceId]);

  const loadOrCreateConversation = async () => {
    try {
      // Check for existing conversation
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .eq("source_id", sourceId)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        setConversationId(existing[0].id);

        // Load existing messages
        const { data: existingMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", existing[0].id)
          .order("created_at", { ascending: true });

        if (existingMessages && existingMessages.length > 0) {
          setMessages(
            existingMessages.map((msg) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              sources: msg.sources,
            })),
          );
        }
      } else {
        // Create new conversation
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            source_id: sourceId,
            user_id: userId,
            title: `Chat about ${sourceTitle}`,
          })
          .select()
          .single();

        if (newConv) {
          setConversationId(newConv.id);
        }
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmedInput = input.trim();
      if (!trimmedInput || isStreaming) return;

      // Add user message to UI
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmedInput,
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsStreaming(true);

      // Add empty assistant message for streaming
      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Build history from existing messages
        const history = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Call the chat API
        const response = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmedInput,
            source_id: sourceId,
            user_id: userId,
            conversation_id: conversationId,
            history: history,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Chat request failed");
        }

        // Read the SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();

                if (data === "[DONE]") {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.token) {
                    fullResponse += parsed.token;

                    // Update the assistant message with new content
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantId
                          ? { ...msg, content: fullResponse }
                          : msg,
                      ),
                    );
                  }

                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                } catch (parseError) {
                  // Skip malformed JSON lines
                  if (data !== "[DONE]") {
                    console.debug("Skipping line:", data);
                  }
                }
              }
            }
          }
        }

        // Parse source citations from the response
        let cleanContent = fullResponse;
        let sources: any[] = [];

        if (fullResponse.includes("<!--SOURCES:")) {
          const parts = fullResponse.split("<!--SOURCES:");
          cleanContent = parts[0].trim();
          const sourcesJson = parts[1].replace("-->", "").trim();
          try {
            sources = JSON.parse(sourcesJson);
          } catch {
            console.debug("Failed to parse sources");
          }
        }

        // Update final message with clean content and sources
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: cleanContent, sources }
              : msg,
          ),
        );
      } catch (error: any) {
        console.error("Chat error:", error);

        // Update assistant message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    "Sorry, I encountered an error. Please try again. " +
                    error.message,
                }
              : msg,
          ),
        );
      } finally {
        setIsStreaming(false);
        textareaRef.current?.focus();
      }
    },
    [input, isStreaming, messages, sourceId, userId, conversationId],
  );

  // Handle Enter key (Submit on Enter, new line on Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          /* Welcome Message */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-4 mb-4">
              <Bot className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Tutor Ready</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              I&apos;ve analyzed your document &quot;{sourceTitle}&quot;. Ask me
              anything about it and I&apos;ll answer using the content with
              citations.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Summarize the main points",
                  "Explain the key concepts",
                  "What are the important takeaways?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              sources={msg.sources}
              isStreaming={
                isStreaming &&
                index === messages.length - 1 &&
                msg.role === "assistant"
              }
            />
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your content... (Enter to send, Shift+Enter for new line)"
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 h-[44px] w-[44px]"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
