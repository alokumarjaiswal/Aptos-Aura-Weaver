import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import Header from '../components/Header';
import { useAppContext } from '../contexts/AppContext';

const WalletPage: React.FC = () => {
  const { account, disconnect } = useWallet();
  const navigate = useNavigate();
  const { state, setMoodSeed, setTransactionCount, setLoading } = useAppContext();
  const [localLoading, setLocalLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchUserData = async () => {
    if (!account?.address) return;

    setLocalLoading(true);
    setLoading(true);

    try {
      // Import Aptos SDK dynamically
      const { Aptos, AptosConfig, Network } = await import('@aptos-labs/ts-sdk');

      const network = (process.env.REACT_APP_APTOS_NETWORK as any) || Network.DEVNET;
      const nodeUrl = process.env.REACT_APP_APTOS_NODE_URL || undefined;

      const aptosConfig = new AptosConfig({
        network,
        fullnode: nodeUrl
      });
      const aptos = new Aptos(aptosConfig);

      const addressString = account.address.toString();
      const accountData = await aptos.getAccountInfo({ accountAddress: addressString });

      if (!accountData || typeof accountData.sequence_number === 'undefined') {
        throw new Error('Invalid response from Aptos node');
      }

      const txCount = parseInt(accountData.sequence_number);
      setTransactionCount(txCount);

      console.log(`Data fetched: Found ${txCount} transactions`);

      if (txCount === 0) {
        alert('Your account has no transactions yet. You can still create an aura!');
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);

      if (error?.message?.includes('not found') || error?.message?.includes('Invalid response')) {
        setTransactionCount(0);
        alert('Account not found on Aptos network. Using default values for demo.');
      } else if (error?.message?.includes('network') || !navigator.onLine) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('Unable to fetch account data. Using demo values.');
        setTransactionCount(Math.floor(Math.random() * 50) + 5);
      }
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (state.moodSeed.trim()) {
      navigate('/aura');
    } else {
      alert('Please enter a mood seed to continue.');
    }
  };

  const handleCopyAddress = async () => {
    if (account?.address) {
      try {
        await navigator.clipboard.writeText(account.address.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <Header />
        
        <main className="main-content">
          <div className="wallet-section">
            <div className="wallet-main">
              <div className="wallet-header-info">
                <div className="wallet-address-display">
                  <span 
                    className={`address-value ${copied ? 'copied' : ''}`} 
                    onClick={handleCopyAddress}
                    style={{ cursor: 'pointer' }}
                  >
                    {account?.address?.toString()}
                    <svg className="copy-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <svg className={`checkmark-icon ${copied ? 'visible' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="disconnect-btn"
                  title="Disconnect Wallet"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div className="mood-input-section">
                <div className="mood-input-container">
                  <label className="mood-label">Your Mood Seed</label>
                  <input
                    type="text"
                    value={state.moodSeed}
                    onChange={(e) => setMoodSeed(e.target.value)}
                    placeholder="Describe your current mood..."
                    className="mood-input"
                  />
                </div>
                
                <div className="data-fetch-section">
                  <button
                    onClick={fetchUserData}
                    disabled={localLoading}
                    className="fetch-btn"
                  >
                    <svg className={localLoading ? 'rotating' : ''} width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4V8H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 20V16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 20L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 4L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="fetch-text">Sync Data</span>
                    <span className="tx-count">Tx: {state.transactionCount}</span>
                  </button>
                </div>
              </div>
              
              <div className="generate-section">
                <button
                  onClick={handleContinue}
                  disabled={!state.moodSeed.trim() || state.transactionCount < 0}
                  className="generate-btn"
                >
                  <span className="generate-text">Generate My Aura</span>
                  <div className="generate-glow"></div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WalletPage;