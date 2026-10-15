import React, { useState } from 'react';
import { MemorizationGoal, MemorizationRange, StudyPlan } from '../types';
import { QuranService, SURAHS } from '../services/quranService';
import { PlanningEngine, PlanGenerationResult } from '../services/planningEngine';
import { StorageService } from '../services/storageService';
import {
  X,
  Calendar,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Sparkles
} from 'lucide-react';

interface NewGoalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated: (goal: MemorizationGoal, plan: StudyPlan) => void;
}

export const NewGoalWizardModal: React.FC<NewGoalWizardModalProps> = ({
  isOpen,
  onClose,
  onGoalCreated,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [goalName, setGoalName] = useState<string>('خطة إتمام حفظ القرآن الكريم');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const defaultTarget = new Date();
  defaultTarget.setMonth(defaultTarget.getMonth() + 12);
  const [targetDate, setTargetDate] = useState<string>(defaultTarget.toISOString().split('T')[0]);

  // Start Mode
  const [startMode, setStartMode] = useState<'beginning' | 'custom_position'>('beginning');
  const [startingSurah, setStartingSurah] = useState<number>(1);
  const [startingAyah, setStartingAyah] = useState<number>(1);

  // Prior Memorization Ranges
  const [priorRanges, setPriorRanges] = useState<
    Array<{ startSurah: number; startAyah: number; endSurah: number; endAyah: number; label: string }>
  >([
    { startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6, label: 'جزء عم (سورة النبأ - الناس)' },
  ]);

  // Quick Range Presets
  const [newRangeStartSurah, setNewRangeStartSurah] = useState<number>(1);
  const [newRangeStartAyah, setNewRangeStartAyah] = useState<number>(1);
  const [newRangeEndSurah, setNewRangeEndSurah] = useState<number>(1);
  const [newRangeEndAyah, setNewRangeEndAyah] = useState<number>(7);

  // Daily Capacity
  const [dailyMinutes, setDailyMinutes] = useState<number>(45);
  const [studyDays, setStudyDays] = useState<number[]>([0, 1, 2, 3, 4, 6]); // Sun-Thu, Sat (Fri rest)

  // Plan Calculation Cache
  const [planResult, setPlanResult] = useState<PlanGenerationResult | null>(null);

  if (!isOpen) return null;

  const daysLabels = [
    { id: 0, label: 'الأحد' },
    { id: 1, label: 'الإثنين' },
    { id: 2, label: 'الثلاثاء' },
    { id: 3, label: 'الأربعاء' },
    { id: 4, label: 'الخميس' },
    { id: 5, label: 'الجمعة' },
    { id: 6, label: 'السبت' },
  ];

  const toggleStudyDay = (dayId: number) => {
    if (studyDays.includes(dayId)) {
      if (studyDays.length > 1) {
        setStudyDays(studyDays.filter((d) => d !== dayId));
      }
    } else {
      setStudyDays([...studyDays, dayId].sort());
    }
  };

  const handleAddRange = () => {
    const startMeta = QuranService.getSurah(newRangeStartSurah);
    const endMeta = QuranService.getSurah(newRangeEndSurah);
    if (!startMeta || !endMeta) return;

    const label =
      newRangeStartSurah === newRangeEndSurah
        ? `سورة ${startMeta.name} (${newRangeStartAyah}-${newRangeEndAyah})`
        : `من سورة ${startMeta.name} إلى ${endMeta.name}`;

    setPriorRanges([
      ...priorRanges,
      {
        startSurah: newRangeStartSurah,
        startAyah: newRangeStartAyah,
        endSurah: newRangeEndSurah,
        endAyah: newRangeEndAyah,
        label,
      },
    ]);
  };

  const handleRemoveRange = (index: number) => {
    setPriorRanges(priorRanges.filter((_, i) => i !== index));
  };

  const handleComputePlan = () => {
    const user = StorageService.getUser();
    const rangesForEngine: MemorizationRange[] = priorRanges.map((r, i) => ({
      id: `tmp_${i}`,
      userId: user.id,
      startSurah: r.startSurah,
      startAyah: r.startAyah,
      endSurah: r.endSurah,
      endAyah: r.endAyah,
      sourceType: 'pre_existing',
      createdAt: new Date().toISOString(),
    }));

    const result = PlanningEngine.generatePlan(
      {
        userId: user.id,
        name: goalName,
        startDate,
        targetCompletionDate: targetDate,
        startMode,
        startingSurahId: startMode === 'beginning' ? 1 : startingSurah,
        startingAyahNumber: startMode === 'beginning' ? 1 : startingAyah,
        endingSurahId: 114,
        endingAyahNumber: 6,
        dailyAvailableMinutes: dailyMinutes,
        studyDays,
        status: 'active',
      },
      rangesForEngine
    );

    setPlanResult(result);
    setCurrentStep(5);
  };

  const handleApplyAlternative = (type: string, val: string | number) => {
    if (type === 'extend_deadline') {
      setTargetDate(String(val));
    } else if (type === 'increase_time') {
      setDailyMinutes(Number(val));
    } else if (type === 'increase_days') {
      if (!studyDays.includes(5)) setStudyDays([...studyDays, 5].sort());
    }
  };

  const handleConfirmAndActivate = () => {
    if (!planResult) return;

    const user = StorageService.getUser();
    const newGoalId = `goal_${Date.now()}`;

    const goalToSave: MemorizationGoal = {
      id: newGoalId,
      userId: user.id,
      name: goalName,
      startDate,
      targetCompletionDate: targetDate,
      startMode,
      startingSurahId: startMode === 'beginning' ? 1 : startingSurah,
      startingAyahNumber: startMode === 'beginning' ? 1 : startingAyah,
      endingSurahId: 114,
      endingAyahNumber: 6,
      dailyAvailableMinutes: dailyMinutes,
      studyDays,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save Goal
    StorageService.saveGoal(goalToSave);

    // Save prior ranges
    priorRanges.forEach((r) => {
      StorageService.addRange({
        userId: user.id,
        startSurah: r.startSurah,
        startAyah: r.startAyah,
        endSurah: r.endSurah,
        endAyah: r.endAyah,
        sourceType: 'pre_existing',
      });
    });

    // Save Plan & activate
    const finalPlan: StudyPlan = {
      ...planResult.plan,
      goalId: newGoalId,
      userId: user.id,
      status: 'active',
      activatedAt: new Date().toISOString(),
    };
    StorageService.savePlan(finalPlan);

    // Save initial tasks
    const tasksToSave = planResult.tasks.slice(0, 90).map((t, idx) => ({
      ...t,
      id: `tsk_${Date.now()}_${idx}`,
      planId: finalPlan.id,
      goalId: newGoalId,
      userId: user.id,
    }));
    StorageService.saveTasks(tasksToSave);

    onGoalCreated(goalToSave, finalPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#083827] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">معالج إنشاء خطة الحفظ والختام</h2>
              <p className="text-xs text-emerald-200/80">خطوة {currentStep} من 5</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Line */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-emerald-600 h-1 transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* STEP 1: Basic Goal & Dates */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-emerald-700" />
                <span>المرحلة الأولى: تسمية الهدف والتواريخ</span>
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">اسم الهدف:</label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-white text-slate-800"
                  placeholder="مثال: حفظ القرآن الكريم كاملاً برواية حفص"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>تاريخ بداية الخطة:</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>الموعد المستهدف للختم:</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    min={startDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Starting Point */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>المرحلة الثانية: تحديد موضع بداية الحفظ</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setStartMode('beginning')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    startMode === 'beginning'
                      ? 'border-[#083827] bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <input
                      type="radio"
                      checked={startMode === 'beginning'}
                      onChange={() => setStartMode('beginning')}
                      className="text-[#083827] focus:ring-emerald-500"
                    />
                    <span className="font-bold text-sm text-slate-900">البدء من أول القرآن</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    يبدأ الحفظ من سورة الفاتحة والبقرة متسلسلاً وفق ترتيب المصحف الشريف.
                  </p>
                </div>

                <div
                  onClick={() => setStartMode('custom_position')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    startMode === 'custom_position'
                      ? 'border-[#083827] bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <input
                      type="radio"
                      checked={startMode === 'custom_position'}
                      onChange={() => setStartMode('custom_position')}
                      className="text-[#083827] focus:ring-emerald-500"
                    />
                    <span className="font-bold text-sm text-slate-900">البدء من موضع محدد</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    حدد السورة والآية التي ترغب في استئناف مسار الحفظ الجديد انطلاقاً منها.
                  </p>
                </div>
              </div>

              {startMode === 'custom_position' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">سورة البداية:</label>
                    <select
                      value={startingSurah}
                      onChange={(e) => {
                        setStartingSurah(Number(e.target.value));
                        setStartingAyah(1);
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      {SURAHS.map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. سورة {s.name} ({s.ayahCount} آية)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">من الآية رقم:</label>
                    <input
                      type="number"
                      min={1}
                      max={QuranService.getSurah(startingSurah)?.ayahCount || 286}
                      value={startingAyah}
                      onChange={(e) => setStartingAyah(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Prior Memorized Ranges (Separation & Overlap Resolution) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    المرحلة الثالثة: تسجيل المحفوظ السابق
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    المحفوظ السابق يُنظم للمراجعة والتثبيت ولا يُحسب ضمن «الحفظ الجديد» في الهدف.
                  </p>
                </div>
              </div>

              {/* Range List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {priorRanges.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                      <span className="font-semibold text-slate-900">{r.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRange(i)}
                      className="text-rose-600 hover:text-rose-800 text-xs px-2 py-0.5"
                    >
                      حذف
                    </button>
                  </div>
                ))}

                {priorRanges.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    لم تسجل أية أجزاء محفوظة سابقاً (سيتم تخطيط كامل المصحف كحفظ جديد).
                  </div>
                )}
              </div>

              {/* Add Range Inline Picker */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-3">
                <span className="text-xs font-bold text-emerald-950 block">
                  + إضافة سور أو نطاق آيات محفوظ سابقاً:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">من سورة:</label>
                    <select
                      value={newRangeStartSurah}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewRangeStartSurah(val);
                        if (val > newRangeEndSurah) setNewRangeEndSurah(val);
                      }}
                      className="w-full p-1.5 rounded-md border border-slate-200 bg-white text-xs"
                    >
                      {SURAHS.map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">من آية:</label>
                    <input
                      type="number"
                      min={1}
                      value={newRangeStartAyah}
                      onChange={(e) => setNewRangeStartAyah(Number(e.target.value))}
                      className="w-full p-1.5 rounded-md border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">إلى سورة:</label>
                    <select
                      value={newRangeEndSurah}
                      onChange={(e) => setNewRangeEndSurah(Number(e.target.value))}
                      className="w-full p-1.5 rounded-md border border-slate-200 bg-white text-xs"
                    >
                      {SURAHS.map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">إلى آية:</label>
                    <input
                      type="number"
                      min={1}
                      value={newRangeEndAyah}
                      onChange={(e) => setNewRangeEndAyah(Number(e.target.value))}
                      className="w-full p-1.5 rounded-md border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddRange}
                  className="w-full py-1.5 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-lg transition-colors"
                >
                  إضافة النطاق للقائمة
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Capacity & Study Days */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>المرحلة الرابعة: القدرة اليومية وأيام الدراسة</span>
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex justify-between">
                  <span>متوسط الوقت المتاح للدراسة يومياً:</span>
                  <span className="font-bold text-[#083827]">{dailyMinutes} دقيقة</span>
                </label>
                <input
                  type="range"
                  min={15}
                  max={150}
                  step={5}
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  className="w-full accent-[#083827]"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>15 دقيقة (خفيف)</span>
                  <span>45 دقيقة (متوازن)</span>
                  <span>90+ دقيقة (مكثف)</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  أيام الدراسة المتاحة أسبوعياً ({studyDays.length} أيام مختارة):
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {daysLabels.map((d) => {
                    const isSelected = studyDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleStudyDay(d.id)}
                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center ${
                          isSelected
                            ? 'bg-[#083827] text-white border-[#083827] shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Plan Feasibility Evaluation & Preview */}
          {currentStep === 5 && planResult && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>المرحلة الخامسة: تحليل واقعية الخطة وتأكيد التفعيل</span>
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    planResult.feasibility.isFeasible
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  واقعية الخطة: {planResult.feasibility.score}%
                </span>
              </div>

              {/* Feasibility Alert if Tight */}
              {!planResult.feasibility.isFeasible && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="flex items-start gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed font-medium">
                      {planResult.feasibility.warningMessage}
                    </p>
                  </div>

                  {planResult.feasibility.alternativeSuggestions && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-amber-950 block">
                        بدائل مقترحة لموازنة الخطة بدون إجهاد:
                      </span>
                      {planResult.feasibility.alternativeSuggestions.map((alt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{alt.title}</span>
                            <p className="text-[11px] text-slate-500">{alt.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleApplyAlternative(alt.type, alt.suggestedValue);
                              setTimeout(handleComputePlan, 100);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors shrink-0 mr-2"
                          >
                            تطبيق البديل
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Key Metrics Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">الحفظ الجديد</span>
                  <span className="font-bold text-base text-[#083827] tabular-nums">
                    {planResult.feasibility.totalNewAyahs} آية
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">المعدل اليومي</span>
                  <span className="font-bold text-base text-[#083827] tabular-nums">
                    {planResult.plan.paceAyahsPerDay} آيات/يوم
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">أيام الدراسة</span>
                  <span className="font-bold text-base text-[#083827] tabular-nums">
                    {planResult.plan.studyDaysCount} يوماً
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">الوقت التقديري</span>
                  <span className="font-bold text-base text-[#083827] tabular-nums">
                    ~{planResult.feasibility.dailyRequiredMinutes} د/يوم
                  </span>
                </div>
              </div>

              {/* First 3 Days Preview */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">
                  معاينة الأيام الثلاثة الأولى من الخطة المقترحة:
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {planResult.tasks.slice(0, 4).map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                            t.taskType === 'new_memorization'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.taskType === 'consolidation'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.taskType === 'new_memorization'
                            ? 'حفظ جديد'
                            : t.taskType === 'consolidation'
                            ? 'تثبيت'
                            : 'مراجعة'}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {QuranService.getSurah(t.startSurah)?.name} (الآيات {t.startAyah}-{t.endAyah})
                        </span>
                      </div>
                      <span className="text-slate-500 tabular-nums">
                        {t.scheduledDate} · ~{t.estimatedMinutes} دقيقة
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="px-5 py-2 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <span>التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="button"
              onClick={handleComputePlan}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <span>حساب الخطة وتحليل الواقعية</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </button>
          )}

          {currentStep === 5 && (
            <button
              type="button"
              onClick={handleConfirmAndActivate}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>موافقة وتفعيل خطة الحفظ النشطة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
