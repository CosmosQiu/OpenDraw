# SoulMovie Sync Server

基于 tldraw sync 实现的实时协作同步服务器，用于多用户间同步画布数据。

## 功能特性

- 实时协作：多用户同时编辑同一画布，实时同步所有更改
- 房间管理：支持多个独立房间，每个房间独立管理会话
- 数据持久化：自动保存画布数据到文件系统，重启后自动恢复
- 空闲房间清理：无活跃会话且空闲超过 5 分钟的房间会自动释放内存与定时器
- 自定义 Schema：支持 SoulMovie 自定义节点和连接类型
- 健康检查：提供健康检查和房间状态查询接口

## 项目结构

```text
sync-server/
├── src/
│   └── server.ts      # 服务器主入口文件
├── package.json
├── tsconfig.json
└── pnpm-lock.yaml
```

## 快速开始

### 1. 安装依赖

```bash
cd sync-server
pnpm install
```

### 2. 启动开发服务器

```bash
pnpm dev
```

服务器默认在 `http://localhost:8787` 运行。

### 3. 构建生产版本

```bash
pnpm build
```

### 4. 运行生产版本

```bash
pnpm start
```

## 环境配置

可以通过环境变量配置服务器：

| 环境变量 | 说明       | 默认值 |
| -------- | ---------- | ------ |
| `PORT`   | 服务器端口 | `8787` |

## API 端点

| 端点      | 方法 | 描述                                                 |
| --------- | ---- | ---------------------------------------------------- |
| `/health` | GET  | 健康检查，返回服务状态和当前房间数                   |
| `/rooms`  | GET  | 获取所有房间信息，包括会话数、文档时钟和最后访问时间 |

## WebSocket 连接

连接到同步服务器使用 WebSocket 协议：

```text
ws://localhost:8787/sync/{roomId}?sessionId={sessionId}
```

- `roomId`：房间标识符，同一房间的用户会同步数据
- `sessionId`：会话标识符（可选，服务器会自动生成）

## 数据持久化

### 自动保存机制

Sync Server 会自动保存每个房间的画布数据：

- 保存频率：每 5 秒自动保存一次
- 存储格式：JSON 格式的房间快照
- 存储位置：`sync-server/data/{roomId}.json`
- 自动加载：房间首次被访问时自动加载历史数据

### 房间清理机制

为了避免长期运行时房间和定时器持续占用内存，Sync Server 内置了空闲清理机制：

- 触发条件：房间没有活跃会话，且最后访问时间距离当前超过 5 分钟
- 清理内容：释放房间实例、停止自动保存定时器
- 清理前保护：在释放前会先执行一次快照保存
- 恢复方式：后续再次访问同一房间时，会从磁盘快照重新加载

这意味着：

- 活跃协作中的房间不会被清理
- 空闲房间不会无限期占用内存
- 已保存的数据不会因为房间被清理而丢失

### 数据文件结构

每个房间的数据文件包含：

```json
{
  "documentClock": 123,
  "tombstoneHistoryStartsAtClock": 0,
  "schema": { ... },
  "documents": [
    {
      "state": { "id": "...", ... },
      "lastChangedClock": 100
    }
  ],
  "tombstones": {}
}
```

### 数据备份

建议定期备份 `sync-server/data/` 目录：

```bash
# 备份所有房间数据
cp -r sync-server/data sync-server/data-backup-$(date +%Y%m%d)
```

### 数据恢复

如果需要恢复数据：

1. 停止 Sync Server
2. 将备份的数据文件复制到 `sync-server/data/` 目录
3. 重启 Sync Server
4. 访问对应房间即可恢复数据

## 技术栈

- **Node.js** - 运行时环境
- **TypeScript** - 类型安全
- **Express** - HTTP 服务器框架
- **ws** - WebSocket 服务器
- **@tldraw/sync-core** - tldraw 同步核心库
- **@tldraw/tlschema** - tldraw schema 库
- **uuid** - 生成唯一标识符
- **cors** - 跨域资源共享

## 自定义 Schema

服务器支持 SoulMovie 自定义节点类型，包括：

- `model` - 模型节点
- `prompt` - 提示词节点
- `generate` - 生成节点
- `generate_text` - 文本生成节点
- `load_image` - 加载图像节点
- `preview` - 预览节点

## 许可证

MIT
