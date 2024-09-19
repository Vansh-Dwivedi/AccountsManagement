const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Add these lines at the beginning of the file, after requiring dotenv
console.log('Environment variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');
const logRoutes = require('./routes/logRoutes');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

// Add this line after the CORS middleware
app.use((req, res, next) => {
  console.log('Request received:', req.method, req.url);
  next();
});

// Then apply other middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all routes except /api/chat
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/chat')) {
    return generalLimiter(req, res, next);
  }
  next();
});

// Add this near the top of your file, after other middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  console.log('Request body:', req.body);
  next();
});

// Update MongoDB connection code
const MONGODB_URI = 'mongodb://localhost:27017/nav-accounting';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Make sure this line is present and the JWT_SECRET is set in your .env file
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Please set it in your .env file.');
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/logs', logRoutes);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: corsOptions
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Create a mapping of user IDs to their socket IDs
const userSockets = {};

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // Handle the 'register' event
  socket.on('register', ({ userId }) => {
    console.log(`User registered: ${userId} with socket ID: ${socket.id}`);
    userSockets[userId] = socket.id;
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove the socket ID from the userSockets mapping
    for (const userId in userSockets) {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
        break;
      }
    }
  });

  // ... other event handlers
});

// Function to send a message to a specific user
function sendMessageToUser(receiverId, message) {
  const socketId = userSockets[receiverId];
  if (socketId) {
    io.to(socketId).emit('message', message);
  } else {
    console.log(`User ${receiverId} is not connected`);
  }
}

// Make sendMessageToUser available to other parts of your application
app.set('sendMessageToUser', sendMessageToUser);

// Example of how to use sendMessageToUser in a route
app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    // Save the message to the database
    const newMessage = await Message.create({ sender: senderId, receiver: receiverId, content });
    
    // Send the message via socket
    sendMessageToUser(receiverId, {
      id: newMessage._id,
      sender: senderId,
      receiver: receiverId,
      content,
      timestamp: newMessage.createdAt
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Modify the catch-all route to log more details
app.use('*', (req, res) => {
  console.log(`No route found for ${req.method} ${req.originalUrl}`);
  console.log('Available routes:', app._router.stack.filter(r => r.route).map(r => r.route.path));
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Instead of starting the server here, export the server
module.exports = { app, server };