/**
 * Network utilities for Aptos blockchain operations
 */

import { ValidationResult } from '../types/app';

export interface NetworkInfo {
  name: string;
  chainId?: string;
  url?: string;
}

export interface NetworkCheckResult {
  isCompatible: boolean;
  expected: string;
  actual: string | null;
  warning?: string;
}

/**
 * Get the expected network from environment configuration
 */
export const getExpectedNetwork = (): string => {
  return (process.env.REACT_APP_APTOS_NETWORK as string) || 'devnet';
};

/**
 * Get current network from wallet
 */
export const getCurrentNetwork = async (): Promise<string | null> => {
  try {
    if ((window as any).aptos?.network) {
      const networkInfo = await (window as any).aptos.network();
      return networkInfo?.name || networkInfo || null;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get current network:', error);
    return null;
  }
};

/**
 * Check if current network matches expected network
 */
export const checkNetworkCompatibility = async (): Promise<NetworkCheckResult> => {
  const expected = getExpectedNetwork();
  const actual = await getCurrentNetwork();
  
  if (!actual) {
    return {
      isCompatible: true, // Assume compatible if we can't detect
      expected,
      actual,
      warning: 'Could not detect wallet network'
    };
  }
  
  const isCompatible = actual.toLowerCase().includes(expected.toLowerCase()) ||
                      expected.toLowerCase().includes(actual.toLowerCase());
  
  return {
    isCompatible,
    expected,
    actual,
    warning: isCompatible ? undefined : `Please switch to ${expected.toUpperCase()} network`
  };
};

/**
 * Validate network connection and compatibility
 */
export const validateNetworkConnection = async (): Promise<ValidationResult> => {
  // Check internet connectivity
  if (!navigator.onLine) {
    return {
      isValid: false,
      error: 'No internet connection. Please check your network connection.'
    };
  }
  
  try {
    const networkCheck = await checkNetworkCompatibility();
    
    if (!networkCheck.isCompatible) {
      return {
        isValid: false,
        error: `Network mismatch: Expected ${networkCheck.expected}, but wallet is on ${networkCheck.actual}. ${networkCheck.warning || ''}`
      };
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Network validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Get user-friendly network display names
 */
export const getNetworkDisplayName = (network?: string): string => {
  const networkName = network || getExpectedNetwork();
  
  switch (networkName.toLowerCase()) {
    case 'devnet':
      return 'Devnet';
    case 'testnet':
      return 'Testnet';
    case 'mainnet':
      return 'Mainnet';
    default:
      return networkName.charAt(0).toUpperCase() + networkName.slice(1);
  }
};

/**
 * Check if we're on a test network (devnet/testnet)
 */
export const isTestNetwork = (network?: string): boolean => {
  const networkName = (network || getExpectedNetwork()).toLowerCase();
  return networkName === 'devnet' || networkName === 'testnet';
};

/**
 * Get appropriate explorer URL for current network
 */
export const getExplorerUrl = (network?: string): string => {
  const networkName = (network || getExpectedNetwork()).toLowerCase();
  
  switch (networkName) {
    case 'mainnet':
      return 'https://explorer.aptoslabs.com';
    case 'testnet':
      return 'https://explorer.aptoslabs.com/?network=testnet';
    case 'devnet':
    default:
      return 'https://explorer.aptoslabs.com/?network=devnet';
  }
};

/**
 * Monitor network changes and notify callback
 */
export const monitorNetworkChanges = (
  callback: (networkInfo: NetworkCheckResult) => void,
  intervalMs: number = 5000
): () => void => {
  let currentNetwork: string | null = null;
  
  const checkNetwork = async () => {
    try {
      const networkCheck = await checkNetworkCompatibility();
      
      if (networkCheck.actual !== currentNetwork) {
        currentNetwork = networkCheck.actual;
        callback(networkCheck);
      }
    } catch (error) {
      console.warn('Network monitoring error:', error);
    }
  };
  
  // Initial check
  checkNetwork();
  
  // Set up interval
  const intervalId = setInterval(checkNetwork, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};