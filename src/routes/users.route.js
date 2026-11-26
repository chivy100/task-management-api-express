const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/rbac.middleware");
const ROLES = require("../constants/roles");
const {
  validateUserId,
  validateCreateUser,
  validateUpdateProfile,
} = require("../validators/user.validator");

// Tất cả các route bên dưới đều yêu cầu đăng nhập
router.use(authenticate);

// 1. Quản lý Profile cá nhân
router.get("/me", usersController.getProfile);
router.put("/me", validateUpdateProfile, usersController.updateProfile);

// 2. Danh sách người dùng (Chỉ Admin và Manager)
router.get("/", authorize(ROLES.ADMIN, ROLES.MANAGER), usersController.getAllUsers);

// 3. Quản trị người dùng theo ID
router.get("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER), validateUserId, usersController.getUserById);
router.post("/", authorize(ROLES.ADMIN), validateCreateUser, usersController.createUser);
router.put("/:id", authorize(ROLES.ADMIN), validateUserId, usersController.updateUser);
router.patch("/:id/status", authorize(ROLES.ADMIN), validateUserId, usersController.setUserStatus);
router.delete("/:id", authorize(ROLES.ADMIN), validateUserId, usersController.deleteUser);

module.exports = router;
