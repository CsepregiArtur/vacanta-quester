/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * System Events Service — urmărire end-to-end cu Correlation ID
 * ==============================================================
 * 
 * Înregistrează evenimente structurate cu correlationId, permițând
 * debug end-to-end:
 * 
 *   SELECT * FROM system_events 
 *   WHERE correlation_id = '550e8400-e29b-41d4-a716-446655440000'
 *   ORDER BY created_at;
 * 
 *   -- 12:30:01.001 | request_received  | user_id=456
 *   -- 12:30:01.023 | auth_check        | passed
 *   -- 12:30:01.045 | sync_started      | family_id=789
 *   -- 12:30:03.890 | ERROR             | entity_unavailable
 */

import fs from "fs";
import path from "path";

// ─── Config ─────────────────────────────────────────────────────────
const EVENTS_DIR = path.join(process.cwd(), "src", "data", "events");
const MAX_EVENTS_IN_MEMORY = 1000;

interface SystemEvent {
  correlation_id: string;
  event_name: string;
  details: Record<string, any> | null;
  created_at: string;
}

// ─── In-memory buffer (auto-flush la fișier) ────────────────────────
let eventsBuffer: SystemEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function ensureDir(): void {
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }
}

function getEventsFilePath(correlationId: string): string {
  ensureDir();
  // Un fișier pe zi, cu correlationId în nume pentru quick lookup
  const today = new Date().toISOString().substring(0, 10);
  return path.join(EVENTS_DIR, `events_${today}.jsonl`);
}

/**
 * Înregistrează un eveniment în system_events log.
 * 
 * @param correlationId - ID-ul unic al request-ului
 * @param eventName - Numele evenimentului (ex: "auth_check", "sync_started", "ERROR")
 * @param details - Date adiționale (ex: { user_id: 456, passed: true })
 */
export function trackSystemEvent(
  correlationId: string,
  eventName: string,
  details?: Record<string, any> | null
): void {
  try {
    const event: SystemEvent = {
      correlation_id: correlationId,
      event_name: eventName,
      details: details || null,
      created_at: new Date().toISOString(),
    };

    // Adaugă în buffer
    eventsBuffer.push(event);

    // Scrie immediat în fișierul JSONL (append)
    const filePath = getEventsFilePath(correlationId);
    fs.appendFileSync(filePath, JSON.stringify(event) + "\n", "utf-8");

    // Menține buffer-ul la o dimensiune rezonabilă
    if (eventsBuffer.length > MAX_EVENTS_IN_MEMORY) {
      eventsBuffer = eventsBuffer.slice(-MAX_EVENTS_IN_MEMORY);
    }
  } catch {
    // Silențios — sistemul de events nu trebuie să afecteze aplicația
  }
}

/**
 * Caută evenimente după correlationId.
 * Funcționează atât pe buffer-ul în memorie cât și pe fișiere.
 */
export function getEventsByCorrelationId(correlationId: string): SystemEvent[] {
  // 1. Din buffer-ul în memorie
  const fromBuffer = eventsBuffer.filter(e => e.correlation_id === correlationId);

  // 2. Din fișierele JSONL
  const fromFile: SystemEvent[] = [];
  try {
    ensureDir();
    const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.jsonl'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(EVENTS_DIR, file), "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const event = JSON.parse(line) as SystemEvent;
          if (event.correlation_id === correlationId) {
            fromFile.push(event);
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
  } catch {
    // silent
  }

  // 3. Combină, dedupliezi, sortează cronologic
  const seen = new Set<string>();
  const all = [...fromFile, ...fromBuffer].filter(e => {
    const key = `${e.created_at}_${e.event_name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/**
 * Returnează toate correlationId-urile unice dintr-o perioadă.
 */
export function getRecentCorrelationIds(limit = 20): string[] {
  const ids = new Set<string>();
  try {
    ensureDir();
    const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.jsonl'));
    for (const file of files.slice(-3)) { // ultimele 3 fișiere
      const content = fs.readFileSync(path.join(EVENTS_DIR, file), "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      for (const line of lines.slice(-50)) {
        try {
          const event = JSON.parse(line) as SystemEvent;
          ids.add(event.correlation_id);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // silent
  }
  return Array.from(ids).slice(-limit);
}

/**
 * Inițializează sistemul de events.
 */
export function initSystemEvents(): void {
  ensureDir();
  // Auto-flush la fiecare 30s (opțional)
  if (!flushTimer) {
    flushTimer = setInterval(() => {
      // Buffer-ul e deja scris la fiecare trackSystemEvent
      // Aici putem face curățenie
    }, 30_000);
  }
}

/**
 * Curăță evenimentele mai vechi de N zile.
 */
export function cleanupOldEvents(days = 30): void {
  try {
    ensureDir();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.jsonl'));
    for (const file of files) {
      const filePath = path.join(EVENTS_DIR, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // silent
  }
}
