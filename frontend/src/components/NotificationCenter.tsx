import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationData, NotificationIcons, CategoryIcons } from '../types/notifications';
import './NotificationCenter.css';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearByCategory,
    getUnreadCount
  } = useNotifications();

  const [selectedCategory, setSelectedCategory] = useState<NotificationData['category'] | 'all'>('all');

  // Filter notifications based on category
  const filteredNotifications = notifications.filter(notification => {
    return selectedCategory === 'all' || notification.category === selectedCategory;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, NotificationData[]>);

  // Get category counts
  const categoryCounts = notifications.reduce((counts, notification) => {
    counts[notification.category] = (counts[notification.category] || 0) + 1;
    return counts;
  }, {} as Record<NotificationData['category'], number>);

  // Format relative time
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notification-center-header">
          <div className="notification-center-title">
            <h2>Activity Timeline</h2>
            <span className="notification-count">
              {getUnreadCount() > 0 && (
                <span className="unread-badge">{getUnreadCount()}</span>
              )}
            </span>
          </div>
          
          <div className="notification-center-actions">
            {notifications.length > 0 && (
              <>
                <button
                  className="btn-action"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  Mark all read
                </button>
                <button
                  className="btn-action btn-danger"
                  onClick={clearAll}
                  title="Clear all notifications"
                >
                  Clear all
                </button>
              </>
            )}
            <button
              className="btn-close"
              onClick={onClose}
              aria-label="Close notification center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Simple Filters */}
        <div className="notification-center-filters">
          <div className="category-filters">
            <button
              className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All ({notifications.length})
            </button>
            
            {(['wallet', 'nft', 'system'] as const).map(category => {
              const count = categoryCounts[category] || 0;
              if (count === 0) return null;
              
              return (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {CategoryIcons[category]} {category} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        <div className="notification-center-content">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              {notifications.length === 0 ? (
                <>
                  <div className="empty-icon">🔔</div>
                  <h3>No notifications yet</h3>
                  <p>Your activity timeline will appear here as you use the app.</p>
                </>
              ) : (
                <>
                  <div className="empty-icon">📂</div>
                  <h3>No notifications in this category</h3>
                  <p>Try selecting a different category.</p>
                </>
              )}
            </div>
          ) : (
            <div className="notifications-timeline">
              {Object.entries(groupedNotifications).map(([date, dayNotifications]) => (
                <div key={date} className="notification-day-group">
                  <div className="day-separator">
                    <span className="day-label">{date}</span>
                  </div>
                  
                  {dayNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${notification.type} ${!notification.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">
                        {NotificationIcons[notification.type]}
                      </div>
                      
                      <div className="notification-content">
                        <div className="notification-header">
                          <h4 className="notification-title">{notification.title}</h4>
                          <div className="notification-meta">
                            <span className="notification-category">
                              {CategoryIcons[notification.category]}
                            </span>
                            <span className="notification-time">
                              {formatRelativeTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="notification-message">{notification.message}</p>
                        
                        {notification.metadata && (
                          <div className="notification-metadata">
                            {notification.metadata.transactionHash && (
                              <span className="metadata-item">
                                Tx: {notification.metadata.transactionHash.slice(0, 8)}...
                              </span>
                            )}
                            {notification.metadata.nftTokenName && (
                              <span className="metadata-item">
                                Token: {notification.metadata.nftTokenName}
                              </span>
                            )}
                            {notification.metadata.walletAddress && (
                              <span className="metadata-item">
                                Wallet: {notification.metadata.walletAddress.slice(0, 6)}...
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="notification-actions">
                        {!notification.read && (
                          <button
                            className="btn-mark-read"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          className="btn-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          title="Remove notification"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedCategory !== 'all' && filteredNotifications.length > 0 && (
          <div className="notification-center-footer">
            <button
              className="btn-action"
              onClick={() => clearByCategory(selectedCategory as NotificationData['category'])}
            >
              Clear {selectedCategory} notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
