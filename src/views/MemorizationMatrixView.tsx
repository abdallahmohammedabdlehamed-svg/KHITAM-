import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { QuranService, SURAHS } from '../services/quranService';
import { Surah, AyahProgress, AyahStatus } from '../types';
import { BookOpen, Search, Filter, X, Award, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MemorizationMatrixView: React.FC = () => {
  const user = StorageService.getUser();
  const progressMap = StorageService.getProgressMap();
  const [selectedSurahNum, setSelectedSurahNum] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Helper to determine Surah overall memorization state
  const getSurahStats = (surah: Surah) => {
    let memorized = 0;
    let prior = 0;
    let newHifdh = 0;
    let consolidating = 0;
    let needsReview = 0;
    let mastered = 0;

    for (let a = 1; a <= surah.ayahCount; a++) {
      const p = progressMap[`${surah.number}_${a}`];
      if (p && p.status !== 'unmemorized') {
        memorized++;
        if (p.status === 'memorized_prior') prior++;
        else if (p.status === 'memorized_new') newHifdh++;
        else if (p.status === 'consolidating') consolidating++;
        else if (p.status === 'needs_review') needsReview++;
        else if (p.status === 'mastered') mastered++;
      }
    }

    const pct = Math.round((memorized / surah.ayahCount) * 100);
    return { memorized, prior, newHifdh, consolidating, needsReview, mastered, pct };
  };

  const filteredSurahs = SURAHS.filter((s) => {
    if (searchTerm) {
      const matchName = s.name.includes(searchTerm) || s.englishName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchName) return false;
    }

    if (filterCategory !== 'all') {
      const stats = getSurahStats(s);
      if (filterCategory === 'completed' && stats.pct < 100) return false;
      if (filterCategory === 'in_progress' && (stats.pct === 0 || stats.pct === 100)) return false;
      if (filterCategory === 'unmemorized' && stats.pct > 0) return false;
      if (filterCategory === 'needs_review' && stats.needsReview === 0) return false;
    }

    return true;
  });

  const selectedSurah = selectedSurahNum ? QuranService.getSurah(selectedSurahNum) : null;
  const selectedAyahs = selectedSurahNum ? QuranService.getAyahsForSurah(selectedSurahNum) : [];

  const handleUpdateAyahStatus = (surahNumber: number, ayahNumber: number, newStatus: AyahStatus) => {
    const key = `${surahNumber}_${ayahNumber}`;
    const copy = { ...progressMap };
    const now = new Date().toISOString();

    if (!copy[key]) {
      copy[key] = {
        key,
        userId: user.id,
        surahNumber,
        ayahNumber,
        status: newStatus,
        firstMemorizedAt: now,
        lastStudiedAt: now,
        reviewsCount: 1,
        errorsCount: 0,
        selfRating: 4,
        estimatedMastery: 4.0,
        consecutiveGoodReviews: 1,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      copy[key].status = newStatus;
      copy[key].updatedAt = now;
    }

    StorageService.saveProgressMap(copy);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Legend */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              <span>شبكة المحفوظ وتغطية المصحف الشريف</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              خريطة بصرية شاملة لـ 114 سورة تعرض حالة كل سورة وآية ومستوى ثباتها بدقة.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث باسم السورة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
            >
              <option value="all">جميع السور</option>
              <option value="completed">مكتملة الحفظ</option>
              <option value="in_progress">قيد الحفظ والتثبيت</option>
              <option value="needs_review">تحتوي آيات بحاجة لمراجعة</option>
              <option value="unmemorized">غير محفوظة</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold">دلالة الحالات:</span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-xs bg-[#083827]" />
            متقن ومستقر (Mastered)
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-xs bg-emerald-500" />
            حفظ جديد بالهدف
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-xs bg-slate-400" />
            محفوظ سابقاً
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-xs bg-blue-500" />
            قيد التثبيت
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-xs bg-amber-500" />
            يحتاج مراجعة
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-300" />
            غير محفوظ
          </span>
        </div>
      </div>

      {/* Surahs Grid (114 Surahs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredSurahs.map((surah) => {
          const stats = getSurahStats(surah);
          let badgeColor = 'bg-white border-slate-200 hover:border-slate-300';
          let textColor = 'text-slate-800';

          if (stats.pct === 100) {
            badgeColor = 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500';
            textColor = 'text-emerald-950 font-bold';
          } else if (stats.pct > 0) {
            badgeColor = 'bg-blue-50/50 border-blue-200 hover:border-blue-400';
            textColor = 'text-blue-950 font-bold';
          }

          return (
            <div
              key={surah.number}
              onClick={() => setSelectedSurahNum(surah.number)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs text-right relative overflow-hidden group ${badgeColor}`}
            >
              {/* Top Row: Surah Number & Ayah Count */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span className="font-mono tabular-nums">{surah.number}</span>
                <span className="tabular-nums">{surah.ayahCount} آية</span>
              </div>

              {/* Surah Name */}
              <h3 className={`text-sm ${textColor} mb-2 truncate`}>سورة {surah.name}</h3>

              {/* Progress bar inside card */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    stats.pct === 100 ? 'bg-emerald-600' : stats.pct > 0 ? 'bg-blue-600' : 'bg-transparent'
                  }`}
                  style={{ width: `${stats.pct}%` }}
                />
              </div>

              <div className="mt-1.5 flex justify-between items-center text-[10px] text-slate-500 tabular-nums">
                <span>{stats.pct}% منجز</span>
                <span>{stats.memorized}/{surah.ayahCount}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Surah Detail Modal / Drawer */}
      {selectedSurah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#083827] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 font-bold font-mono">
                  {selectedSurah.number}
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">سورة {selectedSurah.name}</h2>
                  <p className="text-xs text-emerald-200/80">
                    {selectedSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · {selectedSurah.ayahCount} آية · {selectedSurah.englishName} ({selectedSurah.englishTranslation})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSurahNum(null)}
                className="p-1.5 rounded-lg text-emerald-100/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ayahs List */}
            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
              {selectedAyahs.map((a) => {
                const prog = progressMap[`${a.surahNumber}_${a.ayahNumber}`];
                const status = prog ? prog.status : 'unmemorized';

                return (
                  <div key={a.ayahNumber} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-sm tabular-nums">
                        الآية {a.ayahNumber}
                      </span>

                      {/* Status Badges & Quick Corrections */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={status}
                          onChange={(e) =>
                            handleUpdateAyahStatus(a.surahNumber, a.ayahNumber, e.target.value as AyahStatus)
                          }
                          className="px-2 py-0.5 text-[11px] rounded-md border border-slate-200 bg-white font-medium"
                        >
                          <option value="unmemorized">لم تُحفظ</option>
                          <option value="memorized_new">حفظ جديد</option>
                          <option value="memorized_prior">محفوظ سابقاً</option>
                          <option value="consolidating">قيد التثبيت</option>
                          <option value="needs_review">يحتاج مراجعة</option>
                          <option value="mastered">متقن ومستقر</option>
                        </select>

                        {prog && prog.selfRating && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm tabular-nums">
                            {prog.selfRating} / 5
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Uthmani Quran Text */}
                    <p className="font-quran text-xl text-slate-900 leading-loose text-right">
                      {a.text}{' '}
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-amber-600 text-[11px] font-sans text-amber-700 font-bold mx-1">
                        {a.ayahNumber}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedSurahNum(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#083827] rounded-lg"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
