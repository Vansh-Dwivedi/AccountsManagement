import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ClientInfoForm from '../ClientInfoForm';
import './ClientDashboard.css';
import ChatComponent from '../Chat/ChatComponent';


const ClientDashboard = () => {
  const [clientData, setClientData] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchClientData();
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

  if (!clientData) return <div>Loading...</div>;

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
      </div>
      {activeTab === 'profile' && (
        <div>
          <p>Username: {clientData.username}</p>
          <p>Email: {clientData.email}</p>
          <p>Role: {clientData.role}</p>
        </div>
      )}
      {activeTab === 'submitInfo' && <ClientInfoForm />}
      <button onClick={handleLogout}>Logout</button>
      <ChatComponent 
        currentUser={clientData} 
        otherUser={clientData.assignedManager ? 
          { _id: clientData.assignedManager._id, role: 'manager' } : 
          null
        } 
      />
    </div>
  );
};

export default ClientDashboard;