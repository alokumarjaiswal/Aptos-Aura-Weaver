import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { NotificationData, NotificationContextType } from '../types/notifications';

// Actions for the notification reducer
type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<NotificationData, 'id' | 'timestamp' | 'read'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'CLEAR_ALL' }
  | { type: 'CLEAR_BY_CATEGORY'; payload: NotificationData['category'] }
  | { type: 'LOAD_NOTIFICATIONS'; payload: NotificationData[] };

// Initial state
interface NotificationState {
  notifications: NotificationData[];
}

const initialState: NotificationState = {
  notifications: []
};

// Local storage key prefix
const STORAGE_KEY_PREFIX = 'aptos-aura-notifications';

// Reducer function
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotification: NotificationData = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        read: false
      };
      
      const updatedNotifications = [newNotification, ...state.notifications];
      
      // Keep only the last 100 notifications to prevent memory issues
      const limitedNotifications = updatedNotifications.slice(0, 100);
      
      return {
        ...state,
        notifications: limitedNotifications
      };
    }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      };
    
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: []
      };
    
    case 'CLEAR_BY_CATEGORY':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.category !== action.payload)
      };
    
    case 'LOAD_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload
      };
    
    default:
      return state;
  }
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX);
      if (stored) {
        const notifications: NotificationData[] = JSON.parse(stored);
        dispatch({ type: 'LOAD_NOTIFICATIONS', payload: notifications });
      }
    } catch (error) {
      console.warn('Failed to load notifications from localStorage:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(state.notifications));
    } catch (error) {
      console.warn('Failed to save notifications to localStorage:', error);
    }
  }, [state.notifications]);

  // Context value
  const contextValue: NotificationContextType = {
    notifications: state.notifications,
    
    addNotification: (notification) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    },
    
    removeNotification: (id) => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    },
    
    markAsRead: (id) => {
      dispatch({ type: 'MARK_AS_READ', payload: id });
    },
    
    markAllAsRead: () => {
      dispatch({ type: 'MARK_ALL_AS_READ' });
    },
    
    clearAll: () => {
      dispatch({ type: 'CLEAR_ALL' });
    },
    
    clearByCategory: (category) => {
      dispatch({ type: 'CLEAR_BY_CATEGORY', payload: category });
    },
    
    getUnreadCount: () => {
      return state.notifications.filter(n => !n.read).length;
    },
    
    getNotificationsByCategory: (category) => {
      return state.notifications.filter(n => n.category === category);
    }
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Helper function to create notifications with common patterns
export const createNotification = {
  success: (title: string, message: string, category: NotificationData['category'] = 'system', metadata?: NotificationData['metadata']): Omit<NotificationData, 'id' | 'timestamp' | 'read'> => ({
    type: 'success',
    title,
    message,
    category,
    metadata
  }),
  
  error: (title: string, message: string, category: NotificationData['category'] = 'system', metadata?: NotificationData['metadata']): Omit<NotificationData, 'id' | 'timestamp' | 'read'> => ({
    type: 'error',
    title,
    message,
    category,
    metadata,
    persistent: true // Errors should persist until manually dismissed
  }),
  
  warning: (title: string, message: string, category: NotificationData['category'] = 'system', metadata?: NotificationData['metadata']): Omit<NotificationData, 'id' | 'timestamp' | 'read'> => ({
    type: 'warning',
    title,
    message,
    category,
    metadata
  }),
  
  info: (title: string, message: string, category: NotificationData['category'] = 'system', metadata?: NotificationData['metadata']): Omit<NotificationData, 'id' | 'timestamp' | 'read'> => ({
    type: 'info',
    title,
    message,
    category,
    metadata
  }),
  
  walletConnected: (address?: string): Omit<NotificationData, 'id' | 'timestamp' | 'read'> => ({
    type: 'success',
    title: 'Wallet Connected',
    message: address ? `Successfully connected to wallet: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Successfully connected to wallet',
    category: 'wallet',
    metadata: { walletAddress: address }
  }),
  
  walletDisconnected: (): Omit<NotificationData, 'id' | 'timestamp' | 'read'> => ({
    type: 'info',
    title: 'Wallet Disconnected',
    message: 'Wallet has been disconnected',
    category: 'wallet'
  }),
  
  nftMinted: (tokenName: string, transactionHash?: string, demoMode?: boolean): Omit<NotificationData, 'id' | 'timestamp' | 'read'> => ({
    type: 'success',
    title: demoMode ? 'NFT Minted (Demo Mode)' : 'NFT Minted Successfully',
    message: demoMode
      ? `Your aura NFT "${tokenName}" has been minted in demo mode! (IPFS not configured)`
      : `Your aura NFT "${tokenName}" has been minted!`,
    category: 'nft',
    metadata: { nftTokenName: tokenName, transactionHash, actionType: 'mint', demoMode }
  }),
  
  transactionComplete: (type: string, details: string, transactionHash?: string): Omit<NotificationData, 'id' | 'timestamp' | 'read'> => ({
    type: 'success',
    title: `${type} Complete`,
    message: details,
    category: 'transaction',
    metadata: { transactionHash, actionType: type.toLowerCase() }
  }),
  
  dataFetched: (dataType: string, count?: number): Omit<NotificationData, 'id' | 'timestamp' | 'read'> => ({
    type: 'success',
    title: 'Data Fetched',
    message: count !== undefined ? `Found ${count} ${dataType}` : `${dataType} data retrieved`,
    category: 'system',
    metadata: { actionType: 'fetch', dataType }
  })
};
