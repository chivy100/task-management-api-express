const mysql = require("mysql2");
require("dotenv").config();

// Khởi tạo Connection Pool quản trị tài nguyên kết nối
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "demo_express",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Chuyển đổi sang Promise API để hỗ trợ async/await
const db = pool.promise();

// Hàm kiểm tra tính sẵn sàng của kết nối khi server khởi động
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log(" Kết nối cơ sở dữ liệu MySQL thành công!");
    connection.release();
    return true;
  } catch (error) {
    console.error(" Không thể kết nối tới MySQL Database:");
    console.error(`- Lỗi: ${error.message}`);
    console.error(`- Mã lỗi: ${error.code}`);
    return false;
  }
}

module.exports = {
  db,
  pool,
  testConnection,
};
