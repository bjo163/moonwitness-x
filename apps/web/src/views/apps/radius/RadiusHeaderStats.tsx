'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

// Custom Components
import CustomAvatar from '@moonwitness/ui/avatar'

import type { RadiusOverview } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  stats: RadiusOverview
}

export default function RadiusHeaderStats({ stats }: Props) {
  const t = useCommonTranslations()

  const statItems = [
    {
      title: t.radiusOnlineSessions,
      value: `${stats.activeSessions} ${t.radiusUsers}`,
      subtitle: t.radiusLiveConnections.replace('{count}', String(stats.activeSessions)),
      avatarIcon: 'tabler-wifi',
      avatarColor: 'success' as const
    },
    {
      title: t.radiusTotalSubscribers,
      value: `${stats.totalSubscribers} ${t.radiusAccounts}`,
      subtitle: t.radiusBandwidthProfiles.replace('{count}', String(stats.totalProfiles)),
      avatarIcon: 'tabler-users',
      avatarColor: 'primary' as const
    },
    {
      title: t.radiusActiveRouters,
      value: `${stats.totalNas} ${t.radiusDevices}`,
      subtitle: t.radiusRouterGateways,
      avatarIcon: 'tabler-router',
      avatarColor: 'info' as const
    },
    {
      title: t.radiusTrafficHandled,
      value: `${stats.totalDownloadMb + stats.totalUploadMb} ${t.radiusMegabytes}`,
      subtitle: `↓${stats.totalDownloadMb} ${t.radiusMegabytes}  ↑${stats.totalUploadMb} ${t.radiusMegabytes}`,
      avatarIcon: 'tabler-arrows-up-down',
      avatarColor: 'warning' as const
    }
  ]

  return (
    <Grid container spacing={6}>
      {statItems.map((item, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent className='flex items-center gap-4'>
              <CustomAvatar variant='rounded' skin='light' color={item.avatarColor} size={48}>
                <i className={`${item.avatarIcon} text-[26px]`} />
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography variant='h5' className='font-semibold'>
                  {item.value}
                </Typography>
                <Typography variant='body2' color='text.primary' className='font-medium'>
                  {item.title}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {item.subtitle}
                </Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
