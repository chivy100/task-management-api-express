const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.route");
const userRoutes = require("./users.route");
const taskRoutes = require("./tasks.route");
const reportRoutes = require("./reports.route");

// Endpoint gốc giới thiệu và điều hướng các API tại /api/v1
router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: " Chào mừng bạn đến với Task Management RESTful API!",
    version: "1.0.0",
    status: "Server is Running & Healthy",
    available_endpoints: {
      authentication: {
        register: "POST /api/v1/auth/register",
        login: "POST /api/v1/auth/login",
        refreshToken: "POST /api/v1/auth/refresh-token",
        logout: "POST /api/v1/auth/logout",
      },
      users: {
        getProfile: "GET /api/v1/users/me (Yêu cầu Token)",
        updateProfile: "PUT /api/v1/users/me (Yêu cầu Token)",
        getAllUsers: "GET /api/v1/users (Yêu cầu quyền Admin/Manager)",
      },
      tasks: {
        getAllTasks: "GET /api/v1/tasks (Yêu cầu Token - Hỗ trợ lọc, tìm kiếm, phân trang)",
        createTask: "POST /api/v1/tasks (Yêu cầu Token)",
        getTaskById: "GET /api/v1/tasks/:id (Yêu cầu Token)",
        updateStatus: "PATCH /api/v1/tasks/:id/status (Yêu cầu Token)",
      },
      reports: {
        summary: "GET /api/v1/reports/summary (Yêu cầu quyền Admin/Manager)",
      },
    },
  });
});

// Gắn tiền tố API v1 cho từng phân hệ
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/tasks", taskRoutes);
router.use("/reports", reportRoutes);

module.exports = router;
