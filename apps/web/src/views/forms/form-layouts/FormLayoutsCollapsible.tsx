'use client'

// React Imports
import { useState } from 'react'
import type { ChangeEvent, SyntheticEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Accordion from '@mui/material/Accordion'
import Radio from '@mui/material/Radio'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import FormLabel from '@mui/material/FormLabel'
import FormControlLabel from '@mui/material/FormControlLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Typography from '@mui/material/Typography'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

// Type Imports
import CustomTextField from '@moonwitness/ui/text-field'

import type { CustomInputHorizontalData } from '@core/components/custom-inputs/types'

// Component Imports
import CustomInputHorizontal from '@core/components/custom-inputs/Horizontal'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type FormData = {
  fullName: string
  phone: string
  address: string
  zipCode: string
  landmark: string
  city: string
  country: string
  addressType: string
  number: string
  name: string
  expiry: string
  cvv: string
}

const FormLayoutsCollapsible = () => {
  const t = useCommonTranslations()

  const data: CustomInputHorizontalData[] = [
    {
      title: t.formDeliveryStandard,
      meta: t.formDeliveryFree,
      content: t.formDeliveryStandardDate,
      isSelected: true,
      value: 'standard'
    },
    { title: t.formDeliveryExpress, meta: '$5.00', content: t.formDeliveryExpressDate, value: 'express' },
    { title: t.formDeliveryOvernight, meta: '$10.00', content: t.formDeliveryOvernightDate, value: 'overnight' }
  ]

  // Vars
  const initialSelectedOption: string = data.filter(item => item.isSelected)[
    data.filter(item => item.isSelected).length - 1
  ].value

  // States
  const [expanded, setExpanded] = useState<string | false>('panel1')
  const [paymentMethod, setPaymentMethod] = useState('credit')
  const [selectedOption, setSelectedOption] = useState<string>(initialSelectedOption)

  const [cardData, setCardData] = useState<FormData>({
    fullName: '',
    phone: '',
    address: '',
    zipCode: '',
    landmark: '',
    city: '',
    country: '',
    addressType: 'home',
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  })

  const handleExpandChange = (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const handleOptionChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    if (typeof prop === 'string') {
      setSelectedOption(prop)
    } else {
      setSelectedOption((prop.target as HTMLInputElement).value)
    }
  }

  const handleReset = () => {
    setCardData({
      fullName: '',
      phone: '',
      address: '',
      zipCode: '',
      landmark: '',
      city: '',
      country: '',
      addressType: '',
      number: '',
      name: '',
      expiry: '',
      cvv: ''
    })
  }

  return (
    <form onSubmit={e => e.preventDefault()}>
      <Accordion expanded={expanded === 'panel1'} onChange={handleExpandChange('panel1')}>
        <AccordionSummary expandIcon={<i className='tabler-chevron-right' />}>
          <Typography>{t.formDeliveryAddress}</Typography>
        </AccordionSummary>
        <Divider />
        <AccordionDetails className='pbs-6!'>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.formFullName}
                placeholder={t.formFullNamePlaceholder}
                value={cardData.fullName}
                onChange={e => setCardData({ ...cardData, fullName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.formPhoneNumber}
                placeholder={t.formPhonePlaceholder}
                value={cardData.phone}
                onChange={e => setCardData({ ...cardData, phone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                rows={4}
                multiline
                label={t.formAddress}
                placeholder={t.formAddressPlaceholder}
                value={cardData.address}
                onChange={e => setCardData({ ...cardData, address: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='number'
                label={t.formZipCode}
                placeholder='10005'
                value={cardData.zipCode}
                onChange={e => setCardData({ ...cardData, zipCode: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.formLandmark}
                placeholder={t.formLandmarkPlaceholder}
                value={cardData.landmark}
                onChange={e => setCardData({ ...cardData, landmark: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t.formCity}
                placeholder={t.formCityPlaceholder}
                value={cardData.city}
                onChange={e => setCardData({ ...cardData, city: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t.wizardCountry}
                value={cardData.country}
                onChange={e => setCardData({ ...cardData, country: e.target.value })}
              >
                <MenuItem value=''>{t.formSelectCountry}</MenuItem>
                <MenuItem value='UK'>{t.wizardCountryUk}</MenuItem>
                <MenuItem value='USA'>{t.wizardCountryUsa}</MenuItem>
                <MenuItem value='Australia'>{t.wizardCountryAustralia}</MenuItem>
                <MenuItem value='Germany'>{t.wizardCountryGermany}</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormLabel>{t.formAddressType}</FormLabel>
              <RadioGroup
                row
                name='radio-buttons-group'
                value={cardData.addressType}
                onChange={e => setCardData({ ...cardData, addressType: e.target.value })}
              >
                <FormControlLabel value='home' control={<Radio />} label={t.formAddressHome} />
                <FormControlLabel value='office' control={<Radio />} label={t.formAddressOffice} />
              </RadioGroup>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel2'} onChange={handleExpandChange('panel2')}>
        <AccordionSummary expandIcon={<i className='tabler-chevron-right' />}>
          <Typography>{t.formDeliveryOptions}</Typography>
        </AccordionSummary>
        <Divider />
        <AccordionDetails className='pbs-6!'>
          <Grid container>
            {data.map((item, index) => (
              <CustomInputHorizontal
                type='radio'
                key={index}
                data={item}
                gridProps={{
                  size: { xs: 12 },
                  className:
                    '[&:first-of-type>*]:rounded-be-none [&:last-of-type>*]:rounded-bs-none [&:nth-of-type(2)>*]:rounded-none'
                }}
                selected={selectedOption}
                name='custom-radios-basic'
                handleChange={handleOptionChange}
              />
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel3'} onChange={handleExpandChange('panel3')}>
        <AccordionSummary expandIcon={<i className='tabler-chevron-right' />}>
          <Typography>{t.formPaymentMethod}</Typography>
        </AccordionSummary>
        <Divider />
        <AccordionDetails className='pbs-6!'>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                  <RadioGroup
                    row
                    name='payment-method-radio'
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <FormControlLabel
                      value='credit'
                      control={<Radio />}
                      label={t.formCreditCard}
                      className='text-textPrimary'
                    />
                    <FormControlLabel
                      value='cash'
                      control={<Radio />}
                      label={t.formCashOnDelivery}
                      className='text-textPrimary'
                    />
                  </RadioGroup>
                </Grid>
                {paymentMethod === 'credit' ? (
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={6}>
                      <Grid size={{ xs: 12 }}>
                        <CustomTextField
                          fullWidth
                          name='number'
                          autoComplete='off'
                          label={t.formCardNumber}
                          placeholder='0000 0000 0000 0000'
                          value={cardData.number}
                          onChange={e => setCardData({ ...cardData, number: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomTextField
                          fullWidth
                          name='name'
                          label={t.formNameOnCard}
                          autoComplete='off'
                          placeholder={t.formFullNamePlaceholder}
                          value={cardData.name}
                          onChange={e => setCardData({ ...cardData, name: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <CustomTextField
                          fullWidth
                          name='expiry'
                          autoComplete='off'
                          label={t.formExpiryDate}
                          placeholder={t.formExpiryPlaceholder}
                          value={cardData.expiry}
                          onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <CustomTextField
                          fullWidth
                          name='cvv'
                          label={t.formCvvCode}
                          autoComplete='off'
                          placeholder='123'
                          value={cardData.cvv}
                          onChange={e => setCardData({ ...cardData, cvv: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                ) : null}
              </Grid>
            </Grid>
          </Grid>
        </AccordionDetails>
        <Divider />
        <AccordionDetails className='flex gap-4 pbs-6'>
          <Button type='submit' variant='contained'>
            {t.formPlaceOrder}
          </Button>
          <Button type='reset' variant='tonal' color='secondary' onClick={() => handleReset()}>
            {t.commonReset}
          </Button>
        </AccordionDetails>
      </Accordion>
    </form>
  )
}

export default FormLayoutsCollapsible
