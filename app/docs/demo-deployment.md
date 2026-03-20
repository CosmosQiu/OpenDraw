# MovieClaw 演示版本部署文档

本文档说明如何构建和部署 MovieClaw 演示版本。

## 概述

演示版本为纯前端实现：
- **登录系统**：localStorage 模拟，无真实后端验证
- **项目管理**：localStorage 存储项目列表
- **画布编辑**：基于 tldraw 的节点编排编辑器

⚠️ **警告**：此版本仅用于演示，所有数据存储在浏览器本地，不适合生产环境使用。

## 目录结构

```
MovieClaw/
├── app/                    # 前端应用（合并后的统一应用）
│   ├── Dockerfile         # Docker 构建配置
│   ├── nginx.conf         # Nginx SPA 路由配置
│   ├── .dockerignore      # Docker 构建排除文件
│   └── src/               # 源代码
├── docker-compose.yml     # Docker Compose 配置
└── README.md
```

## 本地开发

### 前置要求

- Node.js 20+
- pnpm（推荐）或 npm

### 安装依赖

```bash
cd app
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

开发服务器默认运行在 http://localhost:5173

### 构建生产版本

```bash
pnpm build
```

构建输出位于 `app/dist/` 目录。

## Docker 部署

### 方法一：直接使用 Docker

```bash
# 构建镜像
cd app
docker build -t movieclaw-demo .

# 运行容器
docker run -d -p 80:80 --name movieclaw movieclaw-demo
```

访问 http://localhost 即可使用。

### 方法二：使用 Docker Compose（推荐）

```bash
# 在项目根目录执行
docker-compose up -d
```

这将：
1. 构建前端应用镜像
2. 启动 Nginx 服务
3. 映射主机 80 端口到容器 80 端口

查看服务状态：
```bash
docker-compose ps
```

查看日志：
```bash
docker-compose logs -f
```

停止服务：
```bash
docker-compose down
```

## 路由说明

演示版本使用 HashRouter，路由格式为 `/#/path`：

| 路径 | 说明 |
|------|------|
| `/#/` | 自动跳转（已登录→项目列表，未登录→登录页） |
| `/#/login` | 登录页面 |
| `/#/projects` | 项目列表页面 |
| `/#/canvas/:projectId` | 画布编辑页面 |

使用 HashRouter 是为了避免部署时服务器端路由配置问题，适合静态站点部署。

## 演示数据

首次访问时，应用会自动创建 6 个示例项目：
- 品牌宣传片 - 春季新品
- 社媒短视频系列
- 产品发布会 Keynote
- 创意广告脚本
- 年终汇报动画
- 用户访谈剪辑

## 技术栈

- **框架**：React 19 + TypeScript
- **路由**：react-router-dom 7.x（HashRouter）
- **构建工具**：Vite 7.x
- **样式**：Tailwind CSS
- **画布引擎**：tldraw 4.x
- **图标**：lucide-react
- **弹窗**：@radix-ui/react-dialog
- **类名工具**：clsx + tailwind-merge

## 容器镜像说明

### 构建阶段
- 基于 `node:20-alpine`
- 使用 pnpm 安装依赖
- 执行 `pnpm build` 生成静态文件

### 运行阶段
- 基于 `nginx:alpine`
- 复制构建产物到 `/usr/share/nginx/html`
- 使用自定义 nginx.conf 支持 SPA 路由
- 暴露 80 端口
- 配置健康检查端点 `/health`

## 注意事项

1. **数据持久化**：所有数据存储在浏览器 localStorage，清空浏览器数据会丢失所有项目
2. **多设备同步**：不支持，每台设备数据独立
3. **协作编辑**：不支持，纯单机版本
4. **后端接入**：后续需替换 `src/auth/` 和 `src/project/` 模块为真实 API 调用
5. **浏览器兼容**：推荐使用 Chrome/Edge/Firefox 最新版本

## 故障排查

### 页面显示空白
- 检查浏览器控制台是否有错误
- 确认 Nginx 配置正确（SPA fallback 到 index.html）

### 样式丢失
- 确认 Tailwind CSS 构建成功
- 检查 `app/dist/assets/` 是否有 CSS 文件

### 路由跳转异常
- 确认使用 HashRouter（路径应包含 `/#/`）
- 检查 nginx.conf 的 try_files 配置

## 后续演进

演示版本为临时方案，正式版本需：
1. 接入真实后端 API（用户认证、项目管理）
2. 接入 syncer 服务（画布数据同步）
3. 接入 worker 服务（工作流执行）
4. 使用 BrowserRouter 替代 HashRouter
5. 添加用户权限管理
6. 支持团队协作和实时同步
