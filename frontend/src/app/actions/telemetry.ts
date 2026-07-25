'use server';

import { getLatestTelemetry, getTelemetryHistory } from '../services/api';

export async function pollLatestTelemetry(): Promise<any[]> {
  try {
    const data = await getLatestTelemetry();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to poll latest telemetry", error);
    return [];
  }
}

export async function pollTelemetryHistory(nodeId: string): Promise<any[]> {
  try {
    const data = await getTelemetryHistory(nodeId);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Failed to poll telemetry history for ${nodeId}`, error);
    return [];
  }
}

export async function pollTopology(): Promise<any> {
  try {
    const { getTopology } = await import('../services/api');
    const data = await getTopology();
    return data;
  } catch (error) {
    console.error("Failed to poll topology", error);
    return null;
  }
}
