// Định nghĩa các trạng thái và độ ưu tiên của Task
const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

module.exports = {
  TASK_STATUS,
  TASK_PRIORITY,
};
