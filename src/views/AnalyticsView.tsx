import React from 'react';
import { StorageService } from '../services/storageService';
import { BarChart3, Download, TrendingUp, Clock, CheckCircle2, Award, FileSpreadsheet } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const user = StorageService.getUser();
  const stats = StorageService.getCoverageStats(user.id);
  const tasks = StorageService.getTasks();
  const sessions = StorageService.getSessions();

  // Compliance metrics: Strictly tasks scheduled up to today
  const todayStr = new Date().toISOString().split('T')[0];
  const dueTasks = tasks.filter((t) => t.scheduledDate <= todayStr);
  const completedTasks = dueTasks.filter((t) => t.status === 'completed');
  const partialTasks = dueTasks.filter((t) => t.status === 'partial');
  const missedTasks = dueTasks.filter((t) => t.status === 'scheduled');

  const complianceRate =
    dueTasks.length > 0
      ? Math.round(((completedTasks.length + partialTasks.length * 0.5) / dueTasks.length) * 100)
      : 100;

  // Total Study Hours
  const totalMinutes = Math.round(
    sessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0) / 60
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  // New Memorization vs Revision ratio
  const newHifdhCount = stats.newGoalMemorized + stats.inConsolidation;
  const revisionCount = stats.priorMemorized + stats.mastered;

  const handleExportJson = () => {
    const jsonStr = StorageService.exportFullDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khitam_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    // Export tasks & sessions CSV
    const headers = ['تاريخ_الجلسة', 'نوع_النشاط', 'المدة_بالدقائق', 'التقييم', 'عدد_الآيات'];
    const rows = sessions.map((s) => [
      s.startedAt.split('T')[0],
      s.sessionType,
      Math.round(s.actualDurationSeconds / 60),
      s.selfRating || '',
      s.ayahs.filter((a) => a.completed).length,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khitam_sessions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Export Actions */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">الإحصائيات والتقارير الموثقة</h1>
            <p className="text-xs text-slate-500">
              تحليلات دقيقة لأدائك الفعلي ونسبة الالتزام وتوزيع ساعات الدراسة.
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>تصدير CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>نسخة احتياطية JSON</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Compliance Rate */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">نسبة الالتزام بالخطة</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#083827] tabular-nums">{complianceRate}%</span>
            <span className="text-xs text-slate-400">من المهام المستحقة</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
            محسوبة بدقة من واقع {completedTasks.length} مهمة منجزة بالكامل و {partialTasks.length} مهمة جزئية.
          </p>
        </div>

        {/* Study Hours */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ساعات الدراسة المسجلة</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 tabular-nums">{totalHours}</span>
            <span className="text-xs text-slate-400">ساعة إجمالية</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
            ما يعادل {totalMinutes} دقيقة مقسمة على {sessions.length} جلسة دراسية موثقة.
          </p>
        </div>

        {/* New Memorization vs Revision Balance */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">توزيع الجهد الدراسي</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-blue-700">حفظ جديد: {newHifdhCount} آية</span>
              <span className="text-emerald-700">مراجعة: {revisionCount} آية</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-2"
                style={{ width: `${Math.round((newHifdhCount / Math.max(1, newHifdhCount + revisionCount)) * 100)}%` }}
              />
              <div
                className="bg-emerald-600 h-2"
                style={{ width: `${Math.round((revisionCount / Math.max(1, newHifdhCount + revisionCount)) * 100)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            توازن صحي بين الحفظ الجديد وصيانة المحفوظ السابق وتثبيته.
          </p>
        </div>
      </div>

      {/* Task Performance Breakdown */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">تفاصيل تنفيذ المهام المستحقة</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 block text-[11px]">مكتملة بالكامل</span>
            <span className="font-bold text-xl text-emerald-950 tabular-nums">
              {completedTasks.length}
            </span>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-amber-800 block text-[11px]">إنجاز جزئي موثق</span>
            <span className="font-bold text-xl text-amber-950 tabular-nums">
              {partialTasks.length}
            </span>
          </div>

          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-rose-800 block text-[11px]">مهام غير مكتملة</span>
            <span className="font-bold text-xl text-rose-950 tabular-nums">
              {missedTasks.length}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-600 block text-[11px]">إجمالي الجلسات</span>
            <span className="font-bold text-xl text-slate-900 tabular-nums">
              {sessions.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
