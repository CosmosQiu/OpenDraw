import { useState } from "react"
import { Search, Bell } from "lucide-react"
import { LocalAuthSession } from "@/lib/localAuth"

interface TopBarProps {
  isLoggedIn: boolean
  onLoginClick: () => void
  user: LocalAuthSession | null
  onLogout: () => void
}

export default function TopBar({ isLoggedIn, onLoginClick, user, onLogout }: TopBarProps) {
  const [query, setQuery] = useState("")

  return (
    <header className="flex items-center justify-between px-6 h-[60px] bg-bg border-b border-border flex-shrink-0 gap-4">
      <h1 className="text-[18px] font-semibold text-white">我的项目</h1>

      <div className="flex items-center gap-2.5">
        {/* 搜索框 */}
        <div className="flex items-center gap-2 bg-bg-3 border border-border rounded-lg px-3 py-[7px] w-[220px] focus-within:border-accent transition-colors">
          <Search size={15} className="text-[#555] flex-shrink-0" />
          <input
            type="text"
            placeholder="搜索项目..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent border-none text-white text-[13px] outline-none w-full placeholder:text-[#555]"
          />
        </div>

        {/* 铃铛 */}
        <button className="w-9 h-9 rounded-[6px] border border-border bg-bg-3 text-[#a0a0a0] flex items-center justify-center cursor-pointer hover:text-white hover:border-border-2 transition-all">
          <Bell size={17} />
        </button>

        {/* 用户区 */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-accent to-brand-pink flex items-center justify-center text-xs font-bold text-white cursor-pointer">
              {user?.avatarText ?? "创"}
            </div>
            <div className="hidden sm:flex flex-col min-w-0">
              <strong className="text-[13px] text-white truncate">{user?.displayName ?? "创作者"}</strong>
              <span className="text-[11px] text-[#555] truncate">{user?.email ?? ""}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-[7px] rounded-[6px] border border-border-2 bg-transparent text-[#a0a0a0] text-[13px] cursor-pointer hover:border-accent hover:text-accent-2 transition-all"
            >
              退出
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onLoginClick}
              className="px-3.5 py-[7px] rounded-[6px] border border-border-2 bg-transparent text-[#a0a0a0] text-[13px] cursor-pointer hover:border-accent hover:text-accent-2 transition-all"
            >
              登录
            </button>
            <button
              onClick={onLoginClick}
              className="px-3.5 py-[7px] rounded-[6px] border-none bg-accent text-white text-[13px] font-medium cursor-pointer hover:bg-accent-2 transition-colors"
            >
              注册
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
