import React, { useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const { authState } = useContext(AuthContext);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      query: { token: authState.token }
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, [authState.token]);

  useEffect(() => {
    if (socket) {
      socket.on('message', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
    }
  }, [socket]);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    socket.emit('join', authState.user.id);
    
    socket.on('newMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [authState.user.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    setError('');
    if (socket && (inputMessage || file)) {
      const formData = new FormData();
      formData.append('message', inputMessage);
      if (file) {
        formData.append('file', file);
      }

      try {
        const response = await api.post('/chat', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        socket.emit('sendMessage', response.data);
        setInputMessage('');
        setFile(null);
      } catch (error) {
        console.error('Error sending message:', error);
        setError(error.response?.data?.error || 'Error sending message');
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size should not exceed 5MB');
        e.target.value = null;
      } else {
        setFile(selectedFile);
        setError('');
      }
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index}>
            <p>{message.sender.username}: {message.message}</p>
            {message.file && (
              <a href={`http://localhost:5000/${message.file.path}`} target="_blank" rel="noopener noreferrer">
                {message.file.filename}
              </a>
            )}
          </div>
        ))}
      </div>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <form onSubmit={sendMessage} className="input-area">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message"
        />
        <label htmlFor="file-upload" className="custom-file-upload">
          <i className="fa fa-cloud-upload"></i> Choose File
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;