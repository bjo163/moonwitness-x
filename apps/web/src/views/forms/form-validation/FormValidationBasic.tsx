'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormLabel from '@mui/material/FormLabel'
import FormHelperText from '@mui/material/FormHelperText'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import { toast } from 'react-toastify'
import { useForm, Controller } from 'react-hook-form'

// Components Imports
import CustomTextField from '@moonwitness/ui/text-field'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type FormValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  dob: Date | null | undefined
  select: string
  textarea: string
  radio: boolean
  checkbox: boolean
}

const FormValidationBasic = () => {
  const t = useCommonTranslations()

  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      dob: null,
      select: '',
      textarea: '',
      radio: false,
      checkbox: false
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const onSubmit = () => toast.success(t.wizardFormSubmitted)

  return (
    <Card>
      <CardHeader title={t.formValidationBasic} />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='firstName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label={t.wizardFirstName}
                    placeholder={t.wizardFirstNamePlaceholder}
                    {...(errors.firstName && { error: true, helperText: t.wizardRequired })}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='lastName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label={t.wizardLastName}
                    placeholder={t.wizardLastNamePlaceholder}
                    {...(errors.lastName && { error: true, helperText: t.wizardRequired })}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='password'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label={t.wizardPassword}
                    placeholder={t.wizardPasswordPlaceholder}
                    id='form-validation-basic-password'
                    type={isPasswordShown ? 'text' : 'password'}
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
                              <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                    {...(errors.password && { error: true, helperText: t.wizardRequired })}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='dob'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <AppReactDatepicker
                    selected={value}
                    showYearDropdown
                    showMonthDropdown
                    onChange={onChange}
                    placeholderText={t.formDatePlaceholder}
                    customInput={
                      <CustomTextField
                        value={value}
                        onChange={onChange}
                        fullWidth
                        label={t.formBirthDate}
                        {...(errors.dob && { error: true, helperText: t.wizardRequired })}
                      />
                    }
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='select'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField select fullWidth label={t.wizardCountry} {...field} error={Boolean(errors.select)}>
                    <MenuItem value=''>{t.formSelectCountry}</MenuItem>
                    <MenuItem value='UK'>{t.wizardCountryUk}</MenuItem>
                    <MenuItem value='USA'>{t.wizardCountryUsa}</MenuItem>
                    <MenuItem value='Australia'>{t.wizardCountryAustralia}</MenuItem>
                    <MenuItem value='Germany'>{t.wizardCountryGermany}</MenuItem>
                  </CustomTextField>
                )}
              />
              {errors.select && <FormHelperText error>{t.wizardRequired}</FormHelperText>}
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name='textarea'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    rows={4}
                    fullWidth
                    multiline
                    label={t.formBio}
                    {...(errors.textarea && { error: true, helperText: t.wizardRequired })}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl error={Boolean(errors.radio)}>
                <FormLabel>{t.formGender}</FormLabel>
                <Controller
                  name='radio'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <RadioGroup row {...field} name='radio-buttons-group'>
                      <FormControlLabel value='female' control={<Radio />} label={t.formGenderFemale} />
                      <FormControlLabel value='male' control={<Radio />} label={t.formGenderMale} />
                      <FormControlLabel value='other' control={<Radio />} label={t.formGenderOther} />
                    </RadioGroup>
                  )}
                />
                {errors.radio && <FormHelperText error>{t.wizardRequired}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl error={Boolean(errors.checkbox)}>
                <Controller
                  name='checkbox'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <FormControlLabel control={<Checkbox {...field} />} label={t.formAgreeTerms} />
                  )}
                />
                {errors.checkbox && <FormHelperText error>{t.wizardRequired}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }} className='flex gap-4'>
              <Button variant='contained' type='submit'>
                {t.commonSubmit}
              </Button>
              <Button variant='tonal' color='secondary' type='reset' onClick={() => reset()}>
                {t.commonReset}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default FormValidationBasic
