# ============================================================
# DOCKERFILE CHO PRODUCTION (MULTI-STAGE BUILD)
# Tối ưu hóa dung lượng, bảo mật bằng tài khoản non-root
# ============================================================

# STAGE 1: Build & Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Sao chép file khai báo thư viện
COPY package*.json ./

# Cài đặt toàn bộ thư viện cần thiết cho build
RUN npm ci

# STAGE 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Thiết lập biến môi trường chạy thật
ENV NODE_ENV=production

# Sao chép node_modules từ stage build (chỉ giữ production dependencies)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Sao chép toàn bộ mã nguồn
COPY src/ ./src/
COPY .env.example ./

# BẢO MẬT: Chuyển sang người dùng không có quyền root (non-root user: node)
USER node

# Mở cổng lắng nghe trong container
EXPOSE 8000

# Lệnh khởi chạy server chính thức
CMD ["node", "src/server.js"]
