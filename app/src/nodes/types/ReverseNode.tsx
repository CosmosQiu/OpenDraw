import classNames from "classnames";
import { T, useEditor, useValue } from "tldraw";
import { apiReverse } from "../../api/pipelineApi";
import { GenerateTextIcon } from "../../components/icons/GenerateTextIcon";
import {
  NODE_HEADER_HEIGHT_PX,
  NODE_ROW_HEADER_GAP_PX,
  NODE_ROW_HEIGHT_PX,
  NODE_WIDTH_PX,
} from "../../constants";
import { Port, ShapePort } from "../../ports/Port";
import { getNodeInputPortValues } from "../nodePorts";
import { NodeShape } from "../NodeShapeUtil";
import {
  areAnyInputsOutOfDate,
  ExecutionResult,
  InfoValues,
  inferMediaType,
  InputValues,
  NodeComponentProps,
  NodeDefinition,
  NodePlaceholder,
  NodePortLabel,
  NodeRow,
  updateNode,
} from "./shared";

const REVERSE_MODELS = [
  { value: "openai:gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "google:gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "anthropic:claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
];

export type ReverseNode = T.TypeOf<typeof ReverseNode>;
export const ReverseNode = T.object({
  type: T.literal("reverse"),
  model: T.string,
  lastResultText: T.string.nullable(),
});

export class ReverseNodeDefinition extends NodeDefinition<ReverseNode> {
  static type = "reverse";
  static validator = ReverseNode;
  title = "反推提示词";
  heading = "反推提示词";
  icon = (<GenerateTextIcon />);
  category = "process";
  resultKeys = ["lastResultText"] as const;

  getDefault(): ReverseNode {
    return {
      type: "reverse",
      model: "openai:gpt-4.1-mini",
      lastResultText: null,
    };
  }

  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 3 + 96;
  }

  getPorts(_shape: NodeShape, _node: ReverseNode): Record<string, ShapePort> {
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
        dataType: "text",
      },
    };
  }

  async execute(
    shape: NodeShape,
    node: ReverseNode,
    inputs: InputValues,
  ): Promise<ExecutionResult> {
    const mediaUrl = (inputs.media as string | null) ?? "";
    const mediaType = inferMediaType(mediaUrl);
    const result = await apiReverse({
      model: node.model,
      mediaUrl,
      mediaType,
    });

    updateNode<ReverseNode>(this.editor, shape, (n) => ({
      ...n,
      lastResultText: result.text,
    }));

    return { output: result.text };
  }

  getOutputInfo(
    shape: NodeShape,
    node: ReverseNode,
    inputs: InfoValues,
  ): InfoValues {
    return {
      output: {
        value: node.lastResultText,
        isOutOfDate: areAnyInputsOutOfDate(inputs) || shape.props.isOutOfDate,
        dataType: "text",
      },
    };
  }

  Component = ReverseNodeComponent;
}

function ReverseNodeComponent({
  shape,
  node,
}: NodeComponentProps<ReverseNode>) {
  const editor = useEditor();
  const mediaInput = useValue(
    "media input",
    () => getNodeInputPortValues(editor, shape.id).media,
    [editor, shape.id],
  );

  return (
    <>
      <NodeRow>
        <span className="NodeInputRow-label">模型</span>
        <select
          value={node.model}
          onChange={(e) =>
            updateNode<ReverseNode>(
              editor,
              shape,
              (n) => ({ ...n, model: e.target.value }),
              false,
            )
          }
          onPointerDown={(e) => e.stopPropagation()}
        >
          {REVERSE_MODELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </NodeRow>
      <NodeRow>
        <Port shapeId={shape.id} portId="media" />
        <NodePortLabel dataType="media">媒体</NodePortLabel>
        {mediaInput ? (
          <span className="NodeRow-connected-value">
            {mediaInput.isOutOfDate ? <NodePlaceholder /> : "已连接"}
          </span>
        ) : (
          <span className="NodeRow-disconnected">未连接</span>
        )}
      </NodeRow>
      <div
        className={classNames("GenerateTextNode-result", {
          "GenerateTextNode-result_loading": shape.props.isOutOfDate,
        })}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {node.lastResultText ? (
          <div className="GenerateTextNode-result-text">{node.lastResultText}</div>
        ) : (
          <div className="GenerateTextNode-result-empty">
            <span>运行后生成反推提示词</span>
          </div>
        )}
      </div>
    </>
  );
}
