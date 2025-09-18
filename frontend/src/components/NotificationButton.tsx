import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationButton.css';

interface NotificationButtonProps {
  onClick: () => void;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({ onClick }) => {
  const { getUnreadCount } = useNotifications();
  const unreadCount = getUnreadCount();

  return (
    <button
      className="notification-button"
      onClick={onClick}
      title={`Activity Timeline${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      aria-label={`Open notification center${unreadCount > 0 ? ` with ${unreadCount} unread notifications` : ''}`}
    >
      <div className="notification-bell-icon">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        
        {unreadCount > 0 && (
          <div className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>
    </button>
  );
};

export default NotificationButton;
