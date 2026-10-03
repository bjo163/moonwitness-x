export interface ErpOverviewStats {
  mrr: number
  activeSubscriptions: number
  totalCustomers: number
  openLeads: number
  totalUnpaidInvoices: number
  outbox: {
    pending: number
    completed: number
    deadLetter: number
  }
  currency: string
  compiledModels: string[]
}

export interface Partner {
  id: string
  name: string
  email?: string
  phone?: string
  city?: string
  address?: string
  is_customer: boolean
  is_subscriber: boolean
  radius_username?: string
  radius_profile?: string
  radius_status?: string
}

export interface CrmLead {
  id: string
  name: string
  partner_id?: string
  partner_name?: string
  contact_name?: string
  email?: string
  phone?: string
  expected_revenue: number
  probability: number
  stage: 'new' | 'qualified' | 'proposition' | 'won' | 'lost'
  description?: string
  created_at: string
}

export interface ProductTemplate {
  id: string
  name: string
  code?: string
  kind: 'one_off' | 'recurring'
  list_price: number
  currency_code: string
  rate_limit?: string
  billing_interval: string
}

export interface OrderLine {
  id: string
  name: string
  quantity: number
  unit_price: number
  subtotal: number
  line_kind: 'one_off' | 'recurring'
}

export interface SaleOrder {
  id: string
  number: string
  partner_id: string
  partner_name: string
  state: 'draft' | 'sent' | 'confirmed' | 'cancelled'
  order_date: string
  currency_code: string
  total_amount: number
  notes?: string
  lines: OrderLine[]
}

export interface SubscriptionLine {
  id: string
  name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface SaleSubscription {
  id: string
  number: string
  partner_id: string
  partner_name: string
  source_order_id?: string
  state: 'draft' | 'pending_activation' | 'active' | 'past_due' | 'suspended' | 'isolated' | 'paused' | 'cancelled'
  currency_code: string
  mrr: number
  billing_interval: string
  current_period_start?: string
  current_period_end?: string
  next_invoice_at?: string
  technical_service: string
  technical_reference?: string
  technical_profile?: string
  lines: SubscriptionLine[]
}

export interface AccountMove {
  id: string
  number: string
  partner_id: string
  partner_name: string
  source_order_id?: string
  subscription_id?: string
  invoice_date: string
  due_date?: string
  currency_code: string
  total_amount: number
  state: 'draft' | 'posted' | 'paid' | 'overdue' | 'cancelled'
  payment_date?: string
  payment_method?: string
}

export interface OutboxEvent {
  id: string
  eventType: string
  targetService: string
  idempotencyKey: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER'
  attempts: number
  maxAttempts: number
  lastError?: string
  createdAt?: string
  completedAt?: string
  payload: Record<string, any>
}
