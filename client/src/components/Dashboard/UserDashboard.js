import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Header from '../Header';

const UserDashboard = () => {
  const [profilePic, setProfilePic] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfilePic();
  }, []);

  const fetchProfilePic = async () => {
    try {
      const response = await api.get('/api/users/profile');
      setProfilePic(response.data.profilePic);
    } catch (error) {
      console.error('Error fetching profile picture:', error);
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

  return (
    <div>
      <h2>User Dashboard</h2>
      <Header />
      <div className="profile-section">
        {profilePic ? (
          <img src={profilePic} alt="Profile" className="profile-pic" />
        ) : (
          <div className="profile-pic-placeholder">No Image</div>
        )}
        <input type="file" onChange={handleProfilePicUpload} accept="image/*" />
        {profilePic && <button onClick={handleProfilePicDelete}>Delete Picture</button>}
      </div>
      <button onClick={handleLogout}>Logout</button>
      {/* Add user-specific content here */}
    </div>
  );
};

export default UserDashboard;