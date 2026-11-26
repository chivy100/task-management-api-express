const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/index");
const errorHandler = require("./middlewares/error.middleware");
const ApiError = require("./utils/apiError");

const app = express();

// 1. Cấu hình CORS (Cross-Origin Resource Sharing)
app.use(cors());

// 2. Phân tích cú pháp Request Body (Sử dụng trực tiếp Express tích hợp sẵn)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 3. Logger Middleware tối giản theo dõi mọi HTTP Request
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 4. Chuyển hướng trang chủ sang /api/v1
app.get("/", (req, res) => res.redirect("/api/v1"));

// 5. Định tuyến toàn bộ API v1
app.use("/api/v1", apiRoutes);

// 5. Bắt các đường dẫn không tồn tại (404 Not Found Handler)
app.use((req, res, next) => {
  next(ApiError.notFound(`Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`));
});

// 6. Middleware xử lý lỗi tập trung (BẮT BUỘC ĐẶT Ở CUỐI CÙNG)
app.use(errorHandler);

module.exports = app;
