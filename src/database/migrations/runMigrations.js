const fs = require("fs");
const path = require("path");
const { db, testConnection } = require("../../config/database");

async function runMigrations() {
  console.log(" Bắt đầu chạy Migration tạo bảng Database...");

  const isConnected = await testConnection();
  if (!isConnected) {
    console.error(" Không thể kết nối cơ sở dữ liệu để chạy Migration.");
    process.exit(1);
  }

  try {
    // 1. Kiểm tra xem bảng users cũ có tồn tại hay không và nâng cấp tương thích
    const [tables] = await db.query("SHOW TABLES LIKE 'users'");
    if (tables.length > 0) {
      console.log("- Phát hiện bảng 'users' đã tồn tại, đang đồng bộ cấu trúc mới...");
      const [columns] = await db.query("DESCRIBE users");
      const colMap = new Set(columns.map((c) => c.Field));

      // Nâng cấp kiểu dữ liệu id lên BIGINT UNSIGNED để tương thích Foreign Key
      await db.query("ALTER TABLE users MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");

      // Cập nhật tên cột password -> password_hash nếu cần
      if (colMap.has("password") && !colMap.has("password_hash")) {
        console.log("  • Đổi tên cột 'password' thành 'password_hash'...");
        await db.query("ALTER TABLE users CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL");
      }

      // Mở rộng enum role trước để cho phép giá trị 'member'
      console.log("  • Mở rộng enum role sang ('admin', 'manager', 'member')...");
      await db.query("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'member'");
      await db.query("UPDATE users SET role = 'member' WHERE role = 'user' OR role IS NULL OR role = ''");
      await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'member') NOT NULL DEFAULT 'member'");

      // Bổ sung cột deleted_at nếu chưa có (Soft Delete)
      if (!colMap.has("deleted_at")) {
        console.log("  • Bổ sung cột 'deleted_at' (Soft Delete)...");
        await db.query("ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL");
      }
    }

    // 2. Chạy toàn bộ file schema.sql
    const schemaPath = path.join(__dirname, "../schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");

    const statements = sql
      .split(/;\s*$/m)
      .map((st) => st.trim())
      .filter((st) => st.length > 0);

    for (const statement of statements) {
      await db.query(statement);
    }

    console.log(" Chạy Migration thành công! Tất cả các bảng đã sẵn sàng.");
  } catch (error) {
    console.error(" Lỗi trong quá trình chạy Migration:", error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigrations();
