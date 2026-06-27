import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export interface CollaboratorInfo {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
}

async function enrichWithClerk(emails: string[]): Promise<Map<string, { displayName: string; avatarUrl: string | null }>> {
  if (emails.length === 0) return new Map()

  try {
    const client = await clerkClient()
    const { data: users } = await client.users.getUserList({ emailAddress: emails, limit: 100 })

    const map = new Map<string, { displayName: string; avatarUrl: string | null }>()
    for (const user of users) {
      const email = user.emailAddresses.find((e) => emails.includes(e.emailAddress))?.emailAddress
      if (!email) continue
      const displayName =
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
        user.username ||
        email
      map.set(email, { displayName, avatarUrl: user.imageUrl ?? null })
    }
    return map
  } catch {
    return new Map()
  }
}

async function verifyAccess(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })
  if (!project) return false
  if (project.ownerId === userId) return true

  const user = await (await clerkClient()).users.getUser(userId)
  const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
  if (!email) return false

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { id: true },
  })
  return !!collaborator
}

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/projects/[projectId]/collaborators'>
) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await ctx.params

  const hasAccess = await verifyAccess(projectId, userId)
  if (!hasAccess) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const records = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  })

  const emails = records.map((r) => r.email)
  const clerkMap = await enrichWithClerk(emails)

  const collaborators: CollaboratorInfo[] = records.map((r) => {
    const enriched = clerkMap.get(r.email)
    return {
      id: r.id,
      email: r.email,
      displayName: enriched?.displayName ?? r.email,
      avatarUrl: enriched?.avatarUrl ?? null,
    }
  })

  return Response.json({ collaborators })
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/projects/[projectId]/collaborators'>
) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await ctx.params

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

  let email: string
  try {
    const body = await request.json()
    if (typeof body.email !== 'string' || !body.email.includes('@')) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 })
    }
    email = body.email.trim().toLowerCase()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const existing = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { id: true },
  })
  if (existing) {
    return Response.json({ error: 'Already a collaborator' }, { status: 409 })
  }

  let record: { id: string; email: string }
  try {
    record = await prisma.projectCollaborator.create({
      data: { projectId, email },
      select: { id: true, email: true },
    })
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return Response.json({ error: 'Already a collaborator' }, { status: 409 })
    }
    throw error
  }

  const clerkMap = await enrichWithClerk([record.email])
  const enriched = clerkMap.get(record.email)

  const collaborator: CollaboratorInfo = {
    id: record.id,
    email: record.email,
    displayName: enriched?.displayName ?? record.email,
    avatarUrl: enriched?.avatarUrl ?? null,
  }

  return Response.json({ collaborator }, { status: 201 })
}
