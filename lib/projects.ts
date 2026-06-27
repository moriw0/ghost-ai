import { prisma } from '@/lib/prisma'

export interface ProjectSummary {
  id: string
  name: string
}

export async function getOwnedProjects(userId: string): Promise<ProjectSummary[]> {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true },
  })
}

export async function getSharedProjects(email: string): Promise<ProjectSummary[]> {
  if (!email) return []

  const collaborations = await prisma.projectCollaborator.findMany({
    where: { email },
    select: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return collaborations.map((c) => c.project)
}
