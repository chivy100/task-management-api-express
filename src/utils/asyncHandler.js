// Higher-Order Function bao bọc async controller
// Tự động bắt Exception và chuyển tới next(err) để Error Middleware tập trung xử lý
// Loại bỏ hoàn toàn sự lặp lại của các khối try/catch trong Controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
