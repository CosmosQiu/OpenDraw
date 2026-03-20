import { Crown, Folder, LayoutTemplate, Trophy, Settings, LucideProps } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/data/constants"
import { LocalAuthSession } from "@/lib/localAuth"

// ==================== 图标映射 ====================

type IconName = "Folder" | "LayoutTemplate" | "Trophy" | "Settings"
type IconComponent = React.ComponentType<LucideProps>

const ICON_MAP: Record<IconName, IconComponent> = {
  Folder,
  LayoutTemplate,
  Trophy,
  Settings,
}

// ==================== Props ====================

interface SidebarProps {
  activeNav: string
  setActiveNav: (key: string) => void
  isLoggedIn: boolean
  user: LocalAuthSession | null
  onLoginClick: () => void
}

export default function Sidebar({ activeNav, setActiveNav, isLoggedIn, user, onLoginClick }: SidebarProps) {
  return (
    <aside className="w-[220px] min-w-[220px] bg-bg-2 border-r border-border flex flex-col overflow-hidden z-10
                      max-[900px]:w-[60px] max-[900px]:min-w-[60px]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-[18px] py-5 border-b border-border">
        <img
          src="https://fe-assets.tapnow.top/d539abc1f16ae29bdf5349e13be153be3c3615d5/tap_logo.svg"
          alt="TapNow"
          className="h-6 w-auto brightness-0 invert"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
        />
        <span className="text-base font-bold gradient-text max-[900px]:hidden">TapNow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2.5 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const IconComp = ICON_MAP[item.icon as IconName]
          return (
            <button
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] border-none text-sm cursor-pointer w-full text-left transition-all duration-200",
                "max-[900px]:justify-center",
                activeNav === item.key
                  ? "bg-accent/15 text-accent-2 font-medium"
                  : "bg-transparent text-[#a0a0a0] hover:bg-bg-3 hover:text-white",
              )}
            >
              <IconComp size={18} />
              <span className="max-[900px]:hidden">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2.5 border-t border-border">
        {isLoggedIn ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] bg-bg-3 max-[900px]:justify-center">
            <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-accent to-brand-pink flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.avatarText ?? "创"}
            </div>
            <div className="max-[900px]:hidden">
              <p className="text-[13px] font-medium text-white">{user?.displayName ?? "创作者"}</p>
              <p className="flex items-center gap-1 text-[11px] text-brand-yellow">
                <Crown size={11} /> Pro 会员
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="w-full py-2.5 rounded-[6px] border border-dashed border-border-2 bg-transparent text-[#a0a0a0] text-[13px] cursor-pointer transition-all duration-200 hover:border-accent hover:text-accent-2 hover:bg-accent/8 max-[900px]:px-0"
          >
            <span className="max-[900px]:hidden">登录 / 注册</span>
            <span className="hidden max-[900px]:block">→</span>
          </button>
        )}
      </div>
    </aside>
  )
}
