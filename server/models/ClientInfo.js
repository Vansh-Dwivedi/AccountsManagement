const mongoose = require('mongoose');

const ClientInfoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Add all the fields from the form here
  fullName: String,
  occupation: String,
  // ... other fields ...
  serviceRequested: [String]
}, { timestamps: true });

module.exports = mongoose.model('ClientInfo', ClientInfoSchema);