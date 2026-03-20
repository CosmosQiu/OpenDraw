# OpenTapNow App

这是 OpenTapNow 当前演示分支的前端应用。它基于 React、Vite、tldraw 和 Tailwind CSS 构建，用于演示登录、项目管理、画布编辑和本地保存等前端流程。

> **重要说明**
>
> - **当前目录 `app` 是这个演示分支的唯一实际运行入口**
> - **当前分支没有接入真实后端**
> - **当前分支没有接入真实同步服务**
> - **当前可见功能全部由前端实现或前端占位实现提供**
> - **不要用于生产环境**

## 当前状态

这个 `app` 目录对应的是**前端演示版本**，不是完整生产版本。

当前已完成并可本地体验的能力包括：

- 登录页
- 项目管理页
- 画布编辑页
- 本地项目存储
- 本地画布持久化
- JSON 导出
- 部分演示级 AI / 节点交互

当前没有正式接入的能力包括：

- 真实后端接口
- 真实数据库
- 真实用户系统
- 真实多人协同同步
- 生产级部署和运维能力

## 页面与流程

当前前端演示流程如下：

1. 启动应用后进入登录页
2. 登录成功后进入项目列表页
3. 在项目页创建、复制、重命名、删除项目
4. 进入项目画布页进行编辑
5. 从画布返回项目页
6. 在项目页退出登录并回到登录页

## 数据存储方式

当前分支的数据全部为**前端本地存储方案**：

- 登录会话：`localStorage`
- 项目列表：`localStorage`
- 画布内容：基于本地持久化键保存到浏览器
- 项目导出：浏览器下载 JSON 文件

这意味着：

- 清理浏览器缓存会导致演示数据丢失
- 不同浏览器 / 不同设备之间不会共享数据
- 这只是演示方案，不是正式持久化架构

## 技术栈

- React 19
- Vite 7
- TypeScript 5
- tldraw 4
- Tailwind CSS 3
- Radix UI
- lucide-react

## 目录结构

```text
app/
├─ src/
│  ├─ agent/               画布能力桥接、项目保存与技能注册
│  ├─ api/                 前端请求封装与占位调用
│  ├─ auth/                本地登录会话管理
│  ├─ components/          页面与画布相关组件
│  ├─ connection/          连线图形、绑定与连接逻辑
│  ├─ nodes/               节点定义与节点类型实现
│  ├─ pages/               登录页、项目页、画布页
│  ├─ ports/               端口定义与交互逻辑
│  ├─ project/             本地项目管理
│  ├─ App.tsx              路由主入口
│  ├─ main.tsx             前端挂载入口
│  └─ index.css            全局样式与 Tailwind 层
├─ docs/
├─ index.html
├─ package.json
├─ postcss.config.js
├─ tailwind.config.js
├─ vite.config.ts
└─ README.md
```

## 安装依赖

在 `app` 目录执行：

```bash
pnpm install
```

## 本地开发

启动开发服务器：

```bash
pnpm dev
```

如果你要在演示版中直接调用 302.AI，请先在 `app` 目录创建本地环境文件：

```bash
cp .env.example .env
```

然后填写你的本地 API Key 与路由配置：

```env
VITE_302_API_KEY=你的302AI_API_KEY
VITE_302_BASE_URL=https://api.302.ai

VITE_302_ROUTE_CHAT_COMPLETIONS=/v1/chat/completions
VITE_302_ROUTE_IMAGE_GENERATIONS=/v1/images/generations
VITE_302_ROUTE_IMAGE_EDITS=/v1/images/edits
VITE_302_ROUTE_VIDEO_GENERATIONS=/302/video/submit
VITE_302_ROUTE_MUSIC_GENERATIONS=/302/music/submit
VITE_302_TASK_STATUS_ROUTE_TEMPLATE=/302/tasks/{taskId}
```

说明：

- 所有 302.AI 能力共用同一个 `VITE_302_BASE_URL`
- 不同模型的差异主要通过不同路由、不同请求字段和不同模型名适配
- `VITE_302_API_KEY` 只保存在本地 `.env` 中，不应提交到版本库
- 当前方案是**演示版前端直连**，仅用于本地演示，不适合生产环境

默认访问地址：

```text
http://localhost:5173
```

如果端口被占用，Vite 会自动切换到其他可用端口，请以终端输出为准。

## 生产构建（仅用于构建验证）

```bash
pnpm build
```

需要强调的是：**这里的构建成功只表示前端静态资源可打包，不代表该分支可直接用于生产环境。**

## 与后端 / 同步服务的关系

仓库中虽然保留了 `worker` 和 `syncer` 目录，但在当前演示分支中：

- 登录、项目、画布主流程不依赖它们
- 当前可见演示功能以前端实现为主
- 某些 API 调用仍可能保留未来接入点或占位逻辑

因此，如果你的目标是体验当前版本，**只启动 `app` 即可**。

## 关键模块说明

- `src/App.tsx`：应用路由入口，负责登录页、项目页、画布页切换
- `src/auth/localAuth.ts`：本地登录态管理
- `src/project/localProjects.ts`：本地项目列表管理
- `src/pages/LoginPage.tsx`：登录页
- `src/pages/ProjectsPage.tsx`：项目管理页
- `src/pages/CanvasPage.tsx`：画布编辑页
- `src/agent/canvas/CanvasProjectService.ts`：本地项目保存与导出
- `src/components/CanvasProjectHeader.tsx`：画布顶部项目信息与返回操作

## 注意事项

- 当前分支是**演示分支**，不是生产分支
- 当前功能以**前端实现**为主
- 当前没有正式后端接入，不要将其理解为完整可上线产品
- 本地存储数据仅用于演示验证
- 如果浏览器缓存被清理，登录态、项目和部分画布数据会丢失

## 生产环境警告

**不要将当前 `app` 目录直接用于生产环境。**

原因包括：

- 没有真实后端依赖闭环
- 没有正式用户鉴权体系
- 没有生产级持久化存储
- 没有正式多人协同同步
- 缺少生产级监控、审计、安全和容灾能力

## 相关文档

- [根目录说明](../README.md)
- [容器化说明](../DOCKER.md)
- [画布技能说明](./docs/canvas-skill.md)

## 许可证

当前项目属于开源项目的一部分，采用 **Mozilla Public License 2.0 (`MPL-2.0`)**。

你可以：

- 使用当前前端演示应用
- 复制、分发当前代码
- 基于当前代码继续修改与扩展

但需要遵守以下要求：

- 对 MPL 覆盖文件的修改在分发时仍需保持开源
- 二次修改后的衍生版本需要保留原始开源义务
- 需要保留原始许可与版权声明
- 不应将当前演示分支误表述为生产可用正式版本

详细条款请参见根目录的 [LICENSE](../LICENSE) 文件。
