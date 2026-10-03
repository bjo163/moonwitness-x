'use client'

import React, { useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'

import type { OutboxEvent } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  events: OutboxEvent[]
  loading: boolean
  onRefresh: () => void
}

const OutboxQueueTab: React.FC<Props> = ({ events, loading, onRefresh }) => {
  const t = useCommonTranslations()
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const handleRetry = async (eventId: string) => {
    setRetryingId(eventId)

    try {
      const res = await fetch('/api/apps/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retry_outbox',
          event_id: eventId
        })
      })

      if (res.ok) {
        onRefresh()
      }
    } finally {
      setRetryingId(null)
    }
  }

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Chip size='small' label={t.erpOutboxCompleted} color='success' variant='tonal' />
      case 'PENDING':
        return <Chip size='small' label={t.erpOutboxPending} color='warning' variant='tonal' />
      case 'PROCESSING':
        return <Chip size='small' label={t.erpOutboxProcessing} color='info' variant='tonal' />
      case 'FAILED':
        return <Chip size='small' label={t.erpOutboxFailed} color='error' variant='tonal' />
      case 'DEAD_LETTER':
        return <Chip size='small' label={t.erpOutboxDeadLetter} color='error' variant='filled' />
      default:
        return <Chip size='small' label={status} variant='tonal' />
    }
  }

  return (
    <Card elevation={2}>
      <CardHeader
        title={t.erpOutboxTitle}
        subheader={t.erpOutboxDescription}
        action={
          <Button
            variant='outlined'
            size='small'
            startIcon={loading ? <CircularProgress size={16} /> : <i className='tabler-refresh' />}
            onClick={onRefresh}
            disabled={loading}
          >
            {t.erpRefreshQueue}
          </Button>
        }
      />
      <CardContent className='p-0'>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t.erpEventType}</TableCell>
              <TableCell>{t.erpTargetService}</TableCell>
              <TableCell>{t.erpIdempotencyKey}</TableCell>
              <TableCell>{t.erpStatus}</TableCell>
              <TableCell>{t.erpDeliveryAttempts}</TableCell>
              <TableCell>{t.erpCreatedDelivered}</TableCell>
              <TableCell align='right'>{t.erpOperatorAction}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-textSecondary'>
                  {loading ? t.erpPollingOutbox : t.erpNoOutboxEvents}
                </TableCell>
              </TableRow>
            ) : (
              events.map(e => (
                <TableRow key={e.id} hover>
                  <TableCell className='font-mono font-bold text-primary'>{e.eventType}</TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={e.targetService === 'radius' ? t.erpGoToughRadius : t.erpGoRunner}
                      color={e.targetService === 'radius' ? 'primary' : 'info'}
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption' className='font-mono text-textSecondary truncate max-w-[200px] block'>
                      {e.idempotencyKey}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(e.status)}
                    {e.lastError && (
                      <Tooltip title={e.lastError}>
                        <Typography
                          variant='caption'
                          color='error.main'
                          className='block mt-0.5 max-w-[180px] truncate cursor-pointer'
                        >
                          {t.erpError}: {e.lastError}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell className='font-mono font-medium'>
                    {e.attempts} / {e.maxAttempts}
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption' className='block text-textSecondary'>
                      {t.erpSent}: {e.createdAt ? new Date(e.createdAt).toLocaleTimeString() : '-'}
                    </Typography>
                    {e.completedAt && (
                      <Typography variant='caption' className='block text-success'>
                        {t.erpAcknowledged}: {new Date(e.completedAt).toLocaleTimeString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {e.status === 'FAILED' || e.status === 'DEAD_LETTER' ? (
                      <Button
                        variant='tonal'
                        color='warning'
                        size='small'
                        startIcon={
                          retryingId === e.id ? (
                            <CircularProgress size={12} color='inherit' />
                          ) : (
                            <i className='tabler-rotate-clockwise' />
                          )
                        }
                        onClick={() => handleRetry(e.id)}
                        disabled={retryingId === e.id}
                      >
                        {t.erpRetryNow}
                      </Button>
                    ) : (
                      <Chip size='small' label={t.erpDurable} variant='outlined' sx={{ height: 22 }} />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default OutboxQueueTab
