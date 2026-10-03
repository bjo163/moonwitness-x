'use client'

import React from 'react'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

import type { ErpOverviewStats } from './types'

interface Props {
  stats: ErpOverviewStats | null
}

const formatCurrency = (val: number, cur: string = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: cur,
    maximumFractionDigits: 0
  }).format(val)
}

const ErpHeaderStats: React.FC<Props> = ({ stats }) => {
  const t = useCommonTranslations()

  return (
    <Grid container spacing={6} className='mbe-6'>
      {/* 1. Monthly Recurring Revenue (MRR) */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card elevation={2}>
          <CardContent className='flex justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' className='uppercase font-semibold text-textSecondary tracking-wider'>
                {t.erpMonthlyRecurring}
              </Typography>
              <Typography variant='h4' color='primary' className='font-bold'>
                {formatCurrency(stats?.mrr || 0, stats?.currency)}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {t.erpOngoingRevenue}
              </Typography>
            </div>
            <Avatar variant='rounded' className='bg-primaryLight text-primary p-2' sx={{ width: 48, height: 48 }}>
              <i className='tabler-chart-arrows text-2xl' />
            </Avatar>
          </CardContent>
        </Card>
      </Grid>

      {/* 2. Active Subscriptions */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card elevation={2}>
          <CardContent className='flex justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' className='uppercase font-semibold text-textSecondary tracking-wider'>
                {t.erpActiveSubscriptions}
              </Typography>
              <Typography variant='h4' color='success.main' className='font-bold'>
                {stats?.activeSubscriptions ?? 0}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {t.erpSubscriptionServices}
              </Typography>
            </div>
            <Avatar variant='rounded' className='bg-successLight text-success p-2' sx={{ width: 48, height: 48 }}>
              <i className='tabler-rotate-clockwise text-2xl' />
            </Avatar>
          </CardContent>
        </Card>
      </Grid>

      {/* 3. Customers & Leads */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card elevation={2}>
          <CardContent className='flex justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' className='uppercase font-semibold text-textSecondary tracking-wider'>
                {t.erpCustomersPipeline}
              </Typography>
              <Typography variant='h4' color='info.main' className='font-bold'>
                {stats?.totalCustomers ?? 0}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {stats?.openLeads ?? 0} {t.erpActiveOpportunities}
              </Typography>
            </div>
            <Avatar variant='rounded' className='bg-infoLight text-info p-2' sx={{ width: 48, height: 48 }}>
              <i className='tabler-users text-2xl' />
            </Avatar>
          </CardContent>
        </Card>
      </Grid>

      {/* 4. Transactional Outbox Sync */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card elevation={2}>
          <CardContent className='flex justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' className='uppercase font-semibold text-textSecondary tracking-wider'>
                {t.erpOutboxProvisioning}
              </Typography>
              <Box className='flex items-center gap-2'>
                <Typography variant='h4' color='warning.main' className='font-bold'>
                  {stats?.outbox.completed ?? 0}
                </Typography>
                <Chip
                  size='small'
                  label={stats?.outbox.pending ? `${stats.outbox.pending} ${t.erpQueue}` : t.erpSynced}
                  color={stats?.outbox.pending ? 'warning' : 'success'}
                  variant='tonal'
                />
              </Box>
              <Typography variant='caption' color='text.secondary'>
                {t.erpZeroLossSync}
              </Typography>
            </div>
            <Avatar variant='rounded' className='bg-warningLight text-warning p-2' sx={{ width: 48, height: 48 }}>
              <i className='tabler-send text-2xl' />
            </Avatar>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ErpHeaderStats
