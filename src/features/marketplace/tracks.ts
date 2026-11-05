import { API_BASE } from "../../api/service"
import { latestVerification, verificationPolicy } from "../verification/policy"
import type { Verification } from "../verification/policy"

export interface TrackVerification extends Verification {
  source: string
  status: string
  riskStatus?: string | null
}
export interface PublicTrack {
  id: number
  title: string
  isPublic: boolean
  audioPath?: string
  mimeType: string
  createdAt?: string
  owner?: { name: string }
  contributions?: Array<{ userId: number; role?: string; percentage?: string | number; user?: { nickname?: string; name?: string } }>
  registrationStatus?: string
  registrationTxHash?: string | null
  verifications?: TrackVerification[]
  verificationUnavailable?: boolean
}

// Only completed, real AI evidence may supply a verdict or a similarity score.
export function verificationView(track: PublicTrack) {
  const verification = latestVerification(track.verifications, track.id)
  if (track.verificationUnavailable) return { label: "검증 정보 확인 불가", score: null }
  if (!verification || verification.source !== "AI") return { label: "AI 검증 미실시", score: null }
  const policy = verificationPolicy(verification)
  if (policy.pending) return { label: "AI 검증 중", score: null }
  if (!policy.completed) return { label: "AI 검증 실패", score: null }
  if (policy.blocked) return { label: "동일 음원 감지", score: null }
  return { label: policy.eligible ? policy.verdict! : "검증 결과 확인 필요", score: policy.score,
    queryVerifierScore: policy.queryVerifierScore, thresholds: policy.thresholds,
    scoreVersion: policy.scoreVersion, decisionPolicyVersion: policy.decisionPolicyVersion,
    similarTracks: policy.similarTracks }
}

export function audioUrl(track: PublicTrack) {
  // Resolve the API's audioPath; keep media requests on the configured backend origin.
  try {
    const url = new URL(track.audioPath || `/api/tracks/${track.id}/audio`, API_BASE + "/")
    if (url.origin !== new URL(API_BASE).origin || !["http:", "https:"].includes(url.protocol)) return ""
    return url.href
  } catch { return "" }
}
