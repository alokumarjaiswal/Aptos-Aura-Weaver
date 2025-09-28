import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import Header from '../components/Header';
import pxArtImage from '../pxArt.png';
import { isPetraWalletInstalled, redirectToPetraInstall } from '../utils/validation';

const LandingPage: React.FC = () => {
  const { connect } = useWallet();

  const handleConnect = async () => {
    // Check if Petra wallet is installed first
    if (!isPetraWalletInstalled()) {
      redirectToPetraInstall();
      return;
    }

    try {
      await connect('Petra');
      // Navigation will be handled by wallet state change in App.tsx
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      // Check if the error might be due to Petra not being installed
      if (error?.message?.includes('No provider') || error?.message?.includes('not found')) {
        redirectToPetraInstall();
      } else {
        alert('Failed to connect wallet. Please make sure Petra wallet is unlocked and try again.');
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