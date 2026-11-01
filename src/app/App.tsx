import { useState } from "react"
import GNB from "../shared/layout/GNB"
import MarketplaceScreen from "../features/marketplace/MarketplacePage"
import UploadScreen from "../features/upload/UploadPage"
import DetailScreen from "../features/track-detail/TrackDetailPage"
import DashboardScreen from "../features/dashboard/DashboardPage"
import CheckoutScreen from "../features/checkout/CheckoutPage"
import CertificateScreen from "../features/certificate/CertificatePage"
import {
  resolveConfirmingPurchase,
  SCENARIOS,
  type ScenarioId,
} from "../features/chain-result/scenarios"
import type { ChainResult, Screen } from "../shared/types/domain"

// ─── App Root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("marketplace")
  const [walletConnected, setWalletConnected] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [scenario, setScenario] = useState<ScenarioId>("success-pass")
  const [chainResult, setChainResult] = useState<ChainResult>(
    SCENARIOS["success-pass"].result,
  )
  const [scenarioPanelOpen, setScenarioPanelOpen] = useState(true)

  const selectScenario = (id: ScenarioId) => {
    setScenario(id)
    setChainResult(SCENARIOS[id].result)
  }

  const recheckPurchaseResult = () => {
    setChainResult((current) => resolveConfirmingPurchase(current))
  }
  const scenarioLabel =
    scenario === "confirming" && chainResult.purchaseStatus === "SUCCESS"
      ? "구매 확인 완료 (재확인)"
      : SCENARIOS[scenario].label

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <GNB
        screen={screen}
        setScreen={setScreen}
        walletConnected={walletConnected}
        setWalletConnected={setWalletConnected}
        showWalletModal={showWalletModal}
        setShowWalletModal={setShowWalletModal}
        showHowItWorks={showHowItWorks}
        setShowHowItWorks={setShowHowItWorks}
      />
      {screen === "marketplace" && <MarketplaceScreen setScreen={setScreen} />}
      {screen === "upload" && <UploadScreen chainResult={chainResult} />}
      {screen === "detail" && (
        <DetailScreen setScreen={setScreen} chainResult={chainResult} />
      )}
      {screen === "dashboard" && (
        <DashboardScreen
          chainResult={chainResult}
          onRecheckResult={recheckPurchaseResult}
        />
      )}
      {screen === "checkout" && (
        <CheckoutScreen
          setScreen={setScreen}
          chainResult={chainResult}
          onRecheckResult={recheckPurchaseResult}
        />
      )}
      {screen === "certificate" && (
        <CertificateScreen
          setScreen={setScreen}
          chainResult={chainResult}
        />
      )}
      <div className="fixed bottom-5 right-5 z-[120] w-[360px] overflow-hidden rounded-xl border border-blue-500/30 bg-[#161b22]/95 shadow-2xl backdrop-blur">
        <button
          type="button"
          onClick={() => setScenarioPanelOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          aria-expanded={scenarioPanelOpen}
        >
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              Demo · Chain scenarios
            </span>
            <span className="mt-0.5 block text-[10px] text-[#9CA3AF]">
              현재: {scenarioLabel}
            </span>
          </span>
          <span className="text-xs text-[#9CA3AF]">
            {scenarioPanelOpen ? "접기 −" : "열기 +"}
          </span>
        </button>
        {scenarioPanelOpen && (
          <div className="border-t border-[#30363d] p-3">
            <div className="grid max-h-[300px] grid-cols-2 gap-1.5 overflow-y-auto pr-1">
              {(Object.entries(SCENARIOS) as [
                ScenarioId,
                (typeof SCENARIOS)[ScenarioId],
              ][]).map(([id, item], index) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => selectScenario(id)}
                  className={`rounded-lg border px-2.5 py-2 text-left text-[10px] leading-tight transition-colors ${
                    scenario === id
                      ? "border-blue-500 bg-blue-500/15 text-white"
                      : "border-[#30363d] bg-[#0d1117] text-[#9CA3AF] hover:border-[#484f58] hover:text-white"
                  }`}
                >
                  <span className="mr-1 font-mono text-blue-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[9px] text-[#6B7280]">
              선택한 mock 결과가 공통 온체인 패널에 즉시 반영됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
