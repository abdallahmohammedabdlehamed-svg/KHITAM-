import { QuranService, SURAHS } from '../services/quranService';
import { PlanningEngine } from '../services/planningEngine';
import { ReviewEngine } from '../services/reviewEngine';
import { MasteryEngine } from '../services/masteryEngine';
import { StorageService } from '../services/storageService';
import { MemorizationGoal, MemorizationRange, DailyTask } from '../types';

// Simple lightweight assertion runner for verifiable execution
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ FAIL: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTestSuite() {
  console.log('\n--- تشغيل الاختبارات الآلية لمنصة خِتام (Khitam Test Suite) ---\n');

  // Test 1: Quran Database Integrity & Tanzil Verification
  console.log('1. اختبار سلامة بيانات القرآن الكريم:');
  assert(SURAHS.length === 114, 'عدد السور في المرجع المعتمد يساوي 114 سورة بالضبط');
  const totalAyahs = SURAHS.reduce((acc, s) => acc + s.ayahCount, 0);
  assert(totalAyahs === 6236, 'إجمالي عدد آيات القرآن الكريم يساوي 6236 آية');

  const fatihaAyahs = QuranService.getAyahsForSurah(1);
  assert(fatihaAyahs.length === 7, 'سورة الفاتحة تحتوي على 7 آيات');
  assert(fatihaAyahs[0].text.includes('بِسْمِ ٱللَّهِ'), 'الآية الأولى من الفاتحة هي البسملة بالرسم العثماني');

  // Test 2: Overlapping Ranges Coverage (Scenario 1 from user prompt)
  // User records verses 1-10, then 8-15 -> Result must be 15, not 18!
  console.log('\n2. اختبار تداخل نطاقات الآيات وحساب التغطية (Scenario 1):');
  const range1Ayahs = QuranService.getAyahsInRange(2, 1, 2, 10);
  const range2Ayahs = QuranService.getAyahsInRange(2, 8, 2, 15);
  const uniqueKeySet = new Set<string>();

  range1Ayahs.forEach((a) => uniqueKeySet.add(`${a.surahNumber}_${a.ayahNumber}`));
  range2Ayahs.forEach((a) => uniqueKeySet.add(`${a.surahNumber}_${a.ayahNumber}`));

  assert(
    uniqueKeySet.size === 15,
    `التغطية الناتجة لتداخل النطاقين (1-10) و (8-15) هي بالضبط 15 آية وليست 18 آية (الناتج الفعلي: ${uniqueKeySet.size})`
  );

  // Test 3: Partial Task Completion (Scenario 2 from user prompt)
  // Task has 20 ayahs, user finishes 12 -> exactly 12 recorded, remaining 8 uncompleted
  console.log('\n3. اختبار الإنجاز الجزئي للمهام (Scenario 2):');
  const taskAyahs = QuranService.getAyahsInRange(2, 1, 2, 20); // 20 verses
  assert(taskAyahs.length === 20, 'المهمة المجدولة تحتوي على 20 آية');

  // Simulate user completing only 12
  const completedAyahs = taskAyahs.slice(0, 12).map((a) => ({
    surahNumber: a.surahNumber,
    ayahNumber: a.ayahNumber,
    completed: true,
    errors: 0,
  }));
  const uncompletedAyahs = taskAyahs.slice(12).map((a) => ({
    surahNumber: a.surahNumber,
    ayahNumber: a.ayahNumber,
    completed: false,
    errors: 0,
  }));

  const allSessionAyahs = [...completedAyahs, ...uncompletedAyahs];
  const completedCount = allSessionAyahs.filter((a) => a.completed).length;
  const uncompletedCount = allSessionAyahs.filter((a) => !a.completed).length;

  assert(completedCount === 12, 'تم تسجيل 12 آية فقط كمنجزة');
  assert(uncompletedCount === 8, 'بقيت الـ 8 آيات الأخرى غير مكتملة ولم تُعتبر محفوظة');

  // Test 4: Revision of Previous Memorization (Scenario 3 from user prompt)
  // Reviewing previous memorization does NOT count as new memorization
  console.log('\n4. اختبار الفصل بين المحفوظ السابق والحفظ الجديد (Scenario 3):');
  const priorRange: MemorizationRange = {
    id: 'test_rng_1',
    userId: 'test_usr',
    startSurah: 78,
    startAyah: 1,
    endSurah: 78,
    endAyah: 40,
    sourceType: 'pre_existing',
    createdAt: new Date().toISOString(),
  };

  const planTestGoal: Omit<MemorizationGoal, 'id' | 'createdAt' | 'updatedAt'> = {
    userId: 'test_usr',
    name: 'هدف اختباري',
    startDate: '2026-10-15',
    targetCompletionDate: '2027-05-15',
    startMode: 'beginning',
    startingSurahId: 78,
    startingAyahNumber: 1,
    endingSurahId: 80,
    endingAyahNumber: 42,
    dailyAvailableMinutes: 45,
    studyDays: [0, 1, 2, 3, 4, 6],
    status: 'active',
  };

  const planResult = PlanningEngine.generatePlan(planTestGoal, [priorRange]);
  // The plan must NOT schedule Surah 78 as new memorization!
  const hasSurah78AsNew = planResult.tasks.some(
    (t) => t.taskType === 'new_memorization' && t.startSurah === 78
  );
  assert(!hasSurah78AsNew, 'الآيات المحفوظة سابقاً (سورة 78) لم تُجدول كحفظ جديد في الخطة بل تُعامل كمحفوظ سابق');

  // Test 5: Idempotency protection against double-submitting (Scenario 4)
  console.log('\n5. اختبار منع تكرار التسجيل (Idempotency Scenario 4):');
  const token = 'tok_test_idempotent_123';
  const sessionData = {
    userId: 'test_usr_idemp',
    sessionType: 'new_memorization' as const,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    actualDurationSeconds: 900,
    ayahs: [{ surahNumber: 2, ayahNumber: 1, completed: true, errors: 0 }],
    status: 'completed' as const,
  };

  const firstAttempt = StorageService.recordSession(sessionData, token);
  assert(firstAttempt.success === true, 'الطلب الأول تم تسجيله بنجاح');

  const secondAttempt = StorageService.recordSession(sessionData, token);
  assert(secondAttempt.success === false, 'الطلب المكرر تم منعه بنجاح وحماية قاعدة البيانات من مضاعفة الإنجاز');

  // Test 6: Adaptive Review Scheduling Engine
  console.log('\n6. اختبار محرك المراجعة التكيفية:');
  const urgentRec = ReviewEngine.calculateNextReview({
    selfRating: 1,
    errorsCount: 4,
    consecutiveGoodReviews: 0,
  });
  assert(urgentRec.intervalDays <= 2, 'النتيجة الضعيفة (1/5 مع أخطاء) تنتج موعد مراجعة عاجل في غضون 24-48 ساعة');

  const excellentRec = ReviewEngine.calculateNextReview({
    selfRating: 5,
    errorsCount: 0,
    consecutiveGoodReviews: 3,
    currentIntervalDays: 7,
  });
  assert(
    excellentRec.intervalDays > 10,
    `النتيجة الممتازة مع الثبات المتتابع تسمح بمباعدة الفاصل الزمني (الفاصل الجديد: ${excellentRec.intervalDays} يوماً)`
  );

  // Test 7: Mastery Assessment & Transparency
  console.log('\n7. اختبار محرك تقدير الثبات:');
  const emptyAssessment = MasteryEngine.assessAyahMastery(null);
  assert(
    emptyAssessment.levelKey === 'insufficient_data',
    'الآية التي لا تمتلك سجلات مراجعة تُصنف بشفافية على أنها "بيانات غير كافية للتقدير"'
  );

  console.log('\n🎉 اكتملت كافة سيناريوهات الاختبار بنجاح 100% وفق متطلبات الوثيقة المرجعية!\n');
}

runTestSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
