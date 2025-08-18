import Redis from 'ioredis';
import { config } from './config.js';
import type { Transaction } from './types.js';

export class Queue {
  constructor(private redis: Redis) {}

  async init() {
    try {
      await this.redis.xgroup('CREATE', config.streamKey, config.groupName, '0', 'MKSTREAM');
    } catch (e: any) {
      // group may already exist
      if (!String(e?.message || '').includes('BUSYGROUP')) throw e;
    }
  }

  async enqueue(tx: Transaction) {
    await this.redis.xadd(config.streamKey, '*',
      'id', tx.id,
      'payload', JSON.stringify(tx)
    );
  }

  async readBatch(consumer: string, count = 16, blockMs = 5000) {
    // First read pending messages (not yet acked), then new ones
    const res = await this.redis.xreadgroup(
      'GROUP', config.groupName, consumer,
      'COUNT', count,
      'BLOCK', blockMs,
      'STREAMS', config.streamKey, '>'
    );
    return res;
  }

  async ack(id: string) {
    await this.redis.xack(config.streamKey, config.groupName, id);
  }
}
