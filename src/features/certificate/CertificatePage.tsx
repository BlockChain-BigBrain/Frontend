import Badge from "../../shared/components/Badge"
import Waveform from "../../shared/components/Waveform"
import { AI_POLICY } from "../../shared/config/constants"
import { NETWORK } from "../../shared/config/network"
import type { ChainResult, Screen } from "../../shared/types/domain"

// ─── Certificate ────────────────────────────────────────────────────────────────
export default function CertificateScreen({
  setScreen,
  chainResult,
}: {
  setScreen: (s: Screen) => void
  chainResult: ChainResult
}) {
  const steps = [
    { num: "01", title: "Layer 1 정확 중복 확인", desc: "Chromaprint 지문으로 중복 여부를 확인합니다.", detail: "동일 지문은 BLOCK" },
    { num: "02", title: "Layer 2 음악적 관계 분석", desc: "중복이 아닌 음원의 CLAP 후보와 음악적 관계를 분석합니다.", detail: "query-level / pairwise temporal 검증" },
    { num: "03", title: "정책 판정 및 증거 기록", desc: "서버 판정과 모델·정책 버전을 기록합니다.", detail: "임계값과 검증 증거는 실제 AI 응답을 기준으로 확인" },
  ]
  const top3: { title: string; similarity: number; model: string }[] = []

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-[#161b22] border border-emerald-500/30 rounded-2xl p-7 mb-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, #10b981 0%, transparent 60%)",
            }}
          ></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13L9 17L19 7"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              상업적 이용 허가 증명서
            </h2>
            <p className="text-sm text-[#9CA3AF] max-w-md mx-auto">
              구매 트랜잭션과 NFT 발급 상태는 실제 거래 기록을 확인해 주세요.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4 text-xs font-mono text-[#9CA3AF]">
              <span>
                TX:{" "}
                <span className="text-blue-400">
                  {chainResult.purchaseTxHash
                    ? `${chainResult.purchaseTxHash.slice(0, 8)}...${chainResult.purchaseTxHash.slice(-4)}`
                    : "—"}
                </span>
              </span>
              <span>·</span>
              <span>
                NFT Token ID:{" "}
                <span className="text-white">
                  {chainResult.tokenId !== undefined
                    ? `#${chainResult.tokenId}`
                    : "—"}
                </span>
              </span>
              <span>·</span>
              <span>
                Block: <span className="text-white">—</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#161b22] border border-blue-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-semibold text-white">
                라이선스 영수증
              </div>
              <div className="text-[10px] text-[#9CA3AF] font-mono mt-1">
                LICENSE RECEIPT · {NETWORK.name}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  chainResult.aiStatus === "WARN" ? "warning" : "verified"
                }
              >
                {chainResult.aiStatus} ·{" "}
                {chainResult.similarityScore?.toFixed(2) ?? "—"}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {[
              ["트랙명", "Neon Cascade"],
              ["라이선스 유형", "비독점 상업 이용권"],
              ["구매자 지갑", "—"],
              ["판매자 지갑", "—"],
              ["가격", "—"],
              ["발급 시각", "—"],
              [
                "트랜잭션 해시",
                chainResult.purchaseTxHash
                  ? `${chainResult.purchaseTxHash.slice(0, 8)}...${chainResult.purchaseTxHash.slice(-4)}`
                  : "—",
              ],
              ["IPFS", "QmLf3x7...w9Kp"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between border-b border-[#21262d] pb-2"
              >
                <span className="text-xs text-[#9CA3AF]">{k}</span>
                <span className="text-xs text-white font-mono">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-[#30363d] bg-[#1c2128] p-4">
            <div className="text-xs font-semibold text-white mb-2">
              정산 내역 · 합의 비율대로 자동 분배
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-[#9CA3AF]">
              <span>실제 분배 내역은 거래 기록에서 확인</span>
              <span>기여도별 정산 데이터 미제공</span>
              <span></span>
            </div>
          </div>
          <p className="text-[10px] text-[#6B7280] mt-4">
            이 문서는 사적 계약 형태의 상업적 이용 허가 증빙이며 법적 저작권을
            이전하지 않습니다.
          </p>
        </div>

        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#21262d] bg-[#1c2128] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1L13 4V10L7 13L1 10V4L7 1Z"
                  stroke="#7c3aed"
                  strokeWidth="1.4"
                />
                <circle cx="7" cy="7" r="2" fill="#7c3aed" />
              </svg>
              <span className="text-sm font-semibold text-white">
                AI 유사도 리스크 검증 리포트
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9CA3AF] font-mono">
                track-ai-balanced-policy-v5
              </span>
              <Badge variant="verified">{chainResult.aiStatus}</Badge>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-[#21262d]">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] flex items-center justify-center border border-[#30363d] flex-shrink-0">
                <Waveform seed={1} color="#2f80ed" />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold text-white">
                  Neon Cascade
                </div>
                <div className="text-xs text-[#9CA3AF] font-mono">
                  검증 상세 정보는 실제 등록 데이터에서 확인하세요
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#9CA3AF] mb-0.5">검증 시각</div>
                <div className="text-xs font-mono text-white">
                  2026-01-13 · 09:21:44 UTC
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={step.num} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 6.5L5 9L9.5 3.5"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px h-8 bg-[#21262d]"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-emerald-400">
                        Step {step.num}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {step.title}
                      </span>
                    </div>
                    <div className="text-xs text-[#9CA3AF] mb-1">
                      {step.desc}
                    </div>
                    <div className="text-[10px] font-mono text-[#9CA3AF] bg-[#1c2128] px-2 py-1 rounded border border-[#30363d] inline-block">
                      {step.detail}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex-shrink-0">
                    {chainResult.aiStatus}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10.5L8 14.5L16 6.5"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-emerald-400 mb-1">
                    AI 판정: {chainResult.aiStatus}
                  </div>
                  <div className="text-sm text-[#e6edf3] mb-3">
                    유사도{" "}
                    <span className="font-mono font-bold text-emerald-400">
                      {chainResult.similarityScore?.toFixed(2) ?? "—"}
                    </span>{" "}
                    — 최종 판정은 서버 AI 검증 결과를 따릅니다.
                  </div>
                  <div className="mb-3">
                    <div className="text-xs font-medium text-[#9CA3AF] mb-2">
                      최근접 Top-3 음원
                    </div>
                    <div className="space-y-1.5">
                      {top3.map((t, i) => (
                        <div
                          key={t.title}
                          className="flex items-center gap-3 bg-[#1c2128] rounded-lg px-3 py-1.5 border border-[#30363d]"
                        >
                          <span className="text-[10px] font-mono text-[#9CA3AF] w-3">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <span className="text-xs text-white">
                              {t.title}
                            </span>
                            <span className="text-[10px] text-[#9CA3AF] font-mono ml-2">
                              {t.model}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1 rounded-full bg-[#30363d] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${t.similarity * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-mono text-emerald-400 w-8 text-right">
                              {t.similarity.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono">
                    <span className="text-[#9CA3AF]">IPFS CID:</span>
                    <span className="text-blue-400">QmXz9f4aKp8...mN3d</span>
                    <span className="text-[#484f58]">·</span>
                    <span className="text-[#9CA3AF]">온체인 해시:</span>
                    <span className="text-blue-400">0x4aC7...f3E2</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    {chainResult.similarityScore?.toFixed(2) ?? "—"}
                  </div>
                  <div className="text-[10px] text-[#9CA3AF]">
                    Cosine Similarity
                  </div>
                  <div className="mt-1 w-20 h-2 rounded-full bg-[#30363d] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.max(0, Math.min(1, chainResult.similarityScore ?? 0)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attestation */}
            <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                온체인 Attestation (EIP-712)
              </div>
              {[
                ["검증자 서명", "실제 서명 데이터 미제공"],
                ["정책·모델 버전", AI_POLICY.scoreVersion],
                ["검증 해시 온체인", "실제 해시 데이터 미제공"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="text-[10px] text-[#9CA3AF] font-mono w-32 flex-shrink-0">
                    {k}
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled
            title="Hardhat Local에는 공개 탐색기가 없습니다"
            className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-[#21262d] bg-[#161b22] px-4 py-2.5 text-sm font-medium text-[#6B7280]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1v8M4 6l3 3 3-3M2 11h10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            증명서 다운로드(EIP-712)
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] text-sm text-white font-medium transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h10M8 4l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            로컬 네트워크 · 탐색기 없음
          </button>
          <button
            onClick={() => setScreen("marketplace")}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm text-white font-semibold transition-colors"
          >
            마켓플레이스로 →
          </button>
        </div>
      </div>
    </div>
  )
}
