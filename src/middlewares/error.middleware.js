const ApiError = require("../utils/apiError");
const HTTP_STATUS = require("../constants/httpStatus");

/**
 * Middleware xử lý lỗi tập trung toàn ứng dụng (Centralized Error Handler)
 * Nhận 4 tham số: (err, req, res, next) - Express nhận diện đây là Error Middleware nhờ 4 tham số này
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Đã xảy ra lỗi nội bộ máy chủ";
  let errors = err.errors || [];

  // 1. Xử lý lỗi trùng khóa Unique Key trong MySQL (Duplicate Entry)
  if (err.code === "ER_DUP_ENTRY") {
    statusCode = HTTP_STATUS.CONFLICT;
    message = "Dữ liệu bị trùng lặp: Giá trị đã tồn tại trong hệ thống";
    if (err.sqlMessage && err.sqlMessage.includes("users.uk_users_email")) {
      message = "Email này đã được sử dụng bởi một tài khoản khác";
    } else if (err.sqlMessage && err.sqlMessage.includes("users.uk_users_username")) {
      message = "Username này đã được sử dụng";
    }
  }

  // 2. Xử lý lỗi vi phạm ràng buộc Khóa Ngoại (Foreign Key Constraint)
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Dữ liệu liên kết không tồn tại (Khóa ngoại không hợp lệ)";
  }

  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    statusCode = HTTP_STATUS.CONFLICT;
    message = "Không thể xóa hoặc thay đổi dữ liệu này vì đang có các bản ghi khác phụ thuộc";
  }

  // 3. Xử lý lỗi Token JWT
  if (err.name === "JsonWebTokenError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Token không hợp lệ hoặc chữ ký bị sai";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Token đã hết hạn";
  }

  // Ghi log chi tiết ra console (Trong môi trường production nên ghi ra file log chuyên dụng)
  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    console.error("[INTERNAL_ERROR]", err);
  } else {
    console.warn(`[API_ERROR] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${message}`);
  }

  // Phản hồi JSON chuẩn cho client
  const responsePayload = {
    success: false,
    statusCode,
    message,
  };

  if (errors.length > 0) {
    responsePayload.errors = errors;
  }

  // Chỉ trả về stack trace khi đang ở môi trường phát triển (development)
  if (process.env.NODE_ENV !== "production" && err.stack) {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
