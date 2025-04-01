const { query } = require('./db');

class User {
  // Create a new user in MySQL when they register with Firebase
  static async createUser(firebaseUid, email, name) {
    try {
      const sql = `
        INSERT INTO users (firebase_uid, email, name)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        name = VALUES(name)
      `;
      
      const result = await query(sql, [firebaseUid, email, name]);
      return result.insertId || result.affectedRows;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get user by Firebase UID
  static async getUserByFirebaseUid(firebaseUid) {
    try {
      const sql = 'SELECT * FROM users WHERE firebase_uid = ?';
      const users = await query(sql, [firebaseUid]);
      return users[0] || null;
    } catch (error) {
      console.error('Error getting user by Firebase UID:', error);
      throw error;
    }
  }
}

module.exports = User;