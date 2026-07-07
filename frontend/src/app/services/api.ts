export const API_URL = 'http://127.0.0.1:8000/api'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let token: string | undefined

  if (typeof window === 'undefined') {
    // Server-side: dynamic import next/headers to prevent bundler errors on client components
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    token = cookieStore.get('jwt')?.value
  } else {
    // Client-side: read directly from document.cookie
    const match = document.cookie.match(/(^| )jwt=([^;]+)/)
    token = match ? decodeURIComponent(match[2]) : undefined
  }

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
  
  // Extract from the { success: true, data: ... } envelope if present
  let payload = json
  if (json && json.success === true && json.data !== undefined) {
    payload = json.data
  }

  // Extract from paginated DRF envelope if present
  if (payload && payload.results !== undefined) {
    return payload.results
  }

  return payload && payload.data !== undefined ? payload.data : payload
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

// ---------------------------------------------------------------------------
// Simulator endpoints
// ---------------------------------------------------------------------------

export interface SimulationRunPayload {
  prompt?: string;
  chat_session_id?: string;
  task_type: string;
  user_count?: number;
  allocated_nodes: number;
  file_input_size_gb: number;
  image_count: number;
  thinking_depth: number;
  complexity_factor: number;
}

export async function getSimulatorConfig(): Promise<any> {
  return fetchWithAuth('/simulator/config/')
}

export async function previewWorkload(payload: SimulationRunPayload): Promise<any> {
  return fetchWithAuth('/simulator/preview/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createSimulationRun(payload: SimulationRunPayload): Promise<any> {
  return fetchWithAuth('/simulator/runs/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getSimulationRuns(): Promise<any[]> {
  return fetchWithAuth('/simulator/runs/')
}

export async function getSimulationRun(id: number): Promise<any> {
  return fetchWithAuth(`/simulator/runs/${id}/`)
}

export async function acknowledgeSimulationRun(id: number): Promise<any> {
  return fetchWithAuth(`/simulator/runs/${id}/acknowledge/`, {
    method: 'POST',
  })
}
