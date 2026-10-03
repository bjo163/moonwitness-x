'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

// Custom Components
import CustomChip from '@moonwitness/ui/chip'
import CustomAvatar from '@moonwitness/ui/avatar'

import type { Workload } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  workloads: Workload[]
  onToggleStatus: (id: string, currentStatus: string) => void
  onRestart: (id: string) => void
  onDelete: (id: string) => void
  onViewLogs: (workload: Workload) => void
}

export default function WorkloadCards({ workloads, onToggleStatus, onRestart, onDelete, onViewLogs }: Props) {
  const t = useCommonTranslations()

  if (workloads.length === 0) {
    return (
      <Card className='text-center p-8'>
        <i className='tabler-inbox text-5xl text-slate-400 mb-2' />
        <Typography variant='h6'>{t.workloadsEmptyTitle}</Typography>
        <Typography variant='body2' color='text.secondary'>
          {t.workloadsEmptyDescription}
        </Typography>
      </Card>
    )
  }

  return (
    <Grid container spacing={6}>
      {workloads.map(w => {
        const isRunning = w.status === 'running'
        const isStarting = w.status === 'starting'
        const isMicroVm = w.runtime === 'microvm'
        const memPercent = Math.min(100, Math.round((w.memoryUsageMb / w.memoryLimitMb) * 100))

        return (
          <Grid key={w.id} size={{ xs: 12, md: 6, lg: 6 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: isRunning ? '4px solid #10b981' : '4px solid #94a3b8',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <CardHeader
                avatar={
                  <CustomAvatar variant='rounded' skin='light' color={isMicroVm ? 'primary' : 'info'} size={42}>
                    <i className={isMicroVm ? 'tabler-bolt text-xl' : 'tabler-box text-xl'} />
                  </CustomAvatar>
                }
                title={
                  <div className='flex items-center justify-between'>
                    <Typography variant='h6' className='font-semibold'>
                      {w.name}
                    </Typography>
                    <CustomChip
                      label={
                        t[
                          w.status === 'running'
                            ? 'workloadsStatusRunning'
                            : w.status === 'starting'
                              ? 'workloadsStatusStarting'
                              : 'workloadsStatusStopped'
                        ]
                      }
                      size='small'
                      color={isRunning ? 'success' : isStarting ? 'warning' : 'secondary'}
                      variant='tonal'
                    />
                  </div>
                }
                subheader={
                  <Typography variant='caption' color='text.secondary' className='truncate block'>
                    {w.description}
                  </Typography>
                }
                action={
                  <div className='flex gap-1'>
                    {isMicroVm && (
                      <CustomChip label={t.workloadsRuntimeMicroVm} size='small' color='primary' variant='outlined' />
                    )}
                    {!isMicroVm && (
                      <CustomChip label={t.workloadsRuntimeDocker} size='small' color='info' variant='outlined' />
                    )}
                  </div>
                }
              />

              <CardContent className='flex-1 flex flex-col gap-3 pt-0'>
                {/* Image & Cold start info */}
                <div className='flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-500/10 p-2 rounded'>
                  <span className='truncate mr-2'>
                    <i className='tabler-brand-docker mr-1 inline' />
                    {w.imageOrRepo}
                  </span>
                  {w.coldStartTimeMs && (
                    <span className='text-amber-500 font-semibold whitespace-nowrap'>
                      ⚡ {w.coldStartTimeMs} {t.workloadsMilliseconds} {t.workloadsColdBoot}
                    </span>
                  )}
                  {w.ttlRemaining && (
                    <span className='text-orange-400 font-semibold whitespace-nowrap'>⏱️ {w.ttlRemaining}</span>
                  )}
                </div>

                {/* Resource Metrics */}
                <div className='flex flex-col gap-2'>
                  <div>
                    <div className='flex justify-between text-xs mb-1'>
                      <span>
                        {t.workloadsRam}: {w.memoryUsageMb} {t.workloadsMegabytes} / {w.memoryLimitMb}{' '}
                        {t.workloadsMegabytes}
                      </span>
                      <span>{memPercent}%</span>
                    </div>
                    <LinearProgress
                      variant='determinate'
                      value={memPercent}
                      color={memPercent > 80 ? 'error' : memPercent > 50 ? 'warning' : 'primary'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </div>

                  <div className='flex justify-between items-center text-xs text-slate-400 pt-1'>
                    <span>
                      {t.workloadsCpu}: ~{w.cpuUsage}%
                    </span>
                    <span>
                      {t.workloadsUptime}: {w.uptime}
                    </span>
                    {w.port && (
                      <span className='font-mono font-medium text-primary'>
                        {t.workloadsPort}: :{w.port}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardActions className='justify-between border-t px-4 py-2 bg-slate-500/5'>
                <div className='flex items-center gap-1'>
                  {w.endpoint && isRunning && (
                    <Tooltip title={`${t.workloadsOpenEndpoint} ${w.endpoint}`}>
                      <IconButton size='small' component='a' href={w.endpoint} target='_blank' color='primary'>
                        <i className='tabler-external-link text-lg' />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={t.workloadsViewLogs}>
                    <IconButton size='small' onClick={() => onViewLogs(w)}>
                      <i className='tabler-terminal text-lg' />
                    </IconButton>
                  </Tooltip>
                </div>

                <div className='flex items-center gap-1'>
                  <Tooltip title={isRunning ? t.workloadsStop : t.workloadsStart}>
                    <IconButton
                      size='small'
                      color={isRunning ? 'error' : 'success'}
                      onClick={() => onToggleStatus(w.id, w.status)}
                    >
                      <i className={isRunning ? 'tabler-player-stop text-lg' : 'tabler-player-play text-lg'} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t.workloadsRestart}>
                    <IconButton size='small' onClick={() => onRestart(w.id)} disabled={!isRunning}>
                      <i className='tabler-refresh text-lg' />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t.workloadsDelete}>
                    <IconButton size='small' color='error' onClick={() => onDelete(w.id)}>
                      <i className='tabler-trash text-lg' />
                    </IconButton>
                  </Tooltip>
                </div>
              </CardActions>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}
