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

  return (
    <div className="app-container">
      <div className="app-content">
        <Header />

        <main className="main-content">
          <div className="wallet-section">
            <div className="wallet-grid">
              {/* Top row: Wallet info and data fetching */}
              <div className="wallet-info-card compact">
                <div className="wallet-address selectable compact">
                  <strong>Address:</strong> {account?.address?.toString()}
                </div>
                <button
                  onClick={disconnect}
                  className="btn btn-danger compact"
                >
                  Disconnect
                </button>
              </div>

              <div className="data-section compact">
                <div className="fetch-data-row compact">
                  <button
                    onClick={fetchUserData}
                    disabled={localLoading}
                    className={`circular-refresh-btn ${localLoading ? 'loading' : ''}`}
                    title="Fetch Account Data"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 33 32" fill="none" className={localLoading ? 'rotating' : ''}>
                      <path d="M29.8002 12.19H28.2802V19.81H29.8002V12.19Z" fill="currentColor"/>
                      <path d="M28.2801 19.81H26.7601V22.86H28.2801V19.81Z" fill="currentColor"/>
                      <path d="M28.2801 9.14H26.7601V12.19H28.2801V9.14Z" fill="currentColor"/>
                      <path d="M28.2802 7.62V6.1H29.8002V4.57H22.1802V12.19H23.7102V10.67H25.2302V9.14H26.7602V7.62H28.2802Z" fill="currentColor"/>
                      <path d="M26.7601 22.86H25.2301V24.38H26.7601V22.86Z" fill="currentColor"/>
                      <path d="M25.2302 24.38H23.7102V25.91H25.2302V24.38Z" fill="currentColor"/>
                      <path d="M23.7102 25.91H20.6602V27.43H23.7102V25.91Z" fill="currentColor"/>
                      <path d="M20.6602 27.43H14.5602V28.95H20.6602V27.43Z" fill="currentColor"/>
                      <path d="M19.1402 3.05H13.0402V4.57H19.1402V3.05Z" fill="currentColor"/>
                      <path d="M13.0401 4.57H9.99011V6.1H13.0401V4.57Z" fill="currentColor"/>
                      <path d="M9.99009 6.10001H8.47009V7.62001H9.99009V6.10001Z" fill="currentColor"/>
                      <path d="M8.4702 7.62H6.9502V9.14H8.4702V7.62Z" fill="currentColor"/>
                      <path d="M5.42015 24.38V25.91H3.90015V27.43H11.5201V19.81H9.99015V21.33H8.47015V22.86H6.95015V24.38H5.42015Z" fill="currentColor"/>
                      <path d="M6.95017 19.81H5.42017V22.86H6.95017V19.81Z" fill="currentColor"/>
                      <path d="M6.95017 9.14H5.42017V12.19H6.95017V9.14Z" fill="currentColor"/>
                      <path d="M5.42015 12.19H3.90015V19.81H5.42015V12.19Z" fill="currentColor"/>
                    </svg>
                  </button>

                  <div className={`status-indicator compact ${state.transactionCount > 0 ? 'status-success' : ''}`}>
                    <strong>Tx Count:</strong> {state.transactionCount}
                    {state.transactionCount > 0 && <span>✓</span>}
                  </div>
                </div>
              </div>

              {/* Bottom row: Mood input spanning full width */}
              <div className="mood-section full-width">
                <div className="input-group compact">
                  <label className="input-label compact">
                    Mood Seed
                  </label>
                  <input
                    type="text"
                    value={state.moodSeed}
                    onChange={(e) => setMoodSeed(e.target.value)}
                    placeholder="Enter your mood (e.g., 'happy 😊', 'calm 🌊', 'energetic ⚡')"
                    className="form-input compact"
                  />
                </div>

                <div className="continue-section">
                  <button
                    onClick={handleContinue}
                    disabled={!state.moodSeed.trim() || state.transactionCount < 0}
                    className="btn btn-primary btn-connect-wallet"
                  >
                    Generate My Aura
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WalletPage;