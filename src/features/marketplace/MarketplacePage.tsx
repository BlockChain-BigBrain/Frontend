import { useState } from "react"
import { THRESHOLD } from "../../shared/config/constants"
import { NETWORK } from "../../shared/config/network"
import type { Screen } from "../../shared/types/domain"
import TrackCard from "./TrackCard"
import { tracks } from "./mockTracks"

// ─── Marketplace ────────────────────────────────────────────────────────────────
export default function MarketplaceScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const genres = [
    "All",
    "Electronic",
    "Ambient",
    "Lo-Fi",
    "Cinematic",
    "Techno",
    "Dark Ambient",
  ]
  const filtered = tracks.filter(
    (t) =>
      (filter === "All" || t.genre === filter) &&
      (search === "" || t.title.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="pt-14 min-h-screen">
      <div className="px-6 py-12 border-b border-[#21262d]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#30363d] bg-[#161b22] text-xs text-[#9CA3AF] font-mono mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            {NETWORK.name} · 1,247 트랙 온체인 등록
            <span className="text-[9px] text-blue-400 border border-blue-500/30 rounded px-1">
              예시 데이터
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            AI 음원의 상업적 이용권을 거래하는
            <br />
            <span className="text-blue-400">Web3 마켓</span>
          </h1>
          <p className="text-[#9CA3AF] text-sm mb-2 max-w-2xl mx-auto">
            유사도 리스크 확인, 온체인 기록, 합의 비율 정산으로 구매자에게는
            라이선스 영수증을, 창작자에게는 투명한 수익 정산을 제공합니다.
          </p>
          <p className="text-[#6B7280] text-[10px] mb-7 max-w-2xl mx-auto">
            유사도는 음향적 비교이며 법적 표절 판단이 아닙니다. 플랫폼에 등록된
            곡과만 비교합니다.
          </p>
          <div className="relative max-w-lg mx-auto">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="6.5"
                cy="6.5"
                r="4.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10 10L13.5 13.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="트랙 제목, AI 모델, 장르 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#161b22] border border-[#30363d] text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>
      <div className="border-b border-[#21262d] bg-[#0d1117]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6 text-xs font-mono text-[#9CA3AF]">
          {[
            ["Total Volume", `842,400 ${NETWORK.currencySymbol}`],
            ["트랙 등록", "1,247"],
            ["활성 크리에이터", "386명"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span>{k}</span>
              <span className="text-white font-semibold">{v}</span>
              <span className="text-[9px] text-blue-400">예시 데이터</span>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            ["01", "유사도 검증", "Fingerprint + LAION-CLAP"],
            ["02", "온체인 기록", `${NETWORK.name} · ERC-1155`],
            ["03", "라이선스 영수증", "EIP-712 · 자동 정산"],
          ].map(([n, title, desc]) => (
            <div
              key={n}
              className="flex items-center gap-3 rounded-lg border border-[#21262d] bg-[#161b22] px-4 py-3"
            >
              <span className="text-xs font-mono text-blue-400">{n}</span>
              <div>
                <div className="text-xs font-semibold text-white">{title}</div>
                <div className="text-[10px] text-[#9CA3AF] font-mono">
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-6">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === g
                  ? "bg-blue-500 text-white"
                  : "bg-[#161b22] text-[#9CA3AF] hover:text-white border border-[#21262d] hover:border-[#30363d]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 mb-3 rounded-lg border border-[#21262d] bg-[#161b22] px-3 py-2 text-[10px] text-[#9CA3AF]">
          <span>
            <b className="text-emerald-400">PASS</b> 정산 정상
          </span>
          <span>
            <b className="text-amber-400">WARN</b> 구매자 확인 필요
          </span>
          <span>
            <b className="text-orange-400">HOLD</b> 정산 보류(에스크로)
          </span>
          <span className="ml-auto font-mono">
            기준 {THRESHOLD.warn.toFixed(2)} / {THRESHOLD.hold.toFixed(2)} ·
            예시 데이터
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onClick={() => setScreen("detail")}
              onBuy={() => setScreen("checkout")}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
