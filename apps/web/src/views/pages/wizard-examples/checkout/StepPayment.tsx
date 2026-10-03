// React Imports
import { useEffect, useState } from 'react'
import type { SyntheticEvent } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import TabContext from '@mui/lab/TabContext'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import Fade from '@mui/material/Fade'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import CustomTabList from '@core/components/mui/TabList'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const StepPayment = ({ handleNext }: { handleNext: () => void }) => {
  const t = useCommonTranslations()

  // States
  const [value, setValue] = useState<string>('credit-card')
  const [openCollapse, setOpenCollapse] = useState<boolean>(true)
  const [openFade, setOpenFade] = useState<boolean>(true)

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  useEffect(() => {
    if (!openFade) {
      setTimeout(() => {
        setOpenCollapse(false)
      }, 300)
    }
  }, [openFade])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 8 }} className='flex flex-col gap-6'>
        <Collapse in={openCollapse}>
          <Fade in={openFade} timeout={{ exit: 300 }}>
            <Alert
              icon={<i className='tabler-percentage' />}
              action={
                <IconButton
                  aria-label={t.commonClose}
                  color='inherit'
                  size='small'
                  onClick={() => {
                    setOpenFade(false)
                  }}
                >
                  <i className='tabler-x' />
                </IconButton>
              }
            >
              <AlertTitle>{t.checkoutAvailableOffers}</AlertTitle>
              <Typography color='success.main'>{t.checkoutOfferBank}</Typography>
              <Typography color='success.main'>{t.checkoutOfferPayPal}</Typography>
            </Alert>
          </Fade>
        </Collapse>
        <TabContext value={value}>
          <CustomTabList
            variant='scrollable'
            scrollButtons='auto'
            onChange={handleChange}
            aria-label={t.checkoutPaymentMethods}
            pill='true'
          >
            <Tab value='credit-card' label={t.checkoutCard} />
            <Tab value='cash-on-delivery' label={t.checkoutCashOnDelivery} />
            <Tab value='gift-card' label={t.checkoutGiftCard} />
          </CustomTabList>
          <Grid container>
            <Grid size={{ xs: 12, md: 8 }}>
              <TabPanel value='credit-card'>
                <form>
                  <Grid container spacing={6}>
                    <Grid size={{ xs: 12 }}>
                      <CustomTextField
                        fullWidth
                        type='number'
                        label={t.cardNumber}
                        placeholder={t.checkoutCardNumberPlaceholder}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label={t.paymentCardHolder}
                        placeholder={t.paymentCardHolderPlaceholder}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <CustomTextField fullWidth label={t.expiryDate} placeholder={t.checkoutExpiryPlaceholder} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <CustomTextField fullWidth label={t.cvvCode} placeholder='123' />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel control={<Switch defaultChecked />} label={t.checkoutSaveCard} />
                    </Grid>
                    <Grid size={{ xs: 12 }} className='flex gap-4'>
                      <Button variant='contained' onClick={handleNext}>
                        {t.checkoutPageTitle}
                      </Button>
                      <Button type='reset' variant='tonal' color='secondary'>
                        {t.reset}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </TabPanel>
              <TabPanel value='cash-on-delivery'>
                <Typography className='mbe-6'>{t.checkoutCashOnDeliveryDescription}</Typography>
                <Button variant='contained' onClick={handleNext}>
                  {t.checkoutPayOnDelivery}
                </Button>
              </TabPanel>
              <TabPanel value='gift-card'>
                <Typography color='text.primary' className='mbe-6'>
                  {t.checkoutEnterGiftCard}
                </Typography>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12 }}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label={t.checkoutGiftCardNumber}
                      placeholder={t.checkoutGiftCardNumber}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label={t.checkoutGiftCardPin}
                      placeholder={t.checkoutGiftCardPin}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button variant='contained' onClick={handleNext}>
                      {t.checkoutRedeemGiftCard}
                    </Button>
                  </Grid>
                </Grid>
              </TabPanel>
            </Grid>
          </Grid>
        </TabContext>
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <div className='border rounded'>
          <CardContent className='flex flex-col gap-4'>
            <Typography color='text.primary' className='font-medium'>
              {t.checkoutPriceDetails}
            </Typography>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between gap-2'>
                <Typography color='text.primary'>{t.checkoutOrderTotal}</Typography>
                <Typography color='text.primary'>$1198.00</Typography>
              </div>
              <div className='flex items-center justify-between gap-2'>
                <Typography color='text.primary'>{t.checkoutDeliveryCharges}</Typography>
                <div className='flex gap-2'>
                  <Typography color='text.disabled' className='line-through'>
                    $5.00
                  </Typography>
                  <Chip variant='tonal' size='small' color='success' label={t.checkoutFree} />
                </div>
              </div>
            </div>
          </CardContent>
          <Divider />
          <CardContent className='flex flex-col gap-4'>
            <div className='flex items-center justify-between gap-2'>
              <Typography color='text.primary' className='font-medium'>
                {t.paymentTotal}
              </Typography>
              <Typography color='text.primary' className='font-medium'>
                $1198.00
              </Typography>
            </div>
            <div className='flex items-center justify-between gap-2'>
              <Typography color='text.primary' className='font-medium'>
                {t.checkoutDeliverTo}
              </Typography>
              <Chip variant='tonal' size='small' color='primary' label={t.checkoutHome} />
            </div>
            <div>
              <Typography color='text.primary' className='font-medium'>
                {t.checkoutAddressName}
              </Typography>
              <Typography>{t.checkoutHomeAddress}</Typography>
              <Typography>{t.checkoutHomeCity}</Typography>
              <Typography>{t.checkoutHomePhone}</Typography>
            </div>
            <Typography
              href='/'
              component={Link}
              onClick={e => e.preventDefault()}
              className='font-medium'
              color='primary.main'
            >
              {t.checkoutChangeAddress}
            </Typography>
          </CardContent>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepPayment
