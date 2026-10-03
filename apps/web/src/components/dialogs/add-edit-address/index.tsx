'use client'

// React Imports
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

// Third-party Imports
import classnames from 'classnames'

// Type Import
import type { CustomInputVerticalData } from '@core/components/custom-inputs/types'

// Component Imports
import CustomInputVertical from '@core/components/custom-inputs/Vertical'
import DialogCloseButton from '../DialogCloseButton'
import CustomTextField from '@moonwitness/ui/text-field'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type AddEditAddressData = {
  firstName?: string
  lastName?: string
  country?: string
  address1?: string
  address2?: string
  landmark?: string
  city?: string
  state?: string
  zipCode?: string
}

type AddEditAddressProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: AddEditAddressData
}

const countries = ['Select Country', 'France', 'Russia', 'China', 'UK', 'US']

const initialAddressData: AddEditAddressProps['data'] = {
  firstName: '',
  lastName: '',
  country: '',
  address1: '',
  address2: '',
  landmark: '',
  city: '',
  state: '',
  zipCode: ''
}

const customInputData: CustomInputVerticalData[] = [
  {
    title: 'addressTypeHome',
    content: 'addressDeliveryHome',
    value: 'home',
    isSelected: true,
    asset: 'tabler-home'
  },
  {
    title: 'addressTypeOffice',
    content: 'addressDeliveryOffice',
    value: 'office',
    asset: 'tabler-building-skyscraper'
  }
]

const AddEditAddress = ({ open, setOpen, data }: AddEditAddressProps) => {
  const t = useCommonTranslations()
  const translatedInputData = customInputData.map(item => ({
    ...item,
    title: t[item.title as keyof typeof t],
    content: t[item.content as keyof typeof t]
  }))
  // Vars
  const initialSelected: string = customInputData?.find(item => item.isSelected)?.value || ''

  // States
  const [selected, setSelected] = useState<string>(initialSelected)
  const [addressData, setAddressData] = useState<AddEditAddressProps['data']>(initialAddressData)

  const handleChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    if (typeof prop === 'string') {
      setSelected(prop)
    } else {
      setSelected((prop.target as HTMLInputElement).value)
    }
  }

  useEffect(() => {
    setAddressData(data ?? initialAddressData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog
      open={open}
      maxWidth='md'
      scroll='body'
      onClose={() => {
        setOpen(false)
        setSelected(initialSelected)
      }}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {data ? t.addressEditTitle : t.addressAddTitle}
        <Typography component='span' className='flex flex-col text-center'>
          {data ? t.addressEditDescription : t.addressAddDescription}
        </Typography>
      </DialogTitle>
      <form onSubmit={e => e.preventDefault()}>
        <DialogContent className='pbs-0 sm:pli-16'>
          <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
          <Grid container spacing={6}>
            {translatedInputData.map((item, index) => {
              let asset

              if (item.asset && typeof item.asset === 'string') {
                asset = <i className={classnames(item.asset, 'text-[28px]')} />
              }

              return (
                <Grid size={{ xs: 12, sm: 6 }} key={index}>
                  <CustomInputVertical
                    type='radio'
                    key={index}
                    data={{ ...item, asset }}
                    selected={selected}
                    name='addressType'
                    handleChange={handleChange}
                  />
                </Grid>
              )
            })}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.addressFirstName}
                name='firstName'
                variant='outlined'
                placeholder={t.addressFirstNamePlaceholder}
                value={addressData?.firstName}
                onChange={e => setAddressData({ ...addressData, firstName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.addressLastName}
                name='lastName'
                variant='outlined'
                placeholder={t.addressLastNamePlaceholder}
                value={addressData?.lastName}
                onChange={e => setAddressData({ ...addressData, lastName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                label={t.addressCountry}
                name='country'
                variant='outlined'
                value={addressData?.country?.toLowerCase().replace(/\s+/g, '-') || ''}
                onChange={e => setAddressData({ ...addressData, country: e.target.value })}
              >
                {countries.map((item, index) => (
                  <MenuItem key={index} value={index === 0 ? '' : item.toLowerCase().replace(/\s+/g, '-')}>
                    {item}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={t.addressLine1}
                name='address1'
                variant='outlined'
                placeholder={t.addressLine1Placeholder}
                value={addressData?.address1}
                onChange={e => setAddressData({ ...addressData, address1: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={t.addressLine2}
                name='address1'
                variant='outlined'
                placeholder={t.addressLine2Placeholder}
                value={addressData?.address2}
                onChange={e => setAddressData({ ...addressData, address2: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.addressLandmark}
                name='landmark'
                variant='outlined'
                placeholder={t.addressLandmarkPlaceholder}
                value={addressData?.landmark}
                onChange={e => setAddressData({ ...addressData, landmark: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.addressCity}
                name='city'
                variant='outlined'
                placeholder={t.addressCityPlaceholder}
                value={addressData?.city}
                onChange={e => setAddressData({ ...addressData, city: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.addressState}
                name='state'
                variant='outlined'
                placeholder={t.addressStatePlaceholder}
                value={addressData?.state}
                onChange={e => setAddressData({ ...addressData, state: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.addressZipCode}
                type='number'
                name='zipCode'
                variant='outlined'
                placeholder={t.addressZipPlaceholder}
                value={addressData?.zipCode}
                onChange={e => setAddressData({ ...addressData, zipCode: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel control={<Switch defaultChecked />} label={t.addressMakeDefault} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' onClick={() => setOpen(false)} type='submit'>
            {data ? t.update : t.submit}
          </Button>
          <Button
            variant='tonal'
            color='secondary'
            onClick={() => {
              setOpen(false)
              setSelected(initialSelected)
            }}
            type='reset'
          >
            {t.cancel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AddEditAddress
