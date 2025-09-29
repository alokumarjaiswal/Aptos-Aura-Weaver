import React, { Suspense, lazy, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import Header from '../components/Header';
import { useAppContext } from '../contexts/AppContext';
import { openTransactionInExplorer, getNetworkDisplayName } from '../utils/aptosExplorer';
import { checkNetworkCompatibility } from '../utils/networkUtils';

// Lazy load the heavy AuraGenerator component
const AuraGenerator = lazy(() => import('../AuraGenerator'));

const AuraPage: React.FC = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const { state, setImageData, setLoading, setTransactionHash } = useAppContext();

  // Memoize the image callback to prevent unnecessary re-renders
  const handleImageGenerated = useCallback((imageData: string) => {
    setImageData(imageData);
    // Clear any previous transaction hash when a new aura is generated
    setTransactionHash('');
  }, [setImageData, setTransactionHash]);

  const mapTransactionError = (error: any): { message: string; type: 'error' | 'warning' | 'info' } => {
    const errorMsg = error?.message || error?.toString() || '';
    const errorCode = error?.code || error?.status;
    
    // Aptos-specific transaction errors
    if (errorMsg.includes('INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE') || errorMsg.includes('insufficient funds')) {
      return {
        message: 'Insufficient APT balance for gas fees. Please add more APT to your wallet.',
        type: 'error'
      };
    }
    
    if (errorMsg.includes('SEQUENCE_NUMBER_TOO_OLD') || errorMsg.includes('sequence number')) {
      return {
        message: 'Transaction sequence error. Please refresh your wallet and try again.',
        type: 'warning'
      };
    }
    
    if (errorMsg.includes('TRANSACTION_EXPIRED') || errorMsg.includes('expired')) {
      return {
        message: 'Transaction expired due to network delay. Please try again.',
        type: 'warning'
      };
    }
    
    if (errorMsg.includes('INVALID_SIGNATURE') || errorMsg.includes('signature')) {
      return {
        message: 'Invalid signature. Please check your wallet connection and try again.',
        type: 'error'
      };
    }
    
    if (errorMsg.includes('MODULE_NOT_FOUND') || errorMsg.includes('module')) {
      return {
        message: 'Smart contract not found. Please ensure you are on the correct network (Devnet).',
        type: 'error'
      };
    }
    
    if (errorMsg.includes('FUNCTION_NOT_FOUND') || errorMsg.includes('function')) {
      return {
        message: 'Contract function not available. The smart contract may need updating.',
        type: 'error'
      };
    }
    
    if (errorMsg.includes('INVALID_ARGUMENT') || errorMsg.includes('argument')) {
      return {
        message: 'Invalid transaction parameters. Please refresh and try again.',
        type: 'error'
      };
    }
    
    if (errorMsg.includes('rejected') || errorMsg.includes('denied') || errorMsg.includes('cancelled')) {
      return {
        message: 'Transaction was rejected. Please approve the transaction to continue.',
        type: 'warning'
      };
    }
    
    if (errorMsg.includes('network') || errorMsg.includes('connection') || errorMsg.includes('timeout')) {
      return {
        message: 'Network connection issue. Please check your internet connection and try again.',
        type: 'warning'
      };
    }
    
    if (errorMsg.includes('gas') || errorMsg.includes('Gas')) {
      return {
        message: 'Gas estimation failed. Please try again with a higher gas limit.',
        type: 'error'
      };
    }
    
    // Rate limiting or server errors
    if (errorCode === 429 || errorMsg.includes('rate limit') || errorMsg.includes('too many requests')) {
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        type: 'warning'
      };
    }
    
    // Fallback for unknown errors
    return {
      message: `Transaction failed: ${errorMsg || 'Unknown error occurred'}`,
      type: 'error'
    };
  };
  


  const showError = (message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    console.error(`${type.toUpperCase()}: ${message}`);
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else if (type === 'warning') {
      alert(`Warning: ${message}`);
    } else {
      alert(`Info: ${message}`);
    }
  };

  const showSuccess = (title: string, message: string) => {
    console.log(`SUCCESS - ${title}: ${message}`);
  };

  const mintNFT = async () => {
    // Load validation utilities and API service dynamically
    const [validationUtils, apiService] = await Promise.all([
      import('../utils/validation'),
      import('../services/ipfsService')
    ]);

    const { validateWalletConnection, validateMoodSeed, validateTransactionCount, validateImageData } = validationUtils;
    const { apiService: api, createNFTMetadata, isStorageAvailable } = apiService;

    // Check network compatibility first
    const networkCheck = await checkNetworkCompatibility();
    if (!networkCheck.isCompatible) {
      showError(
        `Network mismatch detected. Please switch your wallet to ${networkCheck.expected} network. Currently on: ${networkCheck.actual || 'unknown'}`,
        'error'
      );
      return;
    }

    // Validation checks
    const walletValidation = validateWalletConnection(account?.address?.toString());
    if (!walletValidation.isValid) {
      showError(walletValidation.error!, 'warning');
      return;
    }

    const moodValidation = validateMoodSeed(state.moodSeed);
    if (!moodValidation.isValid) {
      showError(moodValidation.error!, 'warning');
      return;
    }

    const countValidation = validateTransactionCount(state.transactionCount);
    if (!countValidation.isValid) {
      showError(countValidation.error!, 'error');
      return;
    }

    const imageValidation = validateImageData(state.imageData);
    if (!imageValidation.isValid) {
      showError(imageValidation.error!, 'warning');
      return;
    }

    // Check if storage service is available
    const storageAvailable = await isStorageAvailable();

    if (!storageAvailable) {
      // Show warning but continue with placeholder URI
      showError('Storage service not available. Using demo mode for NFT minting.', 'warning');
    }

    setLoading(true);
    
    // Clear any previous transaction hash
    setTransactionHash('');

    try {
      const tokenName = `Aura-${state.moodSeed.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
      const description = `Personal aura NFT generated from ${state.transactionCount} transactions with mood "${state.moodSeed}"`;

      let uri: string;

      if (storageAvailable) {
        // Convert imageData to blob for upload
        const imageBlob = await fetch(state.imageData).then(r => r.blob());

        console.log('Uploading your aura NFT to IPFS...');

        // Create metadata first (without image URL)
        const metadata = createNFTMetadata(
          tokenName,
          description,
          '', // Image URL will be set by backend
          [
            { trait_type: 'Mood', value: state.moodSeed },
            { trait_type: 'Transaction Count', value: state.transactionCount.toString() },
            { trait_type: 'Generated At', value: new Date().toISOString() },
            { trait_type: 'Generator', value: 'Aptos Aura Weaver v1.0' }
          ]
        );

        // Upload complete NFT (image + metadata) in one call
        const uploadResult = await api.uploadNFT({
          imageFile: imageBlob,
          metadata
        });

        if (!uploadResult.success) {
          throw new Error(`NFT upload failed: ${uploadResult.error}`);
        }

        uri = uploadResult.url!;

        console.log('🎨 Minting NFT with parameters:', {
          tokenName,
          moodSeed: state.moodSeed,
          transactionCount: state.transactionCount,
          uri,
          ...(uploadResult.imageHash && { imageHash: uploadResult.imageHash }),
          ...(uploadResult.hash && { metadataHash: uploadResult.hash })
        });
      } else {
        // Use simple placeholder URI for demo (short enough for blockchain)
        console.log('Creating your aura NFT with demo metadata...');

        // Use a simple HTTP URL instead of long data URI
        const demoUri = `https://demo.aura-aptos.com/nft/${tokenName.replace(/[^a-zA-Z0-9]/g, '')}`;
        uri = demoUri;

        console.log('🎨 Minting NFT with parameters (Demo Mode):', {
          tokenName,
          moodSeed: state.moodSeed,
          transactionCount: state.transactionCount,
          uri: demoUri
        });
      }

      // Add minting started log
      console.log(`Minting Started: Creating your aura NFT "${tokenName}"...`);

      // Execute the actual smart contract transaction using wallet adapter
      const response = await signAndSubmitTransaction({
        data: {
          function: "0x0b65f8046e689981c490d760553a03b9d11775d03d78c141d6a44041c3b12a43::aura_nft::mint_aura",
          functionArguments: [state.moodSeed, state.transactionCount, tokenName, uri],
        },
        options: {
          maxGasAmount: 10000,
          gasUnitPrice: 100,
        }
      });
      console.log('🎨 Transaction submitted:', response.hash);

      // Wait for transaction to be processed
      const aptosSDK = await import('@aptos-labs/ts-sdk');
      const network = (process.env.REACT_APP_APTOS_NETWORK as any) || aptosSDK.Network.DEVNET;
      const nodeUrl = process.env.REACT_APP_APTOS_NODE_URL || undefined;

      const aptosConfig = new aptosSDK.AptosConfig({
        network,
        fullnode: nodeUrl
      });
      const aptos = new aptosSDK.Aptos(aptosConfig);

      const txResult = await aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      console.log('✅ Transaction confirmed:', txResult);

      // Store the transaction hash in the app state
      setTransactionHash(response.hash);

      // Add success log
      const demoMode = !storageAvailable;
      const successMessage = demoMode
        ? `Your aura NFT "${tokenName}" has been minted in demo mode! (Storage service not available)`
        : `Your aura NFT "${tokenName}" has been minted with IPFS storage!`;
      console.log(`NFT Minted Successfully: ${successMessage}`);

      // Log detailed information for development
      console.log('✅ NFT Minting Details:', {
        tokenName,
        description,
        moodSeed: state.moodSeed,
        transactionCount: state.transactionCount,
        walletAddress: account?.address?.toString(),
        imageDataSize: state.imageData.length,
        transactionHash: response.hash,
        timestamp: new Date().toISOString()
      });

      alert(`Success: ${successMessage}`);

    } catch (error: any) {
      console.error('❌ Error minting NFT:', error);
      
      // Use comprehensive error mapping
      const { message, type } = mapTransactionError(error);
      showError(message, type);
      
      // Log detailed error for debugging
      console.error('Detailed error info:', {
        originalError: error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStatus: error?.status,
        stack: error?.stack
      });
    } finally {
      setLoading(false);
    }
  };



  const downloadAura = () => {
    if (!state.imageData) {
      showError('No aura image available to download', 'warning');
      return;
    }

    try {
      const fileName = `aura-${state.moodSeed.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = state.imageData;
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
        <Header />

        <main className="main-content aura-main-content">
          <div className="aura-section aura-section-compact">
            <div className="aura-generator-wrapper">
              <Suspense fallback={
                <div className="aura-loading-fallback">
                  <div className="loading-spinner"></div>
                </div>
              }>
                <AuraGenerator
                  moodSeed={state.moodSeed}
                  transactionCount={state.transactionCount}
                  onImageGenerated={handleImageGenerated}
                />
              </Suspense>
            </div>

            {state.imageData && (
              <div className="aura-content-wrapper">
                {/* Action Buttons */}
                <div className="action-buttons action-buttons-compact">
                  <button
                    onClick={mintNFT}
                    disabled={state.loading}
                    className={`btn btn-primary btn-connect-wallet ${state.loading ? 'loading' : ''}`}
                  >
                    {state.loading && <span className="loading-spinner"></span>}
                    <span className="generate-text">{state.loading ? 'Minting...' : 'Mint as NFT'}</span>
                    <div className="generate-glow"></div>
                  </button>

                  <button
                    onClick={downloadAura}
                    className="btn btn-primary btn-connect-wallet btn-download-aura"
                    title="Download your aura as PNG"
                  >
                    <span className="generate-text">Download</span>
                    <div className="generate-glow"></div>
                  </button>

                  {state.lastTransactionHash && state.lastTransactionHash.trim() !== '' && (
                    <button
                      onClick={() => openTransactionInExplorer(state.lastTransactionHash!)}
                      className="btn btn-secondary btn-connect-wallet btn-explorer"
                      title={`View transaction on Aptos ${getNetworkDisplayName()}`}
                    >
                      <span className="generate-text">View on Aptos {getNetworkDisplayName()}</span>
                      <div className="generate-glow"></div>
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>
        </main>
        
        <footer className="mvp-footer">
          <p className="mvp-note mvp-note-compact">
           Live on Aptos Devnet! Switch to Devnet in your wallet and faucet APT.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AuraPage;