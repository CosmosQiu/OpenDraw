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
  inferMediaType,
  NodeMedia,
  NodePortLabel,
  NodeRow,
  STOP_EXECUTION,
  updateNode,
} from "./shared";

export type PreviewNode = T.TypeOf<typeof PreviewNode>;
export const PreviewNode = T.object({
  type: T.literal("preview"),
  lastMediaUrl: T.string.nullable(),
  lastMediaType: T.string.nullable(),
});

export class PreviewNodeDefinition extends NodeDefinition<PreviewNode> {
  static type = "preview";
  static validator = PreviewNode;
  title = "预览";
  heading = "预览";
  icon = (<PreviewIcon />);
  category = "output";
  resultKeys = ["lastMediaUrl", "lastMediaType"] as const;
  getDefault(): PreviewNode {
    return {
      type: "preview",
      lastMediaUrl: null,
      lastMediaType: null,
    };
  }
  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX + NODE_IMAGE_PREVIEW_HEIGHT_PX;
  }
  getPorts(): Record<string, ShapePort> {
    const baseY = NODE_HEADER_HEIGHT_PX + NODE_ROW_HEADER_GAP_PX;
    return {
      media: {
        id: "media",
        x: 0,
        y: baseY + NODE_ROW_HEIGHT_PX * 0.5,
        terminal: "end",
        dataType: "media",
      },
      output: {
        id: "output",
        x: NODE_WIDTH_PX,
        y: NODE_HEADER_HEIGHT_PX / 2,
        terminal: "start",
        dataType: "media",
      },
    };
  }
  async execute(
    shape: NodeShape,
    _node: PreviewNode,
    inputs: InputValues,
  ): Promise<ExecutionResult> {
    await sleep(200);
    const mediaUrl = inputs.media as string | null;
    const mediaType = mediaUrl ? inferMediaType(mediaUrl) : null;
    updateNode<PreviewNode>(this.editor, shape, (n) => ({
      ...n,
      lastMediaUrl: mediaUrl ?? null,
      lastMediaType: mediaType,
    }));
    return { output: mediaUrl };
  }
  getOutputInfo(
    shape: NodeShape,
    node: PreviewNode,
    inputs: InfoValues,
  ): InfoValues {
    return {
      output: {
        value: node.lastMediaUrl,
        isOutOfDate:
          Object.values(inputs).some((input) => input.isOutOfDate) ||
          shape.props.isOutOfDate,
        dataType: "media",
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
  const mediaInput = useValue(
    "media input",
    () => getNodeInputPortValues(editor, shape.id).media,
    [editor, shape.id],
  );

  const displayUrl =
    mediaInput && !mediaInput.isOutOfDate && mediaInput.value !== STOP_EXECUTION
      ? (mediaInput.value as string)
      : node.lastMediaUrl;
  const displayMediaType = inferMediaType(displayUrl, node.lastMediaType);

  return (
    <>
      <NodeRow>
        <Port shapeId={shape.id} portId="media" />
        <NodePortLabel dataType="media">媒体</NodePortLabel>
        {mediaInput ? (
          <span className="NodeRow-connected-value">已连接</span>
        ) : (
          <span className="NodeRow-disconnected">未连接</span>
        )}
      </NodeRow>
      <div
        className={classNames("NodeImagePreview", {
          NodeImagePreview_loading: shape.props.isOutOfDate,
        })}
      >
        {displayUrl ? (
          <NodeMedia src={displayUrl} alt="Preview" mediaType={displayMediaType} />
        ) : (
          <div className="NodeImagePreview-empty">
            <span>没有可预览的媒体</span>
          </div>
        )}
      </div>
    </>
  );
}
