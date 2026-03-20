# MovieClaw 容器化部署指南

本文档提供两种部署方式，你可以根据需求选择：

- **方式一**：单独构建镜像并运行容器（更灵活）
- **方式二**：使用 Docker Compose 一键启动（更简单）

---

## 方式一：单独构建 + 运行（推荐有经验用户）

这种方式适合需要自定义运行参数或集成到现有容器编排系统的场景。

### 1. 构建镜像

```bash
# 在项目根目录执行
docker build -t movieclaw-demo:latest .
```

构建过程：
- 使用 Node 20 Alpine 作为构建环境
- 使用 pnpm 安装依赖
- 执行 `pnpm build` 生成静态文件
- 使用 Nginx Alpine 作为运行环境
- 配置 SPA 路由支持

### 2. 运行容器

```bash
# 基本运行
docker run -d -p 80:80 --name movieclaw movieclaw-demo:latest

# 带健康检查的运行
docker run -d \
  -p 80:80 \
  --name movieclaw \
  --health-cmd="wget --no-verbose --tries=1 --spider http://localhost/ || exit 1" \
  --health-interval=30s \
  movieclaw-demo:latest
```

### 3. 常用管理命令

```bash
# 查看日志
docker logs -f movieclaw

# 停止容器
docker stop movieclaw

# 删除容器
docker rm movieclaw

# 进入容器调试
docker exec -it movieclaw sh

# 查看健康状态
docker inspect --format='{{.State.Health.Status}}' movieclaw
```

---

## 方式二：Docker Compose 一键启动（推荐快速体验）

这种方式适合快速启动和体验，无需关心构建细节。

### 1. 启动服务

```bash
# 在项目根目录执行
docker-compose up -d
```

这会：
- 自动构建镜像（如不存在）
- 启动 Nginx 服务
- 配置健康检查
- 自动重启（unless-stopped）

### 2. 查看状态

```bash
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 仅查看最后50行
docker-compose logs --tail=50
```

### 3. 停止服务

```bash
# 停止但不删除数据
docker-compose stop

# 停止并删除容器（保留镜像）
docker-compose down

# 完全清理（包括镜像）
docker-compose down --rmi all
```

### 4. 重新构建

当代码更新后需要重新构建：

```bash
# 强制重新构建并启动
docker-compose up -d --build

# 或者先删除旧镜像再构建
docker-compose down --rmi all
docker-compose up -d --build
```

---

## 两种方式对比

| 特性 | 单独构建+运行 | Docker Compose |
|------|--------------|----------------|
| 复杂度 | 需要手动管理 | 一键管理 |
| 灵活性 | 高（可自定义参数） | 中（通过配置） |
| 适合场景 | 生产部署、集成编排 | 快速体验、开发测试 |
| 日志查看 | `docker logs` | `docker-compose logs` |
| 扩展服务 | 手动配置 | 修改 compose 文件即可 |

---

## 访问应用

两种方式启动后，访问方式相同：

```
http://localhost
```

如需修改端口（例如改为 8080）：

**方式一**：
```bash
docker run -d -p 8080:80 --name movieclaw movieclaw-demo:latest
```

**方式二**：
修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8080:80"
```

---

## 故障排查

### 端口被占用

```bash
# 检查 80 端口占用
netstat -an | findstr :80
# 或
lsof -i :80

# 使用其他端口启动
docker run -d -p 8080:80 --name movieclaw movieclaw-demo:latest
```

### 容器启动失败

```bash
# 查看详细日志
docker logs movieclaw

# 检查健康状态
docker inspect movieclaw | grep -A 5 "Health"
```

### 构建失败

```bash
# 检查 Dockerfile 语法
docker build -t movieclaw-demo:latest . --progress=plain

# 查看构建详情
docker build -t movieclaw-demo:latest . --no-cache
```

---

## 生产环境建议

### 使用方式一（单独构建+运行）的场景：
- 需要与现有 K8s/Docker Swarm 集成
- 需要自定义网络配置
- 需要挂载外部卷
- 需要精细控制资源限制

### 使用方式二（Compose）的场景：
- 单机快速部署
- 开发/测试环境
- 演示和POC

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `Dockerfile` | 根目录的构建配置（用于方式一） |
| `docker-compose.yml` | Compose 编排配置 |
| `app/Dockerfile` | 备用构建配置（如需单独构建前端） |
| `app/nginx.conf` | Nginx SPA 路由配置 |
