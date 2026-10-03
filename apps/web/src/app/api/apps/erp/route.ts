import { NextRequest, NextResponse } from 'next/server'

const ERP_API_URL = process.env.ERP_SERVICE_URL || 'http://127.0.0.1:5180/api/v1/erp'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get('endpoint') || 'overview'
    
    // Forward query params
    const query = new URLSearchParams()
    searchParams.forEach((val, key) => {
      if (key !== 'endpoint') query.append(key, val)
    })
    
    const queryString = query.toString() ? `?${query.toString()}` : ''
    const targetUrl = `${ERP_API_URL}/${endpoint}${queryString}`

    const res = await fetch(targetUrl, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      return NextResponse.json({ error: `ERP service error: HTTP ${res.status}` }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to communicate with Moonwitness ERP service', details: error.message },
      { status: 502 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, ...payload } = body

    let targetUrl = ''
    let reqMethod = 'POST'
    let reqBody: any = payload

    switch (action) {
      case 'confirm_order':
        targetUrl = `${ERP_API_URL}/orders/${payload.order_id}/confirm`
        reqBody = {}
        break

      case 'create_order':
        targetUrl = `${ERP_API_URL}/orders`
        reqBody = payload
        break

      case 'suspend_sub':
        targetUrl = `${ERP_API_URL}/subscriptions/${payload.subscription_id}/suspend`
        reqBody = { reason: payload.reason || 'Manual suspension' }
        break

      case 'resume_sub':
        targetUrl = `${ERP_API_URL}/subscriptions/${payload.subscription_id}/resume`
        reqBody = {}
        break

      case 'pay_invoice':
        targetUrl = `${ERP_API_URL}/invoices/${payload.invoice_id}/pay`
        reqBody = { payment_method: payload.payment_method || 'Bank Transfer' }
        break

      case 'create_lead':
        targetUrl = `${ERP_API_URL}/leads`
        reqBody = payload
        break

      case 'retry_outbox':
        targetUrl = `${ERP_API_URL}/outbox/${payload.event_id}/retry`
        reqBody = {}
        break

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    const res = await fetch(targetUrl, {
      method: reqMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to execute ERP action', details: error.message },
      { status: 502 }
    )
  }
}
