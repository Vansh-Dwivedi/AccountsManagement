import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./ManagerDashboard.css";
import ChatComponent from "../Chat/ChatComponent";
import io from "socket.io-client";
import NotificationBubble from "../NotificationBubble";
import Header from "../Header";

const ManagerDashboard = () => {
  const [managerData, setManagerData] = useState(null);
  const [assignedClients, setAssignedClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profilePic, setProfilePic] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [openChats, setOpenChats] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    setIsSidebarOpen(!isSidebarOpen);
    document.body.classList.toggle("sidebar-open");
  };

  const navigate = useNavigate();

  useEffect(() => {
    fetchManagerData();
    fetchAssignedClients();
    fetchAdminUser();

    // Set up socket connection
    socketRef.current = io(
      process.env.REACT_APP_API_URL || "http://localhost:5000"
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (managerData && socketRef.current) {
      socketRef.current.emit("join", managerData._id);

      socketRef.current.on("newMessage", (message) => {
        if (message.receiver === managerData._id) {
          setUnreadCounts((prev) => ({
            ...prev,
            [message.sender]: (prev[message.sender] || 0) + 1,
          }));
        }
      });

      return () => {
        socketRef.current.off("newMessage");
      };
    }
  }, [managerData]);

  const fetchManagerData = async () => {
    try {
      const response = await api.get("/api/users/profile");
      setManagerData(response.data);
      setProfilePic(response.data.profilePic);
    } catch (err) {
      console.error("Error fetching manager data:", err);
      setError("Failed to fetch manager data. Please try again.");
      if (err.response && err.response.status === 401) {
        navigate("/login");
      }
    }
  };

  const fetchAssignedClients = async () => {
    try {
      const response = await api.get("/api/users/assigned-clients");
      setAssignedClients(response.data);
    } catch (err) {
      console.error("Error fetching assigned clients:", err);
      setError("Failed to fetch assigned clients. Please try again.");
    }
  };

  const fetchAdminUser = async () => {
    try {
      const response = await api.get("/api/users/admin");
      setAdminUser(response.data);
    } catch (error) {
      console.error("Error fetching admin user:", error);
    }
  };

  const handleClientSelect = (client) => {
    setOpenChats((prevChats) => ({
      ...prevChats,
      [client._id]: true,
    }));
    setSelectedClient(client);
    setActiveTab("chat");
    setUnreadCounts((prev) => ({ ...prev, [client._id]: 0 }));
  };

  const handleCloseChat = (clientId) => {
    setOpenChats((prevChats) => {
      const newChats = { ...prevChats };
      delete newChats[clientId];
      return newChats;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const response = await api.post("/api/users/profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfilePic(response.data.profilePic);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    }
  };

  const handleProfilePicDelete = async () => {
    try {
      await api.delete("/api/users/profile-pic");
      setProfilePic(null);
    } catch (error) {
      console.error("Error deleting profile picture:", error);
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (!managerData) return <div className="loading">Loading...</div>;

  return (
    <>
      <Header />
      <div className="manager-dashboard">
        <div className="sidebar-toggle-button-container">
          <button className="drawer-toggle-button" onClick={toggleDrawer}>
            ☰
          </button>
        </div>

        <div className={`sidebar ${isDrawerOpen ? "active" : ""}`}>
          <div className="profile-section">
            {profilePic ? (
              <div className="profile-pic-container">
                <img
                  src={`${process.env.REACT_APP_API_URL}/uploads/${profilePic}`}
                  alt="Profile"
                  className="profile-pic"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div className="profile-pic-placeholder">No Image</div>
            )}
            <input
              type="file"
              onChange={handleProfilePicUpload}
              accept="image/*"
            />
            {profilePic && (
              <button onClick={handleProfilePicDelete}>Delete Picture</button>
            )}
          </div>
          <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button onClick={() => setActiveTab("chat")}>Chat</button>
          <button onClick={handleLogout}>Logout</button>
          <button onClick={() => setActiveTab("adminChat")}>
            Chat with Admin
          </button>
        </div>

        <div className="main-content">
          <div className="dashboard-content">
            <div className="main-content">
              <br />
              <br />
              <h2>Manager Dashboard</h2>
              {activeTab === "dashboard" && (
                <div className="dashboard-info">
                  <h3>Welcome, {managerData.username}</h3>
                  <p>Email: {managerData.email}</p>
                  <p>Role: {managerData.role}</p>
                  <h4>Assigned Clients:</h4>
                  <ul>
                    {assignedClients.map((client) => (
                      <li key={client._id}>{client.username}</li>
                    ))}
                  </ul>
                </div>
              )}
              <NotificationBubble userId={managerData._id} />
              {activeTab === "chat" && (
                <div className="chat-section">
                  <h3>Chat with Clients</h3>
                  <div className="client-list">
                    {assignedClients.map((client) => (
                      <button
                        key={client._id}
                        onClick={() => handleClientSelect(client)}
                        className={`client-button ${
                          openChats[client._id] ? "selected" : ""
                        }`}
                      >
                        {client.username}
                        {unreadCounts[client._id] > 0 && (
                          <span className="unread-bubble">
                            {unreadCounts[client._id]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="chat-windows">
                    {Object.entries(openChats).map(([clientId, isOpen]) => {
                      if (!isOpen) return null;
                      const client = assignedClients.find(
                        (c) => c._id === clientId
                      );
                      if (!client) return null;
                      return (
                        <div key={clientId} className="chat-window">
                          <ChatComponent
                            currentUser={managerData}
                            otherUser={client}
                            onClose={() => handleCloseChat(clientId)}
                            chatId={`${managerData._id}-${client._id}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {activeTab === "adminChat" && adminUser && (
                <ChatComponent
                  currentUser={managerData}
                  otherUser={adminUser}
                  onClose={() => setActiveTab("dashboard")}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={toggleDrawer}
      ></div>
    </>
  );
};

export default ManagerDashboard;
