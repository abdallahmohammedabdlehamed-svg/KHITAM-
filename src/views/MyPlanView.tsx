import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { QuranService } from '../services/quranService';
import { DailyTask, TaskType, TaskStatus } from '../types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

interface MyPlanViewProps {
  onStartSession: (task: DailyTask) => void;
  onOpenProposal: (proposalId: string) => void;
  onOpenGoalWizard: () => void;
}

export const MyPlanView: React.FC<MyPlanViewProps> = ({
  onStartSession,
  onOpenProposal,
  onOpenGoalWizard,
}) => {
  const user = StorageService.getUser();
  const activeGoal = StorageService.getActiveGoal();
  const activePlan = activeGoal ? StorageService.getActivePlan(activeGoal.id) : null;
  const allTasks = StorageService.getTasks();
  const proposals = StorageService.getProposals().filter((p) => p.status === 'pending');

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchDate, setSearchDate] = useState<string>('');

  const filteredTasks = allTasks.filter((t) => {
    if (typeFilter !== 'all' && t.taskType !== typeFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchDate && t.scheduledDate !== searchDate) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Plan Header Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                الإصدار {activePlan?.versionNumber || 1}.0 (الخطة النشطة)
              </span>
              <span className="text-xs text-slate-500">
                تاريخ التفعيل: {activePlan?.activatedAt?.split('T')[0] || activeGoal?.startDate}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {activeGoal?.name || 'خطة الحفظ والمراجعة'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              خوارزمية تخطيط حتمية مبنية على معدل {activePlan?.paceAyahsPerDay || 18} آيات جديدة لكل يوم دراسي.
            </p>
          </div>

          <button
            onClick={onOpenGoalWizard}
            className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors shrink-0"
          >
            إعادة تخطيط أو تعديل الهدف
          </button>
        </div>

        {/* Plan Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">إجمالي أيام الدراسة</span>
            <span className="font-bold text-slate-800 text-sm tabular-nums">
              {activePlan?.studyDaysCount || 0} يوماً
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">الحفظ الجديد المخطط</span>
            <span className="font-bold text-slate-800 text-sm tabular-nums">
              {activePlan?.totalNewAyahs || 0} آية
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">الوقت المتاح يومياً</span>
            <span className="font-bold text-slate-800 text-sm tabular-nums">
              {activeGoal?.dailyAvailableMinutes || 45} دقيقة
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">حالة الواقعية والاتزان</span>
            <span className="font-bold text-emerald-700 text-sm">
              {activePlan?.feasibilityScore || 90}% واقعية
            </span>
          </div>
        </div>
      </div>

      {/* Pending Change Proposals */}
      {proposals.length > 0 && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-950">
                مقترح رسمي لتعديل الخطة ينتظر موافقتك
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {proposals[0].reason}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => onOpenProposal(proposals[0].id)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-xs"
                >
                  الاطلاع على أثر التعديل والقرار
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-500 text-xs font-semibold ml-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> النوع:
          </span>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              typeFilter === 'all' ? 'bg-[#083827] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setTypeFilter('new_memorization')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              typeFilter === 'new_memorization'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            حفظ جديد
          </button>
          <button
            onClick={() => setTypeFilter('consolidation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              typeFilter === 'consolidation'
                ? 'bg-blue-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            تثبيت
          </button>
          <button
            onClick={() => setTypeFilter('review')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              typeFilter === 'review'
                ? 'bg-amber-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            مراجعة
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="all">جميع الحالات</option>
            <option value="scheduled">مجدولة</option>
            <option value="completed">مكتملة</option>
            <option value="partial">إنجاز جزئي</option>
            <option value="overdue">متأخرة</option>
          </select>

          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
          />
          {searchDate && (
            <button
              onClick={() => setSearchDate('')}
              className="text-xs text-rose-600 hover:underline"
            >
              مسح التاريخ
            </button>
          )}
        </div>
      </div>

      {/* Task Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">نوع المهمة</th>
                <th className="py-3 px-4">الموضع القرآني</th>
                <th className="py-3 px-4">عدد الآيات</th>
                <th className="py-3 px-4">الوقت التقديري</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد مهام تطابق معايير التصفية الحالية.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const surahMeta = QuranService.getSurah(task.startSurah);
                  const isCompleted = task.status === 'completed';
                  const isPartial = task.status === 'partial';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 tabular-nums">
                        {task.scheduledDate}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
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
                            ? 'تثبيت'
                            : 'مراجعة'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        سورة {surahMeta?.name} (الآيات {task.startAyah}-{task.endAyah})
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                        {task.ayahCount} آية
                      </td>
                      <td className="py-3 px-4 text-slate-500 tabular-nums">
                        ~{task.estimatedMinutes} دقيقة
                      </td>
                      <td className="py-3 px-4">
                        {isCompleted && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            مكتملة
                          </span>
                        )}
                        {isPartial && (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            جزئي ({task.completedAyahsCount}/{task.ayahCount})
                          </span>
                        )}
                        {!isCompleted && !isPartial && (
                          <span className="text-slate-400 font-medium">مجدولة</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onStartSession(task)}
                          className="px-3 py-1 text-xs font-bold text-[#083827] bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                        >
                          {isCompleted ? 'إعادة' : 'تسميع'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
