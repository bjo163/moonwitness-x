// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Types Imports
import CustomTextField from '@moonwitness/ui/text-field'

import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: UsersType[]
  setData: (data: UsersType[]) => void
}

type FormValidateType = {
  fullName: string
  username: string
  email: string
  role: string
  plan: string
  status: string
}

type FormNonValidateType = {
  company: string
  country: string
  contact: string
}

// Vars
const initialData = {
  company: '',
  country: '',
  contact: ''
}

const AddUserDrawer = (props: Props) => {
  const t = useCommonTranslations()

  // Props
  const { open, handleClose, userData, setData } = props

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
      username: '',
      email: '',
      role: '',
      plan: '',
      status: ''
    }
  })

  const onSubmit = (data: FormValidateType) => {
    const newUser: UsersType = {
      id: (userData?.length && userData?.length + 1) || 1,
      avatar: `/images/avatars/${Math.floor(Math.random() * 8) + 1}.png`,
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      role: data.role,
      currentPlan: data.plan,
      status: data.status,
      company: formData.company,
      country: formData.country,
      contact: formData.contact,
      billing: userData?.[Math.floor(Math.random() * 50) + 1].billing ?? 'Auto Debit'
    }

    setData([...(userData ?? []), newUser])
    handleClose()
    setFormData(initialData)
    resetForm({ fullName: '', username: '', email: '', role: '', plan: '', status: '' })
  }

  const handleReset = () => {
    handleClose()
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
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>{t.userAddNew}</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form onSubmit={handleSubmit(data => onSubmit(data))} className='flex flex-col gap-6 p-6'>
          <Controller
            name='fullName'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label={t.formFullName}
                placeholder={t.formFullNamePlaceholder}
                {...(errors.fullName && { error: true, helperText: t.wizardRequired })}
              />
            )}
          />
          <Controller
            name='username'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label={t.wizardUsername}
                placeholder={t.userUsernamePlaceholder}
                {...(errors.username && { error: true, helperText: t.wizardRequired })}
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
            name='role'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                select
                fullWidth
                id='select-role'
                label={t.userSelectRole}
                {...field}
                {...(errors.role && { error: true, helperText: t.wizardRequired })}
              >
                <MenuItem value='admin'>{t.userRoleAdmin}</MenuItem>
                <MenuItem value='author'>{t.userRoleAuthor}</MenuItem>
                <MenuItem value='editor'>{t.userRoleEditor}</MenuItem>
                <MenuItem value='maintainer'>{t.userRoleMaintainer}</MenuItem>
                <MenuItem value='subscriber'>{t.userRoleSubscriber}</MenuItem>
              </CustomTextField>
            )}
          />
          <Controller
            name='plan'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                select
                fullWidth
                id='select-plan'
                label={t.userSelectPlan}
                {...field}
                slotProps={{
                  htmlInput: { placeholder: t.userSelectPlan }
                }}
                {...(errors.plan && { error: true, helperText: t.wizardRequired })}
              >
                <MenuItem value='basic'>{t.userPlanBasic}</MenuItem>
                <MenuItem value='company'>{t.userPlanCompany}</MenuItem>
                <MenuItem value='enterprise'>{t.userPlanEnterprise}</MenuItem>
                <MenuItem value='team'>{t.userPlanTeam}</MenuItem>
              </CustomTextField>
            )}
          />
          <Controller
            name='status'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                select
                fullWidth
                id='select-status'
                label={t.userSelectStatus}
                {...field}
                {...(errors.status && { error: true, helperText: t.wizardRequired })}
              >
                <MenuItem value='pending'>{t.userStatusPending}</MenuItem>
                <MenuItem value='active'>{t.userStatusActive}</MenuItem>
                <MenuItem value='inactive'>{t.userStatusInactive}</MenuItem>
              </CustomTextField>
            )}
          />
          <CustomTextField
            label={t.userCompany}
            fullWidth
            placeholder={t.userCompanyPlaceholder}
            value={formData.company}
            onChange={e => setFormData({ ...formData, company: e.target.value })}
          />
          <CustomTextField
            select
            fullWidth
            id='country'
            value={formData.country}
            onChange={e => setFormData({ ...formData, country: e.target.value })}
            label={t.formSelectCountry}
            slotProps={{
              htmlInput: { placeholder: t.wizardCountry }
            }}
          >
            <MenuItem value='India'>{t.userCountryIndia}</MenuItem>
            <MenuItem value='USA'>{t.wizardCountryUsa}</MenuItem>
            <MenuItem value='Australia'>{t.wizardCountryAustralia}</MenuItem>
            <MenuItem value='Germany'>{t.wizardCountryGermany}</MenuItem>
          </CustomTextField>
          <CustomTextField
            label={t.userContact}
            type='number'
            fullWidth
            placeholder={t.userContactPlaceholder}
            value={formData.contact}
            onChange={e => setFormData({ ...formData, contact: e.target.value })}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit'>
              {t.commonSubmit}
            </Button>
            <Button variant='tonal' color='error' type='reset' onClick={() => handleReset()}>
              {t.commonCancel}
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddUserDrawer
