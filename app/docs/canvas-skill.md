# MovieClaw Canvas Skill

本文档说明 MovieClaw 当前的画布 skill 封装、保存接口，以及后续新增节点时需要遵守的扩展规范。

## 目标

当前 skill 的目标只有两个：

- 让智能体通过受限接口操作画布
- 让项目在没有后端与 syncer 的情况下完成本地保存

当前实现遵循两条硬边界：

- 智能体只能操作 `NodeDefinitions` 中已注册节点
- 智能体只能修改每种节点的白名单字段

## 入口

前端在 `Tldraw onMount` 后注册全局 skill：

- `window.movieClawCanvasSkill`

该对象由 `MovieClawCanvasSkill` 提供，内部组合：

- `CanvasNodeService`
- `CanvasProjectService`

## 模块结构

```text
app/src/agent/
├─ canvas/
│  ├─ contracts.ts            skill 与服务层共享类型
│  ├─ room.ts                 画布 projectId 计算
│  ├─ nodeTypeConfig.ts       节点白名单元数据
│  ├─ CanvasNodeService.ts    节点创建、更新、删除、连线、查询
│  └─ CanvasProjectService.ts 项目快照、本地保存、文件导出
├─ skill/
│  ├─ MovieClawCanvasSkill.ts skill 主入口
│  └─ CanvasSkillRegistry.ts  注册与卸载全局 skill
└─ index.ts                   对外导出
```

## Skill 接口

### `listAvailableNodes()`

返回所有已注册节点的元数据，包含：

- `type`
- `title`
- `category`
- `hidden`
- `editableKeys`
- `resultKeys`
- `fields`
- `defaultNode`

用途：

- 智能体在创建节点前先探测支持范围
- 文档与 UI 共用统一节点元数据来源

### `listCanvasNodes()`

返回当前画布中的节点列表，包含：

- 位置
- 节点完整数据
- 可编辑字段子集
- 结果字段子集

用途：

- 智能体读取当前画布状态
- 调试白名单是否生效

### `createNode(input)`

输入：

- `type`
- `x`
- `y`
- `center`
- `select`
- `props`

行为：

- 只能创建已注册节点
- `props` 只会写入该节点的白名单字段
- 结果字段不会通过 skill 直接写入

### `updateNode(input)`

输入：

- `id`
- `props`
- `markOutOfDate`

行为：

- 只更新白名单字段
- 默认将节点标记为 `isOutOfDate = true`

### `deleteNode(nodeId)`

行为：

- 删除指定节点
- 连线交给现有 tldraw 绑定机制一并处理

### `connectNodes(input)`

输入：

- `fromNodeId`
- `fromPortId`
- `toNodeId`
- `toPortId`

行为：

- 通过 `connection` shape + binding 建立连线
- 要求起点端口为输出端口，终点端口为输入端口

### `disconnectNodes(input)`

行为：

- 根据节点和端口关系定位已有连线
- 删除对应 `connection` shape

### `getCanvasSnapshot()`

行为：

- 返回 `editor.getSnapshot()` 的当前结果

用途：

- 调试
- 导出
- 后续接入远端保存时复用同一快照结构

### `saveProject(input)`

默认保存方式：

- `localStorage`

输入：

- `source`，可选值：`agent_skill`、`manual`、`autosave`

输出：

- `id`
- `projectId`
- `savedAt`
- `source`
- `saveMode`
- `summary`

### `downloadProjectSnapshot(input)`

行为：

- 生成带时间戳的 JSON 文件
- 触发浏览器下载

用途：

- 手动备份
- 离线归档
- 调试快照内容

### `listProjectSaves()`

行为：

- 读取当前 `projectId` 在 `localStorage` 中的保存记录索引

## 保存接口封装

### 保存载荷结构

当前本地保存载荷至少包含：

- `projectId`
- `savedAt`
- `source`
- `saveMode`
- `snapshot`
- `summary.nodeCount`
- `summary.connectionCount`

### 存储策略

当前采用双通道本地保存：

- 默认通道：`localStorage`
- 显式导出：`JSON file download`

当前 `App.tsx` 中保留了 5 秒一次的自动保存节奏，自动保存走：

- `CanvasProjectService.saveProject({ source: "autosave" })`

## 白名单字段规范

### 可编辑字段

智能体只允许修改用户配置字段。

例如：

- `prompt.text`
- `generate.model`
- `generate.steps`
- `generate_text.mode`
- `generate_video.durationSeconds`

### 禁止直接写入字段

执行结果字段不允许由智能体直接覆盖。

例如：

- `lastResultUrl`
- `lastResultText`
- `lastMediaUrl`
- `selectedResultIndex`

这些字段属于运行时结果，应由节点执行逻辑写入。

## 后续新增节点规范

新增节点时，必须同时补齐以下层次。

### 1. 节点本体

位置：

- `app/src/nodes/types/*`

要求：

- 定义节点数据结构
- 给出 `getDefault()`
- 明确结果字段 `resultKeys`

### 2. 注册到 NodeDefinitions

位置：

- `app/src/nodes/nodeTypes.tsx`

要求：

- 不注册就不能被 skill 操作

### 3. 补白名单元数据

位置：

- `app/src/agent/canvas/nodeTypeConfig.ts`

要求：

- 定义 `fields`
- 明确哪些字段可编辑
- 明确字段类型与枚举范围

### 4. 验证本地保存兼容性

要求：

- 节点新增字段必须可被 `editor.getSnapshot()` 稳定序列化
- 恢复时不能依赖运行时临时状态

### 5. 更新文档

至少更新：

- 本文档
- 对应目录下的 `CLAUDE.md`

## 推荐扩展方式

未来如果要接入远端保存，不要改 skill 接口名，只在 `CanvasProjectService` 中增加保存适配器：

- `local_storage`
- `file_download`
- `remote_sync`

这样可以保证智能体调用契约稳定，避免上层 prompt 和自动化脚本全部重写。
