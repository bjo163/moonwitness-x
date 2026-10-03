import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const TIME_API_URL = process.env.TIME_SERVICE_URL || process.env.NEXT_PUBLIC_TIME_SERVICE_URL || 'http://127.0.0.1:5155'

// Global singleton for PrismaClient
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get('endpoint') || 'overview'

    // 1. Prisma ORM: Observation Stations
    if (endpoint === 'stations') {
      const stations = await prisma.observationStation.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' }
      })
      return NextResponse.json(stations)
    }

    // 2. Prisma ORM: Scripture Concordances
    if (endpoint === 'scriptures') {
      const scriptures = await prisma.cosmicScriptureConcordance.findMany({
        orderBy: { scripture: 'asc' }
      })
      return NextResponse.json(scriptures)
    }

    // 3. Proxy to Rust MTS Time Daemon: Gears Telemetry
    if (endpoint === 'time/gears' || endpoint === 'gears') {
      const res = await fetch(`${TIME_API_URL}/api/v1/time/gears`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        return NextResponse.json({ error: `MTS daemon error: HTTP ${res.status}` }, { status: res.status })
      }
      const data = await res.json()
      return NextResponse.json(data)
    }

    // 4. Proxy to Rust MTS Time Daemon: Hilal & Conjunction Evaluation
    if (endpoint === 'time/hilal' || endpoint === 'hilal') {
      const lat = searchParams.get('lat') || '-6.8252'
      const lon = searchParams.get('lon') || '107.6169'
      const elev = searchParams.get('elevation') || '1310'

      const res = await fetch(`${TIME_API_URL}/api/v1/time/hilal?lat=${lat}&lon=${lon}&elevation=${elev}`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        return NextResponse.json({ error: `MTS daemon error: HTTP ${res.status}` }, { status: res.status })
      }
      const data = await res.json()
      return NextResponse.json(data)
    }

    // 5. Proxy to Rust MTS Time Daemon: Time Now
    if (endpoint === 'time/now' || endpoint === 'now') {
      const res = await fetch(`${TIME_API_URL}/api/v1/time/now`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        return NextResponse.json({ error: `MTS daemon error: HTTP ${res.status}` }, { status: res.status })
      }
      const data = await res.json()
      return NextResponse.json(data)
    }

    // 6. Proxy to Rust MTS Time Daemon: Cosmic Engine
    if (endpoint === 'cosmic') {
      const res = await fetch(`${TIME_API_URL}/api/v1/cosmic`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        return NextResponse.json({ error: `MTS daemon error: HTTP ${res.status}` }, { status: res.status })
      }
      const data = await res.json()
      return NextResponse.json(data)
    }

    // 7. Proxy to Rust MTS Time Daemon: Next Conjunction
    if (endpoint === 'time/conjunction') {
      const res = await fetch(`${TIME_API_URL}/api/v1/time/conjunction/next`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        return NextResponse.json({ error: `MTS daemon error: HTTP ${res.status}` }, { status: res.status })
      }
      const data = await res.json()
      return NextResponse.json(data)
    }

    // 8. Proxy to Rust MTS Time Daemon: Prayer Times & Qibla
    if (endpoint === 'time/prayer-times' || endpoint === 'prayer-times') {
      const lat = searchParams.get('lat') || '-6.8252'
      const lon = searchParams.get('lon') || '107.6169'
      const elev = searchParams.get('elevation') || '1310'

      const res = await fetch(`${TIME_API_URL}/api/v1/time/prayer-times?lat=${lat}&lon=${lon}&elevation=${elev}`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        return NextResponse.json({ error: `MTS daemon error: HTTP ${res.status}` }, { status: res.status })
      }
      const data = await res.json()
      return NextResponse.json(data)
    }

    // 9. Proxy to Rust MTS Time Daemon: Saros Eclipse Prediction
    if (endpoint === 'time/eclipses' || endpoint === 'eclipses') {
      const res = await fetch(`${TIME_API_URL}/api/v1/time/eclipses`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        return NextResponse.json({ error: `MTS daemon error: HTTP ${res.status}` }, { status: res.status })
      }
      const data = await res.json()
      return NextResponse.json(data)
    }

    // 10. Aggregated Overview (Clock + Gears + Cosmic + Stations count)
    const [timeNowRes, gearsRes, stations] = await Promise.allSettled([
      fetch(`${TIME_API_URL}/api/v1/time/now`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`${TIME_API_URL}/api/v1/time/gears`, { cache: 'no-store' }).then(r => r.json()),
      prisma.observationStation.findMany({ where: { isActive: true } })
    ])

    return NextResponse.json({
      clock: timeNowRes.status === 'fulfilled' ? timeNowRes.value : null,
      gears: gearsRes.status === 'fulfilled' ? gearsRes.value : null,
      stations: stations.status === 'fulfilled' ? stations.value : [],
      status: 'online',
      time_daemon: TIME_API_URL
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to communicate with Moonwitness Celestial engine', details: error.message },
      { status: 502 }
    )
  }
}
