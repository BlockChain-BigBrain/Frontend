import { NETWORK } from "../config/network"

// ─── How It Works Modal ─────────────────────────────────────────────────────────
export default function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-2xl w-[540px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-white">서비스 작동 방식</h3>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          {[
            {
              num: "01",
              title: "AI 유사도 검증",
              desc: "Audio Fingerprint로 동일 파일을 먼저 검사하고, LAION-CLAP 512-dim 임베딩으로 등록 음원과의 음향 유사도를 비교합니다.",
              icon: "01",
              color: "#2f80ed",
            },
            {
              num: "02",
              title: "온체인 기록",
              desc: `검증 결과와 창작 이력 해시를 IPFS에 저장하고 ERC-1155로 ${NETWORK.name}에 기록합니다.`,
              icon: "02",
              color: "#7c3aed",
            },
            {
              num: "03",
              title: "라이선스·자동 정산",
              desc: "구매자에게 상업 이용 라이선스 영수증을 발급하고, 합의·서명한 비율대로 수익을 자동 분배합니다.",
              icon: "03",
              color: "#10b981",
            },
          ].map((s, i, arr) => (
            <div key={s.num} className="flex gap-4">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border"
                  style={{
                    background: `${s.color}15`,
                    borderColor: `${s.color}40`,
                  }}
                >
                  {s.icon}
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px flex-1 bg-[#21262d] min-h-[16px]"></div>
                )}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: s.color }}
                  >
                    Step {s.num}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {s.title}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="text-xs font-semibold text-amber-400 mb-2">
            한계와 안내
          </div>
          <ul className="space-y-1 text-xs text-[#9CA3AF] list-disc pl-4">
            <li>유사도는 음향적 비교이며 법적 표절 판단이 아닙니다.</li>
            <li>플랫폼에 등록된 곡과만 비교합니다.</li>
            <li>
              상용화 단계에서는 라이선스 몰수·정산 보류 관련 약관을 강화할
              예정입니다.
            </li>
          </ul>
        </div>
        <div className="mt-4 pt-4 border-t border-[#21262d]">
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            Polygon Network (Amoy) · Web3Auth AA 지갑 · LAION-CLAP
            gatekeeper-v2.1
          </div>
        </div>
      </div>
    </div>
  )
}
