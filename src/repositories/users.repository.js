const { db } = require("../config/database");

const PUBLIC_COLUMNS = "id, username, email, full_name, role, is_active, created_at, updated_at";

class UsersRepository {
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  async findByUsername(username) {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE username = ? AND deleted_at IS NULL`,
      [username]
    );
    return rows[0] || null;
  }

  async findByEmail(email) {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`,
      [email]
    );
    return rows[0] || null;
  }

  async findByIdentifier(identifier) {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE (username = ? OR email = ?) AND deleted_at IS NULL`,
      [identifier, identifier]
    );
    return rows[0] || null;
  }

  async create({ username, email, password_hash, full_name = null, role = "member" }) {
    const [result] = await db.execute(
      `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [username, email, password_hash, full_name, role]
    );
    return result.insertId;
  }

  async update(id, updateData) {
    const allowed = ["full_name", "password_hash", "role", "is_active"];
    const fields = allowed.filter((key) => updateData[key] !== undefined);
    if (fields.length === 0) return 0;

    const setClauses = fields.map((key) => `\`${key}\` = ?`).join(", ");
    const values = fields.map((key) => updateData[key]);

    const [result] = await db.execute(
      `UPDATE users SET ${setClauses} WHERE id = ? AND deleted_at IS NULL`,
      [...values, id]
    );
    return result.affectedRows;
  }

  async softDelete(id) {
    const [result] = await db.execute(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return result.affectedRows;
  }

  async findAll({ page = 1, limit = 10, search = null, role = null, is_active = null }) {
    const offset = (page - 1) * limit;
    const conditions = ["deleted_at IS NULL"];
    const params = [];

    if (search) {
      conditions.push("(username LIKE ? OR email LIKE ? OR full_name LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (role) {
      conditions.push("role = ?");
      params.push(role);
    }

    if (is_active !== null && is_active !== undefined) {
      conditions.push("is_active = ?");
      params.push(Number(is_active));
    }

    const whereClause = conditions.join(" AND ");

    // 1. Đếm tổng số bản ghi (Total Count) phục vụ phân trang
    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // 2. Truy vấn dữ liệu có phân trang
    // mysql2 prepared statements với LIMIT / OFFSET cần truyền chuỗi hoặc số nguyên
    const [rows] = await db.query(
      `SELECT ${PUBLIC_COLUMNS} FROM users 
       WHERE ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = new UsersRepository();
