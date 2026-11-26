const authService = require("../services/auth.service");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { username, email, password, full_name } = req.body;
  const result = await authService.register({ username, email, password, full_name });
  return ApiResponse.created(res, "Đăng ký tài khoản thành công", result);
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.login({ identifier, password });
  return ApiResponse.success(res, "Đăng nhập thành công", result);
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshTokens(refreshToken);
  return ApiResponse.success(res, "Cấp mới Token thành công", tokens);
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  return ApiResponse.success(res, "Đăng xuất thành công");
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
};
