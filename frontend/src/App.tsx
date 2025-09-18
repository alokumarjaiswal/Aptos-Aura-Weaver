import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { WalletProvider } from './WalletProvider';
import { AuraGenerator } from './AuraGenerator';
import { NotificationProvider, useNotifications, createNotification } from './contexts/NotificationContext';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationButton } from './components/NotificationButton';
import { NotificationContainer } from './components/NotificationContainer';
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
  const { account, connected, connect, disconnect, signAndSubmitTransaction } = useWallet();
  const { addNotification } = useNotifications();
  const [moodSeed, setMoodSeed] = useState('');
  const [transactionCount, setTransactionCount] = useState(0);
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  /**
   * Show error notification
   */
  const showError = (message: string, type: 'error' | 'warning' | 'info' = 'error', category: 'wallet' | 'transaction' | 'nft' | 'system' | 'user' = 'system') => {
    addNotification({
      type,
      title: type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info',
      message,
      category,
      persistent: type === 'error'
    });
  };

  /**
   * Show success notification
   */
  const showSuccess = (title: string, message: string, category: 'wallet' | 'transaction' | 'nft' | 'system' | 'user' = 'system', metadata?: any) => {
    addNotification({
      type: 'success',
      title,
      message,
      category,
      metadata
    });
  };

  /**
   * Validate mood seed input
   */
  const validateMoodSeed = (seed: string): boolean => {
    if (!seed.trim()) {
      showError('Please enter a mood seed to generate your aura', 'warning', 'user');
      return false;
    }
    if (seed.length < 2) {
      showError('Mood seed should be at least 2 characters long', 'warning', 'user');
      return false;
    }
    if (seed.length > 50) {
      showError('Mood seed should be less than 50 characters', 'warning', 'user');
      return false;
    }
    return true;
  };

  /**
   * Fetch user account data with enhanced error handling
   */
  const fetchUserData = async () => {
    if (!account?.address) {
      showError('No wallet connected. Please connect your wallet first.', 'warning', 'wallet');
      return;
    }
    
    setLoading(true);
    
    try {
      const addressString = account.address.toString();
      const accountData = await aptos.getAccountInfo({ accountAddress: addressString });
      const txCount = parseInt(accountData.sequence_number);
      
      setTransactionCount(txCount);
      
      addNotification(createNotification.dataFetched('transactions', txCount));
      
      if (txCount === 0) {
        showError('Your account has no transactions yet. You can still create an aura!', 'info', 'wallet');
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      
      // Provide specific error messages based on error type
      if (error?.message?.includes('not found')) {
        setTransactionCount(0);
        showError('Account not found on Aptos devnet. Using default values for demo.', 'info', 'system');
      } else if (error?.message?.includes('network')) {
        showError('Network error. Please check your connection and try again.', 'error', 'system');
      } else {
        showError('Unable to fetch account data. Using demo values.', 'warning', 'system');
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
      await connect('Petra');
      if (account?.address) {
        addNotification(createNotification.walletConnected(account.address.toString()));
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      if (error?.message?.includes('User rejected')) {
        showError('Wallet connection was cancelled by user.', 'warning', 'wallet');
      } else if (error?.message?.includes('not installed')) {
        showError('Petra wallet is not installed. Please install it first.', 'error', 'wallet');
      } else {
        showError('Failed to connect wallet. Please try again.', 'error', 'wallet');
      }
    }
  };

  /**
   * Handle wallet disconnection
   */
  const handleDisconnect = () => {
    disconnect();
    addNotification(createNotification.walletDisconnected());
  };

  /**
   * Enhanced NFT minting with comprehensive validation and error handling
   */
  const mintNFT = async () => {
    // Validation checks
    if (!account?.address) {
      showError('No wallet connected. Please connect your wallet first.', 'warning', 'wallet');
      return;
    }

    if (!validateMoodSeed(moodSeed)) {
      return; // Error already shown by validateMoodSeed
    }

    if (!imageData) {
      showError('No aura generated yet. Please wait for the aura to be created.', 'warning', 'nft');
      return;
    }

    setLoading(true);

    try {
      const tokenName = `Aura-${moodSeed.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
      const description = `Personal aura NFT generated from ${transactionCount} transactions with mood "${moodSeed}"`;
      const uri = "https://placeholder-uri.com"; // TODO: Replace with IPFS URI
      
      console.log('🎨 Minting NFT with parameters:', {
        tokenName,
        moodSeed,
        transactionCount,
        uri
      });
      
      // Add minting started notification
      addNotification({
        type: 'info',
        title: 'Minting Started',
        message: `Creating your aura NFT "${tokenName}"...`,
        category: 'nft',
        metadata: { nftTokenName: tokenName, actionType: 'mint_start' }
      });
      
      // Execute the actual smart contract transaction using wallet adapter
      const response = await signAndSubmitTransaction({
        data: {
          function: "0x0b65f8046e689981c490d760553a03b9d11775d03d78c141d6a44041c3b12a43::aura_nft::mint_aura",
          functionArguments: [moodSeed, transactionCount, tokenName, uri],
        }
      });
      console.log('🎨 Transaction submitted:', response.hash);
      
      // Wait for transaction to be processed
      const txResult = await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      
      console.log('✅ Transaction confirmed:', txResult);
      
      // Add success notification
      addNotification(createNotification.nftMinted(tokenName, response.hash));
      
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
        showError('Insufficient funds to mint NFT. Please ensure you have enough APT tokens.', 'error', 'transaction');
      } else if (error?.message?.includes('network')) {
        showError('Network error during minting. Please check your connection and try again.', 'error', 'system');
      } else if (error?.message?.includes('rejected')) {
        showError('Transaction was rejected. Please try again.', 'warning', 'transaction');
      } else {
        showError('Failed to mint NFT. Please try again later.', 'error', 'nft');
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
      showSuccess('Copied to Clipboard', 'Share text copied successfully!', 'user');
    } catch (error) {
      showError('Failed to copy to clipboard', 'warning', 'user');
    }
  };

  /**
   * Download aura as image
   */
  const downloadAura = () => {
    if (!imageData) {
      showError('No aura image available to download', 'warning', 'user');
      return;
    }

    try {
      const fileName = `aura-${moodSeed.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = imageData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess('Download Complete', `Aura image "${fileName}" downloaded successfully!`, 'user', {
        fileName,
        actionType: 'download'
      });
    } catch (error) {
      showError('Failed to download image', 'error', 'user');
    }
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <header className="app-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="app-title">Aptos Aura Weaver</h1>
              <p className="app-subtitle">Generate your personalized aura NFT based on your on-chain activity</p>
            </div>
            <div className="header-actions">
              <NotificationButton onClick={() => setIsNotificationCenterOpen(true)} />
            </div>
          </div>
        </header>
        
        <main className="main-content">

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
                  onClick={handleDisconnect}
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
                        🎉 Live on Aptos Devnet! Your NFTs will be minted on-chain.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationCenterOpen} 
        onClose={() => setIsNotificationCenterOpen(false)} 
      />
      
      {/* Popup Notifications */}
      <NotificationContainer />
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <NotificationProvider>
        <AuraMinterApp />
      </NotificationProvider>
    </WalletProvider>
  );
}

export default App;
