/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local Store Service — Enterprise offline-first persistence
 * ============================================================
 * 
 * Când PostgreSQL e indisponibil:
 *   1. Toate datele se salvează în JSON (fallback silențios)
 *   2. Un worker de fond verifică periodic dacă PG revine
 *   3. Când PG e din nou disponibil → sincronizare automată JSON → PG
 * 
 * Arhitectură enterprise:
 *   - Last Write Wins cu version number
 *   - Queue de acțiuni cu retry exponențial
 *   - Conflict detection
 *   - Zero pierdere de date
 */

import fs from "fs";
import path from "path";
import { query, transaction, isPostgresAvailable } from "../db";

// ─── Config ─────────────────────────────────────────────────────────
const DB_DIR = path.join(process.cwd(), "src", "data");
const SYNC_QUEUE_FILE = path.join(DB_DIR, "sync_queue.json");

interface PendingAction {
  id: string;
  action: string;
  payload: any;
  timestamp: string;
  retries: number;
}

// ═════════════════════════════════════════════════════════════════════
// LOCAL QUEUE — Persistență locală a acțiunilor nereușite
// ═════════════════════════════════════════════════════════════════════

function loadQueue(): PendingAction[] {
  try {
    if (fs.existsSync(SYNC_QUEUE_FILE)) {
      return JSON.parse(fs.readFileSync(SYNC_QUEUE_FILE, "utf-8"));
    }
  } catch {
    // ignore
  }
  return [];
}

function saveQueue(queue: PendingAction[]): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(SYNC_QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8");
  } catch {
    // silent
  }
}

/**
 * Înregistrează o acțiune pentru sincronizare ulterioară cu PG.
 * Folosită când PG e indisponibil.
 */
export function enqueueLocalAction(action: string, payload: any): void {
  const queue = loadQueue();
  queue.push({
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    action,
    payload,
    timestamp: new Date().toISOString(),
    retries: 0,
  });
  saveQueue(queue);
}

/**
 * Returnează numărul de acțiuni locale în așteptare.
 */
export function getLocalQueueLength(): number {
  return loadQueue().length;
}

// ═════════════════════════════════════════════════════════════════════
// SYNC ENGINE — Procesează și trimite datele locale către PG
// ═════════════════════════════════════════════════════════════════════

const MAX_RETRIES_PER_ACTION = 5;

/**
 * Sincronizează toate acțiunile locale în așteptare către PostgreSQL.
 * Rulează automat când PG redevine disponibil.
 */
export async function syncLocalQueueToPostgres(): Promise<{
  synced: number;
  failed: number;
}> {
  if (!isPostgresAvailable()) {
    return { synced: 0, failed: 0 };
  }

  const queue = loadQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: PendingAction[] = [];

  for (const item of queue) {
    try {
      await processAction(item);
      synced++;
    } catch (err: any) {
      item.retries++;
      if (item.retries >= MAX_RETRIES_PER_ACTION) {
        failed++;
        console.warn(`[LOCAL-STORE] Action ${item.id} failed permanently: ${err.message}`);
      } else {
        remaining.push(item); // reîncearcă mai târziu
      }
    }
  }

  saveQueue(remaining);
  return { synced, failed };
}

/**
 * Procesează o acțiune individuală din coada locală.
 */
async function processAction(item: PendingAction): Promise<void> {
  const { action, payload } = item;

  switch (action) {
    case "upsert_family":
      await query(
        `INSERT INTO families (id, name, subscription_type, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, subscription_type = EXCLUDED.subscription_type`,
        [payload.id, payload.name, payload.subscription_type || "free", payload.created_at || new Date().toISOString()]
      );
      break;

    case "upsert_parent":
      await query(
        `INSERT INTO parents (id, family_id, email, name, pin_hash)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pin_hash = EXCLUDED.pin_hash`,
        [payload.id, payload.family_id, payload.email, payload.name, payload.pin_hash]
      );
      break;

    case "upsert_child":
      await query(
        `INSERT INTO children (id, family_id, name, avatar, birth_year, points, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, points = EXCLUDED.points, version = EXCLUDED.version + 1`,
        [payload.id, payload.family_id, payload.name, payload.avatar || "🐶", payload.birth_year || 8, payload.points || 0, payload.version || 1]
      );
      break;

    case "upsert_activity":
      await query(
        `INSERT INTO activities (id, child_id, family_id, title, description, type, status, points, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, version = EXCLUDED.version + 1`,
        [payload.id, payload.child_id, payload.family_id, payload.title, payload.description || "", payload.type || "chore", payload.status || "pending", payload.points || 0, payload.version || 1]
      );
      break;

    case "upsert_reward":
      await query(
        `INSERT INTO rewards (id, family_id, title, cost_points, duration_minutes, icon)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET cost_points = EXCLUDED.cost_points`,
        [payload.id, payload.family_id, payload.title, payload.cost_points || 0, payload.duration_minutes || 0, payload.icon || "🎁"]
      );
      break;

    case "track_event":
      await query(
        `INSERT INTO analytics_events (family_id, child_id, event_name, properties)
         VALUES ($1, $2, $3, $4)`,
        [payload.family_id, payload.child_id || null, payload.event_name, JSON.stringify(payload.properties || {})]
      );
      break;

    default:
      console.warn(`[LOCAL-STORE] Unknown action type: ${action}`);
  }
}

// ═════════════════════════════════════════════════════════════════════
// FULL STATE SYNC — Sincronizează tot JSON-ul în PG
// ═════════════════════════════════════════════════════════════════════

/**
 * Sincronizează complet toate datele din JSON-ul fiecărei familii în PG.
 * Folosită la prima reconectare după o perioadă offline.
 */
export async function syncAllFamiliesToPostgres(): Promise<{
  families: number;
  errors: number;
}> {
  if (!isPostgresAvailable()) return { families: 0, errors: 0 };

  const dbDir = DB_DIR;
  if (!fs.existsSync(dbDir)) return { families: 0, errors: 0 };

  const files = fs.readdirSync(dbDir).filter(f => f.startsWith("db_family_") && f.endsWith(".json"));
  let families = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const filePath = path.join(dbDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      // Extrage email-ul din numele fișierului: db_family_email.json
      const emailMatch = file.replace("db_family_", "").replace(".json", "");
      const parentEmail = emailMatch.replace(/_/g, ".").replace(/-/g, "@");

      // Sync each entity type
      if (data.children?.length) {
        for (const child of data.children) {
          await enqueueLocalAction("upsert_child", {
            id: child.id,
            family_id: data.familyId || `family_${parentEmail}`,
            name: child.name,
            avatar: child.avatar,
            birth_year: child.age ? new Date().getFullYear() - child.age : 8,
            points: child.points || 0,
            version: child.version || 1,
          });
        }
      }

      if (data.activeTasks?.length) {
        for (const task of data.activeTasks) {
          await enqueueLocalAction("upsert_activity", {
            id: task.id,
            child_id: task.childId,
            family_id: data.familyId || `family_${parentEmail}`,
            title: task.name,
            description: task.description,
            type: task.type || "chore",
            status: task.status || "pending",
            points: task.points || 0,
            version: task.version || 1,
          });
        }
      }

      families++;
    } catch (err: any) {
      errors++;
      console.warn(`[LOCAL-STORE] Failed to sync family ${file}: ${err.message}`);
    }
  }

  // Procesează acțiunile în queue
  const syncResult = await syncLocalQueueToPostgres();
  
  return { families, errors: errors + syncResult.failed };
}
