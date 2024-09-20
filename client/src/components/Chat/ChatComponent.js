import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import api from '../../utils/api';
import './ChatComponent.css';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ChatComponent = ({ otherUser, onClose }) => {
  const { user } = useContext(AuthContext);
  console.log('Auth context:', user);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [file, setFile] = useState(null);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [error, setError] = useState('');

  const addMessage = useCallback((message) => {
    setMessages((prevMessages) => {
      const messageExists = prevMessages.some((msg) => msg._id === message._id);
      if (!messageExists) {
        return [...prevMessages, message];
      }
      return prevMessages;
    });
  }, []);

  useEffect(() => {
    if (!user || !otherUser) {
      console.error('Current user or other user is undefined');
      return;
    }

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.emit('join', user._id);

    newSocket.on('newMessage', (newMessage) => {
      addMessage(newMessage);
      if (newMessage.sender !== user._id) {
        toast.info(`New message from ${otherUser.username}`);
      }
    });

    return () => {
      newSocket.off('newMessage');
      newSocket.disconnect();
    };
  }, [user, otherUser, addMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (otherUser?._id) {
      fetchMessages();
    }
  }, [otherUser?._id]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/api/chat/messages/${otherUser._id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error.response?.data || error.message);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    setError('');
    if (inputMessage || file) {
      const formData = new FormData();
      formData.append('message', inputMessage);
      formData.append('receiver', otherUser._id); // Add this line
      if (file) {
        formData.append('file', file);
      }

      try {
        const response = await api.post('/api/chat/send', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Server response:', response.data);
        addMessage(response.data);
        setInputMessage('');
        setFile(null);

        if (socket) {
          socket.emit('sendMessage', response.data);
        }
      } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
        setError(error.response?.data?.error || 'Error sending message');
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setInputMessage(selectedFile ? `File selected: ${selectedFile.name}` : '');
  };

  const canSubmitToAdmin = user?.role === 'manager' && otherUser?.role === 'client';

  if (!user || !otherUser) {
    return <div>Loading chat...</div>;
  }

  const renderFileAttachment = (file) => {
    if (!file) return null;
    
    const fileUrl = `${process.env.REACT_APP_API_URL}/uploads/${file.filename}`;
    const fileExtension = file.originalName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      return (
        <div className="file-attachment">
          <img src={fileUrl} alt={file.originalName} style={{maxWidth: '200px', maxHeight: '200px'}} />
          <a href={fileUrl} download={file.originalName}>Download {file.originalName}</a>
        </div>
      );
    } else {
      return (
        <div className="file-attachment">
          <a href={fileUrl} download={file.originalName}>Download {file.originalName}</a>
        </div>
      );
    }
  };

  return (
    <div className="chat-component">
      <div className="chat-header">
        <h3>Chat with {otherUser.username}</h3>
        <button onClick={onClose}>Close</button>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender._id === user._id ? 'sent' : 'received'}`}>
            <p>{msg.content}</p>
            {msg.file && renderFileAttachment(msg.file)}
            <span className="timestamp">{new Date(msg.timestamp).toLocaleString()}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="message-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <label htmlFor="file-upload" className="custom-file-upload">
          Choose File
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button type="submit" className="send-button">Send</button>
      </form>
      {canSubmitToAdmin && (
        <button onClick={submitToAdmin} className="submit-to-admin">
          Submit to Admin
        </button>
      )}
    </div>
  );
};

export default ChatComponent;
