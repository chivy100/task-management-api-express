const ApiError = require("../utils/apiError");

/**
 * Middleware phân quyền theo vai trò (Role-Based Access Control)
 * @param  {...string} allowedRoles - Danh sách các vai trò được phép truy cập
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Chưa xác thực danh tính người dùng"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Bạn không có quyền thực hiện hành động này. Vai trò hiện tại: '${req.user.role}', yêu cầu: [${allowedRoles.join(", ")}]`
        )
      );
    }

    next();
  };
};

module.exports = authorize;
