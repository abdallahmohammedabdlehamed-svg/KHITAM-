export interface NextReviewRecommendation {
  intervalDays: number;
  recommendedDate: string; // YYYY-MM-DD
  reasoning: string;
  category: 'urgent' | 'regular' | 'expanded';
}

export class ReviewEngine {
  public static ALGORITHM_VERSION = 'Khitam-SpacedRep-1.0';

  /**
   * Calculates the next review date and rationale based on performance metrics
   */
  public static calculateNextReview(params: {
    selfRating: 1 | 2 | 3 | 4 | 5;
    errorsCount: number;
    consecutiveGoodReviews: number;
    currentIntervalDays?: number;
  }): NextReviewRecommendation {
    const { selfRating, errorsCount, consecutiveGoodReviews, currentIntervalDays = 3 } = params;

    let intervalDays = currentIntervalDays;
    let reasoning = '';
    let category: NextReviewRecommendation['category'] = 'regular';

    if (selfRating === 1 || errorsCount >= 3) {
      // High difficulty or multiple errors -> Immediate review within 24-48 hours
      intervalDays = 1;
      category = 'urgent';
      reasoning = `لوحظت صعوبة في الاستحضار أو أخطاء متعددة (${errorsCount} أخطاء). يُوصى بمراجعة سريعة غداً لتثبيت الروابط في الذاكرة قصيرة المدى ومنع تفلت الآيات.`;
    } else if (selfRating === 2 || errorsCount >= 1) {
      // Frequent need for assistance -> Review in 2 days
      intervalDays = 2;
      category = 'urgent';
      reasoning = `تم تسجيل ${errorsCount} خطأ أو طلب مساعدة متكررة. يُنصح بإعادة القراءة والتسميع بعد يومين قبل أن تتسع الفجوة الزمنية.`;
    } else if (selfRating === 3) {
      // Moderate performance -> Keep interval tight (3-4 days)
      intervalDays = 3;
      category = 'regular';
      reasoning = `أداء متوسط ومحفوظ مستقر نسبياً مع الحاجة إلى مزيد من الطلاقة. تم جدولة المراجعة القادمة بعد 3 أيام لتعزيز الثبات.`;
    } else if (selfRating === 4) {
      // Good performance -> Multiply interval by 1.6
      intervalDays = Math.min(30, Math.max(5, Math.round(currentIntervalDays * 1.6)));
      category = 'regular';
      reasoning = `أداء جيد جداً مع أخطاء محدودة. تم رفع الفاصل الزمني إلى ${intervalDays} يوماً لترسيخ المحفوظ في الذاكرة طويلة المدى.`;
    } else if (selfRating === 5) {
      // Excellent / Mastered -> Multiply interval by 2.2
      intervalDays = Math.min(45, Math.max(7, Math.round(currentIntervalDays * 2.2)));
      category = 'expanded';
      reasoning = `تقييم ممتاز (${consecutiveGoodReviews + 1} مرات متتالية من الثبات وبدون أخطاء). يمكن مباعدة موعد المراجعة بأمان إلى ${intervalDays} يوماً.`;
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);

    return {
      intervalDays,
      recommendedDate: nextDate.toISOString().split('T')[0],
      reasoning,
      category,
    };
  }
}
