import classNames from "classnames";
import { T } from "tldraw";
import { GenerateTextIcon } from "../../components/icons/GenerateTextIcon";
import {
  NODE_HEADER_HEIGHT_PX,
  NODE_ROW_HEADER_GAP_PX,
  NODE_ROW_HEIGHT_PX,
  NODE_WIDTH_PX,
} from "../../constants";
import { ShapePort } from "../../ports/Port";
import { NodeShape } from "../NodeShapeUtil";
import {
  ExecutionResult,
  InfoValues,
  InputValues,
  NodeComponentProps,
  NodeDefinition,
  NodeRow,
  updateNode,
} from "./shared";

export type TextResultNode = T.TypeOf<typeof TextResultNode>;
export const TextResultNode = T.object({
  type: T.literal("text_result"),
  sourceNodeId: T.string.nullable(),
  sourceIndex: T.number,
  title: T.string,
  text: T.string,
});

export class TextResultNodeDefinition extends NodeDefinition<TextResultNode> {
  static type = "text_result";
  static validator = TextResultNode;
  title = "文本结果";
  heading = "文本结果";
  icon = (<GenerateTextIcon />);
  category = "output";
  hidden = true;
  resultKeys = ["title", "text"] as const;

  getDefault(): TextResultNode {
    return {
      type: "text_result",
      sourceNodeId: null,
      sourceIndex: 0,
      title: "文本结果",
      text: "",
    };
  }

  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 4 + 96;
  }

  getPorts(_shape: NodeShape, _node: TextResultNode): Record<string, ShapePort> {
    const baseY = NODE_HEADER_HEIGHT_PX + NODE_ROW_HEADER_GAP_PX;
    return {
      output: {
        id: "output",
        x: NODE_WIDTH_PX,
        y: NODE_HEADER_HEIGHT_PX / 2,
        terminal: "start",
        dataType: "text",
      },
      input: {
        id: "input",
        x: 0,
        y: baseY + NODE_ROW_HEIGHT_PX * 0.5,
        terminal: "end",
        dataType: "text",
      },
    };
  }

  async execute(
    shape: NodeShape,
    node: TextResultNode,
    inputs: InputValues,
  ): Promise<ExecutionResult> {
    const input = inputs.input;
    const nextText =
      typeof input === "string"
        ? input
        : Array.isArray(input)
          ? input.filter((item): item is string => typeof item === "string").join("\n")
          : node.text;
    updateNode<TextResultNode>(this.editor, shape, (current) => ({
      ...current,
      text: nextText,
    }));
    return { output: nextText };
  }

  getOutputInfo(shape: NodeShape, node: TextResultNode): InfoValues {
    return {
      output: {
        value: node.text,
        isOutOfDate: shape.props.isOutOfDate,
        dataType: "text",
      },
    };
  }

  Component = TextResultNodeComponent;
}

function TextResultNodeComponent({ node }: NodeComponentProps<TextResultNode>) {
  return (
    <>
      <NodeRow>
        <span className="NodeInputRow-label">标题</span>
        <span className="NodeRow-connected-value" title={node.title}>{node.title}</span>
      </NodeRow>
      <div
        className={classNames("GenerateTextNode-result")}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {node.text ? (
          <div className="GenerateTextNode-result-text">{node.text}</div>
        ) : (
          <div className="GenerateTextNode-result-empty">
            <span>暂无文本结果</span>
          </div>
        )}
      </div>
    </>
  );
}
