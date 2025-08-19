// src/postingClient.ts
import type { Transaction } from "./types.js";

export class PostingClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.POSTING_URL || "http://mock:4000";
  }

  async post(tx: Transaction): Promise<any> {
    const res = await fetch(`${this.baseUrl}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });

    if (!res.ok) {
      throw new Error(`Posting failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async getById(id: string): Promise<{ exists: boolean }> {
    const res = await fetch(`${this.baseUrl}/transactions/${id}`);

    if (res.status === 404) {
      return { exists: false };
    }
    if (!res.ok) {
      throw new Error(`GetById failed: ${res.status} ${res.statusText}`);
    }
    return { exists: true };
  }
}
