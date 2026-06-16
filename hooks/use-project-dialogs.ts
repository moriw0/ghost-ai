"use client";

import { useState } from "react";
import { MockProject, nameToSlug } from "@/lib/mock-projects";

type DialogType = "create" | "rename" | "delete" | null;

interface ProjectDialogsState {
  dialog: DialogType;
  targetProject: MockProject | null;
  projectName: string;
  isLoading: boolean;
}

interface UseProjectDialogsReturn {
  dialog: DialogType;
  targetProject: MockProject | null;
  projectName: string;
  projectSlug: string;
  isLoading: boolean;
  openCreate: () => void;
  openRename: (project: MockProject) => void;
  openDelete: (project: MockProject) => void;
  closeDialog: () => void;
  setProjectName: (name: string) => void;
  handleCreate: () => void;
  handleRename: () => void;
  handleDelete: () => void;
}

export function useProjectDialogs(): UseProjectDialogsReturn {
  const [state, setState] = useState<ProjectDialogsState>({
    dialog: null,
    targetProject: null,
    projectName: "",
    isLoading: false,
  });

  const openCreate = () => {
    setState({ dialog: "create", targetProject: null, projectName: "", isLoading: false });
  };

  const openRename = (project: MockProject) => {
    setState({ dialog: "rename", targetProject: project, projectName: project.name, isLoading: false });
  };

  const openDelete = (project: MockProject) => {
    setState({ dialog: "delete", targetProject: project, projectName: project.name, isLoading: false });
  };

  const closeDialog = () => {
    setState({ dialog: null, targetProject: null, projectName: "", isLoading: false });
  };

  const setProjectName = (name: string) => {
    setState((prev) => ({ ...prev, projectName: name }));
  };

  const handleCreate = () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    setTimeout(() => closeDialog(), 500);
  };

  const handleRename = () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    setTimeout(() => closeDialog(), 500);
  };

  const handleDelete = () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    setTimeout(() => closeDialog(), 500);
  };

  return {
    dialog: state.dialog,
    targetProject: state.targetProject,
    projectName: state.projectName,
    projectSlug: nameToSlug(state.projectName),
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
