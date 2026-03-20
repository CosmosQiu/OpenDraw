// ==================== 项目列表页面 ====================
// 【演示版本临时实现】
// 项目管理界面，支持创建/删除/重命名/打开项目
// 后续接入正式后端时需替换为API调用
// =====================================================

import { useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../utils";
import { clearAuthSession } from "../auth/localAuth";
import { FILTER_TABS } from "../project/projectTypes";
import type { Project } from "../project/projectTypes";
import { ProjectCard, NewProjectCard } from "../components/ProjectCard";
import { useNotification } from "../components/NotificationProvider";
import CreateProjectModal from "../components/modals/CreateProjectModal";
import DeleteModal from "../components/modals/DeleteModal";
import RenameModal from "../components/modals/RenameModal";
import { LocalAuthSession } from "../auth/localAuth";
import {
  createProject,
  duplicateProject,
  loadProjects,
  saveProjects,
  touchProject,
} from "../project/localProjects";

// ==================== 类型 ====================

type ModalType = "create" | "delete" | "rename" | null;

interface CreateProjectData {
  name: string;
  type: Project["type"];
  gradient?: string;
}

interface ProjectsPageProps {
  user: LocalAuthSession | null;
}

// ==================== 组件 ====================

export default function ProjectsPage({ user }: ProjectsPageProps) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [target, setTarget] = useState<Project | null>(null);

  const notify = useNotification();

  const filtered = projects.filter((p) => {
    const matchFilter = activeFilter === "all" || p.type === activeFilter;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openCreate = () => {
    setModal("create");
  };

  const syncProjects = (updater: (current: Project[]) => Project[]) => {
    setProjects((current) => {
      const next = updater(current);
      saveProjects(next);
      return next;
    });
  };

  const handleCreate = (data: CreateProjectData) => {
    const newProject = createProject({
      name: data.name,
      type: data.type,
      gradient: data.gradient,
      ownerUserId: user?.userId ?? "guest-user",
    });
    syncProjects((prev) => [newProject, ...prev]);
    setModal(null);
    notify(`已创建：${data.name}`);
    // 使用react-router导航到画布页面
    navigate(`/canvas/${encodeURIComponent(newProject.canvasProjectId)}`);
  };

  const handleDelete = () => {
    if (!target) return;
    syncProjects((prev) => prev.filter((p) => p.id !== target.id));
    notify(`已删除：${target.name}`, "error");
    setModal(null);
    setTarget(null);
  };

  const handleRename = (newName: string) => {
    if (!target) return;
    syncProjects((prev) =>
      prev.map((p) => (p.id === target.id ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p)),
    );
    setModal(null);
    setTarget(null);
    notify("项目已重命名");
  };

  const handleDuplicate = (project: Project) => {
    const copy = duplicateProject(project);
    syncProjects((prev) => [copy, ...prev]);
    notify(`已复制：${project.name}`);
  };

  const handleOpenProject = (project: Project) => {
    syncProjects((prev) => touchProject(prev, project.id));
    navigate(`/canvas/${encodeURIComponent(project.canvasProjectId)}`);
  };

  const handleLogout = () => {
    clearAuthSession();
    notify("已退出登录");
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg font-sans">
      {/* 侧边栏 */}
      <aside className="w-[240px] bg-bg-2 border-r border-border flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-[15px] font-semibold text-white">MovieClaw</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-white bg-bg-4 border-l-2 border-accent">
              <span>📁</span> 我的项目
            </button>
          </div>
        </nav>
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-medium">
              {user?.avatarText ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{user?.displayName ?? "用户"}</p>
              <p className="text-[11px] text-[#555] truncate">{user?.email ?? ""}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-14 border-b border-border bg-bg flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-[15px] font-medium text-white">我的项目</h1>
          <button className="btn-secondary" onClick={handleLogout}>退出登录</button>
        </header>

        {/* 内容 */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {/* 工具栏 */}
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            {/* 过滤 Tab */}
            <div className="flex gap-1 bg-bg-2 border border-border rounded-lg p-1 overflow-x-auto">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border-none text-[13px] cursor-pointer whitespace-nowrap transition-all duration-200",
                    activeFilter === tab.key
                      ? "bg-bg-4 text-white font-medium"
                      : "bg-transparent text-[#a0a0a0] hover:text-white hover:bg-bg-3",
                  )}
                >
                  {tab.label}
                  {tab.key !== "all" && (
                    <span
                      className={cn(
                        "px-1.5 py-px rounded-full text-[11px] min-w-[18px] text-center",
                        activeFilter === tab.key
                          ? "bg-accent/20 text-accent-2"
                          : "bg-bg-4 text-[#555]",
                      )}
                    >
                      {projects.filter((p: Project) => p.type === tab.key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              {/* 视图切换 */}
              <div className="flex bg-bg-2 border border-border rounded-[6px] overflow-hidden">
                {(["grid", "list"] as const).map((mode) => {
                  const Icon = mode === "grid" ? LayoutGrid : List;
                  return (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "px-2.5 py-2 border-none flex items-center cursor-pointer transition-all duration-200",
                        viewMode === mode
                          ? "bg-bg-4 text-white"
                          : "bg-transparent text-[#555] hover:text-white hover:bg-bg-3",
                      )}
                    >
                      <Icon size={15} />
                    </button>
                  );
                })}
              </div>

              {/* 新建按钮 */}
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] border-none bg-accent text-white text-[13px] font-medium cursor-pointer hover:bg-accent-2 transition-colors whitespace-nowrap"
              >
                <Plus size={15} /> 新建项目
              </button>
            </div>
          </div>

          {/* 搜索提示 */}
          {searchQuery && (
            <p className="text-[13px] text-[#a0a0a0] mb-4">
              搜索 "<strong className="text-white">{searchQuery}</strong>"：共找到 {filtered.length} 个项目
            </p>
          )}

          {/* 网格视图 */}
          {viewMode === "grid" && (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
              <NewProjectCard onClick={openCreate} />
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={(p) => { setTarget(p); setModal("rename"); }}
                  onDelete={(p) => { setTarget(p); setModal("delete"); }}
                  onDuplicate={handleDuplicate}
                  onOpen={handleOpenProject}
                />
              ))}
            </div>
          )}

          {/* 列表视图 */}
          {viewMode === "list" && (
            <div className="flex flex-col gap-2">
              {filtered.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-3.5 px-4 py-3 bg-bg-2 border border-border rounded-[6px] transition-all hover:border-border-2 hover:bg-bg-3 group"
                  onClick={() => handleOpenProject(project)}
                >
                  <div className="w-11 h-11 rounded-md flex-shrink-0" style={{ background: project.gradient }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-white truncate">{project.name}</p>
                    <p className="text-[12px] text-[#555]">{project.updatedAt}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {project.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-bg-4 text-[#555] text-[11px]">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {filtered.length === 0 && !searchQuery && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-4xl">📂</span>
              <p className="text-[14px] text-[#a0a0a0]">该分类下暂无项目</p>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] border-none bg-accent text-white text-[13px] font-medium cursor-pointer hover:bg-accent-2 transition-colors"
              >
                <Plus size={15} /> 新建项目
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 弹窗 */}
      {modal === "create" && (
        <CreateProjectModal onConfirm={handleCreate} onClose={() => setModal(null)} />
      )}
      {modal === "delete" && target && (
        <DeleteModal project={target} onConfirm={handleDelete} onClose={() => setModal(null)} />
      )}
      {modal === "rename" && target && (
        <RenameModal project={target} onConfirm={handleRename} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
