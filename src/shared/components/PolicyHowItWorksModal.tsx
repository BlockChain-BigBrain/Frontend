import { NETWORK } from "../config/network"

export default function PolicyHowItWorksModal({ onClose }: { onClose: () => void }) {
  const steps = [
    { num: "01", title: "AI 음악 관계 검증", desc: "Chromaprint로 정확 중복을 먼저 확인합니다. 중복이 아니면 10초 창·5초 간격으로 Layer 2 후보를 검색하고 CLAP·pitch·rhythm·chroma·시간 정렬 특징을 결합합니다.", icon: "🔍", color: "#2f80ed" },
    { num: "02", title: "검증 결과와 증거 보존", desc: "query-level verifier와 pairwise temporal score를 분리해 보존합니다. 후보 원곡, 매칭 구간, 모델 버전, 정책 버전, threshold를 함께 기록합니다.", icon: "🧾", color: "#7c3aed" },
    { num: "03", title: "정책 판정 및 라이선스 흐름", desc: "정확 중복은 BLOCK, WARN 기준 이상은 추가 검토, HOLD 기준 이상은 사람 검토 전까지 보류합니다. PASS는 두 Layer 2 기준 모두 미만인 경우입니다.", icon: "✓", color: "#10b981" },
  ]
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-[620px] max-w-[calc(100vw-2rem)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6"><h3 className="text-base font-bold text-white">서비스 작동 방식</h3><button onClick={onClose} className="text-[#9CA3AF] hover:text-white" aria-label="닫기">×</button></div>
        <div className="space-y-4">{steps.map((s, i) => <div key={s.num} className="flex gap-4"><div className="flex flex-col items-center gap-1 flex-shrink-0"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border" style={{ background: `${s.color}15`, borderColor: `${s.color}40` }}>{s.icon}</div>{i < steps.length - 1 && <div className="w-px flex-1 bg-[#21262d] min-h-[22px]" />}</div><div className="pb-4"><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-mono" style={{ color: s.color }}>Step {s.num}</span><span className="text-sm font-semibold text-white">{s.title}</span></div><p className="text-xs text-[#9CA3AF] leading-relaxed">{s.desc}</p></div></div>)}</div>
        <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><div className="text-xs font-semibold text-amber-300 mb-2">한계와 안내</div><ul className="text-xs text-[#c9d1d9] space-y-1.5 list-disc pl-4"><li>WARN/HOLD는 음향적 관계 후보이며 법적 표절 판정이 아닙니다.</li><li>WARN 0.351229는 query-level verifier, HOLD 0.947200은 pairwise temporal score에 적용됩니다.</li><li>HOLD 결과는 원본 구간과 증거를 확인한 뒤 등록·판매 여부를 결정합니다.</li></ul></div>
        <div className="mt-5 pt-4 border-t border-[#21262d] text-xs text-[#9CA3AF] font-mono">scoreVersion: hybrid_query_top3_pairwise_hold-v5 · policy: track-ai-balanced-policy-v5-20261102 · network: {NETWORK.name}</div>
      </div>
    </div>
  )
}
