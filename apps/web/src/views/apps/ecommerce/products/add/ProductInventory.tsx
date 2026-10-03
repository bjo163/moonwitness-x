'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import Link from '@components/Link'
import CustomTabList from '@core/components/mui/TabList'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const ProductInventory = () => {
  const t = useCommonTranslations()

  // States
  const [activeTab, setActiveTab] = useState('restock')
  const [date, setDate] = useState<Date | null>(null)

  // Hooks
  const theme = useTheme()
  const isBelowMdScreen = useMediaQuery(theme.breakpoints.down('md'))

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  return (
    <Card>
      <CardHeader title={t.productInventory} />
      <CardContent>
        <TabContext value={activeTab}>
          <div className='flex max-md:flex-col gap-6'>
            <div className='md:is-4/12'>
              <CustomTabList orientation='vertical' onChange={handleChange} pill='true'>
                <Tab
                  value='restock'
                  label={t.productRestock}
                  icon={<i className='tabler-box' />}
                  iconPosition='start'
                  className='flex-row justify-start min-is-full text-start'
                />
                <Tab
                  value='shipping'
                  label={t.productShipping}
                  icon={<i className='tabler-car' />}
                  iconPosition='start'
                  className='flex-row justify-start min-is-full text-start'
                />
                <Tab
                  value='global-delivery'
                  label={t.productGlobalDelivery}
                  icon={<i className='tabler-world' />}
                  iconPosition='start'
                  className='flex-row justify-start min-is-full text-start'
                />
                <Tab
                  value='attributes'
                  label={t.productAttributes}
                  icon={<i className='tabler-link' />}
                  iconPosition='start'
                  className='flex-row justify-start min-is-full text-start'
                />
                <Tab
                  value='advanced'
                  label={t.productAdvanced}
                  icon={<i className='tabler-lock' />}
                  iconPosition='start'
                  className='flex-row justify-start min-is-full text-start'
                />
              </CustomTabList>
            </div>
            <Divider orientation={isBelowMdScreen ? 'horizontal' : 'vertical'} flexItem />
            <div className='md:is-8/12'>
              <TabPanel value='restock' className='flex flex-col gap-4'>
                <Typography className='font-medium'>{t.productOptions}</Typography>
                <div className='flex items-end gap-4'>
                  <CustomTextField
                    label={t.productAddToStock}
                    placeholder={t.productQuantity}
                    size='small'
                    className='flex-auto'
                  />
                  <Button variant='contained'>{t.productConfirm}</Button>
                </div>
                <div className='flex flex-col gap-2'>
                  <Typography color='text.primary'>{t.productStockNow}: 54</Typography>
                  <Typography color='text.primary'>{t.productStockInTransit}: 390</Typography>
                  <Typography color='text.primary'>
                    {t.productLastRestocked}: {new Date(2022, 5, 24).toLocaleDateString()}
                  </Typography>
                  <Typography color='text.primary'>{t.productLifetimeStock}: 2,430</Typography>
                </div>
              </TabPanel>
              <TabPanel value='shipping'>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium'>{t.productShippingType}</Typography>
                  <RadioGroup
                    name='radio-buttons-group'
                    defaultValue='seller'
                    className='items-start gap-4'
                    aria-labelledby='shipping-type-radio-buttons-group-label'
                  >
                    <FormControlLabel
                      value='seller'
                      control={<Radio className='self-start' />}
                      label={
                        <>
                          <Typography className='font-medium' color='text.primary'>
                            {t.productFulfilledBySeller}
                          </Typography>
                          <Typography variant='body2'>{t.productSellerShippingDescription}</Typography>
                        </>
                      }
                    />
                    <FormControlLabel
                      value='company'
                      control={<Radio className='self-start' />}
                      label={
                        <>
                          <Typography className='font-medium' color='text.primary'>
                            {t.productFulfilledByCompany}
                          </Typography>
                          <Typography variant='body2'>{t.productCompanyShippingDescription}</Typography>
                        </>
                      }
                    />
                  </RadioGroup>
                </div>
              </TabPanel>
              <TabPanel value='global-delivery'>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium'>{t.productGlobalDelivery}</Typography>
                  <RadioGroup
                    name='radio-buttons-group'
                    defaultValue='worldwide'
                    className='items-start gap-4'
                    aria-labelledby='global-delivery-radio-buttons-group-label'
                  >
                    <FormControlLabel
                      value='worldwide'
                      control={<Radio className='self-start' />}
                      label={
                        <>
                          <Typography className='font-medium' color='text.primary'>
                            {t.productWorldwideDelivery}
                          </Typography>
                          <Typography variant='body2'>
                            {t.productOnlyWithShipping}:{' '}
                            <Link className='text-primary'>{t.productFulfilledByCompany}</Link>
                          </Typography>
                        </>
                      }
                    />
                    <FormControlLabel
                      value='selected'
                      control={<Radio className='self-start' />}
                      label={
                        <>
                          <Typography className='font-medium' color='text.primary'>
                            {t.productSelectedCountries}
                          </Typography>
                          <CustomTextField placeholder={t.productCountryCodePlaceholder} size='small' />
                        </>
                      }
                    />
                    <FormControlLabel
                      value='local'
                      control={<Radio className='self-start' />}
                      label={
                        <>
                          <Typography className='font-medium' color='text.primary'>
                            {t.productLocalDelivery}
                          </Typography>
                          <Typography variant='body2'>
                            {t.productDeliverToResidence}{' '}
                            <Link className='text-primary'>{t.productChangeProfileAddress}</Link>
                          </Typography>
                        </>
                      }
                    />
                  </RadioGroup>
                </div>
              </TabPanel>
              <TabPanel value='attributes'>
                <FormGroup className='items-start'>
                  <Typography className='font-medium mbe-2'>{t.productAttributes}</Typography>
                  <FormControlLabel
                    control={<Checkbox />}
                    label={
                      <Typography className='font-medium' color='text.primary'>
                        {t.productFragile}
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    control={<Checkbox />}
                    className='mbe-2'
                    label={
                      <Typography className='font-medium' color='text.primary'>
                        {t.productBiodegradable}
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    control={<Checkbox />}
                    className='mbe-4'
                    label={
                      <>
                        <Typography className='font-medium' color='text.primary'>
                          {t.productFrozen}
                        </Typography>
                        <CustomTextField placeholder={t.productTemperaturePlaceholder} size='small' />
                      </>
                    }
                  />
                  <FormControlLabel
                    control={<Checkbox />}
                    label={
                      <>
                        <Typography className='font-medium' color='text.primary'>
                          {t.productExpiryDate}
                        </Typography>
                        <AppReactDatepicker
                          selected={date}
                          onChange={(date: Date | null) => setDate(date)}
                          placeholderText={t.productDatePlaceholder}
                          customInput={<CustomTextField fullWidth size='small' />}
                        />
                      </>
                    }
                  />
                </FormGroup>
              </TabPanel>
              <TabPanel value='advanced'>
                <FormGroup className='flex flex-col gap-4'>
                  <Typography className='font-medium'>{t.productAdvanced}</Typography>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, sm: 6, md: 7 }}>
                      <CustomTextField select fullWidth label={t.productIdType} defaultValue={t.productIdIsbn}>
                        <MenuItem value={t.productIdIsbn}>{t.productIdIsbn}</MenuItem>
                        <MenuItem value={t.productIdUpc}>{t.productIdUpc}</MenuItem>
                        <MenuItem value={t.productIdEan}>{t.productIdEan}</MenuItem>
                        <MenuItem value={t.productIdJan}>{t.productIdJan}</MenuItem>
                      </CustomTextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                      <CustomTextField fullWidth label={t.productId} placeholder='100023' size='small' />
                    </Grid>
                  </Grid>
                </FormGroup>
              </TabPanel>
            </div>
          </div>
        </TabContext>
      </CardContent>
    </Card>
  )
}

export default ProductInventory
