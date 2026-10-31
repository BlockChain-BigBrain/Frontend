// ─── Badge ──────────────────────────────────────────────────────────────────────
export default function Badge({
  children,
  variant = "verified",
}: {
  children: React.ReactNode
  variant?: "verified" | "primary" | "muted" | "warning" | "danger"
}) {
  const styles = {
    verified: "border border-emerald-500 text-emerald-400 bg-emerald-500/10",
    primary: "border border-blue-500 text-blue-400 bg-blue-500/10",
    muted: "border border-[#30363d] text-[#9CA3AF] bg-[#161b22]",
    warning: "border border-amber-500 text-amber-400 bg-amber-500/10",
    danger: "border border-red-500 text-red-400 bg-red-500/10",
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-mono ${styles[variant]}`}
    >
      {children}
    </span>
  )
}
