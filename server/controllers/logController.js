const Log = require('../models/Log');

exports.createLog = async (userId, action) => {
  try {
    await Log.create({ user: userId, action });
  } catch (error) {
    console.error('Error creating log:', error);
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).populate('user', 'username');
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ... (other log-related functions)