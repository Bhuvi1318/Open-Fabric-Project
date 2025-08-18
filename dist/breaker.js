"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
var config_js_1 = require("./config.js");
var CircuitBreaker = /** @class */ (function () {
    function CircuitBreaker() {
        this.failures = []; // timestamps in ms
        this.successes = [];
        this.openedAt = 0;
    }
    Object.defineProperty(CircuitBreaker.prototype, "isOpen", {
        get: function () {
            if (this.openedAt === 0)
                return false;
            if (Date.now() - this.openedAt > config_js_1.config.breakerOpenSec * 1000) {
                this.openedAt = 0;
                this.failures = [];
                this.successes = [];
                return false;
            }
            return true;
        },
        enumerable: false,
        configurable: true
    });
    CircuitBreaker.prototype.markSuccess = function () {
        this.successes.push(Date.now());
        this.trim();
    };
    CircuitBreaker.prototype.markFailure = function () {
        this.failures.push(Date.now());
        this.trim();
    };
    CircuitBreaker.prototype.trim = function () {
        var cutoff = Date.now() - config_js_1.config.breakerWindowSec * 1000;
        this.failures = this.failures.filter(function (t) { return t >= cutoff; });
        this.successes = this.successes.filter(function (t) { return t >= cutoff; });
        var total = this.failures.length + this.successes.length;
        var rate = total === 0 ? 0 : this.failures.length / total;
        if (total >= 10 && rate >= config_js_1.config.breakerFailRate) {
            this.openedAt = Date.now();
        }
    };
    CircuitBreaker.prototype.summary = function () {
        var total = this.failures.length + this.successes.length;
        var rate = total === 0 ? 0 : this.failures.length / total;
        return { isOpen: this.isOpen, failures: this.failures.length, successes: this.successes.length, rate: rate };
    };
    return CircuitBreaker;
}());
exports.CircuitBreaker = CircuitBreaker;
