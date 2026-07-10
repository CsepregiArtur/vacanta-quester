/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit Tests — Activity Scoring
 * ==============================
 * Testează logica de punctaj pentru activități:
 *   - Prima activitate a zilei → multiplier 0.75
 *   - A doua → multiplier 1.0
 *   - A treia → multiplier 1.25
 *   - A 4+ → multiplier 1.50
 *   - Punctaj minim garantat
 */

import { describe, test, expect } from 'vitest';

interface ActiveTask {
  id: string;
  childId: string;
  type: string;
  points: number;
  status: string;
  completedAt?: string;
  pointsMultiplier?: number;
  awardedPoints?: number;
}

interface Child {
  id: string;
  name: string;
  points: number;
  readingStreak: number;
}

interface DB {
  children: Child[];
  activeTasks: ActiveTask[];
}

function awardPointsForActivity(db: DB, childId: string, task: ActiveTask): number {
  const child = db.children.find(c => c.id === childId);
  if (!child) return 0;

  const todayStr = new Date().toISOString().split('T')[0];

  const completedTodayCount = (db.activeTasks || []).filter(t =>
    t.childId === childId &&
    t.id !== task.id &&
    t.status === 'approved' &&
    t.completedAt &&
    t.completedAt.startsWith(todayStr) &&
    (t.type === 'chore' || t.type === 'dog_walk' || t.type === 'walk' || t.type === 'hygiene')
  ).length;

  let multiplier = 1.0;
  if (completedTodayCount === 0) {
    multiplier = 0.75;
  } else if (completedTodayCount === 1) {
    multiplier = 1.0;
  } else if (completedTodayCount === 2) {
    multiplier = 1.25;
  } else {
    multiplier = 1.5;
  }

  const originalPoints = task.points || 40;
  const finalPoints = Math.max(10, Math.round(originalPoints * multiplier));

  task.pointsMultiplier = multiplier;
  task.awardedPoints = finalPoints;
  child.points += finalPoints;

  return finalPoints;
}

describe('awardPointsForActivity — punctaj', () => {
  function makeDb(completedToday: number): DB {
    const tasks: ActiveTask[] = [];
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < completedToday; i++) {
      tasks.push({
        id: `done-${i}`,
        childId: 'child-1',
        type: 'chore',
        points: 40,
        status: 'approved',
        completedAt: `${today}T10:0${i}:00Z`,
      });
    }
    return {
      children: [{ id: 'child-1', name: 'Test', age: 10, points: 0, readingStreak: 0 } as Child],
      activeTasks: tasks,
    };
  }

  test('prima activitate → multiplier 0.75', () => {
    const db = makeDb(0);
    const task: ActiveTask = { id: 'new', childId: 'child-1', type: 'chore', points: 40, status: 'pending' };
    const result = awardPointsForActivity(db, 'child-1', task);
    expect(result).toBe(30); // 40 * 0.75
    expect(task.pointsMultiplier).toBe(0.75);
  });

  test('a doua activitate → multiplier 1.0', () => {
    const db = makeDb(1);
    const task: ActiveTask = { id: 'new', childId: 'child-1', type: 'chore', points: 40, status: 'pending' };
    const result = awardPointsForActivity(db, 'child-1', task);
    expect(result).toBe(40);
    expect(task.pointsMultiplier).toBe(1.0);
  });

  test('a treia activitate → multiplier 1.25', () => {
    const db = makeDb(2);
    const task: ActiveTask = { id: 'new', childId: 'child-1', type: 'chore', points: 40, status: 'pending' };
    const result = awardPointsForActivity(db, 'child-1', task);
    expect(result).toBe(50);
    expect(task.pointsMultiplier).toBe(1.25);
  });

  test('a 4-a activitate → multiplier 1.5', () => {
    const db = makeDb(3);
    const task: ActiveTask = { id: 'new', childId: 'child-1', type: 'chore', points: 40, status: 'pending' };
    const result = awardPointsForActivity(db, 'child-1', task);
    expect(result).toBe(60);
    expect(task.pointsMultiplier).toBe(1.5);
  });

  test('many activities → multiplier 1.5 (bonus efort)', () => {
    const db = makeDb(10);
    const task: ActiveTask = { id: 'new', childId: 'child-1', type: 'chore', points: 40, status: 'pending' };
    const result = awardPointsForActivity(db, 'child-1', task);
    expect(result).toBe(60);
  });

  test('punctaj minim = 10', () => {
    const db = makeDb(0);
    const task: ActiveTask = { id: 'new', childId: 'child-1', type: 'chore', points: 5, status: 'pending' };
    const result = awardPointsForActivity(db, 'child-1', task);
    expect(result).toBe(10); // Math.max(10, 5*0.75)
  });

  test('dog_walk activitate — același calcul', () => {
    const db = makeDb(1);
    const task: ActiveTask = { id: 'walk-1', childId: 'child-1', type: 'dog_walk', points: 50, status: 'pending' };
    const result = awardPointsForActivity(db, 'child-1', task);
    expect(result).toBe(50); // 50 * 1.0
  });

  test('punctele se adună la child.points', () => {
    const db: DB = {
      children: [{ id: 'child-1', name: 'Test', points: 200, readingStreak: 0 } as Child],
      activeTasks: [],
    };
    const task: ActiveTask = { id: 'new', childId: 'child-1', type: 'chore', points: 40, status: 'pending' };
    awardPointsForActivity(db, 'child-1', task);
    expect(db.children[0].points).toBe(230); // 200 + 30
  });
});
