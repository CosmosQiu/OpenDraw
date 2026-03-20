import classNames from "classnames";
import { T, useEditor, useValue } from "tldraw";
import { apiGenerateVideo } from "../../api/pipelineApi";
import { AddIcon } from "../../components/icons/AddIcon";
import { GenerateIcon } from "../../components/icons/GenerateIcon";
import { SubtractIcon } from "../../components/icons/SubtractIcon";
import {
  NODE_HEADER_HEIGHT_PX,
  NODE_IMAGE_PREVIEW_HEIGHT_PX,
  NODE_ROW_HEADER_GAP_PX,
  NODE_ROW_HEIGHT_PX,
  NODE_WIDTH_PX,
} from "../../constants";
import { Port, ShapePort } from "../../ports/Port";
import { getNodePortConnections, getNodeInputPortValues } from "../nodePorts";
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

const VIDEO_MODELS = [
  { value: "runway:gen3", label: "Runway Gen-3" },
  { value: "luma:dream-machine", label: "Luma Dream Machine" },
  { value: "kling:kling-v1", label: "Kling v1" },
];

const ASPECT_RATIO_OPTIONS = [
  { value: "16:9", label: "16:9 横屏" },
  { value: "9:16", label: "9:16 竖屏" },
  { value: "1:1", label: "1:1 正方形" },
  { value: "4:3", label: "4:3 横向" },
] as const;

const RESOLUTION_OPTIONS_BY_ASPECT: Record<string, { value: string; label: string }[]> = {
  "16:9": [
    { value: "1280x720", label: "1280×720" },
    { value: "1600x900", label: "1600×900" },
    { value: "1920x1080", label: "1920×1080" },
    { value: "2560x1440", label: "2560×1440" },
    { value: "3840x2160", label: "3840×2160 (4K)" },
  ],
  "9:16": [
    { value: "720x1280", label: "720×1280" },
    { value: "900x1600", label: "900×1600" },
    { value: "1080x1920", label: "1080×1920" },
    { value: "1440x2560", label: "1440×2560" },
    { value: "2160x3840", label: "2160×3840 (4K)" },
  ],
  "1:1": [
    { value: "1024x1024", label: "1024×1024" },
    { value: "1536x1536", label: "1536×1536" },
    { value: "2048x2048", label: "2048×2048" },
    { value: "3072x3072", label: "3072×3072" },
    { value: "4096x4096", label: "4096×4096 (4K)" },
  ],
  "4:3": [
    { value: "1024x768", label: "1024×768" },
    { value: "1600x1200", label: "1600×1200" },
    { value: "2048x1536", label: "2048×1536" },
    { value: "3072x2304", label: "3072×2304" },
    { value: "3840x2880", label: "3840×2880" },
  ],
};

function getResolutionOptions(aspectRatio: string) {
  return RESOLUTION_OPTIONS_BY_ASPECT[aspectRatio] ?? RESOLUTION_OPTIONS_BY_ASPECT["16:9"];
}

function parseResolution(resolution: string) {
  const [width, height] = resolution.split("x").map(Number);
  return {
    width: Number.isFinite(width) ? width : 1280,
    height: Number.isFinite(height) ? height : 720,
  };
}

const VIDEO_MODES = [
  { value: "text_to_video", label: "文生视频" },
  { value: "first_last_frame", label: "首尾帧视频" },
  { value: "multi_image_reference", label: "多图参考" },
] as const;

type VideoMode = (typeof VIDEO_MODES)[number]["value"];

const VIDEO_REFERENCE_MIN = 1;
const VIDEO_REFERENCE_MAX = 5;
const VIDEO_INPUT_START_ROW_INDEX = 2;

interface VideoInputDescriptor {
  portId: string;
  label: string;
  dataType: "text" | "image";
  multi?: boolean;
}

function getVideoInputDescriptors(node: GenerateVideoNode): VideoInputDescriptor[] {
  const prompt: VideoInputDescriptor = {
    portId: "prompt",
    label: "提示词",
    dataType: "text",
    multi: true,
  };

  if (node.mode === "first_last_frame") {
    return [
      prompt,
      { portId: "start_image", label: "首帧图", dataType: "image" },
      { portId: "end_image", label: "尾帧图", dataType: "image" },
    ];
  }

  if (node.mode === "multi_image_reference") {
    return [
      prompt,
      ...Array.from({ length: node.referenceImageCount }, (_, index) => ({
        portId: `reference_image_${index + 1}`,
        label: `参考图 ${index + 1}`,
        dataType: "image" as const,
      })),
    ];
  }

  return [prompt];
}

function getPortYForInputIndex(index: number) {
  const baseY = NODE_HEADER_HEIGHT_PX + NODE_ROW_HEADER_GAP_PX;
  return baseY + NODE_ROW_HEIGHT_PX * (VIDEO_INPUT_START_ROW_INDEX + index + 0.5);
}

function getTotalRowCount(node: GenerateVideoNode) {
  const inputCount = getVideoInputDescriptors(node).length;
  const referenceCountRow = node.mode === "multi_image_reference" ? 1 : 0;
  const commonRows = 6;
  return commonRows + inputCount + referenceCountRow;
}

export type GenerateVideoNode = T.TypeOf<typeof GenerateVideoNode>;
export const GenerateVideoNode = T.object({
  type: T.literal("generate_video"),
  model: T.string,
  mode: T.literalEnum("text_to_video", "first_last_frame", "multi_image_reference"),
  referenceImageCount: T.number,
  resolution: T.string,
  aspectRatio: T.string,
  durationSeconds: T.number,
  seed: T.number,
  lastResultUrl: T.string.nullable(),
  lastResultMimeType: T.string.nullable(),
});

export class GenerateVideoNodeDefinition extends NodeDefinition<GenerateVideoNode> {
  static type = "generate_video";
  static validator = GenerateVideoNode;
  title = "AI 视频";
  heading = "AI 视频";
  icon = (<GenerateIcon />);
  category = "process";
  resultKeys = ["lastResultUrl", "lastResultMimeType"] as const;

  getDefault(): GenerateVideoNode {
    return {
      type: "generate_video",
      model: "runway:gen3",
      mode: "text_to_video",
      referenceImageCount: 1,
      resolution: "1280x720",
      aspectRatio: "16:9",
      durationSeconds: 5,
      seed: Math.floor(Math.random() * 99999),
      lastResultUrl: null,
      lastResultMimeType: null,
    };
  }

  getBodyHeightPx(_shape: NodeShape, node: GenerateVideoNode) {
    return NODE_ROW_HEIGHT_PX * getTotalRowCount(node) + NODE_IMAGE_PREVIEW_HEIGHT_PX;
  }

  getPorts(_shape: NodeShape, node: GenerateVideoNode): Record<string, ShapePort> {
    const inputPorts = Object.fromEntries(
      getVideoInputDescriptors(node).map((descriptor, index) => [
        descriptor.portId,
        {
          id: descriptor.portId,
          x: 0,
          y: getPortYForInputIndex(index),
          terminal: "end",
          dataType: descriptor.dataType,
          multi: descriptor.multi,
        },
      ]),
    );

    return {
      ...inputPorts,
      output: {
        id: "output",
        x: NODE_WIDTH_PX,
        y: NODE_HEADER_HEIGHT_PX / 2,
        terminal: "start",
        dataType: "media",
      },
    };
  }

  onPortConnect(shape: NodeShape, node: GenerateVideoNode): void {
    const descriptors = getVideoInputDescriptors(node);
    const activePortIds = new Set(descriptors.map((descriptor) => descriptor.portId));
    const connections = getNodePortConnections(this.editor, shape);
    const staleConnectionIds = connections
      .filter((connection) => connection.terminal === "end" && !activePortIds.has(connection.ownPortId))
      .map((connection) => connection.connectionId);

    if (staleConnectionIds.length > 0) {
      this.editor.deleteShapes(staleConnectionIds);
    }
  }

  async execute(
    shape: NodeShape,
    node: GenerateVideoNode,
    inputs: InputValues,
  ): Promise<ExecutionResult> {
    const rawPrompt = inputs.prompt;
    const promptValues = Array.isArray(rawPrompt)
      ? rawPrompt
      : [rawPrompt ?? "default video prompt"];
    const prompt =
      promptValues
        .filter((v) => v != null)
        .map(String)
        .join(", ") || "default video prompt";
    const { width, height } = parseResolution(node.resolution);

    const startImageUrl = (inputs.start_image as string | null) ?? undefined;
    const endImageUrl = (inputs.end_image as string | null) ?? undefined;
    const referenceImageUrls = Array.from(
      { length: node.referenceImageCount },
      (_, index) => inputs[`reference_image_${index + 1}`],
    ).filter((value): value is string => typeof value === "string" && value.length > 0);

    const referenceImageUrl =
      node.mode === "multi_image_reference"
        ? referenceImageUrls[0]
        : undefined;

    const result = await apiGenerateVideo({
      model: node.model,
      mode: node.mode,
      prompt,
      width,
      height,
      aspectRatio: node.aspectRatio,
      durationSeconds: node.durationSeconds,
      seed: node.seed,
      referenceImageUrl,
      startImageUrl,
      endImageUrl,
      referenceImageUrls,
    });

    updateNode<GenerateVideoNode>(this.editor, shape, (n) => ({
      ...n,
      seed: result.seed,
      lastResultUrl: result.videoUrl,
      lastResultMimeType: result.mimeType,
    }));

    return { output: result.videoUrl };
  }

  getOutputInfo(
    shape: NodeShape,
    node: GenerateVideoNode,
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

  Component = GenerateVideoNodeComponent;
}

function cleanupVideoModeConnections(
  editor: ReturnType<typeof useEditor>,
  shape: NodeShape,
  node: GenerateVideoNode,
  nextMode: VideoMode,
  nextReferenceImageCount: number,
) {
  const nextNode: GenerateVideoNode = {
    ...node,
    mode: nextMode,
    referenceImageCount: nextReferenceImageCount,
  };
  const activePortIds = new Set(getVideoInputDescriptors(nextNode).map((descriptor) => descriptor.portId));
  const connections = getNodePortConnections(editor, shape);
  const staleConnectionIds = connections
    .filter((connection) => connection.terminal === "end" && !activePortIds.has(connection.ownPortId))
    .map((connection) => connection.connectionId);

  if (staleConnectionIds.length > 0) {
    editor.deleteShapes(staleConnectionIds);
  }
}

function renderInputConnectionStatus(input: ReturnType<typeof getNodeInputPortValues>[string]) {
  if (!input) {
    return <span className="NodeRow-disconnected">未连接</span>;
  }

  if (input.isOutOfDate) {
    return (
      <span className="NodeRow-connected-value">
        <NodePlaceholder />
      </span>
    );
  }

  if (isMultiInfoValue(input)) {
    const display = input.value
      .filter((value): value is string => typeof value === "string")
      .join(", ");
    return (
      <span className="NodeRow-connected-value">
        <span title={display}>
          {display.slice(0, 20)}
          {display.length > 20 ? "..." : ""}
        </span>
      </span>
    );
  }

  return (
    <span className="NodeRow-connected-value">
      {input.value === STOP_EXECUTION ? <NodePlaceholder /> : "已连接"}
    </span>
  );
}

function GenerateVideoNodeComponent({
  shape,
  node,
}: NodeComponentProps<GenerateVideoNode>) {
  const editor = useEditor();
  const resolutionOptions = getResolutionOptions(node.aspectRatio);
  const inputValues = useValue(
    "video input values",
    () => getNodeInputPortValues(editor, shape.id),
    [editor, shape.id],
  );
  const inputDescriptors = getVideoInputDescriptors(node);

  const handleModeChange = (nextMode: VideoMode) => {
    cleanupVideoModeConnections(editor, shape, node, nextMode, VIDEO_REFERENCE_MIN);
    updateNode<GenerateVideoNode>(
      editor,
      shape,
      (current) => ({
        ...current,
        mode: nextMode,
        referenceImageCount:
          nextMode === "multi_image_reference"
            ? VIDEO_REFERENCE_MIN
            : current.referenceImageCount,
      }),
      false,
    );
  };

  const handleReferenceImageCountChange = (delta: number) => {
    const nextCount = Math.min(
      VIDEO_REFERENCE_MAX,
      Math.max(VIDEO_REFERENCE_MIN, node.referenceImageCount + delta),
    );
    if (nextCount === node.referenceImageCount) return;
    cleanupVideoModeConnections(editor, shape, node, node.mode, nextCount);
    updateNode<GenerateVideoNode>(
      editor,
      shape,
      (current) => ({
        ...current,
        referenceImageCount: nextCount,
      }),
      false,
    );
  };

  return (
    <>
      <NodeRow>
        <span className="NodeInputRow-label">模型</span>
        <select
          value={node.model}
          onChange={(e) =>
            updateNode<GenerateVideoNode>(
              editor,
              shape,
              (n) => ({ ...n, model: e.target.value }),
              false,
            )
          }
          onPointerDown={(e) => e.stopPropagation()}
        >
          {VIDEO_MODELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </NodeRow>
      <NodeRow>
        <span className="NodeInputRow-label">模式选择</span>
        <select
          value={node.mode}
          onChange={(e) => handleModeChange(e.target.value as VideoMode)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {VIDEO_MODES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </NodeRow>
      {inputDescriptors.map((descriptor) => (
        <NodeRow key={descriptor.portId}>
          <Port shapeId={shape.id} portId={descriptor.portId} />
          <NodePortLabel dataType={descriptor.dataType}>{descriptor.label}</NodePortLabel>
          {renderInputConnectionStatus(inputValues[descriptor.portId])}
        </NodeRow>
      ))}
      {node.mode === "multi_image_reference" ? (
        <NodeRow className="NodeInputRow GenerateVideoNode-referenceCountRow">
          <span className="NodeInputRow-label">参考图数量</span>
          <div className="NodeInputRow-buttons">
            <button
              type="button"
              disabled={node.referenceImageCount <= VIDEO_REFERENCE_MIN}
              onClick={() => handleReferenceImageCountChange(-1)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <SubtractIcon />
            </button>
            <span className="NodeRow-value">{node.referenceImageCount}</span>
            <button
              type="button"
              disabled={node.referenceImageCount >= VIDEO_REFERENCE_MAX}
              onClick={() => handleReferenceImageCountChange(1)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <AddIcon />
            </button>
          </div>
        </NodeRow>
      ) : null}
      <div
        className={classNames("NodeImagePreview", {
          NodeImagePreview_loading: shape.props.isOutOfDate,
        })}
      >
        {node.lastResultUrl ? (
          <NodeMedia src={node.lastResultUrl} alt="Generated video" mediaType="video" />
        ) : (
          <div className="NodeImagePreview-empty">
            <span>运行后生成视频</span>
          </div>
        )}
      </div>
      <NodeRow className="NodeInputRow">
        <span className="NodeInputRow-label">比例</span>
        <select
          value={node.aspectRatio}
          onChange={(e) =>
            updateNode<GenerateVideoNode>(editor, shape, (n) => ({
              ...n,
              aspectRatio: e.target.value,
              resolution: getResolutionOptions(e.target.value)[0]?.value ?? n.resolution,
            }), false)
          }
          onPointerDown={(e) => e.stopPropagation()}
        >
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </NodeRow>
      <NodeRow className="NodeInputRow">
        <span className="NodeInputRow-label">分辨率</span>
        <select
          value={node.resolution}
          onChange={(e) =>
            updateNode<GenerateVideoNode>(editor, shape, (n) => ({
              ...n,
              resolution: e.target.value,
            }), false)
          }
          onPointerDown={(e) => e.stopPropagation()}
        >
          {resolutionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </NodeRow>
      <NodeRow className="NodeInputRow">
        <span className="NodeInputRow-label">时长</span>
        <input
          type="range"
          min="1"
          max="12"
          value={node.durationSeconds}
          onChange={(e) =>
            updateNode<GenerateVideoNode>(editor, shape, (n) => ({
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
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) {
              updateNode<GenerateVideoNode>(editor, shape, (n) => ({
                ...n,
                seed: Math.max(0, v),
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
