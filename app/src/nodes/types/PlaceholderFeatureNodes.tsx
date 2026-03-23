import { T } from "tldraw";
import { TemplateIcon } from "../../components/icons/TemplateIcon";
import { NODE_ROW_HEIGHT_PX } from "../../constants";
import { ShapePort } from "../../ports/Port";
import { NodeShape } from "../NodeShapeUtil";
import {
  ExecutionResult,
  InfoValues,
  NodeComponentProps,
  NodeDefinition,
  NodeRow,
} from "./shared";

function PlaceholderBody({ text }: { text: string }) {
  return (
    <>
      <NodeRow>
        <span className="NodeInputRow-label">{text}</span>
      </NodeRow>
      <NodeRow>
        <span className="NodeRow-disconnected">占位节点</span>
      </NodeRow>
    </>
  );
}

export type ScriptScenePlaceholderNode = T.TypeOf<typeof ScriptScenePlaceholderNode>;
export const ScriptScenePlaceholderNode = T.object({
  type: T.literal("script_scene_placeholder"),
});

export class ScriptScenePlaceholderNodeDefinition extends NodeDefinition<ScriptScenePlaceholderNode> {
  static type = "script_scene_placeholder";
  static validator = ScriptScenePlaceholderNode;
  title = "剧本分场";
  heading = "剧本分场";
  icon = (<TemplateIcon />);
  category = "process";
  hidden = true;
  getDefault(): ScriptScenePlaceholderNode {
    return { type: "script_scene_placeholder" };
  }
  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 2;
  }
  getPorts(_shape: NodeShape, _node: ScriptScenePlaceholderNode): Record<string, ShapePort> {
    return {};
  }
  async execute(_shape: NodeShape, _node: ScriptScenePlaceholderNode): Promise<ExecutionResult> {
    return {};
  }
  getOutputInfo(_shape: NodeShape, _node: ScriptScenePlaceholderNode): InfoValues {
    return {};
  }
  Component = (_props: NodeComponentProps<ScriptScenePlaceholderNode>) => <PlaceholderBody text="剧本分场" />;
}

export type CharacterBioPlaceholderNode = T.TypeOf<typeof CharacterBioPlaceholderNode>;
export const CharacterBioPlaceholderNode = T.object({
  type: T.literal("character_bio_placeholder"),
});

export class CharacterBioPlaceholderNodeDefinition extends NodeDefinition<CharacterBioPlaceholderNode> {
  static type = "character_bio_placeholder";
  static validator = CharacterBioPlaceholderNode;
  title = "人物小传";
  heading = "人物小传";
  icon = (<TemplateIcon />);
  category = "process";
  hidden = true;
  getDefault(): CharacterBioPlaceholderNode {
    return { type: "character_bio_placeholder" };
  }
  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 2;
  }
  getPorts(_shape: NodeShape, _node: CharacterBioPlaceholderNode): Record<string, ShapePort> {
    return {};
  }
  async execute(_shape: NodeShape, _node: CharacterBioPlaceholderNode): Promise<ExecutionResult> {
    return {};
  }
  getOutputInfo(_shape: NodeShape, _node: CharacterBioPlaceholderNode): InfoValues {
    return {};
  }
  Component = (_props: NodeComponentProps<CharacterBioPlaceholderNode>) => <PlaceholderBody text="人物小传" />;
}

export type SceneDescriptionPlaceholderNode = T.TypeOf<typeof SceneDescriptionPlaceholderNode>;
export const SceneDescriptionPlaceholderNode = T.object({
  type: T.literal("scene_description_placeholder"),
});

export class SceneDescriptionPlaceholderNodeDefinition extends NodeDefinition<SceneDescriptionPlaceholderNode> {
  static type = "scene_description_placeholder";
  static validator = SceneDescriptionPlaceholderNode;
  title = "场景描述";
  heading = "场景描述";
  icon = (<TemplateIcon />);
  category = "process";
  hidden = true;
  getDefault(): SceneDescriptionPlaceholderNode {
    return { type: "scene_description_placeholder" };
  }
  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 2;
  }
  getPorts(_shape: NodeShape, _node: SceneDescriptionPlaceholderNode): Record<string, ShapePort> {
    return {};
  }
  async execute(_shape: NodeShape, _node: SceneDescriptionPlaceholderNode): Promise<ExecutionResult> {
    return {};
  }
  getOutputInfo(_shape: NodeShape, _node: SceneDescriptionPlaceholderNode): InfoValues {
    return {};
  }
  Component = (_props: NodeComponentProps<SceneDescriptionPlaceholderNode>) => <PlaceholderBody text="场景描述" />;
}

export type StoryboardScriptPlaceholderNode = T.TypeOf<typeof StoryboardScriptPlaceholderNode>;
export const StoryboardScriptPlaceholderNode = T.object({
  type: T.literal("storyboard_script_placeholder"),
});

export class StoryboardScriptPlaceholderNodeDefinition extends NodeDefinition<StoryboardScriptPlaceholderNode> {
  static type = "storyboard_script_placeholder";
  static validator = StoryboardScriptPlaceholderNode;
  title = "分镜头脚本";
  heading = "分镜头脚本";
  icon = (<TemplateIcon />);
  category = "process";
  hidden = true;
  getDefault(): StoryboardScriptPlaceholderNode {
    return { type: "storyboard_script_placeholder" };
  }
  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 2;
  }
  getPorts(_shape: NodeShape, _node: StoryboardScriptPlaceholderNode): Record<string, ShapePort> {
    return {};
  }
  async execute(_shape: NodeShape, _node: StoryboardScriptPlaceholderNode): Promise<ExecutionResult> {
    return {};
  }
  getOutputInfo(_shape: NodeShape, _node: StoryboardScriptPlaceholderNode): InfoValues {
    return {};
  }
  Component = (_props: NodeComponentProps<StoryboardScriptPlaceholderNode>) => <PlaceholderBody text="分镜头脚本" />;
}

export type CharacterDesignPlaceholderNode = T.TypeOf<typeof CharacterDesignPlaceholderNode>;
export const CharacterDesignPlaceholderNode = T.object({
  type: T.literal("character_design_placeholder"),
});

export class CharacterDesignPlaceholderNodeDefinition extends NodeDefinition<CharacterDesignPlaceholderNode> {
  static type = "character_design_placeholder";
  static validator = CharacterDesignPlaceholderNode;
  title = "人物设计";
  heading = "人物设计";
  icon = (<TemplateIcon />);
  category = "process";
  hidden = true;
  getDefault(): CharacterDesignPlaceholderNode {
    return { type: "character_design_placeholder" };
  }
  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 2;
  }
  getPorts(_shape: NodeShape, _node: CharacterDesignPlaceholderNode): Record<string, ShapePort> {
    return {};
  }
  async execute(_shape: NodeShape, _node: CharacterDesignPlaceholderNode): Promise<ExecutionResult> {
    return {};
  }
  getOutputInfo(_shape: NodeShape, _node: CharacterDesignPlaceholderNode): InfoValues {
    return {};
  }
  Component = (_props: NodeComponentProps<CharacterDesignPlaceholderNode>) => <PlaceholderBody text="人物设计" />;
}

export type SceneDesignPlaceholderNode = T.TypeOf<typeof SceneDesignPlaceholderNode>;
export const SceneDesignPlaceholderNode = T.object({
  type: T.literal("scene_design_placeholder"),
});

export class SceneDesignPlaceholderNodeDefinition extends NodeDefinition<SceneDesignPlaceholderNode> {
  static type = "scene_design_placeholder";
  static validator = SceneDesignPlaceholderNode;
  title = "场景设计";
  heading = "场景设计";
  icon = (<TemplateIcon />);
  category = "process";
  hidden = true;
  getDefault(): SceneDesignPlaceholderNode {
    return { type: "scene_design_placeholder" };
  }
  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 2;
  }
  getPorts(_shape: NodeShape, _node: SceneDesignPlaceholderNode): Record<string, ShapePort> {
    return {};
  }
  async execute(_shape: NodeShape, _node: SceneDesignPlaceholderNode): Promise<ExecutionResult> {
    return {};
  }
  getOutputInfo(_shape: NodeShape, _node: SceneDesignPlaceholderNode): InfoValues {
    return {};
  }
  Component = (_props: NodeComponentProps<SceneDesignPlaceholderNode>) => <PlaceholderBody text="场景设计" />;
}

export type StoryboardImagePlaceholderNode = T.TypeOf<typeof StoryboardImagePlaceholderNode>;
export const StoryboardImagePlaceholderNode = T.object({
  type: T.literal("storyboard_image_placeholder"),
});

export class StoryboardImagePlaceholderNodeDefinition extends NodeDefinition<StoryboardImagePlaceholderNode> {
  static type = "storyboard_image_placeholder";
  static validator = StoryboardImagePlaceholderNode;
  title = "分镜头图片";
  heading = "分镜头图片";
  icon = (<TemplateIcon />);
  category = "process";
  hidden = true;
  getDefault(): StoryboardImagePlaceholderNode {
    return { type: "storyboard_image_placeholder" };
  }
  getBodyHeightPx() {
    return NODE_ROW_HEIGHT_PX * 2;
  }
  getPorts(_shape: NodeShape, _node: StoryboardImagePlaceholderNode): Record<string, ShapePort> {
    return {};
  }
  async execute(_shape: NodeShape, _node: StoryboardImagePlaceholderNode): Promise<ExecutionResult> {
    return {};
  }
  getOutputInfo(_shape: NodeShape, _node: StoryboardImagePlaceholderNode): InfoValues {
    return {};
  }
  Component = (_props: NodeComponentProps<StoryboardImagePlaceholderNode>) => <PlaceholderBody text="分镜头图片" />;
}
