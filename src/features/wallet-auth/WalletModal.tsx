import { useState } from "react"
import { connectWallet } from "../../api/service"

export default function WalletModal({
  setWalletConnected,
  setShowWalletModal,
  onConnected,
}: {
  setWalletConnected: (v: boolean) => void
  setShowWalletModal: (v: boolean) => void
  onConnected?: (address: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function connect() {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const address = await connectWallet()
      onConnected?.(address)
      setWalletConnected(true)
      setShowWalletModal(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "지갑 연결에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { if (!busy) setShowWalletModal(false) }}>
      <div role="dialog" aria-modal="true" aria-label="지갑 연결" className="bg-[#161b22] border border-[#30363d] rounded-xl w-[360px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">지갑 연결</h3>
          <button disabled={busy} aria-label="닫기" onClick={() => setShowWalletModal(false)} className="text-[#9CA3AF]">✕</button>
        </div>
        <p className="text-xs text-[#9CA3AF] mb-4">MetaMask 서명으로 지갑 소유권을 확인하고 로그인 계정에 연결합니다.</p>
        <button disabled={busy} onClick={() => void connect()} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1c2128] hover:bg-[#21262d] border border-[#30363d] text-white disabled:opacity-60">
          <span className="text-xl">🦊</span><span className="text-sm">{busy ? "서명 확인 중…" : "MetaMask 연결"}</span>
        </button>
        {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}
