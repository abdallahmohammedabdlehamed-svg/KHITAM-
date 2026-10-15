import { MemorizationGoal, MemorizationRange, StudyPlan, DailyTask } from '../types';
import { QuranService } from './quranService';

export interface PlanGenerationResult {
  plan: StudyPlan;
  tasks: DailyTask[];
  feasibility: {
    isFeasible: boolean;
    score: number; // 0 to 100
    dailyRequiredMinutes: number;
    dailyAvailableMinutes: number;
    recommendedPaceAyahs: number;
    requiredPaceAyahs: number;
    totalAvailableDays: number;
    totalStudyDays: number;
    totalNewAyahs: number;
    warningMessage?: string;
    alternativeSuggestions?: Array<{
      type: 'extend_deadline' | 'increase_time' | 'increase_days';
      title: string;
      description: string;
      suggestedValue: string | number;
    }>;
  };
}

export class PlanningEngine {
  public static ALGORITHM_VERSION = '1.0.0-deterministic';

  /**
   * Generates a deterministic plan based on user goals, study days, and prior memorization
   */
  public static generatePlan(
    goal: Omit<MemorizationGoal, 'id' | 'createdAt' | 'updatedAt'>,
    priorRanges: MemorizationRange[]
  ): PlanGenerationResult {
    const startDate = new Date(goal.startDate);
    const targetDate = new Date(goal.targetCompletionDate);

    // 1. Calculate calendar days and available study days
    const totalCalendarDays = Math.max(
      1,
      Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    let studyDaysCount = 0;
    const studyDayDates: Date[] = [];

    for (let i = 0; i < totalCalendarDays; i++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + i);
      const dayOfWeek = cur.getDay(); // 0 = Sun, 6 = Sat
      if (goal.studyDays.includes(dayOfWeek)) {
        studyDaysCount++;
        studyDayDates.push(cur);
      }
    }

    if (studyDaysCount === 0) {
      studyDaysCount = totalCalendarDays;
    }

    // 2. Identify all unmemorized verses between start coordinate and end coordinate
    // First, map all prior memorized verses into a fast Set
    const priorMemorizedSet = new Set<string>();
    priorRanges.forEach((r) => {
      const ayahs = QuranService.getAyahsInRange(r.startSurah, r.startAyah, r.endSurah, r.endAyah);
      ayahs.forEach((a) => {
        priorMemorizedSet.add(`${a.surahNumber}_${a.ayahNumber}`);
      });
    });

    // Get all candidate verses in the goal scope
    const allGoalAyahs = QuranService.getAyahsInRange(
      goal.startingSurahId,
      goal.startingAyahNumber,
      goal.endingSurahId,
      goal.endingAyahNumber
    );

    // Filter to verses that ACTUALLY need new memorization
    const newAyahsToMemorize = allGoalAyahs.filter(
      (a) => !priorMemorizedSet.has(`${a.surahNumber}_${a.ayahNumber}`)
    );

    const totalNewAyahs = newAyahsToMemorize.length;

    // 3. Calculate pace and time feasibility
    // Reserve ~20% of study days for major revision and buffer milestones
    const effectiveNewHifdhDays = Math.max(1, Math.floor(studyDaysCount * 0.8));
    const requiredPaceAyahs = Math.ceil(totalNewAyahs / effectiveNewHifdhDays);

    // Mathematical modeling for daily time requirements:
    // - New memorization: ~2.5 minutes per ayah (including recitation, repetition, linking)
    // - Consolidation: ~1 minute per ayah (yesterday's portion)
    // - Revision: ~0.4 minutes per ayah
    const timeForNew = requiredPaceAyahs * 2.5;
    const timeForConsolidation = Math.min(20, requiredPaceAyahs * 1.0);
    const timeForRevision = Math.min(25, 15);
    const dailyRequiredMinutes = Math.round(timeForNew + timeForConsolidation + timeForRevision);

    const dailyAvailable = goal.dailyAvailableMinutes || 45;
    const ratio = dailyAvailable / Math.max(1, dailyRequiredMinutes);

    let feasibilityScore = Math.min(100, Math.round(ratio * 90));
    const isFeasible = dailyRequiredMinutes <= dailyAvailable * 1.25;

    let warningMessage: string | undefined;
    const alternativeSuggestions: PlanGenerationResult['feasibility']['alternativeSuggestions'] = [];

    if (!isFeasible) {
      feasibilityScore = Math.max(25, Math.round(ratio * 65));
      warningMessage = `الجدول الزمني الحالي مضغوط؛ يحتاج إتمام هذا المقدار إلى متوسط ${dailyRequiredMinutes} دقيقة يومياً بينما الوقت المحدد هو ${dailyAvailable} دقيقة.`;

      // Suggest alternatives
      // 1. Extend deadline
      const neededStudyDays = Math.ceil((totalNewAyahs * 2.5 + 25) / dailyAvailable / 0.8);
      const calendarMultiplier = totalCalendarDays / Math.max(1, studyDaysCount);
      const suggestedExtraDays = Math.ceil(neededStudyDays * calendarMultiplier);
      const extendedDate = new Date(startDate);
      extendedDate.setDate(startDate.getDate() + suggestedExtraDays);

      alternativeSuggestions.push({
        type: 'extend_deadline',
        title: 'تمديد موعد الختام المقترح',
        description: `تمديد التاريخ المستهدف إلى ${extendedDate.toISOString().split('T')[0]} ليصبح الحمل اليومي متوافقاً مع وقتك.`,
        suggestedValue: extendedDate.toISOString().split('T')[0],
      });

      // 2. Increase daily time
      alternativeSuggestions.push({
        type: 'increase_time',
        title: 'زيادة الوقت اليومي المتاح',
        description: `رفع الوقت اليومي إلى ${dailyRequiredMinutes} دقيقة للالتزام بالموعد النهائي الحالي.`,
        suggestedValue: dailyRequiredMinutes,
      });

      // 3. Add more study days if less than 7
      if (goal.studyDays.length < 7) {
        alternativeSuggestions.push({
          type: 'increase_days',
          title: 'زيادة أيام الدراسة أسبوعياً',
          description: `إضافة يوم دراسي إضافي لتوزيع مقدار الحفظ دون زيادة الوقت اليومي.`,
          suggestedValue: goal.studyDays.length + 1,
        });
      }
    }

    // 4. Generate the StudyPlan object
    const planId = `plan_${Date.now()}`;
    const studyPlan: StudyPlan = {
      id: planId,
      goalId: 'pending',
      userId: 'pending',
      versionNumber: 1,
      status: 'draft',
      generatedAt: new Date().toISOString(),
      totalDays: totalCalendarDays,
      studyDaysCount,
      paceAyahsPerDay: requiredPaceAyahs,
      totalNewAyahs,
      feasibilityScore,
      feasibilityWarning: warningMessage,
    };

    // 5. Generate daily tasks distributed across available study days
    const tasks: DailyTask[] = [];
    let currentAyahIndex = 0;
    let yesterdayPortion: { startSurah: number; startAyah: number; endSurah: number; endAyah: number; count: number } | null = null;

    for (let dayIdx = 0; dayIdx < studyDayDates.length; dayIdx++) {
      const dateStr = studyDayDates[dayIdx].toISOString().split('T')[0];

      // If we still have new ayahs to assign
      if (currentAyahIndex < newAyahsToMemorize.length) {
        const batchSize = Math.min(requiredPaceAyahs, newAyahsToMemorize.length - currentAyahIndex);
        const batchStart = newAyahsToMemorize[currentAyahIndex];
        const batchEnd = newAyahsToMemorize[currentAyahIndex + batchSize - 1];

        // 1. Task: New Memorization
        tasks.push({
          id: `tsk_${dayIdx}_new`,
          planId,
          goalId: 'pending',
          userId: 'pending',
          taskType: 'new_memorization',
          scheduledDate: dateStr,
          startSurah: batchStart.surahNumber,
          startAyah: batchStart.ayahNumber,
          endSurah: batchEnd.surahNumber,
          endAyah: batchEnd.ayahNumber,
          ayahCount: batchSize,
          estimatedMinutes: Math.round(batchSize * 2.5),
          status: 'scheduled',
          completionPercentage: 0,
          completedAyahsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 2. Task: Immediate Consolidation of yesterday's new portion
        if (yesterdayPortion) {
          tasks.push({
            id: `tsk_${dayIdx}_consolidation`,
            planId,
            goalId: 'pending',
            userId: 'pending',
            taskType: 'consolidation',
            scheduledDate: dateStr,
            startSurah: yesterdayPortion.startSurah,
            startAyah: yesterdayPortion.startAyah,
            endSurah: yesterdayPortion.endSurah,
            endAyah: yesterdayPortion.endAyah,
            ayahCount: yesterdayPortion.count,
            estimatedMinutes: Math.round(yesterdayPortion.count * 1.0),
            status: 'scheduled',
            completionPercentage: 0,
            completedAyahsCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // 3. Task: Periodic Revision (every 3rd study day or on specific cycles)
        if (dayIdx % 3 === 2 && currentAyahIndex > 20) {
          // Review earlier memorized portions
          const revIndex = Math.max(0, currentAyahIndex - 40);
          const revStart = newAyahsToMemorize[revIndex];
          const revEnd = newAyahsToMemorize[Math.min(newAyahsToMemorize.length - 1, revIndex + 30)];
          const revCount = 30;

          tasks.push({
            id: `tsk_${dayIdx}_review`,
            planId,
            goalId: 'pending',
            userId: 'pending',
            taskType: 'review',
            scheduledDate: dateStr,
            startSurah: revStart.surahNumber,
            startAyah: revStart.ayahNumber,
            endSurah: revEnd.surahNumber,
            endAyah: revEnd.ayahNumber,
            ayahCount: revCount,
            estimatedMinutes: 15,
            status: 'scheduled',
            completionPercentage: 0,
            completedAyahsCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        yesterdayPortion = {
          startSurah: batchStart.surahNumber,
          startAyah: batchStart.ayahNumber,
          endSurah: batchEnd.surahNumber,
          endAyah: batchEnd.ayahNumber,
          count: batchSize,
        };

        currentAyahIndex += batchSize;
      } else {
        // Revision days towards the end of the goal
        tasks.push({
          id: `tsk_${dayIdx}_final_rev`,
          planId,
          goalId: 'pending',
          userId: 'pending',
          taskType: 'review',
          scheduledDate: dateStr,
          startSurah: goal.startingSurahId,
          startAyah: goal.startingAyahNumber,
          endSurah: goal.endingSurahId,
          endAyah: goal.endingAyahNumber,
          ayahCount: 50,
          estimatedMinutes: 30,
          status: 'scheduled',
          completionPercentage: 0,
          completedAyahsCount: 0,
          notes: 'مراجعة تثبيت عامة لأجزاء المحفوظ',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return {
      plan: studyPlan,
      tasks,
      feasibility: {
        isFeasible,
        score: feasibilityScore,
        dailyRequiredMinutes,
        dailyAvailableMinutes: dailyAvailable,
        recommendedPaceAyahs: Math.max(5, Math.floor((dailyAvailable - 20) / 2.5)),
        requiredPaceAyahs,
        totalAvailableDays: totalCalendarDays,
        totalStudyDays: studyDaysCount,
        totalNewAyahs,
        warningMessage,
        alternativeSuggestions,
      },
    };
  }
}
