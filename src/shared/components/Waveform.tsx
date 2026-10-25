// ─── Waveform ───────────────────────────────────────────────────────────────────
export default function Waveform({
  color = "#2f80ed",
  playing = false,
  seed = 0,
}: {
  color?: string
  playing?: boolean
  seed?: number
}) {
  const base = [14, 24, 32, 20, 38, 28, 16, 36, 22, 30, 18, 26]
  const heights = base.map((h, i) => {
    const r = ((seed * 17 + i * 31) % 22) - 11
    return Math.max(6, Math.min(42, h + r))
  })
  return (
    <div className="flex items-center gap-[3px] h-10">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all"
          style={{
            height: h,
            background: color,
            opacity: playing ? 1 : 0.45,
            animation: playing
              ? `wave 1.2s ease-in-out ${(i * 0.08).toFixed(2)}s infinite`
              : "none",
          }}
        />
      ))}
    </div>
  )
}
