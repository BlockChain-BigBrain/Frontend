export default function WalletModal({
  setWalletConnected,
  setShowWalletModal,
}: {
  setWalletConnected: (v: boolean) => void
  setShowWalletModal: (v: boolean) => void
}) {
  return (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowWalletModal(false)}
        >
          <div
            className="bg-[#161b22] border border-[#30363d] rounded-xl w-[360px] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">지갑 연결</h3>
              <button
                onClick={() => setShowWalletModal(false)}
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
            <div className="space-y-2">
              {[
                {
                  name: "Web3Auth (Google)",
                  icon: "🔵",
                  desc: "소셜 로그인 · AA 지갑 · 가스비 대납",
                },
                { name: "MetaMask", icon: "🦊", desc: "Browser Extension" },
                { name: "WalletConnect", icon: "🔗", desc: "Mobile & Desktop" },
              ].map((w) => (
                <button
                  key={w.name}
                  onClick={() => {
                    setWalletConnected(true)
                    setShowWalletModal(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1c2128] hover:bg-[#21262d] border border-[#30363d] transition-colors"
                >
                  <span className="text-xl">{w.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">
                      {w.name}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">{w.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
  )
}
