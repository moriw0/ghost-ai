"use client";

import { Bot, Download, FileText, Loader2, MessageSquare, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useMutation, useOthers, useSelf, useStorage } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { aiStatusMessageSchema, chatMessageSchema } from "@/types/tasks";
import type { ChatMessage } from "@/types/tasks";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const DEMO_SPEC = {
  title: "Microservices Architecture",
  snippet:
    "API Gateway routes to Auth, Products, and Orders services backed by PostgreSQL and a Redis cache layer.",
};

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roomId: string;
}

interface RunState {
  runId: string;
  accessToken: string;
}

function RunTracker({
  runId,
  accessToken,
  onComplete,
  onError,
}: {
  runId: string;
  accessToken: string;
  onComplete: (summary: string) => void;
  onError: () => void;
}) {
  const { run } = useRealtimeRun(runId, { accessToken });

  useEffect(() => {
    if (!run) return;
    if (run.status === "COMPLETED") {
      const output = run.output as { summary?: string } | undefined;
      onComplete(output?.summary ?? "Design applied to canvas.");
    } else if (
      run.status === "FAILED" ||
      run.status === "CANCELED" ||
      run.status === "CRASHED" ||
      run.status === "SYSTEM_FAILURE" ||
      run.status === "TIMED_OUT" ||
      run.status === "EXPIRED"
    ) {
      onError();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.status]);

  return null;
}

export function AiSidebar({ isOpen, onClose, projectId, roomId }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runState, setRunState] = useState<RunState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const self = useSelf();
  const others = useOthers();
  const isAiThinking = others.some(
    (other) => other.id === "ghost-ai" && other.presence.thinking
  );
  const rawFeed = useStorage((root) => root.aiStatusFeed);
  const sharedStatusText = (() => {
    if (!rawFeed) return null;
    const result = aiStatusMessageSchema.safeParse({ text: rawFeed.text ?? undefined });
    return result.success ? (result.data.text ?? null) : null;
  })();
  const isSharedProcessing = isAiThinking || sharedStatusText !== null;

  const rawChatMessages = useStorage((root) => root.aiChatFeed);
  const chatMessages: ChatMessage[] = rawChatMessages
    ? (rawChatMessages as unknown as Record<string, unknown>[])
        .map((m) => {
          const result = chatMessageSchema.safeParse(m);
          return result.success ? result.data : null;
        })
        .filter((m): m is ChatMessage => m !== null)
    : [];

  const sendChatMutation = useMutation(
    ({ storage }, content: string, sender: string) => {
      const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      storage.get("aiChatFeed").push(
        new LiveObject({
          id,
          sender,
          role: "user" as const,
          content,
          timestamp: Date.now(),
        })
      );
    },
    []
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "72px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = chatInputRef.current;
    if (!el) return;
    el.style.height = "72px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [chatInput]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting || runState) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsSubmitting(true);

    try {
      const triggerRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, roomId, projectId }),
      });

      if (!triggerRes.ok) {
        throw new Error("Failed to start AI task");
      }

      const { runId } = (await triggerRes.json()) as { runId: string };

      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to get run token");
      }

      const { token } = (await tokenRes.json()) as { token: string };

      setRunState({ runId, accessToken: token });
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
      setIsSubmitting(false);
    }
  }

  function handleRunComplete(summary: string) {
    setMessages((prev) => [...prev, { role: "assistant", content: summary }]);
    setRunState(null);
    setIsSubmitting(false);
  }

  function handleRunError() {
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "The design task failed. Please try again." },
    ]);
    setRunState(null);
    setIsSubmitting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  function sendChat() {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const sender = self?.info?.name ?? "Anonymous";
    try {
      sendChatMutation(trimmed, sender);
      setChatInput("");
      setChatError(null);
    } catch {
      setChatError("Failed to send message. Please try again.");
    }
  }

  function handleChatKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  }

  const isProcessing = isSubmitting || runState !== null || isSharedProcessing;

  return (
    <aside
      id="ai-sidebar"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={`fixed right-0 top-12 z-30 flex h-[calc(100vh-3rem)] w-80 flex-col border-l border-[var(--border-default)] bg-[var(--bg-base)]/95 shadow-xl backdrop-blur-sm transition-transform duration-200 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {runState && (
        <RunTracker
          runId={runState.runId}
          accessToken={runState.accessToken}
          onComplete={handleRunComplete}
          onError={handleRunError}
        />
      )}

      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--border-default)] px-4 py-3">
        <Bot className="h-4 w-4 shrink-0 text-[var(--accent-ai-text)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            AI Workspace
          </p>
          {isSharedProcessing ? (
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-[var(--accent-ai-text)]" />
              <p className="truncate text-xs text-[var(--accent-ai-text)]">
                {sharedStatusText ?? "Ghost AI is working..."}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Collaborate with Ghost AI</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-xl p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          aria-label="Close AI sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="architect"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-3 shrink-0 gap-1 bg-[var(--bg-subtle)] p-1">
          <TabsTrigger
            value="architect"
            className="flex-1 text-xs data-[state=active]:bg-[var(--accent-ai)] data-[state=active]:text-white data-[state=inactive]:text-[var(--text-muted)]"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="flex-1 text-xs data-[state=active]:bg-[var(--accent-ai)] data-[state=active]:text-white data-[state=inactive]:text-[var(--text-muted)]"
          >
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="flex-1 text-xs data-[state=active]:bg-[var(--accent-ai)] data-[state=active]:text-white data-[state=inactive]:text-[var(--text-muted)]"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        {/* AI Architect tab */}
        <TabsContent
          value="architect"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="min-h-0 flex-1 px-4 py-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-4 pt-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-subtle)]">
                  <Bot className="h-6 w-6 text-[var(--accent-ai-text)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Ghost AI Architect
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                    Describe your system and I&apos;ll help design the
                    architecture.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => submit(prompt)}
                      disabled={isProcessing}
                      className="rounded-full bg-[var(--bg-subtle)] px-3 py-2 text-left text-xs text-[var(--accent-ai-text)] transition-colors hover:bg-[var(--bg-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "border-2 border-[var(--accent-primary)]/50 bg-[var(--accent-primary-dim)] text-[var(--text-primary)]"
                          : "border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--accent-ai-text)]"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--accent-ai-text)]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Designing...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="shrink-0 border-t border-[var(--border-default)] p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI..."
                rows={1}
                disabled={isProcessing}
                className="min-h-[72px] max-h-[160px] flex-1 resize-none border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--accent-ai)] disabled:opacity-50"
              />
              <Button
                onClick={() => submit(input)}
                disabled={!input.trim() || isProcessing}
                size="icon"
                className="shrink-0 bg-[var(--accent-primary)] text-[#080809] hover:bg-[var(--accent-primary)]/90 disabled:opacity-40"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-faint)]">
              Enter to send &middot; Shift+Enter for newline
            </p>
          </div>
        </TabsContent>

        {/* Chat tab */}
        <TabsContent
          value="chat"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="min-h-0 flex-1 px-4 py-3">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 pt-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-subtle)]">
                  <MessageSquare className="h-6 w-6 text-[var(--accent-ai-text)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Room Chat
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                    Send messages to everyone in this room.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-0.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-[var(--text-faint)]">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="rounded-2xl rounded-tl-sm border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]">
                      {msg.content}
                    </p>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
            )}
          </ScrollArea>

          <div className="shrink-0 border-t border-[var(--border-default)] p-3">
            {chatError && (
              <p className="mb-2 text-xs text-red-400">{chatError}</p>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Send a message..."
                rows={1}
                className="min-h-[72px] max-h-[160px] flex-1 resize-none border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--accent-ai)]"
              />
              <Button
                onClick={sendChat}
                disabled={!chatInput.trim()}
                size="icon"
                className="shrink-0 bg-[var(--accent-primary)] text-[#080809] hover:bg-[var(--accent-primary)]/90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-faint)]">
              Enter to send &middot; Shift+Enter for newline
            </p>
          </div>
        </TabsContent>

        {/* Specs tab */}
        <TabsContent value="specs" className="mt-0 flex flex-col gap-3 p-4">
          <Button className="w-full bg-[var(--accent-primary)] text-[#080809] hover:bg-[var(--accent-primary)]/90">
            Generate Spec
          </Button>

          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-subtle)]">
                <FileText className="h-4 w-4 text-[var(--accent-ai-text)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {DEMO_SPEC.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                  {DEMO_SPEC.snippet}
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                disabled
                className="flex cursor-not-allowed items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-faint)] opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
