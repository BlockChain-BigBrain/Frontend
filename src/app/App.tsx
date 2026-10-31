import { useState } from "react"
import GNB from "../shared/layout/GNB"
import MarketplaceScreen from "../features/marketplace/MarketplacePage"
import UploadScreen from "../features/upload/UploadPage"
import DetailScreen from "../features/track-detail/TrackDetailPage"
import DashboardScreen from "../features/dashboard/DashboardPage"
import CheckoutScreen from "../features/checkout/CheckoutPage"
import CertificateScreen from "../features/certificate/CertificatePage"
import { SCENARIOS, type ScenarioId } from "../features/chain-result/scenarios"
import type { Screen } from "../shared/types/domain"

// ─── App Root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("marketplace")
  const [walletConnected, setWalletConnected] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [scenario, setScenario] = useState<ScenarioId>("success-pass")
  const chainResult = SCENARIOS[scenario].result

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
      {screen === "dashboard" && <DashboardScreen chainResult={chainResult} />}
      {screen === "checkout" && (
        <CheckoutScreen setScreen={setScreen} chainResult={chainResult} />
      )}
      {screen === "certificate" && (
        <CertificateScreen
          setScreen={setScreen}
          chainResult={chainResult}
        />
      )}
      {import.meta.env.DEV && (
        <div className="fixed bottom-5 right-5 z-[120] w-[290px] rounded-xl border border-blue-500/30 bg-[#161b22]/95 p-3 shadow-2xl backdrop-blur">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-blue-400">
            Dev · Chain scenario
          </label>
          <select
            value={scenario}
            onChange={(event) => setScenario(event.target.value as ScenarioId)}
            className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
          >
            {(Object.entries(
              SCENARIOS,
            ) as [ScenarioId, (typeof SCENARIOS)[ScenarioId]][]).map(
              ([id, item]) => (
                <option key={id} value={id}>
                  {item.label}
                </option>
              ),
            )}
          </select>
          <p className="mt-1.5 text-[9px] text-[#6B7280]">
            선택한 mock 결과가 4개 공통 패널에 즉시 반영됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
