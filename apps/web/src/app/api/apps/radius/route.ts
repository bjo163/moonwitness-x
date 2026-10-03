import { NextResponse } from 'next/server'

const RADIUS_URL = process.env.RADIUS_SERVICE_URL || 'http://127.0.0.1:5170'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint') || 'overview'

  try {
    const res = await fetch(`${RADIUS_URL}/api/v1/radius/${endpoint}`, {
      cache: 'no-store'
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (err) {
    console.warn('[RADIUS-API] Failed to fetch from Radius server:', err)
  }

  // Graceful fallback
  return NextResponse.json({
    activeSessions: 0,
    totalSubscribers: 0,
    totalNas: 0,
    totalProfiles: 0,
    totalUploadMb: 0,
    totalDownloadMb: 0,
    serverUptime: '0s',
    engine: 'ToughRADIUS Go Engine'
  })
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint') || 'test-auth'

  try {
    const body = await req.json()
    const res = await fetch(`${RADIUS_URL}/api/v1/radius/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
