const jwt = require("jsonwebtoken");
const { getOneUser } = require("../repository/users.repository");

// Kiểm tra các trường bắt buộc khi thêm user
const validation = (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Username, email và password là bắt buộc",
    });
  }
  next();
};

const verifyToken = (req, res, next) => {
  try {
    // Lấy token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy token" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// Kiểm tra trùng username hoặc email
const checkUserExists = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const result = await getOneUser(username, email);
    if (result) {
      return res.status(400).json({
        message: "Username hoặc email đã tồn tại",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  validation,
  verifyToken,
  checkUserExists,
};
