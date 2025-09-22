import React from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const network = (process.env.REACT_APP_APTOS_NETWORK as Network) || Network.DEVNET;
  const apiKeys = process.env.REACT_APP_PINATA_API_KEY && process.env.REACT_APP_PINATA_SECRET_KEY
    ? {
        [network]: {
          pinata: {
            apiKey: process.env.REACT_APP_PINATA_API_KEY,
            secretKey: process.env.REACT_APP_PINATA_SECRET_KEY
          }
        }
      }
    : undefined;

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network,
        aptosApiKeys: apiKeys as any // Type assertion for wallet adapter compatibility
      }}
      optInWallets={["Petra"]} // Explicitly include Petra
      onError={(error) => {
        console.error('Wallet adapter error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
