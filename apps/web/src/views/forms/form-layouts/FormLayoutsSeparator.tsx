'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

// Components Imports
import CustomTextField from '@moonwitness/ui/text-field'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

type FormDataType = {
  username: string
  email: string
  password: string
  isPasswordShown: boolean
  confirmPassword: string
  isConfirmPasswordShown: boolean
  firstName: string
  lastName: string
  country: string
  language: string[]
  date: Date | null
  phoneNumber: string
}

const FormLayoutsSeparator = () => {
  const t = useCommonTranslations()

  // States
  const [formData, setFormData] = useState<FormDataType>({
    username: '',
    email: '',
    password: '',
    isPasswordShown: false,
    confirmPassword: '',
    isConfirmPasswordShown: false,
    firstName: '',
    lastName: '',
    country: '',
    language: [],
    date: null,
    phoneNumber: ''
  })

  const handleClickShowPassword = () => setFormData(show => ({ ...show, isPasswordShown: !show.isPasswordShown }))

  const handleClickShowConfirmPassword = () =>
    setFormData(show => ({ ...show, isConfirmPasswordShown: !show.isConfirmPasswordShown }))

  const handleReset = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      isPasswordShown: false,
      confirmPassword: '',
      isConfirmPasswordShown: false,
      firstName: '',
      lastName: '',
      country: '',
      language: [],
      date: null,
      phoneNumber: ''
    })
  }

  return (
    <Card>
      <CardHeader title={t.formSeparatorTitle} />
      <Divider />
      <form onSubmit={e => e.preventDefault()}>
        <CardContent>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <Typography variant='body2' className='font-medium'>
                {t.formSectionAccountDetails}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.wizardUsername}
                placeholder={t.wizardUsernamePlaceholder}
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='email'
                label={t.wizardEmail}
                value={formData.email}
                placeholder={t.wizardEmailPlaceholder}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.wizardPassword}
                placeholder={t.wizardPasswordPlaceholder}
                id='form-layout-separator-password'
                type={formData.isPasswordShown ? 'text' : 'password'}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={handleClickShowPassword}
                          onMouseDown={e => e.preventDefault()}
                          aria-label={t.wizardTogglePasswordVisibility}
                        >
                          <i className={formData.isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.wizardConfirmPassword}
                placeholder={t.wizardPasswordPlaceholder}
                id='form-layout-separator-confirm-password'
                type={formData.isConfirmPasswordShown ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={handleClickShowConfirmPassword}
                          onMouseDown={e => e.preventDefault()}
                          aria-label={t.wizardToggleConfirmPasswordVisibility}
                        >
                          <i className={formData.isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant='body2' className='font-medium'>
                {t.formSectionPersonalInfo}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.wizardFirstName}
                placeholder={t.wizardFirstNamePlaceholder}
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.wizardLastName}
                placeholder={t.wizardLastNamePlaceholder}
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t.wizardCountry}
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
              >
                <MenuItem value=''>{t.formSelectCountry}</MenuItem>
                <MenuItem value='UK'>{t.wizardCountryUk}</MenuItem>
                <MenuItem value='USA'>{t.wizardCountryUsa}</MenuItem>
                <MenuItem value='Australia'>{t.wizardCountryAustralia}</MenuItem>
                <MenuItem value='Germany'>{t.wizardCountryGermany}</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t.wizardLanguage}
                value={formData.language}
                slotProps={{
                  select: {
                    multiple: true,
                    onChange: e => setFormData({ ...formData, language: e.target.value as string[] })
                  }
                }}
              >
                <MenuItem value='English'>{t.wizardLanguageEnglish}</MenuItem>
                <MenuItem value='French'>{t.wizardLanguageFrench}</MenuItem>
                <MenuItem value='Spanish'>{t.wizardLanguageSpanish}</MenuItem>
                <MenuItem value='Portuguese'>{t.wizardLanguagePortuguese}</MenuItem>
                <MenuItem value='Italian'>{t.wizardLanguageItalian}</MenuItem>
                <MenuItem value='German'>{t.wizardLanguageGerman}</MenuItem>
                <MenuItem value='Arabic'>{t.wizardLanguageArabic}</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppReactDatepicker
                selected={formData.date}
                showYearDropdown
                showMonthDropdown
                onChange={(date: Date | null) => setFormData({ ...formData, date })}
                placeholderText={t.formDatePlaceholder}
                customInput={
                  <CustomTextField fullWidth label={t.formBirthDate} placeholder={t.formDateInputPlaceholder} />
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.formPhoneNumber}
                type='number'
                placeholder={t.formPhonePlaceholder}
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions>
          <Button type='submit' variant='contained' className='mie-2'>
            {t.commonSubmit}
          </Button>
          <Button
            type='reset'
            variant='tonal'
            color='secondary'
            onClick={() => {
              handleReset()
            }}
          >
            {t.commonReset}
          </Button>
        </CardActions>
      </form>
    </Card>
  )
}

export default FormLayoutsSeparator
