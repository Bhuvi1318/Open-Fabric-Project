"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWorker = runWorker;
// src/worker.ts
var ioredis_1 = require("ioredis");
var config_js_1 = require("./config.js");
var queue_js_1 = require("./queue.js");
var state_js_1 = require("./state.js");
var postingClient_js_1 = require("./postingClient.js");
var breaker_js_1 = require("./breaker.js");
var metrics_js_1 = require("./metrics.js");
var db_js_1 = require("./db.js");
var redis = new ioredis_1.default(config_js_1.config.redisUrl);
var queue = new queue_js_1.Queue(redis);
var state = new state_js_1.State(redis);
var posting = new postingClient_js_1.PostingClient();
var breaker = new breaker_js_1.CircuitBreaker();
function jitter(n) {
    return Math.floor(n * (0.7 + Math.random() * 0.6));
}
function lock(id_1) {
    return __awaiter(this, arguments, void 0, function (id, ttlMs) {
        var ok;
        if (ttlMs === void 0) { ttlMs = 30000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, redis.set(config_js_1.config.lockPrefix + id, "1", "PX", ttlMs, "NX")];
                case 1:
                    ok = _a.sent();
                    return [2 /*return*/, ok === "OK"];
            }
        });
    });
}
function unlock(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, redis.del(config_js_1.config.lockPrefix + id)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function scheduleRetry(id, attempts) {
    return __awaiter(this, void 0, void 0, function () {
        var base, when, size;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    base = Math.min(config_js_1.config.maxBackoffMs, config_js_1.config.baseBackoffMs * Math.pow(2, attempts));
                    when = Date.now() + jitter(base);
                    return [4 /*yield*/, redis.zadd(config_js_1.config.retryZset, when, id)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, redis.zcard(config_js_1.config.retryZset)];
                case 2:
                    size = _a.sent();
                    metrics_js_1.retryBacklog.set(size);
                    return [2 /*return*/];
            }
        });
    });
}
function drainRetries() {
    return __awaiter(this, arguments, void 0, function (max) {
        var now, due, _i, due_1, id, size;
        if (max === void 0) { max = 64; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, redis.zrangebyscore(config_js_1.config.retryZset, 0, now, "LIMIT", 0, max)];
                case 1:
                    due = _a.sent();
                    if (!due.length) return [3 /*break*/, 6];
                    return [4 /*yield*/, redis.zrem.apply(redis, __spreadArray([config_js_1.config.retryZset], due, false))];
                case 2:
                    _a.sent();
                    _i = 0, due_1 = due;
                    _a.label = 3;
                case 3:
                    if (!(_i < due_1.length)) return [3 /*break*/, 6];
                    id = due_1[_i];
                    return [4 /*yield*/, redis.xadd(config_js_1.config.streamKey, "*", "id", id, "payload", JSON.stringify({ id: id }))];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, redis.zcard(config_js_1.config.retryZset)];
                case 7:
                    size = _a.sent();
                    metrics_js_1.retryBacklog.set(size);
                    return [2 /*return*/];
            }
        });
    });
}
function runWorker() {
    return __awaiter(this, arguments, void 0, function (loopMs) {
        var consumer, batch, err_1, entries, _i, entries_1, _a, msgId, fields, idIdx, payload, id, rec, exists, tx, e_1, v, rec2, err_2;
        var _b;
        if (loopMs === void 0) { loopMs = 200; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, queue.init()];
                case 1:
                    _c.sent();
                    consumer = "c-".concat(Math.random().toString(36).slice(2, 8));
                    console.log("\uD83D\uDE80 Worker started with consumer=".concat(consumer));
                    _c.label = 2;
                case 2: return [4 /*yield*/, drainRetries()];
                case 3:
                    _c.sent();
                    if (!breaker.isOpen) return [3 /*break*/, 5];
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 250); })];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 44];
                case 5:
                    batch = void 0;
                    _c.label = 6;
                case 6:
                    _c.trys.push([6, 8, , 10]);
                    return [4 /*yield*/, queue.readBatch(consumer, 32, 1000)];
                case 7:
                    batch = _c.sent();
                    return [3 /*break*/, 10];
                case 8:
                    err_1 = _c.sent();
                    console.error("❌ readBatch error:", err_1);
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, loopMs); })];
                case 9:
                    _c.sent();
                    return [3 /*break*/, 44];
                case 10:
                    if (!(!batch || !Array.isArray(batch) || batch.length === 0)) return [3 /*break*/, 12];
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, loopMs); })];
                case 11:
                    _c.sent();
                    return [3 /*break*/, 44];
                case 12:
                    entries = (_b = batch[0]) === null || _b === void 0 ? void 0 : _b[1];
                    if (!(!entries || !Array.isArray(entries) || entries.length === 0)) return [3 /*break*/, 14];
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, loopMs); })];
                case 13:
                    _c.sent();
                    return [3 /*break*/, 44];
                case 14:
                    _i = 0, entries_1 = entries;
                    _c.label = 15;
                case 15:
                    if (!(_i < entries_1.length)) return [3 /*break*/, 44];
                    _a = entries_1[_i], msgId = _a[0], fields = _a[1];
                    _c.label = 16;
                case 16:
                    _c.trys.push([16, 42, , 43]);
                    idIdx = fields.findIndex(function (v) { return v === "payload"; });
                    payload = idIdx >= 0 ? JSON.parse(fields[idIdx + 1]) : null;
                    id = (payload === null || payload === void 0 ? void 0 : payload.id) || fields[fields.findIndex(function (v) { return v === "id"; }) + 1];
                    metrics_js_1.jobsProcessed.inc();
                    return [4 /*yield*/, lock(id)];
                case 17:
                    if (!!(_c.sent())) return [3 /*break*/, 19];
                    return [4 /*yield*/, queue.ack(msgId)];
                case 18:
                    _c.sent();
                    return [3 /*break*/, 43];
                case 19:
                    _c.trys.push([19, , 38, 40]);
                    return [4 /*yield*/, state.initIfAbsent(id)];
                case 20:
                    rec = _c.sent();
                    return [4 /*yield*/, state.setStatus(id, "processing")];
                case 21:
                    _c.sent();
                    // ✅ DB -> processing
                    db_js_1.db.run("UPDATE transactions SET status = ? WHERE id = ?", ["processing", id]);
                    return [4 /*yield*/, posting.getById(id)];
                case 22:
                    exists = _c.sent();
                    if (!exists.exists) return [3 /*break*/, 25];
                    return [4 /*yield*/, state.setStatus(id, "completed")];
                case 23:
                    _c.sent();
                    metrics_js_1.jobsSucceeded.inc();
                    db_js_1.db.run("UPDATE transactions SET status = ?, completedAt = ? WHERE id = ?", ["completed", new Date().toISOString(), id]);
                    return [4 /*yield*/, queue.ack(msgId)];
                case 24:
                    _c.sent();
                    return [3 /*break*/, 43];
                case 25:
                    _c.trys.push([25, 28, , 37]);
                    tx = (payload === null || payload === void 0 ? void 0 : payload.amount)
                        ? payload
                        : { id: id, amount: 0, currency: "USD", timestamp: new Date().toISOString() };
                    return [4 /*yield*/, posting.post(tx)];
                case 26:
                    _c.sent();
                    breaker.markSuccess();
                    return [4 /*yield*/, state.setStatus(id, "completed")];
                case 27:
                    _c.sent();
                    metrics_js_1.jobsSucceeded.inc();
                    db_js_1.db.run("UPDATE transactions SET status = ?, completedAt = ? WHERE id = ?", ["completed", new Date().toISOString(), id]);
                    return [3 /*break*/, 37];
                case 28:
                    e_1 = _c.sent();
                    breaker.markFailure();
                    return [4 /*yield*/, posting.getById(id).catch(function () { return ({ exists: false }); })];
                case 29:
                    v = _c.sent();
                    if (!v.exists) return [3 /*break*/, 31];
                    return [4 /*yield*/, state.setStatus(id, "completed")];
                case 30:
                    _c.sent();
                    metrics_js_1.jobsSucceeded.inc();
                    db_js_1.db.run("UPDATE transactions SET status = ?, completedAt = ? WHERE id = ?", ["completed", new Date().toISOString(), id]);
                    return [3 /*break*/, 36];
                case 31: return [4 /*yield*/, state.incrAttempt(id)];
                case 32:
                    _c.sent();
                    return [4 /*yield*/, state.get(id)];
                case 33:
                    rec2 = _c.sent();
                    return [4 /*yield*/, scheduleRetry(id, (rec2 === null || rec2 === void 0 ? void 0 : rec2.attempts) || 1)];
                case 34:
                    _c.sent();
                    return [4 /*yield*/, state.setStatus(id, "pending", (e_1 === null || e_1 === void 0 ? void 0 : e_1.message) || "post failed")];
                case 35:
                    _c.sent();
                    metrics_js_1.jobsFailed.inc();
                    db_js_1.db.run("UPDATE transactions SET status = ?, error = ? WHERE id = ?", ["failed", (e_1 === null || e_1 === void 0 ? void 0 : e_1.message) || "post failed", id]);
                    _c.label = 36;
                case 36: return [3 /*break*/, 37];
                case 37: return [3 /*break*/, 40];
                case 38: return [4 /*yield*/, unlock(id)];
                case 39:
                    _c.sent();
                    return [7 /*endfinally*/];
                case 40: return [4 /*yield*/, queue.ack(msgId)];
                case 41:
                    _c.sent();
                    return [3 /*break*/, 43];
                case 42:
                    err_2 = _c.sent();
                    console.error("💥 Worker error:", err_2);
                    return [3 /*break*/, 43];
                case 43:
                    _i++;
                    return [3 /*break*/, 15];
                case 44: return [3 /*break*/, 2];
                case 45: return [2 /*return*/];
            }
        });
    });
}
