import classNames from "classnames";
import { T, useEditor, useValue } from "tldraw";
import { PreviewIcon } from "../../components/icons/PreviewIcon";
import {
  NODE_HEADER_HEIGHT_PX,
  NODE_IMAGE_PREVIEW_HEIGHT_PX,
  NODE_ROW_HEADER_GAP_PX,
  NODE_ROW_HEIGHT_PX,
  NODE_WIDTH_PX,
} from "../../constants";
import { Port, ShapePort } from "../../ports/Port";
import { sleep } from "../../utils/sleep";
import { getNodeInputPortValues } from "../nodePorts";
import { NodeShape } from "../NodeShapeUtil";
import {
  ExecutionResult,
  InfoValues,
  InputValues,
  NodeComponentProps,
  NodeDefinition,
  NodePlaceholder,
  inferMediaType,
  NodeMedia,
  NodePortLabel,
  NodeRow,
  STOP_EXECUTION,
  updateNode,
} from "./shared";

const PREVIEW_DATA_TYPES = ["image", "video", "audio", "text"] as const;

export type PreviewNode = T.TypeOf<typeof PreviewNode>;
export const PreviewNode = T.object({
  type: T.literal("preview"),
  previewDataType: T.literalEnum(...PREVIEW_DATA_TYPES),
  lastValue: T.string.nullable(),
  lastMediaType: T.string.nullable(),
});

export class PreviewNodeDefinition extends NodeDefinition<PreviewNode> {
  static type = "preview";
  static validator = PreviewNode;
  title = "预览";
  heading = "预览";
  icon = (<PreviewIcon />);
  category = "output";
  resultKeys = ["previewDataType", "lastValue", "lastMediaType"] as const;
  getDefault(): PreviewNode {
    return {
      type: "preview",
      previewDataType: "image",
      lastValue: null,
      lastMediaType: null,
    };
  }
  getBodyHeightPx(_shape: NodeShape, node: PreviewNode) {
    return node.previewDataType === "text"
      ? NODE_ROW_HEIGHT_PX * 4 + 96
      : NODE_ROW_HEIGHT_PX + NODE_IMAGE_PREVIEW_HEIGHT_PX;
  }
  getPorts(_shape: NodeShape, node: PreviewNode): Record<string, ShapePort> {
    const baseY = NODE_HEADER_HEIGHT_PX + NODE_ROW_HEADER_GAP_PX;
    return {
      input: {
        id: "input",
        x: 0,
        y: baseY + NODE_ROW_HEIGHT_PX * 0.5,
        terminal: "end",
        dataType: node.previewDataType,
      },
      output: {
        id: "output",
        x: NODE_WIDTH_PX,
        y: NODE_HEADER_HEIGHT_PX / 2,
        terminal: "start",
        dataType: node.previewDataType,
      },
    };
  }
  async execute(
    shape: NodeShape,
    node: PreviewNode,
    inputs: InputValues,
  ): Promise<ExecutionResult> {
    await sleep(200);
    const inputValue = inputs.input;
    const nextValue =
      typeof inputValue === "string"
        ? inputValue
        : Array.isArray(inputValue)
          ? inputValue.filter((item): item is string => typeof item === "string").join("\n")
          : node.lastValue;
    const mediaType =
      node.previewDataType === "text"
        ? null
        : nextValue
          ? inferMediaType(nextValue, node.lastMediaType)
          : null;
    updateNode<PreviewNode>(this.editor, shape, (n) => ({
      ...n,
      lastValue: nextValue ?? null,
      lastMediaType: mediaType,
    }));
    return { output: nextValue ?? null };
  }
  getOutputInfo(
    shape: NodeShape,
    node: PreviewNode,
    inputs: InfoValues,
  ): InfoValues {
    return {
      output: {
        value: node.lastValue,
        isOutOfDate:
          Object.values(inputs).some((input) => input.isOutOfDate) ||
          shape.props.isOutOfDate,
        dataType: node.previewDataType,
      },
    };
  }
  Component = PreviewNodeComponent;
}

function PreviewNodeComponent({
  shape,
  node,
}: NodeComponentProps<PreviewNode>) {
  const editor = useEditor();
  const input = useValue(
    "preview input",
    () => getNodeInputPortValues(editor, shape.id).input,
    [editor, shape.id],
  );

  const displayValue =
    input && !input.isOutOfDate && input.value !== STOP_EXECUTION
      ? Array.isArray(input.value)
        ? input.value.filter((item): item is string => typeof item === "string").join("\n")
        : typeof input.value === "string"
          ? input.value
          : null
      : node.lastValue;
  const displayMediaType =
    node.previewDataType === "text"
      ? null
      : inferMediaType(displayValue, node.lastMediaType);

  return (
    <>
      <NodeRow>
        <Port shapeId={shape.id} portId="input" />
        <NodePortLabel dataType={node.previewDataType}>
          {node.previewDataType === "image"
            ? "图片"
            : node.previewDataType === "video"
              ? "视频"
              : node.previewDataType === "audio"
                ? "音频"
                : "文本"}
        </NodePortLabel>
        {input ? (
          <span className="NodeRow-connected-value">已连接</span>
        ) : (
          <span className="NodeRow-disconnected">未连接</span>
        )}
      </NodeRow>
      {node.previewDataType === "text" ? (
        <div
          className={classNames("GenerateTextNode-result")}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {input?.isOutOfDate || shape.props.isOutOfDate ? (
            <NodePlaceholder />
          ) : displayValue ? (
            <div className="GenerateTextNode-result-text">{displayValue}</div>
          ) : (
            <div className="GenerateTextNode-result-empty">
              <span>暂无文本结果</span>
            </div>
          )}
        </div>
      ) : (
        <div
          className={classNames("NodeImagePreview", {
            NodeImagePreview_loading: shape.props.isOutOfDate,
          })}
        >
          {displayValue && displayMediaType ? (
            <NodeMedia src={displayValue} alt="Preview" mediaType={displayMediaType} />
          ) : (
            <div className="NodeImagePreview-empty">
              <span>没有可预览的内容</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
