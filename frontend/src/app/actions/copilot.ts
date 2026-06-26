'use server';

import { fetchWithAuth } from '../services/api';

export async function askCopilot(query: string, provider?: string, model?: string) {
  try {
    const res = await fetchWithAuth('/copilot/query/', {
      method: 'POST',
      body: JSON.stringify({ query, provider, model }),
    });
    
    // fetchWithAuth unwraps `json.data` if it exists, so res might just be { message: "..." }
    if (res.message) {
      return res.message;
    } else if (res.success && res.data) {
      return res.data.message;
    } else if (res.error) {
      return `Error: ${res.error.message}`;
    }
    
    return "Unexpected response from NeuronOps AI.";
  } catch (error: any) {
    console.error("Copilot Action Error:", error);
    return `Connection failed: ${error.message}`;
  }
}
