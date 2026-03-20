# SoulMovie Backend

FastAPI 实现的 AI 图像生成后端服务，当前图片生成链路基于豆包 Seedream 与火山方舟 Ark API。

## 功能特性

- 图片生成：支持豆包 Seedream 文本生图与图生图
- 图片输入：支持将前序节点输出图片作为可选输入
- 图片存储：本地文件系统存储生成的图片
- 可配置跨域：通过环境变量配置允许访问的前端来源
- 文本生成占位接口：保留 `/api/generate-text` 路由用于前端流程兼容

## 项目结构

```text
api-server/
├── app/
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置管理
│   ├── providers/           # AI 服务提供方
│   │   ├── __init__.py
│   │   ├── doubao.py        # 豆包 Seedream / Ark API 实现
│   │   └── types.py         # 类型定义和工具函数
│   └── routes/              # API 路由
│       ├── __init__.py
│       ├── generate.py      # 图片生成
│       ├── generate_text.py # 文本生成占位接口
│       └── images.py        # 图像上传/下载
├── .env.example             # 环境变量示例
└── requirements.txt         # 依赖列表
```

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
# 或者使用uv安装依赖
uv sync
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
ARK_API_KEY=your_ark_api_key_here
IMAGE_STORAGE_PATH=./data/images
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 3. 启动服务

```bash
uv run server
```

服务启动后访问：

- API 文档：<http://localhost:8000/docs>
- 健康检查：<http://localhost:8000/health>

## API 保护机制

### CORS 配置

后端默认允许本地开发环境访问：

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- 以及 `localhost` / `127.0.0.1` 的其他本地端口

你也可以通过环境变量 `CORS_ORIGINS` 自定义多个来源，使用英文逗号分隔，例如：

```env
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
```

## API 端点

| 端点                     | 方法 | 描述             |
| ------------------------ | ---- | ---------------- |
| `/`                      | GET  | 服务信息         |
| `/health`                | GET  | 健康检查         |
| `/api/generate`          | POST | 豆包图片生成     |
| `/api/generate-text`     | POST | 文本占位接口     |
| `/api/images/{image_id}` | GET  | 下载图像         |
| `/api/images/{image_id}` | POST | 上传图像         |

## API 使用示例

### 图片生成

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao:doubao-seedream-5-0-260128",
    "prompt": "一只站在霓虹街头的赛博朋克猫",
    "size": "2K",
    "outputFormat": "png",
    "responseFormat": "url",
    "watermark": false,
    "seed": 42
  }'
```

### 文本生成

```bash
curl -X POST http://localhost:8000/api/generate-text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "请为这张电影海报写一句宣传语",
    "input": "科幻、悬疑、未来都市"
  }'
```

### 上传图片

```bash
curl -X POST http://localhost:8000/api/images/upload \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "filename": "poster.png"
  }'
```

## 环境变量

| 环境变量             | 说明                         | 默认值                                        |
| -------------------- | ---------------------------- | --------------------------------------------- |
| `ARK_API_KEY`        | 火山方舟 Ark API 密钥        | 必填                                          |
| `IMAGE_STORAGE_PATH` | 图像存储路径                 | `./data/images`                               |
| `CORS_ORIGINS`       | 允许访问的前端来源，逗号分隔 | `http://localhost:5173,http://127.0.0.1:5173` |

## 开发说明

### 添加新的提供方

1. 在 `app/providers/` 下创建新的提供方文件
2. 实现统一的生成接口
3. 在 `app/providers/__init__.py` 中注册

### 添加新的路由

1. 在 `app/routes/` 下创建新的路由文件
2. 创建 `APIRouter` 实例并定义端点
3. 在 `app/routes/__init__.py` 中注册

## 依赖项

- FastAPI - Web 框架
- Uvicorn - ASGI 服务器
- Pydantic - 数据验证
- HTTPX - 异步 HTTP 客户端
- aiofiles - 异步文件操作

## 许可证

MIT
