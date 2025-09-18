import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { WalletProvider } from './WalletProvider';
import { AuraGenerator } from './AuraGenerator';
import './App.css';

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

/**
 * Interface for error state management
 */
interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: number;
}

/**
 * Interface for success state management
 */
interface SuccessState {
  message: string;
  timestamp: number;
}

function AuraMinterApp() {
  const { account, connected, connect, disconnect } = useWallet();
  const [moodSeed, setMoodSeed] = useState('');
  const [transactionCount, setTransactionCount] = useState(0);
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  /**
   * Clear error and success messages after a timeout
   */
  const clearMessages = () => {
    setTimeout(() => setError(null), 5000);
    setTimeout(() => setSuccess(null), 3000);
  };

  /**
   * Show error message with type and auto-clear
   */
  const showError = (message: string, type: ErrorState['type'] = 'error') => {
    setError({ message, type, timestamp: Date.now() });
    clearMessages();
  };

  /**
   * Show success message with auto-clear
   */
  const showSuccess = (message: string) => {
    setSuccess({ message, timestamp: Date.now() });
    clearMessages();
  };

  /**
   * Validate mood seed input
   */
  const validateMoodSeed = (seed: string): boolean => {
    if (!seed.trim()) {
      showError('Please enter a mood seed to generate your aura', 'warning');
      return false;
    }
    if (seed.length < 2) {
      showError('Mood seed should be at least 2 characters long', 'warning');
      return false;
    }
    if (seed.length > 50) {
      showError('Mood seed should be less than 50 characters', 'warning');
      return false;
    }
    return true;
  };

  /**
   * Fetch user account data with enhanced error handling
   */
  const fetchUserData = async () => {
    if (!account?.address) {
      showError('No wallet connected. Please connect your wallet first.', 'warning');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const addressString = account.address.toString();
      const accountData = await aptos.getAccountInfo({ accountAddress: addressString });
      const txCount = parseInt(accountData.sequence_number);
      
      setTransactionCount(txCount);
      showSuccess(`Successfully fetched account data! Found ${txCount} transactions.`);
      
      if (txCount === 0) {
        showError('Your account has no transactions yet. You can still create an aura!', 'info');
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      
      // Provide specific error messages based on error type
      if (error?.message?.includes('not found')) {
        setTransactionCount(0);
        showError('Account not found on Aptos devnet. Using default values for demo.', 'info');
      } else if (error?.message?.includes('network')) {
        showError('Network error. Please check your connection and try again.', 'error');
      } else {
        showError('Unable to fetch account data. Using demo values.', 'warning');
        setTransactionCount(Math.floor(Math.random() * 50) + 5); // Random demo value
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle wallet connection with error handling
   */
  const handleConnect = async () => {
    try {
      setError(null);
      await connect('Petra');
      showSuccess('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      if (error?.message?.includes('User rejected')) {
        showError('Wallet connection was cancelled by user.', 'warning');
      } else if (error?.message?.includes('not installed')) {
        showError('Petra wallet is not installed. Please install it first.', 'error');
      } else {
        showError('Failed to connect wallet. Please try again.', 'error');
      }
    }
  };

  /**
   * Enhanced NFT minting with comprehensive validation and error handling
   */
  const mintNFT = async () => {
    // Validation checks
    if (!account?.address) {
      showError('No wallet connected. Please connect your wallet first.', 'warning');
      return;
    }

    if (!validateMoodSeed(moodSeed)) {
      return; // Error already shown by validateMoodSeed
    }

    if (!imageData) {
      showError('No aura generated yet. Please wait for the aura to be created.', 'warning');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokenName = `Aura-${moodSeed.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
      const description = `Personal aura NFT generated from ${transactionCount} transactions with mood "${moodSeed}"`;
      const uri = "https://placeholder-uri.com"; // TODO: Replace with IPFS URI
      
      const payload = {
        function: "0xCAFE::aura_nft::mint_aura",
        functionArguments: [moodSeed, transactionCount, tokenName, uri],
        type_arguments: [],
      };

      console.log('🎨 Minting NFT with payload:', payload);
      
      // Simulate minting process (in real implementation, this would call the smart contract)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      showSuccess(`🎉 NFT "${tokenName}" minted successfully! Check your wallet for the new token.`);
      
      // Log detailed information for development
      console.log('✅ NFT Minting Details:', {
        tokenName,
        description,
        moodSeed,
        transactionCount,
        walletAddress: account.address.toString(),
        imageDataSize: imageData.length,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Error minting NFT:', error);
      
      if (error?.message?.includes('insufficient funds')) {
        showError('Insufficient funds to mint NFT. Please ensure you have enough APT tokens.', 'error');
      } else if (error?.message?.includes('network')) {
        showError('Network error during minting. Please check your connection and try again.', 'error');
      } else if (error?.message?.includes('rejected')) {
        showError('Transaction was rejected. Please try again.', 'warning');
      } else {
        showError('Failed to mint NFT. Please try again later.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate shareable text for social media
   */
  const generateShareText = (): string => {
    const rarity = transactionCount > 1000 ? 'Legendary' : 
                  transactionCount > 100 ? 'Epic' : 
                  transactionCount > 50 ? 'Rare' : 'Common';
    
    return `🌟 Just created my personalized Aura NFT on @Aptos! 
    
✨ Mood: "${moodSeed}"
🔗 ${transactionCount} transactions analyzed  
🎨 Rarity: ${rarity}

#AptosAura #NFT #Web3 #PersonalizedNFT`;
  };

  /**
   * Share on Twitter/X
   */
  const shareOnTwitter = () => {
    const text = encodeURIComponent(generateShareText());
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  /**
   * Copy share text to clipboard
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      showSuccess('Share text copied to clipboard!');
    } catch (error) {
      showError('Failed to copy to clipboard', 'warning');
    }
  };

  /**
   * Download aura as image
   */
  const downloadAura = () => {
    if (!imageData) {
      showError('No aura image available to download', 'warning');
      return;
    }

    try {
      const link = document.createElement('a');
      link.download = `aura-${moodSeed.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}.png`;
      link.href = imageData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess('Aura image downloaded successfully!');
    } catch (error) {
      showError('Failed to download image', 'error');
    }
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <header className="app-header">
          <h1 className="app-title">Aptos Aura Weaver</h1>
          <p className="app-subtitle">Generate your personalized aura NFT based on your on-chain activity</p>
        </header>
        
        <main className="main-content">
          {/* Error and Success Notifications */}
          {error && (
            <div className={`notification notification-${error.type}`}>
              <div className="notification-content">
                <span className="notification-icon">
                  {error.type === 'error' ? '❌' : error.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <span className="notification-message">{error.message}</span>
                <button 
                  className="notification-close"
                  onClick={() => setError(null)}
                  aria-label="Close notification"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          {success && (
            <div className="notification notification-success">
              <div className="notification-content">
                <span className="notification-icon">✅</span>
                <span className="notification-message">{success.message}</span>
                <button 
                  className="notification-close"
                  onClick={() => setSuccess(null)}
                  aria-label="Close notification"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {!connected ? (
            <div className="wallet-connect-section">
              <h3 className="wallet-connect-title">Connect Your Wallet</h3>
              <p className="wallet-connect-description">Connect your Petra wallet to get started</p>
              <button 
                onClick={handleConnect}
                className="btn btn-primary"
              >
                <svg width="20" height="19" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M0 19.4667C0 8.94232 8.53168 0.410645 19.056 0.410645C33.0023 0.410645 39.6271 17.5875 29.2927 26.9522L24.4311 31.3576L15.654 23.3559L27.2291 12.2877H11.8771V32.1818H0V19.4667Z" fill="currentColor"/>
                </svg>
                Connect Petra Wallet
              </button>
            </div>
          ) : (
            <div>
              <div className="wallet-info">
                <div className="wallet-address">
                  <strong>Connected:</strong> {account?.address?.toString()}
                </div>
                <button 
                  onClick={disconnect}
                  className="btn btn-danger"
                >
                  Disconnect
                </button>
              </div>

              <div className="section">
                <div className="fetch-data-row">
                  <button 
                    onClick={fetchUserData} 
                    disabled={loading}
                    className={`btn ${loading ? '' : 'btn-success'}`}
                  >
                    {loading && <span className="loading-spinner"></span>}
                    {loading ? 'Loading...' : 'Fetch Account Data'}
                  </button>
                  
                  <div className={`status-indicator ${transactionCount > 0 ? 'status-success' : ''}`}>
                    <strong>Transaction Count:</strong> {transactionCount}
                    {transactionCount > 0 && <span>✓</span>}
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  Mood Seed
                </label>
                <input
                  type="text"
                  value={moodSeed}
                  onChange={(e) => setMoodSeed(e.target.value)}
                  placeholder="Enter your mood (e.g., 'happy 😊', 'calm 🌊', 'energetic ⚡')"
                  className="form-input"
                />
              </div>

              {moodSeed && transactionCount >= 0 && (
                <div className="aura-section">
                  <h3 className="aura-title">Your Personal Aura</h3>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <AuraGenerator
                      moodSeed={moodSeed}
                      transactionCount={transactionCount}
                      onImageGenerated={setImageData}
                    />
                  </div>
                  
                  {imageData && (
                    <div>
                      <p className="aura-description">
                        Your unique aura generated from <strong>{transactionCount}</strong> transactions and mood <strong>"{moodSeed}"</strong>
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="action-buttons">
                        <button 
                          onClick={mintNFT} 
                          disabled={loading}
                          className={`btn btn-mint ${loading ? 'loading' : ''}`}
                        >
                          {loading && <span className="loading-spinner"></span>}
                          {loading ? 'Minting...' : '🎨 Mint as NFT'}
                        </button>
                        
                        <button 
                          onClick={downloadAura}
                          className="btn btn-secondary"
                          title="Download your aura as PNG"
                        >
                          📥 Download
                        </button>
                      </div>

                      {/* Social Sharing */}
                      <div className="social-sharing">
                        <h4 className="social-title">Share Your Aura</h4>
                        <div className="social-buttons">
                          <button 
                            onClick={shareOnTwitter}
                            className="btn btn-social btn-twitter"
                            title="Share on Twitter/X"
                          >
                            🐦 Share on X
                          </button>
                          
                          <button 
                            onClick={copyToClipboard}
                            className="btn btn-social btn-copy"
                            title="Copy share text to clipboard"
                          >
                            📋 Copy Text
                          </button>
                        </div>
                        
                        <div className="share-preview">
                          <p className="share-preview-title">Preview:</p>
                          <div className="share-preview-content">
                            {generateShareText().split('\n').map((line, index) => (
                              <div key={index}>{line || '\u00A0'}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <p className="mvp-note">
                        MVP Demo: Check console for minting payload
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <AuraMinterApp />
    </WalletProvider>
  );
}

export default App;
