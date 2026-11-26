const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");
const usersRepository = require("../repositories/users.repository");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(ApiError.unauthorized("Không tìm thấy Access Token hoặc định dạng Header không hợp lệ"));
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(ApiError.unauthorized("Access Token đã hết hạn, vui lòng cấp mới bằng Refresh Token"));
      }
      return next(ApiError.unauthorized("Access Token không hợp lệ hoặc sai chữ ký"));
    }

    // Kiểm tra tính hợp lệ và trạng thái của User trong Database
    const user = await usersRepository.findById(decoded.id);
    if (!user) {
      return next(ApiError.unauthorized("Tài khoản liên kết với token này không còn tồn tại"));
    }

    if (!user.is_active) {
      return next(ApiError.forbidden("Tài khoản của bạn đã bị khóa bởi Quản trị viên"));
    }

    // Gắn thông tin User đã xác thực vào Request Object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
