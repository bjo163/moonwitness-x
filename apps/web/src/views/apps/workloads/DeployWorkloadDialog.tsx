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
import Grid from '@mui/material/Grid'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

interface Props {
  open: boolean
  onClose: () => void
  onDeploy: (data: any) => void
}

export default function DeployWorkloadDialog({ open, onClose, onDeploy }: Props) {
  const t = useCommonTranslations()
  const [deployType, setDeployType] = useState<'image' | 'git' | 'dockerfile' | 'compose'>('image')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const runtime: 'docker' | 'microvm' = 'docker'

  // Mode specific fields
  const [image, setImage] = useState('redis:7-alpine')
  const [gitUrl, setGitUrl] = useState('')
  const [gitBranch, setGitBranch] = useState('main')

  const [dockerfileContent, setDockerfileContent] = useState(
    'FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install --omit=dev\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]'
  )

  const [composeContent, setComposeContent] = useState(
    'services:\n  web:\n    image: nginx:alpine\n    ports:\n      - "8080:80"\n  cache:\n    image: redis:alpine'
  )

  const [port, setPort] = useState('8080')
  const [memoryLimitMb, setMemoryLimitMb] = useState('256')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)

    const payload = {
      type: deployType,
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: description.trim() || `Deployed via ${deployType.toUpperCase()}`,
      runtime,
      image: deployType === 'image' ? image : '',
      gitUrl: deployType === 'git' ? gitUrl : '',
      gitBranch: deployType === 'git' ? gitBranch : 'main',
      dockerfileContent: deployType === 'dockerfile' ? dockerfileContent : '',
      composeContent: deployType === 'compose' ? composeContent : '',
      port: port ? Number(port) : 8080,
      memoryLimitMb: memoryLimitMb ? Number(memoryLimitMb) : 256
    }

    onDeploy(payload)
    setTimeout(() => {
      setLoading(false)
      onClose()
      setName('')
      setDescription('')
    }, 600)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle className='flex items-center justify-between pb-2'>
          <div className='flex items-center gap-2'>
            <i className='tabler-rocket text-primary text-2xl' />
            <div>
              <Typography variant='h6'>{t.workloadsDeployTitle}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {t.workloadsDeploySubtitle}
              </Typography>
            </div>
          </div>
          <IconButton size='small' onClick={onClose}>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers className='flex flex-col gap-4'>
          {/* Source Type Selector Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={deployType}
              onChange={(_, val) => setDeployType(val)}
              variant='scrollable'
              scrollButtons='auto'
            >
              <Tab
                value='image'
                label={t.workloadsSourceImage}
                icon={<i className='tabler-brand-docker mr-1 text-lg' />}
                iconPosition='start'
              />
              <Tab
                value='git'
                label={t.workloadsSourceGit}
                icon={<i className='tabler-brand-github mr-1 text-lg' />}
                iconPosition='start'
              />
              <Tab
                value='dockerfile'
                label={t.workloadsSourceDockerfile}
                icon={<i className='tabler-file-code mr-1 text-lg' />}
                iconPosition='start'
              />
              <Tab
                value='compose'
                label={t.workloadsSourceCompose}
                icon={<i className='tabler-stack-2 mr-1 text-lg' />}
                iconPosition='start'
              />
            </Tabs>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label={t.workloadsName}
                placeholder={t.workloadsNamePlaceholder}
                value={name}
                onChange={e => setName(e.target.value)}
                size='small'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t.workloadsDescription}
                placeholder={t.workloadsDescriptionPlaceholder}
                value={description}
                onChange={e => setDescription(e.target.value)}
                size='small'
              />
            </Grid>
          </Grid>

          {/* Form fields based on deployType */}
          {deployType === 'image' && (
            <TextField
              fullWidth
              required
              label={t.workloadsImageTag}
              placeholder={t.workloadsImagePlaceholder}
              value={image}
              onChange={e => setImage(e.target.value)}
              size='small'
              helperText={t.workloadsImagePullHelp}
            />
          )}

          {deployType === 'git' && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  required
                  label={t.workloadsGitUrl}
                  placeholder={t.workloadsGitUrlPlaceholder}
                  value={gitUrl}
                  onChange={e => setGitUrl(e.target.value)}
                  size='small'
                  helperText={t.workloadsGitUrlHelp}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t.workloadsBranch}
                  placeholder={t.workloadsBranchPlaceholder}
                  value={gitBranch}
                  onChange={e => setGitBranch(e.target.value)}
                  size='small'
                />
              </Grid>
            </Grid>
          )}

          {deployType === 'dockerfile' && (
            <TextField
              fullWidth
              multiline
              rows={6}
              label={t.workloadsDockerfileContent}
              value={dockerfileContent}
              onChange={e => setDockerfileContent(e.target.value)}
              size='small'
              sx={{ fontFamily: 'monospace' }}
              helperText={t.workloadsDockerfileHelp}
            />
          )}

          {deployType === 'compose' && (
            <TextField
              fullWidth
              multiline
              rows={6}
              label={t.workloadsComposeContent}
              value={composeContent}
              onChange={e => setComposeContent(e.target.value)}
              size='small'
              sx={{ fontFamily: 'monospace' }}
              helperText={t.workloadsComposeHelp}
            />
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label={t.workloadsPublicPort}
                placeholder='8080'
                type='number'
                value={port}
                onChange={e => setPort(e.target.value)}
                size='small'
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label={t.workloadsMemoryLimit}
                placeholder='256'
                type='number'
                value={memoryLimitMb}
                onChange={e => setMemoryLimitMb(e.target.value)}
                size='small'
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions className='px-6 py-4'>
          <Button variant='outlined' onClick={onClose} disabled={loading}>
            {t.commonCancel}
          </Button>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            startIcon={<i className='tabler-rocket' />}
            disabled={loading}
          >
            {loading ? t.workloadsSubmitting : t.workloadsDeployButton}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
