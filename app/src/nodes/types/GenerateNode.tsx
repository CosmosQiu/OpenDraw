import classNames from "classnames";
import { T, useEditor, useValue } from "tldraw";
import { createPreviewResultNode } from "../../agent/canvas/executionResults";
import { IMAGE_MODEL_OPTIONS } from "../../api/provider302Models";
import { apiGenerateImage } from "../../api/pipelineApi";
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
  NodeImage,
  NodePlaceholder,
  NodePortLabel,
  NodeRow,
  parseStoredStringList,
  STOP_EXECUTION,
  updateNode,
} from "./shared";

const ASPECT_RATIO_OPTIONS = [
  { value: "1:1", label: "1:1 正方形" },
  { value: "4:3", label: "4:3 横向" },
  { value: "3:4", label: "3:4 纵向" },
  { value: "16:9", label: "16:9 横屏" },
  { value: "9:16", label: "9:16 竖屏" },
] as const;

const RESOLUTION_OPTIONS_BY_ASPECT: Record<string, { value: string; label: string }[]> = {
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
  "3:4": [
    { value: "768x1024", label: "768×1024" },
    { value: "1200x1600", label: "1200×1600" },
    { value: "1536x2048", label: "1536×2048" },
    { value: "2304x3072", label: "2304×3072" },
    { value: "2880x3840", label: "2880×3840" },
  ],
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
};

function getResolutionOptions(aspectRatio: string) {
  return RESOLUTION_OPTIONS_BY_ASPECT[aspectRatio] ?? RESOLUTION_OPTIONS_BY_ASPECT["1:1"];
}

function parseResolution(resolution: string) {
  const [width, height] = resolution.split("x").map(Number);
  return {
    width: Number.isFinite(width) ? width : 1024,
    height: Number.isFinite(height) ? height : 1024,
  };
}

export type GenerateNode = T.TypeOf<typeof GenerateNode>;
export const GenerateNode = T.object({
  type: T.literal("generate"),
  model: T.string,
  resolution: T.string,
  aspectRatio: T.string,
  count: T.number,
  steps: T.number,
  cfgScale: T.number,
  seed: T.number,
  lastResultUrl: T.string.nullable(),
  lastResultUrlsJson: T.string.nullable(),
  lastResultMimeType: T.string.nullable(),
  selectedResultIndex: T.number,
});

export class GenerateNodeDefinition extends NodeDefinition<GenerateNode> {
  static type = "generate";
  static validator = GenerateNode;
  title = "AI 图片";
  heading = "AI 图片";
  icon = (<GenerateIcon />);
  category = "process";
  resultKeys = [
    "lastResultUrl",
    "lastResultUrlsJson",
    "lastResultMimeType",
    "selectedResultIndex",
  ] as const;
  getDefault(): GenerateNode {
    return {
      type: "generate",
      model: "gemini-3.1-flash-image-preview",
      resolution: "1024x1024",
      aspectRatio: "1:1",
      count: 1,
      steps: 20,
      cfgScale: 7,
      seed: Math.floor(Math.random() * 99999),
      lastResultUrl: null,
      lastResultUrlsJson: null,
      lastResultMimeType: null,
      selectedResultIndex: 0,
    };
  }
  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 6 + NODE_IMAGE_PREVIEW_HEIGHT_PX;
  }
  getPorts(_shape: NodeShape, _node: GenerateNode): Record<string, ShapePort> {
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
      negative: {
        id: "negative",
        x: 0,
        y: baseY + NODE_ROW_HEIGHT_PX * 2.5,
        terminal: "end",
        dataType: "text",
      },
      image: {
        id: "image",
        x: 0,
        y: baseY + NODE_ROW_HEIGHT_PX * 3.5,
        terminal: "end",
        dataType: "image",
      },
      output: {
        id: "output",
        x: NODE_WIDTH_PX,
        y: NODE_HEADER_HEIGHT_PX / 2,
        terminal: "start",
        dataType: "image",
      },
    };
  }
  async execute(
    shape: NodeShape,
    node: GenerateNode,
    inputs: InputValues,
  ): Promise<ExecutionResult> {
    const fallbackModel = IMAGE_MODEL_OPTIONS[0]?.value ?? node.model;
    const resolvedModel = IMAGE_MODEL_OPTIONS.some((option) => option.value === node.model)
      ? node.model
      : fallbackModel;
    if (resolvedModel !== node.model) {
      updateNode<GenerateNode>(this.editor, shape, (n) => ({
        ...n,
        model: resolvedModel,
      }));
    }
    const rawPrompt = inputs.prompt;
    const promptValues = Array.isArray(rawPrompt)
      ? rawPrompt
      : [rawPrompt ?? "default"];
    const prompt =
      promptValues
        .filter((v) => v != null)
        .map(String)
        .join(", ") || "default";
    const negativePrompt = inputs.negative as string | undefined;
    const referenceImageUrl = (inputs.image as string) ?? undefined;
    const { width, height } = parseResolution(node.resolution);

    const result = await apiGenerateImage({
      model: resolvedModel,
      prompt,
      negativePrompt: negativePrompt ?? undefined,
      width,
      height,
      referenceImageUrl,
    });
    const selectedIndex = Math.min(
      Math.max(result.selectedIndex ?? 0, 0),
      Math.max(result.images.length - 1, 0),
    );
    const selectedImage = result.images[selectedIndex]?.url ?? null;

    updateNode<GenerateNode>(this.editor, shape, (n) => ({
      ...n,
      lastResultUrl: selectedImage,
      lastResultUrlsJson: JSON.stringify(result.images.map((image) => image.url)),
      lastResultMimeType: result.images[selectedIndex]?.mimeType ?? null,
      selectedResultIndex: selectedIndex,
    }));

    if (selectedImage) {
      createPreviewResultNode(
        this.editor,
        shape,
        selectedImage,
        "image",
        result.images[selectedIndex]?.mimeType ?? null,
      );
    }

    return { output: selectedImage };
  }
  getOutputInfo(
    shape: NodeShape,
    node: GenerateNode,
    inputs: InfoValues,
  ): InfoValues {
    return {
      output: {
        value: node.lastResultUrl,
        isOutOfDate: areAnyInputsOutOfDate(inputs) || shape.props.isOutOfDate,
        dataType: "image",
      },
    };
  }
  Component = GenerateNodeComponent;
}

function GenerateNodeComponent({
  shape,
  node,
}: NodeComponentProps<GenerateNode>) {
  const editor = useEditor();
  const resolutionOptions = getResolutionOptions(node.aspectRatio);
  const selectedModel = IMAGE_MODEL_OPTIONS.some((option) => option.value === node.model)
    ? node.model
    : (IMAGE_MODEL_OPTIONS[0]?.value ?? node.model);

  const promptInput = useValue(
    "prompt input",
    () => getNodeInputPortValues(editor, shape.id).prompt,
    [editor, shape.id],
  );
  const negativeInput = useValue(
    "negative input",
    () => getNodeInputPortValues(editor, shape.id).negative,
    [editor, shape.id],
  );
  const imageInput = useValue(
    "image input",
    () => getNodeInputPortValues(editor, shape.id).image,
    [editor, shape.id],
  );
  const resultUrls = parseStoredStringList(node.lastResultUrlsJson);

  return (
    <>
      <NodeRow>
        <span className="NodeInputRow-label">模型</span>
        <select
          value={selectedModel}
          onChange={(e) =>
            updateNode<GenerateNode>(editor, shape, (n) => ({
              ...n,
              model: e.target.value,
            }), false)
          }
          onPointerDown={(e) => e.stopPropagation()}
        >
          {IMAGE_MODEL_OPTIONS.map((option) => (
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
                      .filter((v): v is string => typeof v === "string")
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
        <Port shapeId={shape.id} portId="negative" />
        <NodePortLabel dataType="text">反向词</NodePortLabel>
        {negativeInput ? (
          <span className="NodeRow-connected-value">
            {negativeInput.isOutOfDate ||
            negativeInput.value === STOP_EXECUTION ? (
              <NodePlaceholder />
            ) : (
              <span title={String(negativeInput.value)}>
                {String(negativeInput.value ?? "").slice(0, 20)}
              </span>
            )}
          </span>
        ) : (
          <span className="NodeRow-disconnected">可选</span>
        )}
      </NodeRow>
      <NodeRow>
        <Port shapeId={shape.id} portId="image" />
        <NodePortLabel dataType="image">参考图</NodePortLabel>
        {imageInput ? (
          <span className="NodeRow-connected-value">
            {imageInput.isOutOfDate ? <NodePlaceholder /> : "已连接"}
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
          <div className="GenerateNode-results">
            <NodeImage src={node.lastResultUrl} alt="Generated" />
            {resultUrls.length > 1 && (
              <div className="GenerateNode-thumbnails" onPointerDown={(e) => e.stopPropagation()}>
                {resultUrls.map((url, index) => (
                  <label key={url} className="GenerateNode-thumbnail">
                    <input
                      type="radio"
                      name={`generate-result-${shape.id}`}
                      checked={node.selectedResultIndex === index}
                      onChange={() =>
                        updateNode<GenerateNode>(editor, shape, (n) => ({
                          ...n,
                          selectedResultIndex: index,
                          lastResultUrl: url,
                          lastResultMimeType: n.lastResultMimeType,
                        }), false)
                      }
                    />
                    <span>{index + 1}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="NodeImagePreview-empty">
            <span>运行后生成图片</span>
          </div>
        )}
      </div>
      <NodeRow className="NodeInputRow">
        <span className="NodeInputRow-label">比例</span>
        <select
          value={node.aspectRatio}
          onChange={(e) =>
            updateNode<GenerateNode>(editor, shape, (n) => ({
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
            updateNode<GenerateNode>(editor, shape, (n) => ({
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
    </>
  );
}
