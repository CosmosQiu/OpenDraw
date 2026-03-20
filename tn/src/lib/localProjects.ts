import { GRADIENT_PRESETS, INITIAL_PROJECTS, Project } from "@/data/constants";

const PROJECTS_STORAGE_KEY = "movie-claw-local-projects";
const PROJECT_SAVES_STORAGE_KEY = "movie-claw-project-saves";

export interface CanvasSaveSummary {
  savedAt: string;
  nodeCount: number;
  connectionCount: number;
}

function normalizeProjects(projects: Project[]): Project[] {
  return projects.map((project) => ({
    ...project,
    canvasProjectId: project.canvasProjectId || project.id,
  }));
}

export function loadProjects(): Project[] {
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      const initial = normalizeProjects(INITIAL_PROJECTS);
      window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Project[];
    if (!Array.isArray(parsed)) {
      return normalizeProjects(INITIAL_PROJECTS);
    }
    return normalizeProjects(parsed);
  } catch {
    return normalizeProjects(INITIAL_PROJECTS);
  }
}

export function saveProjects(projects: Project[]) {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export function createProject(input: {
  name: string;
  type: Project["type"];
  gradient?: string;
  ownerUserId: string;
}): Project {
  const now = new Date().toISOString();
  const id = `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    name: input.name,
    type: input.type,
    updatedAt: now,
    gradient: input.gradient ?? GRADIENT_PRESETS[0],
    tags: input.type === "team" ? ["团队"] : input.type === "free" ? ["免费"] : ["个人"],
    ownerUserId: input.ownerUserId,
    lastOpenedAt: now,
    canvasProjectId: id,
  };
}

export function duplicateProject(project: Project): Project {
  const now = new Date().toISOString();
  const id = `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    ...project,
    id,
    canvasProjectId: id,
    name: `${project.name}（副本）`,
    updatedAt: now,
    lastOpenedAt: now,
  };
}

export function touchProject(projects: Project[], projectId: string): Project[] {
  const now = new Date().toISOString();
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          updatedAt: now,
          lastOpenedAt: now,
        }
      : project,
  );
}

export function getLatestCanvasSave(projectId: string): CanvasSaveSummary | null {
  try {
    const raw = window.localStorage.getItem(PROJECT_SAVES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Array<{
      projectId: string;
      savedAt: string;
      summary?: { nodeCount?: number; connectionCount?: number };
    }>;
    if (!Array.isArray(parsed)) return null;
    const match = parsed.find((item) => item.projectId === `movie-claw:${projectId}`);
    if (!match?.savedAt) return null;
    return {
      savedAt: match.savedAt,
      nodeCount: match.summary?.nodeCount ?? 0,
      connectionCount: match.summary?.connectionCount ?? 0,
    };
  } catch {
    return null;
  }
}

export function getProjectsStorageKey() {
  return PROJECTS_STORAGE_KEY;
}
