"use client";

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

interface RenameProjectDialogProps {
  open: boolean;
  currentName: string;
  projectName: string;
  isLoading: boolean;
  onProjectNameChange: (name: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function RenameProjectDialog({
  open,
  currentName,
  projectName,
  isLoading,
  onProjectNameChange,
  onSubmit,
  onClose,
}: RenameProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>
            Renaming{" "}
            <span className="font-medium text-[var(--text-secondary)]">
              {currentName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Input
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && projectName.trim() && onSubmit()}
        />

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!projectName.trim() || isLoading}
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
