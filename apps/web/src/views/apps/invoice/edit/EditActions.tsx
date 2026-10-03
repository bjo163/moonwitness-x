'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'

// Type Imports
import CustomTextField from '@moonwitness/ui/text-field'

import type { Locale } from '@configs/i18n'

// Component Imports
import AddPaymentDrawer from '@views/apps/invoice/shared/AddPaymentDrawer'
import SendInvoiceDrawer from '@views/apps/invoice/shared/SendInvoiceDrawer'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const EditActions = ({ id }: { id: string }) => {
  const t = useCommonTranslations()

  // States
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false)
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false)

  // Hooks
  const { lang: locale } = useParams()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Button
              fullWidth
              variant='contained'
              className='capitalize'
              startIcon={<i className='tabler-send' />}
              onClick={() => setSendDrawerOpen(true)}
            >
              {t.invoiceSend}
            </Button>
            <div className='flex items-center gap-4'>
              <Button
                fullWidth
                component={Link}
                color='secondary'
                variant='tonal'
                className='capitalize'
                href={getLocalizedUrl(`/apps/invoice/preview/${id}`, locale as Locale)}
              >
                {t.invoicePreview}
              </Button>
              <Button fullWidth color='secondary' variant='tonal' className='capitalize'>
                {t.invoiceSave}
              </Button>
            </div>
            <Button
              fullWidth
              color='success'
              variant='contained'
              className='capitalize'
              onClick={() => setPaymentDrawerOpen(true)}
              startIcon={<i className='tabler-currency-dollar' />}
            >
              {t.invoiceAddPayment}
            </Button>
          </CardContent>
        </Card>
        <AddPaymentDrawer open={paymentDrawerOpen} handleClose={() => setPaymentDrawerOpen(false)} />
        <SendInvoiceDrawer open={sendDrawerOpen} handleClose={() => setSendDrawerOpen(false)} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <CustomTextField select fullWidth defaultValue='internet-banking' label={t.invoiceAcceptPaymentsVia}>
          <MenuItem value='internet-banking'>{t.invoiceInternetBanking}</MenuItem>
          <MenuItem value='debit-card'>{t.invoiceDebitCard}</MenuItem>
          <MenuItem value='credit-card'>{t.invoiceCreditCard}</MenuItem>
          <MenuItem value='paypal'>{t.invoicePaypal}</MenuItem>
          <MenuItem value='upi-transfer'>{t.invoiceUpiTransfer}</MenuItem>
        </CustomTextField>
        <div className='flex items-center justify-between gap-6 mbs-3'>
          <InputLabel htmlFor='invoice-edit-payment-terms' className='cursor-pointer'>
            {t.invoicePaymentTerms}
          </InputLabel>
          <Switch defaultChecked id='invoice-edit-payment-terms' />
        </div>
        <div className='flex items-center justify-between gap-6'>
          <InputLabel htmlFor='invoice-edit-client-notes' className='cursor-pointer'>
            {t.invoiceClientNotes}
          </InputLabel>
          <Switch id='invoice-edit-client-notes' />
        </div>
        <div className='flex items-center justify-between gap-6'>
          <InputLabel htmlFor='invoice-edit-payment-stub' className='cursor-pointer'>
            {t.invoicePaymentStub}
          </InputLabel>
          <Switch id='invoice-edit-payment-stub' />
        </div>
      </Grid>
    </Grid>
  )
}

export default EditActions
