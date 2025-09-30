import React, { Suspense } from 'react';

// Loading component for better UX during async imports
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="loading-container">
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  </div>
);

// Lazy loading wrapper with error boundary
export const withLazyLoading = <P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = React.lazy(importFn);
  
  return React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
};

// Pre-built lazy components
export const LazyAuraGenerator = withLazyLoading(
  () => import('../AuraGenerator'),
  <LoadingSpinner message="Loading Aura Generator..." />
);

export const LazyWalletPage = withLazyLoading(
  () => import('./WalletPage'),
  <LoadingSpinner message="Loading Wallet..." />
);

export const LazyAuraPage = withLazyLoading(
  () => import('./AuraPage'),
  <LoadingSpinner message="Loading Aura Creator..." />
);

export default LoadingSpinner;