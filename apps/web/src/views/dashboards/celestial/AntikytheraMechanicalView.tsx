'use client'

import { useState, useEffect, useRef } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Slider from '@mui/material/Slider'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import CustomChip from '@moonwitness/ui/chip'
import type { AntikytheraGearsTelemetry } from '@moonwitness/types'

import type { CelestialDictionary } from '@/utils/getDictionary'

interface Props {
  gears: AntikytheraGearsTelemetry | null
  isLive: boolean
  onManualScrub?: (offsetDays: number) => void
  translations: CelestialDictionary['mechanism']
}

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', startDeg: 0, color: '#FF7043' },
  { name: 'Taurus', symbol: '♉', startDeg: 30, color: '#81C784' },
  { name: 'Gemini', symbol: '♊', startDeg: 60, color: '#FFD54F' },
  { name: 'Cancer', symbol: '♋', startDeg: 90, color: '#4FC3F7' },
  { name: 'Leo', symbol: '♌', startDeg: 120, color: '#FFB74D' },
  { name: 'Virgo', symbol: '♍', startDeg: 150, color: '#A1887F' },
  { name: 'Libra', symbol: '♎', startDeg: 180, color: '#BA68C8' },
  { name: 'Scorpio', symbol: '♏', startDeg: 210, color: '#E57373' },
  { name: 'Sagittarius', symbol: '♐', startDeg: 240, color: '#7986CB' },
  { name: 'Capricorn', symbol: '♑', startDeg: 270, color: '#90A4AE' },
  { name: 'Aquarius', symbol: '♒', startDeg: 300, color: '#4DB6AC' },
  { name: 'Pisces', symbol: '♓', startDeg: 330, color: '#9575CD' }
]

export default function AntikytheraMechanicalView({ gears, isLive, translations: t }: Props) {
  const [activeTab, setActiveTab] = useState<'front' | 'gears' | 'back'>('front')
  const [isPlaying, setIsPlaying] = useState(false)
  const [simSpeed, setSimSpeed] = useState<number>(1) // 1x, 60x, 3600x, 86400x
  const [timeOffsetDays, setTimeOffsetDays] = useState<number>(0)
  const animFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(Date.now())

  // Base angles from live telemetry
  const baseSunDeg = gears?.sun_wheel_deg ?? 189.9
  const baseMoonDeg = gears?.moon_wheel_deg ?? 94.5
  const baseB1Deg = gears?.b1_master_deg ?? 310.2
  const baseMetonicDeg = gears?.metonic?.dial_angle_degrees ?? 188.9
  const baseSarosDeg = gears?.saros?.dial_angle_degrees ?? 189.9

  // Calculate dynamic angles taking into account simulation time offset (in days)
  // Sun moves ~360° / 365.2422 days ~= 0.9856°/day
  // Moon moves ~360° / 27.3216 days ~= 13.176°/day
  // Phase moves ~360° / 29.5306 days ~= 12.190°/day
  const sunDeg = (baseSunDeg + timeOffsetDays * 0.9856) % 360
  const moonDeg = (baseMoonDeg + timeOffsetDays * 13.176) % 360
  const phaseDeg = (moonDeg - sunDeg + 360) % 360
  const b1Deg = (baseB1Deg + timeOffsetDays * 0.9856) % 360
  const metonicDeg = (baseMetonicDeg + (timeOffsetDays / 29.5306) * ((360 * 5) / 235)) % 360
  const sarosDeg = (baseSarosDeg + (timeOffsetDays / 29.5306) * ((360 * 4) / 223)) % 360

  // Gear mesh angles
  const c1Deg = (-b1Deg * (64 / 38)) % 360
  const d1Deg = (-c1Deg * (48 / 24)) % 360
  const d2Deg = d1Deg
  const k1Deg = (moonDeg * 1.5) % 360
  const k2Deg = (k1Deg + 15 * Math.sin((k1Deg * Math.PI) / 180)) % 360

  // Animation ticker for simulation mode
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

      return
    }

    lastTimeRef.current = Date.now()

    const loop = () => {
      const now = Date.now()
      const dt = (now - lastTimeRef.current) / 1000 // seconds

      lastTimeRef.current = now

      // Advance time offset: 1 real second = (simSpeed / 86400) days
      setTimeOffsetDays(prev => (prev + (dt * simSpeed) / 86400) % 7000)
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying, simSpeed])

  const handleReset = () => {
    setIsPlaying(false)
    setTimeOffsetDays(0)
  }

  // Get current zodiac sign for Sun & Moon
  const getZodiac = (deg: number) => {
    const normalized = ((deg % 360) + 360) % 360
    const idx = Math.floor(normalized / 30) % 12

    return ZODIAC_SIGNS[idx]
  }

  const sunSign = getZodiac(sunDeg)
  const moonSign = getZodiac(moonDeg)

  const zodiacNames: Record<string, string> = {
    Aries: t.zodiacAries,
    Taurus: t.zodiacTaurus,
    Gemini: t.zodiacGemini,
    Cancer: t.zodiacCancer,
    Leo: t.zodiacLeo,
    Virgo: t.zodiacVirgo,
    Libra: t.zodiacLibra,
    Scorpio: t.zodiacScorpio,
    Sagittarius: t.zodiacSagittarius,
    Capricorn: t.zodiacCapricorn,
    Aquarius: t.zodiacAquarius,
    Pisces: t.zodiacPisces
  }

  return (
    <Box className='flex flex-col gap-4'>
      {/* View Tabs */}
      <Box className='flex items-center justify-between border-b border-[var(--mui-palette-divider)] pb-2 flex-wrap gap-2'>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor='primary'
          indicatorColor='primary'
          className='min-bs-0'
        >
          <Tab
            value='front'
            label={t.frontDialTab}
            icon={<i className='tabler-compass text-[18px]' />}
            iconPosition='start'
            className='min-bs-0 py-1'
          />
          <Tab
            value='gears'
            label={t.mechanicalGearsTab}
            icon={<i className='tabler-settings-cog text-[18px]' />}
            iconPosition='start'
            className='min-bs-0 py-1'
          />
          <Tab
            value='back'
            label={t.backDialTab}
            icon={<i className='tabler-rotate-clockwise text-[18px]' />}
            iconPosition='start'
            className='min-bs-0 py-1'
          />
        </Tabs>

        <div className='flex items-center gap-2'>
          <CustomChip
            label={
              timeOffsetDays === 0
                ? isLive
                  ? t.liveRealtime
                  : t.tccSynchronized
                : t.simulatedDays.replace('{days}', timeOffsetDays.toFixed(1))
            }
            color={timeOffsetDays === 0 ? 'success' : 'warning'}
            skin='light'
            size='small'
            round='true'
          />
        </div>
      </Box>

      {/* Main Interactive Stage */}
      <Box className='relative w-full rounded-2xl overflow-hidden border border-[var(--mui-palette-divider)] bg-gradient-to-b from-[#0f141c] to-[#080b0f] flex items-center justify-center p-4 min-h-[380px]'>
        {/* TAB 1: FRONT DIAL (Zodiac & Calendar Astrolabe) */}
        {activeTab === 'front' && (
          <svg viewBox='0 0 440 440' className='w-full max-w-[420px] h-auto select-none'>
            <defs>
              <radialGradient id='brassBezel' cx='50%' cy='50%' r='50%'>
                <stop offset='85%' stopColor='#C5A059' />
                <stop offset='95%' stopColor='#8C6F2D' />
                <stop offset='100%' stopColor='#4A3B18' />
              </radialGradient>
              <radialGradient id='innerPlate' cx='50%' cy='50%' r='50%'>
                <stop offset='0%' stopColor='#1e293b' />
                <stop offset='70%' stopColor='#0f172a' />
                <stop offset='100%' stopColor='#020617' />
              </radialGradient>
              <linearGradient id='sunBeam' x1='0%' y1='0%' x2='100%' y2='0%'>
                <stop offset='0%' stopColor='#FFD700' />
                <stop offset='100%' stopColor='#FF8C00' />
              </linearGradient>
              <linearGradient id='moonBeam' x1='0%' y1='0%' x2='100%' y2='0%'>
                <stop offset='0%' stopColor='#E2E8F0' />
                <stop offset='100%' stopColor='#94A3B8' />
              </linearGradient>
              <filter id='dropGlow' x='-20%' y='-20%' width='140%' height='140%'>
                <feGaussianBlur stdDeviation='3' result='glow' />
                <feComposite in='SourceGraphic' in2='glow' operator='over' />
              </filter>
            </defs>

            {/* Outer Brass Bezel */}
            <circle cx='220' cy='220' r='210' fill='url(#brassBezel)' stroke='#DAA520' strokeWidth='3' />
            <circle cx='220' cy='220' r='200' fill='none' stroke='#4A3B18' strokeWidth='2' />

            {/* Egyptian 365-day Calendar Ring (Outer Ticks) */}
            {Array.from({ length: 73 }).map((_, i) => {
              const angle = (i * 360) / 73
              const rad = (angle * Math.PI) / 180
              const x1 = 220 + 200 * Math.cos(rad)
              const y1 = 220 + 200 * Math.sin(rad)
              const x2 = 220 + 192 * Math.cos(rad)
              const y2 = 220 + 192 * Math.sin(rad)

              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke='#D4AF37' strokeWidth='1.2' opacity='0.7' />
            })}

            {/* Inner Plate */}
            <circle cx='220' cy='220' r='190' fill='url(#innerPlate)' stroke='#D4AF37' strokeWidth='2' />

            {/* 12 Zodiac Constellation Sectors */}
            {ZODIAC_SIGNS.map((sign, i) => {
              const midAngle = sign.startDeg + 15
              const midRad = ((midAngle - 90) * Math.PI) / 180
              const labelX = 220 + 165 * Math.cos(midRad)
              const labelY = 220 + 165 * Math.sin(midRad)
              const sepRad = ((sign.startDeg - 90) * Math.PI) / 180
              const sepX1 = 220 + 145 * Math.cos(sepRad)
              const sepY1 = 220 + 145 * Math.sin(sepRad)
              const sepX2 = 220 + 190 * Math.cos(sepRad)
              const sepY2 = 220 + 190 * Math.sin(sepRad)

              return (
                <g key={i}>
                  <line x1={sepX1} y1={sepY1} x2={sepX2} y2={sepY2} stroke='#C5A059' strokeWidth='1.5' opacity='0.6' />
                  <text
                    x={labelX}
                    y={labelY}
                    fill={sign.color}
                    fontSize='13'
                    fontWeight='bold'
                    fontFamily='serif'
                    textAnchor='middle'
                    dominantBaseline='central'
                  >
                    {sign.symbol}
                  </text>
                </g>
              )
            })}

            {/* Inner Ecliptic Degree Circle */}
            <circle cx='220' cy='220' r='145' fill='none' stroke='#C5A059' strokeWidth='1.5' strokeDasharray='2 4' />

            {/* Earth Center Hub */}
            <circle cx='220' cy='220' r='24' fill='#0B192C' stroke='#D4AF37' strokeWidth='2.5' />
            <circle cx='220' cy='220' r='14' fill='#1E3A8A' />
            <text
              x='220'
              y='221'
              fill='#93C5FD'
              fontSize='10'
              fontWeight='bold'
              textAnchor='middle'
              dominantBaseline='central'
            >
              🌍
            </text>

            {/* ================= SUN HAND (GOLDEN) ================= */}
            <g transform={`rotate(${sunDeg - 90} 220 220)`} filter='url(#dropGlow)'>
              <line
                x1='220'
                y1='220'
                x2='385'
                y2='220'
                stroke='url(#sunBeam)'
                strokeWidth='3.5'
                strokeLinecap='round'
              />
              {/* Golden Sun Emblem */}
              <circle cx='365' cy='220' r='12' fill='#FFD700' stroke='#B8860B' strokeWidth='2' />
              {/* Sun Rays */}
              {Array.from({ length: 8 }).map((_, j) => (
                <line
                  key={j}
                  x1={365 + 13 * Math.cos((j * Math.PI) / 4)}
                  y1={220 + 13 * Math.sin((j * Math.PI) / 4)}
                  x2={365 + 17 * Math.cos((j * Math.PI) / 4)}
                  y2={220 + 17 * Math.sin((j * Math.PI) / 4)}
                  stroke='#FFA500'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              ))}
            </g>

            {/* ================= MOON HAND & ROTATING PHASE BALL ================= */}
            <g transform={`rotate(${moonDeg - 90} 220 220)`} filter='url(#dropGlow)'>
              <line
                x1='220'
                y1='220'
                x2='345'
                y2='220'
                stroke='url(#moonBeam)'
                strokeWidth='2.8'
                strokeLinecap='round'
              />
              {/* Epicyclic Moon Phase Sphere */}
              <g transform='translate(315, 220)'>
                <circle cx='0' cy='0' r='11' fill='#1e293b' stroke='#CBD5E1' strokeWidth='1.5' />
                {/* Rotating Phase hemisphere representation */}
                <g transform={`rotate(${phaseDeg})`}>
                  <path d='M 0 -11 A 11 11 0 0 1 0 11 Z' fill='#F8FAFC' />
                  <path d='M 0 -11 A 11 11 0 0 0 0 11 Z' fill='#0f172a' />
                </g>
                <circle cx='0' cy='0' r='2' fill='#94A3B8' />
              </g>
              {/* Lunar Pointer Arrow */}
              <polygon points='345,220 335,215 338,220 335,225' fill='#E2E8F0' />
            </g>

            {/* Dragon Hand (Lunar Node / Eclipses Axis) */}
            <g transform={`rotate(${((moonDeg + 180) % 360) - 90} 220 220)`} opacity='0.4'>
              <line x1='220' y1='220' x2='300' y2='220' stroke='#F43F5E' strokeWidth='1.5' strokeDasharray='4 3' />
              <circle cx='290' cy='220' r='4' fill='#F43F5E' />
            </g>
          </svg>
        )}

        {/* TAB 2: LIVING MECHANICAL GEARS (B1, C1, C2, D1, D2, K1/K2 Pin-Slot) */}
        {activeTab === 'gears' && (
          <svg viewBox='0 0 540 440' className='w-full max-w-[500px] h-auto select-none'>
            <defs>
              <radialGradient id='bronzeGearGrad' cx='50%' cy='50%' r='50%'>
                <stop offset='60%' stopColor='#C5A059' />
                <stop offset='85%' stopColor='#8C6F2D' />
                <stop offset='100%' stopColor='#59461A' />
              </radialGradient>
              <radialGradient id='steelGearGrad' cx='50%' cy='50%' r='50%'>
                <stop offset='60%' stopColor='#94A3B8' />
                <stop offset='90%' stopColor='#475569' />
                <stop offset='100%' stopColor='#1E293B' />
              </radialGradient>
              <radialGradient id='goldGearGrad' cx='50%' cy='50%' r='50%'>
                <stop offset='60%' stopColor='#FFD700' />
                <stop offset='85%' stopColor='#B8860B' />
                <stop offset='100%' stopColor='#7B5900' />
              </radialGradient>
            </defs>

            {/* Frame Background Plates */}
            <rect x='30' y='30' width='480' height='380' rx='16' fill='#0B111A' stroke='#2A3B52' strokeWidth='2' />
            <line x1='30' y1='220' x2='510' y2='220' stroke='#1E293B' strokeDasharray='4 4' />

            {/* GEAR D2: Large Metonic Driver (127 Teeth) */}
            <g transform={`translate(390, 220) rotate(${d2Deg})`}>
              <circle cx='0' cy='0' r='105' fill='url(#bronzeGearGrad)' stroke='#DAA520' strokeWidth='2' />
              {/* Spoke cutouts */}
              {Array.from({ length: 6 }).map((_, i) => (
                <circle
                  key={i}
                  cx={65 * Math.cos((i * Math.PI) / 3)}
                  cy={65 * Math.sin((i * Math.PI) / 3)}
                  r='20'
                  fill='#0B111A'
                />
              ))}
              {/* Gear Teeth simulation */}
              {Array.from({ length: 36 }).map((_, i) => (
                <rect
                  key={i}
                  x='-2.5'
                  y='-110'
                  width='5'
                  height='8'
                  fill='#D4AF37'
                  transform={`rotate(${(i * 360) / 36})`}
                />
              ))}
              <circle cx='0' cy='0' r='15' fill='#241B08' stroke='#D4AF37' strokeWidth='2' />
            </g>

            {/* GEAR D1: Step-Down Gear (24 Teeth) */}
            <g transform={`translate(390, 220) rotate(${d1Deg})`}>
              <circle cx='0' cy='0' r='36' fill='url(#goldGearGrad)' stroke='#B8860B' strokeWidth='2' />
              {Array.from({ length: 12 }).map((_, i) => (
                <rect
                  key={i}
                  x='-2'
                  y='-40'
                  width='4'
                  height='6'
                  fill='#FFD700'
                  transform={`rotate(${(i * 360) / 12})`}
                />
              ))}
            </g>

            {/* GEAR C1/C2: Intermediate Planetary Wheel (38T & 48T) */}
            <g transform={`translate(295, 220) rotate(${c1Deg})`}>
              <circle cx='0' cy='0' r='58' fill='url(#steelGearGrad)' stroke='#64748B' strokeWidth='2' opacity='0.9' />
              {/* Cutouts */}
              {Array.from({ length: 4 }).map((_, i) => (
                <circle
                  key={i}
                  cx={34 * Math.cos((i * Math.PI) / 2)}
                  cy={34 * Math.sin((i * Math.PI) / 2)}
                  r='12'
                  fill='#0B111A'
                />
              ))}
              {/* C1 Teeth */}
              {Array.from({ length: 24 }).map((_, i) => (
                <rect
                  key={i}
                  x='-2'
                  y='-62'
                  width='4'
                  height='6'
                  fill='#94A3B8'
                  transform={`rotate(${(i * 360) / 24})`}
                />
              ))}
              <circle cx='0' cy='0' r='12' fill='#0B111A' stroke='#64748B' strokeWidth='2' />
            </g>

            {/* GEAR B1: Master Drive Wheel (64 Teeth) with 4 Cross Spokes */}
            <g transform={`translate(160, 220) rotate(${b1Deg})`}>
              <circle cx='0' cy='0' r='88' fill='url(#goldGearGrad)' stroke='#DAA520' strokeWidth='2.5' />
              {/* 4 Characteristic Cross Spokes of Antikythera Fragment A */}
              {Array.from({ length: 4 }).map((_, i) => (
                <path
                  key={i}
                  d='M -10 -80 L 10 -80 L 16 -24 L -16 -24 Z'
                  fill='#0B111A'
                  transform={`rotate(${i * 90})`}
                />
              ))}
              {/* B1 Outer Teeth */}
              {Array.from({ length: 32 }).map((_, i) => (
                <rect
                  key={i}
                  x='-2.5'
                  y='-93'
                  width='5'
                  height='7'
                  fill='#FFD700'
                  transform={`rotate(${(i * 360) / 32})`}
                />
              ))}
              {/* Center Arbor */}
              <circle cx='0' cy='0' r='20' fill='#2A1F07' stroke='#DAA520' strokeWidth='3' />
              <circle cx='0' cy='0' r='8' fill='#FFD700' />
            </g>

            {/* HIPPARCHUS PIN-AND-SLOT ANOMALY MECHANISM (K1 Driving Pin & K2 Slotted Disc) */}
            <g transform='translate(160, 220)'>
              {/* K1 Driving Pin (rotates around origin) */}
              <g transform={`rotate(${k1Deg})`}>
                <line x1='0' y1='0' x2='42' y2='0' stroke='#E11D48' strokeWidth='2.5' />
                <circle cx='42' cy='0' r='5' fill='#F43F5E' stroke='#FFF' strokeWidth='1.5' />
              </g>

              {/* K2 Slotted Follower (Eccentric center at x=5, y=-4) */}
              <g transform={`translate(5, -4) rotate(${k2Deg})`}>
                <circle cx='0' cy='0' r='52' fill='none' stroke='#38BDF8' strokeWidth='2' strokeDasharray='3 3' />
                {/* Radial slot for pin */}
                <rect x='28' y='-4' width='22' height='8' rx='2' fill='#0B111A' stroke='#38BDF8' strokeWidth='1.5' />
                <circle cx='0' cy='0' r='6' fill='#0284C7' />
              </g>
            </g>

            {/* Labels and Annotations */}
            <text x='160' y='335' fill='#FFD700' fontSize='12' fontWeight='bold' textAnchor='middle'>
              {t.gearB1Label}
            </text>
            <text x='295' y='300' fill='#94A3B8' fontSize='11' textAnchor='middle'>
              {t.gearC1Label}
            </text>
            <text x='390' y='345' fill='#DAA520' fontSize='12' fontWeight='bold' textAnchor='middle'>
              {t.gearD2Label}
            </text>
            <text x='160' y='105' fill='#38BDF8' fontSize='11' fontWeight='bold' textAnchor='middle'>
              {t.pinSlotAnomalyLabel}
            </text>
          </svg>
        )}

        {/* TAB 3: BACK DIALS (Metonic 5-Turn Spiral & Saros 4-Turn Spiral) */}
        {activeTab === 'back' && (
          <Box className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[500px]'>
            {/* Metonic 5-turn Spiral Card */}
            <Box className='flex flex-col items-center p-3 rounded-xl border border-[var(--mui-palette-divider)] bg-[#0c121d]'>
              <Typography variant='caption' className='font-bold uppercase tracking-wider text-primary mb-1'>
                {t.metonicSpiralLabel}
              </Typography>
              <svg viewBox='0 0 200 200' className='w-[160px] h-[160px]'>
                <circle cx='100' cy='100' r='90' fill='#0B111A' stroke='#C5A059' strokeWidth='2' />
                {/* 5 concentric spiral tracks */}
                {[20, 36, 52, 68, 84].map((r, idx) => (
                  <circle
                    key={idx}
                    cx='100'
                    cy='100'
                    r={r}
                    fill='none'
                    stroke='#475569'
                    strokeWidth='1'
                    opacity='0.5'
                  />
                ))}
                {/* Spiral dividing cells */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const rad = (i * Math.PI) / 12

                  return (
                    <line
                      key={i}
                      x1={100 + 20 * Math.cos(rad)}
                      y1={100 + 20 * Math.sin(rad)}
                      x2={100 + 84 * Math.cos(rad)}
                      y2={100 + 84 * Math.sin(rad)}
                      stroke='#334155'
                      strokeWidth='1'
                    />
                  )
                })}
                {/* Metonic Pointer Needle */}
                <g transform={`rotate(${metonicDeg - 90} 100 100)`}>
                  <line x1='100' y1='100' x2='175' y2='100' stroke='#38BDF8' strokeWidth='2.5' strokeLinecap='round' />
                  {/* Sliding Pin Follower */}
                  <circle cx='155' cy='100' r='4' fill='#38BDF8' stroke='#FFF' strokeWidth='1.5' />
                </g>
                <circle cx='100' cy='100' r='8' fill='#C5A059' />
              </svg>
              <Typography variant='caption' className='font-mono font-bold mt-2 text-primary'>
                {gears?.metonic
                  ? t.metonicMonthValue
                      .replace('{month}', String(gears.metonic.month_index))
                      .replace('{year}', String(gears.metonic.current_year))
                  : '213 / 235'}
              </Typography>
              <Typography variant='caption' color='text.disabled' className='text-[10px]'>
                {t.dialAngle.replace('{angle}', metonicDeg.toFixed(1))}
              </Typography>
            </Box>

            {/* Saros 4-turn Eclipse Spiral Card */}
            <Box className='flex flex-col items-center p-3 rounded-xl border border-[var(--mui-palette-divider)] bg-[#0c121d]'>
              <Typography variant='caption' className='font-bold uppercase tracking-wider text-warning mb-1'>
                {t.sarosSpiralLabel}
              </Typography>
              <svg viewBox='0 0 200 200' className='w-[160px] h-[160px]'>
                <circle cx='100' cy='100' r='90' fill='#0B111A' stroke='#B8860B' strokeWidth='2' />
                {/* 4 spiral tracks */}
                {[25, 45, 65, 85].map((r, idx) => (
                  <circle
                    key={idx}
                    cx='100'
                    cy='100'
                    r={r}
                    fill='none'
                    stroke='#475569'
                    strokeWidth='1'
                    opacity='0.5'
                  />
                ))}
                {/* Eclipse Glyphs Σ and H around track */}
                {Array.from({ length: 18 }).map((_, i) => {
                  const rad = (i * Math.PI) / 9

                  return (
                    <line
                      key={i}
                      x1={100 + 25 * Math.cos(rad)}
                      y1={100 + 25 * Math.sin(rad)}
                      x2={100 + 85 * Math.cos(rad)}
                      y2={100 + 85 * Math.sin(rad)}
                      stroke='#334155'
                      strokeWidth='1'
                    />
                  )
                })}
                {/* Saros Pointer Needle */}
                <g transform={`rotate(${sarosDeg - 90} 100 100)`}>
                  <line x1='100' y1='100' x2='175' y2='100' stroke='#F59E0B' strokeWidth='2.5' strokeLinecap='round' />
                  <circle cx='160' cy='100' r='4' fill='#F59E0B' stroke='#FFF' strokeWidth='1.5' />
                </g>
                <circle cx='100' cy='100' r='8' fill='#B8860B' />
              </svg>
              <Typography variant='caption' className='font-mono font-bold mt-2 text-warning'>
                {gears?.saros
                  ? t.sarosStepValue
                      .replace('{month}', String(gears.saros.month_index))
                      .replace('{cycle}', String(gears.saros.saros_cycle_number))
                  : '197 / 223'}
              </Typography>
              <Typography variant='caption' color='text.disabled' className='text-[10px]'>
                {t.exeligmosShift.replace('{hours}', String(gears?.exeligmos?.hour_shift ?? 16))}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Interactive Controls & Scrubbing Toolbar */}
      <Box className='p-3.5 rounded-xl border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-action-hover)] flex flex-col gap-3'>
        <div className='flex items-center justify-between flex-wrap gap-2'>
          <div className='flex items-center gap-2'>
            <Button
              variant='contained'
              size='small'
              color={isPlaying ? 'warning' : 'primary'}
              onClick={() => setIsPlaying(!isPlaying)}
              startIcon={<i className={isPlaying ? 'tabler-player-pause' : 'tabler-player-play'} />}
            >
              {isPlaying ? t.pauseSimulation : t.startClockwork}
            </Button>
            <Button
              variant='outlined'
              size='small'
              color='secondary'
              onClick={handleReset}
              startIcon={<i className='tabler-rotate-clockwise' />}
            >
              {t.resetRealtime}
            </Button>
          </div>

          <div className='flex items-center gap-1.5'>
            <Typography variant='caption' color='text.secondary' className='font-semibold'>
              {t.simulationSpeed}
            </Typography>
            <ButtonGroup size='small' variant='outlined'>
              {[
                { label: t.speed1x, val: 1 },
                { label: t.speed60x, val: 60 },
                { label: t.speedHourPerSecond, val: 3600 },
                { label: t.speedDayPerSecond, val: 86400 }
              ].map(s => (
                <Button
                  key={s.val}
                  variant={simSpeed === s.val ? 'contained' : 'outlined'}
                  onClick={() => setSimSpeed(s.val)}
                  className='px-2 py-0.5 text-xs'
                >
                  {s.label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>

        {/* Time Travel Slider */}
        <div className='px-2'>
          <div className='flex justify-between items-center mb-1'>
            <Typography variant='caption' color='text.secondary'>
              {t.manualScrubbing}
            </Typography>
            <Typography variant='caption' className='font-mono font-bold text-primary'>
              {t.offsetDays.replace('{offset}', `${timeOffsetDays >= 0 ? '+' : ''}${timeOffsetDays.toFixed(1)}`)}
            </Typography>
          </div>
          <Slider
            size='small'
            min={-365}
            max={365 * 4}
            value={timeOffsetDays}
            onChange={(_, val) => {
              setIsPlaying(false)
              setTimeOffsetDays(val as number)
            }}
            valueLabelDisplay='auto'
            valueLabelFormat={v => t.offsetDays.replace('{offset}', `${v >= 0 ? '+' : ''}${v}`)}
          />
        </div>

        {/* Real-time Astronomical HUD Coordinates */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[var(--mui-palette-divider)] text-center'>
          <div className='p-1.5 rounded bg-[var(--mui-palette-background-paper)]'>
            <Typography variant='caption' color='text.disabled' className='block text-[11px]'>
              {t.sunZodiac}
            </Typography>
            <Typography variant='caption' className='font-bold font-mono text-warning'>
              {sunDeg.toFixed(2)}° ({sunSign.symbol} {zodiacNames[sunSign.name]})
            </Typography>
          </div>
          <div className='p-1.5 rounded bg-[var(--mui-palette-background-paper)]'>
            <Typography variant='caption' color='text.disabled' className='block text-[11px]'>
              {t.moonZodiac}
            </Typography>
            <Typography variant='caption' className='font-bold font-mono text-info'>
              {moonDeg.toFixed(2)}° ({moonSign.symbol} {zodiacNames[moonSign.name]})
            </Typography>
          </div>
          <div className='p-1.5 rounded bg-[var(--mui-palette-background-paper)]'>
            <Typography variant='caption' color='text.disabled' className='block text-[11px]'>
              {t.elongationAngle}
            </Typography>
            <Typography variant='caption' className='font-bold font-mono text-primary'>
              {phaseDeg.toFixed(2)}°
            </Typography>
          </div>
          <div className='p-1.5 rounded bg-[var(--mui-palette-background-paper)]'>
            <Typography variant='caption' color='text.disabled' className='block text-[11px]'>
              {t.masterWheelYear}
            </Typography>
            <Typography variant='caption' className='font-bold font-mono text-success'>
              {b1Deg.toFixed(2)}°
            </Typography>
          </div>
        </div>
      </Box>
    </Box>
  )
}
