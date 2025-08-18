import Fastify from 'fastify';
import Redis from 'ioredis';
import { config } from './config.js';
import { Queue } from './queue.js';
import { State } from './state.js';
import { jobsEnqueued, queueDepth, registry } from './metrics.js';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db.js';
import { Transaction } from './types.js';

const fastify = Fastify({ logger: true });
const redis = new Redis(config.redisUrl);
const queue = new Queue(redis);
const state = new State(redis);

await queue.init();

/**
 * Default Home route
 */
fastify.get('/', async (_req, reply) => {
  return reply.send({ message: 'Transaction Processing API Running' });
});

/**
 * POST /api/transactions
 */
fastify.post('/api/transactions', async (req, reply) => {
  const body = req.body as Partial<Transaction>;
  const id = body.id || uuidv4();
  const tx: Transaction = {
    id,
    amount: Number(body.amount || 0),
    currency: String(body.currency || 'USD'),
    description: body.description,
    timestamp: body.timestamp || new Date().toISOString(),
    metadata: body.metadata
  };

  // Insert into SQLite DB
  const submittedAt = new Date().toISOString();
  db.run(
    `INSERT OR IGNORE INTO transactions 
     (id, amount, currency, description, timestamp, metadata, status, submittedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.id,
      tx.amount,
      tx.currency,
      tx.description,
      tx.timestamp,
      JSON.stringify(tx.metadata || {}),
      'pending',
      submittedAt
    ],
    (err) => {
      if (err) console.error('SQLite insert error:', err);
    }
  );

  // Init state + enqueue
  const rec = await state.initIfAbsent(id);
  await queue.enqueue(tx);
  jobsEnqueued.inc();

  return reply.code(202).send({
    transactionId: id,
    status: rec.status,
    submittedAt: rec.submittedAt
  });
});

/**
 * GET /api/transactions/:id
 */
fastify.get('/api/transactions/:id', async (req, reply) => {
  const { id } = req.params as any;

  const record = await new Promise<any>((resolve) => {
    db.get(`SELECT * FROM transactions WHERE id = ?`, [id], (err, row) => {
      if (err) {
        console.error('SQLite read error:', err);
        resolve(null);
      } else {
        resolve(row);
      }
    });
  });

  if (record) return reply.code(200).send(record);

  const rec = await state.get(id);
  if (!rec) return reply.code(404).send({ error: 'not found' });

  return reply.code(200).send(rec);
});

/**
 * GET /api/transactions
 * List all transactions
 */
fastify.get('/api/transactions', async (_req, reply) => {
  const records = await new Promise<any[]>((resolve, reject) => {
    db.all(`SELECT * FROM transactions`, (err, rows) => {
      if (err) {
        console.error('SQLite read error:', err);
        return reject(err);
      }
      resolve(rows);
    });
  });

  return reply.code(200).send(records);
});

/**
 * Health check
 */
fastify.get('/api/health', async (_req, reply) => {
  try {
    const pong = await redis.ping();
   const qDepthMetric = await queueDepth.get();
const qDepth = qDepthMetric.values[0].value; // ✅ extract number
  // gauge metric from metrics.ts
    const errorRate1m = 0.0; // placeholder

    return reply.send({
      status: pong === 'PONG' ? 'ok' : 'degraded',
      queueDepth: qDepth,
      errorRate1m
    });
  } catch (err) {
    return reply.code(500).send({
      status: 'error',
      queueDepth: -1,
      errorRate1m: -1,
      error: (err as Error).message
    });
  }
});

/**
 * Prometheus metrics
 */
fastify.get('/metrics', async (_req, reply) => {
  reply.header('Content-Type', registry.contentType);
  return reply.send(await registry.metrics());
});

/**
 * Run server
 */
export async function runServer() {
  await fastify.listen({ port: config.port, host: '0.0.0.0' });
}

runServer().catch((err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});
