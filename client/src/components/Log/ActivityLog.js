import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  return (
    <div>
      <h2>Activity Log</h2>
      <ul>
        {logs.map((log) => (
          <li key={log._id}>
            {log.user.username} - {log.action} - {new Date(log.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityLog;