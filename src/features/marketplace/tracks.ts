import { API_BASE } from "../../api/service"

export interface TrackVerification {
  source: string
  status: string
  riskStatus?: string | null
  riskScore?: number | string | null
  duplicate?: boolean | null
  modelVersion?: string | null
  evidence?: { decision?: string; similarityScore?: number | null } | null
}
export interface PublicTrack {
  id: number
  title: string
  isPublic: boolean
  audioPath?: string
  mimeType: string
  createdAt?: string
  owner?: { name: string }
  contributions?: Array<{ userId: number }>
  registrationStatus?: string
  registrationTxHash?: string | null
  verifications?: TrackVerification[]
  verificationUnavailable?: boolean
}

// Only completed, real AI evidence may supply a verdict or a similarity score.
export function verificationView(track: PublicTrack) {
  const verification = track.verifications?.[0]
  if (track.verificationUnavailable) return { label: "검증 정보 확인 불가", score: null }
  if (!verification || verification.source !== "AI") return { label: "AI 검증 미실시", score: null }
  if (verification.status !== "VERIFIED") return { label: verification.status === "PENDING" ? "AI 검증 중" : "AI 검증 실패", score: null }
  if (verification.duplicate || verification.evidence?.decision === "BLOCK") return { label: "동일 음원 감지", score: null }
  const verdict = verification.evidence?.decision ?? verification.riskStatus
  if (!["PASS", "WARN", "HOLD"].includes(verdict ?? "")) return { label: "검증 결과 확인 필요", score: null }
  const raw = verification.evidence ? verification.evidence.similarityScore : verification.riskScore
  const value = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() ? Number(raw) : NaN
  return { label: verdict!, score: Number.isFinite(value) && value >= 0 && value <= 1 ? value : null }
}

export function audioUrl(track: PublicTrack) {
  // Resolve the API's audioPath; keep media requests on the configured backend origin.
  try {
    const url = new URL(track.audioPath || `/api/tracks/${track.id}/audio`, API_BASE + "/")
    if (url.origin !== new URL(API_BASE).origin || !["http:", "https:"].includes(url.protocol)) return ""
    return url.href
  } catch { return "" }
}
