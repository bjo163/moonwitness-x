'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Divider from '@mui/material/Divider'

// Custom Components
import CustomAvatar from '@moonwitness/ui/avatar'
import CustomChip from '@moonwitness/ui/chip'


// SDK Imports
import { MoonwitnessClient } from '@moonwitness/sdk'
import type { CosmicTimeState } from '@moonwitness/types'

import OptionMenu from '@core/components/option-menu'
import type { Locale } from '@configs/i18n'
import type { CelestialDictionary } from '@/utils/getDictionary'

export default function CosmicTimeEngineCard({
  translations: t,
  locale
}: {
  translations: CelestialDictionary['cosmic']
  locale: Locale
}) {
  const [cosmic, setCosmic] = useState<CosmicTimeState>({
    julian_day_earth: 2461316.5,
    age_of_universe_years: 13787000000,
    total_cosmic_seconds: 4.350846e17,
    age_of_earth_years: 4543000000,
    earth_to_universe_ratio: 0.3295,
    earth_kinematic_lag_years: 3456.6,
    current_period: 'Masa 6: Pembentukan Tata Surya & Biosfer Kehidupan',
    scale_factor_a: 0.999933,
    redshift_z: 0.000067,
    hubble_parameter_km_s_mpc: 67.37,
    cmb_temperature_kelvin: 2.7257,
    epoch_period_duration_years: 2297833333,
    divine_days_elapsed: 13787000,
    divine_night_watches_elapsed: 94539428,
    angelic_days_elapsed: 275740,
    angelic_lorentz_gamma: 18262110.0,
    angelic_velocity_km_s: 299792.458,
    derived_speed_of_light_m_s: 299791240,
    scriptural_matrix: {} as any
  })

  const periodNumber = cosmic.current_period.match(/^Masa ([1-6]):/)?.[1] as keyof typeof t.periods | undefined
  const currentPeriod = periodNumber ? t.periods[periodNumber] : cosmic.current_period

  const cosmicSecondsMeasure = t.cosmicSecondsMeasure
    .replace('{seconds}', cosmic.total_cosmic_seconds.toExponential(3))
    .replace('{scaleFactor}', cosmic.scale_factor_a.toFixed(3))

  const formattedEarthLag = new Intl.NumberFormat(locale).format(Math.round(cosmic.earth_kinematic_lag_years))

  const formattedSpeed = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
    cosmic.angelic_velocity_km_s
  )

  useEffect(() => {
    const fetchCosmic = async () => {
      try {
        const res = await fetch('/api/apps/celestial?endpoint=cosmic')
        if (res.ok) {
          const data = await res.json()
          setCosmic(data)
          return
        }
        const client = new MoonwitnessClient('http://localhost:5155')
        const data = await client.getCosmic()
        if (data) setCosmic(data)
      } catch {}
    }
    fetchCosmic()
  }, [])

  return (
    <Card className='bs-full'>
      <CardHeader
        title={t.title}
        subheader={t.subtitle}
        action={
          <div className='flex items-center gap-2'>
            <CustomChip label={t.planck2018} color='info' skin='light' size='small' round='true' />
            <OptionMenu options={[t.calculations, t.export]} />
          </div>
        }
      />
      <CardContent>
        {/* Usia Alam Semesta & Usia Bumi Highlights */}
        <Grid container spacing={4} className='mb-4'>
          <Grid size={{ xs: 12, sm: 6 }}>
            <div className='p-4 border rounded-xl border-[var(--mui-palette-divider)] bg-[var(--mui-palette-action-hover)]'>
              <div className='flex items-center gap-3 mb-2'>
                <CustomAvatar skin='light' color='info' size={38} variant='rounded'>
                  <i className='tabler-sparkles text-[20px]' />
                </CustomAvatar>
                <div>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    className='uppercase tracking-wide font-semibold'
                  >
                    {t.age} {t.epochSymbol}
                  </Typography>
                  <Typography variant='h5' className='font-bold' color='text.primary'>
                    {(cosmic.age_of_universe_years / 1e9).toFixed(3)}{' '}
                    <span className='text-[14px] font-normal text-[var(--mui-palette-text-secondary)]'>{t.gyr}</span>
                  </Typography>
                </div>
              </div>
              <Typography variant='caption' color='text.disabled' className='font-mono block'>
                {t.cosmicSeconds}: {cosmicSecondsMeasure}
              </Typography>
            </div>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <div className='p-4 border rounded-xl border-[var(--mui-palette-divider)] bg-[var(--mui-palette-action-hover)]'>
              <div className='flex items-center gap-3 mb-2'>
                <CustomAvatar skin='light' color='primary' size={38} variant='rounded'>
                  <i className='tabler-world text-[20px]' />
                </CustomAvatar>
                <div>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    className='uppercase tracking-wide font-semibold'
                  >
                    {t.earthRatio}
                  </Typography>
                  <Typography variant='h5' className='font-bold' color='text.primary'>
                    {(cosmic.earth_to_universe_ratio * 100).toFixed(2)}%{' '}
                    <span className='text-[14px] font-normal text-[var(--mui-palette-text-secondary)]'>
                      {t.earthFraction}
                    </span>
                  </Typography>
                </div>
              </div>
              <Typography variant='caption' color='text.disabled' className='font-mono block'>
                {t.earthAgeNote}
              </Typography>
            </div>
          </Grid>
        </Grid>

        {/* 6 Eon Cosmic Progress */}
        <div className='mb-4'>
          <div className='flex items-center justify-between mb-1.5'>
            <Typography variant='body2' className='font-semibold' color='text.primary'>
              {t.eonStatus}: <span className='text-[var(--mui-palette-primary-main)]'>{currentPeriod}</span>
            </Typography>
            <Typography variant='caption' color='text.secondary' className='font-mono'>
              {t.periodCount}
            </Typography>
          </div>
          <LinearProgress
            variant='determinate'
            value={Math.min(100, Math.round(cosmic.scale_factor_a * 100))}
            color='primary'
            className='bs-2 rounded'
          />
          <Typography variant='caption' color='text.disabled' className='mt-1 block'>
            {t.eonDuration}: {t.periodDurationApprox}
          </Typography>
        </div>

        <Divider className='my-4' />

        {/* 3 Vuexy Stat Columns */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <div className='p-3 border rounded-xl flex items-center gap-3 border-[var(--mui-palette-divider)]'>
              <CustomAvatar skin='light' color='warning' size={36} variant='rounded'>
                <i className='tabler-bolt text-[18px]' />
              </CustomAvatar>
              <div>
                <Typography variant='caption' color='text.secondary' className='block'>
                  {t.lightSpeed} {t.lightSpeedSymbol}
                </Typography>
                <Typography variant='subtitle2' className='font-bold font-mono'>
                  {formattedSpeed} {t.kilometersPerSecond}
                </Typography>
                <Typography variant='caption' color='text.disabled' className='text-[10px] block'>
                  {t.speedOfLightNote}
                </Typography>
              </div>
            </div>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <div className='p-3 border rounded-xl flex items-center gap-3 border-[var(--mui-palette-divider)]'>
              <CustomAvatar skin='light' color='success' size={36} variant='rounded'>
                <i className='tabler-hourglass-high text-[18px]' />
              </CustomAvatar>
              <div>
                <Typography variant='caption' color='text.secondary' className='block'>
                  {t.lorentz} {t.lorentzSymbol}
                </Typography>
                <Typography variant='subtitle2' className='font-bold font-mono'>
                  {cosmic.angelic_lorentz_gamma > 1e6
                    ? `${(cosmic.angelic_lorentz_gamma / 1e7).toFixed(3)} × 10⁷`
                    : cosmic.angelic_lorentz_gamma.toLocaleString(locale)}
                </Typography>
                <Typography variant='caption' color='text.disabled' className='text-[10px] block'>
                  {t.lorentzNote}
                </Typography>
              </div>
            </div>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <div className='p-3 border rounded-xl flex items-center gap-3 border-[var(--mui-palette-divider)]'>
              <CustomAvatar skin='light' color='info' size={36} variant='rounded'>
                <i className='tabler-antenna text-[18px]' />
              </CustomAvatar>
              <div>
                <Typography variant='caption' color='text.secondary' className='block'>
                  {t.cmbLag}
                </Typography>
                <Typography variant='subtitle2' className='font-bold font-mono'>
                  {formattedEarthLag} {t.earthYears}
                </Typography>
                <Typography variant='caption' color='text.disabled' className='text-[10px] block'>
                  {t.cmbVelocityNote}
                </Typography>
              </div>
            </div>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
