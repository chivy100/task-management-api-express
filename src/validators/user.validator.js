const ApiError = require("../utils/apiError");
const ROLES = require("../constants/roles");

const validateUserId = (req, res, next) => {
  const { id } = req.params;
  const numId = Number(id);
  if (!id || isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
    return next(ApiError.badRequest("ID người dùng không hợp lệ, phải là số nguyên dương"));
  }
  req.params.id = numId;
  next();
};

const validateCreateUser = (req, res, next) => {
  const { username, email, password, full_name, role } = req.body;
  const errors = [];

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    errors.push({ field: "username", message: "Username tối thiểu 3 ký tự" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push({ field: "email", message: "Email không hợp lệ" });
  }

  if (!password || password.length < 6) {
    errors.push({ field: "password", message: "Mật khẩu tối thiểu 6 ký tự" });
  }

  const validRoles = Object.values(ROLES);
  if (role && !validRoles.includes(role)) {
    errors.push({ field: "role", message: `Role không hợp lệ. Phải là một trong: ${validRoles.join(", ")}` });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest("Dữ liệu tạo người dùng không hợp lệ", errors));
  }

  req.body.username = username.trim().toLowerCase();
  req.body.email = email.trim().toLowerCase();
  req.body.full_name = full_name ? full_name.trim() : null;
  req.body.role = role || ROLES.MEMBER;
  next();
};

const validateUpdateProfile = (req, res, next) => {
  const { full_name, password } = req.body;
  const data = {};

  if (full_name !== undefined) {
    if (typeof full_name !== "string" || full_name.trim().length === 0) {
      return next(ApiError.badRequest("Họ và tên không được để rỗng"));
    }
    data.full_name = full_name.trim();
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 6) {
      return next(ApiError.badRequest("Mật khẩu mới phải có tối thiểu 6 ký tự"));
    }
    data.password = password;
  }

  if (Object.keys(data).length === 0) {
    return next(ApiError.badRequest("Không có trường dữ liệu nào được cung cấp để cập nhật"));
  }

  req.validatedBody = data;
  next();
};

module.exports = {
  validateUserId,
  validateCreateUser,
  validateUpdateProfile,
};
