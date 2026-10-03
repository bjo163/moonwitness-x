// MUI Imports
import { useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import LinearProgress from '@mui/material/LinearProgress'
import type { ButtonProps } from '@mui/material/Button'

// Type Imports
import type { PricingPlanType } from '@/types/pages/pricingTypes'
import type { ThemeColor } from '@core/types'
import type { Locale } from '@configs/i18n'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import UpgradePlan from '@components/dialogs/upgrade-plan'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

const CurrentPlan = ({ data }: { data?: PricingPlanType[] }) => {
  const t = useCommonTranslations()
  const { lang } = useParams()
  const locale = (lang as Locale) || 'en'

  const buttonProps = (children: string, color: ThemeColor, variant: ButtonProps['variant']): ButtonProps => ({
    children,
    variant,
    color
  })

  return (
    <Card>
      <CardHeader title={t.currentPlan} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 6 }} className='flex flex-col gap-6'>
            <div className='flex flex-col gap-1'>
              <Typography color='text.primary' className='font-medium'>
                {t.currentPlanBasic}
              </Typography>
              <Typography>{t.simpleStartEveryone}</Typography>
            </div>
            <div className='flex flex-col gap-1'>
              <Typography color='text.primary' className='font-medium'>
                {t.activeUntil.replace(
                  '{date}',
                  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date('2021-12-09'))
                )}
              </Typography>
              <Typography>{t.subscriptionExpiryNotice}</Typography>
            </div>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-1.5'>
                <Typography color='text.primary' className='font-medium'>
                  {t.monthlyPrice.replace('{amount}', '199')}
                </Typography>
                <Chip color='primary' variant='tonal' label={t.popular} size='small' />
              </div>
              <Typography>{t.standardPlanBusiness}</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} className='flex flex-col gap-6'>
            <Alert severity='warning'>
              <AlertTitle>{t.attentionNeeded}</AlertTitle>
              {t.planRequiresUpdate}
            </Alert>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center justify-between'>
                <Typography color='text.primary' className='font-medium'>
                  {t.days}
                </Typography>
                <Typography color='text.primary' className='font-medium'>
                  {t.daysOfTotal.replace('{used}', '12').replace('{total}', '30')}
                </Typography>
              </div>
              <LinearProgress variant='determinate' value={20} />
              <Typography variant='body2'>{t.daysRemainingUntilUpdate.replace('{days}', '18')}</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12 }} className='flex gap-4 flex-wrap'>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps(t.upgradePlan, 'primary', 'contained')}
              dialog={UpgradePlan}
              dialogProps={{ data: data }}
            />
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps(t.cancelSubscription, 'error', 'tonal')}
              dialog={ConfirmationDialog}
              dialogProps={{ type: 'unsubscribe' }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CurrentPlan
