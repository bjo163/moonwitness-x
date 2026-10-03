'use client'

// React Imports
import { useState } from 'react'
import type { ChangeEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import type { SelectChangeEvent } from '@mui/material/Select'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type Data = {
  firstName: string
  lastName: string
  email: string
  organization: string
  phoneNumber: number | string
  address: string
  state: string
  zipCode: string
  country: string
  language: string
  timezone: string
  currency: string
}

const AccountDetails = () => {
  const t = useCommonTranslations()

  const initialData: Data = {
    firstName: t.profileExampleFirstName,
    lastName: t.profileExampleLastName,
    email: t.profileExampleEmail,
    organization: 'Pixinvent',
    phoneNumber: t.profileExamplePhone,
    address: t.profileExampleAddress,
    state: t.profileExampleState,
    zipCode: t.profileExampleZip,
    country: 'usa',
    language: 'english',
    timezone: 'gmt-12',
    currency: 'usd'
  }

  const languageData = [
    { value: 'english', label: t.languageEnglish },
    { value: 'arabic', label: t.languageArabic },
    { value: 'french', label: t.languageFrench },
    { value: 'german', label: t.languageGerman },
    { value: 'portuguese', label: t.languagePortuguese }
  ]

  // States
  const [formData, setFormData] = useState<Data>(initialData)
  const [fileInput, setFileInput] = useState<string>('')
  const [imgSrc, setImgSrc] = useState<string>('/images/avatars/1.png')
  const [language, setLanguage] = useState<string[]>(['english'])

  const handleDelete = (value: string) => {
    setLanguage(current => current.filter(item => item !== value))
  }

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    setLanguage(event.target.value as string[])
  }

  const handleFormChange = (field: keyof Data, value: Data[keyof Data]) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleFileInputChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {
      reader.onload = () => setImgSrc(reader.result as string)
      reader.readAsDataURL(files[0])

      if (reader.result !== null) {
        setFileInput(reader.result as string)
      }
    }
  }

  const handleFileInputReset = () => {
    setFileInput('')
    setImgSrc('/images/avatars/1.png')
  }

  return (
    <Card>
      <CardContent className='mbe-4'>
        <div className='flex max-sm:flex-col items-center gap-6'>
          <img height={100} width={100} className='rounded' src={imgSrc} alt={t.profile} />
          <div className='flex grow flex-col gap-4'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <Button component='label' variant='contained' htmlFor='account-settings-upload-image'>
                {t.uploadNewPhoto}
                <input
                  hidden
                  type='file'
                  value={fileInput}
                  accept='image/png, image/jpeg'
                  onChange={handleFileInputChange}
                  id='account-settings-upload-image'
                />
              </Button>
              <Button variant='tonal' color='secondary' onClick={handleFileInputReset}>
                {t.reset}
              </Button>
            </div>
            <Typography>{t.allowedImageTypes}</Typography>
          </div>
        </div>
      </CardContent>
      <CardContent>
        <form onSubmit={e => e.preventDefault()}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.firstNameLabel}
                value={formData.firstName}
                placeholder={t.profileExampleFirstNamePlaceholder}
                onChange={e => handleFormChange('firstName', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.lastNameLabel}
                value={formData.lastName}
                placeholder={t.profileExampleLastNamePlaceholder}
                onChange={e => handleFormChange('lastName', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.email}
                value={formData.email}
                placeholder={t.profileExampleEmailPlaceholder}
                onChange={e => handleFormChange('email', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.organization}
                value={formData.organization}
                placeholder={t.profileExampleOrganizationPlaceholder}
                onChange={e => handleFormChange('organization', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.phoneNumber}
                value={formData.phoneNumber}
                placeholder={t.profileExamplePhonePlaceholder}
                onChange={e => handleFormChange('phoneNumber', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.profileAddressLabel}
                value={formData.address}
                placeholder={t.profileExampleAddressPlaceholder}
                onChange={e => handleFormChange('address', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.profileStateLabel}
                value={formData.state}
                placeholder={t.profileExampleStatePlaceholder}
                onChange={e => handleFormChange('state', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='number'
                label={t.zipCode}
                value={formData.zipCode}
                placeholder={t.profileExampleZipPlaceholder}
                onChange={e => handleFormChange('zipCode', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t.country}
                value={formData.country}
                onChange={e => handleFormChange('country', e.target.value)}
              >
                <MenuItem value='usa'>{t.countryUsa}</MenuItem>
                <MenuItem value='uk'>{t.countryUk}</MenuItem>
                <MenuItem value='australia'>{t.countryAustralia}</MenuItem>
                <MenuItem value='germany'>{t.countryGermany}</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t.language}
                value={language}
                slotProps={{
                  select: {
                    multiple: true, // @ts-ignore
                    onChange: handleChange,
                    renderValue: selected => (
                      <div className='flex flex-wrap gap-2'>
                        {(selected as string[]).map(value => (
                          <Chip
                            key={value}
                            clickable
                            onMouseDown={event => event.stopPropagation()}
                            size='small'
                            label={languageData.find(item => item.value === value)?.label ?? value}
                            onDelete={() => handleDelete(value)}
                          />
                        ))}
                      </div>
                    )
                  }
                }}
              >
                {languageData.map(item => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t.timeZone}
                value={formData.timezone}
                onChange={e => handleFormChange('timezone', e.target.value)}
                slotProps={{
                  select: { MenuProps: { PaperProps: { style: { maxHeight: 250 } } } }
                }}
              >
                <MenuItem value='gmt-12'>{t.timezoneInternationalDateLine}</MenuItem>
                <MenuItem value='gmt-11'>{t.timezoneMidwaySamoa}</MenuItem>
                <MenuItem value='gmt-10'>{t.timezoneHawaii}</MenuItem>
                <MenuItem value='gmt-09'>{t.timezoneAlaska}</MenuItem>
                <MenuItem value='gmt-08'>{t.timezonePacific}</MenuItem>
                <MenuItem value='gmt-08-baja'>{t.timezoneTijuana}</MenuItem>
                <MenuItem value='gmt-07'>{t.timezoneChihuahua}</MenuItem>
                <MenuItem value='gmt-07-mt'>{t.timezoneMountain}</MenuItem>
                <MenuItem value='gmt-06'>{t.timezoneCentralAmerica}</MenuItem>
                <MenuItem value='gmt-06-ct'>{t.timezoneCentral}</MenuItem>
                <MenuItem value='gmt-06-mc'>{t.timezoneMexico}</MenuItem>
                <MenuItem value='gmt-06-sk'>{t.timezoneSaskatchewan}</MenuItem>
                <MenuItem value='gmt-05'>{t.timezoneBogotaLima}</MenuItem>
                <MenuItem value='gmt-05-et'>{t.timezoneEastern}</MenuItem>
                <MenuItem value='gmt-05-ind'>{t.timezoneIndiana}</MenuItem>
                <MenuItem value='gmt-04'>{t.timezoneAtlantic}</MenuItem>
                <MenuItem value='gmt-04-clp'>{t.timezoneCaracas}</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t.currency}
                value={formData.currency}
                onChange={e => handleFormChange('currency', e.target.value)}
              >
                <MenuItem value='usd'>{t.currencyUsd}</MenuItem>
                <MenuItem value='euro'>{t.currencyEur}</MenuItem>
                <MenuItem value='pound'>{t.currencyPound}</MenuItem>
                <MenuItem value='bitcoin'>{t.currencyBitcoin}</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }} className='flex gap-4 flex-wrap'>
              <Button variant='contained' type='submit'>
                {t.saveChanges}
              </Button>
              <Button variant='tonal' type='reset' color='secondary' onClick={() => setFormData(initialData)}>
                {t.reset}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default AccountDetails
