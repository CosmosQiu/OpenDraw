import { useRef, useState, useEffect } from "react"
import { Video, MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project } from "@/data/constants"

// ==================== 下拉菜单 ====================

interface CardDropdownMenuProps {
  project: Project
  onEdit: (project: Project) => void
  onDuplicate: (project: Project) => void
  onDelete: (project: Project) => void
  onClose: () => void
}

function CardDropdownMenu({ project, onEdit, onDuplicate, onDelete, onClose }: CardDropdownMenuProps) {
  return (
    <div className="absolute top-11 right-2 z-20 bg-bg-3 border border-border-2 rounded-[6px] overflow-hidden shadow-lg min-w-[140px]">
      <button
        className="flex items-center gap-2 w-full px-3.5 py-2.5 border-none bg-transparent text-[#a0a0a0] text-[13px] cursor-pointer text-left hover:bg-bg-4 hover:text-white transition-all"
        onClick={() => { onEdit(project); onClose() }}
      >
        <Pencil size={13} /> 重命名
      </button>
      <button
        className="flex items-center gap-2 w-full px-3.5 py-2.5 border-none bg-transparent text-[#a0a0a0] text-[13px] cursor-pointer text-left hover:bg-bg-4 hover:text-white transition-all"
        onClick={() => { onDuplicate(project); onClose() }}
      >
        <Copy size={13} /> 复制项目
      </button>
      <div className="h-px bg-border my-0.5" />
      <button
        className="flex items-center gap-2 w-full px-3.5 py-2.5 border-none bg-transparent text-brand-red text-[13px] cursor-pointer text-left hover:bg-brand-red/10 transition-all"
        onClick={() => { onDelete(project); onClose() }}
      >
        <Trash2 size={13} /> 删除
      </button>
    </div>
  )
}

// ==================== ProjectCard ====================

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onDuplicate: (project: Project) => void
  onOpen: (project: Project) => void
}

export function ProjectCard({ project, onEdit, onDelete, onDuplicate, onOpen }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div
      className="group bg-bg-2 border border-border rounded-[10px] overflow-hidden cursor-pointer transition-all duration-200 hover:border-border-2 hover:-translate-y-0.5 hover:shadow-card"
      onClick={() => onOpen(project)}
    >
      {/* 封面 */}
      <div
        className="relative h-40 flex items-center justify-center"
        style={{ background: project.gradient }}
      >
        <Video size={28} className="opacity-50 text-white" />

        <button
          className={cn(
            "absolute top-2.5 right-2.5 w-7 h-7 rounded-[6px] border-none bg-black/40 text-white flex items-center justify-center cursor-pointer transition-opacity duration-200 backdrop-blur-sm",
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
        >
          <MoreHorizontal size={15} />
        </button>

        {menuOpen && (
          <div ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <CardDropdownMenu
              project={project}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="px-4 py-3.5">
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded bg-bg-4 text-[#555] text-[11px]"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-[14px] font-medium text-white mb-1 truncate">{project.name}</p>
        <p className="text-[12px] text-[#555]">更新于 {project.updatedAt}</p>
      </div>
    </div>
  )
}

// ==================== NewProjectCard ====================

interface NewProjectCardProps {
  onClick: () => void
}

export function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <button
      onClick={onClick}
      className="group bg-transparent border-2 border-dashed border-border-2 rounded-[10px] flex flex-col items-center justify-center gap-2.5 cursor-pointer min-h-[220px] w-full transition-all duration-200 hover:border-accent hover:bg-accent/5"
    >
      <div className="w-13 h-13 rounded-full bg-accent/10 flex items-center justify-center transition-colors group-hover:bg-accent/20">
        <span className="text-3xl text-accent group-hover:text-accent-2 transition-colors">＋</span>
      </div>
      <span className="text-[14px] font-medium text-[#555] group-hover:text-accent-2 transition-colors">
        新建项目
      </span>
    </button>
  )
}
