import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/api";
import { formatDistanceToNow } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import io from "socket.io-client";
import "./Header.css";
import NotificationBubble from "./NotificationBubble";

const Header = () => {
  const { user } = useContext(AuthContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchProfilePic();

      const socket = io(process.env.REACT_APP_API_URL);

      socket.on("connect", () => {
        console.log("Header connected to Socket.IO");
        socket.emit("join", user._id);
      });

      socket.on("newNotification", (notification) => {
        console.log("New notification received:", notification);
        fetchNotifications(); // Re-fetch all notifications
      });

      return () => socket.close();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/notifications");
      console.log("Fetched notifications:", response.data);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfilePic = async () => {
    try {
      const response = await api.get("/api/users/profile");
      setProfilePic(response.data.profilePic);
    } catch (error) {
      console.error("Error fetching profile picture:", error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  if (!user) {
    return null;
  }

  return (
    <header className="app-header">
      <div className="user-info">
        {profilePic ? (
          <img
            src={`${process.env.REACT_APP_API_URL}/uploads/${profilePic}`}
            alt="Profile"
            className="header-profile-pic"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="header-profile-pic-placeholder">No Image</div>
        )}
        <span className="username">{user.username}</span>
      </div>
      <div className="notification-area">
        <NotificationBubble />
        <FontAwesomeIcon
          icon={faBell}
          onClick={toggleNotifications}
          className="bell-icon"
        />
        {showNotifications && (
          <div className="notifications-dropdown">
            {isLoading ? (
              <div className="loading">Loading notifications...</div>
            ) : notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div
                  className="notification-item"
                  key={index}
                >
                  {notification && notification.senderProfilePic && (
                    <img
                      src={`${process.env.REACT_APP_API_URL}/uploads/${notification.senderProfilePic}`}
                      alt="Sender"
                      className="notification-sender-pic"
                      crossOrigin="anonymous"
                    />
                  )}
                  <div className="notification-content">
                    <strong>{notification && notification.message}</strong>
                    <small className="timestamp">
                      {notification &&
                        notification.createdAt &&
                        formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notifications">No notifications yet</div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
