'use server';

import { getPredictions } from '../services/api';

export async function pollPredictions(): Promise<any[]> {
  try {
    const data = await getPredictions();
    const safeData = Array.isArray(data) ? data : ((data as any).results || []);
    return safeData;
  } catch (error) {
    console.error("Failed to poll predictions", error);
    return [];
  }
}
