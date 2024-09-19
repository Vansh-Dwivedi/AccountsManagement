require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nav-accounting';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      { username: 'admin', email: 'admin@example.com', password: hashedPassword, role: 'admin' },
      { username: 'manager', email: 'manager@example.com', password: hashedPassword, role: 'manager' },
      { username: 'user', email: 'user@example.com', password: hashedPassword, role: 'user' },
    ];

    await User.insertMany(users);
    console.log('Users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();