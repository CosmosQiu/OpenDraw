import { useCountdown } from "@/hooks/useCountdown"
import { GRADIENT_PRESETS } from "@/data/constants"

interface CampaignBannerProps {
  onSubscribe: () => void
}

export default function CampaignBanner({ onSubscribe }: CampaignBannerProps) {
  const countdown = useCountdown("2026-04-02")

  return (
    <div className="relative rounded-[14px] overflow-hidden px-10 py-9 border border-brand-pink/30
                    bg-gradient-to-br from-[#1a0030] via-[#2d0845] to-[#1a0030] flex items-center gap-6
                    max-[640px]:px-6 max-[640px]:py-6">
      {/* 背景光晕 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(236,72,153,0.2),transparent_60%)] pointer-events-none" />

      {/* 内容 */}
      <div className="relative z-10 flex-1">
        <div className="flex gap-2 mb-3.5">
          <span className="px-2.5 py-0.5 rounded bg-accent/25 border border-accent/40 text-accent-2 text-xs font-semibold">
            年付 5 折
          </span>
          <span className="px-2.5 py-0.5 rounded bg-brand-pink/20 border border-brand-pink/40 text-brand-pink text-xs font-semibold">
            月付 6 折
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">🎬 TapNow 创作周</h2>
        <p className="text-white/70 text-sm mb-3.5">执掌你的画布 · 执行导演 Agent 全程助力</p>
        <ul className="space-y-1 mb-5 text-sm text-white/80">
          <li>✦ 剧本、分镜、成片，Agent 全搞定</li>
          <li>✦ 现在订阅，续订终身享受此优惠价</li>
        </ul>
        <div className="flex items-center gap-2.5 mb-5 text-sm text-white/60">
          <span>活动倒计时</span>
          <strong className="text-base font-bold text-brand-pink tabular-nums">{countdown}</strong>
        </div>
        <button className="btn-glow" onClick={onSubscribe}>立即订阅</button>
      </div>

      {/* 胶片装饰 */}
      <div className="relative z-10 flex-shrink-0 max-[640px]:hidden">
        <div className="flex flex-col gap-1.5 border-2 border-white/10 rounded-lg p-1.5 bg-black/30">
          {GRADIENT_PRESETS.map((g, i) => (
            <div
              key={i}
              className="w-24 h-14 rounded"
              style={{ background: g, opacity: 0.8 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
