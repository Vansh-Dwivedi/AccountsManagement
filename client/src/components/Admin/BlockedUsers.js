import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

function BlockedUsers() {
  const [users, setUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchBlockedUsers();
  }, []);

  const fetchUsers = async () => {
    const response = await api.get('/users');
    setUsers(response.data);
  };

  const fetchBlockedUsers = async () => {
    const response = await api.get('/blocked-users');
    setBlockedUsers(response.data);
  };

  const blockUser = async (userId) => {
    await api.post('/block-user', { userId });
    fetchUsers();
    fetchBlockedUsers();
  };

  const unblockUser = async (userId) => {
    await api.post('/unblock-user', { userId });
    fetchUsers();
    fetchBlockedUsers();
  };

  return (
    <div>
      <h2>Manage Blocked Users</h2>
      <h3>All Users</h3>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.username} 
            <button onClick={() => blockUser(user.id)}>Block</button>
          </li>
        ))}
      </ul>
      <h3>Blocked Users</h3>
      <ul>
        {blockedUsers.map(user => (
          <li key={user.id}>
            {user.username} 
            <button onClick={() => unblockUser(user.id)}>Unblock</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BlockedUsers;