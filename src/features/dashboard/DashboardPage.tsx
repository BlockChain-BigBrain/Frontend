import { Fragment, useEffect, useState } from "react"
import ChainResultPanel from "../chain-result/ChainResultPanel"
import Badge from "../../shared/components/Badge"
import PieChart from "../../shared/components/PieChart"
import { NETWORK } from "../../shared/config/network"
import type { ChainResult } from "../../shared/types/domain"
import { initialTxns, myTracks } from "./mockDashboard"

export default function DashboardScreen({ chainResult }: { chainResult: ChainResult }) {
  const [totalEarned, setTotalEarned] = useState(594)
  const [txns, setTxns] = useState(initialTxns)
  const [animated, setAnimated] = useState(false)
  const [justBought, setJustBought] = useState(false)
  const [trackTab, setTrackTab] =
    useState<"all" | "pass" | "checking" | "hold">("all")
  const [showAppeal, setShowAppeal] = useState(false)
  const [expandedTxn, setExpandedTxn] = useState<number | null>(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setTotalEarned((prev) => prev + 35)
      setTxns((prev) => [
        {
          date: "2026-01-13",
          track: "Neon Cascade",
          buyer: "0x2b9e...f1a4",
          license: "Standard",
          role: "creator",
          split: "70%",
          earned: `35 ${NETWORK.currencySymbol}`,
          status: "settled",
        },
        ...prev,
      ])
      setAnimated(true)
      setJustBought(true)
      setTimeout(() => setAnimated(false), 600)
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  const stats = [
    {
      label: "총 누적 수익",
      value: `${totalEarned} ${NETWORK.currencySymbol}`,
      sub: `≈ $${(totalEarned * 0.87).toFixed(0)} USD`,
      delta: `+35 ${NETWORK.currencySymbol}`,
      up: true,
      animate: animated,
    },
    {
      label: "이번 달 거래",
      value: "14건",
      sub: "전월 대비 +3건",
      delta: "+27%",
      up: true,
      animate: false,
    },
    {
      label: "등록된 음원",
      value: "7개",
      sub: "Active 5 · Pending 1 · Rejected 1",
      delta: "",
      up: false,
      animate: false,
    },
    {
      label: "평균 유사도",
      value: "0.11",
      sub: "최근 30일 기준",
      delta: "안전 구간",
      up: false,
      animate: false,
    },
  ]

  const filteredTracks =
    trackTab === "all"
      ? myTracks
      : myTracks.filter((t) => t.status === trackTab)

  return (
    <div className="pt-14 min-h-screen">
      {showAppeal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowAppeal(false)}
        >
          <div
            className="w-[480px] rounded-2xl border border-orange-500/30 bg-[#161b22] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">HOLD 이의 제기</h3>
              <button
                onClick={() => setShowAppeal(false)}
                className="text-[#9CA3AF]"
              >
                닫기
              </button>
            </div>
            <label className="block text-xs text-[#9CA3AF] mb-4">
              이의 제기 사유
              <textarea
                rows={5}
                placeholder="검토에 필요한 사실과 근거를 입력하세요"
                className="mt-1.5 w-full resize-none rounded-lg border border-[#30363d] bg-[#1c2128] p-3 text-sm text-white placeholder-[#6B7280]"
              />
            </label>
            <div className="rounded-lg border border-dashed border-[#30363d] px-3 py-3 text-xs text-[#9CA3AF] mb-3">
              생성 기록·증빙 파일 업로드
            </div>
            <p className="text-[10px] text-[#6B7280] mb-5">
              보류된 금액은 아직 지급되지 않은 컨트랙트 잔액입니다.
            </p>
            <button
              onClick={() => setShowAppeal(false)}
              className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white"
            >
              증빙 제출
            </button>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              크리에이터 대시보드
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF] font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              실시간 정산 · 스마트 컨트랙트 자동 실행
              {justBought && (
                <span className="text-emerald-400 ml-2">· 새 거래 확인됨</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF] bg-[#161b22] border border-[#21262d] px-3 py-1.5 rounded-lg">
            <span>지갑</span>
            <span className="text-white">0x3a7f...c4d2</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`bg-[#161b22] border rounded-xl p-4 transition-all ${
                s.animate
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-[#21262d]"
              }`}
            >
              <div className="text-xs text-[#9CA3AF] mb-2">{s.label}</div>
              <div className="text-2xl font-bold text-white mb-1 font-mono">
                {s.value}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">{s.sub}</span>
                {s.delta && (
                  <span
                    className={`text-xs font-mono ${
                      s.up ? "text-emerald-400" : "text-[#9CA3AF]"
                    }`}
                  >
                    {s.up ? "↑ " : ""}
                    {s.delta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            ["정산 완료", `${totalEarned} ${NETWORK.currencySymbol}`, "12건"],
            ["에스크로 보류 중", `10 ${NETWORK.currencySymbol}`, "HOLD 1건"],
            ["검토 중인 트랙", "1개", "기한 예시 14일"],
          ].map(([label, value, sub], i) => (
            <div
              key={label}
              className={`rounded-xl border p-4 ${
                i === 1
                  ? "border-orange-500/30 bg-orange-500/5"
                  : "border-[#21262d] bg-[#161b22]"
              }`}
            >
              <div className="text-xs text-[#9CA3AF]">{label}</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {value}
              </div>
              <div className="text-[10px] text-[#6B7280] mt-1">
                {sub} · 예시 데이터
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-orange-500/30 bg-[#161b22] p-5 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  HOLD 처리 현황 · Void Echoes
                </h3>
                <Badge variant="warning">유사도 0.91</Badge>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1">
                정산 10 {NETWORK.currencySymbol}이 에스크로에 보류되어 검토
                중입니다.
              </p>
            </div>
            <button
              onClick={() => setShowAppeal(true)}
              className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-400"
            >
              이의 제기
            </button>
          </div>
          <div className="flex items-center">
            {["검토 접수", "검토 중", "해제 또는 환불"].map((step, i) => (
              <div key={step} className="flex flex-1 items-center">
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${
                    i < 2
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-[#30363d] text-[#6B7280]"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`ml-2 text-xs ${
                    i < 2 ? "text-white" : "text-[#6B7280]"
                  }`}
                >
                  {step}
                </span>
                {i < 2 && (
                  <div className="mx-3 h-px flex-1 bg-orange-500/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-2 bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">월별 수익</h3>
              <Badge variant="muted">최근 6개월</Badge>
            </div>
            <div className="flex items-end gap-2 h-28">
              {[0.12, 0.08, 0.19, 0.24, 0.15, 0.35].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${v * 280}px`,
                      background: i === 5 ? "#2f80ed" : "#21262d",
                    }}
                  ></div>
                  <span className="text-xs font-mono text-[#9CA3AF]">
                    {["8월", "9월", "10월", "11월", "12월", "1월"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">
              라이선스 유형
            </h3>
            <PieChart
              slices={[
                { label: "Standard BGM", value: 68, color: "#2f80ed" },
                { label: "Exclusive", value: 32, color: "#7c3aed" },
              ]}
            />
          </div>
        </div>

        {/* My Tracks with tabs */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
            <h3 className="text-sm font-semibold text-white">내 음원</h3>
            <div className="flex items-center gap-1">
              {(["all", "pass", "checking", "hold"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setTrackTab(tab)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      trackTab === tab
                        ? "bg-[#21262d] text-white"
                        : "text-[#9CA3AF] hover:text-white"
                    }`}
                  >
                    {tab === "all"
                      ? "전체"
                      : tab === "pass"
                        ? "PASS"
                        : tab === "checking"
                          ? "검증 중"
                          : "HOLD"}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="divide-y divide-[#21262d]">
            {filteredTracks.map((t, i) => (
              <div
                key={i}
                className="flex items-center px-5 py-3 hover:bg-[#1c2128] transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {t.title}
                    </span>
                    {t.status === "pass" && (
                      <Badge variant="verified">✓</Badge>
                    )}
                    {t.status === "checking" && (
                      <Badge variant="warning">⏳ 검증 중</Badge>
                    )}
                    {t.status === "hold" && (
                      <Badge variant="warning">정산 대기 중</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#9CA3AF] font-mono">
                    <span>{t.genre}</span>
                    <span>·</span>
                    <span>{t.model}</span>
                    <span>·</span>
                    <span>{t.date}</span>
                  </div>
                </div>
                <div className="text-sm font-mono font-semibold text-emerald-400">
                  {t.earnings}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
            <h3 className="text-sm font-semibold text-white">
              트랜잭션 히스토리
            </h3>
            <span className="text-xs text-[#9CA3AF] font-mono">
              {txns.length}건
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#21262d]">
                {[
                  "날짜",
                  "음원명",
                  "구매자 지갑",
                  "라이선스",
                  "내 역할",
                  "지분",
                  "내 수령액",
                  "상태 / TX",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-medium text-[#9CA3AF] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.map((tx, i) => (
                <Fragment key={`${tx.date}-${tx.buyer}-${i}`}>
                  <tr
                    className={`border-b border-[#21262d] transition-colors ${
                      tx.status === "frozen"
                        ? "bg-amber-500/5"
                        : i === 0 && justBought
                          ? "bg-emerald-500/5"
                          : "hover:bg-[#1c2128]"
                    }`}
                  >
                    <td className="px-5 py-3 text-xs font-mono text-[#9CA3AF]">
                      {tx.date}
                    </td>
                    <td className="px-5 py-3 text-xs text-white font-medium">
                      {tx.track}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-blue-400">
                      {tx.buyer}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          tx.license === "Exclusive" ? "primary" : "muted"
                        }
                      >
                        {tx.license}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-mono ${
                          tx.role === "voice"
                            ? "text-purple-400"
                            : "text-[#9CA3AF]"
                        }`}
                      >
                        {tx.role === "voice" ? "보이스" : "크리에이터"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-[#9CA3AF]">
                      {tx.split}
                    </td>
                    <td className="px-5 py-3">
                      {tx.status === "frozen" ? (
                        <span className="text-xs font-mono font-semibold text-amber-400">
                          ⏸ {tx.earned} 동결
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-semibold text-emerald-400">
                          {i === 0 && justBought ? "↑ " : ""}
                          {tx.earned}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() =>
                          setExpandedTxn(expandedTxn === i ? null : i)
                        }
                        className="text-left"
                      >
                        <div
                          className={`text-[10px] font-medium ${
                            tx.status === "frozen"
                              ? "text-orange-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {tx.status === "frozen"
                            ? "정산 대기 중"
                            : "정산 완료"}
                        </div>
                        <div className="text-[9px] font-mono text-blue-400 mt-0.5">
                          온체인 결과 {expandedTxn === i ? "접기 ↑" : "보기 ↓"}
                        </div>
                      </button>
                    </td>
                  </tr>
                  {expandedTxn === i && (
                    <tr className="border-b border-[#30363d] bg-[#0d1117]">
                      <td colSpan={8} className="px-5 py-4">
                        <ChainResultPanel
                          result={chainResult}
                          compact
                          onAppeal={() => setShowAppeal(true)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
