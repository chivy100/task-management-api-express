const argon2 = require("argon2");
const usersRepository = require("../repositories/users.repository");
const ApiError = require("../utils/apiError");

class UsersService {
  async getProfile(userId) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("Không tìm thấy thông tin tài khoản");
    }
    return user;
  }

  async updateProfile(userId, { full_name, password }) {
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (password) {
      updateData.password_hash = await argon2.hash(password);
    }

    await usersRepository.update(userId, updateData);
    return await usersRepository.findById(userId);
  }

  async getAllUsers(queryParams) {
    return await usersRepository.findAll(queryParams);
  }

  async getUserById(id) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw ApiError.notFound(`Không tìm thấy người dùng với ID: ${id}`);
    }
    return user;
  }

  async createUser({ username, email, password, full_name, role }) {
    const existingUsername = await usersRepository.findByUsername(username);
    if (existingUsername) {
      throw ApiError.conflict("Username này đã tồn tại trong hệ thống");
    }

    const existingEmail = await usersRepository.findByEmail(email);
    if (existingEmail) {
      throw ApiError.conflict("Email này đã tồn tại trong hệ thống");
    }

    const password_hash = await argon2.hash(password);
    const newId = await usersRepository.create({
      username,
      email,
      password_hash,
      full_name,
      role,
    });

    return await usersRepository.findById(newId);
  }

  async updateUser(id, updateData) {
    await this.getUserById(id); // Đảm bảo user tồn tại

    const payload = {};
    if (updateData.full_name !== undefined) payload.full_name = updateData.full_name;
    if (updateData.role !== undefined) payload.role = updateData.role;
    if (updateData.is_active !== undefined) payload.is_active = updateData.is_active;
    if (updateData.password) {
      payload.password_hash = await argon2.hash(updateData.password);
    }

    await usersRepository.update(id, payload);
    return await usersRepository.findById(id);
  }

  async setUserStatus(id, isActive) {
    await this.getUserById(id);
    await usersRepository.update(id, { is_active: isActive ? 1 : 0 });
    return await usersRepository.findById(id);
  }

  async deleteUser(id) {
    await this.getUserById(id);
    await usersRepository.softDelete(id);
    return true;
  }
}

module.exports = new UsersService();
