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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'

import type { CrmLead, Partner } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  leads: CrmLead[]
  partners: Partner[]
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

const CrmPipelineTab: React.FC<Props> = ({ leads, partners, loading, onRefresh }) => {
  const t = useCommonTranslations()
  const [openCreate, setOpenCreate] = useState(false)
  const [name, setName] = useState('')
  const [partnerId, setPartnerId] = useState(partners[0]?.id || '')
  const [expectedRevenue, setExpectedRevenue] = useState(2500000)
  const [probability, setProbability] = useState(60)
  const [submitting, setSubmitting] = useState(false)

  const handleCreateLead = async () => {
    if (!name) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/apps/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_lead',
          name,
          partner_id: partnerId || null,
          expected_revenue: expectedRevenue,
          probability,
          stage: 'new'
        })
      })

      if (res.ok) {
        setOpenCreate(false)
        setName('')
        onRefresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'won':
        return <Chip size='small' label={t.erpStageWon} color='success' variant='tonal' />
      case 'lost':
        return <Chip size='small' label={t.erpStageLost} color='error' variant='tonal' />
      case 'proposition':
        return <Chip size='small' label={t.erpStageProposition} color='warning' variant='tonal' />
      case 'qualified':
        return <Chip size='small' label={t.erpStageQualified} color='info' variant='tonal' />
      default:
        return <Chip size='small' label={t.erpStageNew} color='secondary' variant='tonal' />
    }
  }

  return (
    <>
      <Card elevation={2}>
        <CardHeader
          title={t.erpCrmTitle}
          subheader={t.erpCrmDescription}
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
                onClick={() => setOpenCreate(true)}
              >
                {t.erpNewOpportunity}
              </Button>
            </Box>
          }
        />
        <CardContent className='p-0'>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t.erpOpportunityTitle}</TableCell>
                <TableCell>{t.erpAssociatedCustomer}</TableCell>
                <TableCell>{t.erpExpectedDealValue}</TableCell>
                <TableCell>{t.erpProbability}</TableCell>
                <TableCell>{t.erpStage}</TableCell>
                <TableCell>{t.erpCreatedDate}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8 text-textSecondary'>
                    {loading ? t.erpLoadingOpportunities : t.erpNoOpportunities}
                  </TableCell>
                </TableRow>
              ) : (
                leads.map(lead => (
                  <TableRow key={lead.id} hover>
                    <TableCell>
                      <Typography variant='body2' className='font-bold text-textPrimary'>
                        {lead.name}
                      </Typography>
                      {lead.contact_name && (
                        <Typography variant='caption' color='text.secondary'>
                          {t.erpContact}: {lead.contact_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell className='font-medium'>{lead.partner_name || t.erpProspectNoContact}</TableCell>
                    <TableCell className='font-bold text-primary'>{formatCurrency(lead.expected_revenue)}</TableCell>
                    <TableCell>
                      <Box className='flex items-center gap-1.5'>
                        <Typography variant='body2' className='font-mono'>
                          {lead.probability}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getStageBadge(lead.stage)}</TableCell>
                    <TableCell>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(lead.created_at).toLocaleDateString('id-ID')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Lead Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth='xs' fullWidth>
        <DialogTitle className='font-bold flex items-center gap-2'>
          <i className='tabler-target-arrow text-primary text-xl' /> {t.erpLogOpportunity}
        </DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          <TextField
            label={t.erpOpportunityTitle}
            fullWidth
            size='small'
            placeholder={t.erpOpportunityPlaceholder}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <TextField
            select
            label={t.erpCustomer}
            fullWidth
            size='small'
            value={partnerId}
            onChange={e => setPartnerId(e.target.value)}
          >
            {partners.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type='number'
            label={t.erpExpectedRevenueIdr}
            fullWidth
            size='small'
            value={expectedRevenue}
            onChange={e => setExpectedRevenue(parseFloat(e.target.value) || 0)}
          />
          <TextField
            type='number'
            label={t.erpProbabilityPercent}
            fullWidth
            size='small'
            value={probability}
            onChange={e => setProbability(parseInt(e.target.value, 10) || 0)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} color='secondary'>
            {t.commonCancel}
          </Button>
          <Button onClick={handleCreateLead} variant='contained' disabled={submitting || !name}>
            {submitting ? t.erpSaving : t.erpCreateOpportunity}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CrmPipelineTab
