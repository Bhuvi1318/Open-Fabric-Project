"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var sqlite3_1 = require("sqlite3");
var path_1 = require("path");
sqlite3_1.default.verbose();
var dbPath = path_1.default.join(process.cwd(), 'transactions.db');
exports.db = new sqlite3_1.default.Database(dbPath, function (err) {
    if (err) {
        console.error('❌ Error opening SQLite DB:', err);
    }
    else {
        console.log("\u2705 SQLite connected at ".concat(dbPath));
    }
});
exports.db.serialize(function () {
    exports.db.run("\n    CREATE TABLE IF NOT EXISTS transactions (\n      id TEXT PRIMARY KEY,\n      amount REAL NOT NULL,\n      currency TEXT NOT NULL,\n      description TEXT,\n      timestamp TEXT,\n      metadata TEXT,\n      status TEXT,\n      submittedAt TEXT,\n      completedAt TEXT,\n      error TEXT\n    )\n  ");
});
