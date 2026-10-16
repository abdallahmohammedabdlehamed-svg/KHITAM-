import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { KhitamLogo } from './KhitamLogo';
import { X, Lock, Mail, User as UserIcon, LogIn, UserPlus, KeyRound, Shield, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onAuthSuccess: () => void;
  onOpenPrivacyPolicy: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onAuthSuccess,
  onOpenPrivacyPolicy,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('abdullah@khitam.org');
  const [password, setPassword] = useState<string>('KhitamPassword123');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Password reset fields
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetStep, setResetStep] = useState<'request' | 'reset'>('request');

  // UI status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await AuthService.login({ email, password });
        if (!res.success) {
          setErrorMessage(res.message);
          setIsLoading(false);
          return;
        }
        setSuccessMessage(res.message);
        setTimeout(() => {
          setIsLoading(false);
          onAuthSuccess();
          onClose();
        }, 800);
      } else if (mode === 'register') {
        const res = await AuthService.register({ name, email, password });
        if (!res.success) {
          setErrorMessage(res.message);
          setIsLoading(false);
          return;
        }
        setSuccessMessage(res.message);
        setTimeout(() => {
          setIsLoading(false);
          onAuthSuccess();
          onClose();
        }, 1000);
      } else if (mode === 'forgot') {
        if (resetStep === 'request') {
          const res = AuthService.requestPasswordReset(email);
          setSuccessMessage(res.message);
          if (res.demoResetToken) {
            setResetToken(res.demoResetToken);
            setResetStep('reset');
          }
          setIsLoading(false);
        } else {
          const res = await AuthService.resetPassword(resetToken, newPassword);
          if (!res.success) {
            setErrorMessage(res.message);
            setIsLoading(false);
            return;
          }
          setSuccessMessage(res.message);
          setTimeout(() => {
            setMode('login');
            setResetStep('request');
            setIsLoading(false);
          }, 1200);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.');
      setIsLoading(false);
    }
  };

  const handleQuickSwitch = (targetEmail: string, targetName: string) => {
    setEmail(targetEmail);
    setPassword('KhitamPassword123');
    setName(targetName);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-[#083827] to-[#0A4D34] text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-1.5 rounded-lg text-emerald-100/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-2">
            <KhitamLogo size={52} />
          </div>

          <h2 className="text-xl font-bold tracking-tight">خِتَـام | KHITAM</h2>
          <p className="text-xs text-emerald-100/80 mt-1">
            منصة حفظ القرآن الكريم وتثبيته والمراجعة التكيفية
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'border-[#083827] text-[#083827] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'border-[#083827] text-[#083827] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>حساب جديد</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">{successMessage}</p>
            </div>
          )}

          {/* Registration: Name Field */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">الاسم الكريم:</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="مثال: عبد الله بن أحمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          {mode !== 'forgot' || resetStep === 'request' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">البريد الإلكتروني:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800"
                />
              </div>
            </div>
          ) : null}

          {/* Password Field */}
          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">كلمة المرور:</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-emerald-800 hover:underline font-semibold"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password: Step 2 New Password */}
          {mode === 'forgot' && resetStep === 'reset' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">رمز الاستعادة:</label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">كلمة المرور الجديدة:</label>
                <input
                  type="password"
                  required
                  placeholder="6 خانات على الأقل"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>دخول إلى حسابي ومتابعة حفظي</span>
              </>
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>إنشاء الحساب وبدء الخطة</span>
              </>
            ) : resetStep === 'request' ? (
              <>
                <KeyRound className="w-4 h-4" />
                <span>طلب استعادة كلمة المرور</span>
              </>
            ) : (
              <span>تعيين كلمة المرور الجديدة</span>
            )}
          </button>

          {/* Demo User Switcher for Testing Multi-User Privacy */}
          <div className="pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-500 font-semibold block mb-1.5">
              تجربة العزل والخصوصية بين حسابين مختلفين:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickSwitch('abdullah@khitam.org', 'عبد الله محمد')}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 truncate text-right font-medium"
              >
                👤 حساب عبد الله (الحالي)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('fatima@khitam.org', 'فاطمة الزهراء')}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 truncate text-right font-medium"
              >
                👤 حساب فاطمة (مستقل)
              </button>
            </div>
          </div>
        </form>

        {/* Privacy Note Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <Shield className="w-3.5 h-3.5" />
            بياناتك مشفرة ومحمية بخصوصية تامة
          </span>
          <button
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="text-emerald-800 hover:underline font-semibold"
          >
            وثيقة الخصوصية
          </button>
        </div>
      </div>
    </div>
  );
};
