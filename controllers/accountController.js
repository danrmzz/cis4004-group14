const Account = require('../models/accountModel');
const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');

// Create a new account
const createAccount = async (req, res) => {
  try {
    const { firebaseUid, accountType, initialBalance, currency } = req.body;
    
    if (!firebaseUid || !accountType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firebaseUid, accountType'
      });
    }
    
    // Get user ID from firebase UID
    const user = await User.getUserByFirebaseUid(firebaseUid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const accountId = await Account.createAccount(
      user.id,
      accountType,
      initialBalance || 0.00,
      currency || 'USD'
    );
    
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      accountId
    });
  } catch (error) {
    console.error('Error in createAccount:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error.message
    });
  }
};

// Get all accounts for a user
const getUserAccounts = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required'
      });
    }
    
    // Get user ID from firebase UID
    const user = await User.getUserByFirebaseUid(firebaseUid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const accounts = await Account.getAccountsByUserId(user.id);
    
    return res.status(200).json({
      success: true,
      accounts
    });
  } catch (error) {
    console.error('Error in getUserAccounts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving accounts',
      error: error.message
    });
  }
};

module.exports = {
  createAccount,
  getUserAccounts
};