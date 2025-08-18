import axios from 'axios';
import { config } from './config.js';
import type { Transaction } from './types.js';

export class PostingClient {
  base = config.postingBaseUrl;

  async getById(id: string) {
    try {
      const r = await axios.get(`${this.base}/transactions/${id}`, { timeout: 12000 });
      return { exists: r.status === 200, data: r.data };
    } catch (e: any) {
      if (e?.response?.status === 404) return { exists: false };
      throw e; // network or 5xx
    }
  }

  async post(tx: Transaction) {
    // Mock service expects id, amount, currency, timestamp, description, metadata
    const payload = {
      id: tx.id,
      amount: Number(tx.amount ?? 0),
      currency: String(tx.currency ?? 'USD'),
      timestamp: tx.timestamp ?? new Date().toISOString(),
      description: tx.description ?? '',
      metadata: tx.metadata ?? {}
    };

    const r = await axios.post(`${this.base}/transactions`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    return r.data;
  }

  async cleanup() {
    return axios.post(`${this.base}/cleanup`);
  }
}
