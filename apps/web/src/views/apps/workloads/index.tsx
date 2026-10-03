'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import WorkloadHeaderStats from './WorkloadHeaderStats'
import WorkloadCards from './WorkloadCards'
import SpawnMicroVmDialog from './SpawnMicroVmDialog'
import DeployWorkloadDialog from './DeployWorkloadDialog'
import WorkloadLogsDialog from './WorkloadLogsDialog'
import type { Workload, WorkloadClusterStats } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

export default function WorkloadsDashboard() {
  const t = useCommonTranslations()
  const [workloads, setWorkloads] = useState<Workload[]>([])

  const [stats, setStats] = useState<WorkloadClusterStats>({
    totalWorkloads: 0,
    runningWorkloads: 0,
    microVmCount: 0,
    dockerCount: 0,
    totalMemoryAllocatedMb: 0,
    avgColdStartMs: 90,
    hypervisorStatus: 'Ready'
  })

  const [loading, setLoading] = useState(true)

  // Dialog states
  const [spawnOpen, setSpawnOpen] = useState(false)
  const [deployOpen, setDeployOpen] = useState(false)
  const [logsOpen, setLogsOpen] = useState(false)
  const [activeWorkloadForLogs, setActiveWorkloadForLogs] = useState<Workload | null>(null)

  const fetchWorkloads = async () => {
    try {
      const res = await fetch('/api/apps/workloads')

      if (res.ok) {
        const data = await res.json()

        setWorkloads(data.workloads || [])
        setStats(data.stats || stats)
      }
    } catch (err) {
      console.error('Failed to fetch workloads:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkloads()

    // Poll every 10s
    const interval = setInterval(fetchWorkloads, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const res = await fetch('/api/apps/workloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-status', payload: { id, currentStatus } })
      })

      if (res.ok) {
        fetchWorkloads()
      }
    } catch (err) {
      console.error('Toggle status error:', err)
    }
  }

  const handleRestart = async (id: string) => {
    try {
      const res = await fetch('/api/apps/workloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart', payload: { id } })
      })

      if (res.ok) {
        fetchWorkloads()
      }
    } catch (err) {
      console.error('Restart error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/apps/workloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', payload: { id } })
      })

      if (res.ok) {
        fetchWorkloads()
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleDeploy = async (payload: any) => {
    try {
      const res = await fetch('/api/apps/workloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deploy', payload })
      })

      if (res.ok) {
        fetchWorkloads()
      }
    } catch (err) {
      console.error('Deploy error:', err)
    }
  }

  const handleViewLogs = (workload: Workload) => {
    setActiveWorkloadForLogs(workload)
    setLogsOpen(true)
  }

  return (
    <Grid container spacing={6}>
      {/* Header bar with actions */}
      <Grid size={{ xs: 12 }}>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <Typography variant='h4' className='font-bold flex items-center gap-2'>
              <i className='tabler-cpu text-primary text-3xl' />
              {t.workloadsTitle}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {t.workloadsSubtitle}
            </Typography>
          </div>

          <div className='flex items-center gap-3'>
            <Button
              variant='outlined'
              startIcon={<i className='tabler-refresh' />}
              onClick={fetchWorkloads}
              size='small'
            >
              {t.commonRefresh}
            </Button>
            <Button
              variant='contained'
              color='warning'
              startIcon={<i className='tabler-bolt' />}
              onClick={() => setSpawnOpen(true)}
              size='small'
            >
              {t.workloadsSpawnMicroVm}
            </Button>
            <Button
              variant='contained'
              color='primary'
              startIcon={<i className='tabler-rocket' />}
              onClick={() => setDeployOpen(true)}
              size='small'
            >
              {t.workloadsDeployApp}
            </Button>
          </div>
        </div>
      </Grid>

      {/* Cluster Stats */}
      <Grid size={{ xs: 12 }}>
        <WorkloadHeaderStats stats={stats} />
      </Grid>

      {/* Workload Cards List */}
      <Grid size={{ xs: 12 }}>
        {loading ? (
          <Box className='flex justify-center p-12'>
            <CircularProgress />
          </Box>
        ) : (
          <WorkloadCards
            workloads={workloads}
            onToggleStatus={handleToggleStatus}
            onRestart={handleRestart}
            onDelete={handleDelete}
            onViewLogs={handleViewLogs}
          />
        )}
      </Grid>

      {/* Modals */}
      <SpawnMicroVmDialog open={spawnOpen} onClose={() => setSpawnOpen(false)} onSpawn={handleDeploy} />

      <DeployWorkloadDialog open={deployOpen} onClose={() => setDeployOpen(false)} onDeploy={handleDeploy} />

      <WorkloadLogsDialog open={logsOpen} workload={activeWorkloadForLogs} onClose={() => setLogsOpen(false)} />
    </Grid>
  )
}
