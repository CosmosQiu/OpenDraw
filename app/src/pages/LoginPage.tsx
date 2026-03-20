// ==================== 登录页面 ====================
// 【演示版本临时实现】
// 纯前端模拟登录，无真实身份验证
// 后续接入正式后端时需替换为真实认证流程
// =================================================

import { useState } from "react";

interface LoginScreenProps {
  onLogin: (payload: { email: string }) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e1b4b,#09090b_55%)] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-[980px] grid lg:grid-cols-[1.2fr_0.8fr] overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="p-10 lg:p-14 flex flex-col justify-between gap-10 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="space-y-5">
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-white/70">
              MovieClaw · TapNow Workspace
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">登录后继续你的项目与 AI 画布创作</h1>
              <p className="text-base text-white/65 leading-7 max-w-[560px]">
                先登录账号，再进入项目管理页面。你可以从项目列表直接打开之前保存过的画布，并继续编辑、保存和导出。
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <strong className="block text-white text-base mb-2">项目管理</strong>
              管理本地项目、最近打开记录和项目元数据。
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <strong className="block text-white text-base mb-2">本地画布保存</strong>
              每个项目绑定独立画布保存记录，随时恢复。
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <strong className="block text-white text-base mb-2">AI 工作流</strong>
              在统一画布中继续节点编排、执行和导出。
            </div>
          </div>
        </div>
        <div className="p-8 lg:p-12 flex items-center justify-center bg-black/10">
          <form
            className="w-full max-w-[360px] space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              onLogin({ email: email.trim() || "creator@movieclaw.local" });
            }}
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">登录 TapNow</h2>
              <p className="text-sm text-white/55">登录后进入项目页，再从项目页进入画布。</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-white/70">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                className="input-base"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-white/70">密码</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="input-base"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center text-[15px] py-3">
              进入项目管理页
            </button>
            <button
              type="button"
              className="btn-secondary w-full justify-center text-[14px]"
              onClick={() => onLogin({ email: email.trim() || "creator@movieclaw.local" })}
            >
              使用体验账号继续
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
