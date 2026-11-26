const usersService = require("../services/users.service");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getProfile = asyncHandler(async (req, res) => {
  const profile = await usersService.getProfile(req.user.id);
  return ApiResponse.success(res, "Lấy thông tin cá nhân thành công", profile);
});

const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await usersService.updateProfile(req.user.id, req.validatedBody);
  return ApiResponse.success(res, "Cập nhật thông tin cá nhân thành công", updatedUser);
});

const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, search, role, is_active } = req.query;
  const result = await usersService.getAllUsers({
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10)),
    search,
    role,
    is_active,
  });

  return ApiResponse.success(
    res,
    "Lấy danh sách người dùng thành công",
    result.items,
    200,
    {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    }
  );
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  return ApiResponse.success(res, "Lấy thông tin người dùng thành công", user);
});

const createUser = asyncHandler(async (req, res) => {
  const newUser = await usersService.createUser(req.body);
  return ApiResponse.created(res, "Tạo người dùng mới thành công", newUser);
});

const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await usersService.updateUser(req.params.id, req.body);
  return ApiResponse.success(res, "Cập nhật người dùng thành công", updatedUser);
});

const setUserStatus = asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  const user = await usersService.setUserStatus(req.params.id, is_active);
  return ApiResponse.success(res, "Cập nhật trạng thái người dùng thành công", user);
});

const deleteUser = asyncHandler(async (req, res) => {
  await usersService.deleteUser(req.params.id);
  return ApiResponse.success(res, "Xóa người dùng thành công");
});

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  setUserStatus,
  deleteUser,
};
