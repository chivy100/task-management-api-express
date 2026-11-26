const argon2 = require("argon2");
const { db, testConnection } = require("../../config/database");

async function runSeeds() {
  console.log(" Bắt đầu chèn dữ liệu mẫu (Seed Data)...");

  const isConnected = await testConnection();
  if (!isConnected) {
    console.error(" Không thể kết nối cơ sở dữ liệu để chạy Seed.");
    process.exit(1);
  }

  try {
    const passwordHash = await argon2.hash("Admin@123456");

    // 1. Chèn người dùng mặc định
    console.log("- Đang tạo tài khoản Admin, Manager, Member...");
    await db.execute(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active)
      VALUES 
        ('admin', 'admin@example.com', '${passwordHash}', 'Hệ Thống Admin', 'admin', 1),
        ('manager', 'manager@example.com', '${passwordHash}', 'Quản Lý Dự Án', 'manager', 1),
        ('member1', 'member1@example.com', '${passwordHash}', 'Thành Viên 1', 'member', 1),
        ('member2', 'member2@example.com', '${passwordHash}', 'Thành Viên 2', 'member', 1)
      ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
    `);

    // 2. Chèn Tags mặc định
    console.log("- Đang tạo danh mục Tags mẫu...");
    await db.execute(`
      INSERT INTO tags (name, color)
      VALUES 
        ('Backend', '#0d6efd'),
        ('Frontend', '#198754'),
        ('Bug', '#dc3545'),
        ('Urgent', '#ffc107'),
        ('Feature', '#0dcaf0')
      ON DUPLICATE KEY UPDATE color = VALUES(color);
    `);

    console.log(" Chèn dữ liệu mẫu thành công!");
    console.log(" Tài khoản mẫu: admin / Admin@123456 (email: admin@example.com)");
  } catch (error) {
    console.error(" Lỗi khi chèn dữ liệu mẫu:", error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runSeeds();
