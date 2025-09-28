import React, { Suspense, lazy, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import Header from '../components/Header';
import { useAppContext } from '../contexts/AppContext';

// Lazy load the heavy AuraGenerator component
const AuraGenerator = lazy(() => import('../AuraGenerator'));

const AuraPage: React.FC = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const { state, setImageData, setLoading } = useAppContext();

  // Memoize the image callback to prevent unnecessary re-renders
  const handleImageGenerated = useCallback((imageData: string) => {
    setImageData(imageData);
  }, [setImageData]);

  const showError = (message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    console.error(`${type.toUpperCase()}: ${message}`);
    if (type === 'error') {
      alert(`Error: ${message}`);
    }
  };

  const showSuccess = (title: string, message: string) => {
    console.log(`SUCCESS - ${title}: ${message}`);
  };

  const mintNFT = async () => {
    // Load validation utilities and IPFS service dynamically
    const [validationUtils, ipfsService] = await Promise.all([
      import('../utils/validation'),
      import('../services/ipfsService')
    ]);

    const { validateWalletConnection, validateMoodSeed, validateTransactionCount, validateImageData } = validationUtils;
    const { getIPFSConfig, uploadToIPFS, createNFTMetadata } = ipfsService;

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

    // Check if IPFS is configured
    const ipfsConfig = getIPFSConfig();
    const hasIPFSConfig = ipfsConfig.apiKey && ipfsConfig.secretKey;

    if (!hasIPFSConfig) {
      // Show warning but continue with placeholder URI
      showError('IPFS not configured. Using demo mode for NFT minting.', 'warning');
    }

    setLoading(true);

    try {
      const tokenName = `Aura-${state.moodSeed.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
      const description = `Personal aura NFT generated from ${state.transactionCount} transactions with mood "${state.moodSeed}"`;

      let uri: string;

      if (hasIPFSConfig) {
        // Convert imageData to blob for IPFS upload
        const imageBlob = await fetch(state.imageData).then(r => r.blob());

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
            { trait_type: 'Mood', value: state.moodSeed },
            { trait_type: 'Transaction Count', value: state.transactionCount.toString() },
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
          moodSeed: state.moodSeed,
          transactionCount: state.transactionCount,
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
      const { Aptos, AptosConfig, Network } = await import('@aptos-labs/ts-sdk');
      const network = (process.env.REACT_APP_APTOS_NETWORK as any) || Network.DEVNET;
      const nodeUrl = process.env.REACT_APP_APTOS_NODE_URL || undefined;

      const aptosConfig = new AptosConfig({
        network,
        fullnode: nodeUrl
      });
      const aptos = new Aptos(aptosConfig);

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
        moodSeed: state.moodSeed,
        transactionCount: state.transactionCount,
        walletAddress: account?.address?.toString(),
        imageDataSize: state.imageData.length,
        timestamp: new Date().toISOString()
      });

      alert(`🎉 ${successMessage}`);

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
                  <p>Generating your aura visualization...</p>
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
                </div>

              </div>
            )}
          </div>
        </main>
        
        <footer className="mvp-footer">
          <p className="mvp-note mvp-note-compact">
           Live on Aptos Devnet! Your NFTs will be minted on-chain.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AuraPage;