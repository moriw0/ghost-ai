import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";
import type { NextRequest } from "next/server";

async function checkProjectAccess(projectId: string) {
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
  ctx: RouteContext<"/api/projects/[projectId]/specs/[specId]/download">
) {
  const { projectId, specId } = await ctx.params;

  const identity = await checkProjectAccess(projectId);
  if (!identity) {
    return Response.json({ error: "Unauthorized or not found" }, { status: 401 });
  }

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { filePath: true, projectId: true },
  });

  if (!spec) {
    return Response.json({ error: "Spec not found" }, { status: 404 });
  }

  if (spec.projectId !== projectId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const blobResult = await get(spec.filePath, { access: "private" });
  if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
    return Response.json({ error: "Failed to fetch spec file" }, { status: 502 });
  }

  return new Response(blobResult.stream, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
    },
  });
}
