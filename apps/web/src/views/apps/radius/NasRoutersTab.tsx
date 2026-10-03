'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

// Custom Components
import CustomChip from '@moonwitness/ui/chip'

import type { NasRouter } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const mikrotikSetupCommands = `/radius add service=hotspot,ppp address=127.0.0.1 secret="testing123" authentication-port=1812 accounting-port=1813 comment="Moonwitness ToughRADIUS"\n/radius incoming set accept=yes port=3799`

interface Props {
  nasList: NasRouter[]
}

export default function NasRoutersTab({ nasList }: Props) {
  const t = useCommonTranslations()

  return (
    <div className='flex flex-col gap-6'>
      <Card>
        <CardHeader
          title={
            <div className='flex items-center gap-2'>
              <i className='tabler-router text-info text-2xl' />
              <div>
                <Typography variant='h6'>{t.radiusRegisteredNas}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {t.radiusNasDescription}
                </Typography>
              </div>
            </div>
          }
        />
        <CardContent>
          <Grid container spacing={6}>
            {nasList.map(nas => (
              <Grid key={nas.id} size={{ xs: 12, md: 6 }}>
                <Card variant='outlined' className='p-4'>
                  <div className='flex justify-between items-start mb-2'>
                    <div>
                      <Typography variant='subtitle1' className='font-bold'>
                        {nas.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {nas.description}
                      </Typography>
                    </div>
                    <CustomChip label={nas.vendor} size='small' color='info' variant='tonal' />
                  </div>

                  <Box className='bg-slate-500/10 p-3 rounded text-xs flex flex-col gap-1 mt-3'>
                    <div className='flex justify-between'>
                      <span className='text-slate-400'>{t.radiusNasIpAddress}:</span>
                      <span className='font-mono font-bold text-primary'>{nas.ipAddr}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-slate-400'>{t.radiusSharedSecret}:</span>
                      <span className='font-mono font-semibold'>{nas.secret}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-slate-400'>{t.radiusCoaPodPort}:</span>
                      <span className='font-mono'>
                        {nas.coaPort || 3799} ({t.radiusRfc} 3576)
                      </span>
                    </div>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* MikroTik Setup Guide Helper */}
      <Alert severity='info' icon={<i className='tabler-brand-powershell text-xl' />}>
        <Typography variant='subtitle2' className='font-bold mb-1'>
          {t.radiusMikrotikSetupTitle}
        </Typography>
        <Typography variant='caption' className='block mb-2 text-slate-300'>
          {t.radiusMikrotikSetupDescription}
        </Typography>
        <Box
          sx={{
            backgroundColor: '#0f172a',
            color: '#38bdf8',
            fontFamily: 'monospace',
            fontSize: '12px',
            p: 2,
            borderRadius: 1
          }}
        >
          <code>{mikrotikSetupCommands}</code>
        </Box>
      </Alert>
    </div>
  )
}
