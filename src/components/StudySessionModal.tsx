import React, { useState, useEffect } from 'react';
import { DailyTask, SessionType, SessionAyahDetail } from '../types';
import { QuranService } from '../services/quranService';
import { StorageService } from './../services/storageService';
import { ReviewEngine } from './../services/reviewEngine';
import { Play, Pause, RotateCcw, CheckCircle2, AlertCircle, X, BookOpen, Clock, Award } from 'lucide-react';

interface StudySessionModalProps {
  task?: DailyTask | null;
  initialType?: SessionType;
  isOpen: boolean;
  onClose: () => void;
  onSessionCompleted: () => void;
}

export const StudySessionModal: React.FC<StudySessionModalProps> = ({
  task,
  initialType = 'new_memorization',
  isOpen,
  onClose,
  onSessionCompleted,
}) => {
  const [sessionType, setSessionType] = useState<SessionType>(initialType);
  const [startSurah, setStartSurah] = useState<number>(task ? task.startSurah : 2);
  const [startAyah, setStartAyah] = useState<number>(task ? task.startAyah : 1);
  const [endSurah, setEndSurah] = useState<number>(task ? task.endSurah : 2);
  const [endAyah, setEndAyah] = useState<number>(task ? task.endAyah : 10);

  // Timer state
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Verse completion & errors tracking
  const [ayahsList, setAyahsList] = useState<SessionAyahDetail[]>([]);
  const [ayahTexts, setAyahTexts] = useState<Record<string, string>>({});
  const [selfRating, setSelfRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [totalErrors, setTotalErrors] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Sync state when task changes or modal opens
  useEffect(() => {
    if (task) {
      setSessionType(task.taskType);
      setStartSurah(task.startSurah);
      setStartAyah(task.startAyah);
      setEndSurah(task.endSurah);
      setEndAyah(task.endAyah);
    } else {
      setSessionType(initialType);
    }
  }, [task, initialType]);

  // Load verses when range changes
  useEffect(() => {
    if (!isOpen) return;

    const rawAyahs = QuranService.getAyahsInRange(startSurah, startAyah, endSurah, endAyah);
    const details: SessionAyahDetail[] = rawAyahs.map((a) => ({
      surahNumber: a.surahNumber,
      ayahNumber: a.ayahNumber,
      completed: true, // Default to checked, user can uncheck for partial
      errors: 0,
    }));
    setAyahsList(details);

    const textsMap: Record<string, string> = {};
    rawAyahs.forEach((a) => {
      textsMap[`${a.surahNumber}_${a.ayahNumber}`] = a.text;
    });
    setAyahTexts(textsMap);
  }, [startSurah, startAyah, endSurah, endAyah, isOpen]);

  // Stopwatch effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (!isTimerRunning && secondsElapsed !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsElapsed]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const toggleAyahCompleted = (index: number) => {
    setAyahsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], completed: !copy[index].completed };
      return copy;
    });
  };

  const completedCount = ayahsList.filter((a) => a.completed).length;
  const isPartial = completedCount > 0 && completedCount < ayahsList.length;

  const handleFinishSession = () => {
    if (completedCount === 0) {
      alert('يرجى تحديد آية واحدة على الأقل تم إنجازها في الجلسة.');
      return;
    }

    setIsSubmitting(true);
    const user = StorageService.getUser();
    const activeGoal = StorageService.getActiveGoal();

    // Idempotency token to guarantee single execution
    const idempotencyToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const res = StorageService.recordSession(
      {
        userId: user.id,
        goalId: activeGoal?.id,
        taskId: task?.id,
        sessionType,
        startedAt: new Date(Date.now() - secondsElapsed * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        actualDurationSeconds: Math.max(secondsElapsed, completedCount * 60), // fallback estimate if timer wasn't run
        ayahs: ayahsList,
        selfRating,
        notes: notes.trim() || undefined,
        status: 'completed',
      },
      idempotencyToken
    );

    // If it's a revision session, also record adaptive Review record
    if (sessionType === 'review') {
      const recommendation = ReviewEngine.calculateNextReview({
        selfRating,
        errorsCount: totalErrors,
        consecutiveGoodReviews: selfRating >= 4 ? 2 : 0,
      });

      StorageService.saveReview({
        userId: user.id,
        sessionId: res.session.id,
        reviewDate: new Date().toISOString().split('T')[0],
        surahNumber: startSurah,
        startAyah,
        endAyah,
        result: selfRating >= 4 ? 'good' : selfRating === 3 ? 'average' : 'poor',
        selfRating,
        errorsObserved: totalErrors,
        intervalDaysApplied: recommendation.intervalDays,
        nextReviewRecommendation: recommendation.recommendedDate,
        reasoning: recommendation.reasoning,
        algorithmVersion: ReviewEngine.ALGORITHM_VERSION,
        notes: notes.trim() || undefined,
      });
    }

    setIsSubmitting(false);
    setSuccessFeedback(
      isPartial
        ? `تم تسجيل الإنجاز الجزئي بنجاح (${completedCount} من أصل ${ayahsList.length} آية). المتبقي لم يُحتسب كمنجز ولن يتم مضاعفة حمل الغد تلقائياً.`
        : `الحمد لله! تم تسجيل الجلسة بنجاح وتحديث مقاييس الحفظ والثبات.`
    );

    setTimeout(() => {
      setSuccessFeedback(null);
      onSessionCompleted();
      onClose();
    }, 1800);
  };

  const currentSurahMeta = QuranService.getSurah(startSurah);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#083827] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">جلسة دراسة وتسميع</h2>
              <p className="text-xs text-emerald-200/80">
                {currentSurahMeta?.name} (الآيات {startAyah} إلى {endAyah})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successFeedback && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">تم الحفظ بنجاح</p>
              <p className="text-xs mt-1 text-emerald-800 leading-relaxed">{successFeedback}</p>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Session Type & Timer Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            {/* Session Type Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">نوع النشاط:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSessionType('new_memorization')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    sessionType === 'new_memorization'
                      ? 'bg-[#083827] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  حفظ جديد
                </button>
                <button
                  type="button"
                  onClick={() => setSessionType('consolidation')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    sessionType === 'consolidation'
                      ? 'bg-[#083827] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  تثبيت
                </button>
                <button
                  type="button"
                  onClick={() => setSessionType('review')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    sessionType === 'review'
                      ? 'bg-[#083827] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مراجعة
                </button>
              </div>
            </div>

            {/* Stopwatch Control (Optional) */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-mono text-base font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 tabular-nums shadow-xs">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>{formatTime(secondsElapsed)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-1.5 rounded-lg text-white transition-colors ${
                    isTimerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                  title={isTimerRunning ? 'إيقاف مؤقت' : 'بدء المؤقت'}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setSecondsElapsed(0);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="إعادة ضبط المؤقت"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Verses Quran Display with Checkboxes for Partial Completion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>الآيات المقررة للتسميع</span>
                <span className="text-xs font-normal text-slate-500">
                  (حدد الآيات المنجزة فعلياً فقط لدعم الإنجاز الجزئي الدقيق)
                </span>
              </h3>
              <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md tabular-nums">
                تم إنجاز: {completedCount} من {ayahsList.length} آية
              </div>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-60 overflow-y-auto p-1 bg-white">
              {ayahsList.map((item, idx) => {
                const text = ayahTexts[`${item.surahNumber}_${item.ayahNumber}`] || '';
                return (
                  <div
                    key={`${item.surahNumber}_${item.ayahNumber}`}
                    onClick={() => toggleAyahCompleted(idx)}
                    className={`p-3.5 rounded-lg flex items-start gap-3 transition-colors cursor-pointer ${
                      item.completed ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-slate-50/40 hover:bg-slate-50 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleAyahCompleted(idx)}
                      className="mt-1.5 h-4 w-4 rounded border-slate-300 text-[#083827] focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#083827] bg-emerald-100/80 px-2 py-0.5 rounded-sm">
                          الآية {item.ayahNumber}
                        </span>
                      </div>
                      <p className="font-quran text-lg text-slate-900 leading-loose text-right">
                        {text}{' '}
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-amber-600 text-[11px] font-sans text-amber-700 font-bold mx-1">
                          {item.ayahNumber}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Self-Rating (1 to 5) & Error Counter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Self-Rating */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>التقييم الذاتي لمستوى الاستحضار (1 - 5):</span>
                <span className="text-amber-700 font-bold">{selfRating} / 5</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSelfRating(val as 1 | 2 | 3 | 4 | 5)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      selfRating === val
                        ? 'bg-[#083827] text-white border-[#083827] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 min-h-[28px] leading-tight">
                {selfRating === 1 && 'صعوبة كبيرة مع تعثر مستمر (سيتم تكرارها عاجلاً)'}
                {selfRating === 2 && 'يحتاج إلى مساعدة متكررة وتذكير بالبدايات'}
                {selfRating === 3 && 'أداء متوسط مع بعض الأخطاء أو التردد'}
                {selfRating === 4 && 'أداء جيد مع أخطاء محدودة واستحضار سلس'}
                {selfRating === 5 && 'أداء ممتاز وثابت جداً برواية متقنة'}
              </p>
            </div>

            {/* Error Counter */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                الأخطاء التي لاحظتها أثناء التسميع:
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTotalErrors((prev) => Math.max(0, prev - 1))}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                >
                  -
                </button>
                <div className="flex-1 text-center font-mono text-2xl font-bold text-slate-800 bg-white py-1.5 rounded-lg border border-slate-200 tabular-nums">
                  {totalErrors}
                </div>
                <button
                  type="button"
                  onClick={() => setTotalErrors((prev) => prev + 1)}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                تسجيل الأخطاء يساعد النظام التكيفي في تقريب مواعيد المراجعة لتثبيت المتشابهات.
              </p>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">ملاحظات الجلسة (اختياري):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: التركيز على متشابهة الآية مع سورة آل عمران..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-white text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            {isPartial && (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                إنجاز جزئي: سيتم تسجيل {completedCount} آية فقط.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={isSubmitting || completedCount === 0}
              onClick={handleFinishSession}
              className="px-5 py-2 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>إتمام وتسجيل الجلسة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
