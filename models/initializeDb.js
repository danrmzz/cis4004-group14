const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

// Function to create database if it doesn't exist
async function initializeDatabase() {
  try {
    // Create connection without database specification
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    
    console.log(`Database '${dbConfig.database}' created or already exists`);
    await connection.end();
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Function to create tables if they don't exist
async function initializeTables() {
  console.log('Initializing database tables...');
  
  try {
    // First ensure database exists
    await initializeDatabase();
    
    // Now connect with database
    const { query } = require('./db');
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create accounts table
    await query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        account_type ENUM('checking', 'savings', 'investment') NOT NULL,
        balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account_id INT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        transaction_type ENUM('deposit', 'withdrawal', 'transfer', 'fee') NOT NULL,
        description TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `);
    
    // Create stock_watchlist table
    await query(`
      CREATE TABLE IF NOT EXISTS stock_watchlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        company_name VARCHAR(255),
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY user_symbol (user_id, symbol)
      )
    `);

    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database tables:', error);
    return false;
  }
}

// If this file is run directly
if (require.main === module) {
  // Execute the initialization functions
  (async () => {
    try {
      await initializeDatabase();
      await initializeTables();
      console.log('Database setup completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Database setup failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = { initializeTables, initializeDatabase };