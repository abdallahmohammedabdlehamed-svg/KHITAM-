import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { User, UserSettings } from '../types';
import { Settings, User as UserIcon, Bell, ShieldCheck, Database, Volume2, Type, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  onOpenVerifier: () => void;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenVerifier, onDataReset }) => {
  const [user, setUser] = useState<User>(StorageService.getUser());
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const daysList = [
    { id: 0, label: 'الأحد' },
    { id: 1, label: 'الإثنين' },
    { id: 2, label: 'الثلاثاء' },
    { id: 3, label: 'الأربعاء' },
    { id: 4, label: 'الخميس' },
    { id: 5, label: 'الجمعة' },
    { id: 6, label: 'السبت' },
  ];

  const handleToggleDay = (id: number) => {
    if (settings.studyDays.includes(id)) {
      if (settings.studyDays.length > 1) {
        setSettings({ ...settings, studyDays: settings.studyDays.filter((d) => d !== id) });
      }
    } else {
      setSettings({ ...settings, studyDays: [...settings.studyDays, id].sort() });
    }
  };

  const handleSave = () => {
    StorageService.saveUser(user);
    StorageService.saveSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl pb-12">
      {/* Header */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">إعدادات المنصة والملف الشخصي</h1>
            <p className="text-xs text-slate-500">
              تخصيص أوقات الدراسة، تنبيهات المراجعة، وعرض النصوص القرآنية.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-xl shadow-xs transition-colors"
        >
          {saveSuccess ? 'تم الحفظ بنجاح ✓' : 'حفظ الإعدادات'}
        </button>
      </div>

      {/* User Information */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-emerald-700" />
          <span>البيانات الأساسية</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">الاسم الكريم:</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">البريد الإلكتروني:</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Daily Capacity & Study Days */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-700" />
          <span>تفضيلات الدراسة والتذكير</span>
        </h3>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex justify-between">
            <span>الوقت المتاح يومياً لدراسة الحفظ والمراجعة:</span>
            <span className="font-bold text-[#083827]">{settings.dailyAvailableMinutes} دقيقة</span>
          </label>
          <input
            type="range"
            min={15}
            max={120}
            step={5}
            value={settings.dailyAvailableMinutes}
            onChange={(e) =>
              setSettings({ ...settings, dailyAvailableMinutes: Number(e.target.value) })
            }
            className="w-full accent-[#083827]"
          />
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-slate-700 block">
            أيام الدراسة المعتمدة أسبوعياً:
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {daysList.map((d) => {
              const isSelected = settings.studyDays.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleToggleDay(d.id)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all text-center ${
                    isSelected
                      ? 'bg-[#083827] text-white border-[#083827]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="reminders"
              checked={settings.reminderEnabled}
              onChange={(e) => setSettings({ ...settings, reminderEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-[#083827]"
            />
            <label htmlFor="reminders" className="font-semibold text-slate-700">
              تفعيل التذكير اليومي بموعد المهمة
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500">وقت التنبيه:</label>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Quran Font Size Scaler */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Type className="w-4 h-4 text-emerald-700" />
          <span>حجم الخط القرآني في المصحف والتسميع</span>
        </h3>

        <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
          {(['small', 'medium', 'large', 'xlarge'] as const).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setSettings({ ...settings, quranFontSize: sz })}
              className={`py-2 rounded-lg border transition-colors ${
                settings.quranFontSize === sz
                  ? 'bg-[#083827] text-white border-[#083827]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sz === 'small' && 'صغير'}
              {sz === 'medium' && 'متوسط (الافتراضي)'}
              {sz === 'large' && 'كبير'}
              {sz === 'xlarge' && 'كبير جداً'}
            </button>
          ))}
        </div>

        {/* Live Font Sample */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center font-quran text-slate-900">
          <p
            className={`${
              settings.quranFontSize === 'small'
                ? 'text-lg'
                : settings.quranFontSize === 'large'
                ? 'text-2xl'
                : settings.quranFontSize === 'xlarge'
                ? 'text-3xl'
                : 'text-xl'
            } leading-loose`}
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ · ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ
          </p>
        </div>
      </div>

      {/* Quran Data Verification & System Tools */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-700" />
          <span>إدارة بيانات القرآن والنظام</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs">
          <div>
            <span className="font-bold text-emerald-950 block text-sm">
              أداة فحص وتدقيق نص القرآن الكريم
            </span>
            <p className="text-emerald-800/80 mt-0.5">
              فحص سلامة واكتمال 114 سورة و 6236 آية وفق الرسم العثماني المعتمد.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenVerifier}
            className="px-4 py-2 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-lg transition-colors shrink-0"
          >
            فتح أداة التدقيق
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="font-bold text-slate-900 block">إعادة ضبط البيانات إلى الوضع الافتراضي</span>
            <p className="text-slate-500 mt-0.5">
              إعادة تحميل بيانات الهدف والجلسات التجريبية الافتراضية.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('هل أنت متأكد من رغبتك في إعادة ضبط البيانات إلى الوضع الافتراضي؟')) {
                StorageService.resetToDefault();
                onDataReset();
              }
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors shrink-0"
          >
            إعادة ضبط البيانات
          </button>
        </div>
      </div>
    </div>
  );
};
