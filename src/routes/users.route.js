// CẤU HÌNH ĐỊNH TUYẾN CÁC ROUTERS
const {
  getAllUsers,
  getUser,
  addUser,
  editUser,
  deleteUser,
} = require("../controllers/users.controller");
const { validation, checkUserExists } = require("../middlewares/middlewares");

const usersRouter = (app) => {
  app.get("/api/v1/users", getAllUsers);
  app.get("/api/v1/users/:id", getUser);
  app.post("/api/v1/users", validation, checkUserExists, addUser);
  app.put("/api/v1/users/:id", editUser);
  app.delete("/api/v1/users/:id", deleteUser);
};

module.exports = { usersRouter };
