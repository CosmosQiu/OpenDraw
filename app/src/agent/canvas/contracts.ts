import { Editor, TLShapeId } from "tldraw";
import { NodeType } from "../../nodes/nodeTypes";

export type MovieClawNodeType = NodeType["type"];

export interface NodeFieldDefinition {
  key: string;
  label: string;
  editable: boolean;
  kind: "string" | "number" | "json" | "enum" | "nullable_string";
  options?: string[];
}

export interface CanvasNodeTypeDefinition {
  type: MovieClawNodeType;
  title: string;
  category: string;
  hidden: boolean;
  editableKeys: string[];
  resultKeys: string[];
  fields: NodeFieldDefinition[];
  defaultNode: NodeType;
}

export interface CanvasNodeRecord {
  id: TLShapeId;
  type: MovieClawNodeType;
  title: string;
  x: number;
  y: number;
  node: NodeType;
  editableNode: Partial<NodeType>;
  resultNode: Partial<NodeType>;
}

export interface CreateNodeInput {
  type: MovieClawNodeType;
  x?: number;
  y?: number;
  center?: boolean;
  select?: boolean;
  props?: Record<string, unknown>;
}

export interface UpdateNodeInput {
  id: TLShapeId;
  props: Record<string, unknown>;
  markOutOfDate?: boolean;
}

export interface ConnectNodesInput {
  fromNodeId: TLShapeId;
  fromPortId: string;
  toNodeId: TLShapeId;
  toPortId: string;
}

export interface ProjectSavePayload {
  projectId: string;
  savedAt: string;
  source: "agent_skill" | "manual" | "autosave";
  saveMode: "local_storage" | "file_download";
  snapshot: ReturnType<Editor["getSnapshot"]>;
  summary: {
    nodeCount: number;
    connectionCount: number;
  };
}

export interface ProjectSaveRecord {
  id: string;
  projectId: string;
  savedAt: string;
  source: ProjectSavePayload["source"];
  saveMode: ProjectSavePayload["saveMode"];
  summary: ProjectSavePayload["summary"];
}

export interface SaveProjectInput {
  source?: ProjectSavePayload["source"];
}

export interface DownloadProjectInput extends SaveProjectInput {
  filename?: string;
}

export interface MovieClawCanvasSkillApi {
  listAvailableNodes: () => CanvasNodeTypeDefinition[];
  listCanvasNodes: () => CanvasNodeRecord[];
  createNode: (input: CreateNodeInput) => CanvasNodeRecord;
  updateNode: (input: UpdateNodeInput) => CanvasNodeRecord;
  deleteNode: (nodeId: TLShapeId) => void;
  connectNodes: (input: ConnectNodesInput) => void;
  disconnectNodes: (input: ConnectNodesInput) => void;
  getCanvasSnapshot: () => ReturnType<Editor["getSnapshot"]>;
  saveProject: (input?: SaveProjectInput) => ProjectSaveRecord;
  downloadProjectSnapshot: (input?: DownloadProjectInput) => ProjectSaveRecord;
  listProjectSaves: () => ProjectSaveRecord[];
}
