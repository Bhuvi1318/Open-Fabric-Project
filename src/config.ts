export const config = {
  port: 3000,
  redisUrl: "redis://127.0.0.1:6379",
  streamKey: "tx-stream",
  groupName: "tx-group",
  lockPrefix: "lock:",
  retryZset: "retry-set",
  txPrefix: "tx:",             // ✅ needed for state.ts
  baseBackoffMs: 1000,
  maxBackoffMs: 30000,
  breakerOpenSec: 10,          // ✅ for circuit breaker window
  breakerWindowSec: 60,        // ✅ window for error rate calc
  breakerFailRate: 0.5,        // ✅ threshold fail rate (0.5 = 50%)
  postingBaseUrl: "http://localhost:8080"
};
