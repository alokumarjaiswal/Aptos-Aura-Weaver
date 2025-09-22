/**
 * IPFS Service for uploading and managing NFT metadata and images
 */

export interface IPFSUploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

export interface IPFSConfig {
  gateway: string;
  apiKey?: string;
  secretKey?: string;
}

/**
 * Upload a file to IPFS using Pinata
 */
export const uploadToIPFS = async (
  file: File | Blob,
  config: IPFSConfig
): Promise<IPFSUploadResult> => {
  try {
    if (!config.apiKey || !config.secretKey) {
      throw new Error('IPFS API keys not configured. Please set REACT_APP_PINATA_API_KEY and REACT_APP_PINATA_SECRET_KEY');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': config.apiKey,
        'pinata_secret_api_key': config.secretKey,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      hash: result.IpfsHash,
      url: `${config.gateway}${result.IpfsHash}`
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown IPFS upload error'
    };
  }
};

/**
 * Upload JSON metadata to IPFS
 */
export const uploadMetadataToIPFS = async (
  metadata: Record<string, any>,
  config: IPFSConfig
): Promise<IPFSUploadResult> => {
  try {
    if (!config.apiKey || !config.secretKey) {
      throw new Error('IPFS API keys not configured. Please set REACT_APP_PINATA_API_KEY and REACT_APP_PINATA_SECRET_KEY');
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': config.apiKey,
        'pinata_secret_api_key': config.secretKey,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: 'aura-nft-metadata.json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`IPFS metadata upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      hash: result.IpfsHash,
      url: `${config.gateway}${result.IpfsHash}`
    };
  } catch (error) {
    console.error('IPFS metadata upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown IPFS metadata upload error'
    };
  }
};

/**
 * Get IPFS configuration from environment variables
 */
export const getIPFSConfig = (): IPFSConfig => {
  return {
    gateway: process.env.REACT_APP_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
    apiKey: process.env.REACT_APP_PINATA_API_KEY,
    secretKey: process.env.REACT_APP_PINATA_SECRET_KEY
  };
};

/**
 * Create NFT metadata JSON
 */
export const createNFTMetadata = (
  name: string,
  description: string,
  imageUrl: string,
  attributes: Record<string, any>[]
): Record<string, any> => {
  return {
    name,
    description,
    image: imageUrl,
    attributes,
    external_url: window.location.origin,
    created_at: new Date().toISOString()
  };
};
