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
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Alert from '@mui/material/Alert'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  open: boolean
  onClose: () => void
  onSpawn: (data: {
    name: string
    description: string
    runtime: 'microvm'
    imageOrRepo: string
    port: number
    memoryLimitMb: number
    ttlRemaining: string
  }) => void
}

const TEMPLATES = [
  {
    id: 'node22',
    nameKey: 'workloadsTemplateNode',
    descKey: 'workloadsTemplateNodeDescription',
    image: 'temps/sandbox-node22:isolated',
    port: 3000,
    mem: 256,
    icon: 'tabler-brand-nodejs'
  },
  {
    id: 'python312',
    nameKey: 'workloadsTemplatePython',
    descKey: 'workloadsTemplatePythonDescription',
    image: 'temps/sandbox-python312:fastapi',
    port: 8000,
    mem: 512,
    icon: 'tabler-brand-python'
  },
  {
    id: 'rust-musl',
    nameKey: 'workloadsTemplateRust',
    descKey: 'workloadsTemplateRustDescription',
    image: 'temps/sandbox-rust:musl-kernel',
    port: 5050,
    mem: 128,
    icon: 'tabler-brand-rust'
  }
]

export default function SpawnMicroVmDialog({ open, onClose, onSpawn }: Props) {
  const t = useCommonTranslations()
  const [selectedTemplate, setSelectedTemplate] = useState('node22')
  const [ttl, setTtl] = useState('1h')
  const [customName, setCustomName] = useState('')
  const [loading, setLoading] = useState(false)

  const activeTmpl = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0]

  const handleSpawn = () => {
    setLoading(true)
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    const name = customName.trim() || `temps-${activeTmpl.id}-${randomSuffix}`

    setTimeout(() => {
      onSpawn({
        name,
        description: `${t.workloadsTempsEphemeral} (${t[activeTmpl.nameKey as keyof typeof t]})`,
        runtime: 'microvm',
        imageOrRepo: activeTmpl.image,
        port: activeTmpl.port + Math.floor(Math.random() * 50),
        memoryLimitMb: activeTmpl.mem,
        ttlRemaining: `${ttl} remaining`
      })
      setLoading(false)
      onClose()
    }, 450)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between pb-2'>
        <div className='flex items-center gap-2'>
          <i className='tabler-bolt text-warning text-2xl' />
          <div>
            <Typography variant='h6'>{t.workloadsSpawnTitle}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {t.workloadsSpawnSubtitle}
            </Typography>
          </div>
        </div>
        <IconButton size='small' onClick={onClose}>
          <i className='tabler-x' />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers className='flex flex-col gap-5'>
        <Alert severity='info' icon={<i className='tabler-shield-check text-lg' />}>
          {t.workloadsIsolationNotice}
        </Alert>

        <FormControl>
          <FormLabel className='text-sm font-semibold mb-2'>{t.workloadsChooseTemplate}</FormLabel>
          <div className='flex flex-col gap-2'>
            {TEMPLATES.map(tmpl => {
              const isSelected = selectedTemplate === tmpl.id

              return (
                <Card
                  key={tmpl.id}
                  variant='outlined'
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  sx={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    backgroundColor: isSelected ? 'action.hover' : 'background.paper',
                    transition: 'all 0.2s'
                  }}
                >
                  <CardContent className='flex items-center gap-3 p-3'>
                    <i className={`${tmpl.icon} text-2xl text-primary`} />
                    <div className='flex-1'>
                      <Typography variant='subtitle2' className='font-semibold'>
                        {t[tmpl.nameKey as keyof typeof t]}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {t[tmpl.descKey as keyof typeof t]}
                      </Typography>
                    </div>
                    <Typography variant='caption' className='font-mono bg-primary/10 text-primary px-2 py-0.5 rounded'>
                      {tmpl.mem} {t.workloadsMegabytes}
                    </Typography>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </FormControl>

        <div className='flex gap-4'>
          <TextField
            fullWidth
            label={t.workloadsMicroVmNameOptional}
            placeholder={t.workloadsNamePlaceholder.replace('{id}', activeTmpl.id)}
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            size='small'
          />

          <FormControl size='small' sx={{ minWidth: 140 }}>
            <FormLabel className='text-xs font-semibold mb-1'>{t.workloadsTtlAutoDestroy}</FormLabel>
            <RadioGroup row value={ttl} onChange={e => setTtl(e.target.value)}>
              <FormControlLabel value='15m' control={<Radio size='small' />} label={t.workloadsTtl15m} />
              <FormControlLabel value='1h' control={<Radio size='small' />} label={t.workloadsTtl1h} />
              <FormControlLabel value='4h' control={<Radio size='small' />} label={t.workloadsTtl4h} />
            </RadioGroup>
          </FormControl>
        </div>
      </DialogContent>

      <DialogActions className='px-6 py-4'>
        <Button variant='outlined' onClick={onClose} disabled={loading}>
          {t.commonCancel}
        </Button>
        <Button
          variant='contained'
          color='warning'
          startIcon={<i className='tabler-bolt' />}
          onClick={handleSpawn}
          disabled={loading}
        >
          {loading ? t.workloadsBooting : t.workloadsSpawnButton}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
