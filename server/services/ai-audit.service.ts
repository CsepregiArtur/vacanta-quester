/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI Audit & Cost Tracking Service
 * ===================================
 * 
 * Urmărește fiecare apel AI:
 *   - Prompt trimis
 *   - Model folosit
 *   - Tokens input/output
 *   - Cost estimat
 *   - Timp de răspuns
 *   - Family ID (pentru facturare per client)
 * 
 * Permite:
 *   - Optimizare costuri Gemini
 *   - Facturare per family
 *   - Detectare abuz
 *   - Debug
 */

import fs from "fs";
import path from "path";
import { metricsStore } from "./metrics.service";

// ─── Config ─────────────────────────────────────────────────────────
const AUDIT_DIR = path.join(process.cwd(), "src", "data", "ai-audit");

// Cost per 1K tokens (estimări Gemini 2.0 Flash)
const COST_PER_1K_INPUT = 0.00015;   // $0.15 / 1M tokens
const COST_PER_1K_OUTPUT = 0.00060;  // $0.60 / 1M tokens

export interface AiCallRecord {
  id: string;
  familyId: string | null;
  childId: string | null;
  model: string;
  prompt: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  estimatedCost: number;
  durationMs: number;
  success: boolean;
  error?: string;
  created_at: string;
}

// ─── In-memory buffer ───────────────────────────────────────────────
const auditBuffer: AiCallRecord[] = [];
const MAX_BUFFER = 500;

function ensureDir(): void {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
}

/**
 * Estimează numărul de tokens dintr-un text.
 * Aproximare: 1 token ≈ 4 caractere pentru text în engleză/română.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculează costul estimat pentru un apel AI.
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1000) * COST_PER_1K_INPUT + (outputTokens / 1000) * COST_PER_1K_OUTPUT;
}

/**
 * Înregistrează un apel AI în audit log.
 */
export function recordAiCall(data: {
  familyId?: string | null;
  childId?: string | null;
  model?: string;
  prompt: string;
  responseTokens?: number;
  durationMs: number;
  success: boolean;
  error?: string;
}): AiCallRecord {
  const promptTokens = estimateTokens(data.prompt);
  const responseTokens = data.responseTokens || estimateTokens(data.prompt) / 2;
  const totalTokens = promptTokens + responseTokens;
  const estimatedCost = calculateCost(promptTokens, responseTokens);

  const record: AiCallRecord = {
    id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    familyId: data.familyId || null,
    childId: data.childId || null,
    model: data.model || 'gemini-2.0-flash',
    prompt: data.prompt.substring(0, 500), // trunchiat pentru stocare
    promptTokens,
    responseTokens,
    totalTokens,
    estimatedCost,
    durationMs: data.durationMs,
    success: data.success,
    error: data.error,
    created_at: new Date().toISOString(),
  };

  auditBuffer.push(record);
  if (auditBuffer.length > MAX_BUFFER) {
    auditBuffer.shift();
  }

  // Persistă în fișier JSONL
  try {
    ensureDir();
    const today = new Date().toISOString().substring(0, 10);
    const filePath = path.join(AUDIT_DIR, `ai-audit-${today}.jsonl`);
    fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf-8");
  } catch {
    // silent
  }

  // Actualizează metrics
  metricsStore.record('ai_call_duration', data.durationMs);
  metricsStore.record('ai_call_tokens', totalTokens);
  metricsStore.record('ai_call_cost', estimatedCost);

  return record;
}

/**
 * Calculează costul total AI pentru o familie într-o perioadă.
 */
export function getFamilyAiCost(familyId: string, since?: Date): number {
  const sinceDate = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return auditBuffer
    .filter(r => r.familyId === familyId && new Date(r.created_at) >= sinceDate)
    .reduce((sum, r) => sum + r.estimatedCost, 0);
}

/**
 * Calculează costul total AI perioadă.
 */
export function getTotalAiCost(since?: Date): { total: number; byFamily: Record<string, number>; byModel: Record<string, number> } {
  const sinceDate = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = auditBuffer.filter(r => new Date(r.created_at) >= sinceDate);

  const byFamily: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  let total = 0;

  for (const r of recent) {
    total += r.estimatedCost;
    if (r.familyId) byFamily[r.familyId] = (byFamily[r.familyId] || 0) + r.estimatedCost;
    byModel[r.model] = (byModel[r.model] || 0) + r.estimatedCost;
  }

  return {
    total: Math.round(total * 100000) / 100000,
    byFamily,
    byModel,
  };
}

/**
 * Returnează ultimele N înregistrări AI audit.
 */
export function getRecentAiCalls(limit = 50): AiCallRecord[] {
  return auditBuffer.slice(-limit).reverse();
}
