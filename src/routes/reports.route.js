const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/rbac.middleware");
const ROLES = require("../constants/roles");

router.use(authenticate);

// Báo cáo thống kê (Admin và Manager)
router.get("/summary", authorize(ROLES.ADMIN, ROLES.MANAGER), reportsController.getSummary);

module.exports = router;
