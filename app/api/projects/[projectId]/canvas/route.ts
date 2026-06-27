import { put, get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";
import type { NextRequest } from "next/server";

async function checkAccess(projectId: string) {
  const identity = await getCurrentIdentity();
  if (!identity) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, canvasJsonPath: true },
  });
  if (!project) return null;

  if (project.ownerId === identity.userId) return { project, identity };

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email: identity.email } },
    select: { id: true },
  });
  if (collaborator) return { project, identity };

  return null;
}

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">
) {
  const { projectId } = await ctx.params;
  const access = await checkAccess(projectId);

  if (!access) {
    return Response.json({ error: "Unauthorized or not found" }, { status: 401 });
  }

  const { canvasJsonPath } = access.project;

  if (!canvasJsonPath) {
    return new Response(null, { status: 204 });
  }

  const blobResult = await get(canvasJsonPath, { access: "private" });
  if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
    return Response.json({ error: "Failed to fetch canvas data" }, { status: 502 });
  }

  const text = await new Response(blobResult.stream).text();
  const canvasData = JSON.parse(text) as unknown;
  return Response.json(canvasData);
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">
) {
  const { projectId } = await ctx.params;
  const access = await checkAccess(projectId);

  if (!access) {
    return Response.json({ error: "Unauthorized or not found" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as { nodes?: unknown }).nodes) ||
    !Array.isArray((body as { edges?: unknown }).edges)
  ) {
    return Response.json({ error: "nodes and edges arrays are required" }, { status: 400 });
  }

  const blob = await put(
    `canvas/${projectId}.json`,
    JSON.stringify(body),
    { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true }
  );

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return Response.json({ url: blob.url });
}
