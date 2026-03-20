const AUTH_STORAGE_KEY = "movie-claw-auth-session";
const PROJECTS_STORAGE_KEY = "movie-claw-local-projects";
const PROJECT_SAVES_STORAGE_KEY = "movie-claw-project-saves";

export interface CanvasBridgeUser {
  userId: string;
  displayName: string;
  email: string;
  avatarText: string;
}

export interface CanvasBridgeProject {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
  gradient: string;
  tags: string[];
  ownerUserId: string;
  lastOpenedAt?: string;
  canvasProjectId: string;
}

export interface CanvasBridgeSaveSummary {
  savedAt: string;
  nodeCount: number;
  connectionCount: number;
}

function readJson<T>(storageKey: string): T | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadCanvasBridgeUser(): CanvasBridgeUser | null {
  return readJson<CanvasBridgeUser>(AUTH_STORAGE_KEY);
}

export function loadCanvasBridgeProject(projectRoomId: string): CanvasBridgeProject | null {
  const projects = readJson<CanvasBridgeProject[]>(PROJECTS_STORAGE_KEY);
  if (!projects || !Array.isArray(projects)) return null;
  return (
    projects.find((project) => project.id === projectRoomId || project.canvasProjectId === projectRoomId) ?? null
  );
}

export function loadCanvasBridgeLatestSave(projectRoomId: string): CanvasBridgeSaveSummary | null {
  const payloads = readJson<
    Array<{
      projectId: string;
      savedAt: string;
      summary?: { nodeCount?: number; connectionCount?: number };
    }>
  >(PROJECT_SAVES_STORAGE_KEY);
  if (!payloads || !Array.isArray(payloads)) return null;
  const target = payloads.find((item) => item.projectId === `movie-claw:${projectRoomId}`);
  if (!target) return null;
  return {
    savedAt: target.savedAt,
    nodeCount: target.summary?.nodeCount ?? 0,
    connectionCount: target.summary?.connectionCount ?? 0,
  };
}

export function getProjectListUrl() {
  const url = new URL(window.location.href);
  url.pathname = "/";
  url.search = "";
  url.hash = "#/projects";
  return url.toString();
}
