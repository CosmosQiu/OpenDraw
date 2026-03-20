interface PromoCardsProps {
  onAction: () => void
}

export default function PromoCards({ onAction }: PromoCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
      {/* 注册送积分 */}
      <div className="relative rounded-[14px] p-6 border border-accent/30 bg-gradient-to-br from-[#1e1b4b] to-bg overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
        <span className="inline-block px-2 py-0.5 rounded bg-accent text-white text-[11px] font-semibold mb-2.5">
          限时
        </span>
        <div className="text-[28px] mb-2">🎉</div>
        <h3 className="text-[16px] font-semibold text-white mb-1.5">注册赠送 200 tapies</h3>
        <p className="text-[13px] text-[#a0a0a0] mb-4">新用户专属福利，立即注册领取</p>
        <button
          onClick={onAction}
          className="inline-flex items-center px-[18px] py-2 rounded-[6px] border-none bg-accent text-white text-[13px] font-medium cursor-pointer hover:bg-accent-2 transition-colors"
        >
          马上注册
        </button>
      </div>

      {/* Banana 折扣 */}
      <div className="relative rounded-[14px] p-6 border border-brand-yellow/30 bg-gradient-to-br from-[#1c1500] to-bg overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
        <span className="inline-block px-2 py-0.5 rounded bg-brand-yellow text-black text-[11px] font-semibold mb-2.5">
          优惠
        </span>
        <div className="text-[28px] mb-2">🍌</div>
        <h3 className="text-[16px] font-semibold text-white mb-1.5">Banana 2 五折优惠</h3>
        <p className="text-[13px] text-[#a0a0a0] mb-4">每日 02:00 – 08:00 可享受折扣</p>
        <button
          onClick={onAction}
          className="inline-flex items-center px-[18px] py-2 rounded-[6px] border-none bg-brand-yellow text-black text-[13px] font-medium cursor-pointer hover:bg-yellow-400 transition-colors"
        >
          查看详情
        </button>
      </div>
    </div>
  )
}
