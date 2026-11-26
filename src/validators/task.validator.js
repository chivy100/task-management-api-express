const ApiError = require("../utils/apiError");
const { TASK_STATUS, TASK_PRIORITY } = require("../constants/taskStatus");

const validateTaskId = (req, res, next) => {
  const { id } = req.params;
  const numId = Number(id);
  if (!id || isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
    return next(ApiError.badRequest("ID công việc không hợp lệ, phải là số nguyên dương"));
  }
  req.params.id = numId;
  next();
};

const validateCreateTask = (req, res, next) => {
  const { title, description, status, priority, assignee_id, due_date, tag_ids } = req.body;
  const errors = [];

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    errors.push({ field: "title", message: "Tiêu đề công việc là bắt buộc" });
  } else if (title.trim().length > 255) {
    errors.push({ field: "title", message: "Tiêu đề không được vượt quá 255 ký tự" });
  }

  const validStatuses = Object.values(TASK_STATUS);
  if (status && !validStatuses.includes(status)) {
    errors.push({ field: "status", message: `Trạng thái không hợp lệ. Cho phép: ${validStatuses.join(", ")}` });
  }

  const validPriorities = Object.values(TASK_PRIORITY);
  if (priority && !validPriorities.includes(priority)) {
    errors.push({ field: "priority", message: `Độ ưu tiên không hợp lệ. Cho phép: ${validPriorities.join(", ")}` });
  }

  if (assignee_id !== undefined && assignee_id !== null) {
    const numAssignee = Number(assignee_id);
    if (isNaN(numAssignee) || !Number.isInteger(numAssignee) || numAssignee <= 0) {
      errors.push({ field: "assignee_id", message: "ID người được gán phải là số nguyên dương" });
    }
  }

  if (due_date) {
    const parsedDate = new Date(due_date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({ field: "due_date", message: "Ngày hạn chót không đúng định dạng ngày tháng" });
    }
  }

  if (tag_ids !== undefined) {
    if (!Array.isArray(tag_ids)) {
      errors.push({ field: "tag_ids", message: "tag_ids phải là một mảng các ID" });
    }
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest("Dữ liệu tạo công việc không hợp lệ", errors));
  }

  req.body.title = title.trim();
  req.body.description = description ? description.trim() : null;
  req.body.status = status || TASK_STATUS.PENDING;
  req.body.priority = priority || TASK_PRIORITY.MEDIUM;
  req.body.assignee_id = assignee_id ? Number(assignee_id) : null;
  req.body.due_date = due_date ? new Date(due_date) : null;
  req.body.tag_ids = Array.isArray(tag_ids) ? tag_ids.map(Number) : [];

  next();
};

const validateUpdateTaskStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = Object.values(TASK_STATUS);

  if (!status || !validStatuses.includes(status)) {
    return next(ApiError.badRequest(`Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(", ")}`));
  }

  next();
};

const validateAssignTask = (req, res, next) => {
  const { assignee_id } = req.body;
  if (assignee_id === undefined) {
    return next(ApiError.badRequest("Trường assignee_id là bắt buộc"));
  }

  if (assignee_id !== null) {
    const num = Number(assignee_id);
    if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
      return next(ApiError.badRequest("assignee_id phải là số nguyên dương hoặc null"));
    }
    req.body.assignee_id = num;
  }

  next();
};

const validateTaskQuery = (req, res, next) => {
  const { page, limit, status, priority, assignee_id, search, sortBy, sortOrder } = req.query;

  req.queryParams = {
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10)),
    status: status || null,
    priority: priority || null,
    assignee_id: assignee_id ? Number(assignee_id) : null,
    search: search ? search.trim() : null,
    sortBy: ["created_at", "due_date", "priority", "status", "title"].includes(sortBy) ? sortBy : "created_at",
    sortOrder: sortOrder && sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC",
  };

  next();
};

module.exports = {
  validateTaskId,
  validateCreateTask,
  validateUpdateTaskStatus,
  validateAssignTask,
  validateTaskQuery,
};
