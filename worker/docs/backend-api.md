# Worker Backend API

本文档汇总 `worker` 当前实际实现的后端接口，供前端节点模块联调与测试直接使用。

## 新增节点接口汇总

本节仅汇总这次前端新增节点实际会用到的接口，以及它们当前在仓库中的接线状态。

### 节点与接口映射

- `AI 图片` 节点
  - 前端调用：`POST /api/generate-image`
  - 前端封装：`app/src/api/pipelineApi.ts` 中的 `apiGenerateImage`
  - 当前状态：**前端已接线，worker 端当前未实现同名接口**
  - 兼容关系：旧图像生成接口为 `POST /api/generate`

- `AI 视频` 节点
  - 前端调用：`POST /api/generate-video`
  - 前端封装：`app/src/api/pipelineApi.ts` 中的 `apiGenerateVideo`
  - 当前状态：**前端已接线，worker 端当前未实现**

- `反推提示词` 节点
  - 前端调用：`POST /api/reverse`
  - 前端封装：`app/src/api/pipelineApi.ts` 中的 `apiReverse`
  - 当前状态：**前端已接线，worker 端当前未实现**

- `生成文本` 节点
  - 前端调用：`POST /api/generate-text`
  - 前端封装：`app/src/api/pipelineApi.ts` 中的 `apiGenerateText`
  - 当前状态：**worker 已实现占位接口，可直接联调**

- `图片输入 / LoadImage` 节点
  - 上传图片：`POST /api/images/{image_id}`
  - 读取图片：`GET /api/images/{image_id}`
  - 当前状态：**worker 已实现**

- `预览` 节点
  - 不直接发起后端请求
  - 仅消费上游节点返回的图片或视频 URL 进行展示

### 当前前端调用策略

- `POST /api/generate-image`
  - 若接口不存在、网络失败、或返回 `404/5xx`，前端会回退到占位图片结果
  - 若返回明确业务错误（例如 `4xx` 且带错误信息），前端会直接抛出错误，不吞掉

- `POST /api/generate-video`
  - 若接口不存在、网络失败、或返回 `404/5xx`，前端会回退到占位视频结果
  - 若返回明确业务错误，前端会直接抛出错误

- `POST /api/reverse`
  - 若接口不存在、网络失败、或返回 `404/5xx`，前端会回退到占位反推文本
  - 若返回明确业务错误，前端会直接抛出错误

- `POST /api/generate-text`
  - 当前没有占位回退逻辑
  - 请求失败时，前端直接抛出 `Backend unavailable: ...`

### 新增节点请求/响应约定

以下约定来自前端 API 封装 `app/src/api/pipelineApi.ts`，用于说明新节点当前期望的接口 contract。

#### 1) POST `/api/generate-image`

- 用途：`AI 图片` 节点
- Content-Type：`application/json`
- 当前状态：**前端预留接口，worker 未实现**

请求体字段：

- `model`：`string`，必填
- `prompt`：`string`，必填
- `negativePrompt`：`string`，可选
- `width`：`number`，可选
- `height`：`number`，可选
- `aspectRatio`：`string`，可选
- `count`：`number`，可选
- `steps`：`number`，可选
- `cfgScale`：`number`，可选
- `seed`：`number`，可选
- `referenceImageUrl`：`string`，可选

前端期望成功响应：

```json
{
  "images": [
    {
      "url": "/api/images/gen_1",
      "mimeType": "image/png"
    }
  ],
  "selectedIndex": 0,
  "seed": 12345
}
```

#### 2) POST `/api/generate-video`

- 用途：`AI 视频` 节点
- Content-Type：`application/json`
- 当前状态：**前端预留接口，worker 未实现**

请求体字段：

- `model`：`string`，必填
- `prompt`：`string`，必填
- `width`：`number`，可选
- `height`：`number`，可选
- `aspectRatio`：`string`，可选
- `durationSeconds`：`number`，可选
- `referenceImageUrl`：`string`，可选
- `seed`：`number`，可选

前端期望成功响应：

```json
{
  "videoUrl": "/api/videos/gen_1.mp4",
  "mimeType": "video/mp4",
  "seed": 12345
}
```

#### 3) POST `/api/reverse`

- 用途：`反推提示词` 节点
- Content-Type：`application/json`
- 当前状态：**前端预留接口，worker 未实现**

请求体字段：

- `model`：`string`，必填
- `mediaUrl`：`string`，必填
- `mediaType`：`"image" | "video"`，必填

前端期望成功响应：

```json
{
  "text": "a cinematic portrait of a cat astronaut in a neon-lit cockpit"
}
```

#### 4) POST `/api/generate-text`

- 用途：`生成文本` 节点
- Content-Type：`application/json`
- 当前状态：**worker 已实现**

请求体字段：

- `input`：`string`，可选
- `prompt`：`string`，必填

前端期望成功响应：

```json
{
  "text": "...generated text..."
}
```

#### 5) POST `/api/images/{image_id}`

- 用途：`LoadImage` 节点上传图片
- 当前状态：**worker 已实现**

#### 6) GET `/api/images/{image_id}`

- 用途：`LoadImage` 节点回显、`AI 图片`/`AI 视频` 节点参考图输入、`预览` 节点展示图片
- 当前状态：**worker 已实现**

## 基础信息

- 服务框架：FastAPI
- 全局 API 前缀：`/api`
- 路由挂载：`src/server/router.py`
- 应用入口：`src/server/app.py`
- 全局异常返回（`BaseError`）：`{"code": number, "data": any, "msg": string}`
- 注意：业务错误多数以 HTTP 200 返回，错误通过 `code/msg` 体现；兜底异常会返回 HTTP 500

## 接口总览

- `GET /`：服务基础信息
- `GET /health`：健康检查
- `POST /api/generate`：图像生成
- `POST /api/generate-text`：文本生成（当前为占位实现）
- `POST /api/images/{image_id}`：上传图片
- `GET /api/images/{image_id}`：下载图片

## 接口明细

### 1) GET `/`

- 说明：返回服务描述信息
- 请求体：无
- 成功响应示例：

```json
{
  "message": "Movie Claw is not welcome",
  "version": "0.1.0"
}
```

### 2) GET `/health`

- 说明：健康检查
- 请求体：无
- 成功响应示例：

```json
{
  "status": "ok"
}
```

### 3) POST `/api/generate`

- 说明：图像生成（文生图/图生图）
- Content-Type：`application/json`
- 请求 DTO：`GenerateRequestDTO`

字段说明：
- `model`：`string`，可选，默认 `"doubao:doubao-seedream-5-0-260128"`
- `prompt`：`string`，必填
- `negativePrompt`：`string`，可选
- `imageUrls`：`string[]`，可选
- `size`：`"2K"`，可选，默认 `"2K"`
- `outputFormat`：`"png" | "jpeg" | "webp"`，可选，默认 `"png"`
- `responseFormat`：`"url"`，可选，默认 `"url"`
- `watermark`：`boolean`，可选
- `seed`：`number`，可选
- `guidanceScale`：`number`，可选
- `sequentialImageGeneration`：`"auto" | "disabled"`，可选

成功响应 DTO：`GenerateResponseDTO`

```json
{
  "imageUrl": "/api/images/gen_xxxxxxxx",
  "seed": 12345
}
```

错误行为：
- 当 `prompt` 为空：
  - HTTP 状态：200
  - 响应：

```json
{
  "code": 3002,
  "data": null,
  "msg": "prompt is required"
}
```

### 4) POST `/api/generate-text`

- 说明：文本生成（当前为占位文案）
- Content-Type：`application/json`
- 请求 DTO：`GenerateTextRequestDTO`

字段说明：
- `input`：`string`，可选
- `prompt`：`string`，必填

成功响应 DTO：`GenerateTextResponseDTO`

```json
{
  "text": "[Placeholder] Prompt: \"...\" | Input: [input provided]"
}
```

错误行为：
- 当 `prompt` 为空：
  - HTTP 状态：200
  - 响应：

```json
{
  "code": 3002,
  "data": null,
  "msg": "prompt is required"
}
```

### 5) POST `/api/images/{image_id}`

- 说明：上传图片（二进制 body）
- 路径参数：
  - `image_id`：`string`，图片标识
- Header：
  - `content-type` 需以 `image/` 开头；缺省按 `image/png` 处理
- 请求体：图片二进制内容
- 成功响应 DTO：`UploadResponseDTO`

```json
{
  "ok": true
}
```

错误行为：
- 非图片 Content-Type：
  - HTTP 状态：200
  - 响应：

```json
{
  "code": 2002,
  "data": null,
  "msg": "Invalid content type"
}
```

补充：
- 若 `image_id` 已存在，接口会直接返回 `{ "ok": true }`，不会覆盖旧文件

### 6) GET `/api/images/{image_id}`

- 说明：下载图片
- 路径参数：
  - `image_id`：`string`，图片标识
- 成功响应：二进制图片流
  - `Content-Type`：`image/png`
  - `Cache-Control`：`public, max-age=31536000, immutable`

错误行为：
- 图片不存在：
  - HTTP 状态：200
  - 响应：

```json
{
  "code": 2001,
  "data": null,
  "msg": "Image not found"
}
```

## 前端联调注意事项

- 前端默认以相对路径调用，如 `/api/generate`；需要直连 worker 时配置 `VITE_WORKER_API_BASE_URL`
- 业务错误优先检查 JSON 中的 `code/msg`，不能只看 HTTP 状态码
- `POST /api/images/{image_id}` 应发送二进制 body，并设置正确 `Content-Type`（例如 `image/png`）
- `GET /api/images/{image_id}` 可直接作为 `<img src>`，接口已设置长期缓存头
