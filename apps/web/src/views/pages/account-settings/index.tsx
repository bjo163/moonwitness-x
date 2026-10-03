'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const AccountSettings = ({ tabContentList }: { tabContentList: { [key: string]: ReactElement } }) => {
  // States
  const [activeTab, setActiveTab] = useState('account')
  const t = useCommonTranslations()

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  return (
    <TabContext value={activeTab}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <CustomTabList onChange={handleChange} variant='scrollable' pill='true'>
            <Tab label={t.accountTab} icon={<i className='tabler-users' />} iconPosition='start' value='account' />
            <Tab label={t.securityTab} icon={<i className='tabler-lock' />} iconPosition='start' value='security' />
            <Tab
              label={t.billingPlansTab}
              icon={<i className='tabler-bookmark' />}
              iconPosition='start'
              value='billing-plans'
            />
            <Tab
              label={t.notificationsTab}
              icon={<i className='tabler-bell' />}
              iconPosition='start'
              value='notifications'
            />
            <Tab
              label={t.connectionsTab}
              icon={<i className='tabler-link' />}
              iconPosition='start'
              value='connections'
            />
          </CustomTabList>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TabPanel value={activeTab} className='p-0'>
            {tabContentList[activeTab]}
          </TabPanel>
        </Grid>
      </Grid>
    </TabContext>
  )
}

export default AccountSettings
