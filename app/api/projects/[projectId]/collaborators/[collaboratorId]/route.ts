import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/projects/[projectId]/collaborators/[collaboratorId]'>
) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, collaboratorId } = await ctx.params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })
  if (!project) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  if (project.ownerId !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { id: collaboratorId },
    select: { id: true, projectId: true },
  })
  if (!collaborator || collaborator.projectId !== projectId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.projectCollaborator.delete({ where: { id: collaboratorId } })

  return new Response(null, { status: 204 })
}
