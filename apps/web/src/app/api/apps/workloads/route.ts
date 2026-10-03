import { NextResponse } from 'next/server'
import type { Workload, WorkloadClusterStats } from '@/views/apps/workloads/types'

const RUNNER_URL = process.env.RUNNER_SERVICE_URL || 'http://127.0.0.1:5160'

export async function GET() {
  try {
    const res = await fetch(`${RUNNER_URL}/api/v1/runner/workloads`, {
      cache: 'no-store'
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (err) {
    console.warn('[WORKLOADS-API] Runner not reachable at', RUNNER_URL, err)
  }

  // Graceful fallback if runner is temporarily offline
  const fallbackStats: WorkloadClusterStats = {
    totalWorkloads: 0,
    runningWorkloads: 0,
    microVmCount: 0,
    dockerCount: 0,
    totalMemoryAllocatedMb: 0,
    avgColdStartMs: 84,
    hypervisorStatus: 'Runner Offline (Start via `just serve-runner`)'
  }
  return NextResponse.json({ workloads: [], stats: fallbackStats })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, payload } = body

    if (action === 'toggle-status') {
      const { id, currentStatus } = payload
      const nextAction = currentStatus === 'running' ? 'stop' : 'start'

      const res = await fetch(`${RUNNER_URL}/api/v1/runner/workloads/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextAction, id })
      })

      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    if (action === 'restart') {
      const { id } = payload
      const res = await fetch(`${RUNNER_URL}/api/v1/runner/workloads/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart', id })
      })

      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    if (action === 'delete') {
      const { id } = payload
      const res = await fetch(`${RUNNER_URL}/api/v1/runner/workloads/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      })

      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    if (action === 'deploy') {
      const res = await fetch(`${RUNNER_URL}/api/v1/runner/workloads/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
