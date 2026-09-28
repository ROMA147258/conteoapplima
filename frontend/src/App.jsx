import React, { Suspense, lazy } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { AlertDialog } from './components/common/AlertDialog';

// 🚀 Lazy Loading de Vistas Principales (Code Splitting)
const LoginView = lazy(() =>
  import('./views/Login/LoginView').then(m => ({ default: m.LoginView || m.default }))
);
const CountingView = lazy(() =>
  import('./views/Counting/CountingView').then(m => ({ default: m.CountingView || m.default }))
);
const CoordinatorView = lazy(() =>
  import('./views/Coordinator/CoordinatorView').then(m => ({ default: m.CoordinatorView || m.default }))
);

// 🚀 Lazy Loading de Modales Pesados (Se descargan solo cuando se necesitan)
const ScannerModal = lazy(() =>
  import('./components/modals/ScannerModal').then(m => ({ default: m.ScannerModal || m.default }))
);
const OcrDetailModal = lazy(() =>
  import('./components/modals/OcrDetailModal').then(m => ({ default: m.OcrDetailModal || m.default }))
);
const WelcomeModal = lazy(() =>
  import('./components/modals/WelcomeModal').then(m => ({ default: m.WelcomeModal || m.default }))
);
const AttendanceSyncLoader = lazy(() =>
  import('./components/modals/AttendanceSyncLoader').then(m => ({ default: m.AttendanceSyncLoader || m.default }))
);

// Fallback de carga elegante y accesible (WCAG)
const ViewLoadingFallback = () => (
  <div
    style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      color: '#334155'
    }}
    role="status"
    aria-live="polite"
  >
    <div
      style={{
        width: '44px',
        height: '44px',
        border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb',
        borderRadius: '50%',
        animation: 'spinLoader 0.8s linear infinite'
      }}
    />
    <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
      Cargando interfaz del sistema...
    </span>
  </div>
);

export const App = () => {
  const { currentView } = useApp();

  return (
    <div className="app-container">
      {/* BACKGROUND PARTICLES / GLOW ACCENTS */}
      <div className="bg-glow glow-1"></div>
      <div className="bg-glow glow-2"></div>

      {/* HEADER */}
      <Header />

      {/* MAIN VIEWPORT CON LAZY LOADING & SUSPENSE */}
      <main className="main-content" id="main-content">
        <Suspense fallback={<ViewLoadingFallback />}>
          {currentView === 'view-login' && <LoginView />}
          {currentView === 'view-counting' && <CountingView />}
          {currentView === 'view-coordinator' && <CoordinatorView />}
        </Suspense>
      </main>

      {/* MODALS & OVERLAYS CON SUSPENSE */}
      <Suspense fallback={null}>
        <ScannerModal />
        <OcrDetailModal />
        <WelcomeModal />
        <AttendanceSyncLoader />
      </Suspense>

      {/* COMPONENTES GLOBALES DIRECTOS */}
      <AlertDialog />
      <LoadingOverlay />
      <ToastContainer />
    </div>
  );
};

export default App;
