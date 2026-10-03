'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const Address = () => {
  const t = useCommonTranslations()

  // States
  const [state, setState] = useState('')

  return (
    <Card>
      <CardHeader title={t.billingAddress} />
      <CardContent>
        <form>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.companyName}
                variant='outlined'
                placeholder={t.profileExampleOrganizationPlaceholder}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.billingEmail}
                variant='outlined'
                placeholder={t.profileExampleEmailPlaceholder}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField fullWidth label={t.taxId} variant='outlined' placeholder={t.enterTaxId} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField fullWidth label={t.vatNumber} variant='outlined' placeholder={t.enterVatNumber} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='number'
                label={t.mobileNumber}
                placeholder='202 555 0111'
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position='start'>{t.phonePrefixUs}</InputAdornment>
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t.country}
                value={state}
                onChange={e => setState(e.target.value)}
              >
                <MenuItem value=''>{t.selectCountry}</MenuItem>
                <MenuItem value='australia'>{t.countryAustralia}</MenuItem>
                <MenuItem value='canada'>{t.countryCanada}</MenuItem>
                <MenuItem value='france'>{t.countryFrance}</MenuItem>
                <MenuItem value='united-kingdom'>{t.countryUnitedKingdom}</MenuItem>
                <MenuItem value='united-states'>{t.countryUnitedStates}</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={t.billingAddress}
                variant='outlined'
                placeholder={t.profileExampleAddressPlaceholder}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.profileStateLabel}
                variant='outlined'
                placeholder={t.profileExampleStatePlaceholder}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='number'
                label={t.zipCode}
                variant='outlined'
                placeholder={t.profileExampleZipPlaceholder}
              />
            </Grid>
            <Grid size={{ xs: 12 }} className='flex gap-4 flex-wrap'>
              <Button variant='contained'>{t.saveChanges}</Button>
              <Button variant='tonal' type='reset' color='secondary' onClick={() => setState('')}>
                {t.discard}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default Address
