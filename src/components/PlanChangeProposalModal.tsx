import React from 'react';
import { PlanChangeProposal } from '../types';
import { StorageService } from '../services/storageService';
import { AlertCircle, CheckCircle2, XCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

interface PlanChangeProposalModalProps {
  proposal: PlanChangeProposal;
  isOpen: boolean;
  onClose: () => void;
  onDecisionMade: () => void;
}

export const PlanChangeProposalModal: React.FC<PlanChangeProposalModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onDecisionMade,
}) => {
  if (!isOpen) return null;

  const handleDecision = (decision: 'accepted' | 'rejected') => {
    StorageService.decideProposal(proposal.id, decision);
    onDecisionMade();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-amber-500/10 border-b border-amber-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              مقترح تعديل الخطة النشطة (بانتظار موافقتك)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              لن يتم تطبيق أي تغيير على خطتك أو موعدك النهائي إلا بموافقتك الصريحة.
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700 leading-relaxed">
          {/* Reason Section */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">سبب اقتراح التعديل:</span>
            <p className="text-slate-600">{proposal.reason}</p>
          </div>

          {/* Philosophy Explanation */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-1">
            <span className="font-bold text-[#083827] block">فلسفة النظام في التعامل مع التأخير:</span>
            <p className="text-emerald-950/80 leading-relaxed">
              وفق قواعد «خِتام»، لا يقوم النظام بمضاعفة الحمل اليومي تلقائياً لتعويض المهام الفائتة، بل
              يقترح إعادة توزيع الآيات المتبقية بمرونة للحفاظ على جودة التثبيت وعدم إجهادك.
            </p>
          </div>

          {/* Impact Breakdown */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">أثر التعديل المقترح:</span>
            <p className="text-slate-700 font-medium">{proposal.impactSummary}</p>
            {proposal.proposedNewTargetDate && (
              <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-slate-800">
                <span>الموعد النهائي الجديد المقترح:</span>
                <span className="font-bold text-[#083827] tabular-nums">
                  {proposal.proposedNewTargetDate}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Decision Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleDecision('rejected')}
            className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>رفض التعديل (إبقاء الخطة الحالية)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDecision('accepted')}
            className="px-5 py-2 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>قبول التعديل وتفعيل الخطة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
