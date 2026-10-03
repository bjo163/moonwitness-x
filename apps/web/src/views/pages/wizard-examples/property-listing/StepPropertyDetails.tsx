// React Imports
import { useId, useState } from 'react'
import type { ChangeEvent } from 'react'

// MUI IMports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import type { TypographyProps } from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import CustomTextField from '@moonwitness/ui/text-field'

import type { CustomInputVerticalData } from '@core/components/custom-inputs/types'

// Component Imports
import CustomInputVertical from '@core/components/custom-inputs/Vertical'
import DirectionalIcon from '@components/DirectionalIcon'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type Props = {
  activeStep: number
  handleNext: () => void
  handlePrev: () => void
  steps: { title: string; subtitle: string }[]
}

// Styled Components
const Content = styled(Typography, {
  name: 'MuiCustomInputVertical',
  slot: 'content'
})<TypographyProps>(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center'
}))

const StepPropertyDetails = ({ activeStep, handleNext, handlePrev, steps }: Props) => {
  const t = useCommonTranslations()
  const countrySelectId = useId()

  const data: CustomInputVerticalData[] = [
    {
      value: 'sale',
      title: t.propertySell,
      content: (
        <Content>
          {t.propertyPostForSale}
          <br />
          {t.propertyFreeListing}
        </Content>
      ),
      asset: 'tabler-home',
      isSelected: true
    },
    {
      value: 'rent',
      title: t.propertyRent,
      content: (
        <Content>
          {t.propertyPostForRent}
          <br />
          {t.propertyFreeListing}
        </Content>
      ),
      asset: 'tabler-wallet'
    }
  ]

  // Vars
  const initialSelectedOption: string = data.filter(item => item.isSelected)[
    data.filter(item => item.isSelected).length - 1
  ].value

  // States
  const [selectedOption, setSelectedOption] = useState<string>(initialSelectedOption)

  const handleOptionChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    if (typeof prop === 'string') {
      setSelectedOption(prop)
    } else {
      setSelectedOption((prop.target as HTMLInputElement).value)
    }
  }

  return (
    <Grid container spacing={6}>
      {data.map((item, index) => {
        let asset

        if (item.asset && typeof item.asset === 'string') {
          asset = <i className={classnames(item.asset, 'text-[28px]')} />
        }

        return (
          <CustomInputVertical
            type='radio'
            key={index}
            gridProps={{ size: { xs: 12, sm: 6 } }}
            selected={selectedOption}
            name='custom-radios-basic'
            handleChange={handleOptionChange}
            data={typeof item.asset === 'string' ? { ...item, asset } : item}
          />
        )
      })}
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField select fullWidth label={t.propertyType} id='validation-property-select' defaultValue=''>
          <MenuItem value=''>{t.propertySelectType}</MenuItem>
          <MenuItem value='residential'>{t.propertyResidential}</MenuItem>
          <MenuItem value='commercial'>{t.propertyCommercial}</MenuItem>
        </CustomTextField>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField fullWidth type='number' label={t.propertyZipCode} placeholder='99950' />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          select
          fullWidth
          label={t.wizardCountry}
          id={countrySelectId}
          aria-describedby={countrySelectId}
          defaultValue=''
        >
          <MenuItem value=''>{t.formSelectCountry}</MenuItem>
          <MenuItem value='UK'>{t.wizardCountryUk}</MenuItem>
          <MenuItem value='USA'>{t.wizardCountryUsa}</MenuItem>
          <MenuItem value='India'>{t.userCountryIndia}</MenuItem>
          <MenuItem value='Australia'>{t.wizardCountryAustralia}</MenuItem>
          <MenuItem value='Germany'>{t.wizardCountryGermany}</MenuItem>
        </CustomTextField>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField fullWidth label={t.formLandmark} placeholder={t.propertyLandmarkPlaceholder} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField fullWidth label={t.formCity} placeholder={t.propertyCityPlaceholder} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField fullWidth label={t.propertyState} placeholder={t.propertyStatePlaceholder} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <CustomTextField
          fullWidth
          multiline
          minRows={2}
          label={t.formAddress}
          placeholder={t.propertyAddressPlaceholder}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <div className='flex items-center justify-between'>
          <Button
            variant='tonal'
            color='secondary'
            disabled={activeStep === 0}
            onClick={handlePrev}
            startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
          >
            {t.formPrevious}
          </Button>
          <Button
            variant='contained'
            color={activeStep === steps.length - 1 ? 'success' : 'primary'}
            onClick={handleNext}
            endIcon={
              activeStep === steps.length - 1 ? (
                <i className='tabler-check' />
              ) : (
                <DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />
              )
            }
          >
            {activeStep === steps.length - 1 ? t.commonSubmit : t.commonNext}
          </Button>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepPropertyDetails
