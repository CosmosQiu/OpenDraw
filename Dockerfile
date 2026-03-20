# ==================== MovieClaw App Dockerfile ====================
# 【演示版本容器化配置】
# 多阶段构建：Node构建 → Nginx服务
# =================================================================

# ==================== 构建阶段 ====================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装pnpm（更快的包管理器）
RUN npm install -g pnpm

# 复制依赖文件
COPY app/package.json app/pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY app/ .

# 构建生产版本
RUN pnpm build

# ==================== 运行阶段 ====================
FROM nginx:alpine

# 复制构建产物到Nginx目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置（支持SPA路由）
COPY app/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
