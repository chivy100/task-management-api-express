// Nạp biến môi trường ngay tại dòng đầu tiên của điểm khởi chạy
require("dotenv").config();

const app = require("./app");
const { testConnection, pool } = require("./config/database");

const PORT = Number(process.env.PORT) || Number(process.env.HOST) || 8000;

async function startServer() {
  console.log("==========================================");
  console.log(" Đang khởi động máy chủ Task Management API...");
  console.log("==========================================");

  // 1. Kiểm tra tính sẵn sàng của Cơ sở dữ liệu MySQL
  const isDbReady = await testConnection();
  if (!isDbReady) {
    console.error(" [LỖI KHỞI ĐỘNG] Cơ sở dữ liệu MySQL chưa sẵn sàng hoặc sai thông tin kết nối trong .env!");
    console.error("-> Server sẽ tạm hoãn lắng nghe cho đến khi Database hoạt động.");
  }

  // 2. Mở cổng mạng đón nhận HTTP Requests
  const server = app.listen(PORT, () => {
    console.log(` Máy chủ đang chạy thành công tại địa chỉ: http://localhost:${PORT}`);
    console.log(` API Base URL: http://localhost:${PORT}/api/v1`);
    console.log(` Môi trường hiện tại: ${process.env.NODE_ENV || "development"}`);
    console.log("==========================================");
  });

  // 3. Xử lý Tắt server an toàn (Graceful Shutdown) khi nhận tín hiệu từ OS
  const gracefulShutdown = (signal) => {
    console.log(`\n Nhận tín hiệu ${signal}. Đang đóng máy chủ an toàn...`);
    server.close(() => {
      console.log("- Đã đóng toàn bộ kết nối HTTP.");
      pool.end(() => {
        console.log("- Đã giải phóng toàn bộ MySQL Connection Pool.");
        process.exit(0);
      });
    });

    // Ép tắt sau 10 giây nếu các kết nối bị treo
    setTimeout(() => {
      console.error("- Quá thời gian đóng an toàn. Buộc dừng tiến trình.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // 4. Bẫy lỗi ngoại lệ chưa được xử lý toàn cục
  process.on("uncaughtException", (error) => {
    console.error("[CRITICAL] Uncaught Exception phát sinh:", error);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("[CRITICAL] Unhandled Rejection phát sinh:", reason);
  });
}

startServer();
