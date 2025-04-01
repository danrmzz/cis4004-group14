const User = require('../models/userModel');
const Account = require('../models/accountModel');

// Create or update a user in the MySQL database when they register with Firebase
const createOrUpdateUser = async (req, res) => {
  try {
    const { firebaseUid, email, name } = req.body;
    
    if (!firebaseUid || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firebaseUid, email, name'
      });
    }
    
    const userId = await User.createUser(firebaseUid, email, name);
    
    return res.status(201).json({
      success: true,
      message: 'User created/updated successfully',
      userId
    });
  } catch (error) {
    console.error('Error in createOrUpdateUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating/updating user',
      error: error.message
    });
  }
};

// Get user data by Firebase UID
const getUserByFirebaseUid = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required'
      });
    }
    
    const user = await User.getUserByFirebaseUid(firebaseUid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user accounts
    const accounts = await Account.getAccountsByUserId(user.id);
    
    return res.status(200).json({
      success: true,
      user: {
        ...user,
        accounts
      }
    });
  } catch (error) {
    console.error('Error in getUserByFirebaseUid:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user data',
      error: error.message
    });
  }
};

module.exports = {
  createOrUpdateUser,
  getUserByFirebaseUid
};