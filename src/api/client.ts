/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * API Client — Generat din OpenAPI 3.1 spec (openapi.yaml)
 * =========================================================
 * 
 * Regenerare: păstrează manual sincronizat cu openapi.yaml.
 * În viitor: npm run generate:client → openapi-generator.
 * 
 * Tipurile corespund explicit cu definițiile din ../../openapi.yaml.
 */

// ═══════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: { email: string; name: string };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  name: string;
  pin?: string;
  customChildren?: Array<{ name: string; age: number; avatar?: string }>;
}

// ═══════════════════════════════════════════════════════════════════
// CHILD
// ═══════════════════════════════════════════════════════════════════

export interface Child {
  id: string;
  name: string;
  age: number;
  points: number;
  avatar: string;
  readingStreak: number;
  daysSinceLastReading: number;
  version?: number;
  activeTimer?: ActiveTimer | null;
}

export interface ActiveTimer {
  rewardId: string;
  rewardName: string;
  startedAt: string;
  expiresAt: string;
  durationMinutes: number;
  minutesLeft: number;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// ACTIVITY
// ═══════════════════════════════════════════════════════════════════

export type TaskStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export type ActivityType = 'reading' | 'dog_walk' | 'chore' | 'custom' | 'pet';

export interface Activity {
  id: string;
  childId: string;
  name: string;
  type: ActivityType;
  description: string;
  points: number;
  status: TaskStatus;
  version: number;
  completedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SUGGESTION
// ═══════════════════════════════════════════════════════════════════

export type SuggestionType = 'activity' | 'reward' | 'cashout' | 'other';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface Suggestion {
  id: string;
  childId: string;
  childName: string;
  type: SuggestionType;
  title: string;
  description: string;
  proposedPointsOrCost?: number;
  proposedDurationMinutes?: number;
  status: SuggestionStatus;
  createdAt: string;
  adminFeedback?: string;
}

// ═══════════════════════════════════════════════════════════════════
// REWARD
// ═══════════════════════════════════════════════════════════════════

export interface Reward {
  id: string;
  name: string;
  costPoints: number;
  durationMinutes: number;
  icon: string;
}

// ═══════════════════════════════════════════════════════════════════
// PET
// ═══════════════════════════════════════════════════════════════════

export type PetType = 'dog' | 'cat' | 'hamster' | 'rabbit' | 'fish' | 'bird' | 'turtle' | 'other';

export interface Pet {
  id: string;
  type: PetType;
  name: string;
  icon: string;
  enabled: boolean;
  activities: PetActivity[];
}

export interface PetActivity {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  slot?: 'morning' | 'midday' | 'evening';
}

// ═══════════════════════════════════════════════════════════════════
// SYNC
// ═══════════════════════════════════════════════════════════════════

export interface SyncAction {
  action: string;
  payload: Record<string, unknown>;
  device_id?: string;
}

export interface SyncResult {
  success: boolean;
  results?: Array<{ action: string; success: boolean; error?: string }>;
}

// ═══════════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════════

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  services: {
    api: ServiceStatus;
    postgres: ServiceStatus;
    gemini: ServiceStatus;
    [key: string]: ServiceStatus | undefined;
  };
}

export interface ServiceStatus {
  status: 'ok' | 'down' | 'disabled';
}

export interface DashboardMetrics {
  timestamp: string;
  metrics: Record<string, { avg: number; latest: number | null; count: number }>;
}

// ═══════════════════════════════════════════════════════════════════
// STATE (combinat)
// ═══════════════════════════════════════════════════════════════════

export interface AppState {
  children: Child[];
  activeTasks: Activity[];
  suggestions: Suggestion[];
  customRewards?: Reward[];
  pets?: Pet[];
  homeAssistant: {
    url: string;
    token: string;
    enabled: boolean;
  };
  parentPin?: string;
  lastUpdated?: string;
}

// ═══════════════════════════════════════════════════════════════════
// API ERROR
// ═══════════════════════════════════════════════════════════════════

export interface ApiError {
  error: string;
  stack?: string;
}
