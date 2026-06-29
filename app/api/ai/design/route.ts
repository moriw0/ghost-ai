import { auth } from "@clerk/nextjs/server";
import { tasks, auth as triggerAuth } from "@trigger.dev/sdk";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

const bodySchema = z.object({
  prompt: z.string().min(1),
  projectId: z.string().min(1),
  requestId: z.string().uuid(),
});

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { prompt, projectId, requestId } = parsed.data;
  // Derive roomId from the server-verified projectId to prevent IDOR via caller-supplied roomId.
  // In this app roomId === projectId (Liveblocks room is identified by the project UUID).
  const roomId = projectId;

  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = project.ownerId === identity.userId;
  if (!isOwner) {
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: { projectId_email: { projectId, email: identity.email } },
      select: { id: true },
    });
    if (!collaborator) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const handle = await tasks.trigger<typeof designAgentTask>(
    "design-agent",
    { prompt, roomId },
    { idempotencyKey: `design-${projectId}-${requestId}`, idempotencyKeyTTL: "1h" },
  );

  await prisma.taskRun.upsert({
    where: { runId: handle.id },
    create: { runId: handle.id, projectId, userId: identity.userId },
    update: {},
  });

  const publicToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [handle.id],
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ runId: handle.id, publicToken }, { status: 201 });
}
