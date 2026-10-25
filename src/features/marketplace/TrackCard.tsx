import { useState } from "react"
import { THRESHOLD } from "../../shared/config/constants"
import { NETWORK } from "../../shared/config/network"
import Badge from "../../shared/components/Badge"
import Waveform from "../../shared/components/Waveform"
import type { TrackData } from "./mockTracks"

// ─── Track Card ─────────────────────────────────────────────────────────────────
export default function TrackCard({
  track,
  onClick,
  onBuy,
}: {
  track: TrackData
  onClick: () => void
  onBuy: () => void
}) {
  const [playing, setPlaying] = useState(false)
  const isPass = track.status === "pass"
  const isWarn = track.status === "warn"
  const isHold = track.status === "hold"
  const isChecking = track.status === "checking"
  const statusColor = isPass
    ? "#10b981"
    : isWarn
      ? "#f59e0b"
      : isHold
        ? "#f97316"
        : "#2f80ed"
  const statusLabel = isPass
    ? "PASS"
    : isWarn
      ? "WARN"
      : isHold
        ? "HOLD"
        : "검증 중"

  return (
    <div
      onClick={onClick}
      className={`bg-[#161b22] border rounded-xl overflow-hidden transition-all group cursor-pointer ${
        isHold
          ? "border-orange-500/40"
          : isWarn
            ? "border-amber-500/30"
            : "border-[#21262d] hover:border-[#30363d]"
      }`}
    >
      <div className="h-28 bg-gradient-to-br from-[#1c2128] to-[#0d1117] relative flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 30% 50%, ${statusColor}33 0%, transparent 70%)`,
          }}
        />
        {!isChecking ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setPlaying(!playing)
            }}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors z-10"
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                <rect x="1" y="1" width="4" height="10" rx="1" />
                <rect x="7" y="1" width="4" height="10" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                <path d="M3 2L10 6L3 10V2Z" />
              </svg>
            )}
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center z-10 border border-blue-500/30 bg-blue-500/10">
            <div className="w-4 h-4 rounded-full border border-blue-400 border-t-transparent animate-spin"></div>
          </div>
        )}
        <div className="absolute bottom-3 left-4 right-4">
          <Waveform seed={track.id} playing={playing} color={statusColor} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
              {track.title}
            </h3>
            <span className="text-xs text-[#9CA3AF] font-mono">
              {track.model}
            </span>
          </div>
          <div>
            <Badge
              variant={
                isPass
                  ? "verified"
                  : isWarn
                    ? "warning"
                    : isHold
                      ? "warning"
                      : "primary"
              }
            >
              {isChecking
                ? statusLabel
                : `${statusLabel} · 유사도 ${track.similarity.toFixed(2)}`}
            </Badge>
          </div>
        </div>
        {track.note && (
          <div
            className={`text-[10px] font-mono rounded px-2 py-1 mb-2 border ${
              isHold
                ? "text-orange-400 bg-orange-500/5 border-orange-500/20"
                : "text-amber-400 bg-amber-500/5 border-amber-500/20"
            }`}
          >
            {track.note}
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#9CA3AF] bg-[#1c2128] px-2 py-0.5 rounded font-mono">
            {track.genre ?? "미분류"}
          </span>
          {!isChecking && (
            <span className="text-xs text-[#9CA3AF]">
              ▶ {track.plays ?? "—"}
            </span>
          )}
          <span className="text-xs text-[#9CA3AF] ml-auto">
            👥 {track.contributors}
          </span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-[#21262d]">
          <div>
            {!isChecking ? (
              <div className="text-sm font-semibold text-white">
                {track.price} {NETWORK.currencySymbol}
              </div>
            ) : (
              <div className="text-xs text-[#9CA3AF] font-mono">
                검증 진행 중
              </div>
            )}
          </div>
          {(isPass || isWarn || isHold) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBuy()
              }}
              className="px-3 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white text-xs font-medium transition-all"
            >
              {isWarn ? "ⓘ 라이선스 구매" : "라이선스 구매"}
            </button>
          )}
          {isHold && (
            <div className="flex gap-1">
              <button
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-1.5 rounded border border-orange-500/30 text-orange-400 text-[10px]"
              >
                근거 보기
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-1.5 rounded border border-[#30363d] text-[#9CA3AF] text-[10px]"
              >
                이의 제기
              </button>
            </div>
          )}
        </div>
        {!isChecking && (
          <div className="mt-3">
            <div className="relative flex h-1 overflow-hidden rounded-full">
              <div
                className="bg-emerald-500/50"
                style={{ width: `${THRESHOLD.warn * 100}%` }}
              ></div>
              <div
                className="bg-amber-500/60"
                style={{ width: `${(THRESHOLD.hold - THRESHOLD.warn) * 100}%` }}
              ></div>
              <div
                className="bg-red-500/60"
                style={{ width: `${(1 - THRESHOLD.hold) * 100}%` }}
              ></div>
              <div
                className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-white border border-[#0d1117] -translate-y-1/2"
                style={{ left: `calc(${track.similarity * 100}% - 3px)` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] text-[#6B7280] font-mono mt-1">
              <span>PASS</span>
              <span>{THRESHOLD.warn.toFixed(2)}</span>
              <span>{THRESHOLD.hold.toFixed(2)}</span>
              <span>HOLD</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
