import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './NotificationBubble.css';

const NotificationBubble = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.emit('join', userId);

    socket.on('newMessage', () => {
      setUnreadCount((prevCount) => prevCount + 1);
    });

    return () => socket.close();
  }, [userId]);

  return unreadCount > 0 ? (
    <div className="notification-bubble">{unreadCount}</div>
  ) : null;
};

export default NotificationBubble;
