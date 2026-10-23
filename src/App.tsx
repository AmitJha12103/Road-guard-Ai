import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportWizard } from './pages/ReportWizard';
import { LiveMapPage } from './pages/LiveMapPage';
import { AuthorityCommandCenter } from './pages/AuthorityCommandCenter';
import { MaintenanceWorkspace } from './pages/MaintenanceWorkspace';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { Intro3DScanner } from './components/Intro3DScanner';
import { RoleLoginModal } from './components/RoleLoginModal';
import { MapApiKeyModal } from './components/MapApiKeyModal';
import { CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    toastMessage,
    hasSeenIntro,
    setHasSeenIntro,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isMapKeyModalOpen,
    setIsMapKeyModalOpen,
  } = useApp();

  const handleIntroComplete = () => {
    setHasSeenIntro(true);
    // As the 3D animation ends and faded transition completes, open the Login Role Selection popup
    setTimeout(() => {
      setIsLoginModalOpen(true);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* 3D Road Defect Scanner Intro Animation */}
      {!hasSeenIntro && <Intro3DScanner onComplete={handleIntroComplete} />}

      {/* Main App Container with Faded Transition */}
      <div
        className={`flex-1 flex flex-col transition-opacity duration-1000 ${
          hasSeenIntro ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Navbar />

        <main className="flex-1 w-full">
          {activeTab === 'landing' && <LandingPage />}
          {activeTab === 'citizen' && <CitizenDashboard />}
          {activeTab === 'report' && <ReportWizard />}
          {activeTab === 'map' && <LiveMapPage />}
          {activeTab === 'command' && <AuthorityCommandCenter />}
          {activeTab === 'maintenance' && <MaintenanceWorkspace />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'issue_detail' && <IssueDetailPage />}
        </main>
      </div>

      {/* Role Selection & Login Modal */}
      <RoleLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Map Tile & API Key Modal */}
      <MapApiKeyModal
        isOpen={isMapKeyModalOpen}
        onClose={() => setIsMapKeyModalOpen(false)}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[80] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#0b1120] border border-cyan-500/50 text-white text-xs shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
