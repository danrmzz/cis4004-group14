const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Helper function to execute queries
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

module.exports = {
  query,
  testConnection,
  pool
};