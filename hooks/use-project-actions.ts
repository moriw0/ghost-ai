"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { nameToSlug } from "@/lib/mock-projects";

interface Project {
  id: string;
  name: string;
}

type DialogType = "create" | "rename" | "delete" | null;

interface State {
  dialog: DialogType;
  targetProject: Project | null;
  projectName: string;
  projectSuffix: string;
  isLoading: boolean;
}

interface UseProjectActionsReturn {
  dialog: DialogType;
  targetProject: Project | null;
  projectName: string;
  projectRoomId: string;
  isLoading: boolean;
  openCreate: () => void;
  openRename: (project: Project) => void;
  openDelete: (project: Project) => void;
  closeDialog: () => void;
  setProjectName: (name: string) => void;
  handleCreate: () => void;
  handleRename: () => void;
  handleDelete: () => void;
}

export function useProjectActions(): UseProjectActionsReturn {
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<State>({
    dialog: null,
    targetProject: null,
    projectName: "",
    projectSuffix: "",
    isLoading: false,
  });

  const openCreate = () => {
    const suffix = Math.random().toString(36).slice(2, 7);
    setState({
      dialog: "create",
      targetProject: null,
      projectName: "",
      projectSuffix: suffix,
      isLoading: false,
    });
  };

  const openRename = (project: Project) => {
    setState({
      dialog: "rename",
      targetProject: project,
      projectName: project.name,
      projectSuffix: "",
      isLoading: false,
    });
  };

  const openDelete = (project: Project) => {
    setState({
      dialog: "delete",
      targetProject: project,
      projectName: "",
      projectSuffix: "",
      isLoading: false,
    });
  };

  const closeDialog = () => {
    setState({
      dialog: null,
      targetProject: null,
      projectName: "",
      projectSuffix: "",
      isLoading: false,
    });
  };

  const setProjectName = (name: string) => {
    setState((prev) => ({ ...prev, projectName: name }));
  };

  const handleCreate = async () => {
    if (!state.projectName.trim()) return;
    setState((prev) => ({ ...prev, isLoading: true }));

    const slug = nameToSlug(state.projectName);
    const roomId = slug
      ? `${slug}-${state.projectSuffix}`
      : state.projectSuffix;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: state.projectName.trim(), id: roomId }),
      });

      if (!res.ok) throw new Error("Failed to create project");

      const { project } = await res.json();
      closeDialog();
      router.push(`/editor/${project.id}`);
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleRename = async () => {
    if (!state.targetProject || !state.projectName.trim()) return;
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const res = await fetch(`/api/projects/${state.targetProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: state.projectName.trim() }),
      });

      if (!res.ok) throw new Error("Failed to rename project");

      closeDialog();
      router.refresh();
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDelete = async () => {
    if (!state.targetProject) return;
    setState((prev) => ({ ...prev, isLoading: true }));

    const projectId = state.targetProject.id;
    const isActiveWorkspace = pathname === `/editor/${projectId}`;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete project");

      closeDialog();

      if (isActiveWorkspace) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const slug = nameToSlug(state.projectName);
  const projectRoomId = slug
    ? `${slug}-${state.projectSuffix}`
    : state.projectSuffix;

  return {
    dialog: state.dialog,
    targetProject: state.targetProject,
    projectName: state.projectName,
    projectRoomId,
    isLoading: state.isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    setProjectName,
    handleCreate,
    handleRename,
    handleDelete,
  };
}
