/**
 * Configuration helper for automatic environment detection
 */

export const config = {
  /**
   * Get the appropriate backend URL based on environment
   */
  getBackendUrl: (): string => {
    // Always try production URL first if it's available
    const productionUrl = process.env.REACT_APP_BACKEND_URL_PRODUCTION;
    const developmentUrl = process.env.REACT_APP_BACKEND_URL_DEVELOPMENT || 'http://localhost:3001';
    
    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hostname: window.location.hostname,
      productionUrl,
      developmentUrl
    });
    
    // If we have a production URL and it's not a placeholder, try it first
    if (productionUrl && productionUrl !== 'https://your-railway-app.up.railway.app') {
      console.log('🎯 Attempting to use production backend:', productionUrl);
      return productionUrl;
    }
    
    console.log('🔧 Using development backend:', developmentUrl);
    return developmentUrl;
  },

  /**
   * Check if we're in development mode
   */
  isDevelopment: (): boolean => {
    return process.env.NODE_ENV !== 'production' && 
           window.location.hostname === 'localhost';
  },

  /**
   * Get all possible backend URLs to try (in priority order)
   */
  getAllBackendUrls: (): string[] => {
    return [
      process.env.REACT_APP_BACKEND_URL_PRODUCTION,
      process.env.REACT_APP_BACKEND_URL_DEVELOPMENT,
      'http://localhost:3001',
      'http://localhost:3002'
    ].filter(Boolean).filter(url => url !== 'https://your-railway-app.up.railway.app') as string[];
  }
};

export default config;