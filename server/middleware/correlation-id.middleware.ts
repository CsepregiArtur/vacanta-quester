/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Correlation ID Middleware — identifică și urmărește request-urile end-to-end
 * =============================================================================
 * 
 * Fiecare request primește un Correlation ID unic (sau preia unul din header).
 * Toate log-urile și erorile sunt etichetate cu acest ID, permițând
 * debug end-to-end: frontend → backend → AI → DB → external calls.
 * 
 * Folosire:
 *   app.use(correlationIdMiddleware);
 *   // Apoi: req.correlationId, req.requestId
 */

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Extindem tipul Request să includă correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      requestId: string;
    }
  }
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Preia Correlation ID din header (dacă vine de la frontend) sau generează unul nou
  const correlationId = req.headers['x-correlation-id'] as string || crypto.randomUUID();
  const requestId = crypto.randomUUID();

  req.correlationId = correlationId;
  req.requestId = requestId;

  // Adaugă header-ele în răspuns pentru debugging
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', requestId);

  next();
}

/**
 * Logger structurat care include correlationId în fiecare mesaj.
 * Format: [CORRELATION] <correlationId> | <message>
 */
export function logEvent(req: Request, event: string, data?: Record<string, any>): void {
  const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
  const correlationId = req.correlationId || 'unknown';
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] ${correlationId} | ${event}${dataStr}`);
}

/**
 * Format: 12:30:01.001 | 550e8400 | request_received | user_id=456
 */
export function formatCorrelationLog(correlationId: string, event: string, data?: Record<string, any>): string {
  const timestamp = new Date().toISOString().substring(11, 23);
  const dataStr = data ? ` | ${Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ')}` : '';
  return `${timestamp} | ${correlationId.substring(0, 8)} | ${event}${dataStr}`;
}
