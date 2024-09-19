const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('File', FileSchema);