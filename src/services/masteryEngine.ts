import { AyahProgress } from '../types';

export interface MasteryAssessmentResult {
  score: number; // 1.0 to 5.0
  levelKey: 'insufficient_data' | 'needs_urgent_review' | 'in_consolidation' | 'good_stability' | 'mastered';
  labelArabic: string;
  badgeColorClass: string;
  textColorClass: string;
  description: string;
  disclaimer: string;
}

export class MasteryEngine {
  public static ALGORITHM_VERSION = 'Khitam-Mastery-1.0';

  public static assessAyahMastery(progress: AyahProgress | null): MasteryAssessmentResult {
    const disclaimer =
      'هذا التقييم تقديري ومبني على جلساتك الذاتية وسجلات المراجعة المدخلة، ولا يغني عن التسميع الحي على الشيخ أو المعلم المتقن.';

    if (!progress || progress.reviewsCount === 0 || progress.status === 'unmemorized') {
      return {
        score: 1.0,
        levelKey: 'insufficient_data',
        labelArabic: 'بيانات غير كافية للتقدير',
        badgeColorClass: 'bg-slate-100 text-slate-600 border-slate-200',
        textColorClass: 'text-slate-500',
        description: 'لم يتم تسجيل جلسات كافية بعد لحساب استقرار هذا الموضع.',
        disclaimer,
      };
    }

    // Mathematical formula for retention estimation:
    // Factor 1: Self-Rating (1-5) weighted 40%
    const ratingWeight = (progress.selfRating || 3) * 0.4;

    // Factor 2: Error Penalty: deduct 0.5 per error up to -1.5
    const errorPenalty = Math.min(1.5, progress.errorsCount * 0.5);

    // Factor 3: Review Consistency: bonus for consecutive good reviews (+0.3 each, up to +1.2)
    const consistencyBonus = Math.min(1.2, progress.consecutiveGoodReviews * 0.3);

    // Factor 4: Recency Decay: if not reviewed for > 30 days, decay score
    let recencyPenalty = 0;
    if (progress.lastReviewedAt) {
      const daysSinceReview = Math.floor(
        (Date.now() - new Date(progress.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceReview > 45) {
        recencyPenalty = 0.8;
      } else if (daysSinceReview > 20) {
        recencyPenalty = 0.4;
      }
    }

    const rawScore = 2.0 + ratingWeight + consistencyBonus - errorPenalty - recencyPenalty;
    const finalScore = Number(Math.max(1.0, Math.min(5.0, rawScore)).toFixed(1));

    if (finalScore >= 4.5 && progress.consecutiveGoodReviews >= 2) {
      return {
        score: finalScore,
        levelKey: 'mastered',
        labelArabic: 'متقن ومستقر وفق تقييمك',
        badgeColorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        textColorClass: 'text-emerald-600',
        description: 'المحفوظ في أعلى درجات الاستحضار مع ثبات النتائج الجيدة عبر مراجعات متعددة.',
        disclaimer,
      };
    }

    if (finalScore >= 3.5) {
      return {
        score: finalScore,
        levelKey: 'good_stability',
        labelArabic: 'ثبات جيد وفق السجلات',
        badgeColorClass: 'bg-teal-50 text-teal-700 border-teal-200',
        textColorClass: 'text-teal-600',
        description: 'استحضار سليم وأخطاء نادرة ضمن الفترات الزمنية المعتدلة.',
        disclaimer,
      };
    }

    if (finalScore >= 2.5) {
      return {
        score: finalScore,
        levelKey: 'in_consolidation',
        labelArabic: 'قيد التثبيت',
        badgeColorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        textColorClass: 'text-amber-600',
        description: 'ما زالت الآيات في مرحلة التثبيت الأولى وتحتاج لتكرار منتظم خلال الأيام القادمة.',
        disclaimer,
      };
    }

    return {
      score: finalScore,
      levelKey: 'needs_urgent_review',
      labelArabic: 'يحتاج إلى مراجعة وتثبيت عاجل',
      badgeColorClass: 'bg-rose-50 text-rose-700 border-rose-200',
      textColorClass: 'text-rose-600',
      description: 'سُجلت أخطاء أو انقضت مدة طويلة دون مراجعة؛ يوصى بجدولة جلسة قريبة.',
      disclaimer,
    };
  }
}
