// ─── Pie Chart ──────────────────────────────────────────────────────────────────
export default function PieChart({
  slices,
}: {
  slices: { label: string; value: number; color: string }[]
}) {
  let offset = 0
  const r = 40,
    cx = 50,
    cy = 50
  const paths = slices.map((s) => {
    const angle = (s.value / 100) * 360
    const startRad = ((offset - 90) * Math.PI) / 180
    const endRad = ((offset + angle - 90) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad),
      y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad),
      y2 = cy + r * Math.sin(endRad)
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${
      angle > 180 ? 1 : 0
    } 1 ${x2} ${y2} Z`
    offset += angle
    return { d, color: s.color, label: s.label, value: s.value }
  })
  return (
    <div className="flex items-center gap-5">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} />
        ))}
      </svg>
      <div className="space-y-1.5">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: p.color }}
            ></div>
            <span className="text-xs text-[#9CA3AF]">{p.label}</span>
            <span className="text-xs font-mono text-white ml-auto">
              {p.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
