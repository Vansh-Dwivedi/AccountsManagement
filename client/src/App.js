import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import RoleBasedRoute from './components/RoleBasedRoute';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import ManagerDashboard from './components/Dashboard/ManagerDashboard';
import UserDashboard from './components/Dashboard/UserDashboard';
import ClientDashboard from './components/Dashboard/ClientDashboard';
// Add imports for new dashboard components
import OfficeHeadDashboard from './components/Dashboard/OfficeHeadDashboard';
import HeadDirectorDashboard from './components/Dashboard/HeadDirectorDashboard';
import MasterDeptDashboard from './components/Dashboard/MasterDeptDashboard';
import OperatorDashboard from './components/Dashboard/OperatorDashboard';
import HelperDashboard from './components/Dashboard/HelperDashboard';
import Unauthorized from './components/Unauthorized';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Existing routes */}
          <Route
            path="/admin-dashboard"
            element={<RoleBasedRoute component={AdminDashboard} allowedRoles={['admin']} />}
          />
          <Route
            path="/manager-dashboard"
            element={<RoleBasedRoute component={ManagerDashboard} allowedRoles={['manager']} />}
          />
          <Route
            path="/user-dashboard"
            element={<RoleBasedRoute component={UserDashboard} allowedRoles={['user']} />}
          />
          <Route
            path="/client-dashboard"
            element={<RoleBasedRoute component={ClientDashboard} allowedRoles={['client']} />}
          />
          {/* New routes for additional roles */}
          <Route
            path="/office-head-dashboard"
            element={<RoleBasedRoute component={OfficeHeadDashboard} allowedRoles={['office_head']} />}
          />
          <Route
            path="/head-director-dashboard"
            element={<RoleBasedRoute component={HeadDirectorDashboard} allowedRoles={['head_director']} />}
          />
          <Route
            path="/master-dept-dashboard"
            element={<RoleBasedRoute component={MasterDeptDashboard} allowedRoles={['master_dept_a', 'master_dept_b', 'master_dept_c', 'master_dept_d', 'master_dept_e']} />}
          />
          <Route
            path="/operator-dashboard"
            element={<RoleBasedRoute component={OperatorDashboard} allowedRoles={['operator_a', 'operator_b', 'operator_c', 'operator_d']} />}
          />
          <Route
            path="/helper-dashboard"
            element={<RoleBasedRoute component={HelperDashboard} allowedRoles={['helper']} />}
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;