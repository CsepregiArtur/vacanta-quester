/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Child {
  id: string; // "dominic" | "sofia"
  name: string;
  age: number;
  points: number;
  avatar: string;
  readingStreak: number;
  daysSinceLastReading: number; // For forcing reading on 4th day
  claimedStreakMilestones?: string[];
  activeTimer: {
    rewardId: string;
    rewardName: string;
    startedAt: string;
    expiresAt: string;
    durationMinutes: number;
    minutesLeft: number;
    isActive: boolean;
  } | null;
}

export type TaskStatus = "pending" | "submitted" | "approved" | "rejected";

export interface ActiveTask {
  id: string;
  childId: string;
  name: string;
  type: "reading" | "dog_walk" | "chore" | "custom";
  description: string;
  points: number;
  status: TaskStatus;
  completedAt?: string;
  
  // Specific for reading task
  readingTopic?: string;
  readingPassage?: string;
  difficultyClass?: string;
  readingQuestions?: {
    id: number;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    selectedAnswerIndex?: number;
    feedback?: string;
  }[];
  readingScore?: number; // how many questions got correct
  
  // Specific for dog walk task
  walkTimeSlot?: "morning" | "midday" | "evening";

  // Specific for chore verification
  choreFeedback?: string;

  // Task Category & Streak properties
  category?: "Educational" | "Physical Activity" | "Household" | "Other" | "lectură" | "sport" | "STEM" | "robotică" | "LEGO" | "natură";
  streak?: number;
}

export interface StoreReward {
  id: string;
  name: string;
  costPoints: number;
  durationMinutes: number;
  icon: string;
  entityId?: string; // Home Assistant entity or switch or helper input_boolean
}

export interface HomeAssistantConfig {
  url: string;
  token: string;
  enabled: boolean;
  tvEntityId?: string;
  xboxEntityId?: string;
}

export interface ParentNotification {
  id: string;
  childName: string;
  message: string;
  timestamp: string;
  type: "info" | "success" | "warning";
}

export interface NextDayTopicProposal {
  childId: string;
  topic: string;
  customPrompt?: string;
  customQuestions?: string; // user-entered custom questions
  approved: boolean; // if true, it is locked in for tomorrow
}

export interface ChildSuggestion {
  id: string;
  childId: string;
  childName: string;
  type: "activity" | "reward" | "cashout" | "other";
  title: string;
  description: string;
  proposedPointsOrCost?: number;
  proposedDurationMinutes?: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  adminFeedback?: string;
}

export interface UploadedPhoto {
  id: string;
  childId: string;
  childName: string;
  activityName: string;
  photoUrl: string;
  status: string;
  feedback: string;
  timestamp: string;
}

export interface ScreenTimeRequest {
  id: string;
  childId: string;
  childName: string;
  rewardId: string;
  rewardName: string;
  durationMinutes: number;
  timestamp: string;
  status: "pending" | "fulfilled";
  confirmedAt?: string;
  costPoints: number;
  pointsDebited?: boolean;
}

export interface AppState {
  children: Child[];
  activeTasks: ActiveTask[];
  notifications: ParentNotification[];
  topicProposals: NextDayTopicProposal[];
  suggestions: ChildSuggestion[];
  uploadedPhotosHistory?: UploadedPhoto[];
  screenTimeRequests?: ScreenTimeRequest[];
  customRewards?: StoreReward[];
  homeAssistant: HomeAssistantConfig;
  dogWalkEnabled?: boolean;
  dogWalkWindows?: {
    morning: { start: number; end: number };
    midday: { start: number; end: number };
    evening: { start: number; end: number };
  };
  dogWalkStatus: {
    morning: { childId: string | null; time: string | null; feedback?: string; approved?: boolean; photoUrl?: string };
    midday: { childId: string | null; time: string | null; feedback?: string; approved?: boolean; photoUrl?: string };
    evening: { childId: string | null; time: string | null; feedback?: string; approved?: boolean; photoUrl?: string };
  };
  tomorrowSchedule?: Record<string, {
    app: string;
    durationMinutes: number;
    reason: string;
  } | null>;
  parentPin?: string;
  parentEmail?: string;
  emailsSent?: any[];
  readingHistory?: any[];
  pointsHistory?: {
    date: string;
    dateKey: string;
    dominic: number;
    sofia: number;
  }[];
  activityTimeLogs?: {
    id: string;
    childId: string;
    childName: string;
    activityType: "reading" | "quiz" | "dog_walk" | "chore" | "custom" | "store_spend";
    activityName: string;
    durationSeconds: number;
    timestamp: string;
    details?: string;
  }[];
  smtpConfig?: {
    enabled: boolean;
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
  };
  lastUpdated?: string;
  pets?: PetCompanion[];
}

/**
 * Pet / Animal Companion Types
 */

export type PetType = "dog" | "cat" | "hamster" | "rabbit" | "fish" | "bird" | "turtle" | "other";

export interface PetActivity {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  slot?: "morning" | "midday" | "evening";
}

export interface PetCompanion {
  id: string;
  familyId: string;
  type: PetType;
  name: string;
  icon: string;
  enabled: boolean;
  activities: PetActivity[];
  createdAt: string;
}

export const PET_ACTIVITIES_BY_TYPE: Record<string, { label: string; icon: string; activities: PetActivity[] }> = {
  dog: {
    label: "Câine", icon: "🐕",
    activities: [
      { id: "dog_feed", name: "Hrănire câine", description: "Hrănește câinele", points: 20, icon: "🍗" },
      { id: "dog_walk_morning", name: "Plimbare dimineața", description: "Plimbă câinele dimineața", points: 40, icon: "🌅", slot: "morning" },
      { id: "dog_walk_midday", name: "Plimbare la prânz", description: "Plimbă câinele la prânz", points: 40, icon: "☀️", slot: "midday" },
      { id: "dog_walk_evening", name: "Plimbare seara", description: "Plimbă câinele seara", points: 40, icon: "🌆", slot: "evening" },
      { id: "dog_brush", name: "Periere câine", description: "Perie câinele", points: 25, icon: "🪮" },
    ],
  },
  cat: {
    label: "Pisică", icon: "🐈",
    activities: [
      { id: "cat_feed", name: "Hrănire pisică", description: "Hrănește pisica", points: 20, icon: "🥫" },
      { id: "cat_play", name: "Joacă cu pisica", description: "Joacă-te cu pisica 15 minute", points: 30, icon: "🧶" },
      { id: "cat_litter", name: "Curățare litieră", description: "Curăță litiera pisicii", points: 35, icon: "🧹" },
      { id: "cat_brush", name: "Periere pisică", description: "Perie pisica", points: 25, icon: "🪮" },
    ],
  },
  hamster: {
    label: "Hamster", icon: "🐹",
    activities: [
      { id: "hamster_feed", name: "Hrănire hamster", description: "Hrănește hamsterul", points: 15, icon: "🥜" },
      { id: "hamster_clean", name: "Curățare cușcă", description: "Curăță cușca", points: 30, icon: "🧹" },
      { id: "hamster_play", name: "Joacă cu hamsterul", description: "Joacă-te cu hamsterul", points: 20, icon: "⚪" },
    ],
  },
  rabbit: {
    label: "Iepure", icon: "🐰",
    activities: [
      { id: "rabbit_feed", name: "Hrănire iepure", description: "Hrănește iepurele", points: 15, icon: "🥕" },
      { id: "rabbit_clean", name: "Curățare cușcă", description: "Curăță cușca iepurelui", points: 30, icon: "🧹" },
      { id: "rabbit_play", name: "Joacă cu iepurele", description: "Joacă-te cu iepurele", points: 20, icon: "🐇" },
    ],
  },
  fish: {
    label: "Peștișor", icon: "🐟",
    activities: [
      { id: "fish_feed", name: "Hrănire pești", description: "Hrănește peștii", points: 10, icon: "🪱" },
      { id: "fish_clean", name: "Curățare acvariu", description: "Curăță acvariul", points: 35, icon: "🧽" },
    ],
  },
  bird: {
    label: "Pasăre", icon: "🐦",
    activities: [
      { id: "bird_feed", name: "Hrănire pasăre", description: "Hrănește pasărea", points: 15, icon: "🌾" },
      { id: "bird_clean", name: "Curățare colivie", description: "Curăță colivia", points: 25, icon: "🧹" },
      { id: "bird_play", name: "Joacă cu pasărea", description: "Joacă-te cu pasărea", points: 20, icon: "🪶" },
    ],
  },
  turtle: {
    label: "Broască țestoasă", icon: "🐢",
    activities: [
      { id: "turtle_feed", name: "Hrănire țestoasă", description: "Hrănește țestoasa", points: 15, icon: "🥬" },
      { id: "turtle_clean", name: "Curățare terariu", description: "Curăță terariul", points: 30, icon: "🧹" },
    ],
  },
  other: {
    label: "Alt animal", icon: "🐾",
    activities: [
      { id: "other_feed", name: "Hrănire animal", description: "Hrănește animalul", points: 15, icon: "🍽️" },
      { id: "other_clean", name: "Curățare spațiu", description: "Curăță spațiul animalului", points: 25, icon: "🧹" },
      { id: "other_play", name: "Joacă cu animalul", description: "Joacă-te cu animalul", points: 20, icon: "🎾" },
    ],
  },
};
