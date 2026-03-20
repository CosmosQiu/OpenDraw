interface AuthBannerProps {
  onLogin: () => void
}

export default function AuthBanner({ onLogin }: AuthBannerProps) {
  return (
    <div className="relative rounded-[14px] overflow-hidden px-10 py-9 border border-accent/30
                    bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]">
      {/* 径向光晕 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(124,58,237,0.25),transparent_70%)] pointer-events-none" />

      {/* 装饰圆 */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex gap-4 pointer-events-none max-[640px]:hidden">
        <div className="w-[120px] h-[120px] rounded-full bg-accent-2 opacity-15" />
        <div className="w-20 h-20 rounded-full bg-brand-pink opacity-15 self-end" />
        <div className="w-12 h-12 rounded-full bg-brand-teal opacity-15 self-center" />
      </div>

      <div className="relative z-10 max-w-[500px]">
        <div className="text-4xl mb-3">🎨</div>
        <h2 className="text-[22px] font-bold text-white mb-2.5">开启你的 AI 创作之旅</h2>
        <p className="text-sm text-white/70 mb-5 leading-relaxed">
          登录后即可创建项目，使用 AI 智能画布剧本、分镜、成片一键生成
        </p>
        <button className="btn-glow" onClick={onLogin}>
          立即登录 / 注册
        </button>
      </div>
    </div>
  )
}
