// XỬ LÝ CÁC LOGIC VÀ GỬI VỀ CLIENT
const argon2 = require("argon2");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUserById,
} = require("../repository/users.repository");

async function getAllUsers(req, res) {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function getUser(req, res) {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function addUser(req, res) {
  try {
    const { username, email, password, full_name, role, is_active } = req.body;
    const hashedPassword = await argon2.hash(password);
    const id = await createUser({
      username,
      email,
      password: hashedPassword,
      full_name,
      role,
      is_active,
    });
    const user = await getUserById(id);
    res.status(201).json({ message: "Thêm người dùng thành công", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function editUser(req, res) {
  try {
    const { id } = req.params;
    const existing = await getUserById(id);
    if (!existing) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const data = { ...req.body };
    if (data.password) {
      data.password = await argon2.hash(data.password);
    }

    await updateUser(id, data);
    const user = await getUserById(id);
    res.status(200).json({ message: "Cập nhật người dùng thành công", user });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Username hoặc email đã tồn tại" });
    }
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteUser(req, res) {
  try {
    const affected = await deleteUserById(req.params.id);
    if (!affected) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.status(200).json({ message: "Xóa người dùng thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getAllUsers, getUser, addUser, editUser, deleteUser };
