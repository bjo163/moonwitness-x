export type WorkloadRuntime = 'microvm' | 'docker' | 'wasm'
export type WorkloadStatus = 'running' | 'stopped' | 'starting' | 'error'

export interface Workload {
  id: string
  name: string
  description: string
  runtime: WorkloadRuntime
  status: WorkloadStatus
  imageOrRepo: string
  port?: number
  endpoint?: string
  cpuUsage: number // percentage
  memoryUsageMb: number // MB
  memoryLimitMb: number // MB
  uptime: string
  coldStartTimeMs?: number // e.g. 88ms for microvm
  ttlRemaining?: string // for ephemeral temps.sh workloads
  logs: string[]
  createdAt: string
}

export interface WorkloadClusterStats {
  totalWorkloads: number
  runningWorkloads: number
  microVmCount: number
  dockerCount: number
  totalMemoryAllocatedMb: number
  avgColdStartMs: number
  hypervisorStatus: string
}
