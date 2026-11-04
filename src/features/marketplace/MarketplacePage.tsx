import { useEffect, useState } from "react"
import { API_BASE } from "../../api/service"
import { NETWORK } from "../../shared/config/network"
import type { Screen } from "../../shared/types/domain"
import TrackCard from "./TrackCard"
import type { PublicTrack } from "./tracks"

// ─── Marketplace ────────────────────────────────────────────────────────────────
export default function MarketplaceScreen(_props: { setScreen: (s: Screen) => void }) {
  const [search, setSearch] = useState("")
  const [liveTracks, setLiveTracks] = useState<PublicTrack[]>([])
  const [liveError, setLiveError] = useState("")
  const [liveLoading, setLiveLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLiveLoading(true)
    setLiveError("")
    fetch(`${API_BASE}/api/tracks?scope=public&limit=20&page=${page}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error(`음원 목록 조회 실패 (${response.status})`)
        const data: unknown = await response.json()
        if (!Array.isArray(data)) throw new Error("잘못된 음원 목록 응답")
        setTotal(Number(response.headers.get("X-Total-Count")) || data.length)
        const tracks = data.filter((item): item is PublicTrack =>
          !!item && typeof item === "object" && typeof item.id === "number" && typeof item.title === "string" && item.isPublic === true)
        const details = await Promise.all(tracks.map(async track => {
          try {
            const response = await fetch(`${API_BASE}/api/tracks/${track.id}`, { signal: controller.signal, cache: "no-store" })
            if (!response.ok) throw new Error("상세 정보 조회 실패")
            const detail = await response.json()
            if (detail.id !== track.id || detail.isPublic !== true || !Array.isArray(detail.verifications)) throw new Error("잘못된 상세 응답")
            return { ...track, ...detail } as PublicTrack
          } catch {
            return { ...track, verificationUnavailable: true }
          }
        }))
        if (!controller.signal.aborted) setLiveTracks(details)
      })
      .catch(error => { if (!controller.signal.aborted) setLiveError(error instanceof Error ? error.message : "음원을 불러오지 못했습니다.") })
      .finally(() => { if (!controller.signal.aborted) setLiveLoading(false) })
    return () => controller.abort()
  }, [page])
  const [filter, setFilter] = useState("All")
  const genres = ["All", "MP3", "WebM", "WAV"]
  const filtered = liveTracks.filter(t =>
    (filter === "All" || (filter === "MP3" ? t.mimeType === "audio/mpeg" : filter === "WebM" ? t.mimeType?.endsWith("/webm") : t.mimeType === "audio/wav")) &&
    t.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="pt-14 min-h-screen">
      <div className="px-6 py-12 border-b border-[#21262d]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#30363d] bg-[#161b22] text-xs text-[#9CA3AF] font-mono mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            {NETWORK.name} · 공개 음원 {total}개
            <span className="text-[9px] text-blue-400 border border-blue-500/30 rounded px-1">
              실제 업로드
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
              placeholder="현재 페이지의 트랙 제목 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#161b22] border border-[#30363d] text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>
      <div className="border-b border-[#21262d] bg-[#0d1117]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-[#9CA3AF]">
          {[
            ["공개 음원", String(total)],
            ["AI 검증", "미연결"],
            ["온체인 등록", "자동 실행 안 함"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span>{k}</span>
              <span className="text-white font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
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
        <p className="mb-3 text-xs text-[#9CA3AF]">실제 업로드된 공개 음원 · AI v5 검증 미연결</p>
        {liveLoading && <p role="status" className="py-10 text-center text-[#9CA3AF]">서버에서 음원을 불러오는 중…</p>}
        {liveError && <p role="alert" className="py-10 text-center text-red-400">서버 연결 오류: {liveError}</p>}
        {!liveLoading && !liveError && filtered.length === 0 && <p role="status" className="py-16 text-center rounded-xl border border-[#21262d] text-[#9CA3AF]">{liveTracks.length ? "검색 조건에 맞는 음원이 없습니다." : "공개된 음원이 아직 없습니다. Upload에서 첫 음원을 등록해 주세요."}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!liveLoading && !liveError && filtered.map(track => <TrackCard key={track.id} track={track} />)}
        </div>
        {total > 20 && <div className="flex justify-center gap-4 mt-6 text-sm text-white">
          <button disabled={page === 1 || liveLoading} onClick={() => setPage(p => p - 1)}>이전</button>
          <span>{page} / {Math.ceil(total / 20)}</span>
          <button disabled={page * 20 >= total || liveLoading} onClick={() => setPage(p => p + 1)}>다음</button>
        </div>}
      </div>
    </div>
  )
}
