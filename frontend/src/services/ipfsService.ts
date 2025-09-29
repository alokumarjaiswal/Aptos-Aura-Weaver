/**
 * API Service for NFT storage via backend
 */
import { config } from '../config';

export interface UploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
  // Additional properties for NFT upload
  imageHash?: string;
  imageUrl?: string;
  metadata?: NFTMetadata;
}

export interface NFTUploadData {
  imageFile: File | Blob;
  metadata: NFTMetadata;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image?: string;
  attributes: Array<{ trait_type: string; value: string }>;
  external_url: string;
  created_at: string;
}

class APIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.getBackendUrl();
  }

  /**
   * Enhanced availability check with automatic URL discovery
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        console.log('✅ Backend available at:', this.baseUrl);
        return true;
      }
    } catch (error) {
      console.warn('❌ Backend not available at:', this.baseUrl);
    }

    // If primary URL fails, try fallback discovery
    return await this.tryFallbackUrls();
  }

  /**
   * Try alternative URLs if primary fails
   */
  private async tryFallbackUrls(): Promise<boolean> {
    const fallbackUrls = config.getAllBackendUrls();

    for (const url of fallbackUrls) {
      if (url === this.baseUrl) continue; // Skip already tried URL
      
      try {
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          console.log('🔄 Switched to fallback backend:', url);
          this.baseUrl = url; // Update to working URL
          return true;
        }
      } catch (error) {
        console.warn('❌ Fallback URL failed:', url);
      }
    }
    
    console.warn('❌ No backend services available');
    return false;
  }



  /**
   * Upload complete NFT data (image + metadata) in one call
   */
  async uploadNFT(data: NFTUploadData): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('image', data.imageFile);
      formData.append('metadata', JSON.stringify(data.metadata));

      const response = await fetch(`${this.baseUrl}/api/upload-nft`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      return result;
    } catch (error) {
      console.error('NFT upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Upload just an image file
   */
  async uploadImage(file: File | Blob): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/upload-file`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Image upload failed');
      }

      return result;
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown image upload error'
      };
    }
  }

  /**
   * Upload metadata JSON
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<UploadResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/upload-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata })
      });

      if (!response.ok) {
        throw new Error(`Metadata upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Metadata upload failed');
      }

      return result;
    } catch (error) {
      console.error('Metadata upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown metadata upload error'
      };
    }
  }
}

// Export singleton instance
export const apiService = new APIService();

/**
 * Helper function to create NFT metadata
 */
export const createNFTMetadata = (
  name: string,
  description: string,
  imageUrl: string,
  attributes: Array<{ trait_type: string; value: string }>
): NFTMetadata => {
  return {
    name,
    description,
    image: imageUrl,
    attributes,
    external_url: window.location.origin,
    created_at: new Date().toISOString()
  };
};

/**
 * Check if IPFS storage is configured (backend available)
 */
export const isStorageAvailable = async (): Promise<boolean> => {
  return await apiService.isAvailable();
};

// Legacy exports for compatibility (deprecated)
/** @deprecated Use apiService.uploadImage instead */
export const uploadToIPFS = apiService.uploadImage.bind(apiService);

/** @deprecated Use apiService.uploadMetadata instead */
export const uploadMetadataToIPFS = apiService.uploadMetadata.bind(apiService);

/** @deprecated Use isStorageAvailable instead */
export const getIPFSConfig = () => ({ configured: true });
