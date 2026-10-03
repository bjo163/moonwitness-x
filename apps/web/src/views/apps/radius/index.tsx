'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// Custom Components
import CustomChip from '@moonwitness/ui/chip'

import RadiusHeaderStats from './RadiusHeaderStats'
import OnlineSessionsTab from './OnlineSessionsTab'
import SubscribersTab from './SubscribersTab'
import RateProfilesTab from './RateProfilesTab'
import NasRoutersTab from './NasRoutersTab'
import AuthSimulatorTab from './AuthSimulatorTab'
import VoucherGeneratorDialog from './VoucherGeneratorDialog'
import type { RadiusOverview, OnlineSession, Subscriber, RateProfile, NasRouter } from './types'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

export default function RadiusDashboard() {
  const t = useCommonTranslations()
  const [activeTab, setActiveTab] = useState<'sessions' | 'subscribers' | 'profiles' | 'nas' | 'test'>('sessions')

  const [overview, setOverview] = useState<RadiusOverview>({
    activeSessions: 0,
    totalSubscribers: 0,
    totalNas: 0,
    totalProfiles: 0,
    totalUploadMb: 0,
    totalDownloadMb: 0,
    authRequestsTotal: 0,
    authAcceptsTotal: 0,
    authRejectsTotal: 0,
    acctRequestsTotal: 0,
    serverUptime: '0s',
    engine: ''
  })

  const [sessions, setSessions] = useState<OnlineSession[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [profiles, setProfiles] = useState<RateProfile[]>([])
  const [nasList, setNasList] = useState<NasRouter[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [voucherOpen, setVoucherOpen] = useState(false)

  const fetchAllData = async () => {
    try {
      const [ovRes, sessRes, subsRes, profsRes, nasRes] = await Promise.all([
        fetch('/api/apps/radius?endpoint=overview'),
        fetch('/api/apps/radius?endpoint=sessions'),
        fetch('/api/apps/radius?endpoint=subscribers'),
        fetch('/api/apps/radius?endpoint=profiles'),
        fetch('/api/apps/radius?endpoint=nas')
      ])

      if (ovRes.ok) setOverview(await ovRes.json())

      if (sessRes.ok) {
        const d = await sessRes.json()

        setSessions(d.sessions || [])
      }

      if (subsRes.ok) {
        const d = await subsRes.json()

        setSubscribers(d.subscribers || [])
      }

      if (profsRes.ok) {
        const d = await profsRes.json()

        setProfiles(d.profiles || [])
      }

      if (nasRes.ok) {
        const d = await nasRes.json()

        setNasList(d.nasList || [])
      }
    } catch (err) {
      console.error('Failed to fetch radius data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 8000)

    return () => clearInterval(interval)
  }, [])

  const handleDisconnect = async (sessionId: string) => {
    try {
      await fetch('/api/apps/radius?endpoint=sessions/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      fetchAllData()
    } catch (err) {
      console.error('Disconnect error:', err)
    }
  }

  const handleDeleteSubscriber = async (username: string) => {
    try {
      await fetch(`/api/apps/radius?endpoint=subscribers&username=${encodeURIComponent(username)}`, {
        method: 'DELETE'
      })
      fetchAllData()
    } catch (err) {
      console.error('Delete subscriber error:', err)
    }
  }

  const handleGenerateVouchers = async (data: any) => {
    const res = await fetch('/api/apps/radius?endpoint=vouchers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const json = await res.json()

    fetchAllData()

    return json
  }

  return (
    <Grid container spacing={6}>
      {/* Header bar */}
      <Grid size={{ xs: 12 }}>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2'>
              <Typography variant='h4' className='font-bold flex items-center gap-2'>
                <i className='tabler-broadcast text-primary text-3xl' />
                {t.radiusTitle}
              </Typography>
              <CustomChip
                label={t.radiusEngine}
                size='small'
                color='primary'
                variant='tonal'
                className='font-semibold'
              />
            </div>
            <Typography variant='body2' color='text.secondary'>
              {t.radiusSubtitle}
            </Typography>
          </div>

          <div className='flex items-center gap-3'>
            <Button variant='outlined' startIcon={<i className='tabler-refresh' />} onClick={fetchAllData} size='small'>
              {t.commonRefresh}
            </Button>
            <Button
              variant='contained'
              color='primary'
              startIcon={<i className='tabler-ticket' />}
              onClick={() => setVoucherOpen(true)}
              size='small'
            >
              {t.radiusBatchVouchers}
            </Button>
          </div>
        </div>
      </Grid>

      {/* Overview Stats */}
      <Grid size={{ xs: 12 }}>
        <RadiusHeaderStats stats={overview} />
      </Grid>

      {/* Tabs navigation */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} variant='scrollable' scrollButtons='auto'>
            <Tab
              value='sessions'
              label={`${t.radiusTabSessions} (${sessions.length})`}
              icon={<i className='tabler-wifi mr-1 text-lg' />}
              iconPosition='start'
            />
            <Tab
              value='subscribers'
              label={`${t.radiusTabSubscribers} (${subscribers.length})`}
              icon={<i className='tabler-users mr-1 text-lg' />}
              iconPosition='start'
            />
            <Tab
              value='profiles'
              label={`${t.radiusTabProfiles} (${profiles.length})`}
              icon={<i className='tabler-gauge mr-1 text-lg' />}
              iconPosition='start'
            />
            <Tab
              value='nas'
              label={`${t.radiusTabNas} (${nasList.length})`}
              icon={<i className='tabler-router mr-1 text-lg' />}
              iconPosition='start'
            />
            <Tab
              value='test'
              label={t.radiusTabAuthSimulator}
              icon={<i className='tabler-shield-check mr-1 text-lg' />}
              iconPosition='start'
            />
          </Tabs>
        </Box>
      </Grid>

      {/* Active Tab Content */}
      <Grid size={{ xs: 12 }}>
        {loading ? (
          <Box className='flex justify-center p-12'>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === 'sessions' && (
              <OnlineSessionsTab sessions={sessions} onDisconnect={handleDisconnect} onRefresh={fetchAllData} />
            )}

            {activeTab === 'subscribers' && (
              <SubscribersTab
                subscribers={subscribers}
                profiles={profiles}
                onOpenVoucherDialog={() => setVoucherOpen(true)}
                onDeleteSubscriber={handleDeleteSubscriber}
                onRefresh={fetchAllData}
              />
            )}

            {activeTab === 'profiles' && <RateProfilesTab profiles={profiles} />}

            {activeTab === 'nas' && <NasRoutersTab nasList={nasList} />}

            {activeTab === 'test' && <AuthSimulatorTab />}
          </>
        )}
      </Grid>

      {/* Voucher Generator Modal */}
      <VoucherGeneratorDialog
        open={voucherOpen}
        profiles={profiles}
        onClose={() => setVoucherOpen(false)}
        onGenerate={handleGenerateVouchers}
      />
    </Grid>
  )
}
