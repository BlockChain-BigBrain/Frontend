type Segment = { queryStartSec: number; queryEndSec: number; refStartSec: number; refEndSec: number; score: number };
type Match = { trackId: string; score: number; retrievalScore?: number; matchedSegments?: readonly Segment[] };
export type VerificationEvidenceProps = { verification: {
  status?: string; errorCode?: string | null; riskScore?: number | string | null; modelVersion?: string | null;
  evidence?: { decision?: string; similarityScore?: number | null; reviewRequired?: boolean; provisional?: boolean;
    evaluationScope?: string; referenceTracks?: number; pureAiCreationVerified?: boolean; scoreVersion?: string;
    corpusVersion?: string; decisionPolicyVersion?: string; modelVersion?: string;
    thresholds?: { warn: number; hold: number }; similarTracks?: readonly Match[];
    duplicate?: { detected: boolean; matchedTrackId?: string | null } } | null;
} | null };

const point = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value.toFixed(4) : "미산출";
const validSegment = (s: Segment) => [s.queryStartSec, s.queryEndSec, s.refStartSec, s.refEndSec, s.score].every(Number.isFinite)
  && s.queryStartSec >= 0 && s.refStartSec >= 0 && s.queryEndSec > s.queryStartSec && s.refEndSec > s.refStartSec;

export function VerificationEvidence({ verification: v }: VerificationEvidenceProps) {
  if (!v) return <p className="text-sm text-[#9CA3AF]">아직 검증 결과가 없습니다.</p>;
  const e = v.evidence;
  const decision = e?.decision || (v.status === "PENDING" ? "분석 중" : v.errorCode ? "분석 실패" : "판정 근거 미제공");
  return <div className="space-y-4" aria-live="polite" data-testid="verification-evidence">
    <section className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
      <h3 className="text-sm font-semibold text-white">{decision}</h3>
      <p className="mt-2 text-sm text-[#9CA3AF]">음원 대응 확인 점수: {point(e?.similarityScore)}</p>
      <p className="mt-2 text-xs text-[#9CA3AF]">점수는 표절 확률이나 권리 보유의 증명이 아닙니다.</p>
      {e?.duplicate?.detected && <p className="mt-2 text-xs text-red-300">동일 지문이 감지되어 등록이 차단됐습니다. {e.duplicate.matchedTrackId}</p>}
      {e?.reviewRequired && <p className="mt-2 text-xs text-amber-400">검토가 필요하여 자동 등록이 보류됐습니다.</p>}
      {e?.evaluationScope === "ai_labeled" && <p className="mt-2 text-xs text-[#9CA3AF]">검색 기준: Pixabay AI 표시 확인군 {e.referenceTracks}곡. AI 표시는 AI 수정도 포함하며 순수 AI 생성을 확정하지 않습니다.</p>}
      {e?.provisional && <p className="mt-2 text-xs text-amber-400">실험용 정책의 결과입니다.</p>}
    </section>
    {(e?.similarTracks || []).map(match => <section key={match.trackId} className="rounded-xl border border-[#30363d] p-4">
      <div className="flex justify-between gap-3 text-xs text-white"><span className="break-all">{match.trackId}</span><span className="font-mono">{point(match.score)}</span></div>
      {match.retrievalScore != null && <p className="mt-2 text-xs text-[#9CA3AF]">음색 검색 점수 {point(match.retrievalScore)}</p>}
      {(match.matchedSegments || []).filter(validSegment).map((segment, i) => <p key={i} className="mt-2 text-xs text-[#9CA3AF]">
        내 음원 {segment.queryStartSec.toFixed(1)}–{segment.queryEndSec.toFixed(1)}초 ↔ 원곡 {segment.refStartSec.toFixed(1)}–{segment.refEndSec.toFixed(1)}초
      </p>)}
    </section>)}
    {e && <details className="rounded-xl border border-[#30363d] p-4 text-xs text-[#9CA3AF]">
      <summary>모델 · 정책 · 임계값</summary>
      <p className="mt-3 break-all">모델: {e.modelVersion || v.modelVersion || "—"}<br/>점수 버전: {e.scoreVersion || "—"}<br/>정책: {e.decisionPolicyVersion || "—"}<br/>검색 DB: {e.corpusVersion || "—"}<br/>WARN: {point(e.thresholds?.warn)} / HOLD: {point(e.thresholds?.hold)}</p>
    </details>}
  </div>;
}
