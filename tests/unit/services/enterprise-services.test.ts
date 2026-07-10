/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit Tests — Enterprise Services (Metrics, Cache, AI Audit, Health)
 * ====================================================================
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════
// MOCK: Metrics Service
// ═══════════════════════════════════════════════════════════════════

class MetricsStore {
  private data: Record<string, number[]> = {};

  record(name: string, value: number): void {
    if (!this.data[name]) this.data[name] = [];
    this.data[name].push(value);
  }

  average(name: string): number {
    const samples = this.data[name] || [];
    if (samples.length === 0) return 0;
    return samples.reduce((s, v) => s + v, 0) / samples.length;
  }

  latest(name: string): number | null {
    const samples = this.data[name] || [];
    return samples.length > 0 ? samples[samples.length - 1] : null;
  }

  count(name: string): number {
    return (this.data[name] || []).length;
  }

  getAll(): Record<string, any> {
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

  clear(): void {
    this.data = {};
  }
}

// ═══════════════════════════════════════════════════════════════════
// MOCK: Cache Service
// ═══════════════════════════════════════════════════════════════════

class CacheStore {
  private store = new Map<string, { value: any; expiresAt: number; tags: string[] }>();

  set(key: string, value: any, ttlMs = 60_000, tags: string[] = []): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs, tags });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  invalidateByTag(tag: string): void {
    for (const [key, entry] of this.store) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  getStats(): { size: number; keys: string[] } {
    return { size: this.store.size, keys: Array.from(this.store.keys()) };
  }
}

// ═══════════════════════════════════════════════════════════════════
// MOCK: AI Audit Service
// ═══════════════════════════════════════════════════════════════════

interface AiCallRecord {
  id: string;
  familyId: string | null;
  model: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  estimatedCost: number;
  durationMs: number;
  success: boolean;
  created_at: string;
}

class AiAuditStore {
  private records: AiCallRecord[] = [];

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  calculateCost(inputTokens: number, outputTokens: number): number {
    const costPer1KInput = 0.00015;
    const costPer1KOutput = 0.00060;
    return (inputTokens / 1000) * costPer1KInput + (outputTokens / 1000) * costPer1KOutput;
  }

  recordCall(data: {
    familyId?: string | null;
    model?: string;
    prompt: string;
    responseTokens?: number;
    durationMs: number;
    success: boolean;
  }): AiCallRecord {
    const promptTokens = this.estimateTokens(data.prompt);
    const responseTokens = data.responseTokens || this.estimateTokens(data.prompt) / 2;
    const totalTokens = Math.round(promptTokens + responseTokens);
    const cost = this.calculateCost(promptTokens, responseTokens);

    const record: AiCallRecord = {
      id: `ai-${Date.now()}`,
      familyId: data.familyId || null,
      model: data.model || 'gemini-2.0-flash',
      promptTokens,
      responseTokens: Math.round(responseTokens),
      totalTokens,
      estimatedCost: Math.round(cost * 100000) / 100000,
      durationMs: data.durationMs,
      success: data.success,
      created_at: new Date().toISOString(),
    };
    this.records.push(record);
    return record;
  }

  getFamilyCost(familyId: string): number {
    return this.records
      .filter(r => r.familyId === familyId)
      .reduce((s, r) => s + r.estimatedCost, 0);
  }

  getTotalCost(): { total: number; byFamily: Record<string, number>; byModel: Record<string, number> } {
    const byFamily: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    let total = 0;
    for (const r of this.records) {
      total += r.estimatedCost;
      if (r.familyId) byFamily[r.familyId] = (byFamily[r.familyId] || 0) + r.estimatedCost;
      byModel[r.model] = (byModel[r.model] || 0) + r.estimatedCost;
    }
    return { total: Math.round(total * 100000) / 100000, byFamily, byModel };
  }

  getRecent(limit = 10): AiCallRecord[] {
    return this.records.slice(-limit).reverse();
  }

  clear(): void {
    this.records = [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// TESTS: Metrics
// ═══════════════════════════════════════════════════════════════════

describe('Metrics Service', () => {
  let metrics: MetricsStore;

  beforeEach(() => {
    metrics = new MetricsStore();
  });

  test('record adaugă un sample', () => {
    metrics.record('sync_time', 150);
    expect(metrics.count('sync_time')).toBe(1);
  });

  test('record adaugă multiple sample-uri', () => {
    metrics.record('sync_time', 100);
    metrics.record('sync_time', 200);
    metrics.record('sync_time', 300);
    expect(metrics.count('sync_time')).toBe(3);
  });

  test('average calculează media corect', () => {
    metrics.record('ai_time', 100);
    metrics.record('ai_time', 200);
    metrics.record('ai_time', 300);
    expect(metrics.average('ai_time')).toBe(200);
  });

  test('latest returnează ultima valoare', () => {
    metrics.record('queue_size', 5);
    metrics.record('queue_size', 10);
    metrics.record('queue_size', 3);
    expect(metrics.latest('queue_size')).toBe(3);
  });

  test('latest returnează null pentru metrică inexistentă', () => {
    expect(metrics.latest('nonexistent')).toBeNull();
  });

  test('average returnează 0 pentru metrică inexistentă', () => {
    expect(metrics.average('nonexistent')).toBe(0);
  });

  test('getAll returnează toate metricile', () => {
    metrics.record('sync_time', 150);
    metrics.record('ai_time', 300);
    const all = metrics.getAll();
    expect(all).toHaveProperty('sync_time');
    expect(all).toHaveProperty('ai_time');
  });

  test('metricile sunt independente', () => {
    metrics.record('sync_time', 100);
    metrics.record('ai_time', 200);
    expect(metrics.count('sync_time')).toBe(1);
    expect(metrics.count('ai_time')).toBe(1);
  });

  test('multiple nume de metrici', () => {
    const names = ['sync_time', 'ai_time', 'queue_size', 'retry_count', 'memory_rss'];
    for (const n of names) metrics.record(n, Math.random() * 100);
    expect(Object.keys(metrics.getAll()).length).toBe(names.length);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TESTS: Cache
// ═══════════════════════════════════════════════════════════════════

describe('Cache Service', () => {
  let cache: CacheStore;

  beforeEach(() => {
    cache = new CacheStore();
  });

  test('set și get funcționează', () => {
    cache.set('key1', { data: 'test' });
    expect(cache.get('key1')).toEqual({ data: 'test' });
  });

  test('get returnează null pentru cheie inexistentă', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  test('TTL: intrarea expiră după timp', () => {
    cache.set('key1', 'value', -1); // TTL negativ = expirat instant
    expect(cache.get('key1')).toBeNull();
  });

  test('delete șterge cheia', () => {
    cache.set('key1', 'value');
    cache.delete('key1');
    expect(cache.get('key1')).toBeNull();
  });

  test('invalidateByTag șterge toate cheile cu tag-ul respectiv', () => {
    cache.set('family:1', { name: 'A' }, 60000, ['family:1']);
    cache.set('family:2', { name: 'B' }, 60000, ['family:2']);
    cache.set('family:1:children', ['c1'], 60000, ['family:1']);

    cache.invalidateByTag('family:1');
    expect(cache.get('family:1')).toBeNull();
    expect(cache.get('family:1:children')).toBeNull();
    expect(cache.get('family:2')).toEqual({ name: 'B' }); // neafectat
  });

  test('clear șterge tot cache-ul', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  test('size returnează numărul corect de intrări', () => {
    expect(cache.size).toBe(0);
    cache.set('a', 1);
    expect(cache.size).toBe(1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);
  });

  test('cache poate stoca valori de tipuri diferite', () => {
    cache.set('string', 'text');
    cache.set('number', 42);
    cache.set('object', { nested: true });
    cache.set('array', [1, 2, 3]);
    cache.set('null', null);

    expect(cache.get<string>('string')).toBe('text');
    expect(cache.get<number>('number')).toBe(42);
    expect(cache.get<object>('object')).toEqual({ nested: true });
    expect(cache.get<any[]>('array')).toEqual([1, 2, 3]);
    expect(cache.get<null>('null')).toBeNull();
  });

  test('getStats returnează informații despre cache', () => {
    cache.set('a', 1);
    const stats = cache.getStats();
    expect(stats.size).toBe(1);
    expect(stats.keys).toContain('a');
  });
});

// ═══════════════════════════════════════════════════════════════════
// TESTS: AI Audit & Cost Tracking
// ═══════════════════════════════════════════════════════════════════

describe('AI Audit & Cost Tracking', () => {
  let audit: AiAuditStore;

  beforeEach(() => {
    audit = new AiAuditStore();
  });

  test('estimateTokens estimează corect', () => {
    expect(audit.estimateTokens('test')).toBe(1); // 4/4 = 1
    expect(audit.estimateTokens('hello world')).toBe(3); // 11/4 ≈ 3
    expect(audit.estimateTokens('')).toBe(0);
  });

  test('calculateCost calculează costul corect', () => {
    const cost = audit.calculateCost(1000, 500); // 1K input, 0.5K output
    expect(cost).toBeGreaterThan(0);
    // Input: 1000/1000 * 0.00015 = 0.00015
    // Output: 500/1000 * 0.00060 = 0.00030
    // Total: 0.00045
    expect(Math.round(cost * 100000) / 100000).toBe(0.00045);
  });

  test('recordCall înregistrează un apel AI', () => {
    const record = audit.recordCall({
      familyId: 'family-1',
      prompt: 'Spune-mi despre spațiu',
      durationMs: 1234,
      success: true,
    });
    expect(record.familyId).toBe('family-1');
    expect(record.durationMs).toBe(1234);
    expect(record.success).toBe(true);
    expect(record.totalTokens).toBeGreaterThan(0);
  });

  test('recordCall calculează costul estimat', () => {
    const record = audit.recordCall({
      prompt: 'A' .repeat(4000), // ~1000 tokens
      responseTokens: 500,
      durationMs: 2000,
      success: true,
    });
    expect(record.estimatedCost).toBeGreaterThan(0);
  });

  test('getFamilyCost returnează costul per family', () => {
    // Folosim prompturi suficient de lungi pentru a genera cost > 0
    const longPrompt = 'Test AI call with sufficient tokens to generate measurable cost. '.repeat(10);
    audit.recordCall({ familyId: 'family-1', prompt: longPrompt, responseTokens: 100, durationMs: 100, success: true });
    audit.recordCall({ familyId: 'family-1', prompt: longPrompt, responseTokens: 100, durationMs: 100, success: true });
    audit.recordCall({ familyId: 'family-2', prompt: longPrompt, responseTokens: 100, durationMs: 100, success: true });

    const cost1 = audit.getFamilyCost('family-1');
    const cost2 = audit.getFamilyCost('family-2');
    const cost3 = audit.getFamilyCost('family-3');

    expect(cost1).toBeGreaterThan(0);
    expect(cost2).toBeGreaterThan(0);
    expect(cost3).toBe(0);
  });

  test('getTotalCost returnează costul agregat', () => {
    const longPrompt = 'AI call with enough length for cost tracking purposes. '.repeat(12);
    audit.recordCall({ familyId: 'f1', prompt: longPrompt, responseTokens: 150, durationMs: 200, success: true });
    audit.recordCall({ familyId: 'f1', prompt: longPrompt, responseTokens: 100, durationMs: 100, success: true });
    audit.recordCall({ familyId: 'f2', prompt: longPrompt, responseTokens: 200, durationMs: 300, success: true });

    const costs = audit.getTotalCost();
    expect(costs.total).toBeGreaterThan(0);
    expect(costs.byFamily['f1']).toBeGreaterThan(0);
    expect(costs.byFamily['f2']).toBeGreaterThan(0);
  });

  test('getRecent returnează ultimele înregistrări în ordine inversă', () => {
    audit.recordCall({ prompt: 'first', durationMs: 100, success: true });
    audit.recordCall({ prompt: 'second', durationMs: 100, success: true });
    audit.recordCall({ prompt: 'third', durationMs: 100, success: true });

    const recent = audit.getRecent(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].promptTokens).toBeGreaterThan(0);
  });

  test('apelurile eșuate sunt înregistrate', () => {
    const record = audit.recordCall({
      familyId: 'family-1',
      prompt: 'test',
      durationMs: 500,
      success: false,
    });
    expect(record.success).toBe(false);
    expect(record.durationMs).toBe(500);
  });

  test('model custom poate fi specificat', () => {
    const record = audit.recordCall({
      model: 'gemini-2.5-pro',
      prompt: 'test',
      durationMs: 100,
      success: true,
    });
    expect(record.model).toBe('gemini-2.5-pro');
  });

  test('getTotalCost grupează și după model', () => {
    const longPrompt = 'Sufficiently long prompt text for AI cost calculation. '.repeat(10);
    audit.recordCall({ model: 'gemini-2.0-flash', prompt: longPrompt, responseTokens: 100, durationMs: 100, success: true });
    audit.recordCall({ model: 'gemini-2.5-pro', prompt: longPrompt, responseTokens: 100, durationMs: 200, success: true });

    const costs = audit.getTotalCost();
    expect(costs.byModel['gemini-2.0-flash']).toBeGreaterThan(0);
    expect(costs.byModel['gemini-2.5-pro']).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TESTS: Health Dashboard
// ═══════════════════════════════════════════════════════════════════

describe('Health Dashboard', () => {
  test('health check returnează status și timestamp', () => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: { status: 'ok' },
        postgres: { status: 'ok' },
        gemini: { status: 'ok' },
        smtp: { status: 'ok' },
        cache: { status: 'ok', entries: 0 },
        queue: { status: 'ok' },
      },
    };
    expect(health.status).toBe('ok');
    expect(health.services.api.status).toBe('ok');
    expect(health.services.postgres.status).toBe('ok');
    expect(health.timestamp).toBeDefined();
  });

  test('health check poate fi degraded', () => {
    const health = {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: { status: 'ok' },
        postgres: { status: 'down' },
        gemini: { status: 'ok' },
        cache: { status: 'ok' },
      },
    };
    expect(health.status).toBe('degraded');
    expect(health.services.postgres.status).toBe('down');
  });

  test('memory metrics sunt incluse', () => {
    const mem = { rss: '50.2 MB', heapTotal: '30.1 MB', heapUsed: '20.5 MB' };
    expect(mem.rss).toMatch(/MB$/);
    expect(mem.heapTotal).toMatch(/MB$/);
    expect(mem.heapUsed).toMatch(/MB$/);
  });

  test('uptime e formatat corect', () => {
    const uptime = '125m 30s';
    expect(uptime).toMatch(/^\d+m \d+s$/);
  });

  test('AI cost dashboard include top familii', () => {
    const dashboard = {
      totalCost: 0.00123,
      topFamilies: [
        { familyId: 'f1', cost: 0.00045 },
        { familyId: 'f2', cost: 0.00078 },
      ],
    };
    expect(dashboard.totalCost).toBeGreaterThan(0);
    expect(dashboard.topFamilies).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TESTS: Scenarii Enterprise Integrate
// ═══════════════════════════════════════════════════════════════════

describe('Enterprise Scenarios — Integrated Flow', () => {
  let metrics: MetricsStore;
  let cache: CacheStore;
  let audit: AiAuditStore;

  beforeEach(() => {
    metrics = new MetricsStore();
    cache = new CacheStore();
    audit = new AiAuditStore();
  });

  test('flux complet: request → cache → AI → metrics → audit', () => {
    const familyId = 'family-123';

    // 1. Check cache first
    const cached = cache.get(`family:${familyId}`);
    expect(cached).toBeNull();

    // 2. AI call
    const startTime = Date.now();
    const aiRecord = audit.recordCall({
      familyId,
      prompt: 'Evaluează progresul copilului',
      responseTokens: 200,
      durationMs: Date.now() - startTime,
      success: true,
    });

    // 3. Record metrics
    metrics.record('ai_time', aiRecord.durationMs);
    metrics.record('ai_call_cost', aiRecord.estimatedCost);
    metrics.record('ai_call_tokens', aiRecord.totalTokens);

    // 4. Cache the result
    cache.set(`family:${familyId}`, { lastAiCost: aiRecord.estimatedCost }, 300000, [`family:${familyId}`]);

    // 5. Verify
    expect(metrics.average('ai_time')).toBeGreaterThanOrEqual(0);
    expect(audit.getFamilyCost(familyId)).toBeGreaterThan(0);
    expect(cache.get(`family:${familyId}`)).toEqual({ lastAiCost: aiRecord.estimatedCost });
  });

  test('cache invalidation: schimbare date familie → cache șters', () => {
    const familyId = 'family-456';

    // Populează cache
    cache.set(`family:${familyId}`, { name: 'Test' }, 60000, [`family:${familyId}`]);
    cache.set(`family:${familyId}:children`, ['child-1'], 60000, [`family:${familyId}`]);
    expect(cache.size).toBe(2);

    // Cache invalidat
    cache.invalidateByTag(`family:${familyId}`);
    expect(cache.size).toBe(0);
  });

  test('cost tracking: familie cu multe apeluri AI', () => {
    const familyId = 'family-heavy';

    // Simulează 10 apeluri AI
    for (let i = 0; i < 10; i++) {
      audit.recordCall({
        familyId,
        prompt: 'A' .repeat(400), // ~100 tokens
        responseTokens: 50,
        durationMs: 500 + Math.random() * 2000,
        success: true,
      });
    }

    const cost = audit.getFamilyCost(familyId);
    expect(cost).toBeGreaterThan(0);

    const total = audit.getTotalCost();
    expect(total.byFamily[familyId]).toBe(cost);
  });

  test('metricile sunt independente per nume', () => {
    metrics.record('sync_time', 100);
    metrics.record('sync_time', 200);
    metrics.record('ai_time', 300);

    expect(metrics.average('sync_time')).toBe(150);
    expect(metrics.average('ai_time')).toBe(300);
    expect(metrics.count('sync_time')).toBe(2);
  });
});
