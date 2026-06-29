'use server';

import { fetchWithAuth } from '../services/api';
import { revalidatePath } from 'next/cache';

export async function approveRequest(id: number) {
  try {
    await fetchWithAuth(`/gate/approvals/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to approve request:", error);
    return { error: error.message };
  }
}

export async function rejectRequest(id: number) {
  try {
    await fetchWithAuth(`/gate/approvals/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'REJECTED' }),
    });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to reject request:", error);
    return { error: error.message };
  }
}

export async function pollPendingApprovals() {
  try {
    const data = await fetchWithAuth('/gate/approvals/');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to poll pending approvals:", error);
    return [];
  }
}

