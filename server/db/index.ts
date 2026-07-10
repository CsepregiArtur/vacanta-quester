/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PostgreSQL Database Service
 * ============================
 * Conexiune centralizată, pool de conexiuni, query helpers.
 */

import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || "127.0.0.1",
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || "vq_proiect",
  user: process.env.PGUSER || "app_user_vq",
  password: process.env.PGPASSWORD || "vq_secret_2026",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Pool error handler — silent (userul nu trebuie să vadă probleme de conexiune)
pool.on("error", () => {
  // PG indisponibil — se folosește JSON fallback fără zgomot
});

/**
 * Verifică rapid dacă PostgreSQL e disponibil.
 * Folosește un client direct cu timeout scurt — nu așteaptă retry-urile pool-ului.
 */
let pgAvailable = false;

export async function checkPostgresHealth(): Promise<boolean> {
  if (pgAvailable) return true;
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    pgAvailable = true;
    return true;
  } catch {
    pgAvailable = false;
    return false;
  }
}

export function isPostgresAvailable(): boolean {
  return pgAvailable;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    console.warn(`[DB] Slow query (${duration}ms): ${text.substring(0, 80)}`);
  }
  return result;
}

export async function transaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function initDatabase(): Promise<void> {
  // Verifică rapid disponibilitatea PostgreSQL
  const isAvailable = await checkPostgresHealth();
  if (!isAvailable) {
    pgAvailable = false;
    throw new Error("PostgreSQL indisponibil — se folosește JSON fallback");
  }

  const tables = [
    `CREATE TABLE IF NOT EXISTS families (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      dog_walk_enabled BOOLEAN NOT NULL DEFAULT false,
      dog_walk_windows JSONB NOT NULL DEFAULT '{"morning":{"start":6,"end":12},"midday":{"start":11,"end":17},"evening":{"start":16,"end":22}}',
      home_assistant_config JSONB NOT NULL DEFAULT '{}',
      smtp_config JSONB NOT NULL DEFAULT '{}',
      subscription_type VARCHAR(50) NOT NULL DEFAULT 'free',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS parents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      pin_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS children (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      avatar VARCHAR(10) NOT NULL DEFAULT '🐶',
      birth_year INTEGER NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      reading_streak INTEGER NOT NULL DEFAULT 0,
      days_since_last_reading INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL DEFAULT 'chore',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      points INTEGER NOT NULL DEFAULT 0,
      photo_url TEXT,
      ai_feedback TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )`,
    `CREATE TABLE IF NOT EXISTS rewards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      cost_points INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      icon VARCHAR(10) NOT NULL DEFAULT '🎁',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS point_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS reading_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      topic VARCHAR(255) NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS sync_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      action VARCHAR(100) NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      next_retry_at TIMESTAMPTZ,
      last_error TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      device_id VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_retry ON sync_queue(status, next_retry_at) WHERE status = 'pending'`,
    `CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      device_id VARCHAR(255) NOT NULL,
      device_name VARCHAR(255),
      platform VARCHAR(50) DEFAULT 'web',
      last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(family_id, device_id)
    )`,
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID REFERENCES families(id) ON DELETE SET NULL,
      child_id UUID REFERENCES children(id) ON DELETE SET NULL,
      event_name VARCHAR(100) NOT NULL,
      properties JSONB NOT NULL DEFAULT '{}',
      source VARCHAR(50) NOT NULL DEFAULT 'web',
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_family ON analytics_events(family_id)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at)`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID REFERENCES families(id) ON DELETE SET NULL,
      parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
      child_id UUID REFERENCES children(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(255),
      old_values JSONB,
      new_values JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_audit_log_family ON audit_log(family_id, created_at)`,
  ];

  for (const sql of tables) {
    try {
      await query(sql);
    } catch (err: any) {
      console.error("[DB] Init error:", err.message);
    }
  }
  console.log("[DB] Database schema initialized");
}

export default pool;
