'use client'

import React, { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'

import TabPanel from '@mui/lab/TabPanel'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

import CustomTabList from '@core/components/mui/TabList'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

import ErpHeaderStats from './ErpHeaderStats'
import SubscriptionsTab from './SubscriptionsTab'
import SalesOrdersTab from './SalesOrdersTab'
import CrmPipelineTab from './CrmPipelineTab'
import InvoicesTab from './InvoicesTab'
import OutboxQueueTab from './OutboxQueueTab'

import type {
  ErpOverviewStats,
  SaleSubscription,
  SaleOrder,
  CrmLead,
  AccountMove,
  OutboxEvent,
  Partner,
  ProductTemplate
} from './types'

const ErpDashboardView: React.FC = () => {
  const t = useCommonTranslations()
  const [activeTab, setActiveTab] = useState('subscriptions')
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<ErpOverviewStats | null>(null)
  const [subscriptions, setSubscriptions] = useState<SaleSubscription[]>([])
  const [orders, setOrders] = useState<SaleOrder[]>([])
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [invoices, setInvoices] = useState<AccountMove[]>([])
  const [outboxEvents, setOutboxEvents] = useState<OutboxEvent[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [products, setProducts] = useState<ProductTemplate[]>([])

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)

      const [statsRes, subsRes, ordersRes, leadsRes, invsRes, outboxRes, partnersRes, prodsRes] = await Promise.all([
        fetch('/api/apps/erp?endpoint=overview').then(r => r.json()),
        fetch('/api/apps/erp?endpoint=subscriptions').then(r => r.json()),
        fetch('/api/apps/erp?endpoint=orders').then(r => r.json()),
        fetch('/api/apps/erp?endpoint=leads').then(r => r.json()),
        fetch('/api/apps/erp?endpoint=invoices').then(r => r.json()),
        fetch('/api/apps/erp?endpoint=outbox').then(r => r.json()),
        fetch('/api/apps/erp?endpoint=partners').then(r => r.json()),
        fetch('/api/apps/erp?endpoint=products').then(r => r.json())
      ])

      if (!statsRes.error) setStats(statsRes)
      if (Array.isArray(subsRes)) setSubscriptions(subsRes)
      if (Array.isArray(ordersRes)) setOrders(ordersRes)
      if (Array.isArray(leadsRes)) setLeads(leadsRes)
      if (Array.isArray(invsRes)) setInvoices(invsRes)
      if (Array.isArray(outboxRes)) setOutboxEvents(outboxRes)
      if (Array.isArray(partnersRes)) setPartners(partnersRes)
      if (Array.isArray(prodsRes)) setProducts(prodsRes)
    } catch (e) {
      console.error('Failed to fetch ERP data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 8000)

    return () => clearInterval(interval)
  }, [fetchAllData])

  return (
    <Box className='flex flex-col gap-6'>
      {/* Top Banner */}
      <Box className='flex flex-wrap justify-between items-center gap-4'>
        <Box>
          <Box className='flex items-center gap-2 mbe-1'>
            <Typography variant='h4' className='font-bold'>
              {t.erpTitle}
            </Typography>
            <Chip size='small' label={t.erpArchitecture} color='primary' variant='tonal' />
          </Box>
          <Typography variant='body2' color='text.secondary'>
            {t.erpSubtitle}
          </Typography>
        </Box>
      </Box>

      {/* Header KPI Cards */}
      <ErpHeaderStats stats={stats} />

      {/* Main Tabbed Interface */}
      <TabContext value={activeTab}>
        <CustomTabList
          onChange={(_, val) => setActiveTab(val)}
          variant='scrollable'
          scrollButtons='auto'
          className='border-b'
        >
          <Tab
            value='subscriptions'
            icon={<i className='tabler-rotate-clockwise text-lg' />}
            iconPosition='start'
            label={`${t.erpSubscriptions} (${subscriptions.length})`}
          />
          <Tab
            value='orders'
            icon={<i className='tabler-file-invoice text-lg' />}
            iconPosition='start'
            label={`${t.erpSalesOrders} (${orders.length})`}
          />
          <Tab
            value='crm'
            icon={<i className='tabler-target-arrow text-lg' />}
            iconPosition='start'
            label={`${t.erpCrmPipeline} (${leads.length})`}
          />
          <Tab
            value='invoices'
            icon={<i className='tabler-credit-card text-lg' />}
            iconPosition='start'
            label={`${t.erpInvoicesBilling} (${invoices.length})`}
          />
          <Tab
            value='outbox'
            icon={<i className='tabler-send text-lg' />}
            iconPosition='start'
            label={`${t.erpTransactionalOutbox} (${outboxEvents.length})`}
          />
        </CustomTabList>

        <TabPanel value='subscriptions' className='p-0 mte-6'>
          <SubscriptionsTab subscriptions={subscriptions} loading={loading} onRefresh={fetchAllData} />
        </TabPanel>

        <TabPanel value='orders' className='p-0 mte-6'>
          <SalesOrdersTab
            orders={orders}
            partners={partners}
            products={products}
            loading={loading}
            onRefresh={fetchAllData}
          />
        </TabPanel>

        <TabPanel value='crm' className='p-0 mte-6'>
          <CrmPipelineTab leads={leads} partners={partners} loading={loading} onRefresh={fetchAllData} />
        </TabPanel>

        <TabPanel value='invoices' className='p-0 mte-6'>
          <InvoicesTab invoices={invoices} loading={loading} onRefresh={fetchAllData} />
        </TabPanel>

        <TabPanel value='outbox' className='p-0 mte-6'>
          <OutboxQueueTab events={outboxEvents} loading={loading} onRefresh={fetchAllData} />
        </TabPanel>
      </TabContext>
    </Box>
  )
}

export default ErpDashboardView
