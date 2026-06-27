import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from '@prisma/extension-accelerate'
import pg from 'pg'

function createPrismaClient() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL is not configured')
  }

  if (url.startsWith('prisma+postgres://')) {
    return new PrismaClient({ accelerateUrl: url }).$extends(withAccelerate())
  }

  const pool = new pg.Pool({ connectionString: url })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  (createPrismaClient() as unknown as PrismaClient)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
