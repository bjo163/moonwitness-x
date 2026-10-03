// React Imports
import type { ReactElement } from 'react'

// MUI Imports
import { useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'

import type { Locale } from '@configs/i18n'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

type RecentDeviceDataType = {
  browserIcon: ReactElement
  browserNameKey: 'chromeWindows' | 'chromeAndroid' | 'chromeIphone' | 'chromeMacos'
  device: string
  location: string
  date: string
}

// Vars
const recentDeviceData: RecentDeviceDataType[] = [
  {
    location: 'Switzerland',
    device: 'HP Spectre 360',
    date: '2020-09-10T20:07:00Z',
    browserNameKey: 'chromeWindows',
    browserIcon: <i className='tabler-brand-windows text-[22px] text-info' />
  },
  {
    location: 'Los Angeles, CA',
    device: 'Google Pixel 3a',
    date: '2022-04-20T10:20:00Z',
    browserNameKey: 'chromeAndroid',
    browserIcon: <i className='tabler-brand-android text-[22px] text-success' />
  },
  {
    location: 'San Francisco, CA',
    device: 'iPhone 12x',
    date: '2022-04-16T04:20:00Z',
    browserNameKey: 'chromeIphone',
    browserIcon: <i className='tabler-device-mobile text-[22px] text-error' />
  },
  {
    location: 'India',
    device: 'Apple iMac',
    date: '2022-04-28T18:20:00Z',
    browserNameKey: 'chromeMacos',
    browserIcon: <i className='tabler-brand-apple text-[22px] text-secondary' />
  },
  {
    location: 'Switzerland',
    device: 'Macbook Pro',
    date: '2022-04-20T10:20:00Z',
    browserNameKey: 'chromeWindows',
    browserIcon: <i className='tabler-brand-apple text-[22px] text-warning' />
  },
  {
    location: 'Dubai',
    device: 'Oneplus 9 Pro',
    date: '2022-04-16T04:20:00Z',
    browserNameKey: 'chromeAndroid',
    browserIcon: <i className='tabler-brand-android text-[22px] text-success' />
  }
]

const RecentDevicesTable = () => {
  const t = useCommonTranslations()
  const { lang } = useParams()
  const locale = (lang as Locale) || 'en'

  return (
    <Card>
      <CardHeader title={t.recentDevices} />
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>{t.recentDeviceBrowser}</th>
              <th>{t.device}</th>
              <th>{t.location}</th>
              <th>{t.recentActivities}</th>
            </tr>
          </thead>
          <tbody>
            {recentDeviceData.map((device, index) => (
              <tr key={index}>
                <td>
                  <div className='flex items-center gap-2.5'>
                    {device.browserIcon}
                    <Typography className='font-medium' color='text.primary'>
                      {t[device.browserNameKey]}
                    </Typography>
                  </div>
                </td>
                <td>
                  <Typography>{device.device}</Typography>
                </td>
                <td>
                  <Typography>{device.location}</Typography>
                </td>
                <td>
                  <Typography>
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                      new Date(device.date)
                    )}
                  </Typography>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default RecentDevicesTable
