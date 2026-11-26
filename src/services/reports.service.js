const tasksRepository = require("../repositories/tasks.repository");
const ROLES = require("../constants/roles");

class ReportsService {
  async getSummary(currentUser) {
    // Admin xem tổng thể hệ thống, Manager xem các task do nhóm/mình tạo
    const creatorId = currentUser.role === ROLES.ADMIN ? null : currentUser.id;
    const summary = await tasksRepository.getSummary(creatorId);

    const total = Number(summary.total_tasks) || 0;
    const completed = Number(summary.completed_count) || 0;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(2) + "%" : "0%";

    return {
      totalTasks: total,
      pending: Number(summary.pending_count) || 0,
      inProgress: Number(summary.in_progress_count) || 0,
      completed,
      cancelled: Number(summary.cancelled_count) || 0,
      overdue: Number(summary.overdue_count) || 0,
      completionRate,
    };
  }
}

module.exports = new ReportsService();
