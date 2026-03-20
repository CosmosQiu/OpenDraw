import { useState } from "react"
import { LayoutGrid, List, Plus, Pencil, Copy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { FILTER_TABS } from "@/data/constants"
import type { Project } from "@/data/constants"
import { ProjectCard, NewProjectCard } from "@/components/ProjectCard"
import { useNotification } from "@/components/NotificationProvider"
import CreateProjectModal from "@/components/modals/CreateProjectModal"
import DeleteModal from "@/components/modals/DeleteModal"
import RenameModal from "@/components/modals/RenameModal"
import { LocalAuthSession } from "@/lib/localAuth"
import {
  createProject,
  duplicateProject,
  getLatestCanvasSave,
  loadProjects,
  saveProjects,
  touchProject,
} from "@/lib/localProjects"
import { openCanvasProject } from "@/lib/navigation"

// ==================== 类型 ====================

type ModalType = "create" | "delete" | "rename" | null

interface CreateProjectData {
  name: string
  type: Project["type"]
  gradient?: string
}

// ==================== Props ====================

interface ProjectsSectionProps {
  isLoggedIn: boolean
  user: LocalAuthSession | null
  onLoginRequired: () => void
}

export default function ProjectsSection({ isLoggedIn, user, onLoginRequired }: ProjectsSectionProps) {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects())
  const [activeFilter, setActiveFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery] = useState("")
  const [modal, setModal] = useState<ModalType>(null)
  const [target, setTarget] = useState<Project | null>(null)

  const notify = useNotification()

  const filtered = projects.filter((p) => {
    const matchFilter = activeFilter === "all" || p.type === activeFilter
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFilter && matchSearch
  })

  const openCreate = () => {
    if (!isLoggedIn) { onLoginRequired(); return }
    setModal("create")
  }

  const syncProjects = (updater: (current: Project[]) => Project[]) => {
    setProjects((current) => {
      const next = updater(current)
      saveProjects(next)
      return next
    })
  }

  const handleCreate = (data: CreateProjectData) => {
    const newProject = createProject({
      name: data.name,
      type: data.type,
      gradient: data.gradient,
      ownerUserId: user?.userId ?? "guest-user",
    })
    syncProjects((prev) => [newProject, ...prev])
    setModal(null)
    notify(`已创建：${data.name}`)
    openCanvasProject(newProject.canvasProjectId)
  }

  const handleDelete = () => {
    if (!target) return
    syncProjects((prev) => prev.filter((p) => p.id !== target.id))
    notify(`已删除：${target.name}`, "error")
    setModal(null)
    setTarget(null)
  }

  const handleRename = (newName: string) => {
    if (!target) return
    syncProjects((prev) =>
      prev.map((p) => (p.id === target.id ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p)),
    )
    setModal(null)
    setTarget(null)
    notify("项目已重命名")
  }

  const handleDuplicate = (project: Project) => {
    const copy = duplicateProject(project)
    syncProjects((prev) => [copy, ...prev])
    notify(`已复制：${project.name}`)
  }

  const handleOpenProject = (project: Project) => {
    syncProjects((prev) => touchProject(prev, project.id))
    openCanvasProject(project.canvasProjectId)
  }

  return (
    <section className="flex flex-col gap-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
                  {projects.filter((p) => p.type === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          {/* 视图切换 */}
          <div className="flex bg-bg-2 border border-border rounded-[6px] overflow-hidden">
            {(["grid", "list"] as const).map((mode) => {
              const Icon = mode === "grid" ? LayoutGrid : List
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
              )
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
        <p className="text-[13px] text-[#a0a0a0]">
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
              onEdit={(p) => { setTarget(p); setModal("rename") }}
              onDelete={(p) => { setTarget(p); setModal("delete") }}
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
            (() => {
              const latestSave = getLatestCanvasSave(project.canvasProjectId)
              return (
            <div
              key={project.id}
              className="flex items-center gap-3.5 px-4 py-3 bg-bg-2 border border-border rounded-[6px] transition-all hover:border-border-2 hover:bg-bg-3 group"
              onClick={() => handleOpenProject(project)}
            >
              <div className="w-11 h-11 rounded-md flex-shrink-0" style={{ background: project.gradient }} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-white truncate">{project.name}</p>
                <p className="text-[12px] text-[#555]">
                  {latestSave?.savedAt
                    ? `上次保存 ${new Date(latestSave.savedAt).toLocaleString("zh-CN")}`
                    : project.updatedAt}
                </p>
              </div>
              <div className="flex gap-1.5">
                {project.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-bg-4 text-[#555] text-[11px]">{t}</span>
                ))}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {[
                  { Icon: Pencil, action: () => { setTarget(project); setModal("rename") }, danger: false },
                  { Icon: Copy, action: () => handleDuplicate(project), danger: false },
                  { Icon: Trash2, action: () => { setTarget(project); setModal("delete") }, danger: true },
                ].map(({ Icon, action, danger }, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation()
                      action()
                    }}
                    className={cn(
                      "w-[30px] h-[30px] rounded-[6px] border border-border bg-transparent flex items-center justify-center cursor-pointer transition-all",
                      danger
                        ? "text-[#a0a0a0] hover:border-brand-red hover:text-brand-red hover:bg-brand-red/8"
                        : "text-[#a0a0a0] hover:border-border-2 hover:text-white hover:bg-bg-4",
                    )}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>
              )
            })()
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
    </section>
  )
}
