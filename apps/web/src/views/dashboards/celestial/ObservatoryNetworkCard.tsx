'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Custom Components
import CustomAvatar from '@moonwitness/ui/avatar'
import CustomChip from '@moonwitness/ui/chip'

import OptionMenu from '@core/components/option-menu'
import type { CelestialDictionary } from '@/utils/getDictionary'

export default function ObservatoryNetworkCard({
  translations: t
}: {
  translations: CelestialDictionary['observatory']
}) {
  const [stationList, setStationList] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/apps/celestial?endpoint=stations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setStationList(data)
        }
      })
      .catch(() => {})
  }, [])

  const defaultStations = [
    {
      code: 'ID-BOS',
      name: 'Observatorium Bosscha',
      city: 'Lembang, Bandung',
      country: 'Indonesia',
      lat: '-6.8252°',
      lon: '107.6169°',
      elev: '1.310 m',
      status: t.online,
      flagIcon: 'tabler-building'
    },
    {
      code: 'ID-PLR',
      name: 'Pos Observasi Bulan Cibeas',
      city: 'Pelabuhan Ratu, Sukabumi',
      country: 'Indonesia',
      lat: '-7.0261°',
      lon: '106.5447°',
      elev: '105 m',
      status: t.online,
      flagIcon: 'tabler-eye'
    },
    {
      code: 'ID-TMU',
      name: 'Observatorium Nasional Timau',
      city: 'Kupang, NTT',
      country: 'Indonesia',
      lat: '-9.5855°',
      lon: '123.9472°',
      elev: '1.300 m',
      status: t.online,
      flagIcon: 'tabler-telescope'
    },
    {
      code: 'SA-MAK',
      name: 'Makkah Clock Royal Tower Astronomy Center',
      city: 'Makkah Al-Mukarramah',
      country: 'Saudi Arabia',
      lat: '+21.4194°',
      lon: '39.8256°',
      elev: '600 m',
      status: t.online,
      flagIcon: 'tabler-clock'
    },
    {
      code: 'UK-RGO',
      name: 'Royal Greenwich Observatory',
      city: 'London',
      country: 'United Kingdom',
      lat: '+51.4769°',
      lon: '0.0005°',
      elev: '48 m',
      status: t.online,
      flagIcon: 'tabler-world-latitude'
    }
  ]

  const stations =
    stationList.length > 0
      ? stationList.map(st => {
          const latPrefix = st.latitude >= 0 ? '+' : ''
          const lonPrefix = st.longitude >= 0 ? '+' : ''
          let flagIcon = 'tabler-building'
          if (st.country?.toLowerCase().includes('indonesia')) {
            flagIcon = st.name?.toLowerCase().includes('timau') ? 'tabler-telescope' : 'tabler-eye'
          } else if (st.country?.toLowerCase().includes('saudi')) {
            flagIcon = 'tabler-clock'
          } else if (st.country?.toLowerCase().includes('kingdom') || st.country?.toLowerCase().includes('uk')) {
            flagIcon = 'tabler-world-latitude'
          }

          return {
            code: st.code,
            name: st.name,
            city: st.city,
            country: st.country,
            lat: `${latPrefix}${st.latitude.toFixed(4)}°`,
            lon: `${lonPrefix}${st.longitude.toFixed(4)}°`,
            elev: `${Math.round(st.elevation).toLocaleString()} m`,
            status: st.isActive ? t.online : 'Offline',
            flagIcon
          }
        })
      : defaultStations

  return (
    <Card className='bs-full'>
      <CardHeader
        title={t.title}
        subheader={t.subtitle}
        action={
          <div className='flex items-center gap-2'>
            <CustomChip
              label={`${stations.length} Stasiun (${t.storageTechnology})`}
              color='success'
              skin='light'
              size='small'
              round='true'
            />
            <OptionMenu options={[t.addStation, t.exportCsv]} />
          </div>
        }
      />
      <CardContent className='p-0'>
        <div className='overflow-x-auto'>
          <table className='is-full border-collapse'>
            <thead>
              <tr className='border-be border-[var(--mui-palette-divider)] text-start'>
                <th className='p-4 text-start text-xs font-semibold text-[var(--mui-palette-text-secondary)] uppercase'>
                  {t.code}
                </th>
                <th className='p-4 text-start text-xs font-semibold text-[var(--mui-palette-text-secondary)] uppercase'>
                  {t.name}
                </th>
                <th className='p-4 text-start text-xs font-semibold text-[var(--mui-palette-text-secondary)] uppercase'>
                  {t.location}
                </th>
                <th className='p-4 text-start text-xs font-semibold text-[var(--mui-palette-text-secondary)] uppercase'>
                  {t.coordinates}
                </th>
                <th className='p-4 text-start text-xs font-semibold text-[var(--mui-palette-text-secondary)] uppercase'>
                  {t.elevation}
                </th>
                <th className='p-4 text-start text-xs font-semibold text-[var(--mui-palette-text-secondary)] uppercase'>
                  {t.status}
                </th>
              </tr>
            </thead>
            <tbody>
              {stations.map(st => (
                <tr
                  key={st.code}
                  className='border-be border-[var(--mui-palette-divider)] last:border-0 hover:bg-[var(--mui-palette-action-hover)]'
                >
                  <td className='p-4'>
                    <span className='font-mono font-bold text-xs text-primary'>{st.code}</span>
                  </td>
                  <td className='p-4'>
                    <div className='flex items-center gap-3'>
                      <CustomAvatar skin='light' color='primary' size={32} variant='rounded'>
                        <i className={`${st.flagIcon} text-[16px]`} />
                      </CustomAvatar>
                      <Typography variant='body2' className='font-semibold' color='text.primary'>
                        {st.name}
                      </Typography>
                    </div>
                  </td>
                  <td className='p-4'>
                    <Typography variant='body2' color='text.secondary'>
                      {st.city}, {st.country}
                    </Typography>
                  </td>
                  <td className='p-4'>
                    <Typography variant='caption' className='font-mono' color='text.primary'>
                      {st.lat}, {st.lon}
                    </Typography>
                  </td>
                  <td className='p-4'>
                    <Typography variant='caption' className='font-mono' color='text.secondary'>
                      {st.elev}
                    </Typography>
                  </td>
                  <td className='p-4'>
                    <CustomChip label={st.status} color='success' skin='light' size='small' round='true' />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
