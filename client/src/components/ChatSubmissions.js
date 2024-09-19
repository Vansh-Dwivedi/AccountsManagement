import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './ChatSubmissions.css';

const ChatSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/chat/submissions');
      setSubmissions(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching chat submissions:', error);
      setError('Failed to fetch chat submissions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (submissionId, newStatus) => {
    try {
      await api.put(`/api/chat/submissions/${submissionId}`, { status: newStatus });
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating submission status:', error);
      setError('Failed to update submission status. Please try again.');
    }
  };

  if (loading) return <div>Loading chat submissions...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="chat-submissions">
      <h3>Chat Submissions</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Manager</th>
            <th>Remarks</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission._id}>
              <td>{new Date(submission.submittedAt).toLocaleString()}</td>
              <td>{submission.clientId.username}</td>
              <td>{submission.managerId.username}</td>
              <td>{submission.remarks}</td>
              <td>{submission.status}</td>
              <td>
                <button onClick={() => handleStatusChange(submission._id, 'reviewed')}>
                  Mark as Reviewed
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChatSubmissions;