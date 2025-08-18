import { runServer } from './server.js';
import { runWorker } from './worker.js';

const workerOnly = process.argv.includes('--worker-only');
if (workerOnly) {
  runWorker().catch(err => {
    console.error(err);
    process.exit(1);
  });
} else {
  // run both API and a worker in the same process (okay for dev)
  runServer().catch(err => {
    console.error(err);
    process.exit(1);
  });
  runWorker().catch(err => console.error('worker error', err));
}
