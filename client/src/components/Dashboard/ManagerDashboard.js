import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './ManagerDashboard.css';
import ChatComponent from '../Chat/ChatComponent';
import SentRemarks from '../SentRemarks';
import io from 'socket.io-client';

const ManagerDashboard = () => {
  const [managerData, setManagerData] = useState(null);
  const [assignedClients, setAssignedClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const audioRef = useRef(new Audio('/notification.mp3'));
  const managerIdRef = useRef(null);

  useEffect(() => {
    fetchManagerData();
    fetchAssignedClients();
  }, []);

  useEffect(() => {
    if (managerData) {
      managerIdRef.current = managerData._id;
      setupSocketConnection();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [managerData]);

  const setupSocketConnection = () => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      // Register manager's user ID with the server
      socket.emit('register', { userId: managerIdRef.current });
    });

    socket.on('message', (message) => {
      console.log('New message received:', message);
      if (message.receiver === managerIdRef.current) {
        audioRef.current.play().catch((e) => console.error('Error playing sound:', e));
        setUnreadCounts((prev) => {
          const newCounts = {
            ...prev,
            [message.sender]: (prev[message.sender] || 0) + 1,
          };
          console.log('Updated unread counts:', newCounts);
          return newCounts;
        });
      }
    });

    socketRef.current = socket;
  };

  const fetchManagerData = async () => {
    try {
      const response = await api.get('/api/users/profile');
      setManagerData(response.data);
      fetchUnreadMessagesCounts(response.data._id);
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

  const fetchUnreadMessagesCounts = async (managerId) => {
    try {
      const response = await api.get(`/api/chat/unread-counts/${managerId}`);
      console.log('Fetched unread counts:', response.data);
      setUnreadCounts(response.data);
    } catch (err) {
      console.error('Error fetching unread message counts:', err);
      setError('Failed to fetch unread message counts. Please try again.');
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setUnreadCounts(prev => ({
      ...prev,
      [client._id]: 0
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleProfilePicUpload = (event) => {
    // Implement this function
    console.log('Profile pic upload not implemented yet');
  };

  const handleProfilePicDelete = () => {
    // Implement this function
    console.log('Profile pic delete not implemented yet');
  };

  if (error) return <div className="error">{error}</div>;
  if (!managerData) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="manager-dashboard">
      <h2>Manager Dashboard</h2>
      <div className="profile-section">
        {managerData.profilePic ? (
          <div className="profile-pic-container">
            <img
              src={`${process.env.REACT_APP_API_URL}/uploads/${managerData.profilePic}`}
              alt="Profile"
              className="profile-pic"
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <div className="profile-pic-placeholder">No Image</div>
        )}
        <input type="file" onChange={handleProfilePicUpload} accept="image/*" />
        {managerData.profilePic && <button onClick={handleProfilePicDelete}>Delete Picture</button>}
      </div>
      <p>Username: {managerData.username}</p>
      <p>Email: {managerData.email}</p>
      <p>Role: {managerData.role}</p>
      <button onClick={handleLogout}>Logout</button>
      <div className="dashboard-tabs">
        <button onClick={() => setActiveTab('chat')} className={activeTab === 'chat' ? 'active' : ''}>Chat</button>
        <button onClick={() => setActiveTab('remarks')} className={activeTab === 'remarks' ? 'active' : ''}>Sent Remarks</button>
      </div>
      {activeTab === 'chat' && (
        <div className="chat-section">
          <h3>Chat with Clients</h3>
          <div className="client-list">
            {assignedClients.map((client) => (
              <button 
                key={client._id}
                onClick={() => handleClientSelect(client)}
                className={`client-button ${selectedClient && selectedClient._id === client._id ? 'selected' : ''}`}
              >
                {client.username}
                {console.log('Unread count for', client.username, ':', unreadCounts[client._id])}
                {unreadCounts[client._id] > 0 && (
                  <span className="unread-bubble">{unreadCounts[client._id]}</span>
                )}
              </button>
            ))}
          </div>

          {selectedClient && (
            <div className="chat-area">
              <div className="selected-client-info">
                <h4>Selected Client</h4>
                <p>Client Name: {selectedClient.username}</p>
                <p>Client Email: {selectedClient.email}</p>
              </div>
              <ChatComponent
                currentUser={managerData}
                otherUser={selectedClient}
                socket={socketRef.current}
                onMessageSent={() => setUnreadCounts(prev => ({ ...prev, [selectedClient._id]: 0 }))}
              />
            </div>
          )}
        </div>
      )}
      {activeTab === 'remarks' && <SentRemarks />}
    </div>
  );
};

export default ManagerDashboard;
