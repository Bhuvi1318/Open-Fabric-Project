// k6 run k6-load.js
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '30s'
};

export default function () {
  const id = crypto.randomUUID();
  const payload = JSON.stringify({
    id,
    amount: 1.23,
    currency: 'USD',
    timestamp: new Date().toISOString()
  });
  const params = { headers: { 'Content-Type': 'application/json' } };
  http.post('http://localhost:3000/api/transactions', payload, params);
  sleep(0.1);
}
