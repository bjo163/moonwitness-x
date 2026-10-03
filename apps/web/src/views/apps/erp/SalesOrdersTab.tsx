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

import type { SaleOrder, Partner, ProductTemplate } from './types'
import CreateOrderDialog from './CreateOrderDialog'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  orders: SaleOrder[]
  partners: Partner[]
  products: ProductTemplate[]
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

const SalesOrdersTab: React.FC<Props> = ({ orders, partners, products, loading, onRefresh }) => {
  const t = useCommonTranslations()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)

  const handleConfirmOrder = async (orderId: string) => {
    setConfirmingId(orderId)

    try {
      const res = await fetch('/api/apps/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_order',
          order_id: orderId
        })
      })

      if (res.ok) {
        onRefresh()
      }
    } finally {
      setConfirmingId(null)
    }
  }

  const getStateChip = (state: string) => {
    switch (state) {
      case 'confirmed':
        return <Chip size='small' label={t.erpStatusConfirmed} color='success' variant='tonal' />
      case 'draft':
        return <Chip size='small' label={t.erpStatusDraft} color='secondary' variant='tonal' />
      case 'sent':
        return <Chip size='small' label={t.erpStatusQuotationSent} color='info' variant='tonal' />
      default:
        return <Chip size='small' label={state} variant='tonal' />
    }
  }

  return (
    <>
      <Card elevation={2}>
        <CardHeader
          title={t.erpSalesOrdersTitle}
          subheader={t.erpSalesOrdersDescription}
          action={
            <Box className='flex items-center gap-2'>
              <Button
                variant='outlined'
                size='small'
                startIcon={loading ? <CircularProgress size={16} /> : <i className='tabler-refresh' />}
                onClick={onRefresh}
                disabled={loading}
              >
                {t.commonRefresh}
              </Button>
              <Button
                variant='contained'
                size='small'
                startIcon={<i className='tabler-plus' />}
                onClick={() => setOpenCreateDialog(true)}
              >
                {t.erpCreateSalesOrder}
              </Button>
            </Box>
          }
        />
        <CardContent className='p-0'>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t.erpOrderNumber}</TableCell>
                <TableCell>{t.erpCustomer}</TableCell>
                <TableCell>{t.erpOrderDate}</TableCell>
                <TableCell>{t.erpOrderLines}</TableCell>
                <TableCell>{t.erpTotalContractAmount}</TableCell>
                <TableCell>{t.erpStatus}</TableCell>
                <TableCell align='right'>{t.erpCommercialAction}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-center py-8 text-textSecondary'>
                    {loading ? t.erpLoadingOrders : t.erpNoOrders}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => (
                  <TableRow key={order.id} hover>
                    <TableCell className='font-mono font-bold text-primary'>{order.number}</TableCell>
                    <TableCell className='font-semibold'>{order.partner_name}</TableCell>
                    <TableCell>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(order.order_date).toLocaleDateString('id-ID')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className='flex flex-col gap-1'>
                        {order.lines?.map(l => (
                          <Box key={l.id} className='flex items-center gap-1.5'>
                            <Chip
                              size='small'
                              label={l.line_kind === 'recurring' ? t.erpRecurring : t.erpOneOff}
                              color={l.line_kind === 'recurring' ? 'primary' : 'default'}
                              variant='outlined'
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                            <Typography variant='caption' className='font-medium'>
                              {l.name}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell className='font-bold text-textPrimary'>{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell>{getStateChip(order.state)}</TableCell>
                    <TableCell align='right'>
                      {order.state !== 'confirmed' ? (
                        <Tooltip title={t.erpConfirmOrderTooltip}>
                          <Button
                            variant='contained'
                            color='success'
                            size='small'
                            startIcon={
                              confirmingId === order.id ? (
                                <CircularProgress size={14} color='inherit' />
                              ) : (
                                <i className='tabler-check' />
                              )
                            }
                            onClick={() => handleConfirmOrder(order.id)}
                            disabled={confirmingId === order.id}
                          >
                            {t.erpConfirmOrder}
                          </Button>
                        </Tooltip>
                      ) : (
                        <Chip size='small' label={t.erpSpawnedSubscription} color='success' variant='outlined' />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateOrderDialog
        open={openCreateDialog}
        partners={partners}
        products={products}
        onClose={() => setOpenCreateDialog(false)}
        onCreated={() => {
          setOpenCreateDialog(false)
          onRefresh()
        }}
      />
    </>
  )
}

export default SalesOrdersTab
