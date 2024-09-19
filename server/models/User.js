const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: [
      'user', 'client', 'manager', 'admin',
      'office_head', 'head_director',
      'master_dept_a', 'master_dept_b', 'master_dept_c', 'master_dept_d', 'master_dept_e',
      'operator_a', 'operator_b', 'operator_c', 'operator_d',
      'helper'
    ], 
    default: 'client' 
  },
  profilePic: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);