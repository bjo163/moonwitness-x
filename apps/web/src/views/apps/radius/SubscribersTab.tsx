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
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'

// Custom Components
import CustomChip from '@moonwitness/ui/chip'

import type { Subscriber, RateProfile } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  subscribers: Subscriber[]
  profiles: RateProfile[]
  onOpenVoucherDialog: () => void
  onDeleteSubscriber: (username: string) => void
  onRefresh: () => void
}

export default function SubscribersTab({
  subscribers,
  profiles,
  onOpenVoucherDialog,
  onDeleteSubscriber,
  onRefresh
}: Props) {
  const t = useCommonTranslations()
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})

  const togglePassword = (username: string) => {
    setShowPasswords(prev => ({ ...prev, [username]: !prev[username] }))
  }

  const getProfileName = (id: string) => {
    const p = profiles.find(prof => prof.id === id)

    return p ? p.name : id
  }

  return (
    <Card>
      <CardHeader
        title={
          <div className='flex items-center gap-2'>
            <i className='tabler-users text-primary text-2xl' />
            <div>
              <Typography variant='h6'>{t.radiusSubscribersAccounts}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {t.radiusSubscribersDescription}
              </Typography>
            </div>
          </div>
        }
        action={
          <div className='flex items-center gap-2'>
            <Button size='small' variant='outlined' startIcon={<i className='tabler-refresh' />} onClick={onRefresh}>
              {t.commonRefresh}
            </Button>
            <Button
              size='small'
              variant='contained'
              color='primary'
              startIcon={<i className='tabler-ticket' />}
              onClick={onOpenVoucherDialog}
            >
              {t.radiusGenerateVouchers}
            </Button>
          </div>
        }
      />
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t.radiusUsername}</TableCell>
              <TableCell>{t.radiusPassword}</TableCell>
              <TableCell>{t.radiusRateProfile}</TableCell>
              <TableCell>{t.radiusStatus}</TableCell>
              <TableCell>{t.radiusQuotaUsage}</TableCell>
              <TableCell>{t.radiusExpiresAt}</TableCell>
              <TableCell align='right'>{t.radiusActions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-slate-400'>
                  {t.radiusNoSubscribers}
                </TableCell>
              </TableRow>
            ) : (
              subscribers.map(sub => {
                const isPassVisible = showPasswords[sub.username]
                const quotaPercent = sub.quotaMb > 0 ? Math.min(100, Math.round((sub.usedMb / sub.quotaMb) * 100)) : 0

                return (
                  <TableRow key={sub.username} hover>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <i
                          className={
                            sub.username.startsWith('WIFI-') ? 'tabler-ticket text-warning' : 'tabler-user text-primary'
                          }
                        />
                        <Typography variant='subtitle2' className='font-semibold'>
                          {sub.username}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1 font-mono text-xs'>
                        <span>{isPassVisible ? sub.password : '••••••••'}</span>
                        <IconButton size='small' onClick={() => togglePassword(sub.username)}>
                          <i className={isPassVisible ? 'tabler-eye-off text-xs' : 'tabler-eye text-xs'} />
                        </IconButton>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CustomChip label={getProfileName(sub.profileId)} size='small' color='info' variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <CustomChip
                        label={
                          sub.status === 'active'
                            ? t.radiusStatusActive
                            : sub.status === 'disabled'
                              ? t.radiusStatusDisabled
                              : t.radiusStatusExpired
                        }
                        size='small'
                        color={sub.status === 'active' ? 'success' : 'error'}
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      {sub.quotaMb > 0 ? (
                        <div>
                          <div className='flex justify-between text-xs mb-1'>
                            <span>
                              {sub.usedMb} {t.radiusMegabytes} / {sub.quotaMb} {t.radiusMegabytes}
                            </span>
                            <span>{quotaPercent}%</span>
                          </div>
                          <LinearProgress
                            variant='determinate'
                            value={quotaPercent}
                            color={quotaPercent > 85 ? 'error' : quotaPercent > 60 ? 'warning' : 'primary'}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </div>
                      ) : (
                        <Typography variant='caption' color='text.secondary'>
                          {t.radiusUnlimited} ({sub.usedMb} {t.radiusMegabytes} {t.radiusUsed})
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption'>{new Date(sub.expireAt).toLocaleDateString()}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title={t.radiusDeleteSubscriber}>
                        <IconButton size='small' color='error' onClick={() => onDeleteSubscriber(sub.username)}>
                          <i className='tabler-trash text-lg' />
                        </IconButton>
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
