/**
 * Utility functions for Aptos blockchain explorer integration
 */

/**
 * Generate the appropriate explorer URL based on network configuration
 */
export const getAptosExplorerUrl = (transactionHash: string): string => {
  // Get network from environment variables
  const network = process.env.REACT_APP_APTOS_NETWORK || 'devnet';
  
  // Generate the appropriate explorer URL based on network
  switch (network.toLowerCase()) {
    case 'mainnet':
      return `https://explorer.aptoslabs.com/txn/${transactionHash}?network=mainnet`;
    case 'testnet':
      return `https://explorer.aptoslabs.com/txn/${transactionHash}?network=testnet`;
    case 'devnet':
    default:
      return `https://explorer.aptoslabs.com/txn/${transactionHash}?network=devnet`;
  }
};

/**
 * Open the transaction in the Aptos explorer in a new tab
 */
export const openTransactionInExplorer = (transactionHash: string): void => {
  const explorerUrl = getAptosExplorerUrl(transactionHash);
  window.open(explorerUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Get the network name for display purposes
 */
export const getNetworkDisplayName = (): string => {
  const network = process.env.REACT_APP_APTOS_NETWORK || 'devnet';
  
  switch (network.toLowerCase()) {
    case 'mainnet':
      return 'Mainnet';
    case 'testnet':
      return 'Testnet';
    case 'devnet':
    default:
      return 'Devnet';
  }
};