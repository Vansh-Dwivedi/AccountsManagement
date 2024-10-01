import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import './NotificationBubble.css';

const NotificationBubble = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      const socket = io(process.env.REACT_APP_API_URL);
      
      socket.on('connect', () => {
        console.log('NotificationBubble connected to Socket.IO');
        socket.emit('join', user._id);
      });

      socket.on('newNotification', () => {
        console.log('Received newNotification event');
        setUnreadCount(prevCount => prevCount + 1);
      });

      return () => {
        socket.off('newNotification');
        socket.close();
      };
    }
  }, [user]);

  return unreadCount > 0 ? (
    <div className="notification-bubble">{unreadCount}</div>
  ) : null;
};

export default NotificationBubble;