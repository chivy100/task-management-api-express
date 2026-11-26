const reportsService = require("../services/reports.service");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getSummary = asyncHandler(async (req, res) => {
  const summary = await reportsService.getSummary(req.user);
  return ApiResponse.success(res, "Lấy dữ liệu thống kê thành công", summary);
});

module.exports = {
  getSummary,
};
