const { db } = require("../config/database");
const tasksRepository = require("../repositories/tasks.repository");
const usersRepository = require("../repositories/users.repository");
const ApiError = require("../utils/apiError");
const ROLES = require("../constants/roles");
const { TASK_STATUS } = require("../constants/taskStatus");

class TasksService {
  async createTask(taskData, currentUser) {
    // 1. Kiểm tra người được gán (assignee) nếu có
    if (taskData.assignee_id) {
      // Member chỉ được phép tự gán việc cho chính mình
      if (currentUser.role === ROLES.MEMBER && taskData.assignee_id !== currentUser.id) {
        throw ApiError.forbidden("Thành viên (Member) không được phép giao việc cho người khác");
      }

      const assignee = await usersRepository.findById(taskData.assignee_id);
      if (!assignee) {
        throw ApiError.badRequest("Người được giao việc (Assignee) không tồn tại");
      }
      if (!assignee.is_active) {
        throw ApiError.badRequest("Không thể giao việc cho tài khoản đang bị vô hiệu hóa");
      }
    }

    // 2. Sử dụng Database Transaction để đảm bảo tính nguyên tử (Atomicity) khi tạo Task và gắn Tags
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const taskId = await tasksRepository.create(
        {
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          creator_id: currentUser.id,
          assignee_id: taskData.assignee_id,
          due_date: taskData.due_date,
        },
        connection
      );

      // Gắn Tags nếu có
      if (taskData.tag_ids && taskData.tag_ids.length > 0) {
        await tasksRepository.attachTags(taskId, taskData.tag_ids, connection);
      }

      await connection.commit();

      // Lấy chi tiết Task vừa tạo kèm tags
      const createdTask = await tasksRepository.findById(taskId);
      createdTask.tags = await tasksRepository.getTags(taskId);
      return createdTask;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getTaskById(taskId, currentUser) {
    const task = await tasksRepository.findById(taskId);
    if (!task) {
      throw ApiError.notFound(`Không tìm thấy công việc với ID: ${taskId}`);
    }

    // Kiểm tra quyền riêng tư (Data Isolation):
    // Member chỉ được xem task do mình tạo hoặc được giao cho mình
    if (currentUser.role === ROLES.MEMBER) {
      if (task.creator_id !== currentUser.id && task.assignee_id !== currentUser.id) {
        throw ApiError.forbidden("Bạn không có quyền truy cập vào công việc này");
      }
    }

    task.tags = await tasksRepository.getTags(taskId);
    return task;
  }

  async getAllTasks(queryParams, currentUser) {
    const filters = { ...queryParams };

    // Nếu là Member: Chỉ xem các công việc liên quan đến bản thân
    if (currentUser.role === ROLES.MEMBER) {
      filters.assignee_id = currentUser.id;
    }

    const result = await tasksRepository.findAll(filters);

    // Bổ sung danh sách Tags cho từng task
    for (const task of result.items) {
      task.tags = await tasksRepository.getTags(task.id);
    }

    return result;
  }

  async updateTask(taskId, updateData, currentUser) {
    const task = await this.getTaskById(taskId, currentUser);

    // Quyền cập nhật nội dung Task: Admin, Manager, hoặc Creator của task đó
    if (currentUser.role === ROLES.MEMBER && task.creator_id !== currentUser.id) {
      throw ApiError.forbidden("Bạn chỉ có thể chỉnh sửa thông tin công việc do chính mình tạo ra");
    }

    if (updateData.assignee_id) {
      const assignee = await usersRepository.findById(updateData.assignee_id);
      if (!assignee || !assignee.is_active) {
        throw ApiError.badRequest("Người được giao việc không hợp lệ hoặc đã bị vô hiệu hóa");
      }
    }

    await tasksRepository.update(taskId, updateData);
    return await this.getTaskById(taskId, currentUser);
  }

  async updateStatus(taskId, newStatus, currentUser) {
    const task = await this.getTaskById(taskId, currentUser);

    // Kiểm tra quy tắc chuyển đổi trạng thái (State Machine Invariant)
    if (task.status === TASK_STATUS.CANCELLED && newStatus === TASK_STATUS.COMPLETED) {
      throw ApiError.badRequest("Không thể hoàn thành một công việc đã bị hủy bỏ");
    }

    await tasksRepository.updateStatus(taskId, newStatus);
    return await this.getTaskById(taskId, currentUser);
  }

  async assignTask(taskId, assigneeId, currentUser) {
    // Chỉ Admin và Manager mới có quyền giao việc
    if (currentUser.role === ROLES.MEMBER) {
      throw ApiError.forbidden("Chỉ Quản lý (Manager) hoặc Quản trị viên (Admin) mới có quyền phân bổ công việc");
    }

    await this.getTaskById(taskId, currentUser);

    if (assigneeId !== null) {
      const assignee = await usersRepository.findById(assigneeId);
      if (!assignee || !assignee.is_active) {
        throw ApiError.badRequest("Tài khoản được giao việc không tồn tại hoặc đã bị khóa");
      }
    }

    await tasksRepository.assign(taskId, assigneeId);
    return await this.getTaskById(taskId, currentUser);
  }

  async deleteTask(taskId, currentUser) {
    const task = await this.getTaskById(taskId, currentUser);

    // Chỉ Admin hoặc người tạo mới có quyền xóa task
    if (currentUser.role !== ROLES.ADMIN && task.creator_id !== currentUser.id) {
      throw ApiError.forbidden("Bạn không có quyền xóa công việc này");
    }

    await tasksRepository.softDelete(taskId);
    return true;
  }
}

module.exports = new TasksService();
