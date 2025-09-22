/**
 * Validation utilities for user inputs and data
 */

import { ValidationResult } from '../types/app';

export interface MoodSeedValidationOptions {
  minLength?: number;
  maxLength?: number;
  allowSpecialChars?: boolean;
  maxSpecialCharRatio?: number;
}

export interface TransactionCountValidationOptions {
  minValue?: number;
  maxValue?: number;
  allowNegative?: boolean;
}

/**
 * Comprehensive mood seed validation
 */
export const validateMoodSeed = (
  seed: string,
  options: MoodSeedValidationOptions = {}
): ValidationResult => {
  const {
    minLength = 2,
    maxLength = 100,
    allowSpecialChars = true,
    maxSpecialCharRatio = 0.5
  } = options;

  const trimmedSeed = seed.trim();

  // Check for empty or whitespace-only input
  if (!trimmedSeed) {
    return {
      isValid: false,
      error: 'Please enter a mood seed to generate your aura'
    };
  }

  // Check length constraints
  if (trimmedSeed.length < minLength) {
    return {
      isValid: false,
      error: `Mood seed should be at least ${minLength} characters long`
    };
  }

  if (trimmedSeed.length > maxLength) {
    return {
      isValid: false,
      error: `Mood seed should be less than ${maxLength} characters`
    };
  }

    // Check for potentially harmful content
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /[<>"']/  // Reject angle brackets and quotes
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmedSeed)) {
        return {
          isValid: false,
          error: 'Mood seed contains invalid characters (<, >, ", \'). Please use only letters, numbers, and spaces.'
        };
      }
    }

    // Check for control characters
    const controlCharPattern = /[\u0000-\u001F\u007F]/; // eslint-disable-line no-control-regex
    if (controlCharPattern.test(trimmedSeed)) {
      return {
        isValid: false,
        error: 'Mood seed contains invalid control characters. Please use only regular text.'
      };
    }

  // Check for excessive special characters (potential spam)
  if (!allowSpecialChars) {
    const specialCharCount = (trimmedSeed.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const specialCharRatio = specialCharCount / trimmedSeed.length;

    if (specialCharRatio > maxSpecialCharRatio) {
      return {
        isValid: false,
        error: 'Mood seed contains too many special characters. Please use more descriptive text.'
      };
    }
  }

  return { isValid: true };
};

/**
 * Transaction count validation
 */
export const validateTransactionCount = (
  count: number,
  options: TransactionCountValidationOptions = {}
): ValidationResult => {
  const {
    minValue = 0,
    maxValue = 100000,
    allowNegative = false
  } = options;

  if (typeof count !== 'number' || isNaN(count)) {
    return {
      isValid: false,
      error: 'Invalid transaction count. Please refresh and try again.'
    };
  }

  if (!allowNegative && count < minValue) {
    return {
      isValid: false,
      error: 'Transaction count cannot be negative.'
    };
  }

  if (count > maxValue) {
    return {
      isValid: false,
      error: 'Transaction count seems unusually high. Please verify the data.'
    };
  }

  return { isValid: true };
};

/**
 * Network connectivity validation
 */
export const validateNetworkConnection = (): ValidationResult => {
  if (!navigator.onLine) {
    return {
      isValid: false,
      error: 'No internet connection. Please check your network and try again.'
    };
  }

  return { isValid: true };
};

/**
 * IPFS configuration validation
 */
export const validateIPFSConfig = (
  apiKey?: string,
  secretKey?: string
): ValidationResult => {
  if (!apiKey || !secretKey) {
    return {
      isValid: false,
      error: 'IPFS configuration missing. Please set up IPFS credentials for NFT storage.'
    };
  }

  return { isValid: true };
};

/**
 * Wallet connection validation
 */
export const validateWalletConnection = (
  accountAddress?: string | null | undefined
): ValidationResult => {
  if (!accountAddress) {
    return {
      isValid: false,
      error: 'No wallet connected. Please connect your wallet first.'
    };
  }

  return { isValid: true };
};

/**
 * Image data validation
 */
export const validateImageData = (imageData: string): ValidationResult => {
  if (!imageData) {
    return {
      isValid: false,
      error: 'No aura generated yet. Please wait for the aura to be created.'
    };
  }

  // Check if it's a valid data URL
  try {
    new URL(imageData);
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Invalid image data format.'
    };
  }
};
