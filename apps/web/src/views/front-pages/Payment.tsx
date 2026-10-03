'use client'

// React Imports
import type { ChangeEvent } from 'react'
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import type { ButtonProps } from '@mui/material/Button'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import CustomTextField from '@moonwitness/ui/text-field'

import type { CustomInputHorizontalData } from '@core/components/custom-inputs/types'
import type { PricingPlanType } from '@/types/pages/pricingTypes'

// Component Imports
import CustomInputHorizontal from '@core/components/custom-inputs/Horizontal'
import PricingDialog from '@components/dialogs/pricing'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import DirectionalIcon from '@components/DirectionalIcon'
import { useSettings } from '@core/hooks/useSettings'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Data
const cardData: CustomInputHorizontalData[] = [
  {
    title: 'paymentCreditCard',
    value: 'credit-card',
    isSelected: true
  },
  {
    title: 'paymentPayPal',
    value: 'paypal'
  }
]

const countries = ['Australia', 'Brazil', 'Canada', 'India', 'United Arab Emirates', 'United Kingdom', 'United States']

const Payment = ({ data }: { data: PricingPlanType[] }) => {
  const t = useCommonTranslations()

  // Vars
  const buttonProps: ButtonProps = {
    variant: 'tonal',
    children: t.paymentChangePlan
  }

  const initialSelected: string = cardData.filter(item => item.isSelected)[
    cardData.filter(item => item.isSelected).length - 1
  ].value

  // States
  const [selectCountry, setSelectCountry] = useState('Brazil')
  const [selectInput, setSelectInput] = useState<string>(initialSelected)

  // Hooks
  const { updatePageSettings } = useSettings()

  const handleCountryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectCountry(event.target.value)
  }

  const handlePaymentChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    if (typeof prop === 'string') {
      setSelectInput(prop)
    } else {
      setSelectInput((prop.target as HTMLInputElement).value)
    }
  }

  // For Page specific settings
  useEffect(() => {
    return updatePageSettings({
      skin: 'default'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className={classnames('md:plb-[100px] plb-6', frontCommonStyles.layoutSpacing)}>
      <Card>
        <Grid container>
          <Grid size={{ md: 12, lg: 7 }}>
            <CardContent className='flex flex-col max-sm:gap-y-5 gap-y-8 sm:p-8 border-be lg:border-be-0 lg:border-e bs-full'>
              <div className='flex flex-col gap-2'>
                <Typography variant='h4'>{t.checkoutPageTitle}</Typography>
                <Typography>{t.landingPricingDescription}</Typography>
              </div>
              <Grid container spacing={4}>
                {cardData.map((item, index) => (
                  <CustomInputHorizontal
                    key={index}
                    type='radio'
                    name='paymemt-method'
                    data={{ ...item, title: t[item.title as keyof typeof t] }}
                    selected={selectInput}
                    handleChange={handlePaymentChange}
                    gridProps={{ size: { xs: 12, sm: 6 } }}
                  />
                ))}
              </Grid>
              <div>
                <Typography variant='h4' className='mbe-6'>
                  {t.paymentBillingDetails}
                </Typography>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      label={t.paymentEmailAddress}
                      placeholder={t.paymentEmailPlaceholder}
                      type='email'
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      type='password'
                      id='password-input'
                      label={t.paymentPassword}
                      placeholder={t.paymentPassword}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      select
                      fullWidth
                      label={t.paymentBillingCountry}
                      name='country'
                      variant='outlined'
                      value={selectCountry}
                      onChange={handleCountryChange}
                    >
                      {countries.map((item, index) => (
                        <MenuItem key={index} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      label={t.paymentPostalCode}
                      id='postal-code-input'
                      placeholder={t.paymentPostalCode}
                      fullWidth
                      type='number'
                    />
                  </Grid>
                </Grid>
              </div>
              {selectInput === 'credit-card' && (
                <div>
                  <Typography variant='h4' className='mbe-6'>
                    {t.paymentCreditCardInfo}
                  </Typography>
                  <Grid container spacing={5}>
                    <Grid size={{ xs: 12 }}>
                      <CustomTextField
                        fullWidth
                        id='card-number-input'
                        placeholder={t.paymentCardNumberPlaceholder}
                        label={t.cardNumber}
                        type='number'
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        id='card-holder-name'
                        placeholder={t.paymentCardHolderPlaceholder}
                        label={t.paymentCardHolder}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <CustomTextField
                        fullWidth
                        id='expiry-date'
                        placeholder='05/2028'
                        label={t.expiryDate}
                        type='number'
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <CustomTextField fullWidth id='cvv' placeholder='123' label={t.cvvCode} type='number' />
                    </Grid>
                  </Grid>
                </div>
              )}
            </CardContent>
          </Grid>
          <Grid size={{ md: 12, lg: 5 }}>
            <CardContent className='flex flex-col gap-8 sm:p-8'>
              <div className='flex flex-col gap-2'>
                <Typography variant='h4'>{t.paymentOrderSummary}</Typography>
                <Typography>{t.paymentOrderDescription}</Typography>
              </div>
              <div className='flex flex-col gap-5'>
                <div className='flex flex-col gap-4 p-6 bg-actionHover rounded-sm'>
                  <Typography>{t.paymentSimplePlan}</Typography>
                  <div className='flex items-baseline'>
                    <Typography variant='h1'>$59.99</Typography>
                    <Typography component='sub'>{t.landingPerMonth}</Typography>
                  </div>
                  <OpenDialogOnElementClick
                    element={Button}
                    elementProps={buttonProps}
                    dialog={PricingDialog}
                    dialogProps={{ data }}
                  />
                </div>
                <div>
                  <div className='flex gap-2 items-center justify-between mbe-2'>
                    <Typography>{t.paymentSubscription}</Typography>
                    <Typography color='text.primary' className='font-medium'>
                      $85.99
                    </Typography>
                  </div>
                  <div className='flex gap-2 items-center justify-between'>
                    <Typography>{t.paymentTax}</Typography>
                    <Typography color='text.primary' className='font-medium'>
                      $4.99
                    </Typography>
                  </div>
                  <Divider className='mlb-4' />
                  <div className='flex gap-2 items-center justify-between'>
                    <Typography>{t.paymentTotal}</Typography>
                    <Typography color='text.primary' className='font-medium'>
                      $90.98
                    </Typography>
                  </div>
                </div>
                <Button
                  variant='contained'
                  color='success'
                  endIcon={<DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />}
                >
                  {t.paymentProceed}
                </Button>
              </div>
              <Typography>{t.paymentTermsNotice}</Typography>
            </CardContent>
          </Grid>
        </Grid>
      </Card>
    </section>
  )
}

export default Payment
