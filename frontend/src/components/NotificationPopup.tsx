import React, { useEffect, useState } from 'react';
import { NotificationData, NotificationIcons } from '../types/notifications';
import './NotificationPopup.css';

interface NotificationPopupProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ 
  notification, 
  onDismiss 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show the notification with a small delay for smoother animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    // Auto-dismiss after duration unless it's persistent
    if (!notification.persistent) {
      const dismissTimer = setTimeout(() => {
        handleDismiss();
      }, notification.type === 'error' ? 6000 : 4000); // Errors stay longer

      return () => {
        clearTimeout(showTimer);
        clearTimeout(dismissTimer);
      };
    }

    return () => clearTimeout(showTimer);
  }, [notification.id]); // Only depend on notification ID

  const handleDismiss = () => {
    if (isExiting) return; // Prevent double dismissal
    
    setIsExiting(true);
    setIsVisible(false);
    
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Wait for fade out animation
  };

  return (
    <div className={`notification-popup ${notification.type} ${isVisible ? 'visible' : ''}`}>
      <div className="popup-icon">
        {NotificationIcons[notification.type]}
      </div>
      
      <div className="popup-content">
        <div className="popup-title">{notification.title}</div>
        <div className="popup-message">{notification.message}</div>
      </div>
      
      <button 
        className="popup-close"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationPopup;
