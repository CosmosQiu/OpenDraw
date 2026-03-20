import {
  createBindingId,
  createShapeId,
  Editor,
  TLShapeId,
  Vec,
} from "tldraw";
import { getNodePorts, getNodePortConnections } from "../../nodes/nodePorts";
import { NodeShape } from "../../nodes/NodeShapeUtil";
import { getCanvasNodeTypeDefinition, getCanvasNodeTypeDefinitions } from "./nodeTypeConfig";
import {
  CanvasNodeRecord,
  ConnectNodesInput,
  CreateNodeInput,
  UpdateNodeInput,
} from "./contracts";

function pickObject(source: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, source[key]]));
}

function sanitizeNodeProps(
  source: Record<string, unknown>,
  editableKeys: string[],
  currentNode: Record<string, unknown>,
) {
  const next = { ...currentNode };
  for (const key of editableKeys) {
    if (key in source) {
      next[key] = source[key];
    }
  }
  return next;
}

export function createNodeShapeAtPoint(
  editor: Editor,
  input: CreateNodeInput,
): TLShapeId {
  const definition = getCanvasNodeTypeDefinition(editor, input.type);
  const nextNode = {
    ...(definition.defaultNode as Record<string, unknown>),
    ...(input.props ?? {}),
  } as NodeShape["props"]["node"];
  const shapeId = createShapeId();
  const pagePoint = new Vec(
    input.x ?? editor.getViewportPageBounds().center.x,
    input.y ?? editor.getViewportPageBounds().center.y,
  );

  editor.createShape({
    id: shapeId,
    type: "node",
    x: pagePoint.x,
    y: pagePoint.y,
    props: { node: nextNode },
  });

  if (input.center !== false) {
    const bounds = editor.getShapePageBounds(shapeId);
    if (bounds) {
      editor.updateShape({
        id: shapeId,
        type: "node",
        x: pagePoint.x - bounds.width / 2,
        y: pagePoint.y - bounds.height / 2,
      });
    }
  }

  if (input.select !== false) {
    editor.select(shapeId);
  }

  return shapeId;
}

function getNodeShape(editor: Editor, id: TLShapeId): NodeShape {
  const shape = editor.getShape(id);
  if (!shape || !editor.isShapeOfType(shape, "node")) {
    throw new Error(`未找到节点: ${id}`);
  }
  return shape;
}

function buildCanvasNodeRecord(editor: Editor, shape: NodeShape): CanvasNodeRecord {
  const definition = getCanvasNodeTypeDefinition(editor, shape.props.node.type);
  const nodeObject = shape.props.node as Record<string, unknown>;
  return {
    id: shape.id,
    type: shape.props.node.type,
    title: definition.title,
    x: shape.x,
    y: shape.y,
    node: shape.props.node,
    editableNode: pickObject(nodeObject, definition.editableKeys) as Partial<typeof shape.props.node>,
    resultNode: pickObject(nodeObject, definition.resultKeys) as Partial<typeof shape.props.node>,
  };
}

export class CanvasNodeService {
  constructor(private readonly editor: Editor) {}

  listAvailableNodes() {
    return getCanvasNodeTypeDefinitions(this.editor);
  }

  listCanvasNodes(): CanvasNodeRecord[] {
    return this.editor
      .getCurrentPageShapes()
      .filter((shape): shape is NodeShape => this.editor.isShapeOfType(shape, "node"))
      .map((shape) => buildCanvasNodeRecord(this.editor, shape));
  }

  createNode(input: CreateNodeInput): CanvasNodeRecord {
    const definition = getCanvasNodeTypeDefinition(this.editor, input.type);
    const props = sanitizeNodeProps(
      input.props ?? {},
      definition.editableKeys,
      definition.defaultNode as Record<string, unknown>,
    );
    const id = createNodeShapeAtPoint(this.editor, {
      ...input,
      props,
    });
    return buildCanvasNodeRecord(this.editor, getNodeShape(this.editor, id));
  }

  updateNode(input: UpdateNodeInput): CanvasNodeRecord {
    const shape = getNodeShape(this.editor, input.id);
    const definition = getCanvasNodeTypeDefinition(this.editor, shape.props.node.type);
    const currentNode = shape.props.node as Record<string, unknown>;
    const nextNode = sanitizeNodeProps(
      input.props,
      definition.editableKeys,
      currentNode,
    ) as NodeShape["props"]["node"];

    this.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        node: nextNode,
        isOutOfDate: input.markOutOfDate ?? true,
      },
    });

    return buildCanvasNodeRecord(this.editor, getNodeShape(this.editor, input.id));
  }

  deleteNode(nodeId: TLShapeId) {
    getNodeShape(this.editor, nodeId);
    this.editor.deleteShapes([nodeId]);
  }

  connectNodes(input: ConnectNodesInput) {
    const fromShape = getNodeShape(this.editor, input.fromNodeId);
    const toShape = getNodeShape(this.editor, input.toNodeId);
    const fromPort = getNodePorts(this.editor, fromShape.id)[input.fromPortId];
    const toPort = getNodePorts(this.editor, toShape.id)[input.toPortId];
    if (!fromPort || fromPort.terminal !== "start") {
      throw new Error(`无效的输出端口: ${input.fromPortId}`);
    }
    if (!toPort || toPort.terminal !== "end") {
      throw new Error(`无效的输入端口: ${input.toPortId}`);
    }

    const connectionId = createShapeId();
    this.editor.createShape({
      id: connectionId,
      type: "connection",
      props: {
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
      },
    });

    this.editor.createBinding({
      id: createBindingId(),
      type: "connection",
      fromId: connectionId,
      toId: fromShape.id,
      props: {
        terminal: "start",
        portId: input.fromPortId,
      },
    });

    this.editor.createBinding({
      id: createBindingId(),
      type: "connection",
      fromId: connectionId,
      toId: toShape.id,
      props: {
        terminal: "end",
        portId: input.toPortId,
      },
    });
  }

  disconnectNodes(input: ConnectNodesInput) {
    const shape = getNodeShape(this.editor, input.toNodeId);
    const connection = getNodePortConnections(this.editor, shape).find(
      (item) =>
        item.connectedShapeId === input.fromNodeId &&
        item.connectedPortId === input.fromPortId &&
        item.ownPortId === input.toPortId &&
        item.terminal === "end",
    );
    if (!connection) {
      throw new Error("未找到待删除的连线");
    }
    this.editor.deleteShapes([connection.connectionId]);
  }
}
