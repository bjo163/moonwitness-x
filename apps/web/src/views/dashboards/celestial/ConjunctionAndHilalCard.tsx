'use client'

// React Imports
import { useState, useEffect, useId } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

// Custom Components
import CustomTextField from '@moonwitness/ui/text-field'
import CustomAvatar from '@moonwitness/ui/avatar'
import CustomChip from '@moonwitness/ui/chip'

import OptionMenu from '@core/components/option-menu'
import type { CelestialDictionary } from '@/utils/getDictionary'

const PRESET_OBSERVATORIES = [
  { name: 'Bosscha Observatory, Lembang', lat: '-6.8252', lon: '107.6169', elev: '1310' },
  { name: 'Timau National Observatory, NTT', lat: '-9.5833', lon: '123.9500', elev: '1300' },
  { name: 'Cibeas Observation Station, Sukabumi', lat: '-7.0125', lon: '106.5417', elev: '45' },
  { name: 'Monas, DKI Jakarta', lat: '-6.1754', lon: '106.8272', elev: '8' },
  { name: 'Makkah Clock Tower, Saudi Arabia', lat: '21.4225', lon: '39.8262', elev: '601' }
]

export default function ConjunctionAndHilalCard({ translations: t }: { translations: CelestialDictionary['hilal'] }) {
  const [lat, setLat] = useState('-6.8252')
  const [lon, setLon] = useState('107.6169')
  const [elev, setElev] = useState('1310')
  const [loading, setLoading] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [viewMode, setViewMode] = useState<'radar' | 'metrics'>('radar')
  const twilightGradId = useId()

  const [result, setResult] = useState<{
    altitude: number
    elongation: number
    mabimsPassed: boolean
    wujudulHilalPassed: boolean
    odehZone: keyof typeof t.odehZones
    conjunctionUtc: string
    daysRemaining: string
    sunsetUtc: string
    sunsetAzimuth: number
    moonAltitude: number
    moonAzimuth: number
    relativeAzimuth: number
    crescentWidthArcmin: number
    crescentTiltDeg: number
    moonsetUtc: string
    lagTimeMinutes: number
    danjonPassed: boolean
  }>({
    altitude: 4.82,
    elongation: 7.85,
    mabimsPassed: true,
    wujudulHilalPassed: true,
    odehZone: 'optical',
    conjunctionUtc: '2026-10-10 15:50:29 UTC',
    daysRemaining: '7.5',
    sunsetUtc: '2026-10-03 10:42:59 UTC',
    sunsetAzimuth: 265.84,
    moonAltitude: 4.82,
    moonAzimuth: 268.12,
    relativeAzimuth: 2.28,
    crescentWidthArcmin: 0.42,
    crescentTiltDeg: 93.8,
    moonsetUtc: '2026-10-03 11:21:30 UTC',
    lagTimeMinutes: 38.5,
    danjonPassed: true
  })

  const fetchCalculation = async (latitude = lat, longitude = lon, elevation = elev) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/apps/celestial?endpoint=time/hilal&lat=${latitude}&lon=${longitude}&elevation=${elevation}`
      )
      if (res.ok) {
        const data = await res.json()
        const zoneKey: keyof typeof t.odehZones =
          data.odeh_zone === 'naked_eye' || data.odeh_zone === 'optical' ? 'optical' : 'telescope'

        const dateObj = new Date(data.conjunction_utc)
        const utcStr = !isNaN(dateObj.getTime())
          ? dateObj.toUTCString().replace('GMT', 'UTC')
          : data.conjunction_utc

        setResult({
          altitude: data.altitude,
          elongation: data.elongation,
          mabimsPassed: data.mabims_passed,
          wujudulHilalPassed: data.wujudul_hilal_passed,
          odehZone: zoneKey,
          conjunctionUtc: utcStr,
          daysRemaining: data.days_remaining.toFixed(1),
          sunsetUtc: data.sunset_utc || '',
          sunsetAzimuth: data.sunset_azimuth || 265.8,
          moonAltitude: data.moon_altitude_at_sunset ?? data.altitude,
          moonAzimuth: data.moon_azimuth_at_sunset || 268.1,
          relativeAzimuth: data.relative_azimuth || 0.0,
          crescentWidthArcmin: data.crescent_width_arcmin || 0.42,
          crescentTiltDeg: data.crescent_tilt_deg || 90.0,
          moonsetUtc: data.moonset_utc || '',
          lagTimeMinutes: data.lag_time_minutes || 0.0,
          danjonPassed: data.danjon_passed ?? true
        })
        setIsLive(true)
      }
    } catch {
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalculation()
  }, [])

  const handleRecalculate = () => {
    fetchCalculation(lat, lon, elev)
  }

  const handleSelectPreset = (obs: typeof PRESET_OBSERVATORIES[0]) => {
    setLat(obs.lat)
    setLon(obs.lon)
    setElev(obs.elev)
    fetchCalculation(obs.lat, obs.lon, obs.elev)
  }

  // Western Horizon Radar coordinate mapping:
  // Azimuth range: 250° (left) to 290° (right), center at 270° (Barat)
  // Width: 520, Height: 200
  // Altitude range: -2° (bottom) to +14° (top)
  const mapAzimuthToX = (az: number) => {
    const minAz = 250.0
    const maxAz = 290.0
    const clamped = Math.max(minAz, Math.min(maxAz, az))
    return ((clamped - minAz) / (maxAz - minAz)) * 520
  }

  const mapAltToY = (alt: number) => {
    const minAlt = -2.0
    const maxAlt = 14.0
    const clamped = Math.max(minAlt, Math.min(maxAlt, alt))
    // Invert Y: top is maxAlt, bottom is minAlt
    return 190 - ((clamped - minAlt) / (maxAlt - minAlt)) * 160
  }

  const sunX = mapAzimuthToX(result.sunsetAzimuth)
  const sunY = mapAltToY(0.0) // At horizon
  const moonX = mapAzimuthToX(result.moonAzimuth)
  const moonY = mapAltToY(result.moonAltitude)
  const horizonY = mapAltToY(0.0)
  const mabimsY = mapAltToY(3.0)

  return (
    <Card className='bs-full border border-[var(--mui-palette-divider)] shadow-lg'>
      <CardHeader
        title={t.title}
        subheader='Simulasi Ufuk Barat saat Terbenam Matahari & Deteksi Ijtimak'
        action={
          <div className='flex items-center gap-2'>
            <div className='flex border rounded-lg border-[var(--mui-palette-divider)] overflow-hidden p-0.5 bg-[var(--mui-palette-action-hover)]'>
              <button
                type='button'
                onClick={() => setViewMode('radar')}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  viewMode === 'radar'
                    ? 'bg-[var(--mui-palette-primary-main)] text-white'
                    : 'text-[var(--mui-palette-text-secondary)]'
                }`}
              >
                Radar Ufuk Barat
              </button>
              <button
                type='button'
                onClick={() => setViewMode('metrics')}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  viewMode === 'metrics'
                    ? 'bg-[var(--mui-palette-primary-main)] text-white'
                    : 'text-[var(--mui-palette-text-secondary)]'
                }`}
              >
                Metrik MABIMS
              </button>
            </div>
            <CustomChip
              label={isLive ? 'Astronomical Engine' : t.solver}
              color={isLive ? 'success' : 'primary'}
              skin='light'
              size='small'
              round='true'
            />
            <OptionMenu options={[t.reset, t.autoGps]} />
          </div>
        }
      />
      <CardContent>
        {/* Next Conjunction Card */}
        <div className='p-4 border rounded-xl border-[var(--mui-palette-divider)] bg-[var(--mui-palette-action-hover)] mb-4 flex items-center justify-between flex-wrap gap-3'>
          <div className='flex items-center gap-3'>
            <CustomAvatar skin='light' color='primary' size={42} variant='rounded'>
              <i className='tabler-calendar-event text-[24px]' />
            </CustomAvatar>
            <div>
              <Typography
                variant='caption'
                color='text.secondary'
                className='uppercase tracking-wide font-semibold block'
              >
                {t.nextConjunction}
              </Typography>
              <Typography variant='h6' className='font-bold' color='text.primary'>
                {result.conjunctionUtc}
              </Typography>
            </div>
          </div>
          <CustomChip
            label={`${result.daysRemaining} ${t.daysRemaining}`}
            color='secondary'
            skin='light'
            className='font-mono font-semibold'
            round='true'
          />
        </div>

        {/* Western Sky Horizon Simulation Radar */}
        {viewMode === 'radar' && (
          <div className='mb-4 p-3 border rounded-xl border-[var(--mui-palette-divider)] bg-[#070b14] overflow-hidden relative'>
            <div className='flex items-center justify-between mb-1.5 px-1'>
              <div className='flex items-center gap-2'>
                <span className='inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping' />
                <Typography variant='caption' className='text-emerald-400 font-bold tracking-wider uppercase text-[11px]'>
                  Live Sky Radar: Ufuk Barat saat Sunset (Ghurub)
                </Typography>
              </div>
              <Typography variant='caption' className='text-slate-400 text-[11px]'>
                Toleransi Danjon: {result.danjonPassed ? '✅ Terpenuhi (>7°)' : '❌ Kritis'}
              </Typography>
            </div>

            <div className='relative w-full h-[210px] overflow-hidden rounded-lg'>
              <svg viewBox='0 0 520 200' className='w-full h-full select-none'>
                <defs>
                  {/* Twilight Sky Gradient */}
                  <linearGradient id={twilightGradId} x1='0%' y1='0%' x2='0%' y2='100%'>
                    <stop offset='0%' stopColor='#0b152d' />
                    <stop offset='45%' stopColor='#1e2952' />
                    <stop offset='75%' stopColor='#7c2d12' />
                    <stop offset='95%' stopColor='#d97706' />
                    <stop offset='100%' stopColor='#f59e0b' />
                  </linearGradient>
                </defs>

                {/* Sky Background */}
                <rect x='0' y='0' width='520' height={horizonY} fill={`url(#${twilightGradId})`} />

                {/* Ground / Sea Silhouette */}
                <rect x='0' y={horizonY} width='520' height={200 - horizonY} fill='#030712' />

                {/* Altitude Grid Lines */}
                {[0, 3, 6, 9, 12].map(alt => {
                  const y = mapAltToY(alt)
                  const isMabims = alt === 3
                  const isHorizon = alt === 0
                  return (
                    <g key={alt}>
                      <line
                        x1='0'
                        y1={y}
                        x2='520'
                        y2={y}
                        stroke={isHorizon ? '#ffffff' : isMabims ? '#10b981' : 'rgba(255,255,255,0.15)'}
                        strokeWidth={isHorizon ? 2 : isMabims ? 1.5 : 0.8}
                        strokeDasharray={isMabims ? '4 3' : 'none'}
                      />
                      <text
                        x='8'
                        y={y - 4}
                        fill={isMabims ? '#10b981' : isHorizon ? '#ffffff' : 'rgba(255,255,255,0.4)'}
                        fontSize='9'
                        fontWeight={isMabims || isHorizon ? 'bold' : 'normal'}
                      >
                        {isHorizon ? 'Ufuk Mar\'i (0°)' : isMabims ? 'Batas MABIMS (+3.0°)' : `+${alt}°`}
                      </text>
                    </g>
                  )
                })}

                {/* Azimuth Grid Lines */}
                {[255, 260, 265, 270, 275, 280, 285].map(az => {
                  const x = mapAzimuthToX(az)
                  const isWest = az === 270
                  return (
                    <g key={az}>
                      <line
                        x1={x}
                        y1='0'
                        x2={x}
                        y2='200'
                        stroke={isWest ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}
                        strokeWidth={isWest ? 1.5 : 0.8}
                        strokeDasharray='2 4'
                      />
                      <text
                        x={x}
                        y='195'
                        textAnchor='middle'
                        fill={isWest ? '#f59e0b' : 'rgba(255,255,255,0.5)'}
                        fontSize='9'
                        fontWeight={isWest ? 'bold' : 'normal'}
                      >
                        {isWest ? 'B (270°)' : `${az}°`}
                      </text>
                    </g>
                  )
                })}

                {/* Setting Sun Disk */}
                <circle cx={sunX} cy={sunY + 4} r='14' fill='#f59e0b' opacity='0.9' />
                <circle cx={sunX} cy={sunY + 4} r='20' fill='#f59e0b' opacity='0.25' />
                <text x={sunX} y={sunY + 22} textAnchor='middle' fill='#fbbf24' fontSize='9' fontWeight='bold'>
                  Matahari ({result.sunsetAzimuth}°)
                </text>

                {/* Hilal Crescent at Moon Coordinates */}
                <g transform={`translate(${moonX}, ${moonY}) rotate(${result.crescentTiltDeg})`}>
                  {/* Glow halo */}
                  <circle
                    cx='0'
                    cy='0'
                    r='16'
                    fill={result.mabimsPassed ? '#10b981' : '#f59e0b'}
                    opacity={result.moonAltitude > 0 ? 0.35 : 0.05}
                  />
                  {/* Crescent Shape: Outer circle minus offset inner circle */}
                  <path
                    d='M 0 -10 A 10 10 0 0 1 0 10 A 8 8 0 0 0 0 -10 Z'
                    fill={result.moonAltitude > 0 ? (result.mabimsPassed ? '#34d399' : '#fbbf24') : '#64748b'}
                    stroke={result.moonAltitude > 0 ? '#ffffff' : '#94a3b8'}
                    strokeWidth='1'
                  />
                </g>

                {/* Moon Label Tag */}
                <g transform={`translate(${moonX}, ${moonY})`}>
                  <rect
                    x='12'
                    y='-18'
                    width='125'
                    height='24'
                    rx='4'
                    fill='rgba(15, 23, 42, 0.85)'
                    stroke={result.mabimsPassed ? '#10b981' : '#f59e0b'}
                    strokeWidth='1'
                  />
                  <text x='18' y='-4' fill='#ffffff' fontSize='9' fontWeight='bold'>
                    🌙 Hilal (h: {result.moonAltitude > 0 ? `+${result.moonAltitude}°` : `${result.moonAltitude}°`})
                  </text>
                  <text x='18' y='4' fill={result.mabimsPassed ? '#34d399' : '#fbbf24'} fontSize='8'>
                    {result.mabimsPassed ? 'LULUS MABIMS' : 'DI BAWAH MARG.'} | Az: {result.moonAzimuth}°
                  </text>
                </g>
              </svg>
            </div>

            {/* Sub-Radar Telemetry Pill Badges */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-slate-800 text-center'>
              <div className='p-1.5 bg-slate-900/80 rounded border border-slate-800'>
                <Typography variant='caption' className='text-slate-400 block text-[10px] font-semibold'>
                  Lebar Sabit (W)
                </Typography>
                <Typography variant='body2' className='font-mono font-bold text-emerald-400 text-xs'>
                  {result.crescentWidthArcmin}' busur
                </Typography>
              </div>
              <div className='p-1.5 bg-slate-900/80 rounded border border-slate-800'>
                <Typography variant='caption' className='text-slate-400 block text-[10px] font-semibold'>
                  Kemiringan Sabit
                </Typography>
                <Typography variant='body2' className='font-mono font-bold text-amber-300 text-xs'>
                  {result.crescentTiltDeg}°
                </Typography>
              </div>
              <div className='p-1.5 bg-slate-900/80 rounded border border-slate-800'>
                <Typography variant='caption' className='text-slate-400 block text-[10px] font-semibold'>
                  Selisih Azimuth (DAZ)
                </Typography>
                <Typography variant='body2' className='font-mono font-bold text-teal-300 text-xs'>
                  {result.relativeAzimuth > 0 ? `+${result.relativeAzimuth}°` : `${result.relativeAzimuth}°`}
                </Typography>
              </div>
              <div className='p-1.5 bg-slate-900/80 rounded border border-slate-800'>
                <Typography variant='caption' className='text-slate-400 block text-[10px] font-semibold'>
                  Lag Time (Bulan-Mthr)
                </Typography>
                <Typography variant='body2' className='font-mono font-bold text-blue-300 text-xs'>
                  +{result.lagTimeMinutes} menit
                </Typography>
              </div>
            </div>
          </div>
        )}

        {/* Preset Observatorium Quick Buttons */}
        <div className='flex items-center gap-1.5 flex-wrap mb-3'>
          <Typography variant='caption' color='text.secondary' className='font-semibold text-xs mr-1'>
            Preset:
          </Typography>
          {PRESET_OBSERVATORIES.map((obs, i) => (
            <button
              key={i}
              type='button'
              onClick={() => handleSelectPreset(obs)}
              className='text-xs px-2.5 py-1 rounded-md border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-action-hover)] hover:bg-[var(--mui-palette-action-selected)] transition-colors'
            >
              {obs.name.split(',')[0]}
            </button>
          ))}
        </div>

        {/* Input Parameters */}
        <Grid container spacing={3} className='mb-3'>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              fullWidth
              size='small'
              label={t.latitude}
              value={lat}
              onChange={e => setLat(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              fullWidth
              size='small'
              label={t.longitude}
              value={lon}
              onChange={e => setLon(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              fullWidth
              size='small'
              label={t.elevation}
              value={elev}
              onChange={e => setElev(e.target.value)}
            />
          </Grid>
        </Grid>

        <Button
          variant='contained'
          size='small'
          onClick={handleRecalculate}
          disabled={loading}
          startIcon={loading ? <i className='tabler-loader animate-spin' /> : <i className='tabler-calculator' />}
          className='mb-4'
        >
          {loading ? 'Menghitung...' : t.calculate}
        </Button>

        <Divider className='my-3' />

        {/* Evaluation Output Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <div className='p-3.5 border rounded-xl border-[var(--mui-palette-divider)]'>
              <div className='flex items-center gap-2 mb-1.5'>
                <CustomAvatar
                  skin='light'
                  color={result.mabimsPassed ? 'success' : 'error'}
                  size={30}
                  variant='rounded'
                >
                  <i className={`${result.mabimsPassed ? 'tabler-check' : 'tabler-x'} text-[18px]`} />
                </CustomAvatar>
                <Typography variant='caption' color='text.secondary' className='font-semibold block'>
                  {t.mabimsCriteria}
                </Typography>
              </div>
              <Typography
                variant='subtitle2'
                className='font-bold'
                color={result.mabimsPassed ? 'success.main' : 'error.main'}
              >
                {result.mabimsPassed ? t.meetsCriteria : t.notMeetCriteria}
              </Typography>
              <Typography variant='caption' color='text.disabled' className='text-[11px] block mt-0.5'>
                {t.altitudeLabel} {result.altitude}° (≥ 3°) | {t.elongationLabel} {result.elongation}° (≥ 6.4°)
              </Typography>
            </div>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <div className='p-3.5 border rounded-xl border-[var(--mui-palette-divider)]'>
              <div className='flex items-center gap-2 mb-1.5'>
                <CustomAvatar
                  skin='light'
                  color={result.wujudulHilalPassed ? 'success' : 'error'}
                  size={30}
                  variant='rounded'
                >
                  <i className={`${result.wujudulHilalPassed ? 'tabler-eye' : 'tabler-eye-off'} text-[18px]`} />
                </CustomAvatar>
                <Typography variant='caption' color='text.secondary' className='font-semibold block'>
                  {t.wujudulHilalCriteria}
                </Typography>
              </div>
              <Typography
                variant='subtitle2'
                className='font-bold'
                color={result.wujudulHilalPassed ? 'success.main' : 'error.main'}
              >
                {result.wujudulHilalPassed ? t.hilalVisible : t.hilalNotVisible}
              </Typography>
              <Typography variant='caption' color='text.disabled' className='text-[11px] block mt-0.5'>
                {t.aboveHorizon}
              </Typography>
            </div>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <div className='p-3.5 border rounded-xl border-[var(--mui-palette-divider)]'>
              <div className='flex items-center gap-2 mb-1.5'>
                <CustomAvatar skin='light' color='info' size={30} variant='rounded'>
                  <i className='tabler-telescope text-[18px]' />
                </CustomAvatar>
                <Typography variant='caption' color='text.secondary' className='font-semibold block'>
                  {t.odehModel}
                </Typography>
              </div>
              <Typography variant='subtitle2' className='font-bold' color='info.main'>
                {t.odehZones[result.odehZone]}
              </Typography>
              <Typography variant='caption' color='text.disabled' className='text-[11px] block mt-0.5'>
                {t.odehFormula}
              </Typography>
            </div>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
