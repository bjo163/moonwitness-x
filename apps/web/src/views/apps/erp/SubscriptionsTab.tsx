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
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'

import type { SaleSubscription } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  subscriptions: SaleSubscription[]
  loading: boolean
  onRefresh: () => void
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}

const SubscriptionsTab: React.FC<Props> = ({ subscriptions, loading, onRefresh }) => {
  const t = useCommonTranslations()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [suspendDialogSub, setSuspendDialogSub] = useState<SaleSubscription | null>(null)
  const [suspendReason, setSuspendReason] = useState('')

  const handleSuspend = async () => {
    if (!suspendDialogSub) return
    setActionLoading(suspendDialogSub.id)

    try {
      const res = await fetch('/api/apps/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suspend_sub',
          subscription_id: suspendDialogSub.id,
          reason: suspendReason
        })
      })

      if (res.ok) {
        setSuspendDialogSub(null)
        onRefresh()
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleResume = async (sub: SaleSubscription) => {
    setActionLoading(sub.id)

    try {
      const res = await fetch('/api/apps/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume_sub',
          subscription_id: sub.id
        })
      })

      if (res.ok) {
        onRefresh()
      }
    } finally {
      setActionLoading(null)
    }
  }

  const getStateChip = (state: string) => {
    switch (state) {
      case 'active':
        return <Chip size='small' label={t.erpStatusActive} color='success' variant='tonal' />
      case 'suspended':
        return <Chip size='small' label={t.erpStatusSuspended} color='error' variant='tonal' />
      case 'isolated':
        return <Chip size='small' label={t.erpStatusIsolated} color='warning' variant='tonal' />
      case 'paused':
        return <Chip size='small' label={t.erpStatusPaused} color='info' variant='tonal' />
      default:
        return <Chip size='small' label={state} variant='tonal' />
    }
  }

  return (
    <Card elevation={2}>
      <CardHeader
        title={t.erpRecurringContracts}
        subheader={t.erpSubscriptionDescription}
        action={
          <Button
            variant='outlined'
            size='small'
            startIcon={loading ? <CircularProgress size={16} /> : <i className='tabler-refresh' />}
            onClick={onRefresh}
            disabled={loading}
          >
            {t.commonRefresh}
          </Button>
        }
      />
      <CardContent className='p-0'>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t.erpSubscriptionNumber}</TableCell>
              <TableCell>{t.erpCustomerSubscriber}</TableCell>
              <TableCell>{t.erpMonthlyRate}</TableCell>
              <TableCell>{t.erpTechnicalServiceProfile}</TableCell>
              <TableCell>{t.erpNextBillingDate}</TableCell>
              <TableCell>{t.erpStatus}</TableCell>
              <TableCell align='right'>{t.erpLifecycleAction}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-textSecondary'>
                  {loading ? t.erpLoadingContracts : t.erpNoSubscriptions}
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map(sub => (
                <TableRow key={sub.id} hover>
                  <TableCell className='font-mono font-bold text-primary'>{sub.number}</TableCell>
                  <TableCell>
                    <Typography variant='body2' className='font-semibold'>
                      {sub.partner_name}
                    </Typography>
                    {sub.technical_reference && (
                      <Typography variant='caption' color='text.secondary'>
                        {t.erpUser}: <span className='font-mono font-medium'>{sub.technical_reference}</span>
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell className='font-bold text-textPrimary'>{formatCurrency(sub.mrr)}</TableCell>
                  <TableCell>
                    <Box className='flex items-center gap-1.5'>
                      <Chip
                        size='small'
                        label={sub.technical_service === 'isp_radius' ? t.erpToughRadius : t.erpDockerRunner}
                        color={sub.technical_service === 'isp_radius' ? 'primary' : 'info'}
                        variant='outlined'
                      />
                      {sub.technical_profile && (
                        <Typography variant='caption' className='font-mono bg-actionHover px-1.5 py-0.5 rounded'>
                          {sub.technical_profile}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption' color='text.secondary'>
                      {sub.next_invoice_at ? new Date(sub.next_invoice_at).toLocaleDateString() : t.erpAutoRenewing}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStateChip(sub.state)}</TableCell>
                  <TableCell align='right'>
                    {sub.state === 'active' ? (
                      <Tooltip title={t.erpSuspendTooltip}>
                        <Button
                          variant='tonal'
                          color='error'
                          size='small'
                          startIcon={
                            actionLoading === sub.id ? (
                              <CircularProgress size={14} color='inherit' />
                            ) : (
                              <i className='tabler-ban' />
                            )
                          }
                          onClick={() => setSuspendDialogSub(sub)}
                          disabled={actionLoading === sub.id}
                        >
                          {t.erpSuspend}
                        </Button>
                      </Tooltip>
                    ) : (
                      <Tooltip title={t.erpResumeTooltip}>
                        <Button
                          variant='tonal'
                          color='success'
                          size='small'
                          startIcon={
                            actionLoading === sub.id ? (
                              <CircularProgress size={14} color='inherit' />
                            ) : (
                              <i className='tabler-player-play' />
                            )
                          }
                          onClick={() => handleResume(sub)}
                          disabled={actionLoading === sub.id}
                        >
                          {t.erpResume}
                        </Button>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Suspend Confirmation Dialog */}
      <Dialog open={Boolean(suspendDialogSub)} onClose={() => setSuspendDialogSub(null)} maxWidth='xs' fullWidth>
        <DialogTitle className='font-bold text-error flex items-center gap-2'>
          <i className='tabler-alert-triangle text-xl' /> {t.erpSuspendTitle}
        </DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          <Typography variant='body2'>
            {t.erpSuspendConfirm} <strong className='font-mono'>{suspendDialogSub?.number}</strong> {t.erpFor}{' '}
            <strong>{suspendDialogSub?.partner_name}</strong>?
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {t.erpSuspendDetails} <strong>{t.erpRadiusServicePath}</strong> {t.erpSuspendDetailsSuffix}
          </Typography>
          <TextField
            label={t.erpSuspensionReason}
            fullWidth
            size='small'
            value={suspendReason}
            onChange={e => setSuspendReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendDialogSub(null)} color='secondary'>
            {t.commonCancel}
          </Button>
          <Button onClick={handleSuspend} variant='contained' color='error'>
            {t.erpConfirmDisconnect}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default SubscriptionsTab
