'use client'

import { useState, useEffect, useId } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

import CustomAvatar from '@moonwitness/ui/avatar'
import CustomChip from '@moonwitness/ui/chip'
import CustomTextField from '@moonwitness/ui/text-field'

interface PrayerData {
  latitude: number
  longitude: number
  elevation_meters: number
  timezone_offset_hours: number
  utc_date: string
  local_time: string
  imsak_utc: string
  fajr_utc: string
  sunrise_utc: string
  dhuhr_utc: string
  asr_utc: string
  sunset_utc: string
  maghrib_utc: string
  isha_utc: string
  midnight_utc: string
  last_third_utc: string
  active_prayer: string
  next_prayer: string
  seconds_to_next_prayer: number
  countdown_formatted: string
  solar_altitude_deg: number
  solar_azimuth_deg: number
  shadow_ratio: number
  qibla_bearing_deg: number
  qibla_distance_km: number
  qibla_cardinal: string
  qibla_west_offset_deg: number
}

const PRESET_STATIONS = [
  { name: 'Bosscha Observatory, Lembang', lat: '-6.8252', lon: '107.6169', elev: '1310' },
  { name: 'Timau National Observatory, NTT', lat: '-9.5833', lon: '123.9500', elev: '1300' },
  { name: 'Cibeas Observation Station, Sukabumi', lat: '-7.0125', lon: '106.5417', elev: '45' },
  { name: 'Makkah Clock Tower, Saudi Arabia', lat: '21.4225', lon: '39.8262', elev: '601' },
  { name: 'Monas, DKI Jakarta', lat: '-6.1754', lon: '106.8272', elev: '8' },
  { name: 'Royal Observatory Greenwich, UK', lat: '51.4769', lon: '-0.0005', elev: '46' }
]

export default function PrayerAndQiblaCard() {
  const [selectedStation, setSelectedStation] = useState(0)
  const [lat, setLat] = useState('-6.8252')
  const [lon, setLon] = useState('107.6169')
  const [elev, setElev] = useState('1310')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PrayerData | null>(null)
  const [countdownSecs, setCountdownSecs] = useState<number>(0)
  const compassGradId = useId()

  const fetchPrayerData = async (latitude = lat, longitude = lon, elevation = elev) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/apps/celestial?endpoint=time/prayer-times&lat=${latitude}&lon=${longitude}&elevation=${elevation}`
      )
      if (res.ok) {
        const json: PrayerData = await res.json()
        setData(json)
        setCountdownSecs(Math.floor(json.seconds_to_next_prayer))
      }
    } catch (e) {
      console.error('Failed to load prayer times:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrayerData()
  }, [])

  // Local 1-second countdown interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSecs(prev => {
        if (prev <= 1) {
          fetchPrayerData(lat, lon, elev)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [lat, lon, elev])

  const handleStationChange = (idx: number) => {
    setSelectedStation(idx)
    const st = PRESET_STATIONS[idx]
    setLat(st.lat)
    setLon(st.lon)
    setElev(st.elev)
    fetchPrayerData(st.lat, st.lon, st.elev)
  }

  const formatCountdown = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    const s = totalSecs % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatTime = (utcIso: string, offsetHours: number) => {
    if (!utcIso) return '--:--'
    try {
      const d = new Date(utcIso)
      if (isNaN(d.getTime())) return '--:--'
      // Offset manual sesuai stasiun
      const utcMs = d.getTime()
      const localMs = utcMs + offsetHours * 3600 * 1000
      const localDate = new Date(localMs)
      const hh = localDate.getUTCHours().toString().padStart(2, '0')
      const mm = localDate.getUTCMinutes().toString().padStart(2, '0')
      const ss = localDate.getUTCSeconds().toString().padStart(2, '0')
      return `${hh}:${mm}:${ss}`
    } catch {
      return '--:--'
    }
  }

  const tz = data?.timezone_offset_hours ?? 7
  const tzLabel = tz >= 0 ? `UTC+${tz}` : `UTC${tz}`

  // Prayer list for table
  const prayerRows = data
    ? [
        { name: 'Imsak', time: formatTime(data.imsak_utc, tz), sub: '10 mnt sblm Subuh', isNext: false, isNow: false },
        {
          name: 'Subuh (Fajr)',
          time: formatTime(data.fajr_utc, tz),
          sub: 'h = -20.0° MABIMS',
          isNext: data.next_prayer.includes('Subuh'),
          isNow: data.active_prayer.includes('Subuh')
        },
        {
          name: 'Syuruq (Sunrise)',
          time: formatTime(data.sunrise_utc, tz),
          sub: 'Terbit Matahari',
          isNext: data.next_prayer.includes('Syuruq'),
          isNow: data.active_prayer.includes('Syuruq')
        },
        {
          name: 'Dzuhur (Dhuhr)',
          time: formatTime(data.dhuhr_utc, tz),
          sub: 'Zawwal + 2m ihtiyat',
          isNext: data.next_prayer.includes('Dzuhur'),
          isNow: data.active_prayer.includes('Dzuhur')
        },
        {
          name: 'Ashar (Asr)',
          time: formatTime(data.asr_utc, tz),
          sub: 'Bayangan 1:1 + 2m',
          isNext: data.next_prayer.includes('Ashar'),
          isNow: data.active_prayer.includes('Ashar')
        },
        {
          name: 'Maghrib (Sunset)',
          time: formatTime(data.maghrib_utc, tz),
          sub: 'Ghurub + 2m ihtiyat',
          isNext: data.next_prayer.includes('Maghrib'),
          isNow: data.active_prayer.includes('Maghrib')
        },
        {
          name: 'Isya (Isha)',
          time: formatTime(data.isha_utc, tz),
          sub: 'h = -18.0° MABIMS',
          isNext: data.next_prayer.includes('Isya'),
          isNow: data.active_prayer.includes('Isya')
        },
        {
          name: 'Nisf al-Layl',
          time: formatTime(data.midnight_utc, tz),
          sub: 'Tengah Malam Astronomis',
          isNext: false,
          isNow: false
        },
        {
          name: 'Sepertiga Malam',
          time: formatTime(data.last_third_utc, tz),
          sub: 'Waktu Sahur / Tahajjud',
          isNext: false,
          isNow: false
        }
      ]
    : []

  return (
    <Card className='bs-full border border-[var(--mui-palette-divider)] shadow-lg'>
      <CardHeader
        title={
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='font-bold text-lg text-[var(--mui-palette-text-primary)]'>
              Jadwal Shalat Astronomis & Kompas Kiblat Presisi
            </span>
            <CustomChip
              label={data ? `${data.active_prayer} Aktif` : 'Menghitung...'}
              color='success'
              skin='light'
              size='small'
              round='true'
              className='font-semibold animate-pulse'
            />
          </div>
        }
        subheader={`Komputasi sferis toposentrik & lintas lingkaran geodesi Ka'bah (${tzLabel})`}
        action={
          <div className='flex items-center gap-2'>
            <CustomChip
              label='VSOP87 + Vincenty'
              color='primary'
              skin='light'
              size='small'
              round='true'
              className='font-mono'
            />
          </div>
        }
      />
      <CardContent className='pt-0'>
        {/* Preset Observatorium Switcher */}
        <div className='p-4 border rounded-xl border-[var(--mui-palette-divider)] bg-[var(--mui-palette-action-hover)] mb-6'>
          <Grid container spacing={3} alignItems='center'>
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth size='small'>
                <InputLabel id='station-select-label'>Pilih Stasiun Pengamatan</InputLabel>
                <Select
                  labelId='station-select-label'
                  value={selectedStation}
                  label='Pilih Stasiun Pengamatan'
                  onChange={e => handleStationChange(Number(e.target.value))}
                >
                  {PRESET_STATIONS.map((st, i) => (
                    <MenuItem key={i} value={i}>
                      {st.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 4, md: 2 }}>
              <CustomTextField
                fullWidth
                size='small'
                label='Latitude (°)'
                value={lat}
                onChange={e => setLat(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 4, md: 2 }}>
              <CustomTextField
                fullWidth
                size='small'
                label='Longitude (°)'
                value={lon}
                onChange={e => setLon(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 4, md: 2 }}>
              <CustomTextField
                fullWidth
                size='small'
                label='Elev (m)'
                value={elev}
                onChange={e => setElev(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                variant='contained'
                size='small'
                fullWidth
                disabled={loading}
                onClick={() => fetchPrayerData(lat, lon, elev)}
                className='h-[40px]'
              >
                {loading ? <i className='tabler-loader animate-spin' /> : <i className='tabler-refresh' />}
              </Button>
            </Grid>
          </Grid>
        </div>

        <Grid container spacing={6}>
          {/* Kolom Kiri: Countdown & Timeline Jadwal Shalat */}
          <Grid size={{ xs: 12, lg: 7 }}>
            {/* Live Next Prayer Countdown Hero Banner */}
            <div className='p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-teal-950/70 border border-emerald-500/30 shadow-inner mb-6 relative overflow-hidden'>
              <div className='absolute -right-6 -bottom-6 opacity-10 pointer-events-none'>
                <i className='tabler-moon-stars text-[160px] text-emerald-400' />
              </div>
              <div className='flex items-center justify-between flex-wrap gap-4'>
                <div>
                  <Typography variant='caption' className='text-emerald-400 font-semibold uppercase tracking-wider block mb-1'>
                    Shalat Berikutnya
                  </Typography>
                  <Typography variant='h4' className='font-black text-white flex items-center gap-2'>
                    {data?.next_prayer || 'Memuat...'}
                  </Typography>
                  <Typography variant='caption' className='text-slate-300 block mt-1'>
                    Waktu Saat Ini: <span className='font-mono font-bold text-emerald-300'>{data?.local_time || '--:--'}</span> ({tzLabel})
                  </Typography>
                </div>
                <div className='text-right'>
                  <Typography variant='caption' className='text-slate-300 font-semibold uppercase tracking-wider block mb-1'>
                    Hitung Mundur Adzan
                  </Typography>
                  <Typography variant='h3' className='font-black font-mono tracking-tight text-emerald-300'>
                    {formatCountdown(countdownSecs)}
                  </Typography>
                  <Typography variant='caption' className='text-slate-400 text-xs block mt-1'>
                    Presisi toleransi: ±0.1 detik
                  </Typography>
                </div>
              </div>
              <div className='mt-4'>
                <LinearProgress
                  variant='determinate'
                  value={Math.max(5, Math.min(100, 100 - (countdownSecs / 18000) * 100))}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': { bgcolor: '#10b981' }
                  }}
                />
              </div>
            </div>

            {/* Timeline Waktu Shalat Hari Ini */}
            <div className='border rounded-xl border-[var(--mui-palette-divider)] overflow-hidden'>
              <div className='bg-[var(--mui-palette-action-hover)] px-4 py-2.5 border-b border-[var(--mui-palette-divider)] flex items-center justify-between'>
                <Typography variant='subtitle2' className='font-bold uppercase tracking-wider text-xs'>
                  Jadwal Waktu Shalat Hari Ini ({data?.utc_date || ''})
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Standar MABIMS / Kemenag RI (+2m Ihtiyat)
                </Typography>
              </div>
              <div className='divide-y divide-[var(--mui-palette-divider)]'>
                {prayerRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-4 py-3 transition-colors ${
                      row.isNow
                        ? 'bg-emerald-500/15 font-bold border-l-4 border-l-emerald-500'
                        : row.isNext
                        ? 'bg-blue-500/10 border-l-4 border-l-blue-500'
                        : 'hover:bg-[var(--mui-palette-action-hover)]'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <CustomAvatar
                        skin='light'
                        color={row.isNow ? 'success' : row.isNext ? 'primary' : 'secondary'}
                        size={32}
                        variant='rounded'
                      >
                        <i
                          className={`${
                            row.name.includes('Subuh') || row.name.includes('Imsak')
                              ? 'tabler-sun-high'
                              : row.name.includes('Syuruq')
                              ? 'tabler-sunrise'
                              : row.name.includes('Dzuhur')
                              ? 'tabler-sun'
                              : row.name.includes('Ashar')
                              ? 'tabler-sunset'
                              : row.name.includes('Maghrib')
                              ? 'tabler-moon'
                              : 'tabler-stars'
                          } text-[18px]`}
                        />
                      </CustomAvatar>
                      <div>
                        <Typography variant='body2' className={`font-semibold ${row.isNow ? 'text-emerald-400' : ''}`}>
                          {row.name}
                        </Typography>
                        <Typography variant='caption' color='text.disabled' className='text-[11px] block'>
                          {row.sub}
                        </Typography>
                      </div>
                    </div>
                    <div className='text-right'>
                      <Typography variant='body1' className='font-mono font-bold tracking-wider'>
                        {row.time} <span className='text-[10px] font-normal text-slate-400'>{tzLabel}</span>
                      </Typography>
                      {row.isNow && (
                        <span className='inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400'>
                          Sedang Berlangsung
                        </span>
                      )}
                      {row.isNext && (
                        <span className='inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400'>
                          Selanjutnya
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Grid>

          {/* Kolom Kanan: High-Precision Qibla Compass & Solar Telemetry */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <div className='border rounded-2xl border-[var(--mui-palette-divider)] p-5 bg-[var(--mui-palette-background-paper)] flex flex-col items-center justify-center text-center shadow-md'>
              <Typography variant='subtitle2' className='font-bold uppercase tracking-wider text-xs mb-1 text-slate-400'>
                Arah Kiblat Menuju Ka'bah (Makkah)
              </Typography>
              <Typography variant='h5' className='font-black text-[var(--mui-palette-text-primary)]'>
                {data ? `${data.qibla_bearing_deg}°` : '--°'}{' '}
                <span className='text-sm font-semibold text-emerald-500'>({data?.qibla_cardinal})</span>
              </Typography>
              <Typography variant='caption' color='text.secondary' className='mb-4 block'>
                {data ? `${data.qibla_west_offset_deg}° dari Barat ke Utara (Offset Geodesi)` : ''}
              </Typography>

              {/* Interactive SVG Compass Dial */}
              <div className='relative w-[240px] h-[240px] my-2'>
                <svg viewBox='0 0 260 260' className='w-full h-full drop-shadow-xl'>
                  <defs>
                    <linearGradient id={compassGradId} x1='0%' y1='0%' x2='100%' y2='100%'>
                      <stop offset='0%' stopColor='#d97706' />
                      <stop offset='50%' stopColor='#f59e0b' />
                      <stop offset='100%' stopColor='#78350f' />
                    </linearGradient>
                  </defs>

                  {/* Outer Brass Ring */}
                  <circle cx='130' cy='130' r='120' fill='#0f172a' stroke={`url(#${compassGradId})`} strokeWidth='4' />
                  <circle cx='130' cy='130' r='112' fill='none' stroke='#334155' strokeWidth='1' strokeDasharray='2 4' />

                  {/* 16 Cardinal Ticks */}
                  {Array.from({ length: 16 }).map((_, i) => {
                    const angle = i * 22.5
                    const isMajor = i % 4 === 0
                    const rad = (angle * Math.PI) / 180
                    const rInner = isMajor ? 100 : 106
                    const rOuter = 112
                    const x1 = 130 + rInner * Math.sin(rad)
                    const y1 = 130 - rInner * Math.cos(rad)
                    const x2 = 130 + rOuter * Math.sin(rad)
                    const y2 = 130 - rOuter * Math.cos(rad)
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isMajor ? '#f59e0b' : '#64748b'}
                        strokeWidth={isMajor ? 2.5 : 1}
                      />
                    )
                  })}

                  {/* Cardinal Labels */}
                  <text x='130' y='32' textAnchor='middle' fill='#ef4444' fontSize='12' fontWeight='bold'>
                    U (0°)
                  </text>
                  <text x='234' y='134' textAnchor='middle' fill='#94a3b8' fontSize='11' fontWeight='bold'>
                    T (90°)
                  </text>
                  <text x='130' y='238' textAnchor='middle' fill='#94a3b8' fontSize='11' fontWeight='bold'>
                    S (180°)
                  </text>
                  <text x='26' y='134' textAnchor='middle' fill='#94a3b8' fontSize='11' fontWeight='bold'>
                    B (270°)
                  </text>

                  {/* Sun Azimuth Marker if above horizon */}
                  {data && data.solar_altitude_deg > 0 && (
                    <g transform={`rotate(${data.solar_azimuth_deg}, 130, 130)`}>
                      <circle cx='130' cy='36' r='6' fill='#fbbf24' stroke='#f59e0b' strokeWidth='2' />
                      <line x1='130' y1='42' x2='130' y2='65' stroke='#fbbf24' strokeWidth='1.5' strokeDasharray='2 2' />
                    </g>
                  )}

                  {/* Qibla Needle Group (Rotated to qibla_bearing_deg) */}
                  <g transform={`rotate(${data?.qibla_bearing_deg || 295.2}, 130, 130)`}>
                    {/* Emerald / Gold needle pointing to Qibla */}
                    <polygon points='130,22 138,130 122,130' fill='#10b981' stroke='#059669' strokeWidth='1.5' />
                    {/* Counter needle */}
                    <polygon points='130,226 136,130 124,130' fill='#475569' stroke='#334155' strokeWidth='1' />
                    {/* Ka'bah icon at tip */}
                    <rect x='124' y='14' width='12' height='12' rx='2' fill='#d97706' stroke='#ffffff' strokeWidth='1' />
                  </g>

                  {/* Center Brass Hub */}
                  <circle cx='130' cy='130' r='10' fill='#f59e0b' stroke='#78350f' strokeWidth='2' />
                  <circle cx='130' cy='130' r='4' fill='#ffffff' />
                </svg>
              </div>

              {/* Qibla Geodesic Details */}
              <div className='w-full grid grid-cols-2 gap-3 mt-4'>
                <div className='p-3 bg-[var(--mui-palette-action-hover)] rounded-xl border border-[var(--mui-palette-divider)]'>
                  <Typography variant='caption' color='text.secondary' className='block font-semibold'>
                    Jarak ke Ka'bah
                  </Typography>
                  <Typography variant='subtitle1' className='font-black text-emerald-500 font-mono'>
                    {data ? `${data.qibla_distance_km.toLocaleString()} km` : '--'}
                  </Typography>
                </div>
                <div className='p-3 bg-[var(--mui-palette-action-hover)] rounded-xl border border-[var(--mui-palette-divider)]'>
                  <Typography variant='caption' color='text.secondary' className='block font-semibold'>
                    Koordinat Ka'bah
                  </Typography>
                  <Typography variant='subtitle2' className='font-mono font-bold'>
                    21.42° N, 39.83° E
                  </Typography>
                </div>
              </div>

              <Divider className='w-full my-4' />

              {/* Live Solar Position & Shadow Ratio */}
              <div className='w-full'>
                <Typography variant='caption' className='text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2'>
                  Telemetri Posisi Matahari Saat Ini
                </Typography>
                <div className='grid grid-cols-3 gap-2 text-center'>
                  <div className='p-2 bg-[var(--mui-palette-action-hover)] rounded-lg'>
                    <Typography variant='caption' color='text.secondary' className='text-[10px] block font-semibold'>
                      Altitude (Tinggi)
                    </Typography>
                    <Typography variant='body2' className='font-bold font-mono text-amber-500'>
                      {data ? `${data.solar_altitude_deg}°` : '--'}
                    </Typography>
                  </div>
                  <div className='p-2 bg-[var(--mui-palette-action-hover)] rounded-lg'>
                    <Typography variant='caption' color='text.secondary' className='text-[10px] block font-semibold'>
                      Azimuth (Arah)
                    </Typography>
                    <Typography variant='body2' className='font-bold font-mono'>
                      {data ? `${data.solar_azimuth_deg}°` : '--'}
                    </Typography>
                  </div>
                  <div className='p-2 bg-[var(--mui-palette-action-hover)] rounded-lg'>
                    <Typography variant='caption' color='text.secondary' className='text-[10px] block font-semibold'>
                      Rasio Bayangan
                    </Typography>
                    <Typography variant='body2' className='font-bold font-mono text-teal-400'>
                      {data ? `${data.shadow_ratio}x` : '--'}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
