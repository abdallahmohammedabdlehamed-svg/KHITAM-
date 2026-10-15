import React, { useState, useEffect } from 'react';
import { KhitamLogo } from './components/KhitamLogo';
import { DashboardView } from './views/DashboardView';
import { MyPlanView } from './views/MyPlanView';
import { MemorizationMatrixView } from './views/MemorizationMatrixView';
import { ReviewsHubView } from './views/ReviewsHubView';
import { MasteryView } from './views/MasteryView';
import { HistoryView } from './views/HistoryView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { StudySessionModal } from './components/StudySessionModal';
import { NewGoalWizardModal } from './components/NewGoalWizardModal';
import { PlanChangeProposalModal } from './components/PlanChangeProposalModal';
import { QuranVerificationModal } from './components/QuranVerificationModal';
import { StorageService } from './services/storageService';
import { DailyTask, SessionType, PlanChangeProposal } from './types';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  RotateCcw,
  Award,
  History,
  BarChart3,
  Settings,
  Plus,
  Play,
  ShieldCheck
} from 'lucide-react';

type ActiveTab =
  | 'dashboard'
  | 'plan'
  | 'matrix'
  | 'reviews'
  | 'mastery'
  | 'history'
  | 'analytics'
  | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Modal States
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [sessionTask, setSessionTask] = useState<DailyTask | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>('new_memorization');

  const [isGoalWizardOpen, setIsGoalWizardOpen] = useState<boolean>(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState<boolean>(false);
  const [activeProposal, setActiveProposal] = useState<PlanChangeProposal | null>(null);
  const [isVerifierOpen, setIsVerifierOpen] = useState<boolean>(false);

  useEffect(() => {
    StorageService.initialize();
  }, []);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleStartSession = (task?: DailyTask, type: SessionType = 'new_memorization') => {
    setSessionTask(task || null);
    setSessionType(type);
    setIsSessionModalOpen(true);
  };

  const handleStartCustomReview = (surah: number, startAyah: number, endAyah: number) => {
    const dummyTask: DailyTask = {
      id: `rev_custom_${Date.now()}`,
      planId: '',
      goalId: '',
      userId: StorageService.getUser().id,
      taskType: 'review',
      scheduledDate: new Date().toISOString().split('T')[0],
      startSurah: surah,
      startAyah,
      endSurah: surah,
      endAyah,
      ayahCount: endAyah - startAyah + 1,
      estimatedMinutes: Math.round((endAyah - startAyah + 1) * 0.5),
      status: 'scheduled',
      completionPercentage: 0,
      completedAyahsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    handleStartSession(dummyTask, 'review');
  };

  const handleOpenProposal = (proposalId: string) => {
    const found = StorageService.getProposals().find((p) => p.id === proposalId);
    if (found) {
      setActiveProposal(found);
      setIsProposalModalOpen(true);
    }
  };

  return (
    <div key={refreshKey} className="min-h-screen bg-[#F8F9FA] flex flex-col selection:bg-[#083827]/20 selection:text-[#083827]">
      {/* Top Bar Contract (Strict 3 Zones separated by gap-8) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single element Brand Wordmark with official logo */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer shrink-0"
          >
            <KhitamLogo size={36} showText={true} />
          </div>

          {/* Zone 2: Navigation Links (Single-line, unboxed, quiet typography) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-[#083827] font-bold border-b-2 border-[#083827]'
                  : 'hover:text-slate-900'
              }`}
            >
              لوحة التحكم
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'plan'
                  ? 'text-[#083827] font-bold border-b-2 border-[#083827]'
                  : 'hover:text-slate-900'
              }`}
            >
              خطتي والمهام
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'matrix'
                  ? 'text-[#083827] font-bold border-b-2 border-[#083827]'
                  : 'hover:text-slate-900'
              }`}
            >
              المحفوظ والمصحف
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'reviews'
                  ? 'text-[#083827] font-bold border-b-2 border-[#083827]'
                  : 'hover:text-slate-900'
              }`}
            >
              المراجعة التكيفية
            </button>
            <button
              onClick={() => setActiveTab('mastery')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'mastery'
                  ? 'text-[#083827] font-bold border-b-2 border-[#083827]'
                  : 'hover:text-slate-900'
              }`}
            >
              الثبات والإتقان
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'history'
                  ? 'text-[#083827] font-bold border-b-2 border-[#083827]'
                  : 'hover:text-slate-900'
              }`}
            >
              السجل
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'analytics'
                  ? 'text-[#083827] font-bold border-b-2 border-[#083827]'
                  : 'hover:text-slate-900'
              }`}
            >
              الإحصائيات
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + Utility Icons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleStartSession(undefined, 'new_memorization')}
              className="px-4 py-2 text-xs font-bold text-white bg-[#083827] hover:bg-[#062c20] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>جلسة تسميع</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ${
                activeTab === 'settings' ? 'bg-slate-100 text-[#083827]' : ''
              }`}
              title="الإعدادات"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onStartSession={handleStartSession}
            onOpenGoalWizard={() => setIsGoalWizardOpen(true)}
            onNavigateToPlan={() => setActiveTab('plan')}
            onNavigateToReviews={() => setActiveTab('reviews')}
            onNavigateToMatrix={() => setActiveTab('matrix')}
          />
        )}

        {activeTab === 'plan' && (
          <MyPlanView
            onStartSession={handleStartSession}
            onOpenProposal={handleOpenProposal}
            onOpenGoalWizard={() => setIsGoalWizardOpen(true)}
          />
        )}

        {activeTab === 'matrix' && <MemorizationMatrixView />}

        {activeTab === 'reviews' && (
          <ReviewsHubView onStartReviewSession={handleStartCustomReview} />
        )}

        {activeTab === 'mastery' && <MasteryView />}

        {activeTab === 'history' && <HistoryView />}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'settings' && (
          <SettingsView
            onOpenVerifier={() => setIsVerifierOpen(true)}
            onDataReset={triggerRefresh}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation (Responsive thumb-friendly, <= 15% height) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around text-[10px] text-slate-500">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1 ${
            activeTab === 'dashboard' ? 'text-[#083827] font-bold' : ''
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`flex flex-col items-center gap-0.5 p-1 ${
            activeTab === 'plan' ? 'text-[#083827] font-bold' : ''
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>الخطة</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex flex-col items-center gap-0.5 p-1 ${
            activeTab === 'matrix' ? 'text-[#083827] font-bold' : ''
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>المصحف</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex flex-col items-center gap-0.5 p-1 ${
            activeTab === 'reviews' ? 'text-[#083827] font-bold' : ''
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>المراجعة</span>
        </button>

        <button
          onClick={() => setActiveTab('mastery')}
          className={`flex flex-col items-center gap-0.5 p-1 ${
            activeTab === 'mastery' ? 'text-[#083827] font-bold' : ''
          }`}
        >
          <Award className="w-4 h-4" />
          <span>الإتقان</span>
        </button>
      </nav>

      {/* Modals */}
      <StudySessionModal
        isOpen={isSessionModalOpen}
        task={sessionTask}
        initialType={sessionType}
        onClose={() => setIsSessionModalOpen(false)}
        onSessionCompleted={triggerRefresh}
      />

      <NewGoalWizardModal
        isOpen={isGoalWizardOpen}
        onClose={() => setIsGoalWizardOpen(false)}
        onGoalCreated={() => {
          triggerRefresh();
          setActiveTab('dashboard');
        }}
      />

      {activeProposal && (
        <PlanChangeProposalModal
          isOpen={isProposalModalOpen}
          proposal={activeProposal}
          onClose={() => {
            setIsProposalModalOpen(false);
            setActiveProposal(null);
          }}
          onDecisionMade={triggerRefresh}
        />
      )}

      <QuranVerificationModal
        isOpen={isVerifierOpen}
        onClose={() => setIsVerifierOpen(false)}
      />
    </div>
  );
}
