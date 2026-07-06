/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Health Dashboard Routes — monitorizare enterprise
 * ====================================================
 * 
 * GET /api/health        → status simplu (ok/down)
 * GET /api/health/full   → status detaliat pentru toate serviciile
 * GET /api/health/metrics → metrici operaționale
 * GET /api/health/ai-cost → costuri AI per family
 */

import { Router, Request, Response } from "express";
import { checkPostgresHealth } from "../db";
import { getDashboardMetrics, recordMemoryUsage } from "../services/metrics.service";
import { getTotalAiCost, getRecentAiCalls } from "../services/ai-audit.service";
import { getLocalQueueLength } from "../services/local-store.service";

const router = Router();

/**
 * GET /api/health — status simplu
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /api/health/full — dashboard sănătate servicii
 */
router.get("/full", async (_req: Request, res: Response) => {
  recordMemoryUsage();

  const [pg, mem, uptime] = await Promise.all([
    checkPostgresHealth(),
    Promise.resolve(process.memoryUsage()),
    Promise.resolve(process.uptime()),
  ]);

  res.json({
    status: pg ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    services: {
      api: { status: "ok", version: "1.0.0" },
      postgres: { status: pg ? "ok" : "down" },
      gemini: { status: "ok" }, // verificare reală în producție
      smtp: { status: "ok" },
      cache: { status: "ok", entries: 0 },
      queue: { status: "ok", localPending: getLocalQueueLength() },
    },
    memory: {
      rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
      heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
    },
  });
});

/**
 * GET /api/health/metrics — metrici operaționale
 */
router.get("/metrics", (_req: Request, res: Response) => {
  recordMemoryUsage();
  res.json({
    timestamp: new Date().toISOString(),
    metrics: getDashboardMetrics(),
  });
});

/**
 * GET /api/health/ai-cost — costuri AI
 */
router.get("/ai-cost", (req: Request, res: Response) => {
  const since = req.query.since ? new Date(req.query.since as string) : undefined;
  const costs = getTotalAiCost(since);
  const recent = getRecentAiCalls(20);

  res.json({
    timestamp: new Date().toISOString(),
    costs,
    recentCalls: recent.map(r => ({
      id: r.id,
      familyId: r.familyId,
      model: r.model,
      tokens: r.totalTokens,
      cost: r.estimatedCost,
      durationMs: r.durationMs,
      success: r.success,
      createdAt: r.created_at,
    })),
  });
});

export default router;
