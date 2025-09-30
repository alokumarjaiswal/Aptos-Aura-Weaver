import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletProvider } from './WalletProvider';
import { AppProvider } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import { LazyWalletPage, LazyAuraPage } from './components/LazyLoader';
import LandingPage from './components/LandingPage'; // Keep landing page eager for fast initial load
import { preloadCriticalResources } from './utils/preloader';
import './App.css';

// Get the base name from package.json homepage for GitHub Pages
const getBasename = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/Aptos-Aura-Weaver';
  }
  return '';
};

// Component to handle navigation based on wallet state
const AppRoutes: React.FC = () => {
  const { connected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (connected) {
      // If wallet is connected and we're on landing page, navigate to wallet page
      if (window.location.pathname === getBasename() + '/' || window.location.pathname === getBasename()) {
        navigate('/wallet');
      }
    } else {
      // If wallet is disconnected and we're not on landing page, navigate to landing
      if (window.location.pathname !== getBasename() + '/' && window.location.pathname !== getBasename()) {
        navigate('/');
      }
    }
  }, [connected, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/wallet"
        element={connected ? <LazyWalletPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/aura"
        element={connected ? <LazyAuraPage /> : <Navigate to="/" replace />}
      />
      {/* Catch all route - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  // Initialize performance optimizations
  useEffect(() => {
    preloadCriticalResources();
  }, []);

  return (
    <ErrorBoundary>
      <WalletProvider>
        <AppProvider>
          <Router basename={getBasename()}>
            <AppRoutes />
          </Router>
        </AppProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
}

export default App;
