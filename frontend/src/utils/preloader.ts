/**
 * Resource preloader for better performance
 */

// Preload critical resources during idle time
export const preloadCriticalResources = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload Aptos SDK when idle (but don't execute)
      import('@aptos-labs/ts-sdk');
      
      // Preload p5.js when idle
      import('p5');
      
      // Preload wallet components (relative to src/)
      import('../components/WalletPage');
      import('../components/AuraPage');
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      import('@aptos-labs/ts-sdk');
      import('p5');
    }, 2000);
  }
};

// Prefetch resources on user interaction hints
export const prefetchOnHover = (componentName: string) => {
  const prefetchMap: Record<string, () => Promise<any>> = {
    wallet: () => import('../components/WalletPage'),
    aura: () => import('../components/AuraPage'),
    generator: () => import('../AuraGenerator'),
  };

  return prefetchMap[componentName]?.();
};

// Service worker for caching (if needed)
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};