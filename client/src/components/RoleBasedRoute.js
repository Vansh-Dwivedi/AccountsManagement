import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const RoleBasedRoute = ({ component: Component, allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const userRole = decodedToken.user.role;

    if (allowedRoles.includes(userRole)) {
      return <Component />;
    } else {
      console.log('Unauthorized access attempt. User role:', userRole, 'Allowed roles:', allowedRoles);
      console.log('Role:', userRole);
      return <Navigate to="/unauthorized" />;
    }
  } catch (error) {
    console.error('Error decoding token:', error);
    localStorage.removeItem('token');
    return <Navigate to="/login" />;
  }
};

export default RoleBasedRoute;