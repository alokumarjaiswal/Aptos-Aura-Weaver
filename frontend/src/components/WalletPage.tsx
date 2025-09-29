import React, { useState, useEffect, useCallback } from 'react';
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
  const [autoFetched, setAutoFetched] = useState(false);

  const checkNetworkCompatibility = async (): Promise<boolean> => {
    try {
      const expectedNetwork = (process.env.REACT_APP_APTOS_NETWORK as string) || 'devnet';
      
      // Check if wallet network matches expected network
      if ((window as any).aptos?.network) {
        const walletNetwork = await (window as any).aptos.network();
        const actualNetwork = walletNetwork?.name || walletNetwork;
        
        if (actualNetwork && !actualNetwork.toLowerCase().includes(expectedNetwork.toLowerCase())) {
          alert(`Network Warning: Please switch your wallet to ${expectedNetwork.toUpperCase()} network. Currently connected to: ${actualNetwork}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.warn('Network compatibility check failed:', error);
      return true; // Continue if check fails
    }
  };

  const fetchUserData = useCallback(async () => {
    if (!account?.address) return;

    // Check network compatibility before fetching data
    const networkOk = await checkNetworkCompatibility();
    if (!networkOk) {
      return; // Stop if network mismatch
    }

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
      
      const errorMsg = error?.message || error?.toString() || '';

      if (errorMsg.includes('not found') || errorMsg.includes('Invalid response')) {
        setTransactionCount(0);
        alert('Account not found on Aptos network. This is normal for new accounts. Using transaction count: 0');
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || !navigator.onLine) {
        alert('Network error. Please check your internet connection and try again.');
      } else if (errorMsg.includes('timeout') || errorMsg.includes('TIMEOUT')) {
        alert('Request timed out. The network may be slow. Please try again.');
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        alert('Too many requests. Please wait a moment and try again.');
      } else if (errorMsg.includes('CORS') || errorMsg.includes('cors')) {
        alert('Connection blocked by browser security. Please try refreshing the page.');
      } else if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
        alert('Authorization error. Please reconnect your wallet.');
      } else {
        alert(`Unable to fetch account data: ${errorMsg}. Using demo values for now.`);
        setTransactionCount(Math.floor(Math.random() * 50) + 5);
      }
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [account, setTransactionCount, setLoading]);

  // Auto-fetch transaction data when wallet is connected
  useEffect(() => {
    if (account?.address && !autoFetched && state.transactionCount === 0 && !localLoading) {
      console.log('Auto-fetching transaction data for connected wallet...');
      setAutoFetched(true);
      fetchUserData();
    }
  }, [account?.address, autoFetched, state.transactionCount, localLoading, fetchUserData]);

  // Reset auto-fetch state when wallet disconnects
  useEffect(() => {
    if (!account?.address) {
      setAutoFetched(false);
    }
  }, [account?.address]);

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
                    onFocus={(e) => e.target.select()}
                    placeholder=""
                    className="mood-input"
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                </div>
                
                <div className="data-fetch-section">
                  <button
                    onClick={() => {
                      setAutoFetched(false);
                      fetchUserData();
                    }}
                    disabled={localLoading}
                    className="sync-btn"
                    title="Refresh transaction data"
                  >
                    <svg className={`sync-icon ${localLoading ? 'rotating' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23,4 23,10 17,10"></polyline>
                      <polyline points="1,20 1,14 7,14"></polyline>
                      <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4l-4.64,4.36A9,9,0,0,1,3.51,15"></path>
                    </svg>
                  </button>
                  <span className="tx-count">Tx: {state.transactionCount}</span>
                </div>
              </div>
              
              <div className="generate-section">
                <button
                  onClick={handleContinue}
                  disabled={!state.moodSeed.trim() || state.transactionCount < 0}
                  className="btn btn-primary btn-connect-wallet"
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