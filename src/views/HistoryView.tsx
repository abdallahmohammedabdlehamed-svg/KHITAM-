import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { QuranService } from '../services/quranService';
import { SessionType } from '../types';
import { History, Calendar, Clock, Award, Filter, BookOpen } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const sessions = StorageService.getSessions();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredSessions = sessions.filter((s) => {
    if (filterType !== 'all' && s.sessionType !== filterType) return false;
    return true;
  });

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins} دقيقة ${secs > 0 ? `و ${secs} ثانية` : ''}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">سجل الجلسات والمراجعات التاريخي</h1>
            <p className="text-xs text-slate-500">
              أرشيف يوثق كافة جلساتك الفعلية والآيات المنجزة مع الحفاظ على الأثر التاريخي.
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'all' ? 'bg-[#083827] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilterType('new_memorization')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'new_memorization' ? 'bg-[#083827] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            حفظ جديد
          </button>
          <button
            onClick={() => setFilterType('consolidation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'consolidation' ? 'bg-[#083827] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تثبيت
          </button>
          <button
            onClick={() => setFilterType('review')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'review' ? 'bg-[#083827] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مراجعة
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            لم تسجل أية جلسات تطابق التصفية حتى الآن.
          </div>
        ) : (
          filteredSessions.map((s) => {
            const completedAyahs = s.ayahs.filter((a) => a.completed);
            const firstAyah = completedAyahs[0];
            const lastAyah = completedAyahs[completedAyahs.length - 1];
            const surahName = firstAyah ? QuranService.getSurah(firstAyah.surahNumber)?.name : '';

            return (
              <div
                key={s.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        s.sessionType === 'new_memorization'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.sessionType === 'consolidation'
                          ? 'bg-blue-100 text-blue-800'
                          : s.sessionType === 'review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {s.sessionType === 'new_memorization'
                        ? 'حفظ جديد'
                        : s.sessionType === 'consolidation'
                        ? 'تثبيت'
                        : s.sessionType === 'review'
                        ? 'مراجعة دورية'
                        : 'جلسة حرة'}
                    </span>

                    <span className="font-bold text-sm text-slate-900">
                      {surahName ? `سورة ${surahName} (الآيات ${firstAyah.ayahNumber} - ${lastAyah?.ayahNumber})` : 'جلسة دراسة'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {s.startedAt.split('T')[0]}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatSeconds(s.actualDurationSeconds)}
                    </span>
                  </div>
                </div>

                {/* Details row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 text-slate-600">
                    <span className="tabular-nums font-semibold">
                      الآيات المنجزة: {completedAyahs.length} آية
                    </span>
                    {s.selfRating && (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm font-bold tabular-nums">
                        التقييم الذاتي: {s.selfRating} / 5
                      </span>
                    )}
                  </div>

                  {s.notes && (
                    <p className="text-[11px] text-slate-500 italic max-w-md truncate">
                      "{s.notes}"
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
