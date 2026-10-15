import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { QuranService } from '../services/quranService';
import { ReviewRecord } from '../types';
import { RotateCcw, Clock, CheckCircle2, AlertTriangle, Play, Sparkles } from 'lucide-react';

interface ReviewsHubViewProps {
  onStartReviewSession: (surah: number, startAyah: number, endAyah: number) => void;
}

export const ReviewsHubView: React.FC<ReviewsHubViewProps> = ({ onStartReviewSession }) => {
  const reviews = StorageService.getReviews();
  const todayStr = new Date().toISOString().split('T')[0];

  const dueToday = reviews.filter((r) => r.nextReviewRecommendation <= todayStr);
  const upcoming = reviews.filter((r) => r.nextReviewRecommendation > todayStr);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">نظام المراجعة التكيفية الذكية</h1>
            <p className="text-xs text-slate-500">
              خوارزمية مبنية على منحنى النسيان وأدائك الفعلي؛ تباعد فترات المحفوظ المتقن وتقرّب مواضع التعثر.
            </p>
          </div>
        </div>
      </div>

      {/* Due Today Reviews */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>المراجعات المستحقة اليوم ({dueToday.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">بتاريخ {todayStr}</span>
        </div>

        {dueToday.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-800">الحمد لله! لا توجد مراجعات متأخرة اليوم.</p>
            <p className="text-[11px] text-slate-400">يمكنك مراجعة أي جزء اختياري أو الاستمرار في الحفظ الجديد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dueToday.map((r) => {
              const surahMeta = QuranService.getSurah(r.surahNumber);
              return (
                <div
                  key={r.id}
                  className="p-5 bg-white rounded-2xl border border-amber-200 shadow-xs space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-sm">
                        مستحقة الآن
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        سورة {surahMeta?.name} (الآيات {r.startAyah} إلى {r.endAyah})
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        آخر تقييم: {r.selfRating} / 5 · أخطاء سابقة: {r.errorsObserved}
                      </div>
                    </div>

                    <button
                      onClick={() => onStartReviewSession(r.surahNumber, r.startAyah, r.endAyah)}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>تسميع الآن</span>
                    </button>
                  </div>

                  {/* Explainable AI / Algorithm Reasoning */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800 block mb-0.5">لماذا تم تحديد هذا الموعد؟</span>
                    {r.reasoning}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Reviews Schedule */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>المراجعات المجدولة خلال الأيام القادمة ({upcoming.length})</span>
        </h2>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {upcoming.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              لا توجد مراجعات قادمة مجدولة حالياً.
            </div>
          ) : (
            upcoming.map((r) => {
              const surahMeta = QuranService.getSurah(r.surahNumber);
              return (
                <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-sm">
                      سورة {surahMeta?.name} (الآيات {r.startAyah} إلى {r.endAyah})
                    </span>
                    <p className="text-[11px] text-slate-500">{r.reasoning}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md tabular-nums">
                      الموعد: {r.nextReviewRecommendation}
                    </span>
                    <button
                      onClick={() => onStartReviewSession(r.surahNumber, r.startAyah, r.endAyah)}
                      className="px-3 py-1 text-xs font-semibold text-[#083827] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      تقديم المراجعة
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
