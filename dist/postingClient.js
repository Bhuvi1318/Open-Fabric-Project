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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostingClient = void 0;
var axios_1 = require("axios");
var config_js_1 = require("./config.js");
var PostingClient = /** @class */ (function () {
    function PostingClient() {
        this.base = config_js_1.config.postingBaseUrl;
    }
    PostingClient.prototype.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var r, e_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get("".concat(this.base, "/transactions/").concat(id), { timeout: 12000 })];
                    case 1:
                        r = _b.sent();
                        return [2 /*return*/, { exists: r.status === 200, data: r.data }];
                    case 2:
                        e_1 = _b.sent();
                        if (((_a = e_1 === null || e_1 === void 0 ? void 0 : e_1.response) === null || _a === void 0 ? void 0 : _a.status) === 404)
                            return [2 /*return*/, { exists: false }];
                        throw e_1; // network or 5xx
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PostingClient.prototype.post = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, r;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        payload = {
                            id: tx.id,
                            amount: Number((_a = tx.amount) !== null && _a !== void 0 ? _a : 0),
                            currency: String((_b = tx.currency) !== null && _b !== void 0 ? _b : 'USD'),
                            timestamp: (_c = tx.timestamp) !== null && _c !== void 0 ? _c : new Date().toISOString(),
                            description: (_d = tx.description) !== null && _d !== void 0 ? _d : '',
                            metadata: (_e = tx.metadata) !== null && _e !== void 0 ? _e : {}
                        };
                        return [4 /*yield*/, axios_1.default.post("".concat(this.base, "/transactions"), payload, {
                                headers: { 'Content-Type': 'application/json' },
                                timeout: 15000
                            })];
                    case 1:
                        r = _f.sent();
                        return [2 /*return*/, r.data];
                }
            });
        });
    };
    PostingClient.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, axios_1.default.post("".concat(this.base, "/cleanup"))];
            });
        });
    };
    return PostingClient;
}());
exports.PostingClient = PostingClient;
