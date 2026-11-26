const express = require("express");
const router = express.Router();
const tasksController = require("../controllers/tasks.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/rbac.middleware");
const ROLES = require("../constants/roles");
const {
  validateTaskId,
  validateCreateTask,
  validateUpdateTaskStatus,
  validateAssignTask,
  validateTaskQuery,
} = require("../validators/task.validator");

// Tất cả các thao tác trên task đều yêu cầu đăng nhập
router.use(authenticate);

// 1. Lấy danh sách tasks (hỗ trợ phân trang, lọc, tìm kiếm)
router.get("/", validateTaskQuery, tasksController.getAllTasks);

// 2. Tạo công việc mới
router.post("/", validateCreateTask, tasksController.createTask);

// 3. Xem chi tiết một công việc
router.get("/:id", validateTaskId, tasksController.getTaskById);

// 4. Cập nhật toàn bộ thông tin công việc
router.put("/:id", validateTaskId, tasksController.updateTask);

// 5. Cập nhật trạng thái công việc (Pending, In Progress, Completed, Cancelled)
router.patch("/:id/status", validateTaskId, validateUpdateTaskStatus, tasksController.updateTaskStatus);

// 6. Gán việc cho người khác (Chỉ Admin và Manager)
router.patch("/:id/assign", authorize(ROLES.ADMIN, ROLES.MANAGER), validateTaskId, validateAssignTask, tasksController.assignTask);

// 7. Xóa mềm công việc
router.delete("/:id", validateTaskId, tasksController.deleteTask);

module.exports = router;
