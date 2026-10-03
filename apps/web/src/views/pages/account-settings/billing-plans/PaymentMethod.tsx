'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Radio from '@mui/material/Radio'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import RadioGroup from '@mui/material/RadioGroup'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import type { ButtonProps } from '@mui/material/Button'

// Type Imports
import CustomTextField from '@moonwitness/ui/text-field'

import type { ThemeColor } from '@core/types'

// Component Imports
import BillingCard from '@components/dialogs/billing-card'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type DataType = {
  cardNumber?: string
  name?: string
  expiryDate?: string
  cardCvv?: string
  imgSrc?: string
  imgAlt?: string
  cardStatus?: 'primaryCard'
  badgeColor?: ThemeColor
}

// Vars
const data: DataType[] = [
  {
    cardCvv: '587',
    name: 'Tom McBride',
    expiryDate: '12/24',
    imgAlt: 'Mastercard',
    badgeColor: 'primary',
    cardStatus: 'primaryCard',
    cardNumber: '5577 0000 5577 9865',
    imgSrc: '/images/logos/mastercard.png'
  },
  {
    cardCvv: '681',
    name: 'Mildred Wagner',
    expiryDate: '02/24',
    imgAlt: 'Visa card',
    cardNumber: '4532 3616 2070 5678',
    imgSrc: '/images/logos/visa.png'
  }
]

const PaymentMethod = () => {
  const t = useCommonTranslations()

  // States
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cod'>('credit')
  const [creditCard, setCreditCard] = useState(0)

  // Hooks
  const [cardData, setCardData] = useState({
    cardNumber: '',
    name: '',
    expiryDate: '',
    cardCvv: ''
  })

  const handleReset = () => {
    setCardData({
      cardNumber: '',
      name: '',
      expiryDate: '',
      cardCvv: ''
    })
  }

  const buttonProps = (index: number): ButtonProps => ({
    variant: 'tonal',
    children: t.edit,
    size: 'small',
    onClick: () => setCreditCard(index)
  })

  return (
    <Card>
      <CardHeader title={t.paymentMethod} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <RadioGroup
                  row
                  name='payment-method-radio'
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as 'credit' | 'cod')}
                  className='flex gap-4'
                >
                  <FormControlLabel value='credit' control={<Radio />} label={t.creditDebitAtm} />
                  <FormControlLabel value='cash' control={<Radio />} label={t.codCheque} />
                </RadioGroup>
              </Grid>
              {paymentMethod === 'credit' ? (
                <>
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomTextField
                      fullWidth
                      name='name'
                      label={t.name}
                      autoComplete='off'
                      placeholder={t.cardNamePlaceholder}
                      value={cardData.name}
                      onChange={e => setCardData({ ...cardData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <CustomTextField
                      fullWidth
                      name='expiry'
                      autoComplete='off'
                      label={t.expiryDate}
                      placeholder={t.expiryDatePlaceholder}
                      value={cardData.expiryDate}
                      onChange={e => setCardData({ ...cardData, expiryDate: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <CustomTextField
                      fullWidth
                      name='cvv'
                      label={t.cvvCode}
                      autoComplete='off'
                      placeholder='654'
                      value={cardData.cardCvv}
                      onChange={e => setCardData({ ...cardData, cardCvv: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel control={<Switch defaultChecked />} label={t.saveCardFutureBilling} />
                  </Grid>
                </>
              ) : (
                <Grid size={{ xs: 12 }}>
                  <Typography>{t.cashDeliveryDescription}</Typography>
                  <Typography>{t.cashDeliveryOptions}</Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12 }} className='flex gap-4 flex-wrap'>
                <Button type='submit' variant='contained'>
                  {t.saveChanges}
                </Button>
                <Button type='reset' variant='tonal' color='secondary' onClick={handleReset}>
                  {t.cancel}
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} className='flex flex-col gap-6'>
            <Typography color='text.primary' className='font-medium'>
              {t.myCards}
            </Typography>
            {data.map((item: DataType, index: number) => (
              <div
                key={index}
                className='flex flex-col rounded bg-actionHover sm:flex-row items-start sm:justify-between max-sm:gap-4 p-6'
              >
                <div className='flex flex-col items-start gap-2'>
                  <img src={item.imgSrc} alt={item.imgAlt} />
                  <div className='flex items-center gap-4'>
                    <Typography className='text-textPrimary font-medium'>{item.name}</Typography>
                    {item.cardStatus ? (
                      <Chip
                        color={item.badgeColor}
                        variant='tonal'
                        label={item.cardStatus ? t[item.cardStatus] : ''}
                        size='small'
                      />
                    ) : null}
                  </div>
                  <Typography>
                    {item.cardNumber && item.cardNumber.slice(0, -4).replace(/[0-9]/g, '*') + item.cardNumber.slice(-4)}
                  </Typography>
                </div>
                <div className='flex flex-col sm:items-end gap-4'>
                  <div className='flex gap-4'>
                    <OpenDialogOnElementClick
                      element={Button}
                      elementProps={buttonProps(index)}
                      dialog={BillingCard}
                      dialogProps={{ data: data[creditCard] }}
                    />
                    <Button variant='tonal' color='error' size='small'>
                      {t.delete}
                    </Button>
                  </div>
                  <Typography variant='body2'>{t.cardExpiresAt.replace('{date}', item.expiryDate ?? '')}</Typography>
                </div>
              </div>
            ))}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PaymentMethod
