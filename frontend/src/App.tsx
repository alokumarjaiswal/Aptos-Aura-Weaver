import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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

// SEO Helper: Update page titles dynamically
const updatePageTitle = (pathname: string) => {
  const basename = getBasename();
  const route = pathname.replace(basename, '') || '/';
  
  const titles: Record<string, string> = {
    '/': 'Aptos Aura Weaver - Generate Personalized NFTs from Blockchain Activity | Web3 Art Generator',
    '/wallet': 'Connect Wallet - Aptos Aura Weaver | Petra Wallet Integration for NFT Generation',
    '/aura': 'Generate Your Aura - Create Unique NFT Art | Aptos Aura Weaver Generative Engine'
  };

  const metaDescriptions: Record<string, string> = {
    '/': 'Transform your Aptos blockchain activity into unique generative art NFTs. Connect wallet, create personalized auras, and mint on-chain. Free Web3 NFT generator with rarity scoring.',
    '/wallet': 'Connect your Petra wallet to Aptos Aura Weaver and start creating personalized NFT art based on your blockchain transaction history.',
    '/aura': 'Generate your unique aura visualization using advanced p5.js algorithms. Mint your personalized generative art as an NFT on the Aptos blockchain.'
  };

  // Update title
  document.title = titles[route] || titles['/'];
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', metaDescriptions[route] || metaDescriptions['/']);
  }
  
  // Update Open Graph title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', titles[route] || titles['/']);
  }
  
  // Update Open Graph description
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', metaDescriptions[route] || metaDescriptions['/']);
  }
};

// Component to handle navigation based on wallet state
const AppRoutes: React.FC = () => {
  const { connected } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  // Update SEO meta tags when route changes
  useEffect(() => {
    updatePageTitle(location.pathname);
  }, [location.pathname]);

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
