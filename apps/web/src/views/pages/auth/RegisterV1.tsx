'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'

// Type Imports
import CustomTextField from '@moonwitness/ui/text-field'

import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { useAuthTranslations } from '@/contexts/AuthTranslationContext'

// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'

const RegisterV1 = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)

  // Hooks
  const { lang: locale } = useParams()
  const t = useAuthTranslations()

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  return (
    <AuthIllustrationWrapper>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href={getLocalizedUrl('/', locale as Locale)} className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>{t.registerTitle}</Typography>
            <Typography>{t.registerDescription}</Typography>
          </div>
          <form noValidate autoComplete='off' onSubmit={e => e.preventDefault()} className='flex flex-col gap-6'>
            <CustomTextField autoFocus fullWidth label={t.username} placeholder={t.usernamePlaceholder} />
            <CustomTextField fullWidth label={t.email} placeholder={t.emailPlaceholder} />
            <CustomTextField
              fullWidth
              label={t.password}
              placeholder='············'
              type={isPasswordShown ? 'text' : 'password'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                        <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <FormControlLabel
              control={<Checkbox />}
              label={
                <>
                  <span>{t.agreeTo}</span>
                  <Link className='text-primary' href='/' onClick={e => e.preventDefault()}>
                    {t.privacyTerms}
                  </Link>
                </>
              }
            />
            <Button fullWidth variant='contained' type='submit'>
              {t.signUp}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>{t.alreadyHaveAccount}</Typography>
              <Typography
                component={Link}
                href={getLocalizedUrl('/pages/auth/login-v1', locale as Locale)}
                color='primary.main'
              >
                {t.signInInstead}
              </Typography>
            </div>
            <Divider className='gap-2 text-textPrimary'>{t.or}</Divider>
            <div className='flex justify-center items-center gap-1.5'>
              <IconButton className='text-facebook' size='small'>
                <i className='tabler-brand-facebook-filled' />
              </IconButton>
              <IconButton className='text-twitter' size='small'>
                <i className='tabler-brand-twitter-filled' />
              </IconButton>
              <IconButton className='text-textPrimary' size='small'>
                <i className='tabler-brand-github-filled' />
              </IconButton>
              <IconButton className='text-error' size='small'>
                <i className='tabler-brand-google-filled' />
              </IconButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  )
}

export default RegisterV1
