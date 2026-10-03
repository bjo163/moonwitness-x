// React Imports
import { useState } from 'react'
import type { FormEvent } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  onFormSubmit: (formData: FormDataType) => void
}

export type FormDataType = {
  name: string
  company: string
  email: string
  address: string
  country: string
  contactNumber: string
}

// Vars
export const initialFormData: FormDataType = {
  name: '',
  company: '',
  email: '',
  address: '',
  country: 'USA',
  contactNumber: ''
}

const AddCustomerDrawer = ({ open, setOpen, onFormSubmit }: Props) => {
  const t = useCommonTranslations()

  const countries = [
    { value: 'usa', label: t.invoiceCountryUsa },
    { value: 'uk', label: t.invoiceCountryUk },
    { value: 'russia', label: t.invoiceCountryRussia },
    { value: 'australia', label: t.invoiceCountryAustralia },
    { value: 'canada', label: t.invoiceCountryCanada }
  ]

  // States
  const [data, setData] = useState<FormDataType>(initialFormData)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setOpen(false)
    onFormSubmit(data)
    handleReset()
  }

  const handleReset = () => {
    setOpen(false)
    setData(initialFormData)
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
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>{t.invoiceAddCustomer}</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6'>
        <form onSubmit={e => handleSubmit(e)} className='flex flex-col gap-5'>
          <CustomTextField
            fullWidth
            id='name'
            label={t.invoiceName}
            value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })}
          />
          <CustomTextField
            fullWidth
            id='company'
            label={t.invoiceCompany}
            value={data.company}
            onChange={e => setData({ ...data, company: e.target.value })}
          />
          <CustomTextField
            fullWidth
            id='email'
            label={t.invoiceEmail}
            value={data.email}
            onChange={e => setData({ ...data, email: e.target.value })}
          />
          <CustomTextField
            rows={6}
            multiline
            fullWidth
            id='address'
            label={t.invoiceAddress}
            value={data.address}
            onChange={e => setData({ ...data, address: e.target.value })}
          />
          <CustomTextField
            select
            id='country'
            label={t.invoiceCountry}
            name='country'
            variant='outlined'
            value={data?.country?.toLowerCase().replace(/\s+/g, '-') || ''}
            onChange={e => setData({ ...data, country: e.target.value })}
          >
            {countries.map(item => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </CustomTextField>
          <CustomTextField
            fullWidth
            id='contact'
            type='number'
            label={t.invoiceContactNumber}
            value={data.contactNumber}
            onChange={e => setData({ ...data, contactNumber: e.target.value })}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit'>
              {t.invoiceAdd}
            </Button>
            <Button variant='tonal' color='error' type='reset' onClick={handleReset}>
              {t.commonCancel}
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddCustomerDrawer
