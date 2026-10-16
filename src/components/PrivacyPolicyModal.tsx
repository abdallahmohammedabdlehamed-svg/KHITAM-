import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, FileText, Trash2, HeartHandshake } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
                ميثاق الخصوصية وحماية بيانات المستخدم
              </h2>
              <p className="text-xs text-emerald-200/80">منصة خِتام | KHITAM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-slate-700 text-xs leading-relaxed max-h-[70vh] overflow-y-auto">
          {/* Section 1: Sacredness of Memorization Data */}
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <HeartHandshake className="w-4 h-4 text-emerald-700" />
              <span>1. قدسية وسرية بيانات الحفظ والعبادة</span>
            </div>
            <p className="text-emerald-900/90 leading-relaxed">
              نؤمن في منصة «خِتام» بأن رحلة حفظ القرآن الكريم وتلاوته وتثبيته هي عبادة شخصية خالصة بين العبد
              وربه. ولذلك فإن كافة سجلات التسميع، درجات الاستحضار، الأخطاء الملحوظة، والملاحظات الذاتية تُعامل
              بأقصى درجات القدسية والسرية، ولا تُستخدم لأي غرض آخر سوى خدمة وتسهيل حفظك لكتاب الله.
            </p>
          </div>

          {/* Section 2: Complete User Isolation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>2. العزل التام للبيانات بين المستخدمين (User Isolation)</span>
            </div>
            <p className="text-slate-600">
              تعتمد المنصة سياسة العزل المنطقي الصارم:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pr-2">
              <li>كل مستخدم يرى بياناته وجلساته وأهدافه ومحفوظه الخاص فقط.</li>
              <li>لا يمكن لأي مستخدم آخر أو زائر الوصول إلى خطتك أو سجل أخطائك، حتى عند معرفة المعرف.</li>
              <li>تُحفظ كلمات المرور مشفرة باستخدام خوارزميات التجزئة الآمنة (SHA-256 مع Salt).</li>
              <li>لا تكشف المنصة في واجهات استعادة كلمة المرور ما إذا كان بريد معين مسجلاً أم لا.</li>
            </ul>
          </div>

          {/* Section 3: Zero Commercialization & No Tracking */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <EyeOff className="w-4 h-4 text-emerald-700" />
              <span>3. انعدام الإعلانات والتتبع التجاري</span>
            </div>
            <p className="text-slate-600">
              منصة «خِتام» خالية تماماً من أية برمجيات تتبع تجارية أو إعلانية، ولا نقوم إطلاقاً ببيع أو تأجير
              أو مشاركة أية بيانات تخص المستخدمين مع أي طرف ثالث لأغراض تسويقية أو تجارية.
            </p>
          </div>

          {/* Section 4: Export and Complete Erasure */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Trash2 className="w-4 h-4 text-emerald-700" />
              <span>4. حق التصدير والحذف الشامل للبيانات</span>
            </div>
            <p className="text-slate-600">
              البيانات ملك كامل لك وحدك:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pr-2">
              <li>يمكنك في أي وقت تنزيل نسخة احتياطية كاملة من خطتك وجلساتك بصيغتي JSON و CSV.</li>
              <li>يمكنك حذف حسابك نهائياً من المنصة؛ وفور تنفيذ الحذف، تُمسح كافة أهدافك وسجلاتك وتقدمك مسحاً تاماً.</li>
            </ul>
          </div>

          {/* Section 5: Transparency of Algorithms */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>5. شفافية الخوارزميات وعدم فرض قرارات مفاجئة</span>
            </div>
            <p className="text-slate-600">
              جميع حسابات التخطيط والمراجعة التكيفية مبنية على قواعد رياضية معلنة وقابلة للتفسير. ولا يغير
              النظام أي موعد نهائي أو يضاعف أي حمل يومي من تلقاء نفسه، بل يقدم مقترحات شفافة للموافقة أو الرفض.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">خِتام © 2026 · منصة آمنة وموثوقة</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-xl transition-colors"
          >
            فهمت وأوافق
          </button>
        </div>
      </div>
    </div>
  );
};
