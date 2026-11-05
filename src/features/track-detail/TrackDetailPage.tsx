import { useEffect, useMemo, useState } from "react"
import { publicApi } from "../../api/service"
import type { PublicTrack } from "../marketplace/tracks"
import { audioUrl } from "../marketplace/tracks"
import { latestVerification, verificationPolicy } from "../verification/policy"
import type { Screen } from "../../shared/types/domain"

type TrackDetail = PublicTrack & {
  workLog?: string | null
  prompt?: string | null
  contributionsFinalizedAt?: string | null
  metadataCid?: string | null
  blockchainTrackId?: string | number | null
}

const amount = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null
}

export default function DetailScreen({ setScreen, trackId }: {
  setScreen: (screen: Screen) => void
  trackId: number | null
}) {
  const [track, setTrack] = useState<TrackDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    setTrack(null)
    setError("")
    setLoading(true)
    if (!trackId) {
      setError("음원을 선택한 뒤 상세 정보를 열어 주세요.")
      setLoading(false)
      return () => { active = false }
    }
    publicApi(`/api/tracks/${trackId}`).then((result) => {
      if (!result || result.id !== trackId || typeof result.title !== "string") throw new Error("음원 상세 응답을 확인할 수 없습니다.")
      if (active) setTrack(result as TrackDetail)
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "음원 정보를 불러오지 못했습니다.")
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [trackId])

  const verification = useMemo(() => track ? latestVerification(track.verifications, track.id) : null, [track])
  const policy = verificationPolicy(verification)
  const contributions = (track?.contributions || []).map((item, index) => ({
    item,
    index,
    percentage: amount(item.percentage),
  })).filter((item) => item.percentage !== null)
  const candidates = Array.isArray(verification?.evidence?.similarTracks) ? verification.evidence.similarTracks : []
  const media = track ? audioUrl(track) : ""

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-24 text-white">
      <button type="button" onClick={() => setScreen("marketplace")} className="mb-5 inline-flex items-center gap-2 text-sm text-[#9CA3AF] transition-colors hover:text-white">
        <span aria-hidden="true">←</span> Explore로 돌아가기
      </button>
      {loading && <section role="status" className="rounded-2xl border border-[#30363d] bg-[#161b22] p-10 text-center text-sm text-[#9CA3AF]">백엔드에서 음원 정보를 불러오는 중…</section>}
      {error && !loading && <section role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-300">{error}</section>}

      {track && !loading && <>
        <header className="mb-6 overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22]">
          <div className="relative border-b border-[#30363d] bg-gradient-to-br from-[#17243a] via-[#161b22] to-[#0d1117] px-6 py-8 sm:px-8">
            <div className="absolute inset-0 opacity-30" aria-hidden="true" style={{ background: "radial-gradient(ellipse at 18% 20%, #2f80ed55 0%, transparent 55%)" }} />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-300">Track detail · #{track.id}</p>
                <h1 className="mt-2 break-words text-3xl font-bold tracking-tight">{track.title}</h1>
                <p className="mt-2 text-sm text-[#9CA3AF]">{track.owner?.name || "창작자 정보 없음"}{track.mimeType ? ` · ${track.mimeType}` : ""}</p>
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${policy.completed ? policy.blocked ? "border-red-500/30 bg-red-500/10 text-red-300" : policy.verdict === "HOLD" || policy.verdict === "WARN" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-[#484f58] bg-[#0d1117] text-[#9CA3AF]"}`}>
                {policy.completed ? policy.blocked ? "BLOCK · 중복 감지" : `AI ${policy.verdict}` : policy.pending ? "AI 분석 중" : policy.failed ? "AI 분석 실패" : "AI 미분석"}
              </span>
            </div>
            <div className="relative mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              {media ? <audio controls preload="none" className="w-full" src={media} aria-label={`${track.title} 오디오 재생`} />
                : <p role="status" className="text-sm text-[#9CA3AF]">오디오 재생 주소를 확인할 수 없습니다.</p>}
            </div>
          </div>
          <div className="grid divide-y divide-[#30363d] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-4"><p className="text-[10px] uppercase tracking-wider text-[#6B7280]">AI 판정</p><p className="mt-1 text-sm font-semibold">{policy.completed ? policy.verdict : policy.pending ? "분석 중" : policy.failed ? "실패" : "미분석"}</p></div>
            <div className="p-4"><p className="text-[10px] uppercase tracking-wider text-[#6B7280]">기여도 상태</p><p className="mt-1 text-sm font-semibold">{track.contributionsFinalizedAt ? "확정됨" : "미확정"}</p></div>
            <div className="p-4"><p className="text-[10px] uppercase tracking-wider text-[#6B7280]">온체인 등록</p><p className="mt-1 text-sm font-semibold">{track.registrationStatus === "REGISTERED" && track.registrationTxHash ? "영수증 확인됨" : track.registrationStatus || "미등록"}</p></div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-400">AI evidence</p><h2 className="mt-1 text-lg font-semibold">검증 결과</h2></div>
              <span className="rounded-lg border border-[#30363d] bg-[#0d1117] px-2.5 py-1.5 text-xs text-[#9CA3AF]">{policy.completed ? "실제 백엔드 결과" : "결과 없음"}</span>
            </div>
            <p className="mb-5 text-sm leading-6 text-[#9CA3AF]">{policy.description}</p>
            {policy.completed && <>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ["Similarity score", verification?.evidence?.similarityScore, "HOLD 임계값", verification?.evidence?.thresholds?.hold],
                  ["Query verifier score", verification?.evidence?.queryVerifierScore, "WARN 임계값", verification?.evidence?.thresholds?.warn],
                ] as const).map(([label, rawScore, thresholdLabel, rawThreshold]) => {
                  const score = typeof rawScore === "number" && Number.isFinite(rawScore) ? rawScore : null
                  const threshold = typeof rawThreshold === "number" && Number.isFinite(rawThreshold) ? rawThreshold : null
                  return <div key={label} className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4">
                    <div className="flex items-center justify-between gap-3"><span className="text-xs text-[#9CA3AF]">{label}</span><span className="font-mono text-sm">{score === null ? "미제공" : score.toFixed(4)}</span></div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#30363d]">{score !== null && <div className="h-full rounded-full bg-blue-400" style={{ width: `${score * 100}%` }} />}</div>
                    <p className="mt-2 text-[10px] text-[#6B7280]">{thresholdLabel}: {threshold === null ? "미제공" : threshold.toFixed(4)}</p>
                  </div>
                })}
              </div>
              <dl className="mt-5 grid gap-3 rounded-xl border border-[#30363d] bg-[#0d1117] p-4 text-xs sm:grid-cols-2">
                <div><dt className="text-[#6B7280]">모델 버전</dt><dd className="mt-1 break-all font-mono text-[#D1D5DB]">{verification?.modelVersion || "미제공"}</dd></div>
                <div><dt className="text-[#6B7280]">Score version</dt><dd className="mt-1 break-all font-mono text-[#D1D5DB]">{verification?.evidence?.scoreVersion || "미제공"}</dd></div>
                <div><dt className="text-[#6B7280]">Decision policy</dt><dd className="mt-1 break-all font-mono text-[#D1D5DB]">{verification?.evidence?.decisionPolicyVersion || "미제공"}</dd></div>
                <div><dt className="text-[#6B7280]">Corpus version</dt><dd className="mt-1 break-all font-mono text-[#D1D5DB]">{verification?.evidence?.corpusVersion || "미제공"}</dd></div>
              </dl>
              {candidates.length > 0 && <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold">유사 후보 및 매칭 구간 <span className="font-mono text-[#6B7280]">{candidates.length}</span></h3>
                <ul className="space-y-2">{candidates.map((candidate, candidateIndex) => <li key={`${candidate.trackId}-${candidateIndex}`} className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3">
                  <div className="flex flex-wrap justify-between gap-2 text-xs"><code className="break-all text-[#D1D5DB]">{candidate.trackId}</code><span className="font-mono text-blue-300">{typeof candidate.score === "number" ? candidate.score.toFixed(4) : "점수 미제공"}</span></div>
                  <div className="mt-2 space-y-1">{(candidate.matchedSegments || []).map((segment, segmentIndex) => <p key={segmentIndex} className="font-mono text-[10px] text-[#7d8590]">
                    query {segment.queryStartSec?.toFixed(2) ?? "?"}–{segment.queryEndSec?.toFixed(2) ?? "?"}s · reference {segment.refStartSec?.toFixed(2) ?? "?"}–{segment.refEndSec?.toFixed(2) ?? "?"}s · {typeof segment.score === "number" ? segment.score.toFixed(3) : "점수 미제공"}
                  </p>)}</div>
                </li>)}</ul>
              </div>}
            </>}
            {!policy.completed && <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 text-sm text-[#9CA3AF]">검증 요청·응답 데이터가 없으므로 점수, 정책 버전, 후보를 표시하지 않습니다.</div>}
          </section>

          <div className="space-y-5">
            <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">Contributors</p>
              <h2 className="mt-1 text-lg font-semibold">기여도</h2>
              {contributions.length === 0 ? <p className="mt-4 rounded-xl border border-[#30363d] bg-[#0d1117] p-4 text-sm text-[#9CA3AF]">기여도 데이터가 없습니다.</p> : <>
                <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#30363d]" aria-label="실제 기여도 비율">
                  {contributions.map(({ item, index, percentage }) => <div key={`${item.userId ?? "contributor"}-${index}`} title={`${item.role || "역할 미제공"}: ${percentage}%`} style={{ width: `${percentage}%` }} className={`h-full ${index % 3 === 0 ? "bg-blue-400" : index % 3 === 1 ? "bg-violet-400" : "bg-emerald-400"}`} />)}
                </div>
                <ul className="mt-4 space-y-2">{contributions.map(({ item, index, percentage }) => <li key={`${item.userId ?? "contributor"}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-[#0d1117] px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-[#D1D5DB]">{item.user?.nickname || item.user?.name || (item.userId ? `사용자 #${item.userId}` : "기여자 정보 없음")} · {item.role || "역할 미제공"}</span><span className="shrink-0 font-mono text-blue-300">{percentage}%</span>
                </li>)}</ul>
              </>}
            </section>

            <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">On-chain receipt</p>
              <h2 className="mt-1 text-lg font-semibold">등록 상태</h2>
              <p className="mt-3 text-sm text-[#9CA3AF]">{track.registrationStatus || "미등록"}</p>
              {track.registrationStatus === "REGISTERED" && track.registrationTxHash ? <>
                <p className="mt-3 text-xs text-emerald-300">백엔드 등록 확인됨</p>
                {track.blockchainTrackId != null && <p className="mt-2 text-xs text-[#9CA3AF]">Track ID <span className="font-mono text-white">{track.blockchainTrackId}</span></p>}
                <code className="mt-3 block break-all rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-[10px] text-blue-300">{track.registrationTxHash}</code>
              </> : <p className="mt-3 text-xs text-[#6B7280]">영수증 확인이 끝나기 전에는 등록 성공으로 표시하지 않습니다.</p>}
            </section>

            {(track.prompt || track.workLog) && <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
              <h2 className="text-lg font-semibold">창작 기록</h2>
              {track.prompt && <div className="mt-3"><h3 className="text-xs text-[#6B7280]">프롬프트</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#D1D5DB]">{track.prompt}</p></div>}
              {track.workLog && <div className="mt-4"><h3 className="text-xs text-[#6B7280]">작업 기록</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#D1D5DB]">{track.workLog}</p></div>}
            </section>}
          </div>
        </div>
      </>}
    </main>
  )
}
