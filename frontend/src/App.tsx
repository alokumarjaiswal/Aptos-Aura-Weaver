import React, { useState, Suspense } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { WalletProvider } from './WalletProvider';
import { getIPFSConfig, uploadToIPFS, createNFTMetadata } from './services/ipfsService';
import {
  validateMoodSeed,
  validateTransactionCount,
  validateNetworkConnection,
  validateWalletConnection,
  validateImageData,
  isDesktopDevice,
  isPetraWalletInstalled,
  redirectToPetraInstall
} from './utils/validation';
import './App.css';

// Lazy load the AuraGenerator component for better performance
const AuraGenerator = React.lazy(() => import('./AuraGenerator'));

const network = (process.env.REACT_APP_APTOS_NETWORK as Network) || Network.DEVNET;
const nodeUrl = process.env.REACT_APP_APTOS_NODE_URL || undefined;

const config = new AptosConfig({
  network,
  fullnode: nodeUrl
});
const aptos = new Aptos(config);


function AuraMinterApp() {
  const { account, connected, connect, disconnect, signAndSubmitTransaction } = useWallet();
  const [moodSeed, setMoodSeed] = useState('');
  const [transactionCount, setTransactionCount] = useState(0);
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Show error message
   */
  const showError = (message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    console.error(`${type.toUpperCase()}: ${message}`);
    if (type === 'error') {
      alert(`Error: ${message}`);
    }
  };

  /**
   * Show success message
   */
  const showSuccess = (title: string, message: string) => {
    console.log(`SUCCESS - ${title}: ${message}`);
  };


  /**
   * Fetch user account data with enhanced error handling
   */
  const fetchUserData = async () => {
    // Validate wallet connection
    const walletValidation = validateWalletConnection(account?.address?.toString());
    if (!walletValidation.isValid) {
      showError(walletValidation.error!, 'warning');
      return;
    }

    // Validate network connection
    const networkValidation = validateNetworkConnection();
    if (!networkValidation.isValid) {
      showError(networkValidation.error!, 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const addressString = account!.address.toString();
      const accountData = await aptos.getAccountInfo({ accountAddress: addressString });

      // Validate response data
      if (!accountData || typeof accountData.sequence_number === 'undefined') {
        throw new Error('Invalid response from Aptos node');
      }

      const txCount = parseInt(accountData.sequence_number);

      // Validate transaction count
      const countValidation = validateTransactionCount(txCount, { minValue: 0 });
      if (!countValidation.isValid) {
        throw new Error(countValidation.error);
      }
      
      setTransactionCount(txCount);
      
      console.log(`Data fetched: Found ${txCount} transactions`);
      
      if (txCount === 0) {
        showError('Your account has no transactions yet. You can still create an aura!', 'info');
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      
      // Provide specific error messages based on error type
      if (error?.message?.includes('not found') || error?.message?.includes('Invalid response')) {
        setTransactionCount(0);
        showError('Account not found on Aptos network. Using default values for demo.', 'info');
      } else if (error?.message?.includes('network') || !navigator.onLine) {
        showError('Network error. Please check your connection and try again.', 'error');
      } else if (error?.message?.includes('timeout')) {
        showError('Request timed out. Please try again.', 'warning');
      } else {
        showError('Unable to fetch account data. Using demo values.', 'warning');
        setTransactionCount(Math.floor(Math.random() * 50) + 5); // Random demo value
      }
    } finally {
      setLoading(false);
    }
  };


  /**
   * Handle wallet connection with error handling and desktop redirect
   */
  const handleConnect = async () => {
    // Check if wallet is already connecting
    if (loading) {
      return;
    }

    // Check if Petra wallet is installed before attempting to connect (desktop only)
    if (!isPetraWalletInstalled() && isDesktopDevice()) {
      // On desktop, redirect to Petra installation page
      showError(
        'Petra wallet is not installed. Redirecting to installation page...', 
        'info'
      );
      redirectToPetraInstall();
      return;
    }

    try {
      setLoading(true);
      await connect('Petra');

      // The wallet adapter will automatically update the account state

    } catch (error: any) {
      console.error('Wallet connection error:', error);

      let errorMessage = 'Failed to connect wallet. Please try again.';
      let errorType: 'error' | 'warning' | 'info' = 'error';

      if (error?.message?.includes('User rejected') || error?.message?.includes('cancelled')) {
        errorMessage = 'Wallet connection was cancelled by user.';
        errorType = 'warning';
      } else if (error?.message?.includes('not installed')) {
        if (isDesktopDevice()) {
          showError('Petra wallet is not installed. Redirecting to installation page...', 'info');
          redirectToPetraInstall();
          return;
        }
        errorMessage = 'Petra wallet is not installed. Please install it first.';
      } else if (error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Connection timed out. Please try again.';
        errorType = 'warning';
      } else if (error?.name === 'WalletNotReadyError' || error?.name === 'WalletConnectionError') {
        if (isDesktopDevice()) {
          // Double-check if wallet is really installed
          if (!isPetraWalletInstalled()) {
            showError('Petra wallet is not installed. Redirecting to installation page...', 'info');
            redirectToPetraInstall();
            return;
          }
        }
        errorMessage = 'Wallet is not ready. Please make sure Petra wallet is properly installed and unlocked.';
        errorType = 'warning';
      }

      showError(errorMessage, errorType);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle wallet disconnection
   */
  const handleDisconnect = () => {
    disconnect();
    console.log('Wallet disconnected');
  };

  /**
   * Enhanced NFT minting with comprehensive validation and error handling
   */
  const mintNFT = async () => {
    // Validation checks
    const walletValidation = validateWalletConnection(account?.address?.toString());
    if (!walletValidation.isValid) {
      showError(walletValidation.error!, 'warning');
      return;
    }

    const moodValidation = validateMoodSeed(moodSeed);
    if (!moodValidation.isValid) {
      showError(moodValidation.error!, 'warning');
      return;
    }

    const countValidation = validateTransactionCount(transactionCount);
    if (!countValidation.isValid) {
      showError(countValidation.error!, 'error');
      return;
    }

    const imageValidation = validateImageData(imageData);
    if (!imageValidation.isValid) {
      showError(imageValidation.error!, 'warning');
      return;
    }

    // Check if IPFS is configured
    const ipfsConfig = getIPFSConfig();
    const hasIPFSConfig = ipfsConfig.apiKey && ipfsConfig.secretKey;

    if (!hasIPFSConfig) {
      // Show warning but continue with placeholder URI
      showError('IPFS not configured. Using demo mode for NFT minting.', 'warning');
    }

    setLoading(true);

    try {
      const tokenName = `Aura-${moodSeed.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
      const description = `Personal aura NFT generated from ${transactionCount} transactions with mood "${moodSeed}"`;

      let uri: string;

      if (hasIPFSConfig) {
        // Convert imageData to blob for IPFS upload
        const imageBlob = await fetch(imageData).then(r => r.blob());

        // Upload image to IPFS
        console.log('Uploading your aura image to IPFS...');

        const imageUpload = await uploadToIPFS(imageBlob, ipfsConfig);

        if (!imageUpload.success) {
          throw new Error(`IPFS upload failed: ${imageUpload.error}`);
        }

        // Create and upload metadata
        const metadata = createNFTMetadata(
          tokenName,
          description,
          imageUpload.url!,
          [
            { trait_type: 'Mood', value: moodSeed },
            { trait_type: 'Transaction Count', value: transactionCount.toString() },
            { trait_type: 'Generated At', value: new Date().toISOString() },
            { trait_type: 'Generator', value: 'Aptos Aura Weaver v1.0' }
          ]
        );

        const metadataUpload = await uploadToIPFS(
          new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' }),
          ipfsConfig
        );

        if (!metadataUpload.success) {
          throw new Error(`Metadata upload failed: ${metadataUpload.error}`);
        }

        uri = metadataUpload.url!;
      
      console.log('🎨 Minting NFT with parameters:', {
        tokenName,
        moodSeed,
        transactionCount,
          uri,
          imageHash: imageUpload.hash,
          metadataHash: metadataUpload.hash
        });
      } else {
        // Use simple placeholder URI for demo (short enough for blockchain)
        console.log('Creating your aura NFT with demo metadata...');

        // Use a simple HTTP URL instead of long data URI
        const demoUri = `https://demo.aura-aptos.com/nft/${tokenName.replace(/[^a-zA-Z0-9]/g, '')}`;
        uri = demoUri;

        console.log('🎨 Minting NFT with parameters (Demo Mode):', {
          tokenName,
          moodSeed,
          transactionCount,
          uri: demoUri
        });
      }
      
      // Add minting started log
      console.log(`Minting Started: Creating your aura NFT "${tokenName}"...`);
      
      // Execute the actual smart contract transaction using wallet adapter
      const response = await signAndSubmitTransaction({
        data: {
          function: "0x0b65f8046e689981c490d760553a03b9d11775d03d78c141d6a44041c3b12a43::aura_nft::mint_aura",
          functionArguments: [moodSeed, transactionCount, tokenName, uri],
        },
        options: {
          maxGasAmount: 10000,
          gasUnitPrice: 100,
        }
      });
      console.log('🎨 Transaction submitted:', response.hash);
      
      // Wait for transaction to be processed
      const txResult = await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      
      console.log('✅ Transaction confirmed:', txResult);
      
      // Add success log
      const demoMode = !hasIPFSConfig;
      const successMessage = demoMode
        ? `Your aura NFT "${tokenName}" has been minted in demo mode! (IPFS not configured)`
        : `Your aura NFT "${tokenName}" has been minted!`;
      console.log(`NFT Minted Successfully: ${successMessage}`);
      
      // Log detailed information for development
      console.log('✅ NFT Minting Details:', {
        tokenName,
        description,
        moodSeed,
        transactionCount,
        walletAddress: account?.address?.toString(),
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
      showSuccess('Copied to Clipboard', 'Share text copied successfully!');
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
      const fileName = `aura-${moodSeed.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = imageData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess('Download Complete', `Aura image "${fileName}" downloaded successfully!`);
    } catch (error) {
      showError('Failed to download image', 'error');
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
                    <Suspense fallback={
                      <div className="aura-loading-fallback">
                        <div className="loading-spinner"></div>
                        <p>Generating your aura visualization...</p>
                      </div>
                    }>
                    <AuraGenerator
                      moodSeed={moodSeed}
                      transactionCount={transactionCount}
                      onImageGenerated={setImageData}
                    />
                    </Suspense>
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
