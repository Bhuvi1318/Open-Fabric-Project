import { config } from './config.js';

export class CircuitBreaker {
  private failures: number[] = []; // timestamps in ms
  private successes: number[] = [];
  private openedAt = 0;

  get isOpen() {
    if (this.openedAt === 0) return false;
    if (Date.now() - this.openedAt > config.breakerOpenSec * 1000) {
      this.openedAt = 0;
      this.failures = [];
      this.successes = [];
      return false;
    }
    return true;
  }

  markSuccess() {
    this.successes.push(Date.now());
    this.trim();
  }

  markFailure() {
    this.failures.push(Date.now());
    this.trim();
  }

  private trim() {
    const cutoff = Date.now() - config.breakerWindowSec * 1000;
    this.failures = this.failures.filter(t => t >= cutoff);
    this.successes = this.successes.filter(t => t >= cutoff);
    const total = this.failures.length + this.successes.length;
    const rate = total === 0 ? 0 : this.failures.length / total;
    if (total >= 10 && rate >= config.breakerFailRate) {
      this.openedAt = Date.now();
    }
  }

  summary() {
    const total = this.failures.length + this.successes.length;
    const rate = total === 0 ? 0 : this.failures.length / total;
    return { isOpen: this.isOpen, failures: this.failures.length, successes: this.successes.length, rate };
  }
}
