'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'

// Custom Components
import CustomChip from '@moonwitness/ui/chip'

import type { RateProfile } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  profiles: RateProfile[]
}

export default function RateProfilesTab({ profiles }: Props) {
  const t = useCommonTranslations()

  return (
    <Card>
      <CardHeader
        title={
          <div className='flex items-center gap-2'>
            <i className='tabler-gauge text-warning text-2xl' />
            <div>
              <Typography variant='h6'>{t.radiusBandwidthRateProfiles}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {t.radiusRateProfileDescription}
              </Typography>
            </div>
          </div>
        }
      />
      <CardContent>
        <Grid container spacing={6}>
          {profiles.map(p => (
            <Grid key={p.id} size={{ xs: 12, md: 4 }}>
              <Card variant='outlined' className='p-4 h-full flex flex-col justify-between'>
                <div>
                  <div className='flex justify-between items-start mb-2'>
                    <Typography variant='h6' className='font-bold'>
                      {p.name}
                    </Typography>
                    <CustomChip
                      label={p.rateLimit}
                      size='small'
                      color='primary'
                      variant='tonal'
                      className='font-mono'
                    />
                  </div>

                  <Typography variant='body2' color='text.secondary' className='mb-4'>
                    {p.description}
                  </Typography>

                  <Box className='bg-slate-500/10 p-3 rounded mb-3 text-xs flex flex-col gap-1'>
                    <div className='flex justify-between'>
                      <span className='text-slate-400'>{t.radiusVsa}:</span>
                      <span className='font-mono font-semibold'>
                        {t.radiusRateLimitAttributeLabel} {p.rateLimit}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-slate-400'>{t.radiusQuotaFup}:</span>
                      <span>{p.quotaMb > 0 ? `${p.quotaMb / 1000} ${t.radiusGigabytes}` : t.radiusUnlimited}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-slate-400'>{t.radiusValidity}:</span>
                      <span>
                        {p.durationDays} {t.radiusDays}
                      </span>
                    </div>
                  </Box>
                </div>

                <div className='pt-2 border-t flex justify-between items-center'>
                  <span className='text-xs text-slate-400'>{t.radiusBillingPrice}</span>
                  <Typography variant='subtitle1' className='font-bold text-success'>
                    {t.radiusCurrencyRp} {p.price.toLocaleString('id-ID')}
                  </Typography>
                </div>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}
