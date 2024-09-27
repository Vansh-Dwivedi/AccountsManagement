import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ClientInfoForm from '../ClientInfoForm';
import './ClientDashboard.css';
import ChatComponent from '../Chat/ChatComponent';
import NotificationBubble from '../NotificationBubble'; // Update this line
import { AuthContext } from '../../context/AuthContext';

const ClientDashboard = () => {
  const { user } = useContext(AuthContext);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [adminUser, setAdminUser] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [profilePic, setProfilePic] = useState(null); // Add this line

  useEffect(() => {
    fetchClientData();
    fetchAdminUser();
  }, []);

  const fetchClientData = async () => {
    try {
      const response = await api.get('/api/users/profile');
      setClientData(response.data);
      setProfilePic(response.data.profilePic);
      console.log('Client data:', response.data);
      if (!response.data.assignedManager) {
        console.warn('No assigned manager for this client');
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="client-dashboard">
      <h2>Welcome to Your Client Dashboard</h2>
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
      <div className="tabs">
        <button onClick={() => setActiveTab('profile')}>Profile</button>
        <button onClick={() => setActiveTab('submitInfo')}>Submit Info</button>
        <NotificationBubble userId={clientData._id} />
        <button onClick={() => setActiveTab('chat')} className="chat-button">
          Chat with Manager
        </button>
        <button onClick={() => setActiveTab('adminChat')} disabled={!adminUser}>
          Chat with Admin
        </button>
      </div>
      {activeTab === 'profile' && (
        <div>
          <p>Username: {clientData.username}</p>
          <p>Email: {clientData.email}</p>
          <p>Role: {clientData.role}</p>
          {clientData.assignedManager ? (
            <p>Assigned Manager: {clientData.assignedManager.username}</p>
          ) : (
            <p>No manager assigned yet.</p>
          )}
        </div>
      )}
      {activeTab === 'submitInfo' && <ClientInfoForm />}
      {activeTab === 'chat' && clientData.assignedManager && (
        <ChatComponent 
          currentUser={clientData} 
          otherUser={clientData.assignedManager}
          onClose={() => setActiveTab('profile')}
        />
      )}
      {activeTab === 'adminChat' && adminUser && (
        <ChatComponent 
          currentUser={clientData} 
          otherUser={adminUser}
          onClose={() => setActiveTab('profile')}
        />
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default ClientDashboard;