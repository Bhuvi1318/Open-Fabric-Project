// src/workerMain.ts
import { runWorker } from "./worker.js";

(async () => {
  try {
    await runWorker();
  } catch (err) {
    console.error("💥 Worker crashed:", err);
    process.exit(1);
  }
})();
