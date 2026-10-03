'use client'

// React Imports
import { useMemo, useState } from 'react'

// MUI Imports

import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Step from '@mui/material/Step'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MuiStepper from '@mui/material/Stepper'
import MenuItem from '@mui/material/MenuItem'
import StepLabel from '@mui/material/StepLabel'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import type { StepperProps } from '@mui/material/Stepper'

// Third-party Imports
import { toast } from 'react-toastify'
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { email, object, minLength, string, array, forward, pipe, nonEmpty, check } from 'valibot'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import StepperWrapper from '@core/styles/stepper'
import StepperCustomDot from '@components/stepper-dot'
import DirectionalIcon from '@components/DirectionalIcon'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Styled Components
const Stepper = styled(MuiStepper)<StepperProps>(({ theme }) => ({
  justifyContent: 'center',
  '& .MuiStep-root': {
    '&:first-of-type': {
      paddingInlineStart: 0
    },
    '&:last-of-type': {
      paddingInlineEnd: 0
    },
    [theme.breakpoints.down('md')]: {
      paddingInline: 0
    }
  }
}))

const StepperLinearWithValidation = () => {
  const t = useCommonTranslations()

  const steps = [
    { title: t.wizardAccountDetails, subtitle: t.wizardAccountDetailsSubtitle },
    { title: t.wizardPersonalInfo, subtitle: t.wizardPersonalInfoSubtitle },
    { title: t.wizardSocialLinks, subtitle: t.wizardSocialLinksSubtitle }
  ]

  const schemas = useMemo(() => {
    const required = t.wizardRequired

    const accountValidationSchema = object({
      username: pipe(string(), nonEmpty(required), minLength(1)),
      email: pipe(string(), nonEmpty(required), email(t.wizardInvalidEmail)),
      password: pipe(string(), nonEmpty(required), minLength(8, t.wizardPasswordMinLength)),
      confirmPassword: pipe(string(), nonEmpty(required), minLength(1))
    })

    return {
      account: pipe(
        accountValidationSchema,
        forward(
          check(input => input.password === input.confirmPassword, t.wizardPasswordsMismatch),
          ['confirmPassword']
        )
      ),
      personal: object({
        firstName: pipe(string(), nonEmpty(required), minLength(1)),
        lastName: pipe(string(), nonEmpty(required), minLength(1)),
        country: pipe(string(), nonEmpty(required), minLength(1)),
        language: pipe(array(string()), nonEmpty(required), minLength(1))
      }),
      social: object({
        twitter: pipe(string(), nonEmpty(required), minLength(1)),
        facebook: pipe(string(), nonEmpty(required), minLength(1)),
        google: pipe(string(), nonEmpty(required), minLength(1)),
        linkedIn: pipe(string(), nonEmpty(required), minLength(1))
      })
    }
  }, [t])

  // States
  const [activeStep, setActiveStep] = useState(0)
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)

  // Vars
  const languages = [
    { value: 'English', label: t.wizardLanguageEnglish },
    { value: 'French', label: t.wizardLanguageFrench },
    { value: 'Spanish', label: t.wizardLanguageSpanish },
    { value: 'Portuguese', label: t.wizardLanguagePortuguese },
    { value: 'Italian', label: t.wizardLanguageItalian },
    { value: 'German', label: t.wizardLanguageGerman },
    { value: 'Arabic', label: t.wizardLanguageArabic }
  ]

  // Hooks
  const {
    reset: accountReset,
    control: accountControl,
    handleSubmit: handleAccountSubmit,
    formState: { errors: accountErrors }
  } = useForm({
    resolver: valibotResolver(schemas.account),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  const {
    reset: personalReset,
    control: personalControl,
    handleSubmit: handlePersonalSubmit,
    formState: { errors: personalErrors }
  } = useForm({
    resolver: valibotResolver(schemas.personal),
    defaultValues: {
      firstName: '',
      lastName: '',
      country: '',
      language: []
    }
  })

  const {
    reset: socialReset,
    control: socialControl,
    handleSubmit: handleSocialSubmit,
    formState: { errors: socialErrors }
  } = useForm({
    resolver: valibotResolver(schemas.social),
    defaultValues: {
      twitter: '',
      facebook: '',
      google: '',
      linkedIn: ''
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  const onSubmit = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)

    if (activeStep === steps.length - 1) {
      toast.success(t.wizardFormSubmitted)
    }
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
    accountReset({ email: '', username: '', password: '', confirmPassword: '' })
    personalReset({ firstName: '', lastName: '', country: '', language: [] })
    socialReset({ twitter: '', facebook: '', google: '', linkedIn: '' })
    setIsPasswordShown(false)
    setIsConfirmPasswordShown(false)
  }

  const renderStepContent = (activeStep: number) => {
    switch (activeStep) {
      case 0:
        return (
          <form key={0} onSubmit={handleAccountSubmit(onSubmit)}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <Typography className='font-medium' color='text.primary'>
                  {steps[0].title}
                </Typography>
                <Typography variant='body2'>{steps[0].subtitle}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='username'
                  control={accountControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label={t.wizardUsername}
                      placeholder={t.wizardUsernamePlaceholder}
                      {...(accountErrors.username && { error: true, helperText: accountErrors.username.message })}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='email'
                  control={accountControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      type='email'
                      label={t.wizardEmail}
                      placeholder={t.wizardEmailPlaceholder}
                      {...(accountErrors.email && { error: true, helperText: accountErrors.email.message })}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='password'
                  control={accountControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label={t.wizardPassword}
                      placeholder={t.wizardPasswordPlaceholder}
                      id='stepper-linear-validation-password'
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
                      {...(accountErrors.password && { error: true, helperText: accountErrors.password.message })}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='confirmPassword'
                  control={accountControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label={t.wizardConfirmPassword}
                      placeholder={t.wizardPasswordPlaceholder}
                      id='stepper-linear-confirmPassword'
                      type={isConfirmPasswordShown ? 'text' : 'password'}
                      {...(accountErrors['confirmPassword'] && {
                        error: true,
                        helperText: accountErrors['confirmPassword'].message
                      })}
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
                                <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }} className='flex justify-between'>
                <Button
                  variant='tonal'
                  disabled
                  color='secondary'
                  startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
                >
                  {t.commonBack}
                </Button>
                <Button
                  variant='contained'
                  type='submit'
                  endIcon={<DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />}
                >
                  {t.commonNext}
                </Button>
              </Grid>
            </Grid>
          </form>
        )
      case 1:
        return (
          <form key={1} onSubmit={handlePersonalSubmit(onSubmit)}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <Typography className='font-medium' color='text.primary'>
                  {steps[1].title}
                </Typography>
                <Typography variant='body2'>{steps[1].subtitle}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='firstName'
                  control={personalControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label={t.wizardFirstName}
                      placeholder={t.wizardFirstNamePlaceholder}
                      {...(personalErrors.firstName && {
                        error: true,
                        helperText: personalErrors.firstName.message
                      })}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='lastName'
                  control={personalControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label={t.wizardLastName}
                      placeholder={t.wizardLastNamePlaceholder}
                      {...(personalErrors.lastName && {
                        error: true,
                        helperText: personalErrors.lastName.message
                      })}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='country'
                  control={personalControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      select
                      fullWidth
                      label={t.wizardCountry}
                      {...field}
                      error={Boolean(personalErrors.country)}
                    >
                      <MenuItem value='UK'>{t.wizardCountryUk}</MenuItem>
                      <MenuItem value='USA'>{t.wizardCountryUsa}</MenuItem>
                      <MenuItem value='Australia'>{t.wizardCountryAustralia}</MenuItem>
                      <MenuItem value='Germany'>{t.wizardCountryGermany}</MenuItem>
                    </CustomTextField>
                  )}
                />
                {personalErrors.country && <FormHelperText error>{t.wizardCountryRequired}</FormHelperText>}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='language'
                  control={personalControl}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <CustomTextField
                      select
                      fullWidth
                      slotProps={{
                        select: { multiple: true }
                      }}
                      label={t.wizardLanguage}
                      value={Array.isArray(value) ? value : []}
                      onChange={onChange}
                      error={Boolean(personalErrors.language)}
                    >
                      {languages.map(language => (
                        <MenuItem key={language.value} value={language.value}>
                          {language.label}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
                {personalErrors.language && <FormHelperText error>{t.wizardLanguageRequired}</FormHelperText>}
              </Grid>
              <Grid size={{ xs: 12 }} className='flex justify-between'>
                <Button
                  variant='tonal'
                  onClick={handleBack}
                  color='secondary'
                  startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
                >
                  {t.commonBack}
                </Button>
                <Button
                  variant='contained'
                  type='submit'
                  endIcon={<DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />}
                >
                  {t.commonNext}
                </Button>
              </Grid>
            </Grid>
          </form>
        )
      case 2:
        return (
          <form key={2} onSubmit={handleSocialSubmit(onSubmit)}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <Typography className='font-medium' color='text.primary'>
                  {steps[2].title}
                </Typography>
                <Typography variant='body2'>{steps[2].subtitle}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='twitter'
                  control={socialControl}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <CustomTextField
                      value={value}
                      onChange={onChange}
                      fullWidth
                      label={t.wizardTwitter}
                      placeholder={t.wizardTwitterPlaceholder}
                      {...(socialErrors.twitter && { error: true, helperText: socialErrors.twitter.message })}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='facebook'
                  control={socialControl}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <CustomTextField
                      value={value}
                      onChange={onChange}
                      fullWidth
                      label={t.wizardFacebook}
                      placeholder={t.wizardFacebookPlaceholder}
                      {...(socialErrors.facebook && { error: true, helperText: socialErrors.facebook.message })}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='google'
                  control={socialControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label={t.wizardGoogle}
                      placeholder={t.wizardGooglePlaceholder}
                      {...(socialErrors.google && { error: true, helperText: socialErrors.google.message })}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='linkedIn'
                  control={socialControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label={t.wizardLinkedIn}
                      placeholder={t.wizardLinkedInPlaceholder}
                      {...(socialErrors.linkedIn && { error: true, helperText: socialErrors.linkedIn.message })}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }} className='flex justify-between'>
                <Button
                  variant='tonal'
                  onClick={handleBack}
                  color='secondary'
                  startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
                >
                  {t.commonBack}
                </Button>
                <Button variant='contained' type='submit' endIcon={<i className='tabler-check' />}>
                  {t.commonSubmit}
                </Button>
              </Grid>
            </Grid>
          </form>
        )
      default:
        return <Typography>{t.wizardUnknownStep}</Typography>
    }
  }

  return (
    <Card>
      <CardContent>
        <StepperWrapper>
          <Stepper activeStep={activeStep}>
            {steps.map((label, index) => {
              const labelProps: {
                error?: boolean
              } = {}

              if (index === activeStep) {
                labelProps.error = false

                if (
                  (accountErrors.email ||
                    accountErrors.username ||
                    accountErrors.password ||
                    accountErrors['confirmPassword']) &&
                  activeStep === 0
                ) {
                  labelProps.error = true
                } else if (
                  (personalErrors.firstName ||
                    personalErrors.lastName ||
                    personalErrors.country ||
                    personalErrors.language) &&
                  activeStep === 1
                ) {
                  labelProps.error = true
                } else if (
                  (socialErrors.google || socialErrors.twitter || socialErrors.facebook || socialErrors.linkedIn) &&
                  activeStep === 2
                ) {
                  labelProps.error = true
                } else {
                  labelProps.error = false
                }
              }

              return (
                <Step key={index} className='max-md:mbe-5'>
                  <StepLabel
                    {...labelProps}
                    slots={{
                      stepIcon: StepperCustomDot
                    }}
                  >
                    <div className='step-label'>
                      <Typography className='step-number'>{`0${index + 1}`}</Typography>
                      <div>
                        <Typography className='step-title' color='text.primary'>
                          {label.title}
                        </Typography>
                        <Typography className='step-subtitle'>{label.subtitle}</Typography>
                      </div>
                    </div>
                  </StepLabel>
                </Step>
              )
            })}
          </Stepper>
        </StepperWrapper>
      </CardContent>
      <Divider />
      <CardContent>
        {activeStep === steps.length ? (
          <>
            <Typography className='mlb-2 mli-1'>{t.wizardAllStepsCompleted}</Typography>
            <div className='flex justify-end mt-4'>
              <Button variant='contained' onClick={handleReset}>
                {t.commonReset}
              </Button>
            </div>
          </>
        ) : (
          renderStepContent(activeStep)
        )}
      </CardContent>
    </Card>
  )
}

export default StepperLinearWithValidation
