import Redis from 'ioredis';
import { config } from './config.js';
import type { TxRecord, TxStatus } from './types.js';

export class State {
  constructor(private redis: Redis) {}

  key(id: string) {
    return `${config.txPrefix}${id}`;
  }

  async get(id: string): Promise<TxRecord | null> {
    const data = await this.redis.hgetall(this.key(id));
    if (!data || !data.id) return null;

    return {
      id: data.id,
      amount: parseFloat(data.amount || '0'),            // default 0
      currency: data.currency || 'USD',                  // default USD
      timestamp: data.timestamp || new Date().toISOString(),

      description: data.description || undefined,
      metadata: data.metadata ? JSON.parse(data.metadata) : undefined,

      status: data.status as TxStatus,
      submittedAt: data.submittedAt,
      completedAt: data.completedAt || undefined,
      error: data.error || undefined,
      attempts: parseInt(data.attempts || '0', 10),
      lastAttemptAt: data.lastAttemptAt || undefined
    };
  }

  async initIfAbsent(id: string): Promise<TxRecord> {
    const exists = await this.redis.exists(this.key(id));
    if (!exists) {
      const submittedAt = new Date().toISOString();
      await this.redis.hset(this.key(id), {
        id,
        amount: 0,
        currency: 'USD',
        timestamp: submittedAt,
        status: 'pending',
        submittedAt,
        attempts: 0
      });
    }
    const rec = await this.get(id);
    if (!rec) throw new Error('failed to init record');
    return rec;
  }

  async setStatus(id: string, status: TxStatus, error?: string) {
    const update: any = { status };
    if (status === 'completed') update.completedAt = new Date().toISOString();
    if (error) update.error = error;
    await this.redis.hset(this.key(id), update);
  }

  async incrAttempt(id: string) {
    await this.redis.hincrby(this.key(id), 'attempts', 1);
    await this.redis.hset(this.key(id), 'lastAttemptAt', new Date().toISOString());
  }

  async health() {
    const keys = await this.redis.keys(`${config.txPrefix}*`);
    return { total: keys.length };
  }
}
