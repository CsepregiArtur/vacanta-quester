/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cache Service — in-memory cache with Redis-ready interface
 * ============================================================
 * 
 * Pentru 1-10000 utilizatori: cache în memorie (fără Redis).
 * Când crești, înlocuiești implementarea cu Redis fără să schimbi API-ul.
 * 
 * Strategii:
 *   - TTL per cheie
 *   - LRU eviction (elimină cel mai vechi element la depășire)
 *   - Tagging (șterge toate cheile dintr-un grup)
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

export class CacheService {
  private store = new Map<string, CacheEntry<any>>();
  private maxEntries: number;

  constructor(maxEntries = 5000) {
    this.maxEntries = maxEntries;
  }

  /**
   * Salvează o valoare în cache.
   */
  set<T>(key: string, value: T, ttlMs = 60_000, tags: string[] = []): void {
    this.evictExpired();

    // LRU: șterge cea mai veche intrare dacă am depășit limita
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      tags,
    });
  }

  /**
   * Citește o valoare din cache.
   * Returnează null dacă nu există sau a expirat.
   */
  get<T>(key: string): T | null {
    this.evictExpired();
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /**
   * Șterge o cheie din cache.
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Șterge toate cheile care au un anumit tag.
   * Util: invalidare cache pe categorii (ex: "family:family-123")
   */
  invalidateByTag(tag: string): void {
    for (const [key, entry] of this.store) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Șterge tot cache-ul.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Returnează numărul de intrări active.
   */
  get size(): number {
    this.evictExpired();
    return this.store.size;
  }

  /**
   * Evictează intrările expirate.
   */
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Returnează statistici despre cache.
   */
  getStats(): { size: number; maxEntries: number; keys: string[] } {
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      keys: Array.from(this.store.keys()),
    };
  }
}

// Singleton
export const cache = new CacheService();
