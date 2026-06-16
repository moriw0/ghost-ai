"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { CreateProjectDialog } from "@/components/editor/dialogs/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/dialogs/delete-project-dialog";
import { RenameProjectDialog } from "@/components/editor/dialogs/rename-project-dialog";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { Button } from "@/components/ui/button";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";

export default function EditorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    dialog,
    targetProject,
    projectName,
    projectSlug,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    setProjectName,
    handleCreate,
    handleRename,
    handleDelete,
  } = useProjectDialogs();

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-base)]">
      <EditorNavbar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreateProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      />

      <main className="flex flex-1 items-center justify-center pt-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Create a project or open an existing one
          </h1>
          <p className="max-w-sm text-sm text-[var(--text-secondary)]">
            Start a new architecture workspace, or choose a project from the
            sidebar.
          </p>
          <Button onClick={openCreate} className="mt-2 gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </main>

      <CreateProjectDialog
        open={dialog === "create"}
        projectName={projectName}
        projectSlug={projectSlug}
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
