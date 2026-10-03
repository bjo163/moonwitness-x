'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import InputLabel from '@mui/material/InputLabel'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import CustomTextField from '@moonwitness/ui/text-field'

import type { InvoiceType } from '@/types/apps/invoiceTypes'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const EditCard = ({ invoiceData, id, data }: { invoiceData?: InvoiceType; id: string; data?: InvoiceType[] }) => {
  const t = useCommonTranslations()

  // States
  const [selectData, setSelectData] = useState<InvoiceType | null>(data?.[0] || null)
  const [count, setCount] = useState(1)
  const [issueDate, setIssueDate] = useState(new Date(invoiceData?.issuedDate ?? ''))
  const [dueDate, setDueDate] = useState(new Date(invoiceData?.dueDate ?? ''))

  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  const deleteForm = (e: SyntheticEvent) => {
    e.preventDefault()

    // @ts-ignore
    e.target.closest('.repeater-item').remove()
  }

  return (
    <>
      <Card>
        <CardContent className='sm:!p-12'>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <div className='p-6 rounded bg-actionHover'>
                <div className='flex justify-between gap-4 flex-col sm:flex-row'>
                  <div className='flex flex-col gap-6'>
                    <div className='flex items-center gap-2.5'>
                      <Logo />
                    </div>
                    <div>
                      <Typography color='text.primary'>{t.invoiceDemoAddressLine1}</Typography>
                      <Typography color='text.primary'>{t.invoiceDemoAddressLine2}</Typography>
                      <Typography color='text.primary'>+1 (123) 456 7891, +44 (876) 543 2198</Typography>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-4'>
                      <Typography variant='h5' className='min-is-[95px]'>
                        {t.invoice}
                      </Typography>
                      <CustomTextField
                        fullWidth
                        value={id}
                        slotProps={{
                          input: {
                            disabled: true,
                            startAdornment: <InputAdornment position='start'>#</InputAdornment>
                          }
                        }}
                      />
                    </div>
                    <div className='flex items-center'>
                      <Typography className='min-is-[95px] mie-4' color='text.primary'>
                        {t.invoiceDateIssued}
                      </Typography>
                      <AppReactDatepicker
                        boxProps={{ className: 'is-full' }}
                        selected={issueDate}
                        id='payment-date'
                        onChange={(date: Date | null) => date !== null && setIssueDate(date)}
                        customInput={<CustomTextField fullWidth />}
                      />
                    </div>
                    <div className='flex items-center'>
                      <Typography className='min-is-[95px] mie-4' color='text.primary'>
                        {t.invoiceDateDue}
                      </Typography>
                      <AppReactDatepicker
                        boxProps={{ className: 'is-full' }}
                        selected={dueDate}
                        id='payment-date'
                        onChange={(date: Date | null) => date !== null && setDueDate(date)}
                        customInput={<CustomTextField fullWidth />}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <div className='flex justify-between flex-col gap-4 flex-wrap sm:flex-row'>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    {t.invoiceToLabel}
                  </Typography>
                  <CustomTextField
                    select
                    className='is-1/2 min-is-[220px] sm:is-auto'
                    value={selectData?.id}
                    onChange={e => {
                      setSelectData(data?.slice(0, 5).filter(item => item.id === e.target.value)[0] || null)
                    }}
                  >
                    {data?.slice(0, 5).map((invoice: InvoiceType, index) => (
                      <MenuItem key={index} value={invoice.id}>
                        {invoice.name}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                  <div>
                    <Typography>{selectData?.name}</Typography>
                    <Typography>{selectData?.company}</Typography>
                    <Typography>{selectData?.address}</Typography>
                    <Typography>{selectData?.contact}</Typography>
                    <Typography>{selectData?.companyEmail}</Typography>
                  </div>
                </div>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    {t.invoiceBillTo}
                  </Typography>
                  <div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>{t.invoiceTotalDue}</Typography>
                      <Typography>$12,110.55</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>{t.invoiceBankName}</Typography>
                      <Typography>{t.invoiceDemoBankName}</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>{t.invoiceCountry}</Typography>
                      <Typography>{t.invoiceDemoCountry}</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>{t.invoiceIban}</Typography>
                      <Typography>{t.invoiceDemoIban}</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>{t.invoiceSwiftCode}</Typography>
                      <Typography>{t.invoiceDemoSwift}</Typography>
                    </div>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider className='border-dashed' />
            </Grid>
            <Grid size={{ xs: 12 }}>
              {Array.from(Array(count).keys()).map((item, index) => (
                <div
                  key={index}
                  className={classnames('repeater-item flex relative mbe-4 border rounded', {
                    'mbs-8': !isBelowMdScreen,
                    'mbs-14!': index !== 0 && !isBelowMdScreen,
                    'gap-5': isBelowMdScreen
                  })}
                >
                  <Grid container spacing={5} className='m-0 p-5'>
                    <Grid size={{ xs: 12, md: 5, lg: 6 }}>
                      <Typography className='font-medium md:absolute md:-top-8' color='text.primary'>
                        {t.invoiceItem}
                      </Typography>
                      <CustomTextField select fullWidth defaultValue='app-design' className='mbe-5'>
                        <MenuItem value='app-design'>{t.invoiceDemoAppDesign}</MenuItem>
                        <MenuItem value='app-customization'>{t.invoiceDemoAppCustomization}</MenuItem>
                        <MenuItem value='abc-template'>{t.invoiceDemoAbcTemplate}</MenuItem>
                        <MenuItem value='app-development'>{t.invoiceDemoAppDevelopment}</MenuItem>
                      </CustomTextField>
                      <CustomTextField rows={2} fullWidth multiline defaultValue={t.invoiceDemoCustomDescription} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3, lg: 2 }}>
                      <Typography className='font-medium md:absolute md:-top-8' color='text.primary'>
                        {t.invoiceCost}
                      </Typography>
                      <CustomTextField
                        {...(isBelowMdScreen && { fullWidth: true })}
                        type='number'
                        placeholder='24'
                        defaultValue='24'
                        className='mbe-5'
                        slotProps={{
                          input: {
                            inputProps: { min: 0 }
                          }
                        }}
                      />
                      <div className='flex flex-col'>
                        <Typography component='span' color='text.primary'>
                          {t.invoiceDiscount}
                        </Typography>
                        <div className='flex gap-2'>
                          <Typography component='span' color='text.primary'>
                            0%
                          </Typography>
                          <Tooltip title={t.invoiceTaxOne} placement='top'>
                            <Typography component='span' color='text.primary'>
                              0%
                            </Typography>
                          </Tooltip>
                          <Tooltip title={t.invoiceTaxTwo} placement='top'>
                            <Typography component='span' color='text.primary'>
                              0%
                            </Typography>
                          </Tooltip>
                        </div>
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Typography className='font-medium md:absolute md:-top-8' color='text.primary'>
                        {t.invoiceHours}
                      </Typography>
                      <CustomTextField
                        {...(isBelowMdScreen && { fullWidth: true })}
                        type='number'
                        placeholder='1'
                        defaultValue='1'
                        slotProps={{
                          input: {
                            inputProps: { min: 0 }
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Typography className='font-medium md:absolute md:-top-8' color='text.primary'>
                        {t.invoicePrice}
                      </Typography>
                      <Typography>$24.00</Typography>
                    </Grid>
                  </Grid>
                  <div className='flex flex-col justify-start border-is'>
                    <IconButton size='small' onClick={deleteForm}>
                      <i className='tabler-x text-2xl text-actionActive' />
                    </IconButton>
                  </div>
                </div>
              ))}
              <Grid size={{ xs: 12 }}>
                <Button
                  size='small'
                  variant='contained'
                  onClick={() => setCount(count + 1)}
                  startIcon={<i className='tabler-plus' />}
                >
                  {t.invoiceAddItem}
                </Button>
              </Grid>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider className='border-dashed' />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <div className='flex justify-between flex-col gap-4 sm:flex-row'>
                <div className='flex flex-col gap-4 order-2 sm:order-[unset]'>
                  <div className='flex items-center gap-2'>
                    <Typography className='font-medium' color='text.primary'>
                      {t.invoiceSalesperson}
                    </Typography>
                    <CustomTextField defaultValue={t.invoiceDemoSalesperson} />
                  </div>
                  <CustomTextField defaultValue={t.invoiceThanks} />
                </div>
                <div className='min-is-[200px]'>
                  <div className='flex items-center justify-between'>
                    <Typography>{t.invoiceSubtotal}</Typography>
                    <Typography className='font-medium' color='text.primary'>
                      $1800
                    </Typography>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Typography>{t.invoiceDiscount}</Typography>
                    <Typography className='font-medium' color='text.primary'>
                      $28
                    </Typography>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Typography>{t.invoiceTax}</Typography>
                    <Typography className='font-medium' color='text.primary'>
                      21%
                    </Typography>
                  </div>
                  <Divider className='mlb-2' />
                  <div className='flex items-center justify-between'>
                    <Typography>{t.invoiceTotal}</Typography>
                    <Typography className='font-medium' color='text.primary'>
                      $1690
                    </Typography>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider className='border-dashed' />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <InputLabel htmlFor='invoice-note' className='inline-flex mbe-1 text-textPrimary'>
                {t.invoiceNote}
              </InputLabel>
              <CustomTextField
                id='invoice-note'
                rows={2}
                fullWidth
                multiline
                className='rounded'
                defaultValue={t.invoiceDemoNote}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  )
}

export default EditCard
