/**
 * Enhanced type definitions for better type safety
 */

// Extend existing types with stricter definitions
export interface APIError extends Error {
  code?: string | number;
  statusCode?: number;
  details?: Record<string, any>;
}

export interface NetworkConfig {
  readonly name: string;
  readonly nodeUrl: string;
  readonly chainId?: string;
  readonly explorer: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  notifications: boolean;
  language: string;
}

export interface AuraGenerationParams {
  readonly moodSeed: string;
  readonly transactionCount: number;
  readonly walletAddress: string;
  readonly timestamp: number;
}

export interface NFTMintingState {
  readonly step: 'generating' | 'uploading' | 'minting' | 'complete';
  readonly progress: number;
  readonly error: APIError | null;
  readonly txHash: string | null;
}

// Utility types for better API responses
export type AsyncResult<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: APIError;
};

// Environment variable type safety
export interface AppEnvironment {
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly REACT_APP_APTOS_NETWORK: 'devnet' | 'testnet' | 'mainnet';
  readonly REACT_APP_APTOS_NODE_URL: string;
  readonly REACT_APP_BACKEND_URL_PRODUCTION?: string;
  readonly REACT_APP_BACKEND_URL_DEVELOPMENT?: string;
}