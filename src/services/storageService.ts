import {
  User,
  UserSettings,
  MemorizationGoal,
  MemorizationRange,
  AyahProgress,
  StudyPlan,
  DailyTask,
  StudySession,
  ReviewRecord,
  PlanChangeProposal,
  AyahStatus
} from '../types';
import { QuranService } from './quranService';

const STORAGE_KEYS = {
  USER: 'khitam_user_v1',
  SETTINGS: 'khitam_settings_v1',
  GOALS: 'khitam_goals_v1',
  ACTIVE_GOAL_ID: 'khitam_active_goal_id_v1',
  RANGES: 'khitam_ranges_v1',
  AYAH_PROGRESS: 'khitam_ayah_progress_v1',
  PLANS: 'khitam_plans_v1',
  TASKS: 'khitam_tasks_v1',
  SESSIONS: 'khitam_sessions_v1',
  REVIEWS: 'khitam_reviews_v1',
  PROPOSALS: 'khitam_proposals_v1',
  IDEMPOTENCY: 'khitam_idempotency_v1',
};

export class StorageService {
  // Idempotency cache to prevent double submission
  private static processedTokens: Set<string> = new Set();

  public static initialize(): void {
    // Check if initial data exists, if not seed initial demo user & goal
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      this.seedInitialData();
    }
  }

  private static seedInitialData(): void {
    const user: User = {
      id: 'usr_default_1',
      name: 'عبد الله محمد',
      email: 'abdullah@khitam.org',
      createdAt: new Date().toISOString(),
    };

    const settings: UserSettings = {
      dailyAvailableMinutes: 45,
      studyDays: [0, 1, 2, 3, 4, 6], // Sun, Mon, Tue, Wed, Thu, Sat (Friday rest)
      quranFontSize: 'medium',
      soundEnabled: true,
      reminderEnabled: true,
      reminderTime: '06:30',
    };

    // Today's date in YYYY-MM-DD
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 14); // Started 14 days ago

    const targetDate = new Date(today);
    targetDate.setMonth(today.getMonth() + 10); // Target in 10 months

    const goal: MemorizationGoal = {
      id: 'goal_101',
      userId: user.id,
      name: 'رحلة إتمام حفظ القرآن الكريم',
      startDate: startDate.toISOString().split('T')[0],
      targetCompletionDate: targetDate.toISOString().split('T')[0],
      startMode: 'beginning',
      startingSurahId: 1,
      startingAyahNumber: 1,
      endingSurahId: 114,
      endingAyahNumber: 6,
      dailyAvailableMinutes: 45,
      studyDays: [0, 1, 2, 3, 4, 6],
      status: 'active',
      createdAt: startDate.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prior memorization range: User had already memorized Juz Amma (Surah 78 to 114)
    // and Surah Al-Fatihah (1) before starting this goal!
    const ranges: MemorizationRange[] = [
      {
        id: 'rng_fatiha',
        userId: user.id,
        startSurah: 1,
        startAyah: 1,
        endSurah: 1,
        endAyah: 7,
        sourceType: 'pre_existing',
        createdAt: startDate.toISOString(),
      },
      {
        id: 'rng_juz_amma',
        userId: user.id,
        startSurah: 78,
        startAyah: 1,
        endSurah: 114,
        endAyah: 6,
        sourceType: 'pre_existing',
        createdAt: startDate.toISOString(),
      },
    ];

    // Seed progress map
    const progressMap: Record<string, AyahProgress> = {};

    // 1. Mark prior memorized ranges
    const fatihaAyahs = QuranService.getAyahsInRange(1, 1, 1, 7);
    fatihaAyahs.forEach((a) => {
      const key = `${a.surahNumber}_${a.ayahNumber}`;
      progressMap[key] = {
        key,
        userId: user.id,
        surahNumber: a.surahNumber,
        ayahNumber: a.ayahNumber,
        status: 'mastered',
        firstMemorizedAt: startDate.toISOString(),
        lastStudiedAt: startDate.toISOString(),
        lastReviewedAt: today.toISOString(),
        reviewsCount: 12,
        errorsCount: 0,
        selfRating: 5,
        estimatedMastery: 4.9,
        consecutiveGoodReviews: 6,
        createdAt: startDate.toISOString(),
        updatedAt: today.toISOString(),
      };
    });

    const ammaAyahs = QuranService.getAyahsInRange(78, 1, 114, 6);
    ammaAyahs.forEach((a) => {
      const key = `${a.surahNumber}_${a.ayahNumber}`;
      progressMap[key] = {
        key,
        userId: user.id,
        surahNumber: a.surahNumber,
        ayahNumber: a.ayahNumber,
        status: 'memorized_prior',
        firstMemorizedAt: startDate.toISOString(),
        lastStudiedAt: startDate.toISOString(),
        lastReviewedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        reviewsCount: 4,
        errorsCount: 1,
        selfRating: 4,
        estimatedMastery: 4.1,
        consecutiveGoodReviews: 3,
        createdAt: startDate.toISOString(),
        updatedAt: today.toISOString(),
      };
    });

    // 2. Mark newly memorized under this goal: Al-Baqarah verses 1 to 141 (Juz 1 completed in the goal!)
    const baqarahNew = QuranService.getAyahsInRange(2, 1, 2, 141);
    baqarahNew.forEach((a) => {
      const key = `${a.surahNumber}_${a.ayahNumber}`;
      const isConsolidating = a.ayahNumber > 120;
      progressMap[key] = {
        key,
        userId: user.id,
        surahNumber: a.surahNumber,
        ayahNumber: a.ayahNumber,
        status: isConsolidating ? 'consolidating' : 'memorized_new',
        firstMemorizedAt: new Date(Date.now() - (142 - a.ayahNumber) * 86400000 * 0.1).toISOString(),
        lastStudiedAt: new Date().toISOString(),
        lastReviewedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        reviewsCount: 3,
        errorsCount: isConsolidating ? 1 : 0,
        selfRating: isConsolidating ? 3 : 4,
        estimatedMastery: isConsolidating ? 3.4 : 4.2,
        consecutiveGoodReviews: isConsolidating ? 1 : 2,
        createdAt: startDate.toISOString(),
        updatedAt: today.toISOString(),
      };
    });

    // Seed active Study Plan
    const plan: StudyPlan = {
      id: 'plan_v1_0',
      goalId: goal.id,
      userId: user.id,
      versionNumber: 1,
      status: 'active',
      generatedAt: startDate.toISOString(),
      activatedAt: startDate.toISOString(),
      totalDays: 300,
      studyDaysCount: 257,
      paceAyahsPerDay: 18,
      totalNewAyahs: 4629,
      feasibilityScore: 92,
    };

    // Seed Tasks for Today and surrounding days
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const inTwoDaysStr = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    const tasks: DailyTask[] = [
      {
        id: 'tsk_yesterday_1',
        planId: plan.id,
        goalId: goal.id,
        userId: user.id,
        taskType: 'new_memorization',
        scheduledDate: yesterdayStr,
        startSurah: 2,
        startAyah: 121,
        endSurah: 2,
        endAyah: 141,
        ayahCount: 21,
        estimatedMinutes: 25,
        status: 'completed',
        completionPercentage: 100,
        completedAyahsCount: 21,
        createdAt: startDate.toISOString(),
        updatedAt: yesterdayStr,
      },
      {
        id: 'tsk_today_new',
        planId: plan.id,
        goalId: goal.id,
        userId: user.id,
        taskType: 'new_memorization',
        scheduledDate: todayStr,
        startSurah: 2,
        startAyah: 142,
        endSurah: 2,
        endAyah: 157,
        ayahCount: 16,
        estimatedMinutes: 20,
        status: 'scheduled',
        completionPercentage: 0,
        completedAyahsCount: 0,
        createdAt: startDate.toISOString(),
        updatedAt: todayStr,
      },
      {
        id: 'tsk_today_consolidation',
        planId: plan.id,
        goalId: goal.id,
        userId: user.id,
        taskType: 'consolidation',
        scheduledDate: todayStr,
        startSurah: 2,
        startAyah: 121,
        endSurah: 2,
        endAyah: 141,
        ayahCount: 21,
        estimatedMinutes: 12,
        status: 'scheduled',
        completionPercentage: 0,
        completedAyahsCount: 0,
        createdAt: startDate.toISOString(),
        updatedAt: todayStr,
      },
      {
        id: 'tsk_today_review',
        planId: plan.id,
        goalId: goal.id,
        userId: user.id,
        taskType: 'review',
        scheduledDate: todayStr,
        startSurah: 2,
        startAyah: 1,
        endSurah: 2,
        endAyah: 50,
        ayahCount: 50,
        estimatedMinutes: 15,
        status: 'scheduled',
        completionPercentage: 0,
        completedAyahsCount: 0,
        createdAt: startDate.toISOString(),
        updatedAt: todayStr,
      },
      {
        id: 'tsk_tomorrow_new',
        planId: plan.id,
        goalId: goal.id,
        userId: user.id,
        taskType: 'new_memorization',
        scheduledDate: tomorrowStr,
        startSurah: 2,
        startAyah: 158,
        endSurah: 2,
        endAyah: 176,
        ayahCount: 19,
        estimatedMinutes: 22,
        status: 'scheduled',
        completionPercentage: 0,
        completedAyahsCount: 0,
        createdAt: startDate.toISOString(),
        updatedAt: startDate.toISOString(),
      },
      {
        id: 'tsk_in2days_new',
        planId: plan.id,
        goalId: goal.id,
        userId: user.id,
        taskType: 'new_memorization',
        scheduledDate: inTwoDaysStr,
        startSurah: 2,
        startAyah: 177,
        endSurah: 2,
        endAyah: 196,
        ayahCount: 20,
        estimatedMinutes: 25,
        status: 'scheduled',
        completionPercentage: 0,
        completedAyahsCount: 0,
        createdAt: startDate.toISOString(),
        updatedAt: startDate.toISOString(),
      },
    ];

    // Seed Recent Study Sessions
    const sessions: StudySession[] = [
      {
        id: 'ses_1',
        userId: user.id,
        goalId: goal.id,
        taskId: 'tsk_yesterday_1',
        sessionType: 'new_memorization',
        startedAt: new Date(Date.now() - 86400000 - 3600000).toISOString(),
        endedAt: new Date(Date.now() - 86400000 - 1800000).toISOString(),
        actualDurationSeconds: 1650, // 27.5 minutes
        ayahs: QuranService.getAyahsInRange(2, 121, 2, 141).map((a) => ({
          surahNumber: a.surahNumber,
          ayahNumber: a.ayahNumber,
          completed: true,
          errors: 0,
        })),
        selfRating: 4,
        notes: 'حفظ سلس بفضل الله وتركيز على الآيات المتشابهة.',
        status: 'completed',
        createdAt: yesterdayStr,
      },
      {
        id: 'ses_2',
        userId: user.id,
        goalId: goal.id,
        sessionType: 'review',
        startedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        endedAt: new Date(Date.now() - 2 * 86400000 + 1200000).toISOString(),
        actualDurationSeconds: 1200,
        ayahs: QuranService.getAyahsInRange(78, 1, 80, 42).map((a) => ({
          surahNumber: a.surahNumber,
          ayahNumber: a.ayahNumber,
          completed: true,
          errors: 1,
        })),
        selfRating: 4,
        notes: 'مراجعة سريعة لسور النبأ والنازعات وعبس.',
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ];

    // Seed Review Records
    const reviews: ReviewRecord[] = [
      {
        id: 'rev_1',
        userId: user.id,
        sessionId: 'ses_2',
        reviewDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        surahNumber: 78,
        startAyah: 1,
        endAyah: 40,
        result: 'good',
        selfRating: 4,
        errorsObserved: 0,
        intervalDaysApplied: 7,
        nextReviewRecommendation: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        reasoning: 'أداء مستقر وتقييم ذاتي جيد (4/5) مع انعدام الأخطاء، مما يسمح بمضاعفة الفاصل الزمني إلى 7 أيام.',
        algorithmVersion: 'Khitam-SpacedRep-1.0',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ];

    // Persist all
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([goal]));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GOAL_ID, goal.id);
    localStorage.setItem(STORAGE_KEYS.RANGES, JSON.stringify(ranges));
    localStorage.setItem(STORAGE_KEYS.AYAH_PROGRESS, JSON.stringify(progressMap));
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify([plan]));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify([]));
  }

  // --- User & Settings ---

  public static getUser(): User {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) {
      this.seedInitialData();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)!);
    }
    return JSON.parse(raw);
  }

  public static saveUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  public static getSettings(): UserSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw
      ? JSON.parse(raw)
      : {
          dailyAvailableMinutes: 45,
          studyDays: [0, 1, 2, 3, 4, 6],
          quranFontSize: 'medium',
          soundEnabled: true,
          reminderEnabled: true,
          reminderTime: '06:30',
        };
  }

  public static saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- Goals ---

  public static getGoals(): MemorizationGoal[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    return raw ? JSON.parse(raw) : [];
  }

  public static getActiveGoal(): MemorizationGoal | null {
    const goals = this.getGoals();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_GOAL_ID);
    if (activeId) {
      const found = goals.find((g) => g.id === activeId);
      if (found) return found;
    }
    return goals.find((g) => g.status === 'active') || goals[0] || null;
  }

  public static saveGoal(goal: MemorizationGoal): void {
    const goals = this.getGoals();
    const idx = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) {
      goals[idx] = goal;
    } else {
      goals.unshift(goal);
    }
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    if (goal.status === 'active') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GOAL_ID, goal.id);
    }
  }

  public static setActiveGoal(goalId: string): void {
    const goals = this.getGoals().map((g) => ({
      ...g,
      status: (g.id === goalId ? 'active' : 'paused') as GoalStatus,
    }));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GOAL_ID, goalId);
  }

  // --- Ranges ---

  public static getRanges(): MemorizationRange[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RANGES);
    return raw ? JSON.parse(raw) : [];
  }

  public static saveRanges(ranges: MemorizationRange[]): void {
    localStorage.setItem(STORAGE_KEYS.RANGES, JSON.stringify(ranges));
  }

  public static addRange(range: Omit<MemorizationRange, 'id' | 'createdAt'>): MemorizationRange {
    const ranges = this.getRanges();
    const newRange: MemorizationRange = {
      ...range,
      id: `rng_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    ranges.push(newRange);
    this.saveRanges(ranges);

    // Synchronize ayah progress for this range without double-counting!
    const ayahs = QuranService.getAyahsInRange(
      range.startSurah,
      range.startAyah,
      range.endSurah,
      range.endAyah
    );

    const progressMap = this.getProgressMap();
    ayahs.forEach((a) => {
      const key = `${a.surahNumber}_${a.ayahNumber}`;
      if (!progressMap[key] || progressMap[key].status === 'unmemorized') {
        progressMap[key] = {
          key,
          userId: range.userId,
          surahNumber: a.surahNumber,
          ayahNumber: a.ayahNumber,
          status: range.sourceType === 'pre_existing' ? 'memorized_prior' : 'memorized_new',
          firstMemorizedAt: new Date().toISOString(),
          lastStudiedAt: new Date().toISOString(),
          reviewsCount: 1,
          errorsCount: 0,
          selfRating: 4,
          estimatedMastery: 4.0,
          consecutiveGoodReviews: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    });
    this.saveProgressMap(progressMap);

    return newRange;
  }

  // --- Ayah Progress ---

  public static getProgressMap(): Record<string, AyahProgress> {
    const raw = localStorage.getItem(STORAGE_KEYS.AYAH_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  }

  public static saveProgressMap(map: Record<string, AyahProgress>): void {
    localStorage.setItem(STORAGE_KEYS.AYAH_PROGRESS, JSON.stringify(map));
  }

  public static getAyahProgress(surah: number, ayah: number): AyahProgress | null {
    const map = this.getProgressMap();
    return map[`${surah}_${ayah}`] || null;
  }

  /**
   * Coverage stats calculated strictly on unique verses (no duplication!)
   */
  public static getCoverageStats(userId: string) {
    const map = this.getProgressMap();
    let totalMemorized = 0;
    let priorMemorized = 0;
    let newGoalMemorized = 0;
    let inConsolidation = 0;
    let needsReview = 0;
    let mastered = 0;

    Object.values(map).forEach((p) => {
      if (p.userId !== userId) return;

      if (p.status !== 'unmemorized') {
        totalMemorized++;
      }

      if (p.status === 'memorized_prior') {
        priorMemorized++;
      } else if (p.status === 'memorized_new') {
        newGoalMemorized++;
      } else if (p.status === 'consolidating') {
        inConsolidation++;
      } else if (p.status === 'needs_review') {
        needsReview++;
      } else if (p.status === 'mastered') {
        mastered++;
      }
    });

    const totalQuranAyahs = 6236;
    const totalRemaining = totalQuranAyahs - totalMemorized;
    const coveragePercentage = ((totalMemorized / totalQuranAyahs) * 100);

    return {
      totalMemorized,
      priorMemorized,
      newGoalMemorized,
      inConsolidation,
      needsReview,
      mastered,
      totalRemaining,
      totalQuranAyahs,
      coveragePercentage: Number(coveragePercentage.toFixed(2)),
    };
  }

  // --- Plans ---

  public static getPlans(): StudyPlan[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PLANS);
    return raw ? JSON.parse(raw) : [];
  }

  public static getActivePlan(goalId: string): StudyPlan | null {
    const plans = this.getPlans();
    return plans.find((p) => p.goalId === goalId && p.status === 'active') || null;
  }

  public static savePlan(plan: StudyPlan): void {
    const plans = this.getPlans();
    // If activating this plan, archive/supersede previous active plans for this goal
    if (plan.status === 'active') {
      plans.forEach((p) => {
        if (p.goalId === plan.goalId && p.id !== plan.id && p.status === 'active') {
          p.status = 'superseded';
        }
      });
    }

    const idx = plans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) {
      plans[idx] = plan;
    } else {
      plans.unshift(plan);
    }
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  }

  // --- Tasks ---

  public static getTasks(): DailyTask[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    return raw ? JSON.parse(raw) : [];
  }

  public static getTasksForDate(dateStr: string): DailyTask[] {
    return this.getTasks().filter((t) => t.scheduledDate === dateStr);
  }

  public static saveTasks(tasks: DailyTask[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  public static updateTask(task: DailyTask): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = { ...task, updatedAt: new Date().toISOString() };
      this.saveTasks(tasks);
    }
  }

  // --- Sessions & Idempotency ---

  public static getSessions(): StudySession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  }

  /**
   * Records a study session with Idempotency Token protection
   * Supports PARTIAL completion accurately: only completed ayahs are marked done!
   */
  public static recordSession(
    session: Omit<StudySession, 'id' | 'createdAt'>,
    idempotencyKey?: string
  ): { success: boolean; session: StudySession; message: string } {
    if (idempotencyKey) {
      const rawTokens = localStorage.getItem(STORAGE_KEYS.IDEMPOTENCY);
      const tokens: string[] = rawTokens ? JSON.parse(rawTokens) : [];
      if (tokens.includes(idempotencyKey)) {
        return {
          success: false,
          session: {} as StudySession,
          message: 'تم تسجيل هذه الجلسة مسبقاً وتفادي التكرار (Idempotent Request)',
        };
      }
      tokens.push(idempotencyKey);
      localStorage.setItem(STORAGE_KEYS.IDEMPOTENCY, JSON.stringify(tokens.slice(-500)));
    }

    const newSession: StudySession = {
      ...session,
      id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const sessions = this.getSessions();
    sessions.unshift(newSession);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    // Update Ayah Progress records for each ayah touched in the session!
    const progressMap = this.getProgressMap();
    const nowIso = new Date().toISOString();

    session.ayahs.forEach((item) => {
      const key = `${item.surahNumber}_${item.ayahNumber}`;
      const existing = progressMap[key];

      if (item.completed) {
        if (!existing) {
          progressMap[key] = {
            key,
            userId: session.userId,
            surahNumber: item.surahNumber,
            ayahNumber: item.ayahNumber,
            status: session.sessionType === 'new_memorization' ? 'memorized_new' : 'consolidating',
            firstMemorizedAt: nowIso,
            lastStudiedAt: nowIso,
            lastReviewedAt: session.sessionType === 'review' ? nowIso : undefined,
            reviewsCount: session.sessionType === 'review' ? 1 : 0,
            errorsCount: item.errors || 0,
            selfRating: session.selfRating || 4,
            estimatedMastery: session.selfRating ? session.selfRating * 0.8 : 3.5,
            consecutiveGoodReviews: (session.selfRating || 4) >= 4 ? 1 : 0,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
        } else {
          // Update existing progress
          existing.lastStudiedAt = nowIso;
          existing.updatedAt = nowIso;
          existing.errorsCount += item.errors || 0;

          if (session.sessionType === 'new_memorization' && existing.status === 'unmemorized') {
            existing.status = 'memorized_new';
            existing.firstMemorizedAt = existing.firstMemorizedAt || nowIso;
          } else if (session.sessionType === 'consolidation') {
            existing.status = 'consolidating';
          } else if (session.sessionType === 'review') {
            existing.lastReviewedAt = nowIso;
            existing.reviewsCount += 1;
            if (session.selfRating && session.selfRating >= 4) {
              existing.consecutiveGoodReviews += 1;
              if (existing.consecutiveGoodReviews >= 3 && existing.errorsCount === 0) {
                existing.status = 'mastered';
              }
            } else if (session.selfRating && session.selfRating <= 2) {
              existing.consecutiveGoodReviews = 0;
              existing.status = 'needs_review';
            }
          }

          if (session.selfRating) {
            existing.selfRating = session.selfRating;
            // Weighted average for estimated mastery
            existing.estimatedMastery = Number(
              Math.min(5, Math.max(1, existing.estimatedMastery * 0.6 + session.selfRating * 0.4)).toFixed(1)
            );
          }
        }
      }
    });

    this.saveProgressMap(progressMap);

    // If session was linked to a task, update the task status & completion percentage
    if (session.taskId) {
      const tasks = this.getTasks();
      const task = tasks.find((t) => t.id === session.taskId);
      if (task) {
        const completedCount = session.ayahs.filter((a) => a.completed).length;
        task.completedAyahsCount = completedCount;
        task.completionPercentage = Math.round((completedCount / task.ayahCount) * 100);

        if (completedCount >= task.ayahCount) {
          task.status = 'completed';
        } else if (completedCount > 0) {
          task.status = 'partial';
        }
        task.updatedAt = nowIso;
        this.saveTasks(tasks);
      }
    }

    return {
      success: true,
      session: newSession,
      message: 'تم تسجيل الجلسة بنجاح وتحديث مؤشرات الإنجاز',
    };
  }

  // --- Reviews ---

  public static getReviews(): ReviewRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return raw ? JSON.parse(raw) : [];
  }

  public static saveReview(review: Omit<ReviewRecord, 'id' | 'createdAt'>): ReviewRecord {
    const newRecord: ReviewRecord = {
      ...review,
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const reviews = this.getReviews();
    reviews.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    return newRecord;
  }

  // --- Proposals ---

  public static getProposals(): PlanChangeProposal[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROPOSALS);
    return raw ? JSON.parse(raw) : [];
  }

  public static saveProposal(proposal: PlanChangeProposal): void {
    const list = this.getProposals();
    const idx = list.findIndex((p) => p.id === proposal.id);
    if (idx >= 0) {
      list[idx] = proposal;
    } else {
      list.unshift(proposal);
    }
    localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(list));
  }

  public static decideProposal(proposalId: string, decision: 'accepted' | 'rejected'): boolean {
    const list = this.getProposals();
    const proposal = list.find((p) => p.id === proposalId);
    if (!proposal) return false;

    proposal.status = decision;
    proposal.decidedAt = new Date().toISOString();
    this.saveProposal(proposal);

    if (decision === 'accepted' && proposal.proposedNewTargetDate) {
      const activeGoal = this.getActiveGoal();
      if (activeGoal) {
        activeGoal.targetCompletionDate = proposal.proposedNewTargetDate;
        activeGoal.updatedAt = new Date().toISOString();
        this.saveGoal(activeGoal);
      }
    }

    return true;
  }

  // --- Export & Reset ---

  public static exportFullDataAsJson(): string {
    const data = {
      user: this.getUser(),
      settings: this.getSettings(),
      goals: this.getGoals(),
      ranges: this.getRanges(),
      progress: this.getProgressMap(),
      plans: this.getPlans(),
      tasks: this.getTasks(),
      sessions: this.getSessions(),
      reviews: this.getReviews(),
      proposals: this.getProposals(),
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(data, null, 2);
  }

  public static resetToDefault(): void {
    localStorage.clear();
    this.seedInitialData();
  }
}
