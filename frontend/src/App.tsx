import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletProvider } from './WalletProvider';
import { AppProvider } from './contexts/AppContext';
import LandingPage from './components/LandingPage';
import WalletPage from './components/WalletPage';
import AuraPage from './components/AuraPage';
import './App.css';

// Component to handle navigation based on wallet state
const AppRoutes: React.FC = () => {
  const { connected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (connected) {
      // If wallet is connected and we're on landing page, navigate to wallet page
      if (window.location.pathname === '/') {
        navigate('/wallet');
      }
    } else {
      // If wallet is disconnected and we're not on landing page, navigate to landing
      if (window.location.pathname !== '/') {
        navigate('/');
      }
    }
  }, [connected, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/wallet"
        element={connected ? <WalletPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/aura"
        element={connected ? <AuraPage /> : <Navigate to="/" replace />}
      />
      {/* Catch all route - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <WalletProvider>
      <AppProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AppProvider>
    </WalletProvider>
  );
}

export default App;
