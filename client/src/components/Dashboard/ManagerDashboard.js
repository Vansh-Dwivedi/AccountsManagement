import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './ManagerDashboard.css';
import ChatComponent from '../Chat/ChatComponent';
import io from 'socket.io-client';
import NotificationBubble from '../NotificationBubble';

const ManagerDashboard = () => {
  const [managerData, setManagerData] = useState(null);
  const [assignedClients, setAssignedClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profilePic, setProfilePic] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [openChats, setOpenChats] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [socket, setSocket] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchManagerData();
    fetchAssignedClients();
    fetchAdminUser();

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (socket && managerData) {
      socket.emit('join', managerData._id);

      socket.on('newMessage', (message) => {
        if (message.receiver === managerData._id) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.sender]: (prev[message.sender] || 0) + 1
          }));
        }
      });
    }
  }, [socket, managerData]);

  const fetchManagerData = async () => {
    try {
      const response = await api.get('/api/users/profile');
      setManagerData(response.data);
      setProfilePic(response.data.profilePic);
    } catch (err) {
      console.error('Error fetching manager data:', err);
      setError('Failed to fetch manager data. Please try again.');
      if (err.response && err.response.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchAssignedClients = async () => {
    try {
      const response = await api.get('/api/users/assigned-clients');
      setAssignedClients(response.data);
    } catch (err) {
      console.error('Error fetching assigned clients:', err);
      setError('Failed to fetch assigned clients. Please try again.');
    }
  };

  const fetchAdminUser = async () => {
    try {
      const response = await api.get('/api/users/admin');
      setAdminUser(response.data);
    } catch (error) {
      console.error('Error fetching admin user:', error);
    }
  };

  const handleClientSelect = (client) => {
    setOpenChats(prevChats => ({
      ...prevChats,
      [client._id]: true
    }));
    setSelectedClient(client);
    setActiveTab('chat');
    setUnreadCounts(prev => ({ ...prev, [client._id]: 0 }));
  };

  const handleCloseChat = (clientId) => {
    setOpenChats(prevChats => {
      const newChats = { ...prevChats };
      delete newChats[clientId];
      return newChats;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      const response = await api.post('/api/users/profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfilePic(response.data.profilePic);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  };

  const handleProfilePicDelete = async () => {
    try {
      await api.delete('/api/users/profile-pic');
      setProfilePic(null);
    } catch (error) {
      console.error('Error deleting profile picture:', error);
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (!managerData) return <div className="loading">Loading...</div>;

  return (
    <div className="manager-dashboard">
      <h2>Manager Dashboard</h2>
      <div className="dashboard-content">
        <div className="sidebar">
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
            <input type="file" onChange={handleProfilePicUpload} accept="image/*" />
            {profilePic && <button onClick={handleProfilePicDelete}>Delete Picture</button>}
          </div>
          <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button onClick={() => setActiveTab('chat')}>Chat</button>
          <button onClick={handleLogout}>Logout</button>
          <button onClick={() => setActiveTab('adminChat')}>Chat with Admin</button>
        </div>
        <div className="main-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-info">
              <h3>Welcome, {managerData.username}</h3>
              <p>Email: {managerData.email}</p>
              <p>Role: {managerData.role}</p>
              <h4>Assigned Clients:</h4>
              <ul>
                {assignedClients.map(client => (
                  <li key={client._id}>{client.username}</li>
                ))}
              </ul>
            </div>
          )}
          <NotificationBubble userId={managerData._id} />
          {activeTab === 'chat' && (
            <div className="chat-section">
              <h3>Chat with Clients</h3>
              <div className="client-list">
                {assignedClients.map((client) => (
                  <button 
                    key={client._id}
                    onClick={() => handleClientSelect(client)}
                    className={`client-button ${openChats[client._id] ? 'selected' : ''}`}
                  >
                    {client.username}
                    {unreadCounts[client._id] > 0 && (
                      <span className="unread-bubble">{unreadCounts[client._id]}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="chat-windows">
                {Object.entries(openChats).map(([clientId, isOpen]) => {
                  if (!isOpen) return null;
                  const client = assignedClients.find(c => c._id === clientId);
                  if (!client) return null;
                  return (
                    <div key={clientId} className="chat-window">
                      <ChatComponent
                        currentUser={managerData}
                        otherUser={client}
                        onClose={() => handleCloseChat(clientId)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {activeTab === 'adminChat' && adminUser && (
            <ChatComponent
              currentUser={managerData}
              otherUser={adminUser}
              onClose={() => setActiveTab('dashboard')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
