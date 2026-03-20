import {
  AssetToolbarItem,
  DefaultQuickActions,
  DefaultToolbar,
  DrawToolbarItem,
  NoteToolbarItem,
  onDragFromToolbarToCreateShape,
  RectangleToolbarItem,
  SelectToolbarItem,
  TextToolbarItem,
  TldrawUiMenuGroup,
  TLUiOverrides,
  ToolbarItem,
  useEditor,
} from "tldraw";
import { createNodeShapeAtPoint } from "../agent/canvas/CanvasNodeService";
import { getNodeDefinitions } from "../nodes/nodeTypes";
import { TemplatePicker } from "./TemplatePicker";

export const overrides: TLUiOverrides = {
  tools: (editor, tools, _) => {
    for (const nodeDef of Object.values(getNodeDefinitions(editor))) {
      if (nodeDef.hidden) continue;
      tools[`node-${nodeDef.type}`] = {
        id: `node-${nodeDef.type}`,
        label: nodeDef.title,
        icon: nodeDef.icon,
        onSelect: () => {
          createNodeShapeAtPoint(editor, {
            type: nodeDef.type,
            x: editor.getViewportPageBounds().center.x,
            y: editor.getViewportPageBounds().center.y,
            center: true,
            select: true,
          });
        },
        onDragStart: (_, info) => {
          onDragFromToolbarToCreateShape(editor, info, {
            createShape: (id) => {
              editor.createShape({
                id,
                type: "node",
                props: { node: nodeDef.getDefault() },
              });
            },
          });
        },
      };
    }
    return tools;
  },
};

export function PipelineToolbar() {
  const editor = useEditor();
  const nodeDefs = Object.values(getNodeDefinitions(editor)).filter(
    (d) => !d.hidden,
  );

  return (
    <DefaultToolbar>
      <TldrawUiMenuGroup id="selection">
        <SelectToolbarItem />
      </TldrawUiMenuGroup>
      <TldrawUiMenuGroup id="shapes">
        <DrawToolbarItem />
        <NoteToolbarItem />
        <RectangleToolbarItem />
        <TextToolbarItem />
        <AssetToolbarItem />
      </TldrawUiMenuGroup>
      <TldrawUiMenuGroup id="nodes">
        {nodeDefs.map((nodeDef) => (
          <ToolbarItem key={nodeDef.type} tool={`node-${nodeDef.type}`} />
        ))}
      </TldrawUiMenuGroup>
      <TemplatePicker />
      <DefaultQuickActions />
    </DefaultToolbar>
  );
}
