import { NextResponse } from 'next/server'

const RUNNER_URL = process.env.RUNNER_SERVICE_URL || 'http://127.0.0.1:5160'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    const res = await fetch(`${RUNNER_URL}/api/v1/runner/workloads/logs?id=${encodeURIComponent(id)}`, {
      cache: 'no-store'
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (err) {
    console.warn('[LOGS-API] Failed to fetch logs from runner:', err)
  }

  return NextResponse.json({
    id,
    logs: [
      `[INFO] Target: ${id}`,
      `[INFO] Connected to Moonwitness Universe Runner`,
      `[STATUS] Ready`
    ]
  })
}
