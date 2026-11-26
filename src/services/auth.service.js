const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const usersRepository = require("../repositories/users.repository");
const tokensRepository = require("../repositories/tokens.repository");
const ApiError = require("../utils/apiError");
const ROLES = require("../constants/roles");

class AuthService {
  /**
   * Tạo Access Token và Refresh Token JWT
   */
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });

    return { accessToken, refreshToken };
  }

  async register({ username, email, password, full_name }) {
    // 1. Kiểm tra xem username hoặc email đã tồn tại chưa
    const existingUsername = await usersRepository.findByUsername(username);
    if (existingUsername) {
      throw ApiError.conflict("Username này đã được đăng ký, vui lòng chọn username khác");
    }

    const existingEmail = await usersRepository.findByEmail(email);
    if (existingEmail) {
      throw ApiError.conflict("Email này đã được sử dụng, vui lòng chọn email khác");
    }

    // 2. Băm mật khẩu bằng Argon2id
    const password_hash = await argon2.hash(password);

    // 3. Tạo tài khoản trong Database với role mặc định là member
    const newUserId = await usersRepository.create({
      username,
      email,
      password_hash,
      full_name,
      role: ROLES.MEMBER,
    });

    // 4. Lấy thông tin người dùng sạch vừa tạo
    const user = await usersRepository.findById(newUserId);

    // 5. Cấp phát Token
    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    const tokens = this.generateTokens(tokenPayload);

    // 6. Lưu Refresh Token vào Database để kiểm soát phiên đăng nhập
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Hết hạn sau 7 ngày

    await tokensRepository.createToken({
      user_id: user.id,
      refresh_token: tokens.refreshToken,
      expires_at: expiresAt,
    });

    return { user, tokens };
  }

  async login({ identifier, password }) {
    // 1. Tìm người dùng theo username hoặc email
    const user = await usersRepository.findByIdentifier(identifier);
    if (!user) {
      throw ApiError.unauthorized("Tên đăng nhập hoặc mật khẩu không chính xác");
    }

    // 2. Kiểm tra trạng thái hoạt động của tài khoản
    if (!user.is_active) {
      throw ApiError.forbidden("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên.");
    }

    // 3. Xác thực mật khẩu qua thuật toán Argon2
    const isPasswordValid = await argon2.verify(user.password_hash, password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Tên đăng nhập hoặc mật khẩu không chính xác");
    }

    // 4. Khởi tạo Tokens
    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    const tokens = this.generateTokens(tokenPayload);

    // 5. Lưu Refresh Token mới vào Database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await tokensRepository.createToken({
      user_id: user.id,
      refresh_token: tokens.refreshToken,
      expires_at: expiresAt,
    });

    const userClean = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
    };

    return { user: userClean, tokens };
  }

  async refreshTokens(refreshToken) {
    // 1. Kiểm tra chữ ký và hạn của Refresh Token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw ApiError.unauthorized("Refresh Token không hợp lệ hoặc đã hết hạn");
    }

    // 2. Kiểm tra Refresh Token có nằm trong Database hay không (Chống Token lậu/đã bị thu hồi)
    const storedToken = await tokensRepository.findByToken(refreshToken);
    if (!storedToken) {
      throw ApiError.unauthorized("Refresh Token đã bị thu hồi hoặc không tồn tại");
    }

    // 3. Cơ chế Refresh Token Rotation (Bảo mật tối đa): Xóa token cũ ngay khi được dùng
    await tokensRepository.deleteByToken(refreshToken);

    // 4. Cấp phát cặp Token hoàn toàn mới
    const tokenPayload = { id: decoded.id, username: decoded.username, role: decoded.role };
    const tokens = this.generateTokens(tokenPayload);

    // 5. Lưu Refresh Token mới
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await tokensRepository.createToken({
      user_id: decoded.id,
      refresh_token: tokens.refreshToken,
      expires_at: expiresAt,
    });

    return tokens;
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await tokensRepository.deleteByToken(refreshToken);
    }
    return true;
  }
}

module.exports = new AuthService();
