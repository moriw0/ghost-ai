"use client";

import { useState } from "react";
import { Bot, PanelLeftClose, PanelLeftOpen, Share2 } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { CanvasWrapper } from "@/components/editor/canvas/canvas-wrapper";
import { CreateProjectDialog } from "@/components/editor/dialogs/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/dialogs/delete-project-dialog";
import { RenameProjectDialog } from "@/components/editor/dialogs/rename-project-dialog";
import { ShareDialog } from "@/components/editor/dialogs/share-dialog";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectSummary } from "@/lib/projects";

interface WorkspaceShellProps {
  project: ProjectSummary;
  isOwner: boolean;
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
}

export function WorkspaceShell({
  project,
  isOwner,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const {
    dialog,
    targetProject,
    projectName,
    projectRoomId,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    setProjectName,
    handleCreate,
    handleRename,
    handleDelete,
  } = useProjectActions();

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-base)]">
      <header className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex w-full items-center gap-3 px-3">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="rounded-xl p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </button>

          <span className="flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
            {project.name}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <button
              onClick={() => setAiSidebarOpen((prev) => !prev)}
              className={`rounded-xl p-1.5 transition-colors hover:bg-[var(--bg-subtle)] ${
                aiSidebarOpen
                  ? "text-[var(--accent-ai-text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
              aria-label="Toggle AI sidebar"
            >
              <Bot className="h-5 w-5" />
            </button>
            <UserButton />
          </div>
        </div>
      </header>

      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreateProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={project.id}
      />

      <div className="flex flex-1 pt-12">
        <main className="relative flex flex-1 bg-[var(--bg-base)]">
          <CanvasWrapper roomId={project.id} />
        </main>

        {aiSidebarOpen && (
          <aside className="flex w-80 flex-shrink-0 flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="flex items-center border-b border-[var(--border-default)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                AI Assistant
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">
                AI chat coming soon
              </p>
            </div>
          </aside>
        )}
      </div>

      <ShareDialog
        open={shareOpen}
        projectId={project.id}
        isOwner={isOwner}
        onClose={() => setShareOpen(false)}
      />
      <CreateProjectDialog
        open={dialog === "create"}
        projectName={projectName}
        projectRoomId={projectRoomId}
        isLoading={isLoading}
        onProjectNameChange={setProjectName}
        onSubmit={handleCreate}
        onClose={closeDialog}
      />
      <RenameProjectDialog
        open={dialog === "rename"}
        currentName={targetProject?.name ?? ""}
        projectName={projectName}
        isLoading={isLoading}
        onProjectNameChange={setProjectName}
        onSubmit={handleRename}
        onClose={closeDialog}
      />
      <DeleteProjectDialog
        open={dialog === "delete"}
        projectName={targetProject?.name ?? ""}
        isLoading={isLoading}
        onConfirm={handleDelete}
        onClose={closeDialog}
      />
    </div>
  );
}
