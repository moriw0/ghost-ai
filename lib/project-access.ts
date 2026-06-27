import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { ProjectSummary } from "@/lib/projects";

export interface CurrentIdentity {
  userId: string;
  email: string;
}

export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const user = await currentUser();
  if (!user) return null;

  return {
    userId: user.id,
    email: (user.primaryEmailAddress?.emailAddress ?? "").toLowerCase(),
  };
}

export interface ProjectWithAccess extends ProjectSummary {
  isOwner: boolean;
}

export async function getProjectWithAccess(
  roomId: string,
  userId: string,
  email: string,
): Promise<ProjectWithAccess | null> {
  const project = await prisma.project.findUnique({
    where: { id: roomId },
    select: { id: true, name: true, ownerId: true },
  });

  if (!project) return null;

  if (project.ownerId === userId) {
    return { id: project.id, name: project.name, isOwner: true };
  }

  if (email) {
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: { projectId_email: { projectId: roomId, email } },
      select: { id: true },
    });
    if (collaborator) {
      return { id: project.id, name: project.name, isOwner: false };
    }
  }

  return null;
}
