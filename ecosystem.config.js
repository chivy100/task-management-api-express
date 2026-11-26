// Cấu hình PM2 Cluster Mode cho máy chủ Linux Production
module.exports = {
  apps: [
    {
      name: "task-management-api",
      script: "src/server.js",
      // Chạy ở chế độ Cluster Mode tận dụng tối đa toàn bộ số nhân CPU máy chủ
      instances: "max",
      exec_mode: "cluster",
      // Tự động khởi động lại nếu bộ nhớ RAM vượt quá 500MB (chống rò rỉ bộ nhớ)
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      // Ghi log ra file
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Thời gian chờ đóng server an toàn trước khi ép kill
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 8000,
    },
  ],
};
