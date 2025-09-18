import React, { useEffect, useState, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationPopup } from './NotificationPopup';
import { NotificationData } from '../types/notifications';

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotifications();
  const [activePopups, setActivePopups] = useState<NotificationData[]>([]);
  const lastNotificationCountRef = useRef(0);

  useEffect(() => {
    // Only show popup for new notifications
    if (notifications.length > lastNotificationCountRef.current) {
      const latestNotification = notifications[0]; // Get the most recent notification
      
      // Check if this notification is already shown as popup
      const isAlreadyShown = activePopups.some(popup => popup.id === latestNotification.id);
      
      if (!isAlreadyShown) {
        setActivePopups(prev => {
          // Keep max 3 popups, remove oldest if needed
          const updated = [latestNotification, ...prev];
          return updated.slice(0, 3);
        });
      }
    }
    
    lastNotificationCountRef.current = notifications.length;
  }, [notifications.length, notifications[0]?.id]); // Depend on count and latest notification ID

  const dismissPopup = (id: string) => {
    setActivePopups(prev => prev.filter(popup => popup.id !== id));
  };

  return (
    <div className="notification-container">
      {activePopups.map((notification, index) => (
        <div 
          key={notification.id} 
          className="notification-popup-wrapper"
          style={{ 
            transform: `translateY(${index * 90}px)`,
            zIndex: 1001 - index
          }}
        >
          <NotificationPopup
            notification={notification}
            onDismiss={dismissPopup}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
