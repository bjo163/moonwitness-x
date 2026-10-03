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

import type { AntikytheraGearsTelemetry, EclipsesApiResponse } from '@moonwitness/types'

import OptionMenu from '@core/components/option-menu'
import type { CelestialDictionary } from '@/utils/getDictionary'

import AntikytheraMechanicalView from './AntikytheraMechanicalView'

export default function AntikytheraTelemetryCard({
  translations: t
}: {
  translations: CelestialDictionary['mechanism']
}) {
  const [gears, setGears] = useState<AntikytheraGearsTelemetry | null>(null)
  const [eclipses, setEclipses] = useState<EclipsesApiResponse | null>(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gearsRes, eclipsesRes] = await Promise.allSettled([
          fetch('/api/apps/celestial?endpoint=time/gears').then(r => (r.ok ? r.json() : null)),
          fetch('/api/apps/celestial?endpoint=time/eclipses').then(r => (r.ok ? r.json() : null))
        ])

        if (gearsRes.status === 'fulfilled' && gearsRes.value) {
          setGears(gearsRes.value)
          setIsLive(true)
        }

        if (eclipsesRes.status === 'fulfilled' && eclipsesRes.value) {
          setEclipses(eclipsesRes.value)
        }
      } catch {
        setIsLive(false)
      }
    }

    fetchData()
    const timer = setInterval(fetchData, 10000)

    return () => clearInterval(timer)
  }, [])

  const dials = [
    {
      ...t.dials.metonic,
      value: gears
        ? `${gears.metonic.month_index}/235 (${gears.metonic.current_year} Thn) • ${gears.metonic.dial_angle_degrees.toFixed(1)}°`
        : t.dials.metonic.value,
      progress: gears ? gears.metonic.progress_pct : (213 / 235) * 100,
      avatarColor: 'primary' as const,
      avatarIcon: 'tabler-circle-dotted'
    },
    {
      ...t.dials.callippic,
      value: gears
        ? `Siklus ${gears.callippic.metonic_cycle_index}/4 (${gears.callippic.month_in_callippic}/940) • ${gears.callippic.dial_angle_degrees.toFixed(1)}°`
        : t.dials.callippic.value,
      progress: gears ? gears.callippic.progress_pct : (39 / 76) * 100,
      avatarColor: 'info' as const,
      avatarIcon: 'tabler-calendar-time'
    },
    {
      ...t.dials.saros,
      value: gears
        ? `Step ${gears.saros.month_index}/223 (#${gears.saros.saros_cycle_number}) • ${gears.saros.dial_angle_degrees.toFixed(1)}°`
        : t.dials.saros.value,
      progress: gears ? gears.saros.progress_pct : (197 / 223) * 100,
      avatarColor: 'warning' as const,
      avatarIcon: 'tabler-sun-moon'
    },
    {
      ...t.dials.exeligmos,
      value: gears
        ? `Sektor ${gears.exeligmos.sector} (+${gears.exeligmos.hour_shift} Jam) • ${gears.exeligmos.dial_angle_degrees.toFixed(1)}°`
        : t.dials.exeligmos.value,
      progress: gears ? gears.exeligmos.progress_pct : 66,
      avatarColor: 'success' as const,
      avatarIcon: 'tabler-rotate-360'
    }
  ]

  return (
    <Card className='bs-full'>
      <CardHeader
        title={t.title}
        subheader={t.interactiveSubheader}
        action={
          <div className='flex items-center gap-2'>
            <CustomChip
              label={isLive ? t.liveGearEngine : t.ratio}
              color={isLive ? 'success' : 'warning'}
              skin='light'
              size='small'
              round='true'
            />
            <OptionMenu options={[t.reset, t.diagram]} />
          </div>
        }
      />
      <CardContent className='flex flex-col gap-6'>
        {/* Living Mechanical Clock & Gear Train Simulation */}
        <AntikytheraMechanicalView gears={gears} isLive={isLive} translations={t} />

        <Divider />

        {/* 4 Quantitative Telemetry Tiles */}
        <Grid container spacing={3}>
          {dials.map((dial, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <div className='p-3.5 border rounded-xl border-[var(--mui-palette-divider)]'>
                <div className='flex items-center justify-between mb-1'>
                  <div className='flex items-center gap-2'>
                    <CustomAvatar skin='light' color={dial.avatarColor} size={32} variant='rounded'>
                      <i className={`${dial.avatarIcon} text-[18px]`} />
                    </CustomAvatar>
                    <Typography variant='subtitle2' className='font-semibold'>
                      {dial.name}
                    </Typography>
                  </div>
                  <Typography variant='caption' className='font-mono font-bold' color={`${dial.avatarColor}.main`}>
                    {dial.value}
                  </Typography>
                </div>
                <Typography variant='caption' color='text.secondary' className='block mb-2 text-[12px]'>
                  {dial.description}
                </Typography>
                <LinearProgress
                  variant='determinate'
                  value={dial.progress}
                  color={dial.avatarColor}
                  className='bs-1.5 rounded'
                />
              </div>
            </Grid>
          ))}
        </Grid>

        <div className='p-3.5 border rounded-xl border-dashed border-[var(--mui-palette-divider)] bg-[var(--mui-palette-action-hover)] flex items-start gap-3'>
          <CustomAvatar skin='light' color='primary' size={36} variant='rounded'>
            <i className='tabler-settings-cog text-[20px]' />
          </CustomAvatar>
          <div>
            <Typography variant='subtitle2' className='font-semibold mb-0.5' color='text.primary'>
              {t.hipparchusPinSlotTitle}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {t.hipparchusPinSlotDescription}
            </Typography>
          </div>
        </div>

        {/* Saros Eclipse Prediction Telemetry Banner */}
        {eclipses && (
          <div className='p-4 border rounded-xl border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/40 to-slate-900/60'>
            <div className='flex items-center justify-between mb-3 flex-wrap gap-2'>
              <div className='flex items-center gap-2'>
                <CustomAvatar skin='light' color='warning' size={32} variant='rounded'>
                  <i className='tabler-sun-moon text-[18px]' />
                </CustomAvatar>
                <div>
                  <Typography variant='subtitle2' className='font-bold text-amber-400'>
                    {t.sarosEclipsePredictionTitle}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {t.currentSarosStep
                      .replace('{step}', String(eclipses.antikythera_saros_step))
                      .replace('{sector}', String(eclipses.antikythera_exeligmos_sector))}
                  </Typography>
                </div>
              </div>
              <CustomChip label={t.meeusSarosModel} color='warning' skin='light' size='small' className='font-mono' />
            </div>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-start gap-3'>
                  <span className='text-2xl'>☀️</span>
                  <div>
                    <Typography variant='caption' className='text-slate-400 font-semibold uppercase text-[10px] block'>
                      {t.nextSolarEclipse}
                    </Typography>
                    <Typography variant='subtitle2' className='font-bold text-amber-300'>
                      {eclipses.next_solar_eclipse.description}
                    </Typography>
                    <Typography variant='caption' className='font-mono text-slate-300 text-[11px] block mt-0.5'>
                      {new Date(eclipses.next_solar_eclipse.utc_datetime_str).toUTCString().replace('GMT', 'UTC')}
                    </Typography>
                    <Typography variant='caption' className='text-slate-400 text-[10px] block'>
                      {t.eclipseMagnitude} {eclipses.next_solar_eclipse.magnitude} | {t.eclipseGamma}{' '}
                      {eclipses.next_solar_eclipse.gamma} | {t.sarosStepLabel}{' '}
                      {eclipses.next_solar_eclipse.saros_step_in_cycle}/223
                    </Typography>
                  </div>
                </div>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-start gap-3'>
                  <span className='text-2xl'>🌕</span>
                  <div>
                    <Typography variant='caption' className='text-slate-400 font-semibold uppercase text-[10px] block'>
                      {t.nextLunarEclipse}
                    </Typography>
                    <Typography variant='subtitle2' className='font-bold text-blue-300'>
                      {eclipses.next_lunar_eclipse.description}
                    </Typography>
                    <Typography variant='caption' className='font-mono text-slate-300 text-[11px] block mt-0.5'>
                      {new Date(eclipses.next_lunar_eclipse.utc_datetime_str).toUTCString().replace('GMT', 'UTC')}
                    </Typography>
                    <Typography variant='caption' className='text-slate-400 text-[10px] block'>
                      {t.eclipseMagnitude} {eclipses.next_lunar_eclipse.magnitude} | {t.eclipseGamma}{' '}
                      {eclipses.next_lunar_eclipse.gamma} | {t.sarosStepLabel}{' '}
                      {eclipses.next_lunar_eclipse.saros_step_in_cycle}/223
                    </Typography>
                  </div>
                </div>
              </Grid>
            </Grid>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
