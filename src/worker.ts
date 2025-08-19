// src/worker.ts
import Redis from "ioredis";
import { config } from "./config.js";
import { Queue } from "./queue.js";
import { State } from "./state.js";
import { PostingClient } from "./postingClient.js";
import { CircuitBreaker } from "./breaker.js";
import { jobsProcessed, jobsSucceeded, jobsFailed, retryBacklog } from "./metrics.js";
import type { Transaction } from "./types.js";
import { db } from "./db.js";

// Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");
const queue = new Queue(redis);
const state = new State(redis);
const posting = new PostingClient();
const breaker = new CircuitBreaker();

function jitter(n: number) {
  return Math.floor(n * (0.7 + Math.random() * 0.6));
}

async function lock(id: string, ttlMs = 30000) {
  const ok = await redis.set(config.lockPrefix + id, "1", "PX", ttlMs, "NX");
  return ok === "OK";
}

async function unlock(id: string) {
  await redis.del(config.lockPrefix + id);
}

async function scheduleRetry(id: string, attempts: number) {
  const base = Math.min(config.maxBackoffMs, config.baseBackoffMs * Math.pow(2, attempts));
  const when = Date.now() + jitter(base);
  await redis.zadd(config.retryZset, when, id);
  const size = await redis.zcard(config.retryZset);
  retryBacklog.set(size);
}

async function drainRetries(max = 64) {
  const now = Date.now();
  const due = await redis.zrangebyscore(config.retryZset, 0, now, "LIMIT", 0, max);
  if (due.length) {
    await redis.zrem(config.retryZset, ...due);
    for (const id of due) {
      await redis.xadd(config.streamKey, "*", "id", id, "payload", JSON.stringify({ id }));
    }
  }
  const size = await redis.zcard(config.retryZset);
  retryBacklog.set(size);
}

export async function runWorker(loopMs = 200) {
  await queue.init();
  const consumer = `c-${Math.random().toString(36).slice(2, 8)}`;
  console.log(`🚀 Worker started with consumer=${consumer}`);

  for (;;) {
    await drainRetries();
    if (breaker.isOpen) {
      await new Promise((r) => setTimeout(r, 250));
      continue;
    }

    let batch: any;
    try {
      batch = await queue.readBatch(consumer, 32, 1000);
    } catch (err) {
      console.error("❌ readBatch error:", err);
      await new Promise((r) => setTimeout(r, loopMs));
      continue;
    }

    if (!batch || !Array.isArray(batch) || batch.length === 0) {
      await new Promise((r) => setTimeout(r, loopMs));
      continue;
    }

    const entries = batch[0]?.[1];
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      await new Promise((r) => setTimeout(r, loopMs));
      continue;
    }

    for (const [msgId, fields] of entries) {
      try {
        // --------------------------
        // 🔎 Payload Extraction
        // --------------------------
        let payload: any = null;
        try {
          const pIdx = fields.findIndex((v: any) => v === "payload");
          if (pIdx >= 0 && fields[pIdx + 1]) {
            payload = JSON.parse(fields[pIdx + 1]);
          }
        } catch (e) {
          console.error("⚠️ Invalid payload JSON:", e);
        }

        const id =
          payload?.id ||
          fields[fields.findIndex((v: any) => v === "id") + 1];

        if (!id) {
          console.error("⚠️ No valid transaction ID in message:", fields);
          await queue.ack(msgId);
          continue;
        }

        jobsProcessed.inc();

        if (!(await lock(id))) {
          await queue.ack(msgId);
          continue;
        }

        try {
          await state.initIfAbsent(id);
          await state.setStatus(id, "processing");

          // ✅ DB -> processing
          db.run(
            `UPDATE transactions SET status = ? WHERE id = ?`,
            ["processing", id],
            (err) => err && console.error("SQLite update error:", err)
          );

          // 🔎 Check if already exists
          const exists = await posting.getById(id);
          if (exists.exists) {
            await state.setStatus(id, "completed");
            jobsSucceeded.inc();

            db.run(
              `UPDATE transactions SET status = ?, completedAt = ? WHERE id = ?`,
              ["completed", new Date().toISOString(), id],
              (err) => err && console.error("SQLite update error:", err)
            );

            await queue.ack(msgId);
            continue;
          }

          // --------------------------
          // 🚀 Try Posting
          // --------------------------
          try {
            const tx: Transaction = payload?.amount
              ? payload
              : { id, amount: 0, currency: "USD", timestamp: new Date().toISOString() };

            await posting.post(tx);
            breaker.markSuccess();

            await state.setStatus(id, "completed");
            jobsSucceeded.inc();

            db.run(
              `UPDATE transactions SET status = ?, completedAt = ? WHERE id = ?`,
              ["completed", new Date().toISOString(), id],
              (err) => err && console.error("SQLite update error:", err)
            );
          } catch (e: any) {
            // Posting failed
            breaker.markFailure();
            const v = await posting.getById(id).catch(() => ({ exists: false }));

            if (v.exists) {
              await state.setStatus(id, "completed");
              jobsSucceeded.inc();

              db.run(
                `UPDATE transactions SET status = ?, completedAt = ? WHERE id = ?`,
                ["completed", new Date().toISOString(), id],
                (err) => err && console.error("SQLite update error:", err)
              );
            } else {
              // Retry logic
              await state.incrAttempt(id);
              const rec2 = await state.get(id);
              await scheduleRetry(id, rec2?.attempts || 1);

              await state.setStatus(id, "pending", e?.message || "post failed");
              jobsFailed.inc();

              db.run(
                `UPDATE transactions SET status = ?, error = ? WHERE id = ?`,
                ["failed", e?.message || "post failed", id],
                (err) => err && console.error("SQLite update error:", err)
              );
            }
          }
        } finally {
          await unlock(id);
        }

        await queue.ack(msgId);
      } catch (err) {
        console.error("💥 Worker error:", err);
        // ⚠️ Don't ack here → message will be retried
      }
    }
  }
}
