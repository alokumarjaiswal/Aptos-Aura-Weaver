/**
 * Type definitions for the main App component
 */

export interface WalletState {
  account: {
    address: string;
    publicKey?: string;
  } | null;
  connected: boolean;
  connect: (walletName: string) => Promise<void>;
  disconnect: () => void;
  signAndSubmitTransaction: (transaction: any) => Promise<any>;
}

export interface AppState {
  moodSeed: string;
  transactionCount: number;
  imageData: string;
  loading: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface NFTMintParams {
  moodSeed: string;
  transactionCount: number;
  imageData: string;
  accountAddress: string;
}

export interface IPFSUploadData {
  imageBlob: Blob;
  metadata: Record<string, any>;
}

export interface ErrorContext {
  type: 'wallet' | 'transaction' | 'nft' | 'system' | 'user';
  timestamp: number;
  userMessage: string;
  technicalDetails?: string;
}
