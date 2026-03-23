import { useMemo, useRef } from "react";
import {
  createShapeId,
  Editor,
  getPointerInfo,
  onDragFromToolbarToCreateShape,
  Vec,
} from "tldraw";
import { getNodeDefinitions, NodeType } from "../nodes/nodeTypes";

const CATEGORY_LABELS: Record<string, string> = {
  input: "输入",
  process: "处理",
  output: "输出",
  utility: "工具",
};

const CATEGORY_ORDER = ["process", "input", "output", "utility"];

const PROCESS_PRIORITY: Record<string, number> = {
  generate_text: 1,
  reverse: 2,
  generate: 3,
  generate_video: 4,
  generate_music: 5,
};

type SidebarMenuItem = {
  type: string;
  title: string;
  icon: React.ReactElement;
  getDefault: () => NodeType;
  submenuItems?: SidebarMenuItem[];
};

const DRAG_DISTANCE_SQ = 36; // 6px

function createNodeAtPagePoint(editor: Editor, node: NodeType, pagePoint?: Vec | null) {
  const shapeId = createShapeId();
  editor.run(() => {
    editor.createShape({
      id: shapeId,
      type: "node",
      props: { node },
    });
    const shapeBounds = editor.getShapePageBounds(shapeId)!;
    const center = pagePoint ?? editor.getViewportPageBounds().center;
    editor.updateShape({
      id: shapeId,
      type: "node",
      x: center.x - shapeBounds.width / 2,
      y: center.y - shapeBounds.height / 2,
    });
    editor.select(shapeId);
  });
}

function SidebarItem({
  editor,
  item,
  onClose,
  pagePoint,
}: {
  editor: Editor;
  item: SidebarMenuItem;
  onClose?: () => void;
  pagePoint?: Vec | null;
}) {
  const stateRef = useRef<
    | { name: "idle" }
    | { name: "pointing"; start: { x: number; y: number } }
    | { name: "dragging" }
    | { name: "dragged" }
  >({ name: "idle" });

  return (
    <div className="MovieClawSidebar-itemWrap">
      <button
        className="MovieClawSidebar-item"
        onPointerDown={(e) => {
          stateRef.current = {
            name: "pointing",
            start: { x: e.clientX, y: e.clientY },
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (stateRef.current.name === "pointing") {
            const dist = Vec.Dist2(stateRef.current.start, {
              x: e.clientX,
              y: e.clientY,
            });
            if (dist > DRAG_DISTANCE_SQ) {
              const start = stateRef.current.start;
              stateRef.current = { name: "dragging" };

              editor.run(() => {
                editor.setCurrentTool("select");
                editor.dispatch({
                  type: "pointer",
                  target: "canvas",
                  name: "pointer_down",
                  ...getPointerInfo(editor, e.nativeEvent),
                  point: start,
                });
                editor.selectNone();
                onDragFromToolbarToCreateShape(
                  editor,
                  {
                    type: "pointer",
                    target: "canvas",
                    name: "pointer_move",
                    ...getPointerInfo(editor, e.nativeEvent),
                    point: start,
                  },
                  {
                    createShape: (id) => {
                      editor.createShape({
                        id,
                        type: "node",
                        props: { node: item.getDefault() },
                      });
                    },
                  },
                );
                editor.getContainer().focus();
              });
            }
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          if (stateRef.current.name === "dragging") {
            editor.dispatch({
              type: "pointer",
              target: "canvas",
              name: "pointer_up",
              ...getPointerInfo(editor, e.nativeEvent),
            });
            stateRef.current = { name: "dragged" };
            return;
          }
          stateRef.current = { name: "idle" };
        }}
        onClick={() => {
          if (stateRef.current.name === "dragged") {
            stateRef.current = { name: "idle" };
            return;
          }
          stateRef.current = { name: "idle" };
          createNodeAtPagePoint(editor, item.getDefault(), pagePoint);
          if (onClose) {
            onClose();
          }
        }}
      >
        <span className="MovieClawSidebar-item-icon">{item.icon}</span>
        <span className="MovieClawSidebar-item-title">{item.title}</span>
        {item.submenuItems?.length ? <span className="MovieClawSidebar-item-arrow">›</span> : null}
      </button>
      {item.submenuItems?.length ? (
        <div className="MovieClawSidebar-submenu">
          {item.submenuItems.map((submenuItem) => (
            <SidebarItem
              key={submenuItem.type}
              editor={editor}
              item={submenuItem}
              onClose={onClose}
              pagePoint={pagePoint}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MovieClawSidebar({
  editor,
  onClose,
  pagePoint,
}: {
  editor: Editor;
  onClose?: () => void;
  pagePoint?: Vec | null;
}) {
  const defs = getNodeDefinitions(editor);
  const defsByType = useMemo(
    () => Object.fromEntries(Object.values(defs).map((def) => [def.type, def])),
    [defs],
  );
  const textSubmenuTypes = [
    "script_scene_placeholder",
    "character_bio_placeholder",
    "scene_description_placeholder",
    "storyboard_script_placeholder",
  ] as const;
  const imageSubmenuTypes = [
    "character_design_placeholder",
    "scene_design_placeholder",
    "storyboard_image_placeholder",
  ] as const;

  const grouped: Record<string, SidebarMenuItem[]> = {};
  for (const def of Object.values(defs)) {
    const cat = def.category;
    if (!grouped[cat]) grouped[cat] = [];
    if (def.hidden) continue;
    grouped[cat].push({
      type: def.type,
      title: def.title,
      icon: def.icon,
      getDefault: () => def.getDefault(),
    });
  }

  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => {
      const ap = PROCESS_PRIORITY[a.type] ?? Number.MAX_SAFE_INTEGER;
      const bp = PROCESS_PRIORITY[b.type] ?? Number.MAX_SAFE_INTEGER;
      if (ap !== bp) return ap - bp;
      return a.title.localeCompare(b.title, "zh-Hans-CN");
    });
  }

  const attachSubmenu = (item: SidebarMenuItem, types: readonly string[]) => {
    item.submenuItems = types
      .map((type) => defsByType[type])
      .filter((def): def is (typeof defs)[keyof typeof defs] => Boolean(def))
      .map((def) => ({
        type: def.type,
        title: def.title,
        icon: def.icon,
        getDefault: () => def.getDefault(),
      }));
  };

  for (const items of Object.values(grouped)) {
    for (const item of items) {
      if (item.type === "generate_text") {
        attachSubmenu(item, textSubmenuTypes);
      }
      if (item.type === "generate") {
        attachSubmenu(item, imageSubmenuTypes);
      }
    }
  }

  return (
    <div className="MovieClawSidebar tl-theme__light">
      <div className="MovieClawSidebar-header">节点</div>
      <div className="MovieClawSidebar-list">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          if (!items?.length) return null;
          return (
            <div key={cat} className="MovieClawSidebar-group">
              <div className="MovieClawSidebar-category">
                {CATEGORY_LABELS[cat] ?? cat}
              </div>
              {items.map((item) => (
                <SidebarItem
                  key={item.type}
                  editor={editor}
                  item={item}
                  onClose={onClose}
                  pagePoint={pagePoint}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
