import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import UserDashboard from './UserDashboard';

const Dashboard = () => {
  const { authState } = useContext(AuthContext);

  switch (authState.user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    default:
      return <UserDashboard />;
  }
};

export default Dashboard;