// k6-load.js
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 20,            // 20 virtual users
  duration: '30s',    // run for 30 seconds
};

export default function () {
  const transactionId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();

  const payload = JSON.stringify({
    id: transactionId,
    amount: 250,
    currency: 'USD',
    description: 'Test',
    timestamp: submittedAt
  });

  const params = {
    headers: { 'Content-Type': 'application/json' }
  };

  // POST transaction
  http.post('http://localhost:3000/transactions', payload, params);

  sleep(0.1); // small delay between requests
}
