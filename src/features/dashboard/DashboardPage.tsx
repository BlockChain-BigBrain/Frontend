import { useEffect, useState } from "react"
import { auth } from "../../api"
import { api } from "../../api/service"
import type { ChainResult } from "../../shared/types/domain"

type DashboardData = { tracks: unknown[]; transactions: unknown[]; revenue: unknown | null }
export default function DashboardScreen(_props: { chainResult: ChainResult; onRecheckResult: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const user = await auth.me()
        if (!user) throw new Error("로그인이 필요합니다.")
        const [owned, transactions, wallet] = await Promise.all([
          api("/api/tracks?scope=mine&limit=100"),
          api("/api/users/me/transactions?limit=100"),
          api("/api/users/me/wallet"),
        ])
        const tracks = Array.isArray(owned) ? owned : owned?.items
        if (!Array.isArray(tracks) || !Array.isArray(transactions?.items)) throw new Error("서버 데이터 형식을 확인할 수 없습니다.")
        let revenue: unknown = null
        if (wallet?.walletAddress) revenue = await api("/api/users/me/revenue")
        if (active) setData({ tracks, transactions: transactions.items, revenue })
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "데이터 조회 실패")
      } finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])
  return <main className="mx-auto max-w-5xl px-6 pt-24 text-white">
    <h1 className="mb-6 text-2xl font-bold">크리에이터 대시보드</h1>
    {loading ? <p role="status">실제 데이터를 불러오는 중입니다.</p>
      : error ? <p role="alert">데이터를 불러오지 못했습니다: {error}</p>
      : data ? <>
        <div className="grid gap-4 sm:grid-cols-3">
          <section className="rounded-xl border border-[#30363d] p-5"><p className="text-sm text-gray-400">내 음원</p><p className="mt-2 text-2xl">{data.tracks.length}개</p></section>
          <section className="rounded-xl border border-[#30363d] p-5"><p className="text-sm text-gray-400">거래 내역</p><p className="mt-2 text-2xl">{data.transactions.length}건</p></section>
          <section className="rounded-xl border border-[#30363d] p-5"><p className="text-sm text-gray-400">수익·정산</p><p className="mt-2 text-sm">{data.revenue === null ? "지갑 연결 후 조회 가능" : "실제 수익 데이터 조회됨"}</p></section>
        </div>
        <h2 className="mt-8 mb-3 font-semibold">내 음원</h2>
        {data.tracks.length === 0 ? <p>데이터 없음</p> : <ul className="space-y-2">{data.tracks.map((item, i) => {
          const track = item as { id?: number; title?: string; registrationStatus?: string }
          return <li key={track.id ?? i} className="rounded-lg border border-[#30363d] p-3">{track.title || "제목 없음"} · {track.registrationStatus || "등록 상태 확인 중"}</li>
        })}</ul>}
        <h2 className="mt-8 mb-3 font-semibold">거래 내역</h2>
        {data.transactions.length === 0 ? <p>데이터 없음</p> : <p>실제 거래 {data.transactions.length}건이 조회되었습니다. 상세 거래 내역은 추후 연동 예정입니다.</p>}
      </> : <p>데이터 없음</p>}
  </main>
}
