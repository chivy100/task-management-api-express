// Chuẩn hóa định dạng HTTP Response thành công cho toàn bộ hệ thống
class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta; // Chứa thông tin phân trang (page, limit, total, totalPages)
    }
  }

  static success(res, message = "Thành công", data = null, statusCode = 200, meta = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data, meta));
  }

  static created(res, message = "Tạo mới thành công", data = null) {
    return res.status(201).json(new ApiResponse(201, message, data));
  }
}

module.exports = ApiResponse;
