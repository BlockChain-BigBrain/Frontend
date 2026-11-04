import type { ChainResult, Screen } from "../../shared/types/domain"

export default function CheckoutScreen({ setScreen, chainResult }: {
  setScreen: (screen: Screen) => void
  chainResult: ChainResult
  onRecheckResult: () => void
}) {
  const restricted = chainResult.aiStatus === "HOLD" || chainResult.aiStatus === "BLOCK"
  return <main className="mx-auto max-w-2xl px-6 pt-24 text-white">
    <h1 className="mb-4 text-2xl font-bold">라이선스 구매</h1>
    <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
      <p role="status" className="mb-4 text-amber-300">
        {restricted ? "AI 정책에 따라 구매가 제한된 음원입니다." : "연동 준비 중 — 실제 구매 대상과 결제 거래가 연결되지 않았습니다."}
      </p>
      <p className="mb-5 text-sm text-gray-400">실제 Backend 구매 요청, 지갑 거래 서명, 온체인 영수증 및 라이선스 발급 확인 전에는 결제 완료로 표시하지 않습니다.</p>
      <button type="button" disabled className="w-full cursor-not-allowed rounded-lg bg-gray-700 py-3 text-gray-300">구매 불가 · 연동 준비 중</button>
      <button type="button" onClick={() => setScreen("marketplace")} className="mt-3 w-full rounded-lg border border-[#30363d] py-3">마켓플레이스로 돌아가기</button>
    </section>
  </main>
}
