'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'

// Type Imports
import CustomTextField from '@moonwitness/ui/text-field'

import type { ThemeColor } from '@core/types'

// Component Imports
import DialogCloseButton from '../DialogCloseButton'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type BillingCardData = {
  cardNumber?: string
  name?: string
  expiryDate?: string
  cardCvv?: string
  imgSrc?: string
  imgAlt?: string
  cardStatus?: string
  badgeColor?: ThemeColor
}

type BillingCardProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: BillingCardData
}

const initialCardData: BillingCardProps['data'] = {
  cardNumber: '',
  name: '',
  expiryDate: '',
  cardCvv: '',
  imgSrc: '',
  imgAlt: '',
  cardStatus: '',
  badgeColor: 'primary'
}

const BillingCard = ({ open, setOpen, data }: BillingCardProps) => {
  const t = useCommonTranslations()

  // States
  const [cardData, setCardData] = useState(initialCardData)

  const handleClose = () => {
    setOpen(false)
    setCardData(initialCardData)
  }

  useEffect(() => {
    setCardData(data ?? initialCardData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex flex-col gap-2 text-center p-6 sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {data ? t.editCard : t.addNewCard}
        <Typography component='span' className='flex flex-col text-center'>
          {data ? t.editSavedCardDetails : t.addCardFutureBilling}
        </Typography>
      </DialogTitle>
      <form onSubmit={e => e.preventDefault()}>
        <DialogContent className='overflow-visible pbs-0 p-6 sm:pli-16'>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                name='number'
                autoComplete='off'
                label={t.cardNumber}
                placeholder={t.cardNumberPlaceholder}
                value={cardData.cardNumber}
                onChange={e => setCardData({ ...cardData, cardNumber: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                name='name'
                label={t.nameOnCard}
                autoComplete='off'
                placeholder={t.cardNamePlaceholder}
                value={cardData.name}
                onChange={e => setCardData({ ...cardData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <CustomTextField
                fullWidth
                name='expiry'
                autoComplete='off'
                label={t.expiry}
                placeholder={t.expiryDatePlaceholder}
                value={cardData.expiryDate}
                onChange={e => setCardData({ ...cardData, expiryDate: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <CustomTextField
                fullWidth
                name='cvv'
                label={t.cvv}
                autoComplete='off'
                placeholder='123'
                value={cardData.cardCvv}
                onChange={e => setCardData({ ...cardData, cardCvv: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel control={<Switch defaultChecked />} label={t.saveCardFutureBilling} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 p-6 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit' onClick={handleClose}>
            {data ? t.update : t.submit}
          </Button>
          <Button variant='tonal' type='reset' color='secondary' onClick={handleClose}>
            {t.cancel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default BillingCard
