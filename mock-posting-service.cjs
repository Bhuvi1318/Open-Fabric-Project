const express = require('express');
const app = express();
app.use(express.json());

const store = {}; // In-memory store

function randomDelay(minMs, maxMs) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((r) => setTimeout(r, ms));
}

app.post('/transactions', async (req, res) => {
  await randomDelay(2000, 10000);
  if (Math.random() < 0.05) {
    return res.status(500).json({ message: 'Mock Failure' });
  }
  const id = req.body.id;
  store[id] = { ...req.body, status: 'completed' };
  return res.status(201).json({ message: 'OK', id });
});

app.get('/transactions/:id', async (req, res) => {
  await randomDelay(200, 500);
  const id = req.params.id;
  if (store[id]) {
    return res.json(store[id]);
  } else {
    return res.status(404).json({ message: 'Not Found' });
  }
});

app.post('/cleanup', (_req, res) => {
  Object.keys(store).forEach((k) => delete store[k]);
  res.json({ message: 'cleanup done' });
});

app.listen(8080, () => {
  console.log('✅ Mock Posting Service running on http://localhost:8080');
});
