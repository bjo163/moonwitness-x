'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'

// Custom Components
import CustomChip from '@moonwitness/ui/chip'

import type { OnlineSession } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  sessions: OnlineSession[]
  onDisconnect: (sessionId: string) => void
  onRefresh: () => void
}

export default function OnlineSessionsTab({ sessions, onDisconnect, onRefresh }: Props) {
  const t = useCommonTranslations()
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const handleDisconnect = async (sessionId: string) => {
    setDisconnecting(sessionId)
    await onDisconnect(sessionId)
    setDisconnecting(null)
  }

  return (
    <Card>
      <CardHeader
        title={
          <div className='flex items-center gap-2'>
            <i className='tabler-wifi text-success text-2xl' />
            <div>
              <Typography variant='h6'>{t.radiusActiveOnlineSessions}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {t.radiusSessionDescription}
              </Typography>
            </div>
          </div>
        }
        action={
          <Button size='small' variant='outlined' startIcon={<i className='tabler-refresh' />} onClick={onRefresh}>
            {t.radiusRefreshSessions}
          </Button>
        }
      />
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t.radiusSubscriber}</TableCell>
              <TableCell>{t.radiusClientIpMac}</TableCell>
              <TableCell>{t.radiusNasGateway}</TableCell>
              <TableCell>{t.radiusRateLimitMikrotik}</TableCell>
              <TableCell>{t.radiusTrafficDownUp}</TableCell>
              <TableCell>{t.radiusStartedAt}</TableCell>
              <TableCell align='right'>{t.radiusAction}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-slate-400'>
                  {t.radiusNoActiveSessions}
                </TableCell>
              </TableRow>
            ) : (
              sessions.map(s => {
                const downMb = (s.outputBytes / (1024 * 1024)).toFixed(1)
                const upMb = (s.inputBytes / (1024 * 1024)).toFixed(1)

                return (
                  <TableRow key={s.sessionId} hover>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            boxShadow: '0 0 8px #10b981'
                          }}
                        />
                        <div>
                          <Typography variant='subtitle2' className='font-semibold'>
                            {s.username}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {t.radiusId}: {s.sessionId}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' className='font-mono text-primary font-medium'>
                        {s.framedIp || t.radiusDynamicPool}
                      </Typography>
                      <Typography variant='caption' color='text.secondary' className='font-mono'>
                        {s.macAddr || t.radiusNotAvailable}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' className='font-mono'>
                        {s.nasIp}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {t.radiusPort} #{s.nasPort}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <CustomChip
                        label={s.rateLimit || t.radiusDefaultRateLimit}
                        size='small'
                        color='primary'
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' className='font-medium'>
                        ↓ {downMb} {t.radiusMegabytes}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        ↑ {upMb} {t.radiusMegabytes}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption'>{new Date(s.startTime).toLocaleTimeString()}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title={t.radiusDisconnectTooltip}>
                        <Button
                          size='small'
                          variant='outlined'
                          color='error'
                          startIcon={<i className='tabler-user-x' />}
                          onClick={() => handleDisconnect(s.sessionId)}
                          disabled={disconnecting === s.sessionId}
                        >
                          {disconnecting === s.sessionId ? t.radiusDisconnecting : t.radiusDisconnect}
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}
