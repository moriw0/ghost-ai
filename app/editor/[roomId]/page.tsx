import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { WorkspaceShell } from "@/components/editor/workspace-shell";
import {
  getCurrentIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";
import { getOwnedProjects, getSharedProjects } from "@/lib/projects";

interface EditorRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function EditorRoomPage({ params }: EditorRoomPageProps) {
  const { roomId } = await params;

  const identity = await getCurrentIdentity();

  if (!identity) {
    redirect("/sign-in");
  }

  const { userId, email } = identity;

  const [project, ownedProjects, sharedProjects] = await Promise.all([
    getProjectWithAccess(roomId, userId, email),
    getOwnedProjects(userId),
    getSharedProjects(email),
  ]);

  if (!project) {
    return <AccessDenied />;
  }

  return (
    <WorkspaceShell
      project={project}
      isOwner={project.isOwner}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
