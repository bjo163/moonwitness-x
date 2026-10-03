'use client'

import React, { useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'

import type { Partner, ProductTemplate } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  open: boolean
  partners: Partner[]
  products: ProductTemplate[]
  onClose: () => void
  onCreated: () => void
}

interface TempLine {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  lineKind: 'one_off' | 'recurring'
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}

const CreateOrderDialog: React.FC<Props> = ({ open, partners, products, onClose, onCreated }) => {
  const t = useCommonTranslations()
  const [partnerId, setPartnerId] = useState(partners[0]?.id || '')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Default lines: 1 hardware router + 1 recurring subscription
  const [lines, setLines] = useState<TempLine[]>([
    {
      productId: products.find(p => p.kind === 'one_off')?.id || '',
      name: t.erpDefaultRouterProduct,
      quantity: 1,
      unitPrice: 950000,
      lineKind: 'one_off'
    },
    {
      productId: products.find(p => p.kind === 'recurring')?.id || '',
      name: t.erpDefaultInternetProduct,
      quantity: 1,
      unitPrice: 1500000,
      lineKind: 'recurring'
    }
  ])

  const handleProductSelect = (index: number, pId: string) => {
    const prod = products.find(p => p.id === pId)

    if (!prod) return
    const updated = [...lines]

    updated[index] = {
      productId: prod.id,
      name: prod.name,
      quantity: 1,
      unitPrice: prod.list_price,
      lineKind: prod.kind
    }
    setLines(updated)
  }

  const handleAddLine = () => {
    const defaultProd = products[0]

    setLines(prev => [
      ...prev,
      {
        productId: defaultProd?.id || '',
        name: defaultProd?.name || t.erpCustomService,
        quantity: 1,
        unitPrice: defaultProd?.list_price || 100000,
        lineKind: defaultProd?.kind || 'one_off'
      }
    ])
  }

  const handleRemoveLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return lines.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0)
  }

  const handleSubmit = async () => {
    if (!partnerId || lines.length === 0) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/apps/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_order',
          partner_id: partnerId,
          notes,
          lines: lines.map(l => ({
            product_id: l.productId,
            name: l.name,
            quantity: l.quantity,
            unit_price: l.unitPrice,
            line_kind: l.lineKind
          }))
        })
      })

      if (res.ok) {
        onCreated()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle className='font-bold flex items-center gap-2'>
        <i className='tabler-file-invoice text-primary text-xl' /> {t.erpCreateNewSalesOrder}
      </DialogTitle>
      <DialogContent className='flex flex-col gap-5 pt-2'>
        <Box className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <TextField
            select
            label={t.erpSelectCustomer}
            fullWidth
            size='small'
            value={partnerId}
            onChange={e => setPartnerId(e.target.value)}
          >
            {partners.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} {p.city ? `(${p.city})` : ''}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={t.erpContractTermsNotes}
            fullWidth
            size='small'
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </Box>

        {/* Lines Table */}
        <Box className='border rounded'>
          <Box className='flex justify-between items-center px-4 py-2 bg-actionHover border-b'>
            <Typography variant='subtitle2' className='font-bold uppercase tracking-wider'>
              {t.erpCommercialLines}
            </Typography>
            <Button size='small' startIcon={<i className='tabler-plus' />} onClick={handleAddLine}>
              {t.erpAddLineItem}
            </Button>
          </Box>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>{t.erpProductService}</TableCell>
                <TableCell width='120'>{t.erpKind}</TableCell>
                <TableCell width='100'>{t.erpQuantity}</TableCell>
                <TableCell width='160'>{t.erpUnitPriceIdr}</TableCell>
                <TableCell width='160'>{t.erpSubtotal}</TableCell>
                <TableCell width='40' />
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <TextField
                      select
                      fullWidth
                      size='small'
                      value={line.productId}
                      onChange={e => handleProductSelect(idx, e.target.value)}
                    >
                      {products.map(p => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name} ({p.kind === 'recurring' ? t.erpRecurring : t.erpOneOff})
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={line.lineKind === 'recurring' ? t.erpSubscription : t.erpOneOff}
                      color={line.lineKind === 'recurring' ? 'primary' : 'default'}
                      variant='tonal'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type='number'
                      size='small'
                      value={line.quantity}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 1
                        const updated = [...lines]

                        updated[idx].quantity = val
                        setLines(updated)
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type='number'
                      size='small'
                      value={line.unitPrice}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0
                        const updated = [...lines]

                        updated[idx].unitPrice = val
                        setLines(updated)
                      }}
                    />
                  </TableCell>
                  <TableCell className='font-bold'>{formatCurrency(line.quantity * line.unitPrice)}</TableCell>
                  <TableCell>
                    <IconButton size='small' color='error' onClick={() => handleRemoveLine(idx)}>
                      <i className='tabler-trash text-lg' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box className='flex justify-end p-4 border-t bg-actionHover'>
            <Typography variant='h6' className='font-bold'>
              {t.erpTotalOrderValue}: <span className='text-primary'>{formatCurrency(calculateTotal())}</span>
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary'>
          {t.commonCancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={submitting || !partnerId || lines.length === 0}
          startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-check' />}
        >
          {submitting ? t.erpCreating : t.erpSaveDraftOrder}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateOrderDialog
