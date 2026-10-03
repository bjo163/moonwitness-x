// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import type { ButtonProps } from '@mui/material/Button'

// Type Imports
import Link from '@components/Link'

// Component Imports
import TwoFactorAuth from '@components/dialogs/two-factor-auth'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const TwoFactorAuthenticationCard = () => {
  const t = useCommonTranslations()

  // Vars
  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: t.enableTwoFactor
  }

  return (
    <>
      <Card>
        <CardHeader title={t.twoStepVerification} />
        <CardContent className='flex flex-col items-start gap-6'>
          <div className='flex flex-col gap-4'>
            <Typography variant='h5' color='text.secondary'>
              {t.twoFactorDisabled}
            </Typography>
            <Typography>
              {t.twoFactorDescription} <Link className='text-primary'>{t.learnMore}</Link>
            </Typography>
          </div>
          <OpenDialogOnElementClick element={Button} elementProps={buttonProps} dialog={TwoFactorAuth} />
        </CardContent>
      </Card>
    </>
  )
}

export default TwoFactorAuthenticationCard
