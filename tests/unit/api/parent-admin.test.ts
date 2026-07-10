/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit Tests — Parent Admin API (sugestii, copii, animale, config)
 * =================================================================
 * Testează logica internă a endpoint-urilor de administrare:
 *   - Sugestii multiple (reward requests)
 *   - Adăugare copii
 *   - Sistem animale de companie
 *   - Configurare activități și recompense
 *
 * NOTĂ: Folosește clase mock inline (același pattern ca tests/unit/sync/).
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════
// 1. MOCK: SUGGESTIONS / REWARD REQUESTS
// ═══════════════════════════════════════════════════════════════════

interface Suggestion {
  id: string;
  childId: string;
  childName: string;
  type: 'activity' | 'reward' | 'cashout' | 'other';
  title: string;
  description: string;
  proposedPointsOrCost?: number;
  proposedDurationMinutes?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  adminFeedback?: string;
}

interface Child {
  id: string;
  name: string;
  points: number;
}

class SuggestionManager {
  suggestions: Suggestion[] = [];
  children: Child[] = [];

  constructor(initialChildren: Child[] = []) {
    this.children = [...initialChildren];
  }

  // ─── Submit suggestion (copilul trimite o cerere) ───────────────
  submitSuggestion(data: {
    childId: string;
    type: 'activity' | 'reward' | 'cashout' | 'other';
    title: string;
    description?: string;
    proposedPointsOrCost?: number;
    proposedDurationMinutes?: number;
  }): { success: boolean; error?: string; suggestion?: Suggestion } {
    const child = this.children.find(c => c.id === data.childId);
    if (!child) return { success: false, error: 'Copilul nu a fost găsit.' };

    // Cashout: verifică sold și debitează imediat
    if (data.type === 'cashout') {
      const pts = data.proposedPointsOrCost || 0;
      if (pts <= 0) return { success: false, error: 'Suma de puncte trebuie să fie pozitivă!' };
      if (child.points < pts) return { success: false, error: `Nu ai suficiente puncte!` };
      child.points -= pts;
    }

    const suggestion: Suggestion = {
      id: `sug-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      childId: data.childId,
      childName: child.name,
      type: data.type,
      title: data.title,
      description: data.description || '',
      proposedPointsOrCost: data.proposedPointsOrCost,
      proposedDurationMinutes: data.proposedDurationMinutes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.suggestions.push(suggestion);
    return { success: true, suggestion };
  }

  // ─── Get suggestions for a specific child ───────────────────────
  getChildSuggestions(childId: string): Suggestion[] {
    return this.suggestions
      .filter(s => s.childId === childId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ─── Parent responds to suggestion ──────────────────────────────
  respondToSuggestion(
    suggestionId: string,
    status: 'approved' | 'rejected',
    adminFeedback?: string
  ): { success: boolean; error?: string; refundedPoints?: number } {
    const sug = this.suggestions.find(s => s.id === suggestionId);
    if (!sug) return { success: false, error: 'Sugestia nu a fost găsită.' };
    if (sug.status !== 'pending') return { success: false, error: 'Sugestia a fost deja procesată.' };

    sug.status = status;
    sug.adminFeedback = adminFeedback || '';

    // Cashout rejected: return points
    if (status === 'rejected' && sug.type === 'cashout') {
      const child = this.children.find(c => c.id === sug.childId);
      if (child && sug.proposedPointsOrCost) {
        child.points += sug.proposedPointsOrCost;
        return { success: true, refundedPoints: sug.proposedPointsOrCost };
      }
    }

    return { success: true };
  }

  // ─── Count suggestions by status ────────────────────────────────
  countByStatus(status: string): number {
    return this.suggestions.filter(s => s.status === status).length;
  }

  get totalPending(): number { return this.countByStatus('pending'); }
  get totalApproved(): number { return this.countByStatus('approved'); }
  get totalRejected(): number { return this.countByStatus('rejected'); }
}

// ═══════════════════════════════════════════════════════════════════
// 2. MOCK: CHILD MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

class ChildManager {
  children: Child[] = [];

  addChild(data: { name: string; age: number; avatar?: string }): { success: boolean; error?: string; child?: Child } {
    if (!data.name) return { success: false, error: 'Numele este obligatoriu!' };

    const childId = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (this.children.find(c => c.id === childId)) {
      return { success: false, error: 'Există deja un copil cu acest nume!' };
    }

    const child: Child = {
      id: childId,
      name: data.name,
      points: 0,
    };
    this.children.push(child);
    return { success: true, child };
  }

  getChild(id: string): Child | undefined {
    return this.children.find(c => c.id === id);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 3. MOCK: PET / ANIMAL COMPANION SYSTEM
// ═══════════════════════════════════════════════════════════════════

interface PetActivity {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  slot?: 'morning' | 'midday' | 'evening';
}

interface Pet {
  id: string;
  type: string;
  name: string;
  icon: string;
  enabled: boolean;
  activities: PetActivity[];
  createdAt: string;
}

const PET_TEMPLATES: Record<string, { icon: string; activities: PetActivity[] }> = {
  dog: {
    icon: '🐕',
    activities: [
      { id: 'dog_feed', name: 'Hrănire câine', description: 'Hrănește câinele', points: 20, icon: '🍗' },
      { id: 'dog_walk_morning', name: 'Plimbare dimineața', description: 'Plimbă câinele dimineața', points: 40, icon: '🌅', slot: 'morning' },
    ],
  },
  cat: {
    icon: '🐈',
    activities: [
      { id: 'cat_feed', name: 'Hrănire pisică', description: 'Hrănește pisica', points: 20, icon: '🥫' },
      { id: 'cat_litter', name: 'Curățare litieră', description: 'Curăță litiera', points: 35, icon: '🧹' },
    ],
  },
  hamster: {
    icon: '🐹',
    activities: [
      { id: 'hamster_feed', name: 'Hrănire hamster', points: 15, icon: '🥜', description: 'Hrănește hamsterul' },
      { id: 'hamster_clean', name: 'Curățare cușcă', points: 30, icon: '🧹', description: 'Curăță cușca' },
    ],
  },
  rabbit: {
    icon: '🐰',
    activities: [
      { id: 'rabbit_feed', name: 'Hrănire iepure', points: 15, icon: '🥕', description: 'Hrănește iepurele' },
    ],
  },
  fish: {
    icon: '🐟',
    activities: [
      { id: 'fish_feed', name: 'Hrănire pești', points: 10, icon: '🪱', description: 'Hrănește peștii' },
    ],
  },
  bird: {
    icon: '🐦',
    activities: [
      { id: 'bird_feed', name: 'Hrănire pasăre', points: 15, icon: '🌾', description: 'Hrănește pasărea' },
    ],
  },
  turtle: {
    icon: '🐢',
    activities: [
      { id: 'turtle_feed', name: 'Hrănire țestoasă', points: 15, icon: '🥬', description: 'Hrănește țestoasa' },
    ],
  },
  other: {
    icon: '🐾',
    activities: [
      { id: 'other_feed', name: 'Hrănire animal', points: 15, icon: '🍽️', description: 'Hrănește animalul' },
    ],
  },
};

class PetManager {
  pets: Pet[] = [];
  private petIdCounter = 0;

  addPet(data: { type: string; name: string }): { success: boolean; error?: string; pet?: Pet } {
    if (!data.type || !data.name) return { success: false, error: 'Tipul și numele sunt obligatorii!' };
    const template = PET_TEMPLATES[data.type];
    if (!template) return { success: false, error: 'Tipul de animal nu este suportat.' };

    const id = `pet_${++this.petIdCounter}`;
    const newPet: Pet = {
      id,
      type: data.type,
      name: data.name,
      icon: template.icon,
      enabled: true,
      activities: template.activities.map(a => ({ ...a, id: `${a.id}_${id}` })),
      createdAt: new Date().toISOString(),
    };
    this.pets.push(newPet);
    return { success: true, pet: newPet };
  }

  togglePet(petId: string, enabled: boolean): { success: boolean; error?: string } {
    const pet = this.pets.find(p => p.id === petId);
    if (!pet) return { success: false, error: 'Animalul nu a fost găsit!' };
    pet.enabled = enabled;
    return { success: true };
  }

  getEnabledPets(): Pet[] {
    return this.pets.filter(p => p.enabled);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 4. MOCK: ACTIVITIES & REWARDS CONFIG
// ═══════════════════════════════════════════════════════════════════

interface Activity {
  id: string;
  name: string;
  description: string;
  points: number;
  childId: string;
}

interface Reward {
  id: string;
  name: string;
  costPoints: number;
  durationMinutes: number;
  icon: string;
}

class ConfigManager {
  activities: Activity[] = [];
  rewards: Reward[] = [];

  // ─── Activities ─────────────────────────────────────────────────
  addActivity(data: { childId: string; name: string; description?: string; points?: number }): { success: boolean; error?: string; activity?: Activity } {
    if (!data.childId || !data.name) return { success: false, error: 'childId și name sunt obligatorii!' };
    const activity: Activity = {
      id: `act_${Date.now()}`,
      childId: data.childId,
      name: data.name,
      description: data.description || '',
      points: data.points || 30,
    };
    this.activities.push(activity);
    return { success: true, activity };
  }

  updateActivity(activityId: string, data: { name?: string; points?: number }): { success: boolean; error?: string } {
    const act = this.activities.find(a => a.id === activityId);
    if (!act) return { success: false, error: 'Activitatea nu a fost găsită!' };
    if (data.name !== undefined) act.name = data.name;
    if (data.points !== undefined) act.points = data.points;
    return { success: true };
  }

  deleteActivity(activityId: string): { success: boolean; error?: string } {
    const idx = this.activities.findIndex(a => a.id === activityId);
    if (idx === -1) return { success: false, error: 'Activitatea nu a fost găsită!' };
    this.activities.splice(idx, 1);
    return { success: true };
  }

  // ─── Rewards ────────────────────────────────────────────────────
  addReward(data: { name: string; costPoints?: number; durationMinutes?: number; icon?: string }): { success: boolean; error?: string; reward?: Reward } {
    if (!data.name) return { success: false, error: 'Numele recompensei este obligatoriu!' };
    const reward: Reward = {
      id: `reward_${Date.now()}`,
      name: data.name,
      costPoints: data.costPoints || 50,
      durationMinutes: data.durationMinutes || 0,
      icon: data.icon || '🎁',
    };
    this.rewards.push(reward);
    return { success: true, reward };
  }

  updateReward(rewardId: string, data: { costPoints?: number; name?: string }): { success: boolean; error?: string } {
    const reward = this.rewards.find(r => r.id === rewardId);
    if (!reward) return { success: false, error: 'Recompensa nu a fost găsită!' };
    if (data.costPoints !== undefined) reward.costPoints = data.costPoints;
    if (data.name !== undefined) reward.name = data.name;
    return { success: true };
  }

  deleteReward(rewardId: string): { success: boolean; error?: string } {
    const idx = this.rewards.findIndex(r => r.id === rewardId);
    if (idx === -1) return { success: false, error: 'Recompensa nu a fost găsită!' };
    this.rewards.splice(idx, 1);
    return { success: true };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Parent Admin — Sugestii & Cereri Multiple', () => {
  let manager: SuggestionManager;

  beforeEach(() => {
    manager = new SuggestionManager([
      { id: 'dominic', name: 'Dominic', points: 200 },
      { id: 'sofia', name: 'Sofia', points: 150 },
    ]);
  });

  test('copilul poate trimite o sugestie de activitate', () => {
    const result = manager.submitSuggestion({
      childId: 'dominic',
      type: 'activity',
      title: 'Construiește un robot LEGO',
      description: 'Vreau să construiesc un robot din LEGO',
      proposedPointsOrCost: 50,
    });

    expect(result.success).toBe(true);
    expect(result.suggestion).toBeDefined();
    expect(result.suggestion!.status).toBe('pending');
    expect(manager.totalPending).toBe(1);
  });

  test('copilul poate trimite MULTIPLE sugestii simultan', () => {
    manager.submitSuggestion({ childId: 'dominic', type: 'activity', title: 'Robot LEGO', proposedPointsOrCost: 50 });
    manager.submitSuggestion({ childId: 'dominic', type: 'activity', title: 'Curățenie cameră', proposedPointsOrCost: 30 });
    manager.submitSuggestion({ childId: 'dominic', type: 'reward', title: 'O oră TV', proposedPointsOrCost: 100, proposedDurationMinutes: 60 });
    manager.submitSuggestion({ childId: 'dominic', type: 'other', title: 'Vreau o carte nouă' });

    expect(manager.totalPending).toBe(4);
    expect(manager.suggestions.length).toBe(4);
  });

  test('fiecare copil își vede DOAR propriile sugestii', () => {
    manager.submitSuggestion({ childId: 'dominic', type: 'activity', title: 'Robot' });
    manager.submitSuggestion({ childId: 'sofia', type: 'reward', title: 'Xbox' });
    manager.submitSuggestion({ childId: 'dominic', type: 'cashout', title: 'Bani', proposedPointsOrCost: 50 });

    expect(manager.getChildSuggestions('dominic')).toHaveLength(2);
    expect(manager.getChildSuggestions('sofia')).toHaveLength(1);
  });

  test('părintele poate aproba o sugestie', () => {
    const { suggestion } = manager.submitSuggestion({
      childId: 'dominic', type: 'activity', title: 'Robot LEGO',
    });
    expect(suggestion).toBeDefined();

    const result = manager.respondToSuggestion(suggestion!.id, 'approved', 'Excelentă idee!');
    expect(result.success).toBe(true);
    expect(suggestion!.status).toBe('approved');
    expect(suggestion!.adminFeedback).toBe('Excelentă idee!');
  });

  test('părintele poate respinge o sugestie', () => {
    const { suggestion } = manager.submitSuggestion({
      childId: 'dominic', type: 'activity', title: 'Robot LEGO',
    });

    const result = manager.respondToSuggestion(suggestion!.id, 'rejected', 'Mai târziu');
    expect(result.success).toBe(true);
    expect(suggestion!.status).toBe('rejected');
  });

  test('cashout: punctele se debitează la trimitere și se returnează la respingere', () => {
    const dominic = manager.children.find(c => c.id === 'dominic')!;
    const initialPoints = dominic.points;

    // Submit cashout
    const { suggestion } = manager.submitSuggestion({
      childId: 'dominic', type: 'cashout', title: 'Schimb bani',
      proposedPointsOrCost: 50,
    });
    expect(suggestion).toBeDefined();
    expect(dominic.points).toBe(initialPoints - 50);

    // Respinge → returnare puncte
    const result = manager.respondToSuggestion(suggestion!.id, 'rejected');
    expect(result.success).toBe(true);
    expect(result.refundedPoints).toBe(50);
    expect(dominic.points).toBe(initialPoints);
  });

  test('cashout: sold insuficient → eroare', () => {
    const result = manager.submitSuggestion({
      childId: 'dominic', type: 'cashout', title: 'Prea mult',
      proposedPointsOrCost: 9999,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('suficiente puncte');
  });

  test('cashout: sumă invalidă → eroare', () => {
    const result = manager.submitSuggestion({
      childId: 'dominic', type: 'cashout', title: 'Zero',
      proposedPointsOrCost: 0,
    });
    expect(result.success).toBe(false);
  });

  test('sugestiile sunt ordonate cronologic descendent', () => {
    // Create suggestions with explicit timestamps by setting createdAt manually
    const sug1 = manager.submitSuggestion({ childId: 'dominic', type: 'activity', title: 'Prima' }).suggestion!;
    const sug2 = manager.submitSuggestion({ childId: 'dominic', type: 'activity', title: 'A doua' }).suggestion!;
    const sug3 = manager.submitSuggestion({ childId: 'dominic', type: 'activity', title: 'A treia' }).suggestion!;

    // Manually set timestamps to ensure test determinism
    const baseTime = new Date('2026-07-03T12:00:00Z').getTime();
    const suggestions = manager.suggestions;
    suggestions[0].createdAt = new Date(baseTime - 2000).toISOString(); // Prima: oldest
    suggestions[1].createdAt = new Date(baseTime - 1000).toISOString(); // A doua: middle
    suggestions[2].createdAt = new Date(baseTime).toISOString();        // A treia: newest

    const sugs = manager.getChildSuggestions('dominic');
    expect(sugs).toHaveLength(3);
    expect(sugs[0].title).toBe('A treia');
    expect(sugs[2].title).toBe('Prima');
  });

  test('sugestiile de tip diferit pot fi trimise simultan', () => {
    const types: Array<'activity' | 'reward' | 'cashout' | 'other'> = ['activity', 'reward', 'cashout', 'other'];
    types.forEach(t => {
      const r = manager.submitSuggestion({
        childId: 'dominic',
        type: t,
        title: `Test ${t}`,
        proposedPointsOrCost: t === 'cashout' ? 10 : 50,
      });
      expect(r.success).toBe(true);
    });
    expect(manager.suggestions).toHaveLength(4);
  });

  test('copilul poate solicita de mai multe ori aceeași activitate', () => {
    manager.submitSuggestion({ childId: 'dominic', type: 'activity', title: 'Robot LEGO' });
    manager.submitSuggestion({ childId: 'dominic', type: 'activity', title: 'Robot LEGO' });
    manager.submitSuggestion({ childId: 'dominic', type: 'activity', title: 'Robot LEGO' });

    expect(manager.suggestions.length).toBe(3);
    expect(manager.totalPending).toBe(3);
  });
});

describe('Parent Admin — Adăugare Copii', () => {
  let manager: ChildManager;

  beforeEach(() => {
    manager = new ChildManager();
  });

  test('adaugă un copil nou', () => {
    const result = manager.addChild({ name: 'Andrei', age: 8, avatar: '🐶' });
    expect(result.success).toBe(true);
    expect(result.child).toBeDefined();
    expect(result.child!.name).toBe('Andrei');
    expect(result.child!.points).toBe(0);
  });

  test('nu permite nume duplicat', () => {
    manager.addChild({ name: 'Andrei', age: 8 });
    const result = manager.addChild({ name: 'Andrei', age: 10 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('deja');
  });

  test('numele gol → eroare', () => {
    const result = manager.addChild({ name: '', age: 5 });
    expect(result.success).toBe(false);
  });

  test('adaugă copii multipli', () => {
    manager.addChild({ name: 'Andrei', age: 8 });
    manager.addChild({ name: 'Maria', age: 6 });
    manager.addChild({ name: 'Ionut', age: 12 });
    expect(manager.children).toHaveLength(3);
  });

  test('generează id din nume corect', () => {
    const { child } = manager.addChild({ name: 'Andrei-Mihai', age: 8 });
    expect(child!.id).toBe('andreimihai');
  });
});

describe('Parent Admin — Animale de Companie', () => {
  let manager: PetManager;

  beforeEach(() => {
    manager = new PetManager();
  });

  test('adaugă un animal cu activități implicite', () => {
    const result = manager.addPet({ type: 'dog', name: 'Rex' });
    expect(result.success).toBe(true);
    expect(result.pet).toBeDefined();
    expect(result.pet!.name).toBe('Rex');
    expect(result.pet!.icon).toBe('🐕');
    expect(result.pet!.enabled).toBe(true);
    expect(result.pet!.activities.length).toBeGreaterThan(0);
  });

  test('adaugă mai multe tipuri de animale', () => {
    manager.addPet({ type: 'dog', name: 'Rex' });
    manager.addPet({ type: 'cat', name: 'Kitty' });
    expect(manager.pets).toHaveLength(2);
  });

  test('toggle activare/dezactivare animal', () => {
    const { pet } = manager.addPet({ type: 'dog', name: 'Rex' });
    expect(pet).toBeDefined();

    let result = manager.togglePet(pet!.id, false);
    expect(result.success).toBe(true);
    expect(pet!.enabled).toBe(false);

    result = manager.togglePet(pet!.id, true);
    expect(pet!.enabled).toBe(true);
  });

  test('toggle pe animal inexistent → eroare', () => {
    const result = manager.togglePet('inexistent', false);
    expect(result.success).toBe(false);
  });

  test('fiecare animal are activitățile specifice tipului', () => {
    const { pet: dog } = manager.addPet({ type: 'dog', name: 'Rex' });
    expect(dog!.activities.some(a => a.name.includes('Hrănire'))).toBe(true);
    expect(dog!.activities.some(a => a.name.includes('Plimbare'))).toBe(true);

    const { pet: cat } = manager.addPet({ type: 'cat', name: 'Kitty' });
    expect(cat!.activities.some(a => a.name.includes('Hrănire'))).toBe(true);
    expect(cat!.activities.some(a => a.name.includes('litieră'))).toBe(true);
  });

  test('tip invalid → eroare', () => {
    const result = manager.addPet({ type: 'dragon', name: 'Draco' });
    expect(result.success).toBe(false);
  });

  test('getEnabledPets returnează doar animalele active', () => {
    manager.addPet({ type: 'dog', name: 'Rex' });
    const { pet: cat } = manager.addPet({ type: 'cat', name: 'Kitty' });
    manager.togglePet(cat!.id, false);

    const enabled = manager.getEnabledPets();
    expect(enabled.length).toBeLessThan(2); // at most one enabled after disabling Kitty
    // Rex should be the enabled one
    expect(enabled.find(p => p.name === 'Rex')).toBeDefined();
  });
});

describe('Parent Admin — Configurare Activități', () => {
  let config: ConfigManager;

  beforeEach(() => {
    config = new ConfigManager();
  });

  test('adaugă activitate nouă', () => {
    const result = config.addActivity({
      childId: 'dominic',
      name: 'Curățenie cameră',
      description: 'Aspiră și aranjează jucăriile',
      points: 50,
    });
    expect(result.success).toBe(true);
    expect(result.activity).toBeDefined();
    expect(result.activity!.name).toBe('Curățenie cameră');
    expect(result.activity!.points).toBe(50);
  });

  test('adaugă activitate cu valori implicite', () => {
    const result = config.addActivity({ childId: 'dominic', name: 'Citește 30 min' });
    expect(result.success).toBe(true);
    expect(result.activity!.points).toBe(30);
  });

  test('actualizează activitate', () => {
    const { activity } = config.addActivity({ childId: 'dominic', name: 'Curățenie', points: 30 });
    const result = config.updateActivity(activity!.id, { name: 'Curățenie generală', points: 50 });
    expect(result.success).toBe(true);
    expect(activity!.name).toBe('Curățenie generală');
    expect(activity!.points).toBe(50);
  });

  test('șterge activitate', () => {
    const { activity } = config.addActivity({ childId: 'dominic', name: 'Curățenie' });
    expect(config.activities).toHaveLength(1);

    const result = config.deleteActivity(activity!.id);
    expect(result.success).toBe(true);
    expect(config.activities).toHaveLength(0);
  });

  test('șterge activitate inexistentă → eroare', () => {
    const result = config.deleteActivity('fake-id');
    expect(result.success).toBe(false);
  });

  test('adaugă activitate fără nume → eroare', () => {
    const result = config.addActivity({ childId: 'dominic', name: '' });
    expect(result.success).toBe(false);
  });
});

describe('Parent Admin — Configurare Recompense', () => {
  let config: ConfigManager;

  beforeEach(() => {
    config = new ConfigManager();
  });

  test('adaugă recompensă nouă', () => {
    const result = config.addReward({
      name: 'O oră TV',
      costPoints: 100,
      durationMinutes: 60,
      icon: '📺',
    });
    expect(result.success).toBe(true);
    expect(result.reward).toBeDefined();
    expect(result.reward!.name).toBe('O oră TV');
    expect(result.reward!.costPoints).toBe(100);
  });

  test('adaugă recompensă cu valori implicite', () => {
    const result = config.addReward({ name: 'Recompensă' });
    expect(result.success).toBe(true);
    expect(result.reward!.costPoints).toBe(50);
    expect(result.reward!.durationMinutes).toBe(0);
    expect(result.reward!.icon).toBe('🎁');
  });

  test('actualizează costul unei recompense', () => {
    const { reward } = config.addReward({ name: 'TV', costPoints: 100 });
    config.updateReward(reward!.id, { costPoints: 80 });
    expect(reward!.costPoints).toBe(80);
  });

  test('șterge recompensă', () => {
    const { reward } = config.addReward({ name: 'TV', costPoints: 100 });
    expect(config.rewards).toHaveLength(1);

    config.deleteReward(reward!.id);
    expect(config.rewards).toHaveLength(0);
  });

  test('șterge recompensă inexistentă → eroare', () => {
    const result = config.deleteReward('fake-id');
    expect(result.success).toBe(false);
  });

  test('adaugă recompensă fără nume → eroare', () => {
    const result = config.addReward({ name: '' });
    expect(result.success).toBe(false);
  });

  test('poți avea multiple recompense', () => {
    config.addReward({ name: 'TV', costPoints: 100 });
    config.addReward({ name: 'Xbox', costPoints: 120 });
    config.addReward({ name: 'YouTube', costPoints: 70 });
    config.addReward({ name: 'Social Media', costPoints: 50 });
    expect(config.rewards).toHaveLength(4);
  });
});

describe('Parent Admin — Flux Complet (integrare)', () => {
  test('scenariu: copilul solicită, părintele aprobă, activitatea e disponibilă', () => {
    const suggestionMgr = new SuggestionManager([{ id: 'andrei', name: 'Andrei', points: 100 }]);
    const configMgr = new ConfigManager();

    // 1. Copilul propune o activitate
    const { suggestion } = suggestionMgr.submitSuggestion({
      childId: 'andrei', type: 'activity', title: 'Construiește un castel',
      proposedPointsOrCost: 40,
    });
    expect(suggestion).toBeDefined();

    // 2. Părintele aprobă
    const response = suggestionMgr.respondToSuggestion(suggestion!.id, 'approved', 'Bravo!');
    expect(response.success).toBe(true);

    // 3. Părintele adaugă activitatea în config
    const added = configMgr.addActivity({
      childId: 'andrei', name: 'Construiește un castel',
      points: 40,
    });
    expect(added.success).toBe(true);
    expect(configMgr.activities).toHaveLength(1);
  });

  test('scenariu: adăugare copil + animal + activități config', () => {
    const childMgr = new ChildManager();
    const petMgr = new PetManager();
    const configMgr = new ConfigManager();

    // 1. Adaugă copil
    childMgr.addChild({ name: 'Ana', age: 7 });
    expect(childMgr.children).toHaveLength(1);

    // 2. Adaugă animal
    petMgr.addPet({ type: 'hamster', name: 'Pufi' });
    expect(petMgr.pets).toHaveLength(1);

    // 3. Adaugă activități custom
    configMgr.addActivity({ childId: 'ana', name: 'Citește o poveste', points: 30 });
    configMgr.addActivity({ childId: 'ana', name: 'Desenează un curcubeu', points: 20 });

    // 4. Adaugă recompense
    configMgr.addReward({ name: 'Desene animate', costPoints: 60, durationMinutes: 30 });

    expect(configMgr.activities).toHaveLength(2);
    expect(configMgr.rewards).toHaveLength(1);
  });
});
