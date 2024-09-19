const mongoose = require('mongoose');

const ChatSubmissionSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String, required: true },
  chatLog: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' }
});

module.exports = mongoose.model('ChatSubmission', ChatSubmissionSchema);