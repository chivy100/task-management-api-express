const { db } = require("../config/database");

class TokensRepository {
  async createToken({ user_id, refresh_token, expires_at }) {
    const [result] = await db.execute(
      `INSERT INTO user_tokens (user_id, refresh_token, expires_at) VALUES (?, ?, ?)`,
      [user_id, refresh_token, expires_at]
    );
    return result.insertId;
  }

  async findByToken(refresh_token) {
    const [rows] = await db.execute(
      `SELECT * FROM user_tokens WHERE refresh_token = ? AND expires_at > CURRENT_TIMESTAMP`,
      [refresh_token]
    );
    return rows[0] || null;
  }

  async deleteByToken(refresh_token) {
    const [result] = await db.execute(
      `DELETE FROM user_tokens WHERE refresh_token = ?`,
      [refresh_token]
    );
    return result.affectedRows;
  }

  async deleteByUserId(user_id) {
    const [result] = await db.execute(
      `DELETE FROM user_tokens WHERE user_id = ?`,
      [user_id]
    );
    return result.affectedRows;
  }
}

module.exports = new TokensRepository();
