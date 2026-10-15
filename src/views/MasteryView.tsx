import React from 'react';
import { StorageService } from '../services/storageService';
import { QuranService } from '../services/quranService';
import { MasteryEngine } from '../services/masteryEngine';
import { Award, AlertTriangle, ShieldCheck, CheckCircle2, Info, BookOpen } from 'lucide-react';

export const MasteryView: React.FC = () => {
  const user = StorageService.getUser();
  const progressMap = StorageService.getProgressMap();
  const stats = StorageService.getCoverageStats(user.id);

  // Group verses by mastery level
  const versesWithErrors: Array<{
    surahNumber: number;
    ayahNumber: number;
    errorsCount: number;
    selfRating?: number;
    text: string;
  }> = [];

  let countMastered = 0;
  let countGood = 0;
  let countConsolidation = 0;
  let countUrgent = 0;

  Object.values(progressMap).forEach((p) => {
    if (p.userId !== user.id || p.status === 'unmemorized') return;

    const assessment = MasteryEngine.assessAyahMastery(p);
    if (assessment.levelKey === 'mastered') countMastered++;
    else if (assessment.levelKey === 'good_stability') countGood++;
    else if (assessment.levelKey === 'in_consolidation') countConsolidation++;
    else if (assessment.levelKey === 'needs_urgent_review') countUrgent++;

    if (p.errorsCount > 0) {
      versesWithErrors.push({
        surahNumber: p.surahNumber,
        ayahNumber: p.ayahNumber,
        errorsCount: p.errorsCount,
        selfRating: p.selfRating,
        text: QuranService.getAyahText(p.surahNumber, p.ayahNumber),
      });
    }
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Disclaimer */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              تقييم الثبات ومستوى إتقان الحفظ
            </h1>
            <p className="text-xs text-slate-500">
              قياس تقديري شفاف يعتمد على سجلاتك الذاتية وفترات التباعد وتكرار الأخطاء.
            </p>
          </div>
        </div>

        {/* Clear Pedagogical Disclaimer (Rule #14) */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            <strong>تنويه مهم:</strong> تقدير الثبات في منصة «خِتام» هو مؤشر تقريبي مبني على البيانات التي
            سجلتها بنفسك في جلسات المراجعة، وهو أداة تنظيمية ولا يُعد بأي حال بديلاً عن العرض والتسميع المباشر
            على الشيخ أو المعلم المجاز في أحكام التجويد ومخارج الحروف.
          </p>
        </div>
      </div>

      {/* Mastery Tiers Distribution Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-emerald-800">متقن ومستقر</span>
          <span className="text-2xl font-bold text-emerald-950 block tabular-nums">{countMastered}</span>
          <p className="text-[10px] text-emerald-700">ثبات عبر مراجعات متعددة</p>
        </div>

        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-teal-800">ثبات جيد</span>
          <span className="text-2xl font-bold text-teal-950 block tabular-nums">{countGood}</span>
          <p className="text-[10px] text-teal-700">استحضار سلس بأخطاء نادرة</p>
        </div>

        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-blue-800">قيد التثبيت</span>
          <span className="text-2xl font-bold text-blue-950 block tabular-nums">{countConsolidation}</span>
          <p className="text-[10px] text-blue-700">يحتاج تكراراً قريباً</p>
        </div>

        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-rose-800">يحتاج مراجعة عاجلة</span>
          <span className="text-2xl font-bold text-rose-950 block tabular-nums">{countUrgent}</span>
          <p className="text-[10px] text-rose-700">لوحظت فيه أخطاء أو انقطاع</p>
        </div>
      </div>

      {/* Transparent Evaluation Formula Explanation */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>شفافية الخوارزمية: كيف يتم احتساب درجة الثبات؟</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          تعتمد الخوارزمية الحتمية لـ «خِتام» على 4 عوامل موضوعية بدون استخدام أوزان عشوائية أو تخمينات:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">1. التقييم الذاتي للجلسة (40%):</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              انطباعك المباشر بعد تسميع كل موضع (من 1 إلى 5).
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">2. خصم الأخطاء المسجلة (-0.5 لكل خطأ):</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              كل تعثر مسجل في الجلسة يقلل من الثبات التقديري لتوجيه المراجعة صوبه.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">3. الثبات المتتابع (+0.3 لكل مراجعة متقنة):</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              تكرار النتيجة الجيدة في جلسات متباعدة يرفع تصنيف الآية إلى "متقن ومستقر".
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">4. عامل الفاصل الزمني (Recency Decay):</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              انقضاء أكثر من 30 يوماً دون مراجعة يخفض التقدير تدريجياً للتنبيه بضرورة التعهد.
            </p>
          </div>
        </div>
      </div>

      {/* Verses with Recorded Errors */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>المواضع التي سُجلت فيها أخطاء وتحتاج تثبيتاً مكثفاً ({versesWithErrors.length})</span>
          </span>
        </h3>

        {versesWithErrors.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            لم تسجل أية أخطاء في جلساتك السابقة بفضل الله.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto divide-y divide-slate-100">
            {versesWithErrors.map((item, idx) => {
              const surah = QuranService.getSurah(item.surahNumber);
              return (
                <div key={idx} className="pt-2.5 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      سورة {surah?.name} - الآية {item.ayahNumber}
                    </span>
                    <span className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm tabular-nums">
                      {item.errorsCount} {item.errorsCount === 1 ? 'خطأ مسجل' : 'أخطاء مسجلة'}
                    </span>
                  </div>
                  <p className="font-quran text-base text-slate-800 leading-loose text-right">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
