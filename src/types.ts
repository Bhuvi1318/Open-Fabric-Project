// src/types.ts

export type TxStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Base transaction payload
export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  timestamp: string;                 // ISO string
  metadata?: Record<string, unknown>;
}

// Record stored in state/DB with lifecycle info
export interface TxRecord {
  id: string;
  amount: number;                    // required
  currency: string;                  // required
  timestamp: string;                 // required
  description?: string;
  metadata?: Record<string, unknown>;

  status: TxStatus;
  submittedAt: string;
  completedAt?: string;
  error?: string;
  attempts: number;
  lastAttemptAt?: string;
}
