# app 架构说明

`app` 是 MovieClaw 的前端画布编辑器，负责节点编排、画布交互、执行触发、本地模板，以及面向智能体的受限画布 skill。

**【演示版本】此分支为演示Demo版本，使用纯前端实现登录、项目管理和画布编辑，后续需接入正式后端。**

## 目录骨架

```text
app/
├─ src/
│  ├─ agent/                 画布 skill、本地保存、节点白名单服务
│  ├─ api/                   前端 API 请求封装
│  ├─ auth/                  【演示版】本地认证逻辑（localStorage模拟）
│  ├─ components/            画布 UI、工具栏、侧边栏与弹层
│  ├─ connection/            连线图形、绑定与中间插入逻辑
│  ├─ execution/             工作流执行图与执行状态
│  ├─ lib/                   【演示版】导航工具与通用函数
│  ├─ nodes/                 节点定义、节点注册、节点渲染
│  ├─ pages/                 【演示版】页面级组件（登录/项目列表/画布）
│  ├─ ports/                 端口交互与兼容性规则
│  ├─ project/               【演示版】本地项目管理逻辑
│  ├─ templates/             模板存取与模板盖章
│  ├─ App.tsx                【演示版】路由配置与路由守卫
│  └─ main.tsx               React 挂载入口
├─ docs/
│  └─ canvas-skill.md        画布 skill、保存接口与节点扩展规范
├─ Dockerfile                【演示版】容器化构建配置
├─ nginx.conf                【演示版】Nginx SPA路由配置
├─ CLAUDE.md                 当前目录架构与职责边界
└─ README.md                 前端项目总览
```

## 路由层级（演示版本）

使用 `react-router-dom` HashRouter 实现 SPA 路由：

| 路由 | 组件 | 权限 | 说明 |
|------|------|------|------|
| `/` | RootRedirect | - | 自动跳转登录页或项目列表 |
| `/login` | LoginPage | 公开 | 纯前端模拟登录（localStorage） |
| `/projects` | ProjectsPage | 需登录 | 项目列表、创建、删除、重命名 |
| `/canvas/:projectId` | CanvasPage | 需登录 | 画布编辑器（原App功能） |

## 关键模块职责

### Agent 层
- `src/agent/canvas/contracts.ts`
  - 定义画布 skill、节点元数据与保存结构的统一契约
- `src/agent/canvas/nodeTypeConfig.ts`
  - 维护节点白名单字段，是智能体可写边界的唯一事实源
- `src/agent/canvas/CanvasNodeService.ts`
  - 提供节点创建、更新、删除、连线、查询能力
- `src/agent/canvas/executionResults.ts`
  - 负责运行后自动创建预览节点、文本结果节点，以及结果节点避让布局
- `src/agent/canvas/CanvasProjectService.ts`
  - 提供本地存储保存、文件导出、快照读取能力
- `src/agent/skill/MovieClawCanvasSkill.ts`
  - 将节点服务与项目服务组合成智能体可调用的 skill
- `src/agent/skill/CanvasSkillRegistry.ts`
  - 将 skill 注册到 `window.movieClawCanvasSkill`

### 【演示版】认证层
- `src/auth/localAuth.ts`
  - 使用 localStorage 模拟用户登录，无真实身份验证
  - 存储用户ID、显示名、邮箱、头像文字
  - **注意：正式后端接入时需替换为JWT/Session机制**

### 【演示版】项目管理层
- `src/project/projectTypes.ts`
  - 项目数据结构定义（Project接口）
  - 初始示例项目数据
- `src/project/localProjects.ts`
  - 本地项目管理 CRUD（localStorage）
  - 项目创建、复制、删除、重命名、更新
  - **注意：正式后端接入时需替换为API调用**

### 【演示版】页面层
- `src/pages/LoginPage.tsx`
  - 登录界面，邮箱+密码表单（纯前端模拟）
- `src/pages/ProjectsPage.tsx`
  - 项目列表界面，支持网格/列表视图
  - 集成项目创建/删除/重命名弹窗
- `src/pages/CanvasPage.tsx`
  - 画布编辑器页面（原App.tsx内容迁移）
  - 通过 :projectId 路由参数加载对应项目

### UI 组件层
- `src/components/NotificationProvider.tsx`
  - 全局 Toast 通知系统
- `src/components/ProjectCard.tsx`
  - 项目卡片组件（含下拉菜单）
- `src/components/modals/`
  - CreateProjectModal: 创建项目弹窗
  - DeleteModal: 删除确认弹窗
  - RenameModal: 重命名弹窗
  - ModalBase: 弹窗基础组件

## 依赖边界

- `components/` 可以调用 `agent/canvas/` 的服务
- `agent/canvas/` 可以读取 `nodes/` 的注册表与端口信息
- `agent/skill/` 只能组合服务，不直接下沉到分散 UI 逻辑
- `pages/` 可以调用 `auth/` 和 `project/` 的服务
- `pages/` 使用 react-router 进行导航
- 本地保存当前只依赖浏览器能力，不依赖后端与 syncer

### 【演示版】302.AI 前端调用层
- `src/api/pipelineApi.ts`
  - 统一封装图片、视频、音频、文本节点的演示版调用入口
  - 对真实 302.AI 调用失败场景保留占位结果回退，避免演示链路中断
- `src/api/provider302.ts`
  - 负责读取前端环境变量、调用 302.AI OpenAI 兼容接口、提交异步任务并轮询结果
  - **注意：当前为前端直连方案，只适用于演示，不适用于生产环境**

### 节点层补充
- `src/nodes/types/TextResultNode.tsx`
  - 作为运行后自动生成的文本展示节点，用于展示单条或拆分后的分镜/分场结果
- `src/nodes/types/PreviewNode.tsx`
  - 作为运行后自动生成的媒体预览节点，统一展示图片、视频、音频结果

## 当前设计原则

- 智能体只能操作 `NodeDefinitions` 中已注册节点
- 智能体只能修改每种节点的白名单字段
- 结果字段属于运行时输出，不允许通过 skill 直接写入
- 保存先保证本地可用，再为未来远端接入预留统一接口
- **演示版本原则**：
  - 所有纯前端逻辑需标注 `【演示版本】` 注释
  - 明确标记后续需接入后端的位置
  - 使用 localStorage 作为临时数据存储
  - 允许前端直连 302.AI 以打通演示流程，但不得将该方案视为生产方案

## 容器化部署（演示版本）

```bash
# 构建镜像
docker build -t movieclaw-app .

# 运行容器
docker run -p 80:80 movieclaw-app

# 或使用 docker-compose
docker-compose up -d
```

- 使用多阶段构建（Node构建 → Nginx服务）
- HashRouter 确保 SPA 路由正常工作
- 暴露 80 端口，支持健康检查

## 变更记录

- **演示版本重构**：
  - 新增 `src/auth/` 本地认证模块
  - 新增 `src/project/` 本地项目管理模块
  - 新增 `src/pages/` 页面级组件（Login/Projects/Canvas）
  - 新增 `src/lib/` 导航工具模块
  - 重构 `App.tsx` 为路由入口，使用 HashRouter
  - 安装依赖：`react-router-dom`, `lucide-react`, `@radix-ui/react-dialog`, `clsx`, `tailwind-merge`
  - 新增 Tailwind 配置（颜色变量、动画）
  - 添加 Docker 容器化配置
- 新增 `src/agent/` 目录，收口画布 skill 与本地保存逻辑
- `App.tsx` 新增 skill 注册与 5 秒自动保存
- 新增 `docs/canvas-skill.md` 作为画布 skill 与扩展规范文档
- 新增 `src/api/provider302.ts` 作为 302.AI 演示版前端直连适配层
- 新增 `src/agent/canvas/executionResults.ts` 统一处理运行后结果节点创建与避让布局
- 新增 `src/nodes/types/TextResultNode.tsx` 用于自动展示文本生成结果

