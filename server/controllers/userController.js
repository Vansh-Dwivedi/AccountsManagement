const User = require('../models/User');
const fs = require('fs');
const path = require('path');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('assignedManager', 'username _id role');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, profilePic } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (profilePic) user.profilePic = profilePic;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username _id role');
    res.json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Validate the new role
    const validRoles = [
      'user', 'client', 'manager', 'admin',
      'office_head', 'head_director',
      'master_dept_a', 'master_dept_b', 'master_dept_c', 'master_dept_d', 'master_dept_e',
      'operator_a', 'operator_b', 'operator_c', 'operator_d',
      'helper'
    ];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile picture if it exists
    if (user.profilePic) {
      const oldPicPath = path.join(__dirname, '..', 'uploads', user.profilePic);
      if (fs.existsSync(oldPicPath)) {
        fs.unlinkSync(oldPicPath);
      }
    }

    user.profilePic = req.file.filename;
    await user.save();

    const fullUrl = `/uploads/${user.profilePic}`; // This is the correct path
    console.log('Profile picture uploaded:', fullUrl);
    res.json({ profilePic: user.profilePic }); // Send just the filename
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.profilePic) {
      const picPath = path.join(__dirname, '..', 'uploads', user.profilePic);
      if (fs.existsSync(picPath)) {
        fs.unlinkSync(picPath);
      }
      user.profilePic = null;
      await user.save();
    }

    res.json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.assignManager = async (req, res) => {
  try {
    const { userId } = req.params;
    const { managerId } = req.body;

    console.log(`Assigning manager ${managerId} to client ${userId}`);

    const user = await User.findByIdAndUpdate(
      userId,
      { assignedManager: managerId },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Updated user:', user);

    res.json(user);
  } catch (error) {
    console.error('Error assigning manager:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.assignClient = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { clientId } = req.body;

    console.log(`Assigning client ${clientId} to manager ${managerId}`);

    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    if (!manager.assignedClients.includes(clientId)) {
      manager.assignedClients.push(clientId);
      await manager.save();
    }

    console.log('Updated manager:', manager);

    res.json(manager);
  } catch (error) {
    console.error('Error assigning client to manager:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAssignedClients = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }
    
    const assignedClients = await User.find({ assignedManager: manager._id }, 'username _id');
    console.log('Assigned clients:', assignedClients);
    res.json(assignedClients);
  } catch (error) {
    console.error('Error in getAssignedClients:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add these methods to your existing userController

exports.blockUser = async (req, res) => {
  try {
    console.log('Blocking user with ID:', req.params.userId);
    console.log('Request user:', req.user);
    const user = await User.findByIdAndUpdate(req.params.userId, { isBlocked: true }, { new: true });
    if (!user) {
      console.log('User not found for blocking');
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User blocked successfully:', user);
    res.json({ message: 'User blocked successfully', user });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Error blocking user', error: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isBlocked: false }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User unblocked successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error unblocking user', error: error.message });
  }
};

// New function to get users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role }, 'username _id role');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// New function to get the role hierarchy
exports.getRoleHierarchy = async (req, res) => {
  const roleHierarchy = {
    admin: ['admin', 'office_head', 'head_director', 'master_dept_a', 'master_dept_b', 'master_dept_c', 'master_dept_d', 'master_dept_e', 'operator_a', 'operator_b', 'operator_c', 'operator_d', 'helper', 'manager', 'client', 'user'],
    office_head: ['office_head', 'head_director', 'master_dept_a', 'master_dept_b', 'master_dept_c', 'master_dept_d', 'master_dept_e', 'operator_a', 'operator_b', 'operator_c', 'operator_d', 'helper'],
    head_director: ['head_director', 'master_dept_a', 'master_dept_b', 'master_dept_c', 'master_dept_d', 'master_dept_e', 'operator_a', 'operator_b', 'operator_c', 'operator_d', 'helper'],
    master_dept_a: ['master_dept_a', 'operator_a', 'helper'],
    master_dept_b: ['master_dept_b', 'operator_b', 'helper'],
    master_dept_c: ['master_dept_c', 'operator_c', 'helper'],
    master_dept_d: ['master_dept_d', 'operator_d', 'helper'],
    master_dept_e: ['master_dept_e', 'helper'],
    operator_a: ['operator_a'],
    operator_b: ['operator_b'],
    operator_c: ['operator_c'],
    operator_d: ['operator_d'],
    helper: ['helper'],
    manager: ['manager', 'client', 'user'],
    client: ['client'],
    user: ['user']
  };
  res.json(roleHierarchy);
};

// New method to get all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = ['user', 'client', 'manager', 'admin', 'office_head', 'head_director', 'master_dept_a', 'master_dept_b', 'master_dept_c', 'master_dept_d', 'master_dept_e', 'operator_a', 'operator_b', 'operator_c', 'operator_d', 'helper'];
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roles', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};