export const GRADIENT_PRESETS: string[] = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#ec4899,#f43f5e)",
  "linear-gradient(135deg,#14b8a6,#06b6d4)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "linear-gradient(135deg,#10b981,#3b82f6)",
  "linear-gradient(135deg,#f97316,#eab308)",
  "linear-gradient(135deg,#6366f1,#14b8a6)",
]

export interface Project {
  id: string
  name: string
  type: "team" | "personal" | "free"
  updatedAt: string
  gradient: string
  tags: string[]
  ownerUserId: string
  canvasProjectId: string
  lastOpenedAt?: string
}

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "project-brand-spring",
    name: "品牌宣传片 - 春季新品",
    type: "team",
    updatedAt: "2026-03-18",
    gradient: GRADIENT_PRESETS[0],
    tags: ["视频", "品牌"],
    ownerUserId: "seed-user",
    canvasProjectId: "project-brand-spring",
    lastOpenedAt: "2026-03-18T09:30:00.000Z",
  },
  {
    id: "project-social-series",
    name: "社媒短视频系列",
    type: "personal",
    updatedAt: "2026-03-15",
    gradient: GRADIENT_PRESETS[1],
    tags: ["短视频"],
    ownerUserId: "seed-user",
    canvasProjectId: "project-social-series",
    lastOpenedAt: "2026-03-15T10:15:00.000Z",
  },
  {
    id: "project-keynote",
    name: "产品发布会 Keynote",
    type: "team",
    updatedAt: "2026-03-10",
    gradient: GRADIENT_PRESETS[2],
    tags: ["演示", "团队"],
    ownerUserId: "seed-user",
    canvasProjectId: "project-keynote",
    lastOpenedAt: "2026-03-10T15:40:00.000Z",
  },
  {
    id: "project-ad-script",
    name: "创意广告脚本",
    type: "free",
    updatedAt: "2026-03-08",
    gradient: GRADIENT_PRESETS[3],
    tags: ["脚本"],
    ownerUserId: "seed-user",
    canvasProjectId: "project-ad-script",
    lastOpenedAt: "2026-03-08T12:00:00.000Z",
  },
  {
    id: "project-annual-report",
    name: "年终汇报动画",
    type: "personal",
    updatedAt: "2026-03-05",
    gradient: GRADIENT_PRESETS[4],
    tags: ["动画"],
    ownerUserId: "seed-user",
    canvasProjectId: "project-annual-report",
    lastOpenedAt: "2026-03-05T08:20:00.000Z",
  },
  {
    id: "project-user-interview",
    name: "用户访谈剪辑",
    type: "team",
    updatedAt: "2026-03-01",
    gradient: GRADIENT_PRESETS[5],
    tags: ["剪辑", "团队"],
    ownerUserId: "seed-user",
    canvasProjectId: "project-user-interview",
    lastOpenedAt: "2026-03-01T18:10:00.000Z",
  },
]

export interface FilterTab {
  key: string
  label: string
}

export const FILTER_TABS: FilterTab[] = [
  { key: "all", label: "全部" },
  { key: "free", label: "免费体验" },
  { key: "personal", label: "个人" },
  { key: "team", label: "团队项目" },
]

export interface NavItem {
  key: string
  label: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { key: "projects", label: "我的项目", icon: "Folder" },
  { key: "templates", label: "模板库", icon: "LayoutTemplate" },
  { key: "arena", label: "竞技场", icon: "Trophy" },
  { key: "settings", label: "设置", icon: "Settings" },
]
