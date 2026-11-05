import { useState } from "react"
import GNB from "../shared/layout/GNB"
import MarketplaceScreen from "../features/marketplace/MarketplacePage"
import UploadScreen from "../features/upload/UploadPage"
import DetailScreen from "../features/track-detail/TrackDetailPage"
import DashboardScreen from "../features/dashboard/DashboardPage"
import CheckoutScreen from "../features/checkout/CheckoutPage"
import CertificateScreen from "../features/certificate/CertificatePage"
import type { ChainResult, Screen } from "../shared/types/domain"

// Never initialize a real user session with a successful mock transaction.
const EMPTY_RESULT: ChainResult = {
  aiStatus: "NOT_ANALYZED",
  eip712Status: "NOT_REQUESTED",
  registrationTxPhase: "PRE_SUBMISSION",
  registrationStatus: "NOT_SENT",
  purchaseTxPhase: "PRE_SUBMISSION",
  purchaseStatus: "NOT_SENT",
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("marketplace")
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null)
  const [walletConnected, setWalletConnected] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  return (
    <div className="min-h-screen bg-[#0d1117]">
      <GNB screen={screen} setScreen={setScreen} walletConnected={walletConnected}
        setWalletConnected={setWalletConnected} showWalletModal={showWalletModal}
        setShowWalletModal={setShowWalletModal} showHowItWorks={showHowItWorks}
        setShowHowItWorks={setShowHowItWorks} />
      {screen === "marketplace" && <MarketplaceScreen setScreen={setScreen} onSelectTrack={setSelectedTrackId} />}
      {screen === "upload" && <UploadScreen />}
      {screen === "detail" && <DetailScreen setScreen={setScreen} trackId={selectedTrackId} />}
      {screen === "dashboard" && <DashboardScreen chainResult={EMPTY_RESULT} onRecheckResult={() => {}} />}
      {screen === "checkout" && <CheckoutScreen setScreen={setScreen} chainResult={EMPTY_RESULT} onRecheckResult={() => {}} />}
      {screen === "certificate" && <CertificateScreen setScreen={setScreen} />}
    </div>
  )
}
