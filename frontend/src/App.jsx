import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { AlertDialog } from './components/common/AlertDialog';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { ConfigModal } from './components/modals/ConfigModal';
import { ScannerModal } from './components/modals/ScannerModal';
import { OcrDetailModal } from './components/modals/OcrDetailModal';
import { AttendanceSyncLoader } from './components/modals/AttendanceSyncLoader';
import { LoginView } from './views/Login/LoginView';
import { CountingView } from './views/Counting/CountingView';
import { CoordinatorView } from './views/Coordinator/CoordinatorView';

export const App = () => {
  const { currentView } = useApp();

  return (
    <div className="app-container">
      {/* BACKGROUND PARTICLES / GLOW ACCENTS */}
      <div className="bg-glow glow-1"></div>
      <div className="bg-glow glow-2"></div>

      {/* HEADER */}
      <Header />

      {/* MAIN VIEWPORT */}
      <main className="main-content">
        {currentView === 'view-login' && <LoginView />}
        {currentView === 'view-counting' && <CountingView />}
        {currentView === 'view-coordinator' && <CoordinatorView />}
      </main>

      {/* MODALS & OVERLAYS */}
      <ConfigModal />
      <ScannerModal />
      <OcrDetailModal />
      <AlertDialog />
      <WelcomeModal />
      <AttendanceSyncLoader />
      <LoadingOverlay />
      <ToastContainer />
    </div>
  );
};
