import sqlite3 from 'sqlite3';
import path from 'path';

sqlite3.verbose();
const dbPath = path.join(process.cwd(), 'transactions.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite DB:', err);
  } else {
    console.log(`✅ SQLite connected at ${dbPath}`);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      description TEXT,
      timestamp TEXT,
      metadata TEXT,
      status TEXT,
      submittedAt TEXT,
      completedAt TEXT,
      error TEXT
    )
  `);
});
