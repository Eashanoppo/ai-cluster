import { cookies } from 'next/headers'

export const API_URL = 'http://127.0.0.1:8000/api'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt')?.value

  if (!token) {
    throw new Error('Unauthorized')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store' // Always fetch fresh data for live dashboard
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized')
    }
    throw new Error(`API error: ${res.status}`)
  }

  const json = await res.json()
  if (json.results !== undefined) {
    return json.results
  }
  return json.data !== undefined ? json.data : json
}

export async function getPredictions(): Promise<any[]> {
  return fetchWithAuth('/sentinel/predictions/')
}

export async function getPlacements(): Promise<any[]> {
  return fetchWithAuth('/scheduler/placements/')
}

export async function getCostReports(): Promise<any[]> {
  return fetchWithAuth('/costwatch/reports/')
}

export async function getPendingApprovals(): Promise<any[]> {
  return fetchWithAuth('/gate/approvals/')
}

export async function getLatestTelemetry(): Promise<any[]> {
  return fetchWithAuth('/telemetry/latest/')
}

export async function getTelemetryHistory(nodeId: string): Promise<any[]> {
  return fetchWithAuth(`/telemetry/?node_id=${nodeId}&limit=20`)
}

export async function getAlerts(): Promise<any[]> {
  return fetchWithAuth('/sentinel/alerts/')
}

export async function getApprovalsHistory(): Promise<any[]> {
  return fetchWithAuth('/gate/approvals/?history=true')
}

