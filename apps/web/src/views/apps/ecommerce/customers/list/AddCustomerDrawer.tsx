// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

// Type Imports
import CustomTextField from '@moonwitness/ui/text-field'

import type { Customer } from '@/types/apps/ecommerceTypes'

// Component Imports
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: (data: Customer[]) => void
  customerData?: Customer[]
}

type FormValidateType = {
  fullName: string
  email: string
  country: string
}

type FormNonValidateType = {
  contact: string
  address1: string
  address2: string
  town: string
  state: string
  postcode: string
}

// Vars
const initialData = {
  contact: '',
  address1: '',
  address2: '',
  town: '',
  state: '',
  postcode: ''
}

const AddCustomerDrawer = (props: Props) => {
  const t = useCommonTranslations()

  // Props
  const { open, handleClose, setData, customerData } = props

  // States
  const [formData, setFormData] = useState<FormNonValidateType>(initialData)

  // Hooks
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      fullName: '',
      email: '',
      country: ''
    }
  })

  const onSubmit = (data: FormValidateType) => {
    const newData: Customer = {
      id: (customerData?.length && customerData?.length + 1) || 1,
      customer: data.fullName,
      customerId: customerData?.[Math.floor(Math.random() * 100) + 1].customerId ?? '1',
      email: data.email,
      country: `${
        {
          india: t.customerCountryIndia,
          australia: t.customerCountryAustralia,
          france: t.customerCountryFrance,
          brazil: t.customerCountryBrazil,
          us: t.customerCountryUs,
          china: t.customerCountryChina
        }[data.country]
      }`,
      countryCode: 'st',
      countryFlag: `/images/cards/${data.country}.png`,
      order: Math.floor(Math.random() * 1000) + 1,
      totalSpent: Math.floor(Math.random() * (1000000 - 100) + 100) / 100,
      avatar: `/images/avatars/${Math.floor(Math.random() * 8) + 1}.png`
    }

    setData([...(customerData ?? []), newData])
    resetForm({ fullName: '', email: '', country: '' })
    setFormData(initialData)
    handleClose()
  }

  const handleReset = () => {
    handleClose()
    resetForm({ fullName: '', email: '', country: '' })
    setFormData(initialData)
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between pli-6 plb-5'>
        <Typography variant='h5'>{t.customerAdd}</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-6'>
          <form onSubmit={handleSubmit(data => onSubmit(data))} className='flex flex-col gap-5'>
            <Typography color='text.primary' className='font-medium'>
              {t.customerBasicInformation}
            </Typography>
            <Controller
              name='fullName'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label={t.customerName}
                  placeholder={t.formFullNamePlaceholder}
                  {...(errors.fullName && { error: true, helperText: t.wizardRequired })}
                />
              )}
            />
            <Controller
              name='email'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  type='email'
                  label={t.wizardEmail}
                  placeholder={t.wizardEmailPlaceholder}
                  {...(errors.email && { error: true, helperText: t.wizardRequired })}
                />
              )}
            />
            <Controller
              name='country'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  select
                  fullWidth
                  id='country'
                  label={t.wizardCountry}
                  {...field}
                  {...(errors.country && { error: true, helperText: t.wizardRequired })}
                >
                  <MenuItem value='india'>{t.customerCountryIndia}</MenuItem>
                  <MenuItem value='australia'>{t.customerCountryAustralia}</MenuItem>
                  <MenuItem value='france'>{t.customerCountryFrance}</MenuItem>
                  <MenuItem value='brazil'>{t.customerCountryBrazil}</MenuItem>
                  <MenuItem value='us'>{t.customerCountryUs}</MenuItem>
                  <MenuItem value='china'>{t.customerCountryChina}</MenuItem>
                </CustomTextField>
              )}
            />
            <Typography color='text.primary' className='font-medium'>
              {t.customerShippingInformation}
            </Typography>
            <CustomTextField
              fullWidth
              label={t.customerAddressLine1}
              name='address1'
              placeholder={t.customerAddressLine1Placeholder}
              value={formData.address1}
              onChange={e => setFormData({ ...formData, address1: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label={t.customerAddressLine2}
              name='address2'
              placeholder={t.customerAddressLine2Placeholder}
              value={formData.address2}
              onChange={e => setFormData({ ...formData, address2: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label={t.customerTown}
              name='town'
              placeholder={t.customerTownPlaceholder}
              value={formData.town}
              onChange={e => setFormData({ ...formData, town: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label={t.customerStateProvince}
              name='state'
              placeholder={t.customerStatePlaceholder}
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label={t.customerPostCode}
              name='postcode'
              placeholder={t.customerPostCodePlaceholder}
              value={formData.postcode}
              onChange={e => setFormData({ ...formData, postcode: e.target.value })}
            />
            <CustomTextField
              label={t.customerMobile}
              type='number'
              fullWidth
              placeholder={t.customerMobilePlaceholder}
              value={formData.contact}
              onChange={e => setFormData({ ...formData, contact: e.target.value })}
            />
            <div className='flex justify-between'>
              <div className='flex flex-col items-start gap-1'>
                <Typography color='text.primary' className='font-medium'>
                  {t.customerUseAsBillingAddress}
                </Typography>
                <Typography variant='body2'>{t.customerBillingAddressHelp}</Typography>
              </div>
              <Switch defaultChecked />
            </div>
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit'>
                {t.commonAdd}
              </Button>
              <Button variant='tonal' color='error' type='reset' onClick={handleReset}>
                {t.commonDiscard}
              </Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default AddCustomerDrawer
