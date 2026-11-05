import { useEffect, useRef, useState } from "react"
import Badge from "../../shared/components/Badge"
import Waveform from "../../shared/components/Waveform"
import { audioUrl, verificationView, type PublicTrack } from "./tracks"

// Cancels pending play requests as well as pausing the previously active card.
let activePlayer: { audio: HTMLAudioElement; stop: () => void } | null = null
const time = (value: number) => Number.isFinite(value) && value >= 0
  ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}` : "—:—"

export default function TrackCard({ track, onOpen }: { track: PublicTrack; onOpen?: () => void }) {
  const audio = useRef<HTMLAudioElement>(null)
  const request = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(NaN)
  const src = audioUrl(track)
  const evidence = verificationView(track)
  const { label, score } = evidence
  const queryVerifierScore = typeof evidence.queryVerifierScore === "number" ? evidence.queryVerifierScore : null
  const similarTracks = evidence.similarTracks || []
  const color = label === "PASS" ? "#10b981" : label === "WARN" ? "#f59e0b" : label === "HOLD" ? "#f97316" : "#2f80ed"
  const format = track.mimeType === "audio/mpeg" || track.mimeType === "audio/mp3" ? "MP3" : track.mimeType?.endsWith("/webm") ? "WebM" : track.mimeType?.includes("wav") ? "WAV" : track.mimeType
  const contributors = track.contributions ? new Set(track.contributions.map(c => c.userId)).size : null

  useEffect(() => {
    const element = audio.current
    return () => {
      request.current++
      if (element && (!element.paused || activePlayer?.audio === element)) element.pause()
      if (activePlayer?.audio === element) activePlayer = null
    }
  }, [src])

  async function toggle() {
    const element = audio.current
    if (!element) return
    if (activePlayer?.audio === element && (loading || !element.paused)) {
      activePlayer.stop()
      activePlayer = null
      return
    }
    activePlayer?.stop()
    const currentRequest = ++request.current
    activePlayer = { audio: element, stop: () => {
      request.current++
      element.pause()
      setPlaying(false)
      setLoading(false)
    } }
    setError("")
    setLoading(true)
    try {
      if (!src) throw new Error("Invalid audio URL")
      if (element.error) element.load()
      await element.play()
      if (request.current !== currentRequest) {
        if (activePlayer?.audio !== element) element.pause()
        return
      }
      setPlaying(true)
      setLoading(false)
    } catch {
      if (request.current !== currentRequest) return
      setError("음원을 재생하지 못했습니다. 재생 버튼을 눌러 다시 시도해 주세요.")
      setPlaying(false)
      setLoading(false)
      if (activePlayer?.audio === element) activePlayer = null
    }
  }

  return (
    <article className={`min-w-0 bg-[#161b22] border rounded-xl overflow-hidden transition-all group ${label === "HOLD" ? "border-orange-500/40" : label === "WARN" ? "border-amber-500/30" : "border-[#21262d] hover:border-[#30363d]"}`}>
      <div className="h-28 bg-gradient-to-br from-[#1c2128] to-[#0d1117] relative flex items-center justify-center">
        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at 30% 50%, ${color}33 0%, transparent 70%)` }} />
        <div className="absolute bottom-3 left-4 right-4 pointer-events-none" aria-hidden="true"><Waveform seed={track.id} playing={playing && !loading} color={color} /></div>
        <button type="button" onClick={() => void toggle()} aria-label={`${track.title} ${playing || loading ? "일시정지" : "재생"}`} aria-pressed={playing || loading} aria-busy={loading}
          className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors z-10 shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400">
          {loading ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" /> : playing ?
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white" aria-hidden="true"><rect x="1" y="1" width="4" height="10" rx="1" /><rect x="7" y="1" width="4" height="10" rx="1" /></svg> :
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white" aria-hidden="true"><path d="M3 2L10 6L3 10V2Z" /></svg>}
        </button>
      </div>
      <audio ref={audio} hidden preload="none" src={src || undefined} aria-label={`${track.title} 오디오`}
        onPlaying={() => { if (activePlayer?.audio !== audio.current) { audio.current?.pause(); return }; setPlaying(true); setLoading(false) }}
        onPause={() => { setPlaying(false); setLoading(false) }}
        onWaiting={() => { if (activePlayer?.audio === audio.current) setLoading(true) }}
        onEnded={() => { setPlaying(false); setLoading(false); if (activePlayer?.audio === audio.current) activePlayer = null }}
        onLoadedMetadata={() => setDuration(audio.current?.duration ?? NaN)}
        onDurationChange={() => setDuration(audio.current?.duration ?? NaN)}
        onTimeUpdate={() => setPosition(audio.current?.currentTime ?? 0)}
        onError={() => { request.current++; setError("음원을 불러오지 못했습니다. 재생 버튼을 눌러 다시 시도해 주세요."); setPlaying(false); setLoading(false); if (activePlayer?.audio === audio.current) activePlayer = null }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            {onOpen ? <button type="button" onClick={onOpen} title={track.title} className="block max-w-full truncate text-left text-sm font-semibold text-white transition-colors hover:text-blue-400">{track.title}</button>
              : <h3 title={track.title} className="truncate text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{track.title}</h3>}
            <p title={track.owner?.name} className="truncate mt-1 text-xs text-[#9CA3AF] font-mono">{track.owner?.name || "제작자 정보 없음"}</p>
          </div>
          <div className="shrink-0"><Badge variant={label === "PASS" ? "verified" : label === "WARN" || label === "HOLD" ? "warning" : "primary"}>{label}</Badge></div>
        </div>
        <div className="flex items-center gap-2 mb-3 text-xs text-[#9CA3AF]">
          <span className="bg-[#1c2128] px-2 py-0.5 rounded font-mono" title={track.mimeType}>{format}</span>
          {contributors !== null && <span title="등록된 기여자 수">👥 {contributors}</span>}
          <span className="ml-auto font-mono tabular-nums" aria-label="재생 시간">{time(position)} / {time(duration)}</span>
        </div>
        {loading && <p role="status" className="mb-3 text-[10px] text-blue-400">음원을 불러오는 중…</p>}
        {error && <p role="alert" className="mb-3 text-[10px] text-red-400">{error}</p>}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#21262d]">
          <span className="text-xs text-[#9CA3AF] font-mono">{track.registrationStatus === "REGISTERED" ? "판매 정보 없음" : "라이선스 미등록"}</span>
          <time dateTime={track.createdAt} className="text-[10px] text-[#6B7280] font-mono">{track.createdAt ? new Date(track.createdAt).toLocaleDateString("ko-KR") : ""}</time>
        </div>
        {(score !== null || queryVerifierScore !== null) && <div className="mt-3 space-y-3 border-t border-[#21262d] pt-3">
          {score !== null && <div>
            <div className="mb-1 flex justify-between text-[10px] text-[#9CA3AF]"><span>Similarity · HOLD 기준</span><span className="font-mono text-white">{score.toFixed(3)}{evidence.thresholds?.hold != null ? ` / ${evidence.thresholds.hold.toFixed(3)}` : ""}</span></div>
            <div role="meter" aria-label="실제 AI similarity score" aria-valuenow={score} aria-valuemin={0} aria-valuemax={1} className="h-1 rounded-full bg-[#30363d]"><div className="h-1 rounded-full bg-blue-400" style={{ width: `${score * 100}%` }} /></div>
          </div>}
          {queryVerifierScore !== null && <div>
            <div className="mb-1 flex justify-between text-[10px] text-[#9CA3AF]"><span>Query verifier · WARN 기준</span><span className="font-mono text-white">{queryVerifierScore.toFixed(3)}{evidence.thresholds?.warn != null ? ` / ${evidence.thresholds.warn.toFixed(3)}` : ""}</span></div>
            <div role="meter" aria-label="실제 AI query verifier score" aria-valuenow={queryVerifierScore} aria-valuemin={0} aria-valuemax={1} className="h-1 rounded-full bg-[#30363d]"><div className="h-1 rounded-full bg-violet-400" style={{ width: `${queryVerifierScore * 100}%` }} /></div>
          </div>}
          {!!similarTracks.length && <details className="text-[10px] text-[#9CA3AF]">
            <summary className="cursor-pointer">AI 유사 후보 {similarTracks.length}개 · 매칭 구간</summary>
            <ul className="mt-2 space-y-2">
              {similarTracks.map((candidate, index) => <li key={`${candidate.trackId || "candidate"}-${index}`} className="rounded-md bg-[#0d1117] p-2">
                <div className="flex justify-between gap-2"><code className="truncate">{candidate.trackId || "ID 미제공"}</code><span className="shrink-0">score {typeof candidate.score === "number" ? candidate.score.toFixed(3) : "미제공"}</span></div>
                {candidate.matchedSegments?.map((segment, segmentIndex) => <p key={segmentIndex} className="mt-1 font-mono text-[#6B7280]">
                  query {segment.queryStartSec?.toFixed(1) ?? "?"}–{segment.queryEndSec?.toFixed(1) ?? "?"}s ↔ reference {segment.refStartSec?.toFixed(1) ?? "?"}–{segment.refEndSec?.toFixed(1) ?? "?"}s
                </p>)}
              </li>)}
            </ul>
          </details>}
          {(evidence.scoreVersion || evidence.decisionPolicyVersion) && <p className="break-all font-mono text-[9px] text-[#6B7280]">
            {evidence.scoreVersion || "score version 미제공"}{evidence.decisionPolicyVersion ? ` · ${evidence.decisionPolicyVersion}` : ""}
          </p>}
        </div>}
      </div>
    </article>
  )
}
