import { Editor } from "tldraw";
import {
  DownloadProjectInput,
  ProjectSavePayload,
  ProjectSaveRecord,
  SaveProjectInput,
} from "./contracts";
import { getProjectId } from "./room";

export const PROJECT_SAVES_STORAGE_KEY = "movie-claw-project-saves";
const MAX_LOCAL_PROJECT_SAVES = 20;

function buildProjectSavePayload(
  editor: Editor,
  saveMode: ProjectSavePayload["saveMode"],
  source: ProjectSavePayload["source"],
): ProjectSavePayload {
  const snapshot = editor.getSnapshot();
  const shapes = editor.getCurrentPageShapes();
  const nodeCount = shapes.filter((shape) => shape.type === "node").length;
  const connectionCount = shapes.filter((shape) => shape.type === "connection").length;
  return {
    projectId: getProjectId(),
    savedAt: new Date().toISOString(),
    source,
    saveMode,
    snapshot,
    summary: {
      nodeCount,
      connectionCount,
    },
  };
}

function buildProjectSaveRecord(payload: ProjectSavePayload): ProjectSaveRecord {
  return {
    id: `${payload.projectId}:${payload.savedAt}`,
    projectId: payload.projectId,
    savedAt: payload.savedAt,
    source: payload.source,
    saveMode: payload.saveMode,
    summary: payload.summary,
  };
}

function loadProjectSavePayloads(): ProjectSavePayload[] {
  try {
    const raw = localStorage.getItem(PROJECT_SAVES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as ProjectSavePayload[];
  } catch {
    return [];
  }
}

function storeProjectSavePayloads(payloads: ProjectSavePayload[]) {
  localStorage.setItem(PROJECT_SAVES_STORAGE_KEY, JSON.stringify(payloads));
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export class CanvasProjectService {
  constructor(private readonly editor: Editor) {}

  getSnapshot() {
    return this.editor.getSnapshot();
  }

  saveProject(input?: SaveProjectInput): ProjectSaveRecord {
    const payload = buildProjectSavePayload(
      this.editor,
      "local_storage",
      input?.source ?? "agent_skill",
    );
    const existing = loadProjectSavePayloads().filter(
      (item) => item.projectId !== payload.projectId || item.savedAt !== payload.savedAt,
    );
    const next = [payload, ...existing].slice(0, MAX_LOCAL_PROJECT_SAVES);
    storeProjectSavePayloads(next);
    return buildProjectSaveRecord(payload);
  }

  downloadProjectSnapshot(input?: DownloadProjectInput): ProjectSaveRecord {
    const payload = buildProjectSavePayload(
      this.editor,
      "file_download",
      input?.source ?? "agent_skill",
    );
    const safeTimestamp = payload.savedAt.replaceAll(":", "-");
    const filename =
      input?.filename?.trim() || `${payload.projectId}-${safeTimestamp}.json`;
    downloadTextFile(filename, JSON.stringify(payload, null, 2));
    return buildProjectSaveRecord(payload);
  }

  listProjectSaves(): ProjectSaveRecord[] {
    return loadProjectSavePayloads()
      .filter((item) => item.projectId === getProjectId())
      .map(buildProjectSaveRecord);
  }

  getLatestProjectSave(): ProjectSaveRecord | null {
    return this.listProjectSaves()[0] ?? null;
  }
}
