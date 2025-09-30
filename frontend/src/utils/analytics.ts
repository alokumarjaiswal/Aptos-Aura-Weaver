/**
 * Analytics and monitoring utilities
 */

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

class Analytics {
  private isEnabled: boolean;
  private userId: string | null = null;
  private sessionId: string;

  constructor() {
    this.isEnabled = process.env.REACT_APP_ENABLE_ANALYTICS === 'true' && process.env.NODE_ENV === 'production';
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  track(event: AnalyticsEvent): void {
    if (!this.isEnabled) return;

    const payload = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.pathname,
      userAgent: navigator.userAgent,
    };

    // In a real app, send to analytics service
    console.log('Analytics Event:', payload);
    
    // Could integrate with Google Analytics, Mixpanel, etc.
    // Example: gtag('event', event.action, { ... });
  }

  trackPageView(page: string): void {
    this.track({
      action: 'page_view',
      category: 'navigation',
      label: page
    });
  }

  trackWalletConnection(walletType: string): void {
    this.track({
      action: 'wallet_connect',
      category: 'wallet',
      label: walletType
    });
  }

  trackNFTMint(success: boolean, duration?: number): void {
    this.track({
      action: 'nft_mint',
      category: 'nft',
      label: success ? 'success' : 'failure',
      value: duration
    });
  }

  trackError(error: Error, context?: string): void {
    this.track({
      action: 'error',
      category: 'error',
      label: error.message,
      metadata: {
        stack: error.stack,
        context
      }
    });
  }
}

export const analytics = new Analytics();

// Performance monitoring
export const performanceMonitor = {
  startTimer: (name: string): (() => number) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      analytics.track({
        action: 'performance',
        category: 'timing',
        label: name,
        value: Math.round(duration)
      });
      return duration;
    };
  },

  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const endTimer = performanceMonitor.startTimer(name);
    try {
      const result = await fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }
};