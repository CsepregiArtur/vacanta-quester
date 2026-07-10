/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * VQ Server — Punct de intrare (PostgreSQL + servicii noi)
 * ==========================================================
 * Rulează: npm run dev:new | npm run start:new
 *
 * Inițializează PostgreSQL și serviciile noi, apoi pornește serverul legacy.
 */

import dotenv from "dotenv";
dotenv.config();

import { initDatabase, checkPostgresHealth, isPostgresAvailable } from "./db";
import analyticsRoutes from "./routes/analytics.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import { syncService } from "./services";
import { syncLocalQueueToPostgres, syncAllFamiliesToPostgres, getLocalQueueLength } from "./services/local-store.service";

async function bootstrap() {
  let pgConnected = false;
  try {
    await initDatabase();
    pgConnected = true;
  } catch {
    // PG indisponibil — JSON fallback silențios
  }
  
  // Montează rutele ÎNAINTE de serverul legacy
  const { app } = await import("./legacy/server");
  
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/subscription", subscriptionRoutes);

  if (pgConnected) {
    // PG disponibil — procesează coada de sincronizare în PG
    setupPostgresSync();
  } else {
    // PG indisponibil — JSON fallback + sync automat când PG revine
    setupLocalFallback();
  }
}

/**
 * Configurare când PostgreSQL e disponibil.
 */
function setupPostgresSync(): void {
  // Queue processor silențios la fiecare 5 secunde
  setInterval(async () => {
    try {
      await syncService.processAllPending();
    } catch {
      // silent
    }
  }, 5000);

  // Migrări și resetări startup
  (async () => {
    try {
      const { query } = await import("./db");
      await query(`UPDATE sync_queue SET status = 'pending' WHERE status = 'processing'`);
      await query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0`);
      await query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ`);
      await query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS last_error TEXT`);
    } catch {
      // silent
    }
  })();
}

/**
 * Configurare când PostgreSQL e indisponibil — JSON fallback enterprise.
 * 
 * Arhitectură offline-first:
 * 1. JSON fallback (serverul legacy scrie deja JSON)
 * 2. Verificare periodică dacă PG a revenit (la 30s)
 * 3. Sincronizare automată JSON → PG la reconectare
 * 4. Fără pierdere de date — coadă locală cu retry
 */
function setupLocalFallback(): void {
  // Verifică la fiecare 30s dacă PG a revenit
  setInterval(async () => {
    try {
      const available = await checkPostgresHealth();
      if (!available) return;

      // PG a revenit! Sincronizează toate datele locale
      console.log(`[SYNC] PostgreSQL a revenit — sincronizare date locale...`);

      // 1. Sincronizează toate datele familiilor din JSON în PG
      const familySync = await syncAllFamiliesToPostgres();

      // 2. Procesează coada locală de acțiuni
      const queueSync = await syncLocalQueueToPostgres();

      console.log(`[SYNC] Sincronizare completă: ${familySync.families} familii, ${queueSync.synced} acțiuni, ${queueSync.failed} eșuate`);

      // 3. Pornește procesarea cozii PG
      const localQ = getLocalQueueLength();
      if (localQ > 0) {
        console.log(`[SYNC] Mai sunt ${localQ} acțiuni locale de procesat`);
      }
    } catch {
      // silent — JSON fallback continuă
    }
  }, 30_000);
}

bootstrap();

