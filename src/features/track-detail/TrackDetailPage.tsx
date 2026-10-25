import { useState } from "react"
import ChainResultPanel from "../chain-result/ChainResultPanel"
import Badge from "../../shared/components/Badge"
import PieChart from "../../shared/components/PieChart"
import Waveform from "../../shared/components/Waveform"
import { THRESHOLD } from "../../shared/config/constants"
import { NETWORK } from "../../shared/config/network"
import type { ChainResult, LicenseType, Screen } from "../../shared/types/domain"

// ─── Infringement Modal ─────────────────────────────────────────────────────────
function InfringementModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#161b22] border border-red-500/30 rounded-2xl w-[480px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 2L12.5 11.5H1.5L7 2Z"
                  stroke="#ef4444"
                  strokeWidth="1.4"
                />
                <path
                  d="M7 6v2.5M7 10.5v.5"
                  stroke="#ef4444"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white">
              저작권 침해 신고
            </h3>
          </div>
          <button
            onClick={onClose}
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
        <div className="space-y-3 mb-5">
          {[
            {
              step: "01",
              title: "신고 접수 즉시 에스크로 동결",
              desc: "해당 음원의 판매 수익이 즉시 에스크로 보류 상태로 전환됩니다. 신규 판매도 일시 중단됩니다.",
              color: "#f59e0b",
            },
            {
              step: "02",
              title: "14일 심사 기간",
              desc: "운영자 및 AI 검증 시스템이 신고 내용을 심사합니다. 양측에 소명 기회가 주어집니다.",
              color: "#2f80ed",
            },
            {
              step: "03",
              title: "판정 결과 집행",
              desc: "침해 인정 시 에스크로 환불 + 음원 삭제. 무혐의 시 에스크로 해제 + 크리에이터 정산 재개.",
              color: "#10b981",
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-mono font-bold border mt-0.5"
                style={{
                  borderColor: `${s.color}40`,
                  color: s.color,
                  background: `${s.color}10`,
                }}
              >
                {s.step}
              </div>
              <div>
                <div className="text-xs font-semibold text-white mb-0.5">
                  {s.title}
                </div>
                <div className="text-xs text-[#9CA3AF]">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-5">
          <div className="text-xs text-amber-400 font-medium mb-0.5">
            허위 신고 패널티
          </div>
          <div className="text-xs text-[#9CA3AF]">
            허위 또는 악의적 신고로 판정될 경우 신고자 계정 30일 정지 및
            에스크로 몰수될 수 있습니다.
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#1c2128] border border-[#30363d] text-sm text-[#9CA3AF] hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-sm text-red-400 font-semibold transition-colors"
          >
            신고 접수
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Screen ──────────────────────────────────────────────────────────────
export default function DetailScreen({
  setScreen,
  chainResult,
}: {
  setScreen: (s: Screen) => void
  chainResult: ChainResult
}) {
  const [license, setLicense] = useState<LicenseType>("standard")
  const [playing, setPlaying] = useState(false)
  const [showInfringement, setShowInfringement] = useState(false)
  const prices = {
    standard: { pol: `50 ${NETWORK.currencySymbol}`, usd: "$43.50" },
    exclusive: { pol: `350 ${NETWORK.currencySymbol}`, usd: "$304.50" },
  }

  return (
    <div className="pt-14 min-h-screen">
      {showInfringement && (
        <InfringementModal onClose={() => setShowInfringement(false)} />
      )}
      <div className="border-b border-[#21262d] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-[#9CA3AF]">
          <button
            onClick={() => setScreen("marketplace")}
            className="hover:text-white transition-colors"
          >
            Explore
          </button>
          <span>/</span>
          <span className="text-white">Neon Cascade</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-7">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
              <div className="h-44 bg-gradient-to-br from-[#1a1f2e] via-[#161b22] to-[#0d1117] relative flex items-end p-5">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background:
                      "radial-gradient(ellipse at 20% 40%, #2f80ed22 0%, transparent 60%)",
                  }}
                />
                <div className="relative z-10 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => setPlaying(!playing)}
                      className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      {playing ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="white"
                        >
                          <rect x="1" y="1" width="5" height="12" rx="1.5" />
                          <rect x="8" y="1" width="5" height="12" rx="1.5" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="white"
                        >
                          <path d="M3 2L12 7L3 12V2Z" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1">
                      <Waveform
                        seed={1}
                        playing={playing}
                        color={playing ? "#2f80ed" : "#484f58"}
                      />
                    </div>
                    <span className="text-xs font-mono text-[#9CA3AF]">
                      3:42
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-xl font-bold text-white mb-1">
                      Neon Cascade
                    </h1>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#9CA3AF] font-mono">
                        by 0x8f3a...d7e1
                      </span>
                      <span className="text-[#484f58]">·</span>
                      <span className="text-xs text-[#9CA3AF]">Suno v4.5</span>
                      <span className="text-[#484f58]">·</span>
                      <span className="text-xs text-[#9CA3AF]">
                        👥 2 contributors
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        chainResult.riskVerdict === "PASS"
                          ? "verified"
                          : chainResult.riskVerdict === "WARN"
                            ? "warning"
                            : chainResult.riskVerdict === "HOLD"
                              ? "warning"
                            : chainResult.riskVerdict === "CHECKING"
                              ? "primary"
                              : "danger"
                      }
                    >
                      {chainResult.riskVerdict === "CHECKING"
                        ? "검증 중"
                        : chainResult.riskVerdict === "ERROR"
                          ? "검증 오류"
                          : `${chainResult.riskVerdict}${
                              chainResult.similarityScore !== undefined
                                ? ` · 유사도 ${chainResult.similarityScore.toFixed(2)}`
                                : ""
                            }`}
                    </Badge>
                    <Badge variant="muted">Electronic</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#9CA3AF] font-mono">
                  <span>▶ 2,412 plays</span>
                  <span>📋 18 licenses sold</span>
                  <span>🕐 2025-11-03</span>
                </div>
              </div>
            </div>

            <ChainResultPanel
              result={chainResult}
              onRetry={() => undefined}
              onAppeal={() => setShowInfringement(true)}
            />

            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-5">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 1L13 4V10L7 13L1 10V4L7 1Z"
                    stroke="#2f80ed"
                    strokeWidth="1.5"
                  />
                </svg>
                Provenance — 창작 이력 (온체인)
              </h2>
              <div>
                <div className="text-xs font-medium text-[#9CA3AF] mb-1.5">
                  Original Prompt
                </div>
                <div className="bg-[#1c2128] rounded-lg p-3 text-xs text-[#e6edf3] font-mono leading-relaxed border border-[#30363d]">
                  "Pulsing neon synth with driving 4/4 beat, hypnotic arpeggios,
                  and late-night Tokyo cityscape vibes for a commercial trailer"
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["IPFS CID", "QmXz9f4aKp8...mN3d"],
                  ["Smart Contract", "0x4aC7...f3E2"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-xs font-medium text-[#9CA3AF] mb-1.5">
                      {label}
                    </div>
                    <a
                      href="#"
                      className="flex items-center gap-1.5 text-xs text-blue-400 font-mono hover:text-blue-300 bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-2 transition-colors"
                    >
                      <span className="truncate">{val}</span>
                      <svg
                        className="flex-shrink-0"
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 8L8 2M8 2H4M8 2V6"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-medium text-[#9CA3AF] mb-3">
                  Revenue Split (스마트 컨트랙트 자동 정산)
                </div>
                <PieChart
                  slices={[
                    { label: "프롬프트 엔지니어", value: 70, color: "#2f80ed" },
                    { label: "보이스 제공자", value: 20, color: "#7c3aed" },
                    { label: "플랫폼 수수료", value: 10, color: "#30363d" },
                  ]}
                />
              </div>
              <div className="space-y-3">
                <div className="text-xs font-medium text-[#9CA3AF]">
                  AI 검증 근거
                </div>
                <div className="rounded-lg border border-[#30363d] bg-[#1c2128] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">
                      Layer 1 · 동일 파일 검사 (Audio Fingerprint)
                    </span>
                    <Badge variant="verified">일치 없음</Badge>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF]">
                    같은 파일 재등록은 자동 차단됩니다. 원작자 본인·허락받은
                    사용자는 예외 등록할 수 있습니다.
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">
                      Layer 2 · 유사도 검사 (CLAP)
                    </span>
                    <span className="text-lg font-black font-mono text-emerald-400">
                      0.31
                    </span>
                  </div>
                  <div className="relative flex h-2 overflow-hidden rounded-full mb-1">
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${THRESHOLD.warn * 100}%` }}
                    ></div>
                    <div
                      className="bg-amber-500"
                      style={{
                        width: `${(THRESHOLD.hold - THRESHOLD.warn) * 100}%`,
                      }}
                    ></div>
                    <div
                      className="bg-red-500"
                      style={{ width: `${(1 - THRESHOLD.hold) * 100}%` }}
                    ></div>
                    <div className="absolute top-1/2 left-[31%] w-2.5 h-2.5 rounded-full bg-white border-2 border-[#0d1117] -translate-y-1/2"></div>
                  </div>
                  <div className="flex justify-between text-[9px] text-[#9CA3AF] font-mono">
                    <span>PASS</span>
                    <span>{THRESHOLD.warn.toFixed(2)}</span>
                    <span>{THRESHOLD.hold.toFixed(2)}</span>
                    <span>HOLD</span>
                  </div>
                  <div className="mt-3 text-[10px] text-[#9CA3AF]">
                    가장 비슷한 곡 TOP 3 · Void Echoes 0.31 (01:12–01:24) · Neon
                    Grid 0.18 · Synthetic Pulse 0.12
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#30363d] px-3 py-2">
                  <span className="text-xs text-[#9CA3AF]">
                    기여자 · 정산 비율
                  </span>
                  <span className="text-xs text-white">
                    프롬프트 70% · 보이스 20% · 플랫폼 10%
                  </span>
                  <Badge variant="verified">합의 서명 완료</Badge>
                </div>
                <p className="text-[10px] leading-relaxed text-[#6B7280]">
                  음향 유사도 결과이며 법적 표절 판단이 아닙니다. 플랫폼에
                  등록된 곡과만 비교합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">
                라이선스 구매
              </h3>
              <div className="space-y-2 mb-4">
                {(["standard", "exclusive"] as LicenseType[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLicense(l)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                      license === l
                        ? "border-blue-500 bg-blue-500/5"
                        : "border-[#30363d] hover:border-[#484f58]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">
                        {l === "standard" ? "Standard BGM" : "Exclusive"}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
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
                    <div className="text-[10px] text-[#9CA3AF] space-y-0.5">
                      {l === "standard" ? (
                        <>
                          <div>✓ 상업적·비상업적 BGM 사용</div>
                          <div>✓ 스트리밍·유튜브 업로드</div>
                          <div className="text-red-400/70">
                            ✗ 재판매·재라이선스 금지
                          </div>
                          <div className="text-red-400/70">
                            ✗ AI 학습 데이터 사용 금지
                          </div>
                        </>
                      ) : (
                        <>
                          <div>✓ 독점 사용권 (타인 판매 중단)</div>
                          <div>✓ 재판매·서브라이선스 가능</div>
                          <div>✓ 원본 파일 제공</div>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-[#1c2128] rounded-lg p-3 mb-4 space-y-1.5 border border-[#30363d]">
                <div className="text-[10px] text-[#9CA3AF] font-medium">
                  라이선스 약관 온체인 기록
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#9CA3AF] font-mono">
                    IPFS:
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono truncate">
                    QmLf3x7T2...w9Kp
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#9CA3AF] font-mono">
                    Hash:
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">
                    0x92e1...a4b3
                  </span>
                  <a
                    href="#"
                    className="text-[10px] text-[#9CA3AF] hover:text-blue-400 transition-colors ml-auto whitespace-nowrap"
                  >
                    Polygonscan ↗
                  </a>
                </div>
              </div>
              <div className="border-t border-[#21262d] pt-4 mb-4">
                <div className="text-2xl font-bold text-white mb-0.5">
                  {prices[license].pol}
                </div>
                <div className="text-sm text-[#9CA3AF] font-mono">
                  ≈ {prices[license].usd}
                </div>
              </div>
              {chainResult.riskVerdict === "PASS" ||
              chainResult.riskVerdict === "WARN" ? (
                <button
                  onClick={() => setScreen("checkout")}
                  className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
                >
                  라이선스 구매하기
                </button>
              ) : chainResult.riskVerdict === "HOLD" || chainResult.isHold ? (
                <div className="space-y-2">
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] leading-relaxed text-amber-300">
                    정산 보류 중, 구매 대금은 에스크로에 보관됩니다.
                  </div>
                  <button
                    onClick={() => setScreen("checkout")}
                    className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600"
                  >
                    라이선스 구매
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="rounded-xl border border-orange-500/30 bg-orange-500/10 py-2.5 text-xs font-medium text-orange-400">
                      근거 보기
                    </button>
                    <button
                      onClick={() => setShowInfringement(true)}
                      className="rounded-xl border border-[#30363d] bg-[#1c2128] py-2.5 text-xs font-medium text-[#9CA3AF] hover:text-white"
                    >
                      이의 제기
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-[#30363d] bg-[#1c2128] py-3 text-sm font-semibold text-[#6B7280]"
                >
                  {chainResult.riskVerdict === "CHECKING"
                    ? "검증 완료 후 구매 가능"
                    : "검증 오류 · 구매 불가"}
                </button>
              )}
              <p className="text-xs text-[#9CA3AF] text-center mt-3">
                합의 비율 자동 정산 · 라이선스 영수증 발급
              </p>
              <button
                onClick={() => setShowInfringement(true)}
                className="mt-3 w-full py-2 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-xs text-red-400 font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 1.5L10.5 9.5H1.5L6 1.5Z"
                    stroke="#ef4444"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M6 5v1.5M6 8.5v.5"
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                저작권 침해 의심 신고 (에스크로 보류)
              </button>
            </div>

            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 space-y-2.5">
              <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                트랜잭션 정보
              </h4>
              {[
                ["Minted", "2025-11-03"],
                ["Network", NETWORK.name],
                ["Standard", "ERC-1155"],
                ["재판매 로열티", "10%"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-xs text-[#9CA3AF]">{k}</span>
                  <span className="text-xs font-mono text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
