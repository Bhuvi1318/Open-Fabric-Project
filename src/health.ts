// src/health.ts
import { FastifyInstance } from "fastify";
import Redis from "ioredis";
import { config } from "./config.js";

export async function healthRoutes(fastify: FastifyInstance) {
  const redis = new Redis(config.redisUrl);

  fastify.get("/api/health", async () => {
    try {
      const pong = await redis.ping();
      // Return plain JSON
      return {
        status: pong === "PONG" ? "ok" : "degraded",
        queueDepth: 0,
        errorRate1m: 0,
      };
    } catch (err) {
      return {
        status: "error",
        queueDepth: -1,
        errorRate1m: -1,
        error: (err as Error).message,
      };
    }
  });
}
