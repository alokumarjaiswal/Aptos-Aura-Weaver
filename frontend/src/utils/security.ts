/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 1000); // Limit length
};

/**
 * Validate file types for upload security
 */
export const isValidImageFile = (file: File): boolean => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  return allowedTypes.includes(file.type) && file.size <= maxSize;
};

/**
 * Validate environment variables are properly set
 */
export const validateEnvironment = (): { isValid: boolean; missing: string[] } => {
  const required = ['REACT_APP_APTOS_NETWORK', 'REACT_APP_APTOS_NODE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

/**
 * Generate secure random seed for aura generation
 */
export const generateSecureRandomSeed = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};