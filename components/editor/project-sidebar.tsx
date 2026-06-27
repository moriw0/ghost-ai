"use client";

import { MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectSummary } from "@/lib/projects";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: () => void;
  onRenameProject: (project: ProjectSummary) => void;
  onDeleteProject: (project: ProjectSummary) => void;
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
}

function ProjectItem({
  project,
  isOwned,
  onRename,
  onDelete,
}: {
  project: ProjectSummary;
  isOwned: boolean;
  onRename: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-[var(--bg-subtle)]">
      <span className="flex-1 truncate text-sm text-[var(--text-primary)]">
        {project.name}
      </span>

      {isOwned && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="rounded-xl p-1 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            aria-label="Project actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] py-1 shadow-xl">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(project);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                >
                  <Pencil className="h-4 w-4" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(project);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--state-error)] hover:bg-[var(--bg-subtle)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  ownedProjects,
  sharedProjects,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-12 z-30 flex h-[calc(100vh-3rem)] w-72 flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Projects
          </span>
          <button
            onClick={onClose}
            className="rounded-xl p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Tabs defaultValue="my-projects" className="flex min-h-0 flex-1 flex-col">
          <div className="px-3 pt-3">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="my-projects" className="flex-1 px-3 py-2">
            <ScrollArea className="h-full">
              {ownedProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-[var(--text-muted)]">
                    No projects yet
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {ownedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      isOwned={true}
                      onRename={onRenameProject}
                      onDelete={onDeleteProject}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="shared" className="flex-1 px-3 py-2">
            <ScrollArea className="h-full">
              {sharedProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-[var(--text-muted)]">
                    No shared projects
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {sharedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      isOwned={false}
                      onRename={onRenameProject}
                      onDelete={onDeleteProject}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="border-t border-[var(--border-default)] p-3">
          <Button className="w-full gap-2" onClick={onCreateProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
