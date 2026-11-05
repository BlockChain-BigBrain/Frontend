import { useState } from "react"
import { connectWallet, type WalletConnectStage } from "../../api/service"

const steps: { id: WalletConnectStage; label: string }[] = [
  { id: "account-prompt", label: "MetaMask 계정 연결" },
  { id: "challenge-request", label: "백엔드 소유 확인 요청" },
  { id: "signature-prompt", label: "소유 확인 메시지 서명" },
  { id: "signature-verification", label: "백엔드 서명 검증 및 지갑 저장" },
]

export default function WalletModal({
  setWalletConnected,
  setShowWalletModal,
  onConnected,
}: {
  setWalletConnected: (v: boolean) => void
  setShowWalletModal: (v: boolean) => void
  onConnected?: (address: string) => void
}) {
  const [stage, setStage] = useState<WalletConnectStage | "idle">("idle")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [rejected, setRejected] = useState(false)

  async function connect() {
    if (busy) return
    setError("")
    setRejected(false)
    const provider = typeof window === "undefined"
      ? undefined
      : (window as Window & { ethereum?: Parameters<typeof connectWallet>[0] }).ethereum
    if (!provider) {
      setError("MetaMask를 찾을 수 없습니다. 브라우저에 지갑 확장 프로그램을 설치해 주세요.")
      return
    }

    setBusy(true)
    setWalletConnected(false)
    try {
      const address = await connectWallet(provider, setStage)
      onConnected?.(address)
      setWalletConnected(true)
      setShowWalletModal(false)
    } catch (cause) {
      const code = cause && typeof cause === "object" && "code" in cause
        ? (cause as { code?: number }).code
        : undefined
      setRejected(code === 4001)
      setError(code === 4001
        ? "요청이 취소되었습니다. MetaMask에서 계정 연결 또는 메시지 서명을 승인하지 않았습니다."
        : cause instanceof Error ? cause.message : "지갑 연결에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  const activeIndex = steps.findIndex((item) => item.id === stage)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => { if (!busy) setShowWalletModal(false) }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
        className="w-full max-w-md rounded-2xl border border-[#30363d] bg-[#161b22] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-400">Wallet ownership</p>
            <h2 id="wallet-modal-title" className="mt-1 text-lg font-semibold text-white">지갑 연결 및 소유 확인</h2>
          </div>
          <button
            type="button"
            disabled={busy}
            aria-label="닫기"
            onClick={() => setShowWalletModal(false)}
            className="rounded-lg border border-[#30363d] px-2.5 py-1.5 text-sm text-[#9CA3AF] hover:text-white disabled:opacity-50"
          >×</button>
        </div>

        <p className="mb-5 text-sm leading-6 text-[#9CA3AF]">
          계정 연결 후 백엔드가 발급한 일회성 메시지에 서명합니다. 이 서명은 지갑 소유 확인만 수행하며 거래나 결제를 승인하지 않습니다.
        </p>

        <ol className="mb-5 space-y-2 rounded-xl border border-[#30363d] bg-[#0d1117] p-4">
          {steps.map((item, index) => {
            const complete = activeIndex > index || stage === "complete"
            const current = activeIndex === index && busy
            return (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                  complete ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : current ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                      : "border-[#30363d] text-[#6B7280]"
                }`}>{complete ? "✓" : String(index + 1).padStart(2, "0")}</span>
                <span className={current ? "text-white" : complete ? "text-emerald-300" : "text-[#7d8590]"}>{item.label}</span>
                {current && <span role="status" className="ml-auto text-[10px] text-blue-300">대기 중</span>}
              </li>
            )
          })}
        </ol>

        {error && (
          <div role="alert" className={`mb-4 rounded-xl border p-3 text-sm ${rejected ? "border-amber-500/30 bg-amber-500/5 text-amber-300" : "border-red-500/30 bg-red-500/5 text-red-300"}`}>
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void connect()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />요청 진행 중</> : "MetaMask 연결 시작"}
        </button>
        <p className="mt-3 text-center text-[11px] text-[#6B7280]">개인키와 복구 구문은 요청하지 않습니다.</p>
      </section>
    </div>
  )
}
