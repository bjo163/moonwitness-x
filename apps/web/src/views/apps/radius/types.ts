export interface RadiusOverview {
  activeSessions: number
  totalSubscribers: number
  totalNas: number
  totalProfiles: number
  totalUploadMb: number
  totalDownloadMb: number
  authRequestsTotal: number
  authAcceptsTotal: number
  authRejectsTotal: number
  acctRequestsTotal: number
  serverUptime: string
  engine: string
}

export interface OnlineSession {
  sessionId: string
  username: string
  nasIp: string
  framedIp: string
  macAddr: string
  startTime: string
  lastUpdate: string
  inputBytes: number
  outputBytes: number
  rateLimit: string
  nasPort: number
}

export interface Subscriber {
  id: string
  username: string
  password: string
  profileId: string
  status: 'active' | 'disabled' | 'expired'
  expireAt: string
  quotaMb: number
  usedMb: number
  macAddr?: string
  framedIp?: string
  createdAt: string
}

export interface RateProfile {
  id: string
  name: string
  rateLimit: string
  price: number
  quotaMb: number
  durationDays: number
  description: string
}

export interface NasRouter {
  id: string
  name: string
  ipAddr: string
  secret: string
  vendor: string
  coaPort: number
  description: string
  createdAt: string
}
