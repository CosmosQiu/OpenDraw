import classNames from "classnames";
import { T, useEditor, useValue } from "tldraw";
import { apiGenerateMusic } from "../../api/pipelineApi";
import { GenerateIcon } from "../../components/icons/GenerateIcon";
import {
  NODE_HEADER_HEIGHT_PX,
  NODE_IMAGE_PREVIEW_HEIGHT_PX,
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
  InputValues,
  isMultiInfoValue,
  NodeComponentProps,
  NodeDefinition,
  NodeMedia,
  NodePlaceholder,
  NodePortLabel,
  NodeRow,
  STOP_EXECUTION,
  updateNode,
} from "./shared";

const MUSIC_MODELS = [
  { value: "suno:v4", label: "Suno v4" },
  { value: "udio:v1.5", label: "Udio 1.5" },
  { value: "stableaudio:2", label: "Stable Audio 2" },
];

export type GenerateMusicNode = T.TypeOf<typeof GenerateMusicNode>;
export const GenerateMusicNode = T.object({
  type: T.literal("generate_music"),
  model: T.string,
  durationSeconds: T.number,
  seed: T.number,
  lastResultUrl: T.string.nullable(),
  lastResultMimeType: T.string.nullable(),
});

export class GenerateMusicNodeDefinition extends NodeDefinition<GenerateMusicNode> {
  static type = "generate_music";
  static validator = GenerateMusicNode;
  title = "AI 音乐";
  heading = "AI 音乐";
  icon = (<GenerateIcon />);
  category = "process";
  resultKeys = ["lastResultUrl", "lastResultMimeType"] as const;

  getDefault(): GenerateMusicNode {
    return {
      type: "generate_music",
      model: "suno:v4",
      durationSeconds: 15,
      seed: Math.floor(Math.random() * 99999),
      lastResultUrl: null,
      lastResultMimeType: null,
    };
  }

  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 5 + NODE_IMAGE_PREVIEW_HEIGHT_PX;
  }

  getPorts(_shape: NodeShape, _node: GenerateMusicNode): Record<string, ShapePort> {
    const baseY = NODE_HEADER_HEIGHT_PX + NODE_ROW_HEADER_GAP_PX;
    return {
      prompt: {
        id: "prompt",
        x: 0,
        y: baseY + NODE_ROW_HEIGHT_PX * 1.5,
        terminal: "end",
        dataType: "text",
        multi: true,
      },
      audio: {
        id: "audio",
        x: 0,
        y: baseY + NODE_ROW_HEIGHT_PX * 2.5,
        terminal: "end",
        dataType: "audio",
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
    node: GenerateMusicNode,
    inputs: InputValues,
  ): Promise<ExecutionResult> {
    const rawPrompt = inputs.prompt;
    const promptValues = Array.isArray(rawPrompt)
      ? rawPrompt
      : [rawPrompt ?? "default music prompt"];
    const prompt =
      promptValues
        .filter((value) => value != null)
        .map(String)
        .join(", ") || "default music prompt";
    const referenceAudioUrl = (inputs.audio as string | null) ?? undefined;

    const result = await apiGenerateMusic({
      model: node.model,
      prompt,
      durationSeconds: node.durationSeconds,
      referenceAudioUrl,
      seed: node.seed,
    });

    updateNode<GenerateMusicNode>(this.editor, shape, (n) => ({
      ...n,
      seed: result.seed,
      lastResultUrl: result.audioUrl,
      lastResultMimeType: result.mimeType,
    }));

    return { output: result.audioUrl };
  }

  getOutputInfo(
    shape: NodeShape,
    node: GenerateMusicNode,
    inputs: InfoValues,
  ): InfoValues {
    return {
      output: {
        value: node.lastResultUrl,
        isOutOfDate: areAnyInputsOutOfDate(inputs) || shape.props.isOutOfDate,
        dataType: "media",
      },
    };
  }

  Component = GenerateMusicNodeComponent;
}

function GenerateMusicNodeComponent({
  shape,
  node,
}: NodeComponentProps<GenerateMusicNode>) {
  const editor = useEditor();
  const promptInput = useValue(
    "prompt input",
    () => getNodeInputPortValues(editor, shape.id).prompt,
    [editor, shape.id],
  );
  const audioInput = useValue(
    "audio input",
    () => getNodeInputPortValues(editor, shape.id).audio,
    [editor, shape.id],
  );

  return (
    <>
      <NodeRow>
        <span className="NodeInputRow-label">模型</span>
        <select
          value={node.model}
          onChange={(e) =>
            updateNode<GenerateMusicNode>(
              editor,
              shape,
              (n) => ({ ...n, model: e.target.value }),
              false,
            )
          }
          onPointerDown={(e) => e.stopPropagation()}
        >
          {MUSIC_MODELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </NodeRow>
      <NodeRow>
        <Port shapeId={shape.id} portId="prompt" />
        <NodePortLabel dataType="text">提示词</NodePortLabel>
        {promptInput ? (
          <span className="NodeRow-connected-value">
            {promptInput.isOutOfDate ? (
              <NodePlaceholder />
            ) : (
              (() => {
                const display = isMultiInfoValue(promptInput)
                  ? promptInput.value
                      .filter((value): value is string => typeof value === "string")
                      .join(", ")
                  : String(promptInput.value ?? "");
                return (
                  <span title={display}>
                    {display.slice(0, 20)}
                    {display.length > 20 ? "..." : ""}
                  </span>
                );
              })()
            )}
          </span>
        ) : (
          <span className="NodeRow-disconnected">未连接</span>
        )}
      </NodeRow>
      <NodeRow>
        <Port shapeId={shape.id} portId="audio" />
        <NodePortLabel dataType="audio">音频输入</NodePortLabel>
        {audioInput ? (
          <span className="NodeRow-connected-value">
            {audioInput.isOutOfDate || audioInput.value === STOP_EXECUTION
              ? <NodePlaceholder />
              : "已连接"}
          </span>
        ) : (
          <span className="NodeRow-disconnected">可选</span>
        )}
      </NodeRow>
      <div
        className={classNames("NodeImagePreview", {
          NodeImagePreview_loading: shape.props.isOutOfDate,
        })}
      >
        {node.lastResultUrl ? (
          <NodeMedia src={node.lastResultUrl} alt="Generated audio" mediaType="audio" />
        ) : (
          <div className="NodeImagePreview-empty">
            <span>运行后生成音频</span>
          </div>
        )}
      </div>
      <NodeRow className="NodeInputRow">
        <span className="NodeInputRow-label">时长</span>
        <input
          type="range"
          min="5"
          max="60"
          step="5"
          value={node.durationSeconds}
          onChange={(e) =>
            updateNode<GenerateMusicNode>(editor, shape, (n) => ({
              ...n,
              durationSeconds: Number(e.target.value),
            }), false)
          }
          onPointerDown={(e) => e.stopPropagation()}
        />
        <span className="NodeRow-value">{node.durationSeconds}s</span>
      </NodeRow>
      <NodeRow className="NodeInputRow">
        <span className="NodeInputRow-label">种子</span>
        <input
          type="text"
          inputMode="numeric"
          value={node.seed}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value)) {
              updateNode<GenerateMusicNode>(editor, shape, (n) => ({
                ...n,
                seed: Math.max(0, value),
              }));
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onFocus={() => editor.setSelectedShapes([shape.id])}
        />
      </NodeRow>
    </>
  );
}
