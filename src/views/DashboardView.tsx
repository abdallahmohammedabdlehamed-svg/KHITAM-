import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { QuranService } from '../services/quranService';
import { DailyTask, SessionType } from '../types';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  Flame,
  Award
} from 'lucide-react';

interface DashboardViewProps {
  onStartSession: (task?: DailyTask, type?: SessionType) => void;
  onOpenGoalWizard: () => void;
  onNavigateToPlan: () => void;
  onNavigateToReviews: () => void;
  onNavigateToMatrix: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartSession,
  onOpenGoalWizard,
  onNavigateToPlan,
  onNavigateToReviews,
  onNavigateToMatrix,
}) => {
  const user = StorageService.getUser();
  const activeGoal = StorageService.getActiveGoal();
  const stats = StorageService.getCoverageStats(user.id);
  const todayStr = new Date().toISOString().split('T')[0];
  const allTasks = StorageService.getTasks();
  const todayTasks = allTasks.filter((t) => t.scheduledDate === todayStr);
  const reviews = StorageService.getReviews();
  const proposals = StorageService.getProposals().filter((p) => p.status === 'pending');
  const sessions = StorageService.getSessions();

  // Upcoming days (next 5 days)
  const upcomingTasks = allTasks.filter(
    (t) => t.scheduledDate > todayStr && t.status !== 'completed'
  ).slice(0, 5);

  // Calculate days remaining
  let daysRemaining = 0;
  if (activeGoal) {
    const diff = new Date(activeGoal.targetCompletionDate).getTime() - new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Calculate total study time
  const totalDurationMinutes = Math.round(
    sessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0) / 60
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Pending Proposal Alert Banner */}
      {proposals.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                يوجد مقترح لتعديل خطة الحفظ النشطة بانتظار قرارك
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {proposals[0].reason} — لن يتم تطبيق أي تعديل حتى تعتمده بنفسك.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToPlan}
            className="px-4 py-1.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-xs"
          >
            مراجعة المقترح والبت فيه
          </button>
        </div>
      )}

      {/* Goal Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#083827] via-[#0A4D34] to-[#042419] rounded-2xl p-6 sm:p-8 text-white shadow-md border border-emerald-900/40">
        {/* Subtle Decorative Pattern */}
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full border border-emerald-500/10 pointer-events-none" />
        <div className="absolute right-1/4 -top-16 w-64 h-64 rounded-full border border-emerald-500/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                الهدف النشط
              </span>
              <span className="text-xs text-emerald-200/80">مرحلة التثبيت والتقدم</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              أهلاً بك، {user.name}
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              {activeGoal?.name || 'رحلة إتمام حفظ القرآن الكريم'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-200/70 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                الموعد المستهدف: {activeGoal?.targetCompletionDate || '2027-04-15'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 font-bold text-amber-300 tabular-nums">
                <Flame className="w-3.5 h-3.5" />
                المتبقي: {daysRemaining} يوماً
              </span>
            </div>
          </div>

          {/* Quick Hero Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <button
              onClick={() => onStartSession(todayTasks[0] || undefined, 'new_memorization')}
              className="px-5 py-2.5 text-xs font-bold text-[#083827] bg-white hover:bg-emerald-50 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-[#083827]" />
              <span>بدء جلسة اليوم</span>
            </button>
            <button
              onClick={onOpenGoalWizard}
              className="px-4 py-2.5 text-xs font-semibold text-emerald-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors"
            >
              تعديل الهدف أو إنشاء خطة جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Progress Cards: Clear Distinction Between Prior, New, and Total */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quran Coverage */}
        <div
          onClick={onNavigateToMatrix}
          className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">التغطية الإجمالية للمصحف</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#083827] tabular-nums">
              {stats.coveragePercentage}%
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              ({stats.totalMemorized} من 6236 آية)
            </span>
          </div>
          {/* Visual bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, stats.coveragePercentage)}%` }}
            />
          </div>
        </div>

        {/* Prior Memorization */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">المحفوظ السابق</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 tabular-nums">
              {stats.priorMemorized}
            </span>
            <span className="text-xs text-slate-500">آية محفوظة قبل الهدف</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">يُنظم للمراجعة والتثبيت الدوري</p>
        </div>

        {/* Newly Memorized Under Current Goal */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">الحفظ الجديد المنجز</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-800 tabular-nums">
              {stats.newGoalMemorized + stats.inConsolidation}
            </span>
            <span className="text-xs text-slate-500">آية جديدة ضمن الهدف</span>
          </div>
          <p className="text-[11px] text-blue-600/80 mt-3">منجز ومثبت خلال هذه الخطة</p>
        </div>

        {/* Study Time Logged */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">وقت الدراسة المسجل</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 tabular-nums">
              {totalDurationMinutes}
            </span>
            <span className="text-xs text-slate-500">دقيقة دراسة فعلية</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            عبر {sessions.length} جلسة دراسة موثقة
          </p>
        </div>
      </div>

      {/* Main Grid: Today's Tasks & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">مهام اليوم المقررة</h2>
              <span className="text-xs text-slate-500 font-mono tabular-nums">({todayStr})</span>
            </div>
            <button
              onClick={() => onStartSession(undefined, 'independent')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              + جلسة دراسة حرة
            </button>
          </div>

          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  لا توجد مهام مجدولة لهذا اليوم (يوم راحة أو اكتملت المهام).
                </p>
                <button
                  onClick={() => onStartSession(undefined, 'review')}
                  className="mt-2 px-4 py-2 text-xs font-bold text-white bg-[#083827] rounded-lg"
                >
                  بدء مراجعة حرة الآن
                </button>
              </div>
            ) : (
              todayTasks.map((task) => {
                const surahMeta = QuranService.getSurah(task.startSurah);
                const isCompleted = task.status === 'completed';
                const isPartial = task.status === 'partial';

                return (
                  <div
                    key={task.id}
                    className={`p-5 rounded-2xl border transition-all bg-white shadow-xs ${
                      isCompleted
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isPartial
                        ? 'border-amber-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              task.taskType === 'new_memorization'
                                ? 'bg-emerald-100 text-emerald-800'
                                : task.taskType === 'consolidation'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {task.taskType === 'new_memorization'
                              ? 'حفظ جديد'
                              : task.taskType === 'consolidation'
                              ? 'تثبيت المقدار'
                              : 'مراجعة دورية'}
                          </span>

                          {isCompleted && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              مكتملة بالكامل
                            </span>
                          )}

                          {isPartial && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                              إنجاز جزئي ({task.completedAyahsCount} من {task.ayahCount} آية)
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          سورة {surahMeta?.name} (الآيات {task.startAyah} إلى {task.endAyah})
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="tabular-nums">{task.ayahCount} آية</span>
                          <span>·</span>
                          <span className="tabular-nums">الوقت التقديري: ~{task.estimatedMinutes} دقيقة</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onStartSession(task, task.taskType)}
                          className="px-4 py-2 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{isCompleted ? 'إعادة التسميع' : 'بدء الجلسة'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Adaptive Review Radar & Upcoming Days */}
        <div className="space-y-6">
          {/* Adaptive Review Box */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-700" />
                <span>المراجعات الذكية المستحقة</span>
              </h3>
              <button
                onClick={onNavigateToReviews}
                className="text-xs text-emerald-800 font-semibold hover:underline"
              >
                الكل
              </button>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500">لا توجد مراجعات متراكمة، أداؤك ممتاز!</p>
            ) : (
              <div className="space-y-2">
                {reviews.slice(0, 2).map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-800">
                      <span>{QuranService.getSurah(r.surahNumber)?.name} (الآيات {r.startAyah}-{r.endAyah})</span>
                      <span className="text-amber-700 font-mono tabular-nums">الموعد: {r.nextReviewRecommendation}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{r.reasoning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Schedule */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">جدول الأيام القادمة</h3>
              <button
                onClick={onNavigateToPlan}
                className="text-xs text-emerald-800 font-semibold hover:underline"
              >
                عرض الخطة
              </button>
            </div>

            <div className="space-y-2 divide-y divide-slate-100">
              {upcomingTasks.map((t) => (
                <div key={t.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {QuranService.getSurah(t.startSurah)?.name} ({t.startAyah}-{t.endAyah})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t.taskType === 'new_memorization' ? 'حفظ جديد' : 'تثبيت'} · {t.ayahCount} آية
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono tabular-nums">{t.scheduledDate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
