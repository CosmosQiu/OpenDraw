import { useState } from "react"
import { Globe } from "lucide-react"
import ModalBase from "./ModalBase"
import { cn } from "@/lib/utils"

type TabType = "login" | "register"

interface LoginPayload {
  email: string
}

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onLogin: (payload: LoginPayload) => void
}

export default function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const [tab, setTab] = useState<TabType>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onLogin({ email })
  }

  return (
    <ModalBase open={open} title={tab === "login" ? "登录 TapNow" : "注册 TapNow"} onClose={onClose}>
      {/* Tab 切换 */}
      <div className="flex bg-bg-3 rounded-[6px] p-1 mb-5">
        {(["login", "register"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 rounded-[5px] border-none text-[14px] cursor-pointer transition-all duration-200",
              tab === t
                ? "bg-bg-4 text-white font-medium"
                : "bg-transparent text-[#a0a0a0] hover:text-white",
            )}
          >
            {t === "login" ? "登录" : "注册"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-[13px] text-[#a0a0a0] mb-1.5">邮箱</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            required
          />
        </div>
        <div className="mb-5">
          <label className="block text-[13px] text-[#a0a0a0] mb-1.5">密码</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full justify-center mb-0">
          {tab === "login" ? "登录" : "注册"}
        </button>
      </form>

      {/* 分割线 */}
      <div className="relative flex items-center my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="px-3 text-[12px] text-[#555]">或</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* 社交登录 */}
      <button
        onClick={() => onLogin({ email: email || "creator@movieclaw.local" })}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[6px] border border-border-2 bg-bg-3 text-[#a0a0a0] text-[14px] cursor-pointer hover:border-accent hover:text-white hover:bg-bg-4 transition-all"
      >
        <Globe size={15} /> 使用 Google 账号继续
      </button>
    </ModalBase>
  )
}
