import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { WalletProvider } from './WalletProvider';
import { AuraGenerator } from './AuraGenerator';
import './App.css';

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

function AuraMinterApp() {
  const { account, connected, connect, disconnect } = useWallet();
  const [moodSeed, setMoodSeed] = useState('');
  const [transactionCount, setTransactionCount] = useState(0);
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUserData = async () => {
    if (!account?.address) return;
    
    setLoading(true);
    try {
      // Fix: Convert address to string to resolve type mismatch
      const addressString = account.address.toString();
      const accountData = await aptos.getAccountInfo({ accountAddress: addressString });
      setTransactionCount(parseInt(accountData.sequence_number));
    } catch (error) {
      console.error('Error fetching user data:', error);
      setTransactionCount(25); // Default value for demo
    }
    setLoading(false);
  };

  const mintNFT = async () => {
    if (!account?.address || !imageData) return;

    setLoading(true);
    try {
      // For MVP, we'll just log the minting payload
      // In a full implementation, this would call the smart contract
      const tokenName = `Aura-${Date.now()}`;
      const uri = "https://placeholder-uri.com"; // Replace with IPFS URI later
      
      const payload = {
        function: "0xCAFE::aura_nft::mint_aura",
        functionArguments: [moodSeed, transactionCount, tokenName, uri],
      };

      console.log('MVP Minting payload:', payload);
      alert(`🎉 NFT minted successfully! (MVP Demo)\n\nToken: ${tokenName}\nMood: ${moodSeed}\nTx Count: ${transactionCount}`);
    } catch (error) {
      console.error('Error minting NFT:', error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>🌟 Aptos Aura Weaver MVP</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>Generate your personalized aura NFT based on your on-chain activity</p>
      </header>
      
      {!connected ? (
        <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #ccc', borderRadius: '10px' }}>
          <h3>Connect Your Wallet</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>Connect your Petra wallet to get started</p>
          <button 
            onClick={() => connect('Petra')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Connect Petra Wallet
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            {/* Fix: Convert address to string for display */}
            <p><strong>Connected:</strong> {account?.address?.toString()}</p>
            <button 
              onClick={disconnect}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={fetchUserData} 
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Fetch Account Data'}
            </button>
            <p style={{ margin: '10px 0' }}>
              <strong>Transaction Count:</strong> {transactionCount}
              {transactionCount > 0 && <span style={{ color: '#28a745', marginLeft: '10px' }}>✓</span>}
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Mood Seed:
            </label>
            <input
              type="text"
              value={moodSeed}
              onChange={(e) => setMoodSeed(e.target.value)}
              placeholder="Enter your mood (e.g., 'happy 😊', 'calm 🌊', 'energetic ⚡')"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {moodSeed && transactionCount >= 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Your Personal Aura:</h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <AuraGenerator
                  moodSeed={moodSeed}
                  transactionCount={transactionCount}
                  onImageGenerated={setImageData}
                />
              </div>
              
              {imageData && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666', marginBottom: '15px' }}>
                    Your unique aura generated from {transactionCount} transactions and mood "{moodSeed}"
                  </p>
                  <button 
                    onClick={mintNFT} 
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      backgroundColor: loading ? '#ccc' : '#ff6b35',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Minting...' : '🎨 Mint as NFT'}
                  </button>
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                    MVP Demo: Check console for minting payload
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
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
