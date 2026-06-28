"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Download, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SpecPreviewModalProps {
  projectId: string;
  specId: string | null;
  filename: string;
  open: boolean;
  onClose: () => void;
}

export function SpecPreviewModal({
  projectId,
  specId,
  filename,
  open,
  onClose,
}: SpecPreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !specId) return;

    setContent(null);
    setError(null);
    setIsLoading(true);

    fetch(`/api/projects/${projectId}/specs/${specId}/content`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load spec");
        return res.json() as Promise<{ content: string }>;
      })
      .then(({ content: text }) => setContent(text))
      .catch(() => setError("Failed to load spec content. Please try again."))
      .finally(() => setIsLoading(false));
  }, [open, specId, projectId]);

  function handleDownload() {
    if (!specId) return;
    const a = document.createElement("a");
    a.href = `/api/projects/${projectId}/specs/${specId}/download`;
    a.click();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-[var(--border-default)] px-6 py-4 pr-12">
          <DialogTitle className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {filename}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
            </div>
          )}
          {error && (
            <p className="py-4 text-sm text-[var(--state-error)]">{error}</p>
          )}
          {content && (
            <div className="text-sm leading-relaxed text-[var(--text-primary)]">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-3 mt-6 text-lg font-bold text-[var(--text-primary)] first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-2 mt-5 text-base font-semibold text-[var(--text-primary)]">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-4 text-sm font-semibold text-[var(--text-secondary)]">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-3 text-[var(--text-secondary)]">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-[var(--text-secondary)]">{children}</li>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = Boolean(className?.startsWith("language-"));
                    return isBlock ? (
                      <code className="block font-mono text-xs text-[var(--text-secondary)]">
                        {children}
                      </code>
                    ) : (
                      <code className="rounded px-1 py-0.5 font-mono text-xs bg-[var(--bg-subtle)] text-[var(--accent-primary)]">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="mb-3 overflow-x-auto rounded-xl bg-[var(--bg-subtle)] p-3">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="mb-3 border-l-2 border-[var(--border-subtle)] pl-3 text-[var(--text-muted)]">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-4 border-[var(--border-default)]" />,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-[var(--text-primary)]">
                      {children}
                    </strong>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--border-default)] px-6 py-3 flex justify-end">
          <Button
            onClick={handleDownload}
            disabled={!content}
            size="sm"
            variant="ghost"
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
