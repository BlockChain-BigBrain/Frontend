import type { Screen } from "../../shared/types/domain"
import { NETWORK } from "../../shared/config/network"

export default function CertificateScreen({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-24 text-white">
      <section className="overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22]">
        <div className="border-b border-[#30363d] bg-gradient-to-br from-[#173329] via-[#161b22] to-[#0d1117] p-7 sm:p-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">License receipt · {NETWORK.name}</p>
          <h1 className="mt-2 text-2xl font-bold">라이선스 증명서</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#9CA3AF]">실제 구매 데이터가 선택되지 않았습니다. 백엔드가 거래 영수증과 발급 상태를 확인한 뒤에만 라이선스 정보를 표시합니다.</p>
        </div>
        <dl className="divide-y divide-[#30363d]">
          {[["구매 상태", "확인할 데이터 없음"], ["거래 해시", "—"], ["Token ID", "—"], ["블록 번호", "—"], ["음원·권리자", "—"]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
            <dt className="text-[#7d8590]">{label}</dt><dd className="break-all text-right font-mono text-[#9CA3AF]">{value}</dd>
          </div>)}
        </dl>
        <div className="border-t border-[#30363d] p-6">
          <button type="button" onClick={() => setScreen("marketplace")} className="w-full rounded-xl border border-[#30363d] bg-[#1c2128] px-4 py-3 text-sm font-medium text-white transition-colors hover:border-blue-500">Explore로 돌아가기</button>
        </div>
      </section>
    </main>
  )
}
