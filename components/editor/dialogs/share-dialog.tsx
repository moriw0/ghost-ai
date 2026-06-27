"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, UserMinus, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CollaboratorInfo } from "@/app/api/projects/[projectId]/collaborators/route";

interface ShareDialogProps {
  open: boolean;
  projectId: string;
  isOwner: boolean;
  onClose: () => void;
}

export function ShareDialog({
  open,
  projectId,
  isOwner,
  onClose,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!res.ok) throw new Error("Failed to load collaborators");
      const data = await res.json();
      setCollaborators(data.collaborators);
    } catch {
      setError("Could not load collaborators.");
    } finally {
      setIsFetching(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      fetchCollaborators();
    } else {
      setInviteEmail("");
      setError(null);
    }
  }, [open, fetchCollaborators]);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (res.status === 409) {
        setError("This email is already a collaborator.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to invite collaborator.");
        return;
      }
      const data = await res.json();
      setCollaborators((prev) => [...prev, data.collaborator]);
      setInviteEmail("");
    } catch {
      setError("Failed to invite collaborator.");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove(collaboratorId: string) {
    setRemovingId(collaboratorId);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        setError("Failed to remove collaborator.");
        return;
      }
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
    } catch {
      setError("Failed to remove collaborator.");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/editor/${projectId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Invite collaborators by email or copy the project link."
              : "View collaborators for this project."}
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <div className="flex gap-2">
            <Input
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && inviteEmail.trim() && handleInvite()
              }
              disabled={isInviting}
              type="email"
              autoComplete="off"
            />
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || isInviting}
              className="shrink-0 gap-1.5"
            >
              {isInviting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              Invite
            </Button>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-[var(--text-muted)]">
            Collaborators
          </p>
          {isFetching ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--text-muted)]">
              No collaborators yet.
            </p>
          ) : (
            <ScrollArea className="max-h-56">
              <ul className="flex flex-col gap-1 pr-2">
                {collaborators.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5"
                  >
                    <Avatar displayName={c.displayName} avatarUrl={c.avatarUrl} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {c.displayName}
                      </span>
                      {c.displayName !== c.email && (
                        <span className="truncate text-xs text-[var(--text-muted)]">
                          {c.email}
                        </span>
                      )}
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(c.id)}
                        disabled={removingId === c.id}
                        className="shrink-0 rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-red-400 disabled:opacity-50"
                        aria-label={`Remove ${c.displayName}`}
                      >
                        {removingId === c.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        <Button
          variant="outline"
          className="gap-2"
          onClick={handleCopyLink}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Avatar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
      {displayName[0] ?? "?"}
    </div>
  );
}
