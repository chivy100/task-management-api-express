const ApiError = require("../utils/apiError");

const validateRegister = (req, res, next) => {
  const { username, email, password, full_name } = req.body;
  const errors = [];

  // 1. Kiểm tra username
  if (!username || typeof username !== "string") {
    errors.push({ field: "username", message: "Username là bắt buộc và phải là chuỗi" });
  } else if (username.trim().length < 3 || username.trim().length > 30) {
    errors.push({ field: "username", message: "Username phải từ 3 đến 30 ký tự" });
  } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    errors.push({ field: "username", message: "Username chỉ được chứa chữ cái, số và dấu gạch dưới" });
  }

  // 2. Kiểm tra email bằng Regex chuẩn RFC 5322 cơ bản
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string") {
    errors.push({ field: "email", message: "Email là bắt buộc" });
  } else if (!emailRegex.test(email.trim())) {
    errors.push({ field: "email", message: "Định dạng email không hợp lệ" });
  }

  // 3. Kiểm tra độ mạnh của mật khẩu
  if (!password || typeof password !== "string") {
    errors.push({ field: "password", message: "Mật khẩu là bắt buộc" });
  } else if (password.length < 6) {
    errors.push({ field: "password", message: "Mật khẩu phải có tối thiểu 6 ký tự" });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest("Dữ liệu đăng ký không hợp lệ", errors));
  }

  // Sanitize
  req.body.username = username.trim().toLowerCase();
  req.body.email = email.trim().toLowerCase();
  req.body.full_name = full_name ? full_name.trim() : null;

  next();
};

const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;
  const errors = [];

  if (!identifier || typeof identifier !== "string" || identifier.trim() === "") {
    errors.push({ field: "identifier", message: "Username hoặc Email đăng nhập là bắt buộc" });
  }

  if (!password || typeof password !== "string") {
    errors.push({ field: "password", message: "Mật khẩu là bắt buộc" });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest("Vui lòng cung cấp đầy đủ thông tin đăng nhập", errors));
  }

  req.body.identifier = identifier.trim().toLowerCase();
  next();
};

const validateRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken || typeof refreshToken !== "string") {
    return next(ApiError.badRequest("Refresh token là bắt buộc"));
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateRefreshToken,
};
