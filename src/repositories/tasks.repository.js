const { db } = require("../config/database");

class TasksRepository {
  async create({ title, description, status, priority, creator_id, assignee_id, due_date }, connection = db) {
    const [result] = await connection.execute(
      `INSERT INTO tasks (title, description, status, priority, creator_id, assignee_id, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, status, priority, creator_id, assignee_id, due_date]
    );
    return result.insertId;
  }

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT 
        t.id, t.title, t.description, t.status, t.priority, t.due_date, 
        t.created_at, t.updated_at,
        c.id as creator_id, c.username as creator_username, c.full_name as creator_name,
        a.id as assignee_id, a.username as assignee_username, a.full_name as assignee_name
       FROM tasks t
       JOIN users c ON t.creator_id = c.id
       LEFT JOIN users a ON t.assignee_id = a.id
       WHERE t.id = ? AND t.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  async findAll({
    page = 1,
    limit = 10,
    status = null,
    priority = null,
    assignee_id = null,
    creator_id = null,
    search = null,
    sortBy = "created_at",
    sortOrder = "DESC",
  }) {
    const offset = (page - 1) * limit;
    const conditions = ["t.deleted_at IS NULL"];
    const params = [];

    if (status) {
      conditions.push("t.status = ?");
      params.push(status);
    }

    if (priority) {
      conditions.push("t.priority = ?");
      params.push(priority);
    }

    if (assignee_id) {
      conditions.push("t.assignee_id = ?");
      params.push(assignee_id);
    }

    if (creator_id) {
      conditions.push("t.creator_id = ?");
      params.push(creator_id);
    }

    if (search) {
      conditions.push("(t.title LIKE ? OR t.description LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term);
    }

    const whereClause = conditions.join(" AND ");

    // 1. Đếm tổng số lượng bản ghi thỏa mãn điều kiện
    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total FROM tasks t WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // 2. Truy vấn danh sách có phân trang và JOIN để lấy thông tin creator/assignee
    const safeSortBy = ["created_at", "due_date", "priority", "status", "title"].includes(sortBy)
      ? `t.${sortBy}`
      : "t.created_at";
    const safeSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [rows] = await db.query(
      `SELECT 
        t.id, t.title, t.description, t.status, t.priority, t.due_date, 
        t.created_at, t.updated_at,
        c.id as creator_id, c.username as creator_username, c.full_name as creator_name,
        a.id as assignee_id, a.username as assignee_username, a.full_name as assignee_name
       FROM tasks t
       JOIN users c ON t.creator_id = c.id
       LEFT JOIN users a ON t.assignee_id = a.id
       WHERE ${whereClause}
       ORDER BY ${safeSortBy} ${safeSortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id, updateData) {
    const allowed = ["title", "description", "status", "priority", "assignee_id", "due_date"];
    const fields = allowed.filter((key) => updateData[key] !== undefined);
    if (fields.length === 0) return 0;

    const setClauses = fields.map((key) => `\`${key}\` = ?`).join(", ");
    const values = fields.map((key) => updateData[key]);

    const [result] = await db.execute(
      `UPDATE tasks SET ${setClauses} WHERE id = ? AND deleted_at IS NULL`,
      [...values, id]
    );
    return result.affectedRows;
  }

  async updateStatus(id, status) {
    const [result] = await db.execute(
      `UPDATE tasks SET status = ? WHERE id = ? AND deleted_at IS NULL`,
      [status, id]
    );
    return result.affectedRows;
  }

  async assign(id, assignee_id) {
    const [result] = await db.execute(
      `UPDATE tasks SET assignee_id = ? WHERE id = ? AND deleted_at IS NULL`,
      [assignee_id, id]
    );
    return result.affectedRows;
  }

  async softDelete(id) {
    const [result] = await db.execute(
      `UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return result.affectedRows;
  }

  async attachTags(taskId, tagIds, connection = db) {
    if (!tagIds || tagIds.length === 0) return;

    // Xóa liên kết cũ trong bảng trung gian
    await connection.execute(`DELETE FROM task_tags WHERE task_id = ?`, [taskId]);

    // Thêm các liên kết mới
    const values = tagIds.map((tagId) => `(${taskId}, ${tagId})`).join(", ");
    await connection.query(`INSERT INTO task_tags (task_id, tag_id) VALUES ${values}`);
  }

  async getTags(taskId) {
    const [rows] = await db.execute(
      `SELECT tg.id, tg.name, tg.color 
       FROM tags tg
       JOIN task_tags tt ON tg.id = tt.tag_id
       WHERE tt.task_id = ?`,
      [taskId]
    );
    return rows;
  }

  async getSummary(creatorId = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN due_date < NOW() AND status != 'completed' AND status != 'cancelled' THEN 1 ELSE 0 END) as overdue_count
      FROM tasks 
      WHERE deleted_at IS NULL
    `;
    const params = [];
    if (creatorId) {
      sql += " AND creator_id = ?";
      params.push(creatorId);
    }

    const [rows] = await db.execute(sql, params);
    return rows[0];
  }
}

module.exports = new TasksRepository();
