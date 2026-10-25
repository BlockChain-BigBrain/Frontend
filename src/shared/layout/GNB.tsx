import type { Screen } from "../types/domain"
import HowItWorksModal from "../components/HowItWorksModal"
import WalletModal from "../../features/wallet-auth/WalletModal"

// ─── GNB ───────────────────────────────────────────────────────────────────────
export default function GNB({
  screen,
  setScreen,
  walletConnected,
  setWalletConnected,
  showWalletModal,
  setShowWalletModal,
  showHowItWorks,
  setShowHowItWorks,
}: {
  screen: Screen
  setScreen: (s: Screen) => void
  walletConnected: boolean
  setWalletConnected: (v: boolean) => void
  showWalletModal: boolean
  setShowWalletModal: (v: boolean) => void
  showHowItWorks: boolean
  setShowHowItWorks: (v: boolean) => void
}) {
  const navItems: { id: Screen; label: string }[] = [
    { id: "marketplace", label: "Explore" },
    { id: "upload", label: "Upload" },
    { id: "dashboard", label: "Dashboard" },
  ]

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 mr-8">
          <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 10 Q7 2 12 10"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="7" cy="5" r="1.5" fill="white" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            Track-AI
          </span>
        </div>
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                screen === item.id
                  ? "text-white bg-[#21262d]"
                  : "text-[#9CA3AF] hover:text-[#e6edf3]"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setShowHowItWorks(true)}
            className="px-3 py-1.5 rounded text-sm transition-colors text-[#9CA3AF] hover:text-[#e6edf3]"
          >
            How it works
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-white hover:bg-gray-100 text-gray-800 text-xs font-medium transition-colors border border-gray-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            구글로 3초 만에 시작하기
          </button>
          {walletConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#161b22] border border-[#30363d]">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-mono text-[#e6edf3]">
                0x3a7f...c4d2
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowWalletModal(true)}
              className="px-4 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
            >
              지갑 연결
            </button>
          )}
        </div>
      </header>

      {showHowItWorks && (
        <HowItWorksModal onClose={() => setShowHowItWorks(false)} />
      )}

      {showWalletModal && (
        <WalletModal
          setWalletConnected={setWalletConnected}
          setShowWalletModal={setShowWalletModal}
        />
      )}
    </>
  )
}
