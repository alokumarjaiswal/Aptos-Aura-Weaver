import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import Header from '../components/Header';
import pxArtImage from '../pxArt.png';
import { isPetraWalletInstalled, redirectToPetraInstall } from '../utils/validation';
import { prefetchOnHover } from '../utils/preloader';

const LandingPage: React.FC = () => {
  const { connect } = useWallet();

  const handleConnect = async () => {
    // Check if Petra wallet is installed first
    if (!isPetraWalletInstalled()) {
      alert('Petra wallet not detected. Redirecting to installation page...');
      redirectToPetraInstall();
      return;
    }

    try {
      await connect('Petra');
      // Navigation will be handled by wallet state change in App.tsx
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      const errorMsg = error?.message || error?.toString() || '';
      
      if (errorMsg.includes('No provider') || errorMsg.includes('not found')) {
        alert('Petra wallet not found. Please install Petra wallet extension.');
        redirectToPetraInstall();
      } else if (errorMsg.includes('rejected') || errorMsg.includes('denied') || errorMsg.includes('cancelled')) {
        alert('Connection cancelled. Please try again and approve the connection.');
      } else if (errorMsg.includes('locked') || errorMsg.includes('unlock')) {
        alert('Petra wallet is locked. Please unlock your wallet and try again.');
      } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
        alert('Network error. Please check your internet connection and try again.');
      } else if (errorMsg.includes('timeout') || errorMsg.includes('TIMEOUT')) {
        alert('Connection timed out. Please try again.');
      } else {
        alert(`Failed to connect wallet: ${errorMsg}. Please make sure Petra wallet is unlocked and try again.`);
      }
    }
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <Header />

        <main className="main-content">
          <div className="landing-section">
            <div className="pixel-art-container">
              <img src={pxArtImage} alt="Pixel Art Character" className="pixel-art-image" draggable="false" />
            </div>

            <div className="landing-content">
              <button
                onClick={handleConnect}
                onMouseEnter={() => prefetchOnHover('wallet')}
                className="btn btn-primary btn-connect-wallet"
              >
                <svg width="20" height="19" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="petra-svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M0 19.4667C0 8.94232 8.53168 0.410645 19.056 0.410645C33.0023 0.410645 39.6271 17.5875 29.2927 26.9522L24.4311 31.3576L15.654 23.3559L27.2291 12.2877H11.8771V32.1818H0V19.4667Z" fill="currentColor"/>
                </svg>
                Connect Petra Wallet
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;