import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data.user.isBlocked) {
        setError('Your account has been blocked. Please contact an administrator.');
        return;
      }
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        navigateToDashboard(response.data.user.role);
      } else {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        navigateToDashboard(response.data.user.role);
      }
    } catch (error) {
      console.error('Login error:', error.response?.data?.error || error.message);
      setError(error.response?.data?.error || 'An error occurred during login');
    }
  };

  const navigateToDashboard = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'manager':
        navigate('/manager-dashboard');
        break;
      case 'client':
        navigate('/client-dashboard');
        break;
      case 'user':
      default:
        navigate('/user-dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;