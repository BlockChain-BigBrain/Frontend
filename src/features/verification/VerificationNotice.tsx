import { verificationPolicy, type Verification } from './policy'
export default function VerificationNotice({ verification }: { verification: Verification | null }) {
  if (!verification) return null
  const p = verificationPolicy(verification)
  return <div className={`space-y-2 rounded-lg border p-3 text-xs ${p.blocked || p.failed ? 'border-red-500/30 text-red-300' : 'border-[#30363d] text-blue-300'}`} role="status">
    <p className="font-semibold">{p.heading}</p><p>{p.description}</p>
    {p.completed && <p>중복 음원 감지: {p.blocked ? '감지됨' : '감지되지 않음'}</p>}
    {p.matchedTrackId && <p className="break-all">중복 대상: {p.matchedTrackId}</p>}
    {p.completed && <p>CLAP 유사도: {p.score === null ? '미산출' : `${(p.score * 100).toFixed(2)}%`}</p>}
    {p.windowNote && <p>{p.windowNote}</p>}
    {p.failed && verification.errorCode && <p>오류 코드: {verification.errorCode}</p>}
  </div>
}
