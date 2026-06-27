import { put, get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";
import type { NextRequest } from "next/server";

interface RawNode {
  id: string;
  type: string;
  position: { x: number; y: number };
}

interface RawEdge {
  id: string;
  source: string;
  target: string;
}

interface CanvasPayload {
  nodes: RawNode[];
  edges: RawEdge[];
}

function isCanvasPayload(value: unknown): value is CanvasPayload {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) return false;
  for (const node of obj.nodes as unknown[]) {
    if (!node || typeof node !== "object") return false;
    const n = node as Record<string, unknown>;
    if (typeof n.id !== "string" || typeof n.type !== "string") return false;
    if (!n.position || typeof n.position !== "object") return false;
    const pos = n.position as Record<string, unknown>;
    if (typeof pos.x !== "number" || typeof pos.y !== "number") return false;
  }
  for (const edge of obj.edges as unknown[]) {
    if (!edge || typeof edge !== "object") return false;
    const e = edge as Record<string, unknown>;
    if (typeof e.id !== "string" || typeof e.source !== "string" || typeof e.target !== "string") return false;
  }
  return true;
}

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

  if (!isCanvasPayload(body)) {
    return Response.json({ error: "Invalid canvas payload" }, { status: 400 });
  }

  const blob = await put(
    `canvas/${projectId}.json`,
    JSON.stringify({ nodes: body.nodes, edges: body.edges }),
    { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true }
  );

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return Response.json({ url: blob.url });
}
