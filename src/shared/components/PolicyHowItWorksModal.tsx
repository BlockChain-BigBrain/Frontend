import { NETWORK } from "../config/network"

export default function PolicyHowItWorksModal({ onClose }: { onClose: () => void }) {
  const steps = [
    { num: "01", title: "실제 음원 검증", desc: "백엔드가 음원 지문 중복을 확인하고 설정된 원격 AI 서비스에 검증을 요청합니다. AI 서버는 프론트엔드에서 직접 호출하지 않습니다.", color: "#2f80ed" },
    { num: "02", title: "응답 근거 표시", desc: "판정, similarity score, query verifier score, 후보 매칭 구간, 모델·정책 버전은 실제 검증 응답에 있는 값만 표시합니다.", color: "#7c3aed" },
    { num: "03", title: "등록 전 지갑 확인", desc: `기여도 확정과 서버 등록 준비를 확인한 뒤 MetaMask에서 ${NETWORK.name} 계정으로 거래를 승인합니다. 등록 성공은 거래 해시만으로 표시하지 않으며 영수증과 백엔드 확인이 끝나야 합니다.`, color: "#10b981" },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="policy-modal-title" className="w-full max-w-2xl rounded-2xl border border-[#30363d] bg-[#161b22] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-400">Track-AI · {NETWORK.name}</p><h2 id="policy-modal-title" className="mt-1 text-lg font-bold text-white">검증과 온체인 등록</h2></div>
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded-lg border border-[#30363d] px-2.5 py-1.5 text-sm text-[#9CA3AF] hover:text-white">×</button>
        </div>
        <ol className="space-y-4">
          {steps.map((step) => <li key={step.num} className="flex gap-4 rounded-xl border border-[#30363d] bg-[#0d1117] p-4">
            <span className="font-mono text-xs" style={{ color: step.color }}>{step.num}</span>
            <div><h3 className="text-sm font-semibold text-white">{step.title}</h3><p className="mt-1 text-xs leading-6 text-[#9CA3AF]">{step.desc}</p></div>
          </li>)}
        </ol>
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-6 text-[#c9d1d9]">
          AI 판정은 음원 유사성 검토 근거이며 법적 권리 판단이 아닙니다. WARN과 HOLD의 점수 기준은 서로 다른 값입니다. 음원별 실제 기준과 정책 버전은 검증 응답에서 확인할 수 있을 때만 표시합니다.
        </div>
      </section>
    </div>
  )
}
