"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CreateProjectDialogProps {
  open: boolean;
  projectName: string;
  projectSlug: string;
  isLoading: boolean;
  onProjectNameChange: (name: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function CreateProjectDialog({
  open,
  projectName,
  projectSlug,
  isLoading,
  onProjectNameChange,
  onSubmit,
  onClose,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Give your architecture workspace a name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            placeholder="Project name"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && projectName.trim() && onSubmit()}
          />
          {projectSlug && (
            <p className="text-xs text-[var(--text-muted)]">
              Slug:{" "}
              <span className="font-mono text-[var(--text-secondary)]">
                {projectSlug}
              </span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!projectName.trim() || isLoading}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
