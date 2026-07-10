/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Metrics Service — custom metrics enterprise
 * =============================================
 * 
 * Metrici operaționale in plus față de Prometheus de bază:
 *   - Average Sync Time
 *   - Average AI Time
 *   - Queue Size / Retry Count
 *   - Postgres Connections
 *   - Memory / CPU
 */

// ─── In-memory metric store ─────────────────────────────────────────
interface MetricSample {
  value: number;
  timestamp: number;
}

const MAX_SAMPLES = 1000;

class MetricStore {
  private data: Record<string, MetricSample[]> = {};

  record(name: string, value: number): void {
    if (!this.data[name]) this.data[name] = [];
    this.data[name].push({ value, timestamp: Date.now() });
    if (this.data[name].length > MAX_SAMPLES) {
      this.data[name] = this.data[name].slice(-MAX_SAMPLES);
    }
  }

  average(name: string, windowMs = 300_000): number {
    const samples = this.data[name] || [];
    const cutoff = Date.now() - windowMs;
    const recent = samples.filter(s => s.timestamp >= cutoff);
    if (recent.length === 0) return 0;
    return recent.reduce((sum, s) => sum + s.value, 0) / recent.length;
  }

  latest(name: string): number | null {
    const samples = this.data[name] || [];
    return samples.length > 0 ? samples[samples.length - 1].value : null;
  }

  count(name: string, windowMs = 300_000): number {
    const cutoff = Date.now() - windowMs;
    return (this.data[name] || []).filter(s => s.timestamp >= cutoff).length;
  }

  getAll(): Record<string, { avg: number; latest: number | null; count: number }> {
    const result: Record<string, any> = {};
    for (const name of Object.keys(this.data)) {
      result[name] = {
        avg: Math.round(this.average(name) * 100) / 100,
        latest: this.latest(name),
        count: this.count(name),
      };
    }
    return result;
  }
}

export const metricsStore = new MetricStore();

// ─── Convenience wrappers ───────────────────────────────────────────

export function recordSyncTime(ms: number): void {
  metricsStore.record('sync_time', ms);
}

export function recordAiTime(ms: number): void {
  metricsStore.record('ai_time', ms);
}

export function recordQueueSize(size: number): void {
  metricsStore.record('queue_size', size);
}

export function recordRetryCount(count: number): void {
  metricsStore.record('retry_count', count);
}

export function recordMemoryUsage(): void {
  const usage = process.memoryUsage();
  metricsStore.record('memory_rss', usage.rss / 1024 / 1024); // MB
  metricsStore.record('memory_heap_total', usage.heapTotal / 1024 / 1024);
  metricsStore.record('memory_heap_used', usage.heapUsed / 1024 / 1024);
}

export function recordCpuUsage(): void {
  const usage = process.cpuUsage();
  metricsStore.record('cpu_user', usage.user / 1000); // ms
  metricsStore.record('cpu_system', usage.system / 1000);
}

/**
 * Returnează toate metricile formatate pentru dashboard.
 */
export function getDashboardMetrics(): Record<string, any> {
  return {
    ...metricsStore.getAll(),
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
    },
    uptime: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
  };
}
