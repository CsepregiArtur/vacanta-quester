/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit Tests — Reading Scoring & Difficulty
 * ==========================================
 * Testează logica de punctaj dinamic pentru lectură:
 *   - Prima lectură zilnică → puncte maxime (multiplier 1.25)
 *   - A doua lectură → puncte mai puține (multiplier 0.75)
 *   - A treia → și mai puține (multiplier 0.50)
 *   - A 4+ → minim (multiplier 0.25)
 *   - Revalidare → puncte proporționale cu firstAttemptScore
 *   - Dificultate dinamică bazată pe streak și vârstă
 */

import { describe, test, expect } from 'vitest';

// ═════════════════════════════════════════════════════════════════════
// Helper: simulează awardPointsForReading
// ═════════════════════════════════════════════════════════════════════

interface Child {
  id: string;
  name: string;
  age: number;
  points: number;
  readingStreak: number;
}

interface ReadingEntry {
  childId: string;
  completedAt: string;
}

interface Task {
  points?: number;
  attemptsCount?: number;
  firstAttemptScore?: number;
  pointsMultiplier?: number;
  awardedPoints?: number;
}

function awardPointsForReading(
  db: { children: Child[]; readingHistory: ReadingEntry[] },
  childId: string,
  task: Task,
  correctCount: number,
  questionsCount: number
): number {
  const child = db.children.find(c => c.id === childId);
  if (!child) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  
  const readingsTodayCount = (db.readingHistory || []).filter(h => 
    h.childId === childId && h.completedAt && h.completedAt.startsWith(todayStr)
  ).length;

  let multiplier = 1.0;
  if (readingsTodayCount === 0) {
    multiplier = 1.25;
  } else if (readingsTodayCount === 1) {
    multiplier = 0.75;
  } else if (readingsTodayCount === 2) {
    multiplier = 0.50;
  } else {
    multiplier = 0.25;
  }

  const originalPoints = task.points || 60;
  
  let basePoints = originalPoints;
  if ((task.attemptsCount ?? 0) > 1) {
    const firstScore = task.firstAttemptScore ?? 0;
    basePoints = Math.round(originalPoints * (firstScore / questionsCount));
  }
  
  const finalPoints = Math.max(10, Math.round(basePoints * multiplier));
  task.pointsMultiplier = multiplier;
  task.awardedPoints = finalPoints;
  child.points += finalPoints;
  
  return finalPoints;
}

// ═════════════════════════════════════════════════════════════════════
// Helper: dificultate dinamică
// ═════════════════════════════════════════════════════════════════════

function calculateDifficulty(
  readingsTodayCount: number,
  childAge: number,
  readingStreak: number
): {
  difficultyClass: string;
  baseLengthMin: number;
  baseLengthMax: number;
} {
  let difficultyClass = 'Standard';
  if (readingsTodayCount > 0) {
    if (readingsTodayCount === 1) difficultyClass = 'Medie (+ Dificultate)';
    else if (readingsTodayCount === 2) difficultyClass = 'Ridicată (Antrenament Avansat)';
    else difficultyClass = 'Extremă (Campioni în Lectură)';
  }

  let baseLengthMin = 150;
  let baseLengthMax = 250;

  if (childAge >= 14) {
    baseLengthMin = 480;
    baseLengthMax = 650;
  } else {
    baseLengthMin = 150 + (readingStreak * 30);
    baseLengthMax = 220 + (readingStreak * 40);
  }

  return { difficultyClass, baseLengthMin, baseLengthMax };
}

// ═════════════════════════════════════════════════════════════════════
// Teste — awardPointsForReading
// ═════════════════════════════════════════════════════════════════════

describe('awardPointsForReading — punctaj dinamic', () => {
  function makeDb(readingsToday: number): { children: Child[]; readingHistory: ReadingEntry[] } {
    const history: ReadingEntry[] = [];
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < readingsToday; i++) {
      history.push({ childId: 'child-1', completedAt: `${today}T10:0${i}:00Z` });
    }
    return {
      children: [{ id: 'child-1', name: 'Test', age: 10, points: 0, readingStreak: 0 }],
      readingHistory: history,
    };
  }

  test('prima lectură a zilei → multiplier 1.25 (bonus)', () => {
    const db = makeDb(0);
    const task: Task = { points: 60 };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    // 60 * 1.25 = 75
    expect(result).toBe(75);
    expect(task.pointsMultiplier).toBe(1.25);
  });

  test('a doua lectură a zilei → multiplier 0.75', () => {
    const db = makeDb(1);
    const task: Task = { points: 60 };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    expect(result).toBe(45);
    expect(task.pointsMultiplier).toBe(0.75);
  });

  test('a treia lectură a zilei → multiplier 0.50', () => {
    const db = makeDb(2);
    const task: Task = { points: 60 };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    expect(result).toBe(30);
    expect(task.pointsMultiplier).toBe(0.50);
  });

  test('a 4-a lectură a zilei → multiplier 0.25', () => {
    const db = makeDb(3);
    const task: Task = { points: 60 };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    expect(result).toBe(15);
    expect(task.pointsMultiplier).toBe(0.25);
  });

  test('a 5+ lectură → tot multiplier 0.25', () => {
    const db = makeDb(5);
    const task: Task = { points: 60 };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    expect(result).toBe(15);
    expect(task.pointsMultiplier).toBe(0.25);
  });

  test('punctaj minim = 10 (nu poate scădea sub)', () => {
    const db = makeDb(5);
    const task: Task = { points: 20 };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    // 20 * 0.25 = 5 → se aplică Math.max(10, ...) → 10
    expect(result).toBe(10);
  });
});

describe('awardPointsForReading — revalidare (penalizare)', () => {
  function makeDb(readingsToday: number): { children: Child[]; readingHistory: ReadingEntry[] } {
    const history: ReadingEntry[] = [];
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < readingsToday; i++) {
      history.push({ childId: 'child-1', completedAt: `${today}T10:0${i}:00Z` });
    }
    return {
      children: [{ id: 'child-1', name: 'Test', age: 10, points: 0, readingStreak: 0 }],
      readingHistory: history,
    };
  }

  test('prima încercare: 2/3 corecte → revalidare: puncte proporționale', () => {
    const db = makeDb(0);
    const task: Task = {
      points: 60,
      attemptsCount: 2,
      firstAttemptScore: 2, // a avut 2/3 corecte prima dată
    };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    // basePoints = round(60 * 2/3) = 40
    // multiplier = 1.25 (prima lectură a zilei)
    // final = 40 * 1.25 = 50
    expect(result).toBe(50);
  });

  test('prima încercare: 1/3 corecte → revalidare: puncte și mai puține', () => {
    const db = makeDb(0);
    const task: Task = {
      points: 60,
      attemptsCount: 2,
      firstAttemptScore: 1,
    };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    // basePoints = round(60 * 1/3) = 20
    // * 1.25 = 25
    expect(result).toBe(25);
  });

  test('prima încercare: 0/3 corecte → revalidare: puncte minime', () => {
    const db = makeDb(0);
    const task: Task = {
      points: 60,
      attemptsCount: 2,
      firstAttemptScore: 0,
    };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    // basePoints = round(60 * 0/3) = 0
    // Math.max(10, ...) → 10
    expect(result).toBe(10);
  });

  test('fără revalidare (attemptsCount=1) → puncte normale, fără penalizare', () => {
    const db = makeDb(0);
    const task: Task = {
      points: 60,
      attemptsCount: 1,
    };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    // 60 * 1.25 = 75 (fără penalizare)
    expect(result).toBe(75);
  });

  test('revalidare + a doua lectură (penalizare dublă)', () => {
    const db = makeDb(1); // deja o lectură azi
    const task: Task = {
      points: 60,
      attemptsCount: 2,
      firstAttemptScore: 2,
    };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    // basePoints = round(60 * 2/3) = 40
    // multiplier = 0.75 (a doua lectură a zilei)
    // final = 40 * 0.75 = 30
    expect(result).toBe(30);
  });
});

describe('awardPointsForReading — puncte adăugate la copil', () => {
  test('punctele se adună la child.points', () => {
    const db = {
      children: [{ id: 'child-1', name: 'Test', age: 10, points: 100, readingStreak: 5 }],
      readingHistory: [],
    };
    const task: Task = { points: 60 };
    const result = awardPointsForReading(db, 'child-1', task, 3, 3);
    expect(result).toBe(75);
    expect(db.children[0].points).toBe(175); // 100 + 75
  });
});

// ═════════════════════════════════════════════════════════════════════
// Teste — Dificultate dinamică
// ═════════════════════════════════════════════════════════════════════

describe('calculateDifficulty — dinamică', () => {
  test('prima lectură → Standard', () => {
    const result = calculateDifficulty(0, 10, 0);
    expect(result.difficultyClass).toBe('Standard');
  });

  test('a doua lectură → Medie', () => {
    const result = calculateDifficulty(1, 10, 0);
    expect(result.difficultyClass).toBe('Medie (+ Dificultate)');
  });

  test('a treia lectură → Ridicată', () => {
    const result = calculateDifficulty(2, 10, 0);
    expect(result.difficultyClass).toBe('Ridicată (Antrenament Avansat)');
  });

  test('a 4+ lectură → Extremă', () => {
    const result = calculateDifficulty(3, 10, 0);
    expect(result.difficultyClass).toBe('Extremă (Campioni în Lectură)');
  });
});

describe('calculateDifficulty — lungime text pe vârstă', () => {
  test('copil 10 ani, streak 0 → 150-220 cuvinte', () => {
    const result = calculateDifficulty(0, 10, 0);
    expect(result.baseLengthMin).toBe(150);
    expect(result.baseLengthMax).toBe(220);
  });

  test('copil 10 ani, streak 5 → 300-420 cuvinte', () => {
    const result = calculateDifficulty(0, 10, 5);
    // 150 + 5*30 = 300, 220 + 5*40 = 420
    expect(result.baseLengthMin).toBe(300);
    expect(result.baseLengthMax).toBe(420);
  });

  test('copil 10 ani, streak 10 → 450-620 cuvinte', () => {
    const result = calculateDifficulty(0, 10, 10);
    expect(result.baseLengthMin).toBe(450);
    expect(result.baseLengthMax).toBe(620);
  });

  test('adolescent 14 ani → 480-650 cuvinte (independent de streak)', () => {
    const result = calculateDifficulty(0, 14, 0);
    expect(result.baseLengthMin).toBe(480);
    expect(result.baseLengthMax).toBe(650);
  });

  test('adolescent 14 ani, streak mare → tot 480-650', () => {
    const result = calculateDifficulty(0, 14, 20);
    expect(result.baseLengthMin).toBe(480);
    expect(result.baseLengthMax).toBe(650);
  });
});
