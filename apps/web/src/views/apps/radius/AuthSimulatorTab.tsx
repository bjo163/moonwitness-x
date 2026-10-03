'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@moonwitness/ui/text-field'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const accessAcceptAttributes = (result: any, secondsLabel: string) => [
  `+ Attribute 1  (User-Name)           : "${result.username}"`,
  `+ Attribute 8  (Framed-IP-Address)   : ${result.assigned_framed_ip}`,
  `+ Attribute 27 (Session-Timeout)     : ${result.session_timeout_sec} ${secondsLabel} (24h)`,
  '+ Vendor-Specific 26 (Vendor: 14988 MikroTik, Type: 8 Rate-Limit):',
  `> MikroTik-Rate-Limit = "${result.rate_limit_applied}"`
]

export default function AuthSimulatorTab() {
  const t = useCommonTranslations()
  const [username, setUsername] = useState('budi-pppoe')
  const [password, setPassword] = useState('password123')
  const [nasIp, setNasIp] = useState('127.0.0.1')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/apps/radius?endpoint=test-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nasIp })
      })

      const data = await res.json()

      setResult(data)
    } catch (err: any) {
      setResult({ result: 'Access-Reject', error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const isAccept = result?.result === 'Access-Accept'

  return (
    <Card>
      <CardHeader
        title={
          <div className='flex items-center gap-2'>
            <i className='tabler-shield-check text-success text-2xl' />
            <div>
              <Typography variant='h6'>{t.radiusAuthSimulator}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {t.radiusAuthSimulatorDescription}
              </Typography>
            </div>
          </div>
        }
      />
      <CardContent>
        <form onSubmit={handleTest} className='mb-6'>
          <Grid container spacing={4} alignItems='center'>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label={t.radiusUsername}
                value={username}
                onChange={e => setUsername(e.target.value)}
                size='small'
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label={t.radiusPassword}
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                size='small'
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField
                fullWidth
                label={t.radiusNasIp}
                value={nasIp}
                onChange={e => setNasIp(e.target.value)}
                size='small'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <Button
                type='submit'
                variant='contained'
                color='primary'
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <i className='tabler-key' />}
              >
                {loading ? t.radiusTesting : t.radiusTestAuth}
              </Button>
            </Grid>
          </Grid>
        </form>

        {result && (
          <Box className='flex flex-col gap-4'>
            <Alert severity={isAccept ? 'success' : 'error'}>
              <Typography variant='subtitle2' className='font-bold'>
                {result.result} ({t.radiusCode}: {result.code || (isAccept ? 2 : 3)})
              </Typography>
              <Typography variant='caption'>
                {isAccept
                  ? t.radiusAuthSuccess
                      .replace('{username}', result.username)
                      .replace('{profile}', result.assigned_profile)
                  : `${t.radiusAuthFailed}: ${result.error}`}
              </Typography>
            </Alert>

            {isAccept && (
              <Box
                sx={{
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  p: 3,
                  borderRadius: 1,
                  lineHeight: 1.8
                }}
              >
                <div className='text-amber-400 font-bold mb-2'>{t.radiusPacketAttributes}</div>
                {accessAcceptAttributes(result, t.radiusSeconds).map((attribute, index) => (
                  <div className={index > 2 ? 'text-emerald-400 font-bold mt-2' : ''} key={index}>
                    {attribute}
                  </div>
                ))}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
