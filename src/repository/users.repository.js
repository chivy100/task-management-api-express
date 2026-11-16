// XỬ LÝ CÁC CÂU LỆNH QUERY TRONG MYSQL
const db = require("../config/database.config");

// Các cột trả về cho client (không bao gồm password)
const PUBLIC_COLUMNS =
  "id, username, email, full_name, role, is_active, created_at, updated_at";

async function getUsers() {
  const [users] = await db.execute(`SELECT ${PUBLIC_COLUMNS} FROM users`);
  return users;
}

async function getUserById(id) {
  const [users] = await db.execute(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`,
    [id]
  );
  return users[0];
}

// Tìm user theo username hoặc email (dùng để kiểm tra trùng)
async function getOneUser(username, email) {
  const [users] = await db.execute(
    "SELECT id, username, email FROM users WHERE username = ? OR email = ?",
    [username ?? null, email ?? null]
  );
  return users[0];
}

async function createUser({
  username,
  email,
  password,
  full_name = null,
  role = "user",
  is_active = true,
}) {
  const [result] = await db.execute(
    "INSERT INTO users (username, email, password, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)",
    [username, email, password, full_name, role, is_active]
  );
  return result.insertId;
}

// Chỉ cập nhật các trường được gửi lên
async function updateUser(id, data) {
  const allowed = ["username", "email", "password", "full_name", "role", "is_active"];
  const fields = allowed.filter((key) => data[key] !== undefined);
  if (fields.length === 0) return 0;

  const setClause = fields.map((key) => `${key} = ?`).join(", ");
  const values = fields.map((key) => data[key]);

  const [result] = await db.execute(
    `UPDATE users SET ${setClause} WHERE id = ?`,
    [...values, id]
  );
  return result.affectedRows;
}

async function deleteUserById(id) {
  const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
  return result.affectedRows;
}

module.exports = {
  getUsers,
  getUserById,
  getOneUser,
  createUser,
  updateUser,
  deleteUserById,
};
