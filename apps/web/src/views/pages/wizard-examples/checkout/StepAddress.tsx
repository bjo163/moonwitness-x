// React Imports
import { useState } from 'react'
import type { ChangeEvent } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import CardContent from '@mui/material/CardContent'
import { styled } from '@mui/material/styles'
import type { TypographyProps } from '@mui/material/Typography'
import type { ButtonProps } from '@mui/material/Button'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { CustomInputHorizontalData, CustomInputVerticalData } from '@core/components/custom-inputs/types'

// Component Imports
import CustomInputHorizontal from '@core/components/custom-inputs/Horizontal'
import CustomInputVertical from '@core/components/custom-inputs/Vertical'
import AddEditAddress from '@components/dialogs/add-edit-address'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Styled Components
const HorizontalContent = styled(Typography, {
  name: 'MuiCustomInputHorizontal',
  slot: 'content'
})<TypographyProps>({})

const VerticalContent = styled(Typography, {
  name: 'MuiCustomInputVertical',
  slot: 'content'
})<TypographyProps>({
  textAlign: 'center'
})

// Vars
const data: CustomInputHorizontalData[] = [
  {
    title: '',
    value: 'home',
    isSelected: true
  },
  {
    title: '',
    value: 'office'
  }
]

const dataIcons: CustomInputVerticalData[] = [
  {
    isSelected: true,
    value: 'standard',
    title: '',
    asset: 'tabler-user'
  },
  {
    value: 'express',
    title: '',
    asset: 'tabler-star'
  },
  {
    value: 'overnight',
    title: '',
    asset: 'tabler-crown'
  }
]

const StepAddress = ({ handleNext }: { handleNext: () => void }) => {
  const t = useCommonTranslations()

  const translatedDeliveryOptions = dataIcons.map(item => ({
    ...item,
    title:
      t[
        item.value === 'standard'
          ? 'checkoutDeliveryStandard'
          : item.value === 'express'
            ? 'checkoutDeliveryExpress'
            : 'checkoutDeliveryOvernight'
      ],
    content:
      item.value === 'standard' ? (
        <>
          <Chip variant='tonal' size='small' label={t.checkoutFree} color='success' className='absolute inline-end-4' />
          <VerticalContent variant='body2' className='my-auto'>
            {t.checkoutDeliveryOneWeek}
          </VerticalContent>
        </>
      ) : item.value === 'express' ? (
        <>
          <Chip variant='tonal' label='$10' size='small' color='secondary' className='absolute inline-end-4' />
          <VerticalContent variant='body2' className='my-auto'>
            {t.checkoutDeliveryThreeDays}
          </VerticalContent>
        </>
      ) : (
        <>
          <Chip variant='tonal' label='$15' size='small' color='secondary' className='absolute inline-end-4' />
          <VerticalContent variant='body2' className='my-auto'>
            {t.checkoutDeliveryOneDay}
          </VerticalContent>
        </>
      )
  }))

  const translatedData = data.map(item => ({
    ...item,
    title: item.value === 'home' ? t.checkoutAddressHomeDefault : t.checkoutAddressOffice,
    meta:
      item.value === 'home' ? (
        <Chip variant='tonal' size='small' label={t.checkoutHome} color='primary' />
      ) : (
        <Chip variant='tonal' size='small' label={t.checkoutOffice} color='success' />
      ),
    content:
      item.value === 'home' ? (
        <HorizontalContent component='div' className='flex flex-col gap-3 mbs-2 bs-full'>
          <Typography variant='body2'>
            {t.checkoutHomeAddress}, {t.checkoutHomeCity}.<br />
            {t.checkoutHomePhone} {t.checkoutCashOnDeliveryAvailable}
          </Typography>
          <Divider />
          <div className='flex items-center gap-4 mbs-0.5 pbe-[6px]'>
            <Typography href='/' component={Link} onClick={e => e.preventDefault()} color='primary.main'>
              {t.checkoutEdit}
            </Typography>
            <Typography href='/' component={Link} onClick={e => e.preventDefault()} color='primary.main'>
              {t.checkoutRemove}
            </Typography>
          </div>
        </HorizontalContent>
      ) : (
        <HorizontalContent component='div' className='flex flex-col gap-3 mbs-2 bs-full'>
          <Typography variant='body2'>
            {t.checkoutOfficeAddress}.<br />
            {t.checkoutHomePhone} {t.checkoutCashOnDeliveryAvailable}
          </Typography>
          <Divider />
          <div className='flex items-center gap-4 mbs-0.5 pbe-[6px]'>
            <Typography href='/' component={Link} onClick={e => e.preventDefault()} color='primary.main'>
              {t.checkoutEdit}
            </Typography>
            <Typography href='/' component={Link} onClick={e => e.preventDefault()} color='primary.main'>
              {t.checkoutRemove}
            </Typography>
          </div>
        </HorizontalContent>
      )
  }))

  // Vars
  const initialSelectedOption: string = data.filter(item => item.isSelected)[
    data.filter(item => item.isSelected).length - 1
  ].value

  const buttonProps: ButtonProps = {
    variant: 'tonal',
    children: t.checkoutAddAddress,
    className: 'self-start'
  }

  // States
  const [selectedOption, setSelectedOption] = useState<string>(initialSelectedOption)
  const [selectedSpeed, setSelectedSpeed] = useState<string>('standard')

  const handleOptionChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    if (typeof prop === 'string') {
      setSelectedOption(prop)
    } else {
      setSelectedOption((prop.target as HTMLInputElement).value)
    }
  }

  const handleSpeedChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    if (typeof prop === 'string') {
      setSelectedSpeed(prop)
    } else {
      setSelectedSpeed((prop.target as HTMLInputElement).value)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 8 }} className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4'>
          <Typography color='text.primary' className='font-medium self-start'>
            {t.checkoutSelectAddress}
          </Typography>
          <Grid container spacing={6}>
            {translatedData.map((item, index) => (
              <CustomInputHorizontal
                type='radio'
                key={index}
                data={item}
                gridProps={{
                  size: {
                    sm: 6,
                    xs: 12
                  }
                }}
                selected={selectedOption}
                name='custom-radios-basic'
                handleChange={handleOptionChange}
              />
            ))}
          </Grid>
          <OpenDialogOnElementClick element={Button} elementProps={buttonProps} dialog={AddEditAddress} />
        </div>
        <div className='flex flex-col gap-4'>
          <Typography color='text.primary' className='font-medium self-start'>
            {t.checkoutChooseDeliverySpeed}
          </Typography>
          <Grid container spacing={6}>
            {translatedDeliveryOptions.map((item, index) => {
              let asset

              if (item.asset && typeof item.asset === 'string') {
                asset = <i className={classnames(item.asset, 'text-[28px] mbs-3')} />
              }

              return (
                <CustomInputVertical
                  type='radio'
                  key={index}
                  gridProps={{
                    size: {
                      sm: 4,
                      xs: 12
                    }
                  }}
                  selected={selectedSpeed}
                  name='custom-radios-basic'
                  handleChange={handleSpeedChange}
                  data={typeof item.asset === 'string' ? { ...item, asset } : item}
                />
              )
            })}
          </Grid>
        </div>
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }} className='flex flex-col gap-4'>
        <div className='border rounded'>
          <CardContent className='flex flex-col gap-4'>
            <Typography color='text.primary' className='font-medium'>
              {t.checkoutEstimatedDelivery}
            </Typography>
            <div className='flex items-center gap-4'>
              <img width={60} height={60} src='/images/pages/google-home.png' alt={t.checkoutProductGoogle} />
              <div>
                <Typography>{t.checkoutProductGoogle}</Typography>
                <Typography className='font-medium'>{t.checkoutDeliveryDateOne}</Typography>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <img width={60} height={60} src='/images/pages/iPhone-11.png' alt={t.checkoutProductApple} />
              <div>
                <Typography>{t.checkoutProductApple}</Typography>
                <Typography className='font-medium'>{t.checkoutDeliveryDateTwo}</Typography>
              </div>
            </div>
          </CardContent>
          <Divider />
          <CardContent className='flex flex-col gap-4'>
            <Typography color='text.primary' className='font-medium'>
              {t.checkoutPriceDetails}
            </Typography>
            <div className='flex flex-col gap-2'>
              <div className='flex gap-2 justify-between items-center flex-wrap'>
                <Typography color='text.primary'>{t.checkoutOrderTotal}</Typography>
                <Typography color='text.primary'>$1198.00</Typography>
              </div>
              <div className='flex justify-between flex-wrap'>
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
          <CardContent className='flex items-center justify-between flex-wrap'>
            <Typography color='text.primary' className='font-medium'>
              {t.paymentTotal}
            </Typography>
            <Typography color='text.primary' className='font-medium'>
              $1198.00
            </Typography>
          </CardContent>
        </div>
        <div className='flex justify-end'>
          <Button className='max-sm:is-full lg:is-full' variant='contained' onClick={handleNext}>
            {t.checkoutPlaceOrder}
          </Button>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepAddress
