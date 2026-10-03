import { PrismaClient } from '@prisma/client'

// Singleton Prisma Client instance for Celestial OS
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export * from '@prisma/client'

/**
 * Helper to fetch all active rukyat observation stations
 */
export async function getActiveObservationStations() {
  return db.observationStation.findMany({
    where: { isActive: true },
    orderBy: { country: 'asc' }
  })
}

/**
 * Helper to fetch cosmic scripture concordance entries
 */
export async function getScriptureConcordances(scripture?: 'TAURAT' | 'ZABUR' | 'INJIL' | 'QURAN') {
  return db.cosmicScriptureConcordance.findMany({
    where: scripture ? { scripture } : undefined,
    orderBy: { scripture: 'asc' }
  })
}

/**
 * Helper to fetch upcoming celestial events
 */
export async function getUpcomingCelestialEvents(limit = 10) {
  return db.celestialEvent.findMany({
    where: {
      eventDateUtc: {
        gte: new Date()
      }
    },
    orderBy: { eventDateUtc: 'asc' },
    take: limit
  })
}
