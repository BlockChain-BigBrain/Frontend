import { useCallback, useEffect, useState } from "react"
import { auth } from "../../api"
import { api } from "../../api/service"
import TrackCard from "../marketplace/TrackCard"
import type { PublicTrack } from "../marketplace/tracks"
import { verificationView } from "../marketplace/tracks"
import type { ChainResult } from "../../shared/types/domain"

type DashboardData = { tracks: PublicTrack[]; transactions: unknown[]; revenue: unknown | null }
type Filter = "all" | "registered" | "unregistered" | "hold"

// Display one card per persisted Track ID. Audio-level duplication is enforced by Backend.
function uniqueTracks(rows: PublicTrack[]): PublicTrack[] {
  const byId = new Map<number, PublicTrack>()
  for (const row of rows) {
    if (!row || !Number.isSafeInteger(row.id) || row.id <= 0 || typeof row.title !== "string") continue
    if (!byId.has(row.id)) byId.set(row.id, row)
  }
  return [...byId.values()]
}
export default function DashboardScreen(_props: { chainResult: ChainResult; onRecheckResult: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const load = useCallback(async (active: () => boolean) => {
    setLoading(true); setError("")
    try {
      const user = await auth.me()
      if (!user) throw new Error("내 음원을 보려면 로그인해 주세요.")
      // Track list is independent of revenue/transactions: a missing commerce API
      // must not hide uploaded tracks.
      const owned = await api("/api/tracks?scope=mine&limit=100")
      const list: unknown = Array.isArray(owned) ? owned : owned?.items
      if (!Array.isArray(list)) throw new Error("음원 목록 응답 형식이 올바르지 않습니다.")
      const tracks = await Promise.all(uniqueTracks(list as PublicTrack[]).map(async (row: PublicTrack) => {
        try {
          const detail = await api(`/api/tracks/${row.id}`)
          if (detail?.id !== row.id) throw new Error("잘못된 상세 응답")
          return { ...row, ...detail } as PublicTrack
        } catch {
          return { ...row, verificationUnavailable: true } as PublicTrack
        }
      }))
      if (active()) setData({ tracks, transactions: [], revenue: null })
      // Commerce API failures are isolated from the actual track gallery.
      const [transactions, wallet] = await Promise.allSettled([
        api("/api/users/me/transactions?limit=100"),
        api("/api/users/me/wallet"),
      ])
      let revenue: unknown = null
      if (wallet.status === "fulfilled" && wallet.value?.walletAddress) {
        try { revenue = await api("/api/users/me/revenue") } catch { /* unavailable */ }
      }
      if (active()) setData({
        tracks,
        transactions: transactions.status === "fulfilled" && Array.isArray(transactions.value?.items) ? transactions.value.items : [],
        revenue,
      })
    } catch (e) {
      if (active()) setError(e instanceof Error ? e.message : "데이터 조회 실패")
    } finally { if (active()) setLoading(false) }
  }, [])
  useEffect(() => { let active = true; void load(() => active); return () => { active = false } }, [load])
  const tracks = uniqueTracks(data?.tracks || [])
  const registered = tracks.filter(t => t.registrationStatus === "REGISTERED" && !!t.registrationTxHash).length
  const filtered = tracks.filter(t => {
    const verdict = verificationView(t).label
    return t.title.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || filter === "registered" && t.registrationStatus === "REGISTERED" ||
       filter === "unregistered" && t.registrationStatus !== "REGISTERED" ||
       filter === "hold" && verdict === "HOLD")
  })
  return <main className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-white">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">내 음원 대시보드</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">Explore와 동일한 카드에서 실제 업로드 음원과 AI·Backend에 저장된 온체인 등록 기록을 확인합니다. 체인 동기화가 필요할 수 있습니다.</p></div>
      <button type="button" onClick={() => void load(() => true)} disabled={loading} className="rounded-lg border border-[#30363d] px-4 py-2 text-sm disabled:opacity-50">새로고침</button>
    </div>
    {error && <p role="alert" className="mb-6 rounded-lg border border-red-500/30 p-4 text-red-400">{error}</p>}
    {loading && <p role="status" className="mb-6 text-[#9CA3AF]">실제 음원 데이터를 불러오는 중…</p>}
    {data && <>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([["업로드 음원", `${tracks.length}개`], ["온체인 등록", `${registered}개`],
          ["거래 내역", `${data.transactions.length}건`], ["수익·정산", data.revenue === null ? "데이터 없음" : "API 조회됨"]] as const).map(([label, value]) =>
          <section key={label} className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
            <p className="text-xs text-[#9CA3AF]">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p>
          </section>)}
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">내 음원 목록</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="음원 제목 검색"
          className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm outline-none focus:border-blue-500" />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {([["all","전체"],["registered","온체인 등록"],["unregistered","미등록"],["hold","HOLD"]] as const).map(([key,label]) =>
          <button type="button" key={key} onClick={() => setFilter(key)}
            className={`rounded-lg border px-3 py-1.5 text-xs ${filter === key ? "border-blue-500 bg-blue-500 text-white" : "border-[#30363d] bg-[#161b22] text-[#9CA3AF]"}`}>{label}</button>)}
      </div>
      {!loading && filtered.length === 0 && <p role="status" className="rounded-xl border border-[#30363d] py-14 text-center text-[#9CA3AF]">
        {tracks.length ? "조건에 맞는 음원이 없습니다." : "업로드한 음원이 없습니다. Upload에서 음원을 등록해 주세요."}
      </p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(track => <div key={track.id} className="min-w-0">
          <TrackCard track={track} />
          <div className="mt-2 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-xs text-[#9CA3AF]">
            <span>온체인: {track.registrationStatus === "REGISTERED" && track.registrationTxHash ? "Backend 등록 기록 있음" : "미등록 또는 확인 필요"}</span>
            {track.registrationStatus === "REGISTERED" && track.registrationTxHash &&
              <p className="mt-1 break-all font-mono text-blue-400">TX: {track.registrationTxHash}</p>}
          </div>
        </div>)}
      </div>
    </>}
  </main>
}
