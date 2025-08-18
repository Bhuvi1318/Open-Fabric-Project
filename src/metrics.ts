import client from 'prom-client';

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const jobsProcessed = new client.Counter({ name: 'jobs_processed_total', help: 'Total jobs processed' });
export const jobsSucceeded = new client.Counter({ name: 'jobs_succeeded_total', help: 'Jobs succeeded' });
export const jobsFailed = new client.Counter({ name: 'jobs_failed_total', help: 'Jobs failed' });
export const jobsEnqueued = new client.Counter({ name: 'jobs_enqueued_total', help: 'Jobs enqueued' });
export const queueDepth = new client.Gauge({ name: 'queue_depth', help: 'Approx queue depth' });
export const retryBacklog = new client.Gauge({ name: 'retry_backlog', help: 'Retry set size' });

registry.registerMetric(jobsProcessed);
registry.registerMetric(jobsSucceeded);
registry.registerMetric(jobsFailed);
registry.registerMetric(jobsEnqueued);
registry.registerMetric(queueDepth);
registry.registerMetric(retryBacklog);
