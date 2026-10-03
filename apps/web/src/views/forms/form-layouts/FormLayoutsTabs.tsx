'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Tab from '@mui/material/Tab'
import MenuItem from '@mui/material/MenuItem'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

// Components Imports
import CustomTextField from '@moonwitness/ui/text-field'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

type FormDataType = {
  firstName: string
  lastName: string
  country: string
  language: string[]
  date: Date | null
  phoneNumber: string
  username: string
  email: string
  password: string
  isPasswordShown: boolean
  confirmPassword: string
  setIsConfirmPasswordShown: boolean
  twitter: string
  facebook: string
  google: string
  linkedin: string
  instagram: string
  quora: string
}

const FormLayoutsWithTabs = () => {
  const t = useCommonTranslations()

  // States
  const [value, setValue] = useState('personal_info')

  const [formData, setFormData] = useState<FormDataType>({
    firstName: '',
    lastName: '',
    country: '',
    language: [],
    date: null,
    phoneNumber: '',
    username: '',
    email: '',
    password: '',
    isPasswordShown: false,
    confirmPassword: '',
    setIsConfirmPasswordShown: false,
    twitter: '',
    facebook: '',
    google: '',
    linkedin: '',
    instagram: '',
    quora: ''
  })

  const handleClickShowPassword = () => setFormData(show => ({ ...show, isPasswordShown: !show.isPasswordShown }))

  const handleClickShowConfirmPassword = () =>
    setFormData(show => ({ ...show, setIsConfirmPasswordShown: !show.setIsConfirmPasswordShown }))

  const handleTabChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      country: '',
      language: [],
      date: null,
      phoneNumber: '',
      username: '',
      email: '',
      password: '',
      isPasswordShown: false,
      confirmPassword: '',
      setIsConfirmPasswordShown: false,
      twitter: '',
      facebook: '',
      google: '',
      linkedin: '',
      instagram: '',
      quora: ''
    })
  }

  return (
    <Card>
      <TabContext value={value}>
        <TabList variant='scrollable' onChange={handleTabChange} className='border-be'>
          <Tab label={t.wizardPersonalInfo} value='personal_info' />
          <Tab label={t.wizardAccountDetails} value='account_details' />
          <Tab label={t.wizardSocialLinks} value='social_links' />
        </TabList>
        <form onSubmit={e => e.preventDefault()}>
          <CardContent>
            <TabPanel value='personal_info'>
              <Grid container spacing={6}>
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
            </TabPanel>
            <TabPanel value='account_details'>
              <Grid container spacing={6}>
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
                    placeholder={t.wizardEmailPlaceholder}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label={t.wizardPassword}
                    placeholder={t.wizardPasswordPlaceholder}
                    id='form-layout-tabs-password'
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
                    id='form-layout-tabs-confirm-password'
                    type={formData.setIsConfirmPasswordShown ? 'text' : 'password'}
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
                              aria-label={t.wizardTogglePasswordVisibility}
                            >
                              <i className={formData.setIsConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </TabPanel>
            <TabPanel value='social_links'>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label={t.formTwitter}
                    placeholder={t.formTwitterPlaceholder}
                    value={formData.twitter}
                    onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label={t.formFacebook}
                    placeholder={t.formFacebookPlaceholder}
                    value={formData.facebook}
                    onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label={t.formGooglePlus}
                    placeholder={t.formGooglePlusPlaceholder}
                    value={formData.google}
                    onChange={e => setFormData({ ...formData, google: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label={t.formLinkedIn}
                    placeholder={t.formLinkedInPlaceholder}
                    value={formData.linkedin}
                    onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label={t.formInstagram}
                    placeholder={t.formInstagramPlaceholder}
                    value={formData.instagram}
                    onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label={t.formQuora}
                    placeholder={t.formQuoraPlaceholder}
                    value={formData.quora}
                    onChange={e => setFormData({ ...formData, quora: e.target.value })}
                  />
                </Grid>
              </Grid>
            </TabPanel>
          </CardContent>
          <Divider />
          <CardActions>
            <Button type='submit' variant='contained' className='mie-2'>
              {t.commonSubmit}
            </Button>
            <Button type='reset' variant='tonal' color='secondary' onClick={() => handleReset()}>
              {t.commonReset}
            </Button>
          </CardActions>
        </form>
      </TabContext>
    </Card>
  )
}

export default FormLayoutsWithTabs
