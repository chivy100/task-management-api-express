// Custom Error Class chuẩn mực kế thừa từ Error native của JavaScript
const HTTP_STATUS = require("../constants/httpStatus");

class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.errors = errors;
    this.success = false;

    // Ghi lại Stack Trace để dễ dàng debug
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = "Yêu cầu đăng nhập để truy cập tài nguyên này") {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
  }

  static forbidden(message = "Bạn không có quyền thực hiện hành động này") {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message);
  }

  static notFound(message = "Không tìm thấy tài nguyên yêu cầu") {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  static conflict(message = "Dữ liệu bị trùng lặp hoặc xung đột") {
    return new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  static unprocessable(message, errors = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }

  static internal(message = "Đã xảy ra lỗi nội bộ máy chủ") {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
  }
}

module.exports = ApiError;
