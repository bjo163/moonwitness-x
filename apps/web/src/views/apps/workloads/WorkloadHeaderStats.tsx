'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

// Custom Components
import CustomAvatar from '@moonwitness/ui/avatar'

import type { WorkloadClusterStats } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  stats: WorkloadClusterStats
}

export default function WorkloadHeaderStats({ stats }: Props) {
  const t = useCommonTranslations()

  const statItems = [
    {
      title: t.workloadsActive,
      value: `${stats.runningWorkloads} / ${stats.totalWorkloads}`,
      subtitle: t.workloadsRunningHealthy.replace('{count}', String(stats.runningWorkloads)),
      avatarIcon: 'tabler-server-2',
      avatarColor: 'success' as const
    },
    {
      title: t.workloadsMicroVmFirecracker,
      value: `${stats.microVmCount} ${t.workloadsInstances}`,
      subtitle: t.workloadsIsolatedKvm,
      avatarIcon: 'tabler-bolt',
      avatarColor: 'primary' as const
    },
    {
      title: t.workloadsDockerContainers,
      value: `${stats.dockerCount} ${t.workloadsServices}`,
      subtitle: t.workloadsOciNamespaces,
      avatarIcon: 'tabler-box',
      avatarColor: 'info' as const
    },
    {
      title: t.workloadsColdStartLatency,
      value: `${stats.avgColdStartMs} ms`,
      subtitle: t.workloadsBootBenchmark,
      avatarIcon: 'tabler-gauge',
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
