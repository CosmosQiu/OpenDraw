// ==================== 本地项目管理模块 ====================
// 【演示版本临时实现】
// 使用localStorage存储项目列表，无后端数据库
// 后续接入正式后端时需替换为API调用
// ========================================================

import { GRADIENT_PRESETS, INITIAL_PROJECTS, Project } from "./projectTypes";

const PROJECTS_STORAGE_KEY = "movie-claw-local-projects";
const PROJECT_SAVES_STORAGE_KEY = "movie-claw-project-saves";

/**
 * 画布保存摘要信息
 */
export interface CanvasSaveSummary {
  savedAt: string;
  nodeCount: number;
  connectionCount: number;
}

/**
 * 规范化项目数据，确保向后兼容
 * 【迁移说明】为旧数据添加canvasProjectId字段
 */
function normalizeProjects(projects: Project[]): Project[] {
  return projects.map((project) => ({
    ...project,
    canvasProjectId: project.canvasProjectId || project.id,
  }));
}

/**
 * 从localStorage加载项目列表
 * 【演示版本】首次访问时自动创建示例项目
 * @returns 项目数组
 */
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

/**
 * 保存项目列表到localStorage
 */
export function saveProjects(projects: Project[]) {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

/**
 * 创建新项目
 * @param input 项目信息（名称、类型、渐变等）
 * @returns 新创建的项目对象
 */
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

/**
 * 复制项目（创建副本）
 * @param project 源项目
 * @returns 复制后的新项目
 */
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

/**
 * 更新项目的最后访问时间
 * @param projects 项目列表
 * @param projectId 目标项目ID
 * @returns 更新后的项目列表
 */
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

/**
 * 获取项目的最新画布保存记录
 * 【演示版本】从画布存储中读取摘要信息
 * @param projectId 项目ID
 * @returns 保存摘要或null
 */
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

/**
 * 获取项目存储键名（供调试使用）
 */
export function getProjectsStorageKey() {
  return PROJECTS_STORAGE_KEY;
}
