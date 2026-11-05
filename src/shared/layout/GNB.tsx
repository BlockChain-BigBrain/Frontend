import { useEffect, useState } from "react"
import { auth } from "../../api"
import { AuthError, type User } from "../../auth"
import type { Screen } from "../types/domain"
import HowItWorksModal from "../components/PolicyHowItWorksModal"
import WalletModal from "../../features/wallet-auth/WalletModal"
import LoginModal from "../../features/auth/LoginModal"
import { api } from "../../api/service"

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
  const [user, setUser] = useState<User | null>(null)
  const [walletAddress, setWalletAddress] = useState("")
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState("")
  const [showLoginModal, setShowLoginModal] = useState(false)
  useEffect(() => {
    let active = true
    auth.me().then(async value => {
      if (!active) return
      setUser(value)
      try {
        const bound = await api("/api/users/me/wallet")
        if (!active) return
        const address = typeof bound?.walletAddress === "string" ? bound.walletAddress : ""
        setWalletAddress(address)
        const provider = (window as Window & { ethereum?: { request(args: { method: string }): Promise<unknown> } }).ethereum
        const accounts = address && provider ? await provider.request({ method: "eth_accounts" }) : []
        if (active) setWalletConnected(Array.isArray(accounts) && accounts.some(
          (account) => typeof account === "string" && account.toLowerCase() === address.toLowerCase(),
        ))
      } catch {
        if (active) { setWalletAddress(""); setWalletConnected(false) }
      }
    }).catch(error => {
      if (active && !(error instanceof AuthError)) setAuthError(error.message)
    }).finally(() => { if (active) setAuthLoading(false) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    type EventWallet = {
      on?: (event: string, listener: (value: unknown) => void) => void
      removeListener?: (event: string, listener: (value: unknown) => void) => void
    }
    const provider = (window as Window & { ethereum?: EventWallet }).ethereum
    if (!provider?.on) return
    const onAccountsChanged = (value: unknown) => {
      const accounts = Array.isArray(value) ? value : []
      setWalletConnected(!!walletAddress && accounts.some(
        (account) => typeof account === "string" && account.toLowerCase() === walletAddress.toLowerCase(),
      ))
    }
    provider.on("accountsChanged", onAccountsChanged)
    return () => provider.removeListener?.("accountsChanged", onAccountsChanged)
  }, [walletAddress, setWalletConnected])
  async function passwordLogin(email: string, password: string) {
    setAuthError("")
    await auth.passwordAuth(email, password)
    try {
      const currentUser = await auth.me()
      setUser(currentUser)
      try {
        const bound = await api("/api/users/me/wallet")
        const address = typeof bound?.walletAddress === "string" ? bound.walletAddress : ""
        setWalletAddress(address)
        const provider = (window as Window & { ethereum?: { request(args: { method: string }): Promise<unknown> } }).ethereum
        const accounts = address && provider ? await provider.request({ method: "eth_accounts" }) : []
        setWalletConnected(Array.isArray(accounts) && accounts.some(
          (account) => typeof account === "string" && account.toLowerCase() === address.toLowerCase(),
        ))
      } catch { setWalletAddress(""); setWalletConnected(false) }
    } catch (error) {
      setUser(null)
      throw error
    }
  }
  async function logout() {
    setAuthLoading(true)
    setAuthError("")
    try { await auth.logout(); setUser(null); setWalletConnected(false); setWalletAddress("") }
    catch (error) {
      setAuthError(error instanceof Error ? error.message : "로그아웃에 실패했습니다.")
    } finally { setAuthLoading(false) }
  }
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
        {user ? (
  <>
    <span className="text-xs text-white">
      {user.nickname}
    </span>

    <button
      disabled={authLoading}
      onClick={() => void logout()}
      className="px-3 py-1.5 text-xs text-[#9CA3AF]"
    >
      로그아웃
    </button>
  </>
) : (
  <button
    type="button"
    onClick={() => setShowLoginModal(true)}
    className="rounded-md border border-[#30363d] bg-[#161b22] px-4 py-1.5 text-sm font-medium text-[#e6edf3] transition-colors hover:border-blue-500 hover:text-white"
  >
    로그인
  </button>
)}
          {walletConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#161b22] border border-[#30363d]">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-mono text-[#e6edf3]">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "연결됨"}
              </span>
            </div>
          ) : walletAddress ? (
            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              title={`백엔드에 연결된 주소 ${walletAddress}; 현재 MetaMask 계정과 일치하지 않거나 지갑이 연결되지 않았습니다.`}
              className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-300"
            >
              소유 확인됨 · MetaMask 연결 필요
            </button>
          ) : (
            <button
              onClick={() => { if (!user) setShowLoginModal(true); else setShowWalletModal(true) }}
              className="px-4 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
            >
              지갑 연결
            </button>
          )}
        </div>
      </header>
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSubmit={passwordLogin}
        />
      )}

      {authError && <p role="alert" className="fixed top-14 right-6 z-50 rounded-lg bg-[#161b22] p-3 text-xs text-red-400">{authError}</p>}
      {showHowItWorks && (
        <HowItWorksModal onClose={() => setShowHowItWorks(false)} />
      )}

      {showWalletModal && (
        <WalletModal
          setWalletConnected={setWalletConnected}
          setShowWalletModal={setShowWalletModal}
          onConnected={setWalletAddress}
        />
      )}
    </>
  )
}
