import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";
import type { NextRequest } from "next/server";

async function checkAccess(projectId: string) {
  const identity = await getCurrentIdentity();
  if (!identity) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return null;

  if (project.ownerId === identity.userId) return identity;

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email: identity.email } },
    select: { id: true },
  });
  if (collaborator) return identity;

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const identity = await checkAccess(projectId);

  if (!identity) {
    return Response.json({ error: "Unauthorized or not found" }, { status: 401 });
  }

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ specs });
}
