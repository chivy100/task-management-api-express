const tasksService = require("../services/tasks.service");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const createTask = asyncHandler(async (req, res) => {
  const task = await tasksService.createTask(req.body, req.user);
  return ApiResponse.created(res, "Tạo công việc mới thành công", task);
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await tasksService.getTaskById(req.params.id, req.user);
  return ApiResponse.success(res, "Lấy thông tin công việc thành công", task);
});

const getAllTasks = asyncHandler(async (req, res) => {
  const result = await tasksService.getAllTasks(req.queryParams, req.user);
  return ApiResponse.success(
    res,
    "Lấy danh sách công việc thành công",
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

const updateTask = asyncHandler(async (req, res) => {
  const task = await tasksService.updateTask(req.params.id, req.body, req.user);
  return ApiResponse.success(res, "Cập nhật công việc thành công", task);
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await tasksService.updateStatus(req.params.id, status, req.user);
  return ApiResponse.success(res, "Cập nhật trạng thái công việc thành công", task);
});

const assignTask = asyncHandler(async (req, res) => {
  const { assignee_id } = req.body;
  const task = await tasksService.assignTask(req.params.id, assignee_id, req.user);
  return ApiResponse.success(res, "Phân công công việc thành công", task);
});

const deleteTask = asyncHandler(async (req, res) => {
  await tasksService.deleteTask(req.params.id, req.user);
  return ApiResponse.success(res, "Xóa công việc thành công");
});

module.exports = {
  createTask,
  getTaskById,
  getAllTasks,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
};
