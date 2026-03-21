import { Editor } from "tldraw";
import { getNodeDefinitions } from "../../nodes/nodeTypes";
import {
  CanvasNodeTypeDefinition,
  MovieClawNodeType,
  NodeFieldDefinition,
} from "./contracts";

const fieldMap: Record<MovieClawNodeType, NodeFieldDefinition[]> = {
  model: [
    { key: "provider", label: "提供方", editable: true, kind: "string" },
    { key: "modelId", label: "模型 ID", editable: true, kind: "string" },
  ],
  prompt: [{ key: "text", label: "提示词", editable: true, kind: "string" }],
  generate: [
    { key: "model", label: "模型", editable: true, kind: "string" },
    { key: "resolution", label: "分辨率", editable: true, kind: "string" },
    { key: "aspectRatio", label: "宽高比", editable: true, kind: "string" },
  ],
  generate_music: [
    { key: "model", label: "模型", editable: true, kind: "string" },
    { key: "durationSeconds", label: "时长", editable: true, kind: "number" },
    { key: "seed", label: "随机种子", editable: true, kind: "number" },
  ],
  generate_video: [
    { key: "model", label: "模型", editable: true, kind: "string" },
    {
      key: "mode",
      label: "模式",
      editable: true,
      kind: "enum",
      options: ["text_to_video", "image_to_video", "first_last_frame", "multi_image_reference"],
    },
    { key: "referenceImageCount", label: "参考图数量", editable: true, kind: "number" },
    { key: "resolution", label: "分辨率", editable: true, kind: "string" },
    { key: "aspectRatio", label: "宽高比", editable: true, kind: "string" },
    { key: "durationSeconds", label: "时长", editable: true, kind: "number" },
  ],
  generate_text: [
    {
      key: "mode",
      label: "模式",
      editable: true,
      kind: "string",
    },
    { key: "skillConfigJson", label: "技能配置 JSON", editable: true, kind: "json" },
  ],
  reverse: [{ key: "model", label: "模型", editable: true, kind: "string" }],
  load_audio: [{ key: "audioUrl", label: "音频地址", editable: true, kind: "nullable_string" }],
  load_document: [
    { key: "documentPayload", label: "文档载荷", editable: true, kind: "nullable_string" },
  ],
  load_image: [{ key: "imageUrl", label: "图片地址", editable: true, kind: "nullable_string" }],
  preview: [],
  text_result: [
    { key: "title", label: "标题", editable: true, kind: "string" },
    { key: "text", label: "文本", editable: true, kind: "string" },
  ],
};

export function getCanvasNodeTypeDefinitions(editor: Editor): CanvasNodeTypeDefinition[] {
  return Object.values(getNodeDefinitions(editor)).map((definition) => {
    const defaultNode = definition.getDefault();
    const type = defaultNode.type as MovieClawNodeType;
    const fields = fieldMap[type] ?? [];
    return {
      type,
      title: definition.title,
      category: definition.category,
      hidden: definition.hidden,
      editableKeys: fields.filter((field) => field.editable).map((field) => field.key),
      resultKeys: [...(definition.resultKeys ?? [])],
      fields,
      defaultNode,
    };
  });
}

export function getCanvasNodeTypeDefinition(editor: Editor, type: MovieClawNodeType) {
  const definition = getCanvasNodeTypeDefinitions(editor).find((item) => item.type === type);
  if (!definition) {
    throw new Error(`未找到节点类型: ${type}`);
  }
  return definition;
}
