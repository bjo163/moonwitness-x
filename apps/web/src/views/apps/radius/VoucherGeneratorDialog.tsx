'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@moonwitness/ui/text-field'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'

// Custom Components
import type { RateProfile } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  open: boolean
  profiles: RateProfile[]
  onClose: () => void
  onGenerate: (data: { count: number; prefix: string; profileId: string }) => Promise<any>
}

export default function VoucherGeneratorDialog({ open, profiles, onClose, onGenerate }: Props) {
  const t = useCommonTranslations()
  const [count, setCount] = useState('5')
  const [prefix, setPrefix] = useState('WIFI-')
  const [profileId, setProfileId] = useState('prof-voucher-24h')
  const [loading, setLoading] = useState(false)
  const [createdVouchers, setCreatedVouchers] = useState<any[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await onGenerate({
        count: Number(count) || 5,
        prefix: prefix.trim() || 'WIFI-',
        profileId
      })

      if (res && res.vouchers) {
        setCreatedVouchers(res.vouchers)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCreatedVouchers([])
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle className='flex items-center justify-between pb-2'>
          <div className='flex items-center gap-2'>
            <i className='tabler-ticket text-warning text-2xl' />
            <div>
              <Typography variant='h6'>{t.radiusVoucherGenerator}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {t.radiusVoucherDescription}
              </Typography>
            </div>
          </div>
          <IconButton size='small' onClick={handleClose}>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers className='flex flex-col gap-4'>
          {createdVouchers.length > 0 ? (
            <div>
              <Typography variant='subtitle2' className='font-bold text-success mb-2'>
                ✅ {t.radiusVoucherGenerated.replace('{count}', String(createdVouchers.length))}:
              </Typography>
              <Box
                sx={{
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  p: 2,
                  borderRadius: 1,
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                {createdVouchers.map((v, i) => (
                  <div key={i} className='flex justify-between py-1 border-b border-slate-700/50'>
                    <span>
                      {t.radiusUsername}: <strong>{v.username}</strong>
                    </span>
                    <span>
                      {t.radiusPassword}: <strong>{v.password}</strong>
                    </span>
                  </div>
                ))}
              </Box>
            </div>
          ) : (
            <Grid container spacing={3}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label={t.radiusNumberVouchers}
                  type='number'
                  value={count}
                  onChange={e => setCount(e.target.value)}
                  size='small'
                  required
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label={t.radiusUsernamePrefix}
                  value={prefix}
                  onChange={e => setPrefix(e.target.value)}
                  size='small'
                  placeholder={t.radiusVoucherPrefixPlaceholder}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>{t.radiusRateProfile}</InputLabel>
                  <Select value={profileId} label={t.radiusRateProfile} onChange={e => setProfileId(e.target.value)}>
                    {profiles.map(p => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} ({p.rateLimit})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions className='px-6 py-4'>
          <Button variant='outlined' onClick={handleClose}>
            {createdVouchers.length > 0 ? t.commonDone : t.commonCancel}
          </Button>
          {createdVouchers.length === 0 && (
            <Button
              type='submit'
              variant='contained'
              color='primary'
              startIcon={<i className='tabler-ticket' />}
              disabled={loading}
            >
              {loading ? t.radiusGenerating : t.radiusGenerateBatch}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  )
}
