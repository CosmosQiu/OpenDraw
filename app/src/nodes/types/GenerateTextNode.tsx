import classNames from "classnames";
import { T, useEditor, useValue } from "tldraw";
import { createTextResultNodes, splitTextResult } from "../../agent/canvas/executionResults";
import { apiGenerateText } from "../../api/pipelineApi";
import { GenerateTextIcon } from "../../components/icons/GenerateTextIcon";
import {
  buildDocumentPreviewText,
  GenerateTextSkillConfig,
  parseDocumentPayload,
} from "../../documents/documentPayload";
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
  coerceToText,
  ExecutionResult,
  getInput,
  getInputText,
  InfoValues,
  InputValues,
  NodeComponentProps,
  NodeDefinition,
  NodePlaceholder,
  NodePortLabel,
  NodeRow,
  updateNode,
} from "./shared";

const GENERATE_TEXT_MODES = [
  {
    value: "character_bio",
    label: "生成角色小传",
    defaultPrompt: "请根据文档内容生成完整的角色小传。",
    skillConfig: {
      skillName: "character-bio-writer",
      handlerKey: "generate_text.character_bio",
      version: "v1",
      paramsSchema: "document+prompt",
      editableConfig: {
        outputStyle: "narrative",
      },
    },
  },
  {
    value: "scene_description",
    label: "生成场景描述",
    defaultPrompt: "请根据文档内容整理场景描述。",
    skillConfig: {
      skillName: "scene-describer",
      handlerKey: "generate_text.scene_description",
      version: "v1",
      paramsSchema: "document+prompt",
      editableConfig: {
        detailLevel: "high",
      },
    },
  },
  {
    value: "sequence_description",
    label: "生成分场描述",
    defaultPrompt: "请根据文档内容生成分场描述。",
    skillConfig: {
      skillName: "sequence-describer",
      handlerKey: "generate_text.sequence_description",
      version: "v1",
      paramsSchema: "document+prompt",
      editableConfig: {
        structure: "sequence",
      },
    },
  },
  {
    value: "storyboard_script",
    label: "生成分镜剧本",
    defaultPrompt: "请根据文档内容生成分镜剧本。",
    skillConfig: {
      skillName: "storyboard-writer",
      handlerKey: "generate_text.storyboard_script",
      version: "v1",
      paramsSchema: "document+prompt",
      editableConfig: {
        format: "storyboard",
      },
    },
  },
  {
    value: "smart_analysis",
    label: "智能分析",
    defaultPrompt: "请根据文档内容进行智能分析并给出结构化结论。",
    skillConfig: {
      skillName: "smart-analysis",
      handlerKey: "generate_text.smart_analysis",
      version: "v1",
      paramsSchema: "document+prompt",
      editableConfig: {
        outputFormat: "structured",
      },
    },
  },
] as const;

type GenerateTextMode = (typeof GENERATE_TEXT_MODES)[number]["value"];

export type GenerateTextNode = T.TypeOf<typeof GenerateTextNode>;
export const GenerateTextNode = T.object({
  type: T.literal("generate_text"),
  mode: T.literalEnum(...GENERATE_TEXT_MODES.map((mode) => mode.value)),
  skillConfigJson: T.string,
  lastResultText: T.string.nullable(),
});

const DEFAULT_MODE = GENERATE_TEXT_MODES[0].value;

function getModeConfig(mode: GenerateTextMode) {
  return (
    GENERATE_TEXT_MODES.find((item) => item.value === mode) ?? GENERATE_TEXT_MODES[0]
  );
}

function getSkillConfigJson(mode: GenerateTextMode) {
  return JSON.stringify(getModeConfig(mode).skillConfig);
}

function parseSkillConfig(value: string): GenerateTextSkillConfig | null {
  try {
    return JSON.parse(value) as GenerateTextSkillConfig;
  } catch {
    return null;
  }
}

export class GenerateTextNodeDefinition extends NodeDefinition<GenerateTextNode> {
  static type = "generate_text";
  static validator = GenerateTextNode;
  title = "生成文本";
  heading = "生成文本";
  icon = (<GenerateTextIcon />);
  category = "process";
  resultKeys = ["lastResultText"] as const;
  getDefault(): GenerateTextNode {
    return {
      type: "generate_text",
      mode: DEFAULT_MODE,
      skillConfigJson: getSkillConfigJson(DEFAULT_MODE),
      lastResultText: null,
    };
  }
  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 3 + 96;
  }
  getPorts(
    _shape: NodeShape,
    _node: GenerateTextNode,
  ): Record<string, ShapePort> {
    const baseY = NODE_HEADER_HEIGHT_PX + NODE_ROW_HEADER_GAP_PX;
    return {
      document: {
        id: "document",
        x: 0,
        y: baseY + NODE_ROW_HEIGHT_PX * 1.5,
        terminal: "end",
        dataType: "text",
      },
      prompt: {
        id: "prompt",
        x: 0,
        y: baseY + NODE_ROW_HEIGHT_PX * 2.5,
        terminal: "end",
        dataType: "text",
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
    node: GenerateTextNode,
    inputs: InputValues,
  ): Promise<ExecutionResult> {
    const documentInput = coerceToText(getInput(inputs, "document")) || undefined;
    const documentPayload = parseDocumentPayload(documentInput);
    const prompt = getInputText(inputs, "prompt", getModeConfig(node.mode).defaultPrompt);
    const skillConfigJson = node.skillConfigJson || getSkillConfigJson(node.mode);

    const result = await apiGenerateText({
      input: documentPayload?.textContent || documentInput,
      mode: node.mode,
      document: documentInput,
      prompt,
      skillConfigJson,
    });

    updateNode<GenerateTextNode>(this.editor, shape, (n) => ({
      ...n,
      skillConfigJson,
      lastResultText: result.text,
    }));

    const items = splitTextResult(result.text);
    if (items.length > 0) {
      createTextResultNodes(this.editor, shape, items);
    }

    return { output: result.text };
  }
  getOutputInfo(
    shape: NodeShape,
    node: GenerateTextNode,
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
  Component = GenerateTextNodeComponent;
}

function GenerateTextNodeComponent({
  shape,
  node,
}: NodeComponentProps<GenerateTextNode>) {
  const editor = useEditor();

  const documentPort = useValue(
    "document port",
    () => getNodeInputPortValues(editor, shape.id).document,
    [editor, shape.id],
  );
  const promptPort = useValue(
    "prompt port",
    () => getNodeInputPortValues(editor, shape.id).prompt,
    [editor, shape.id],
  );
  const skillConfig = parseSkillConfig(node.skillConfigJson);
  const documentValue =
    documentPort && !documentPort.isOutOfDate && documentPort.value != null
      ? String(documentPort.value)
      : null;
  const documentPayload = parseDocumentPayload(documentValue);
  const documentPreview = buildDocumentPreviewText(documentPayload, documentValue ?? undefined);

  return (
    <>
      <NodeRow>
        <span className="NodeInputRow-label">生成模式</span>
        <select
          className="GenerateTextNode-select"
          value={node.mode}
          onChange={(e) => {
            const mode = e.currentTarget.value as GenerateTextMode;
            updateNode<GenerateTextNode>(editor, shape, (n) => ({
              ...n,
              mode,
              skillConfigJson: getSkillConfigJson(mode),
            }));
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onFocus={() => editor.setSelectedShapes([shape.id])}
        >
          {GENERATE_TEXT_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </NodeRow>
      <NodeRow>
        <Port shapeId={shape.id} portId="document" />
        <NodePortLabel dataType="text">文档输入</NodePortLabel>
        {documentPort ? (
          <span className="NodeRow-connected-value">
            {documentPort.isOutOfDate ? (
              <NodePlaceholder />
            ) : (
              <span title={documentPreview ?? String(documentPort.value)}>
                {(documentPreview ?? String(documentPort.value ?? "")).slice(0, 20)}
                {(documentPreview ?? String(documentPort.value ?? "")).length > 20 ? "..." : ""}
              </span>
            )}
          </span>
        ) : (
          <span className="NodeRow-disconnected">未连接</span>
        )}
      </NodeRow>
      <NodeRow>
        <Port shapeId={shape.id} portId="prompt" />
        <NodePortLabel dataType="text">提示词</NodePortLabel>
        {promptPort ? (
          <span className="NodeRow-connected-value">
            {promptPort.isOutOfDate ? (
              <NodePlaceholder />
            ) : (
              <span title={String(promptPort.value)}>
                {String(promptPort.value ?? "").slice(0, 20)}
                {String(promptPort.value ?? "").length > 20 ? "..." : ""}
              </span>
            )}
          </span>
        ) : (
          <span className="NodeRow-disconnected">可选</span>
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
          <div className="GenerateTextNode-result-text">
            {node.lastResultText}
          </div>
        ) : (
          <div className="GenerateTextNode-result-empty">
            <span>
              {skillConfig ? `${skillConfig.handlerKey} · 运行后生成文本` : "运行后生成文本"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
