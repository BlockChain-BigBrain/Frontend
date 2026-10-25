import { useState } from "react"
import ChainResultPanel from "../chain-result/ChainResultPanel"
import Badge from "../../shared/components/Badge"
import Waveform from "../../shared/components/Waveform"
import { NETWORK } from "../../shared/config/network"
import type { ChainResult, LicenseType, Screen } from "../../shared/types/domain"

type CheckoutStage = "summary" | "signing" | "confirmed"

// ─── Checkout ───────────────────────────────────────────────────────────────────
export default function CheckoutScreen({
  setScreen,
  chainResult,
}: {
  setScreen: (s: Screen) => void
  chainResult: ChainResult
}) {
  const [stage, setStage] = useState<CheckoutStage>("summary")
  const [license, setLicense] = useState<LicenseType>("standard")
  const [paymentMethod, setPaymentMethod] = useState<"google" | "metamask">(
    "google",
  )
  const prices = {
    standard: { pol: `50 ${NETWORK.currencySymbol}`, usd: "$43.50" },
    exclusive: { pol: `350 ${NETWORK.currencySymbol}`, usd: "$304.50" },
  }

  const handleConfirm = () => {
    setStage("signing")
    setTimeout(() => setStage("confirmed"), 2200)
  }

  return (
    <div className="pt-14 min-h-screen flex items-start justify-center">
      {stage === "confirmed" && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-[720px] overflow-y-auto rounded-2xl border border-[#30363d] bg-[#161b22] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {chainResult.mintStatus === "success"
                    ? chainResult.isHold
                      ? "구매 완료 · 정산 대기 중"
                      : "구매 및 민팅 완료"
                    : "구매 처리 결과"}
                </h3>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  라이선스 결제와 온체인 발급 결과입니다.
                </p>
              </div>
              <button
                onClick={() => setStage("summary")}
                className="text-xs text-[#9CA3AF] hover:text-white"
              >
                닫기
              </button>
            </div>
            <ChainResultPanel
              result={chainResult}
              onRetry={() => setStage("summary")}
            />
            {chainResult.mintStatus === "success" && (
              <button
                onClick={() => setScreen("certificate")}
                className="mt-4 w-full rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
              >
                라이선스 영수증 보기 →
              </button>
            )}
          </div>
        </div>
      )}
      <div className="w-full max-w-6xl px-6 py-8 grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-4 font-mono">
              {[
                {
                  n: 1,
                  label: "주문 확인",
                  active: stage === "summary",
                  done: stage !== "summary",
                },
                {
                  n: 2,
                  label: "결제 서명",
                  active: stage === "signing",
                  done: stage === "confirmed",
                },
                {
                  n: 3,
                  label: "완료",
                  active: false,
                  done: stage === "confirmed",
                },
              ].map((s, i) => (
                <span key={s.n} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[#30363d]">──</span>}
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                      s.done
                        ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                        : s.active
                          ? "border-blue-500 text-blue-400"
                          : "border-[#30363d]"
                    }`}
                  >
                    {s.n}
                  </span>
                  <span
                    className={
                      s.done ? "text-emerald-400" : s.active ? "text-white" : ""
                    }
                  >
                    {s.label}
                  </span>
                </span>
              ))}
            </div>
            <h2 className="text-xl font-bold text-white">
              결제 및 스마트 컨트랙트 서명
            </h2>
          </div>

          {chainResult.isHold && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="text-xs font-semibold text-amber-400">
                HOLD · 정산 보류 안내
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">
                이 곡은 유사도 검토 중입니다. 결제 금액은 에스크로에 보관되며,
                검토 결과에 따라 정산됩니다.
              </p>
            </div>
          )}

          {/* Order summary */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#21262d] bg-[#1c2128]">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                주문 내역
              </span>
            </div>
            <div className="p-5 flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] flex items-center justify-center border border-[#30363d] flex-shrink-0">
                <Waveform seed={1} color="#2f80ed" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-0.5">
                  Neon Cascade
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-[#9CA3AF] font-mono">
                    by 0x8f3a...d7e1
                  </span>
                  <span className="text-[#30363d]">·</span>
                  <span className="text-xs text-[#9CA3AF]">Suno v4.5</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      chainResult.riskVerdict === "WARN" ||
                      chainResult.riskVerdict === "HOLD"
                        ? "warning"
                        : "verified"
                    }
                  >
                    {chainResult.riskVerdict} · 유사도{" "}
                    {chainResult.similarityScore?.toFixed(2) ?? "—"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF] mb-2">
                라이선스 유형 선택
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["standard", "exclusive"] as LicenseType[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLicense(l)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      license === l
                        ? "border-blue-500 bg-blue-500/5"
                        : "border-[#30363d] hover:border-[#484f58]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-white">
                        {l === "standard" ? "Standard BGM" : "Exclusive"}
                      </span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          license === l
                            ? "border-blue-500 bg-blue-500"
                            : "border-[#484f58]"
                        }`}
                      >
                        {license === l && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#9CA3AF]">
                      {l === "standard"
                        ? "상업적 BGM 사용 허가"
                        : "독점 사용 + 재판매 가능"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#21262d] bg-[#1c2128]">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                결제 방법
              </span>
            </div>
            <div className="p-4 space-y-2">
              {[
                {
                  id: "google" as const,
                  label: "Google 계정으로 결제",
                  sub: "Web3Auth AA 지갑 · 가스비 Track-AI 대납 · 지갑 없이도 시작 가능",
                  icon: "🔵",
                  rec: true,
                },
                {
                  id: "metamask" as const,
                  label: "MetaMask 직접 결제",
                  sub: `${NETWORK.currencySymbol} 토큰 보유 필요 · ${NETWORK.name}`,
                  icon: "🦊",
                  rec: false,
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-lg border transition-all ${
                    paymentMethod === m.id
                      ? "border-blue-500 bg-blue-500/5"
                      : "border-[#30363d] hover:border-[#484f58]"
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {m.label}
                      </span>
                      {m.rec && (
                        <span className="text-[10px] font-mono text-blue-400 border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          추천
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                      {m.sub}
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === m.id
                        ? "border-blue-500 bg-blue-500"
                        : "border-[#484f58]"
                    }`}
                  >
                    {paymentMethod === m.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Smart contract split */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#21262d] bg-[#1c2128] flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z"
                  stroke="#2f80ed"
                  strokeWidth="1.2"
                />
              </svg>
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Smart Contract 수익 분배
              </span>
              <span className="ml-auto text-[10px] font-mono text-[#9CA3AF]">
                ERC-1155 · {NETWORK.name}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#9CA3AF]">
                결제 즉시 스마트 컨트랙트가 수익을 자동 분배합니다. 중간 유통사
                없이 투명하게 정산됩니다.
              </p>
              <div className="flex h-6 rounded-lg overflow-hidden gap-0.5">
                <div
                  className="flex items-center justify-center text-[10px] font-mono font-bold text-white"
                  style={{ width: "70%", background: "#2f80ed" }}
                >
                  70%
                </div>
                <div
                  className="flex items-center justify-center text-[10px] font-mono font-bold text-white"
                  style={{ width: "20%", background: "#7c3aed" }}
                >
                  20%
                </div>
                <div
                  className="flex items-center justify-center text-[10px] font-mono font-bold text-white"
                  style={{ width: "10%", background: "#484f58" }}
                >
                  10%
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "프롬프트 엔지니어",
                    pct: "70%",
                    amt: `${
                      license === "standard" ? 35 : 245
                    } ${NETWORK.currencySymbol}`,
                    color: "#2f80ed",
                  },
                  {
                    label: "보이스 제공자",
                    pct: "20%",
                    amt: `${
                      license === "standard" ? 10 : 70
                    } ${NETWORK.currencySymbol}`,
                    color: "#7c3aed",
                  },
                  {
                    label: "플랫폼 수수료",
                    pct: "10%",
                    amt: `${
                      license === "standard" ? 5 : 35
                    } ${NETWORK.currencySymbol}`,
                    color: "#484f58",
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-[#1c2128] rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{ background: s.color }}
                      ></div>
                      <span className="text-[10px] text-[#9CA3AF]">
                        {s.label}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white font-mono">
                      {s.pct}
                    </div>
                    <div className="text-[10px] font-mono text-[#9CA3AF]">
                      {s.amt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="col-span-2 space-y-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-4 sticky top-20">
            <h3 className="text-sm font-semibold text-white">결제 요약</h3>
            <div className="space-y-2 pb-4 border-b border-[#21262d]">
              <div className="flex justify-between text-xs text-[#9CA3AF]">
                <span>
                  {license === "standard" ? "Standard BGM" : "Exclusive"}{" "}
                  라이선스
                </span>
                <span className="font-mono text-white">
                  {prices[license].pol}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#9CA3AF]">
                <span>
                  가스비{" "}
                  {paymentMethod === "google" ? "(Track-AI 대납)" : "(예상)"}
                </span>
                <span className="font-mono text-white">
                  {paymentMethod === "google"
                    ? "무료"
                    : `~0.01 ${NETWORK.currencySymbol}`}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-white">총 결제</span>
              <div className="text-right">
                <div className="text-xl font-bold text-white font-mono">
                  {prices[license].pol}
                </div>
                <div className="text-xs text-[#9CA3AF] font-mono">
                  ≈ {prices[license].usd}
                </div>
              </div>
            </div>

            {stage === "summary" && (
              <button
                onClick={handleConfirm}
                className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>{paymentMethod === "google" ? "🔵" : "🦊"}</span>
                {paymentMethod === "google"
                  ? "Google 계정으로 결제"
                  : "MetaMask로 결제"}
              </button>
            )}
            {stage === "signing" && (
              <div className="w-full py-3 rounded-xl border border-orange-500/30 bg-orange-500/5 flex items-center justify-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-orange-400 border-t-transparent animate-spin"
                  style={{ animationDuration: "0.8s" }}
                ></div>
                <span className="text-sm text-orange-400 font-medium">
                  {paymentMethod === "google"
                    ? "결제 처리 중..."
                    : "MetaMask 서명 대기 중..."}
                </span>
              </div>
            )}
            {stage === "confirmed" && (
              <div className="space-y-3">
                <div className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-sm text-emerald-400 font-semibold">
                    결제 및 트랜잭션 완료
                  </span>
                </div>
                <button
                  onClick={() => setScreen("certificate")}
                  className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                >
                  라이선스 영수증 보기 →
                </button>
              </div>
            )}

            <div className="pt-2 space-y-2">
              {[
                ["🔒", "스마트 컨트랙트 자동 정산"],
                ["📄", "ERC-1155 라이선스 NFT 즉시 발급"],
                ["🛡️", "AI 독창성 검증 완료 음원만 거래"],
              ].map(([icon, text]) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-xs text-[#9CA3AF]"
                >
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {stage === "signing" && paymentMethod === "metamask" && (
            <div className="bg-[#161b22] border border-orange-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
                <span>🦊</span> MetaMask — 트랜잭션 확인 요청
              </div>
              <div className="bg-[#1c2128] rounded-lg p-3 space-y-2 border border-[#30363d]">
                {[
                  ["From", "0x3a7f...c4d2"],
                  ["To", "0x4aC7...f3E2 (Contract)"],
                  ["Value", prices[license].pol],
                  ["Network", NETWORK.name],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between text-xs font-mono"
                  >
                    <span className="text-[#9CA3AF]">{k}</span>
                    <span className="text-white">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 py-2 rounded-lg border border-[#30363d] text-xs text-[#9CA3AF] text-center">
                  거절
                </div>
                <div className="flex-1 py-2 rounded-lg bg-blue-500 text-xs text-white text-center font-medium">
                  승인
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
