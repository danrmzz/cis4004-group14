const Transaction = require('../models/transactionModel');
const Account = require('../models/accountModel');
const User = require('../models/userModel');

// Create a new transaction
const createTransaction = async (req, res) => {
  try {
    const { accountId, amount, transactionType, description } = req.body;
    
    if (!accountId || !amount || !transactionType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: accountId, amount, transactionType'
      });
    }
    
    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }
    
    // Validate transaction type
    const validTypes = ['deposit', 'withdrawal', 'transfer', 'fee'];
    if (!validTypes.includes(transactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type. Must be one of: ' + validTypes.join(', ')
      });
    }
    
    const result = await Transaction.createTransaction(
      accountId,
      amount,
      transactionType,
      description || ''
    );
    
    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transactionId: result.transactionId,
      newBalance: result.newBalance
    });
  } catch (error) {
    console.error('Error in createTransaction:', error);
    
    // Handle specific errors
    if (error.message === 'Insufficient funds') {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds for this transaction'
      });
    }
    
    if (error.message === 'Account not found') {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
};

// Get transactions for an account
const getAccountTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required'
      });
    }
    
    const transactions = await Transaction.getTransactionsByAccountId(accountId);
    
    return res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error in getAccountTransactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving transactions',
      error: error.message
    });
  }
};

module.exports = {
  createTransaction,
  getAccountTransactions
};