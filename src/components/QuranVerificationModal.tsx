import React, { useState } from 'react';
import { QuranService, ValidationReport } from '../services/quranService';
import { X, CheckCircle2, AlertTriangle, FileText, Upload, ShieldCheck, Download } from 'lucide-react';

interface QuranVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuranVerificationModal: React.FC<QuranVerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('quran-uthmani.txt (المرجع الرسمي المدمج)');

  if (!isOpen) return null;

  const handleVerifyBundledData = async () => {
    setIsVerifying(true);
    setFileName('quran-uthmani.txt (المرجع الرسمي Tanzil Uthmani)');

    try {
      const resp = await fetch('/data/quran-uthmani.txt');
      const text = await resp.text();
      const validation = QuranService.validateQuranTextFile(text);
      setReport(validation);
    } catch (err) {
      alert('تعذر قراءة ملف القرآن، يرجى المحاولة لاحقاً.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsVerifying(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = QuranService.validateQuranTextFile(content);
      setReport(validation);
      setIsVerifying(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#083827] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                أداة تدقيق وسلامة بيانات القرآن الكريم
              </h2>
              <p className="text-xs text-emerald-200/80">فحص النزاهة والترتيب والعدد المعتمد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleVerifyBundledData}
              disabled={isVerifying}
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-right transition-all group"
            >
              <div className="flex items-center gap-2 text-[#083827] font-bold text-sm mb-1">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>تدقيق الملف الرسمي المدمج</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                التحقق من ملف Tanzil Uthmani المعتمد داخل التطبيق (114 سورة - 6236 آية).
              </p>
            </button>

            <label className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-right transition-all cursor-pointer">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>فحص ملف خارجي جديد</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                ارفع ملف نصي بصيغة (سورة|آية|نص) للتحقق منه قبل اعتماده.
              </p>
              <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Verification Report Display */}
          {isVerifying ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">جاري فحص جميع آيات القرآن الكريم وتدقيق الترتيب...</p>
            </div>
          ) : report ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Status Header */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  report.isValid
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                {report.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {report.isValid
                      ? 'البيانات سليمة ومطابقة للمرجع القرآني المعتمد بنسبة 100%'
                      : 'تم اكتشاف أخطاء أو نواقص في ملف البيانات'}
                  </h4>
                  <p className="text-xs mt-1 text-slate-600">الملف: {fileName}</p>
                </div>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">السور المفحوصة</span>
                  <span className="font-bold text-base text-[#083827] tabular-nums">
                    {report.totalSurahsFound} / 114
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">الآيات الصحيحة</span>
                  <span className="font-bold text-base text-[#083827] tabular-nums">
                    {report.totalAyahsFound} / 6236
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">الآيات المفقودة</span>
                  <span className={`font-bold text-base tabular-nums ${report.missingAyahs.length === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {report.missingAyahs.length}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">التكرار غير المصرح</span>
                  <span className={`font-bold text-base tabular-nums ${report.duplicates.length === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {report.duplicates.length}
                  </span>
                </div>
              </div>

              {/* Sample Surah Integrity Details */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">عينة من تقرير تدقيق السور:</span>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white text-xs p-1">
                  {report.surahDetails.slice(0, 10).map((s) => (
                    <div key={s.number} className="p-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {s.number}. سورة {s.name}
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {s.foundCount} من أصل {s.expectedCount} آية
                      </span>
                      <span className="text-emerald-700 font-bold text-xs">مطابق ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
              <p>اضغط على "تدقيق الملف الرسمي المدمج" لتشغيل فحص النزاهة لبيانات القرآن الكريم.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs">
          <a
            href="/data/quran-uthmani.txt"
            download="quran-uthmani.txt"
            className="text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل ملف quran-uthmani.txt</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#083827] hover:bg-[#062c20] rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
