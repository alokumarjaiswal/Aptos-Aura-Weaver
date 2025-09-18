export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  category: 'wallet' | 'transaction' | 'nft' | 'system' | 'user';
  read: boolean;
  persistent?: boolean; // If true, won't auto-dismiss
  metadata?: {
    transactionHash?: string;
    walletAddress?: string;
    nftTokenName?: string;
    actionType?: string;
    [key: string]: any;
  };
}

export interface ActivityTimelineItem extends NotificationData {
  duration?: number; // How long the action took
  relatedNotifications?: string[]; // IDs of related notifications
}

export interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearByCategory: (category: NotificationData['category']) => void;
  getUnreadCount: () => number;
  getNotificationsByCategory: (category: NotificationData['category']) => NotificationData[];
}

export const NotificationIcons = {
  success: '✅',
  error: '❌', 
  warning: '⚠️',
  info: 'ℹ️'
} as const;

export const CategoryIcons = {
  wallet: '👛',
  transaction: '🔄',
  nft: '🎨',
  system: '⚙️',
  user: '👤'
} as const;
