import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../../utils/api';
import './ChatComponent.css';

const truncateFileName = (filename, maxLength = 15) => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop();
  const nameWithoutExtension = filename.slice(0, -(extension.length + 1));
  const truncatedName = nameWithoutExtension.slice(0, maxLength - 3) + '...';
  return `${truncatedName}.${extension}`;
};

const ChatComponent = ({ currentUser, otherUser }) => {
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(new Audio('/notification.mp3'));

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join', currentUser._id);
    });

    newSocket.on('message', (message) => {
      if (message.sender !== currentUser._id) {
        audioRef.current.play();
      }
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => newSocket.close();
  }, [currentUser._id]);

  // Fetch messages for the selected user (otherUser)
  useEffect(() => {
    const fetchMessages = async () => {
      if (otherUser && otherUser._id) {
        try {
          const response = await api.get(`/api/chat/messages/${otherUser._id}`);
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };
    fetchMessages();
  }, [otherUser]);

  const sendMessage = async () => {
    if (!newMessage.trim() && !file) return;

    const formData = new FormData();
    formData.append('message', newMessage);
    formData.append('receiverId', otherUser._id);
    if (file) formData.append('file', file);

    try {
      const response = await api.post('/api/chat/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      socket.emit('sendMessage', response.data);
      setNewMessage('');
      setFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFileDownload = async (file) => {
    console.log('File object:', file);
    if (!file || typeof file !== 'object' || !file.path) {
      console.error('Invalid file object:', file);
      return;
    }

    try {
      const response = await api.get(`/api/chat/download/${encodeURIComponent(file.path)}`, {
        responseType: 'blob',
      });
      
      console.log('Response headers:', response.headers);
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = file.filename || 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      console.log('Filename:', filename);

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-wrapper">
        <div className="chat-content">
          <div className="chat-header">
            {otherUser && (
              <div className="user-info">
                <img src={otherUser.profilePic} alt={otherUser.username} className="user-profile-pic" />
                <div>
                  <p className="user-username">{otherUser.username}</p>
                  <p className="user-email">{otherUser.email}</p>
                </div>
              </div>
            )}
          </div>

          <div className="messages">
            {messages.map((msg) => (
              <div key={msg._id} className={`message ${msg.sender === currentUser._id ? 'sent' : 'received'}`}>
                <p>{msg.message}</p>
                {msg.file && (
                  <div>
                    <button onClick={() => handleFileDownload(msg.file)} className="file-download-btn">
                      Download {truncateFileName(msg.file.filename || 'File')}
                    </button>
                  </div>
                )}
                <span className="timestamp">{new Date(msg.timestamp).toLocaleString()}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <label htmlFor="file-upload" className="custom-file-upload">
              Attach File
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
