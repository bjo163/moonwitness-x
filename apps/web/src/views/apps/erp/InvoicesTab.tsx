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
import CircularProgress from '@mui/material/CircularProgress'

import type { AccountMove } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  invoices: AccountMove[]
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

const InvoicesTab: React.FC<Props> = ({ invoices, loading, onRefresh }) => {
  const t = useCommonTranslations()
  const [payingId, setPayingId] = useState<string | null>(null)

  const handlePayInvoice = async (invoiceId: string) => {
    setPayingId(invoiceId)

    try {
      const res = await fetch('/api/apps/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay_invoice',
          invoice_id: invoiceId,
          payment_method: 'Bank Transfer BCA / Virtual Account'
        })
      })

      if (res.ok) {
        onRefresh()
      }
    } finally {
      setPayingId(null)
    }
  }

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'paid':
        return <Chip size='small' label={t.erpPaidInFull} color='success' variant='tonal' />
      case 'posted':
        return <Chip size='small' label={t.erpPostedUnpaid} color='warning' variant='tonal' />
      case 'overdue':
        return <Chip size='small' label={t.erpOverdue} color='error' variant='tonal' />
      default:
        return <Chip size='small' label={state} variant='tonal' />
    }
  }

  return (
    <Card elevation={2}>
      <CardHeader
        title={t.erpBillingTitle}
        subheader={t.erpBillingDescription}
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
              <TableCell>{t.erpInvoiceNumber}</TableCell>
              <TableCell>{t.erpCustomer}</TableCell>
              <TableCell>{t.erpInvoiceDate}</TableCell>
              <TableCell>{t.erpDueDate}</TableCell>
              <TableCell>{t.erpTotalDue}</TableCell>
              <TableCell>{t.erpStatus}</TableCell>
              <TableCell align='right'>{t.erpReconciliation}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-textSecondary'>
                  {loading ? t.erpLoadingInvoices : t.erpNoInvoices}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map(inv => (
                <TableRow key={inv.id} hover>
                  <TableCell className='font-mono font-bold text-primary'>{inv.number}</TableCell>
                  <TableCell className='font-semibold'>{inv.partner_name}</TableCell>
                  <TableCell>
                    <Typography variant='caption' color='text.secondary'>
                      {new Date(inv.invoice_date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant='caption'
                      color={inv.state === 'overdue' ? 'error.main' : 'text.secondary'}
                      className='font-medium'
                    >
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : t.erpImmediate}
                    </Typography>
                  </TableCell>
                  <TableCell className='font-bold text-textPrimary'>{formatCurrency(inv.total_amount)}</TableCell>
                  <TableCell>{getStatusBadge(inv.state)}</TableCell>
                  <TableCell align='right'>
                    {inv.state !== 'paid' ? (
                      <Button
                        variant='contained'
                        color='primary'
                        size='small'
                        startIcon={
                          payingId === inv.id ? (
                            <CircularProgress size={14} color='inherit' />
                          ) : (
                            <i className='tabler-credit-card' />
                          )
                        }
                        onClick={() => handlePayInvoice(inv.id)}
                        disabled={payingId === inv.id}
                      >
                        {t.erpRecordPayment}
                      </Button>
                    ) : (
                      <Box className='flex items-center justify-end gap-1 text-success'>
                        <i className='tabler-circle-check text-lg' />
                        <Typography variant='caption' className='font-semibold text-success'>
                          {t.erpSettled} {inv.payment_date ? new Date(inv.payment_date).toLocaleDateString() : ''}
                        </Typography>
                      </Box>
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

export default InvoicesTab
