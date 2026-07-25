'use server';

import { fetchWithAuth } from '../services/api';

/**
 * Trigger the autonomous Judge Mode demo sequence.
 * Must run server-side so it can read the httpOnly JWT cookie.
 */
export async function runJudgeMode(scenario: string = 'thermal_runaway'): Promise<any> {
  try {
    const data = await fetchWithAuth('/simulator/judge_mode/', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    });
    return { ok: true, data };
  } catch (error: any) {
    console.error('[JudgeMode] Server action failed:', error?.message ?? error);
    return { ok: false, error: error?.message ?? 'Unknown error' };
  }
}

/**
 * Fetch learning updates (AI decision log) — server-side read.
 */
export async function pollLearningUpdates(): Promise<any[]> {
  try {
    const data = await fetchWithAuth('/telemetry/learning_updates/');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch latest telemetry for cost / capacity checks.
 */
export async function pollCostReports(): Promise<any[]> {
  try {
    const data = await fetchWithAuth('/costwatch/reports/');
    const arr = Array.isArray(data) ? data : (data?.results ?? []);
    return arr;
  } catch {
    return [];
  }
}

/**
 * Fetch dashboard metrics aggregate.
 */
export async function pollDashboardMetrics(): Promise<any> {
  try {
    const data = await fetchWithAuth('/telemetry/dashboard_metrics/');
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch pending approvals.
 */
export async function pollApprovals(): Promise<any[]> {
  try {
    const data = await fetchWithAuth('/gate/approvals/');
    return Array.isArray(data) ? data : (data?.results ?? []);
  } catch {
    return [];
  }
}

/**
 * Fetch sentinel predictions.
 */
export async function pollPredictions(): Promise<any[]> {
  try {
    const data = await fetchWithAuth('/sentinel/predictions/');
    return Array.isArray(data) ? data : (data?.results ?? []);
  } catch {
    return [];
  }
}
