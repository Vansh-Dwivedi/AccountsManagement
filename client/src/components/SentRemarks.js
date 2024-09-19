import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './SentRemarks.css';

const SentRemarks = () => {
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRemarks();
  }, []);

  const fetchRemarks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/chat/sent-remarks');
      setRemarks(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching sent remarks:', error);
      setError('Failed to fetch sent remarks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (remarkId, newStatus) => {
    try {
      await api.put(`/api/chat/remarks/${remarkId}`, { status: newStatus });
      fetchRemarks();
    } catch (error) {
      console.error('Error updating remark status:', error);
      setError('Failed to update remark status. Please try again.');
    }
  };

  if (loading) return <div>Loading sent remarks...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="sent-remarks">
      <h3>Sent Remarks</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Remarks</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {remarks.map((remark) => (
            <tr key={remark._id}>
              <td>{new Date(remark.submittedAt).toLocaleString()}</td>
              <td>{remark.clientId.username}</td>
              <td>{remark.remarks}</td>
              <td>{remark.status}</td>
              <td>
                <select
                  value={remark.status}
                  onChange={(e) => handleStatusChange(remark._id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SentRemarks;