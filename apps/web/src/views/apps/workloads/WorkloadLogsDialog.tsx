'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// Custom Components
import CustomChip from '@moonwitness/ui/chip'

import type { Workload } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  open: boolean
  workload: Workload | null
  onClose: () => void
}

export default function WorkloadLogsDialog({ open, workload, onClose }: Props) {
  const t = useCommonTranslations()
  const [copied, setCopied] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !workload) return

    setLogs(workload.logs || [])
    setLoading(true)

    // Fetch fresh live logs from the runner
    fetch(`/api/apps/workloads/logs?id=${encodeURIComponent(workload.id)}`)
      .then(res => res.json())
      .then(data => {
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs)
        }
      })
      .catch(err => console.warn('Failed to fetch live logs:', err))
      .finally(() => setLoading(false))
  }, [open, workload])

  if (!workload) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <i className='tabler-terminal text-primary text-xl' />
          <Typography variant='h6' component='span'>
            {t.workloadsLogs}: {workload.name}
          </Typography>
          <CustomChip
            label={
              workload.runtime === 'docker'
                ? t.workloadsRuntimeDockerEngine
                : workload.runtime === 'microvm'
                  ? t.workloadsRuntimeFirecracker
                  : t.workloadsRuntimeHost
            }
            size='small'
            color={workload.runtime === 'docker' ? 'info' : 'primary'}
            variant='tonal'
          />
        </div>
        <IconButton size='small' onClick={onClose}>
          <i className='tabler-x' />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && logs.length === 0 ? (
          <Box className='flex justify-center p-8'>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box
            sx={{
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '13px',
              p: 3,
              borderRadius: 1,
              maxHeight: '400px',
              overflowY: 'auto',
              lineHeight: 1.6
            }}
          >
            {logs.map((line, idx) => {
              const isError = line.toLowerCase().includes('err') || line.toLowerCase().includes('fail')

              const isOk =
                line.toLowerCase().includes('ok') ||
                line.toLowerCase().includes('ready') ||
                line.toLowerCase().includes('up')

              const color = isError ? '#f87171' : isOk ? '#4ade80' : '#e2e8f0'

              return (
                <div key={idx} style={{ color }}>
                  <span style={{ color: '#64748b', marginRight: '8px' }}>[{String(idx + 1).padStart(2, '0')}]</span>
                  {line}
                </div>
              )
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions className='justify-between px-6'>
        <Typography variant='caption' color='text.secondary'>
          {t.workloadsEndpoint}: {workload.endpoint || t.workloadsInternalLoopback} | {t.workloadsStatusLabel}:{' '}
          {
            t[
              workload.status === 'running'
                ? 'workloadsStatusRunning'
                : workload.status === 'starting'
                  ? 'workloadsStatusStarting'
                  : 'workloadsStatusStopped'
            ]
          }
        </Typography>
        <div className='flex gap-2'>
          <Button
            size='small'
            variant='outlined'
            startIcon={<i className={copied ? 'tabler-check' : 'tabler-copy'} />}
            onClick={handleCopy}
          >
            {copied ? t.workloadsCopied : t.workloadsCopyLogs}
          </Button>
          <Button size='small' variant='contained' onClick={onClose}>
            {t.commonClose}
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  )
}
