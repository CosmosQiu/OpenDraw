import { Editor, T, useEditor, WeakCache } from "tldraw";
import {
  NODE_FOOTER_HEIGHT_PX,
  NODE_HEADER_HEIGHT_PX,
  NODE_ROW_BOTTOM_PADDING_PX,
  NODE_ROW_HEADER_GAP_PX,
} from "../constants";
import { PortId, ShapePort } from "../ports/Port";
import { NodeShape } from "./NodeShapeUtil";
import { GenerateNodeDefinition } from "./types/GenerateNode";
import { GenerateMusicNodeDefinition } from "./types/GenerateMusicNode";
import { GenerateTextNodeDefinition } from "./types/GenerateTextNode";
import { LoadAudioNodeDefinition } from "./types/LoadAudioNode";
import { LoadDocumentNodeDefinition } from "./types/LoadDocumentNode";
import { LoadImageNodeDefinition } from "./types/LoadImageNode";
import { ModelNodeDefinition } from "./types/ModelNode";
import { PreviewNodeDefinition } from "./types/PreviewNode";
import { PromptNodeDefinition } from "./types/PromptNode";
import { TextResultNodeDefinition } from "./types/TextResultNode";
import { GenerateVideoNodeDefinition } from "./types/GenerateVideoNode";
import { ReverseNodeDefinition } from "./types/ReverseNode";
import {
  CharacterBioPlaceholderNodeDefinition,
  CharacterDesignPlaceholderNodeDefinition,
  SceneDescriptionPlaceholderNodeDefinition,
  SceneDesignPlaceholderNodeDefinition,
  ScriptScenePlaceholderNodeDefinition,
  StoryboardImagePlaceholderNodeDefinition,
  StoryboardScriptPlaceholderNodeDefinition,
} from "./types/PlaceholderFeatureNodes";
import {
  ExecutionResult,
  InfoValues,
  NodeDefinition,
  NodeDefinitionConstructor,
} from "./types/shared";

export const NodeDefinitions = {
  model: ModelNodeDefinition,
  prompt: PromptNodeDefinition,
  generate: GenerateNodeDefinition,
  generate_music: GenerateMusicNodeDefinition,
  generate_video: GenerateVideoNodeDefinition,
  generate_text: GenerateTextNodeDefinition,
  reverse: ReverseNodeDefinition,
  load_audio: LoadAudioNodeDefinition,
  load_document: LoadDocumentNodeDefinition,
  load_image: LoadImageNodeDefinition,
  preview: PreviewNodeDefinition,
  text_result: TextResultNodeDefinition,
  script_scene_placeholder: ScriptScenePlaceholderNodeDefinition,
  character_bio_placeholder: CharacterBioPlaceholderNodeDefinition,
  scene_description_placeholder: SceneDescriptionPlaceholderNodeDefinition,
  storyboard_script_placeholder: StoryboardScriptPlaceholderNodeDefinition,
  character_design_placeholder: CharacterDesignPlaceholderNodeDefinition,
  scene_design_placeholder: SceneDesignPlaceholderNodeDefinition,
  storyboard_image_placeholder: StoryboardImagePlaceholderNodeDefinition,
} satisfies Record<string, NodeDefinitionConstructor<any>>;

export type NodeType = T.TypeOf<typeof NodeType>;
export const NodeType = T.union(
  "type",
  Object.fromEntries(
    Object.values(NodeDefinitions).map((type) => [type.type, type.validator]),
  ) as {
    [K in keyof typeof NodeDefinitions as (typeof NodeDefinitions)[K]["type"]]: (typeof NodeDefinitions)[K]["validator"];
  },
);

const nodeDefinitions = new WeakCache<
  Editor,
  {
    [K in keyof typeof NodeDefinitions]: InstanceType<
      (typeof NodeDefinitions)[K]
    >;
  }
>();
export function getNodeDefinitions(editor: Editor) {
  return nodeDefinitions.get(editor, () => {
    return Object.fromEntries(
      Object.values(NodeDefinitions).map((value) => [
        value.type,
        new value(editor),
      ]),
    ) as any;
  });
}

export function getNodeDefinition(
  editor: Editor,
  node: NodeType | NodeType["type"],
): NodeDefinition<NodeType> {
  const type = (typeof node === "string" ? node : node.type) as keyof typeof NodeDefinitions;
  return getNodeDefinitions(editor)[type] as NodeDefinition<NodeType>;
}

export function getNodeWidthPx(editor: Editor, shape: NodeShape): number {
  return getNodeDefinition(editor, shape.props.node).getWidthPx(
    shape,
    shape.props.node,
  );
}

export function getNodeBodyHeightPx(editor: Editor, shape: NodeShape): number {
  return getNodeDefinition(editor, shape.props.node).getBodyHeightPx(
    shape,
    shape.props.node,
  );
}

export function getNodeHeightPx(editor: Editor, shape: NodeShape): number {
  return (
    NODE_HEADER_HEIGHT_PX +
    NODE_ROW_HEADER_GAP_PX +
    getNodeBodyHeightPx(editor, shape) +
    NODE_ROW_BOTTOM_PADDING_PX +
    NODE_FOOTER_HEIGHT_PX
  );
}

export function getNodeTypePorts(
  editor: Editor,
  shape: NodeShape,
): Record<string, ShapePort> {
  return getNodeDefinition(editor, shape.props.node).getPorts(
    shape,
    shape.props.node,
  );
}

export async function executeNode(
  editor: Editor,
  shape: NodeShape,
  inputs: Record<string, string | number | null | (string | number | null)[]>,
): Promise<ExecutionResult> {
  return await getNodeDefinition(editor, shape.props.node).execute(
    shape,
    shape.props.node,
    inputs,
  );
}

export function getNodeOutputInfo(
  editor: Editor,
  shape: NodeShape,
  inputs: InfoValues,
): InfoValues {
  return getNodeDefinition(editor, shape.props.node).getOutputInfo(
    shape,
    shape.props.node,
    inputs,
  );
}

export function onNodePortConnect(
  editor: Editor,
  shape: NodeShape,
  port: PortId,
) {
  getNodeDefinition(editor, shape.props.node).onPortConnect?.(
    shape,
    shape.props.node,
    port,
  );
}

export function onNodePortDisconnect(
  editor: Editor,
  shape: NodeShape,
  port: PortId,
) {
  getNodeDefinition(editor, shape.props.node).onPortDisconnect?.(
    shape,
    shape.props.node,
    port,
  );
}

export function NodeBody({ shape }: { shape: NodeShape }) {
  const editor = useEditor();
  const node = shape.props.node;
  const { Component } = getNodeDefinition(editor, node);
  return <Component shape={shape} node={node} />;
}
