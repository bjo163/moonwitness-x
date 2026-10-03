'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Custom Components
import CustomAvatar from '@moonwitness/ui/avatar'
import CustomChip from '@moonwitness/ui/chip'


// SDK Imports
import type { CelestialClockState } from '@moonwitness/types'

import OptionMenu from '@core/components/option-menu'
import type { CelestialDictionary } from '@/utils/getDictionary'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

export default function CelestialClockHero({ translations: t }: { translations: CelestialDictionary['clock'] }) {
  const theme = useTheme()

  const [clock, setClock] = useState<CelestialClockState>(() => {
    const now = new Date()
    const jd = now.getTime() / 86400000 + 2440587.5

    return {
      julian_day_ut: jd,
      utc_timestamp: now.toISOString(),
      elongation_degrees: 265.13,
      illuminated_fraction: 0.5423,
      phase_name: 'Waning Gibbous',
      hijri_date: "22 Rabi'ul Akhir 1448 H",
      antikythera_metonic_month: 213,
      antikythera_metonic_year: 18,
      antikythera_saros_step: 197,
      antikythera_exeligmos_shift_hours: 16
    }
  })

  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    // Set actual client time on mount
    setClock(prev => ({ ...prev, utc_timestamp: new Date().toISOString() }))

    const fetchState = async () => {
      try {
        const res = await fetch('/api/apps/celestial?endpoint=time/now')
        if (res.ok) {
          const data = await res.json()
          setClock(data)
          setIsLive(true)
          return
        }
      } catch {
        setIsLive(false)
      }
    }

    fetchState()
    const timer = setInterval(fetchState, 5000)

    
return () => clearInterval(timer)
  }, [])

  const illuminationPct = Math.round(clock.illuminated_fraction * 100)

  const phaseNames: Record<string, string> = {
    'New Moon': t.newMoon,
    'Waxing Crescent': t.waxingCrescent,
    'First Quarter': t.firstQuarter,
    'Waxing Gibbous': t.waxingGibbous,
    'Full Moon': t.fullMoon,
    'Waning Gibbous': t.waningGibbous,
    'Last Quarter': t.lastQuarter,
    'Waning Crescent': t.waningCrescent
  }

  const phaseName = phaseNames[clock.phase_name] ?? clock.phase_name

  const chartOptions: ApexOptions = {
    chart: {
      sparkline: { enabled: true }
    },
    stroke: { dashArray: 6 },
    labels: [phaseName],
    colors: ['var(--mui-palette-primary-main)'],
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } }
    },
    plotOptions: {
      radialBar: {
        startAngle: -130,
        endAngle: 130,
        hollow: { size: '65%' },
        track: { background: 'var(--mui-palette-customColors-trackBg, rgba(0,0,0,0.06))' },
        dataLabels: {
          name: {
            offsetY: -16,
            color: 'var(--mui-palette-text-secondary)',
            fontFamily: theme.typography.fontFamily,
            fontSize: '13px',
            fontWeight: 500
          },
          value: {
            offsetY: 8,
            color: 'var(--mui-palette-text-primary)',
            fontFamily: theme.typography.fontFamily,
            fontSize: '28px',
            fontWeight: 700,
            formatter: () => `${(clock.illuminated_fraction * 100).toFixed(1)}%`
          }
        }
      }
    }
  }

  return (
    <Card className='bs-full'>
      <CardHeader
        title={t.title}
        subheader={t.subtitle}
        action={
          <div className='flex items-center gap-2'>
            <CustomChip
              label={isLive ? t.live : t.synchronized}
              color={isLive ? 'success' : 'primary'}
              skin='light'
              size='small'
              round='true'
            />
            <OptionMenu options={[t.resync, t.ephemeris, t.algorithmDocs]} />
          </div>
        }
      />
      <CardContent>
        <Grid container spacing={6} alignItems='center'>
          {/* Lunar Illumination Radial Gauge */}
          <Grid size={{ xs: 12, md: 4 }} className='flex flex-col items-center justify-center text-center'>
            <div className='is-[240px] bs-[200px] flex items-center justify-center'>
              <AppReactApexCharts
                type='radialBar'
                height={220}
                width={240}
                series={[illuminationPct]}
                options={chartOptions}
              />
            </div>
            <div className='flex items-center gap-1.5 mt-2'>
              <CustomAvatar skin='light' color='primary' size={28}>
                <i className='tabler-moon text-[16px]' />
              </CustomAvatar>
              <Typography variant='subtitle1' className='font-semibold'>
                {phaseName}
              </Typography>
            </div>
            <Typography variant='caption' color='text.secondary' className='mt-1'>
              {t.moonFraction}: <strong>{(clock.illuminated_fraction * 100).toFixed(2)}%</strong>
            </Typography>
          </Grid>

          {/* Core TCC Telemetry & Date Details */}
          <Grid size={{ xs: 12, md: 8 }}>
            <div className='flex flex-wrap items-center justify-between gap-2 mb-1'>
              <Typography variant='overline' color='primary.main' className='tracking-wider font-bold'>
                {t.standard}
              </Typography>
              <Typography variant='caption' color='text.disabled' className='font-mono'>
                {t.julianDay}: {clock.julian_day_ut.toFixed(5)}
              </Typography>
            </div>

            <Typography variant='h3' className='font-bold mb-1' color='text.primary'>
              {clock.hijri_date}
            </Typography>

            <Typography variant='body2' color='text.secondary' className='font-mono mb-4' suppressHydrationWarning>
              {t.utcLabel} {clock.utc_timestamp}
            </Typography>

            {/* Continuous Elongation Progress Bar */}
            <div className='p-4 rounded-xl border border-[var(--mui-palette-divider)] mb-4 bg-[var(--mui-palette-action-hover)]'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <i className='tabler-compass text-primary text-[18px]' />
                  <Typography variant='body2' className='font-medium' color='text.primary'>
                    {t.elongation}:
                  </Typography>
                </div>
                <Typography variant='body2' className='font-bold font-mono' color='primary.main'>
                  {clock.elongation_degrees.toFixed(2)}°
                </Typography>
              </div>
              <LinearProgress
                variant='determinate'
                value={(clock.elongation_degrees / 360) * 100}
                className='bs-2 rounded'
                color='primary'
              />
              <div className='flex justify-between mt-1 text-[11px] text-[var(--mui-palette-text-disabled)]'>
                <span>0° ({t.newMoon})</span>
                <span>90° ({t.firstQuarter})</span>
                <span>180° ({t.fullMoon})</span>
                <span>270° ({t.lastQuarter})</span>
                <span>360°</span>
              </div>
            </div>

            {/* 4 Vuexy Metric Tiles */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <div className='p-3 border rounded-xl flex items-center gap-3 border-[var(--mui-palette-divider)]'>
                  <CustomAvatar skin='light' color='primary' size={40} variant='rounded'>
                    <i className='tabler-moon-stars text-[22px]' />
                  </CustomAvatar>
                  <div>
                    <Typography variant='caption' color='text.disabled' className='block'>
                      {t.metonicMonth}
                    </Typography>
                    <Typography variant='subtitle1' className='font-bold'>
                      {clock.antikythera_metonic_month}{' '}
                      <span className='text-[12px] text-[var(--mui-palette-text-disabled)]'>/ 235</span>
                    </Typography>
                  </div>
                </div>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <div className='p-3 border rounded-xl flex items-center gap-3 border-[var(--mui-palette-divider)]'>
                  <CustomAvatar skin='light' color='info' size={40} variant='rounded'>
                    <i className='tabler-calendar text-[22px]' />
                  </CustomAvatar>
                  <div>
                    <Typography variant='caption' color='text.disabled' className='block'>
                      {t.metonicYear}
                    </Typography>
                    <Typography variant='subtitle1' className='font-bold'>
                      {t.year} {clock.antikythera_metonic_year}{' '}
                      <span className='text-[12px] text-[var(--mui-palette-text-disabled)]'>/ 19</span>
                    </Typography>
                  </div>
                </div>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <div className='p-3 border rounded-xl flex items-center gap-3 border-[var(--mui-palette-divider)]'>
                  <CustomAvatar skin='light' color='warning' size={40} variant='rounded'>
                    <i className='tabler-rotate-clockwise text-[22px]' />
                  </CustomAvatar>
                  <div>
                    <Typography variant='caption' color='text.disabled' className='block'>
                      {t.sarosCycle}
                    </Typography>
                    <Typography variant='subtitle1' className='font-bold'>
                      {t.step} {clock.antikythera_saros_step}{' '}
                      <span className='text-[12px] text-[var(--mui-palette-text-disabled)]'>/ 223</span>
                    </Typography>
                  </div>
                </div>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <div className='p-3 border rounded-xl flex items-center gap-3 border-[var(--mui-palette-divider)]'>
                  <CustomAvatar skin='light' color='success' size={40} variant='rounded'>
                    <i className='tabler-clock-hour-4 text-[22px]' />
                  </CustomAvatar>
                  <div>
                    <Typography variant='caption' color='text.disabled' className='block'>
                      {t.exeligmosShift}
                    </Typography>
                    <Typography variant='subtitle1' className='font-bold'>
                      +{clock.antikythera_exeligmos_shift_hours} {t.hours}
                    </Typography>
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
