import { Editor, TLShapeId } from "tldraw";
import { DEFAULT_NODE_SPACING_PX } from "../../constants";
import { NodeShape } from "../../nodes/NodeShapeUtil";
import { CanvasNodeService, createNodeShapeAtPoint } from "./CanvasNodeService";

const RESULT_STACK_LIMIT = 24;
const DEFAULT_RESULT_NODE_WIDTH = 260;
const DEFAULT_RESULT_NODE_HEIGHT = 240;

export interface TextResultItem {
  title: string;
  text: string;
}

export type PreviewResultDataType = "image" | "video" | "audio" | "text";

function listNodeShapes(editor: Editor): NodeShape[] {
  return editor
    .getCurrentPageShapes()
    .filter((shape): shape is NodeShape => editor.isShapeOfType(shape, "node"));
}

function intersects(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function findAvailablePosition(
  editor: Editor,
  sourceShape: NodeShape,
  size: { width: number; height: number },
  columnOffset = DEFAULT_NODE_SPACING_PX + DEFAULT_RESULT_NODE_WIDTH,
  rowOffset = DEFAULT_NODE_SPACING_PX,
) {
  const occupied = listNodeShapes(editor)
    .filter((shape: NodeShape) => shape.id !== sourceShape.id)
    .map((shape: NodeShape) => {
      const bounds = editor.getShapePageBounds(shape.id);
      return {
        x: shape.x,
        y: shape.y,
        width: bounds?.width ?? DEFAULT_RESULT_NODE_WIDTH,
        height: bounds?.height ?? DEFAULT_RESULT_NODE_HEIGHT,
      };
    });

  for (let index = 0; index < RESULT_STACK_LIMIT; index += 1) {
    const candidate = {
      x: sourceShape.x + columnOffset,
      y: sourceShape.y + index * (size.height + rowOffset),
      width: size.width,
      height: size.height,
    };
    if (!occupied.some((item: { x: number; y: number; width: number; height: number }) => intersects(candidate, item))) {
      return candidate;
    }
  }

  return {
    x: sourceShape.x + columnOffset,
    y: sourceShape.y + RESULT_STACK_LIMIT * (size.height + rowOffset),
    width: size.width,
    height: size.height,
  };
}

export function createPreviewResultNode(
  editor: Editor,
  sourceShape: NodeShape,
  value: string,
  previewDataType: PreviewResultDataType,
  mediaType?: string | null,
) {
  const position = findAvailablePosition(editor, sourceShape, {
    width: DEFAULT_RESULT_NODE_WIDTH,
    height: DEFAULT_RESULT_NODE_HEIGHT,
  });

  const previewNodeId = createNodeShapeAtPoint(editor, {
    type: "preview",
    x: position.x,
    y: position.y,
    center: false,
    select: true,
    props: {
      previewDataType,
      lastValue: value,
      lastMediaType: mediaType ?? null,
    },
  });

  new CanvasNodeService(editor).connectNodes({
    fromNodeId: sourceShape.id,
    fromPortId: "output",
    toNodeId: previewNodeId,
    toPortId: "input",
  });

  return previewNodeId;
}

export function createTextResultNodes(
  editor: Editor,
  sourceShape: NodeShape,
  items: TextResultItem[],
) {
  const createdIds: TLShapeId[] = [];

  items.forEach((item, index) => {
    const position = findAvailablePosition(
      editor,
      sourceShape,
      {
        width: DEFAULT_RESULT_NODE_WIDTH,
        height: DEFAULT_RESULT_NODE_HEIGHT,
      },
      DEFAULT_NODE_SPACING_PX + DEFAULT_RESULT_NODE_WIDTH,
      DEFAULT_NODE_SPACING_PX / 2,
    );

    const id = createNodeShapeAtPoint(editor, {
      type: "text_result",
      x: position.x,
      y: position.y + index * (DEFAULT_RESULT_NODE_HEIGHT + DEFAULT_NODE_SPACING_PX / 2),
      center: false,
      select: index === items.length - 1,
      props: {
        sourceNodeId: sourceShape.id,
        sourceIndex: index,
        title: item.title,
        text: item.text,
      },
    });
    createdIds.push(id);
  });

  return createdIds;
}

export function splitTextResult(text: string): TextResultItem[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      const items = parsed
        .map((item, index) => {
          if (!item || typeof item !== "object") return null;
          const record = item as Record<string, unknown>;
          const title =
            typeof record.title === "string"
              ? record.title
              : typeof record.shot === "string"
                ? `分镜 ${record.shot}`
                : typeof record.scene === "string"
                  ? `场景 ${record.scene}`
                  : `结果 ${index + 1}`;
          const content =
            typeof record.text === "string"
              ? record.text
              : typeof record.content === "string"
                ? record.content
                : JSON.stringify(record, null, 2);
          return { title, text: content };
        })
        .filter((item): item is TextResultItem => item !== null);
      if (items.length > 0) return items;
    }
  } catch {
  }

  const sections = trimmed
    .split(/\n(?=(?:镜头|分镜|场景|Scene|Shot|SHOT|SCENE|#)\s*[0-9一二三四五六七八九十]*)/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sections.length <= 1) {
    return [{ title: "文本结果", text: trimmed }];
  }

  return sections.map((section, index) => {
    const [firstLine, ...rest] = section.split(/\n+/);
    return {
      title: firstLine.slice(0, 40) || `结果 ${index + 1}`,
      text: rest.join("\n").trim() || section,
    };
  });
}
