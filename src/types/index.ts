export interface Surah {
  number: number;
  name: string;
  fullName: string;
  englishName: string;
  englishTranslation: string;
  revelationType: string;
  ayahCount: number;
}

export interface Ayah {
  surahNumber: number;
  ayahNumber: number;
  text: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserAccount extends User {
  passwordHash: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
}

export interface UserSettings {
  dailyAvailableMinutes: number;
  studyDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  quranFontSize: 'small' | 'medium' | 'large' | 'xlarge';
  soundEnabled: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
}

export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface MemorizationGoal {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  targetCompletionDate: string;
  startMode: 'beginning' | 'custom_position';
  startingSurahId: number;
  startingAyahNumber: number;
  endingSurahId: number;
  endingAyahNumber: number;
  dailyAvailableMinutes: number;
  studyDays: number[];
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MemorizationRange {
  id: string;
  userId: string;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  sourceType: 'pre_existing' | 'goal_memorized';
  createdAt: string;
}

export type AyahStatus = 
  | 'unmemorized'
  | 'memorized_prior'
  | 'memorized_new'
  | 'consolidating'
  | 'needs_review'
  | 'mastered';

export interface AyahProgress {
  key: string; // `${surahNumber}_${ayahNumber}`
  userId: string;
  surahNumber: number;
  ayahNumber: number;
  status: AyahStatus;
  firstMemorizedAt?: string;
  lastStudiedAt?: string;
  lastReviewedAt?: string;
  reviewsCount: number;
  errorsCount: number;
  selfRating?: number; // 1 to 5
  estimatedMastery: number; // 1.0 to 5.0
  consecutiveGoodReviews: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskType = 'new_memorization' | 'consolidation' | 'review';
export type TaskStatus = 'scheduled' | 'in_progress' | 'completed' | 'partial' | 'overdue' | 'cancelled';

export interface DailyTask {
  id: string;
  planId: string;
  goalId: string;
  userId: string;
  taskType: TaskType;
  scheduledDate: string; // YYYY-MM-DD
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  ayahCount: number;
  estimatedMinutes: number;
  status: TaskStatus;
  completionPercentage: number;
  completedAyahsCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlan {
  id: string;
  goalId: string;
  userId: string;
  versionNumber: number;
  status: 'active' | 'superseded' | 'archived' | 'draft';
  generatedAt: string;
  activatedAt?: string;
  totalDays: number;
  studyDaysCount: number;
  paceAyahsPerDay: number;
  totalNewAyahs: number;
  feasibilityScore: number; // 0 to 100
  feasibilityWarning?: string;
}

export type SessionType = 'new_memorization' | 'consolidation' | 'review' | 'independent';

export interface SessionAyahDetail {
  surahNumber: number;
  ayahNumber: number;
  completed: boolean;
  errors: number;
}

export interface StudySession {
  id: string;
  userId: string;
  goalId?: string;
  taskId?: string;
  sessionType: SessionType;
  startedAt: string;
  endedAt: string;
  actualDurationSeconds: number;
  ayahs: SessionAyahDetail[];
  selfRating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  status: 'completed' | 'aborted';
  createdAt: string;
}

export interface ReviewRecord {
  id: string;
  userId: string;
  sessionId: string;
  reviewDate: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  result: 'excellent' | 'good' | 'average' | 'poor';
  selfRating: 1 | 2 | 3 | 4 | 5;
  errorsObserved: number;
  intervalDaysApplied: number;
  nextReviewRecommendation: string;
  reasoning: string;
  algorithmVersion: string;
  notes?: string;
  createdAt: string;
}

export interface PlanChangeProposal {
  id: string;
  goalId: string;
  currentPlanId: string;
  reason: string;
  uncompletedTasksCount: number;
  suggestedAction: 'extend_deadline' | 'redistribute_load' | 'reduce_new_hifdh';
  proposedNewTargetDate?: string;
  proposedPaceChange?: number;
  impactSummary: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  decidedAt?: string;
}
