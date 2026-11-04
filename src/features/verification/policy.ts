export interface Verification {
  id?: number
  trackId?: number
  createdAt?: string
  status?: string
  source?: string
  riskStatus?: string | null
  riskScore?: number | string | null
  duplicate?: boolean | null
  errorCode?: string | null
  modelVersion?: string | null
  evidence?: {
    decision?: string
    duplicate?: { detected?: boolean; matchedTrackId?: string | null }
    similarityScore?: number | null
    reviewRequired?: boolean
    queryWindowCount?: number
  } | null
}

// Use the latest attempt, including failure/in-progress. Never revive an older PASS.
export function latestVerification(rows: Verification[] = [], trackId?: number) {
  return rows.filter(v => trackId === undefined || v.trackId === undefined || v.trackId === trackId)
    .map((value, index) => ({ value, index }))
    .sort((a, b) => {
      if (a.value.id != null && b.value.id != null) return b.value.id - a.value.id
      const dates = Date.parse(b.value.createdAt || '') - Date.parse(a.value.createdAt || '')
      return Number.isFinite(dates) && dates !== 0 ? dates : a.index - b.index
    })[0]?.value ?? null
}

export function verificationPolicy(v?: Verification | null) {
  const completed = v?.source === 'AI' && v.status === 'VERIFIED'
  const blocked = v?.duplicate === true || v?.evidence?.duplicate?.detected === true || v?.riskStatus === 'BLOCK' || v?.evidence?.decision === 'BLOCK'
  const verdict = blocked ? 'BLOCK' : v?.evidence?.decision ?? v?.riskStatus
  const eligible = completed && ['PASS', 'WARN', 'HOLD'].includes(verdict || '')
  const pending = v?.status === 'PENDING' || v?.status === 'RUNNING'
  const failed = v?.status === 'REJECTED' || v?.status === 'FAILED'
  const heading = pending ? 'AI 검증 진행 중' : failed ? 'AI 검증 실패 · 재시도 필요'
    : !completed ? '실제 AI 검증 결과 확인 필요' : `AI 검증 결과: ${verdict || '확인 필요'}`
  const descriptions: Record<string, string> = {
    PASS: 'AI 검증 통과. 기여도 확정 후 IPFS 업로드와 등록 조건을 확인해 주세요.',
    WARN: '유사 음원 주의. 검증 결과를 확인한 뒤 IPFS 업로드와 등록 조건을 확인해 주세요.',
    HOLD: '추가 검토 필요. 유효한 서명과 다른 등록 조건을 충족하면 온체인 등록할 수 있으나 라이선스 구매는 차단됩니다.',
    BLOCK: '기존 음원과 중복된 것으로 감지되어 해당 음원을 등록할 수 없습니다. 검증 결과를 확인하거나 다른 음원을 업로드해 주세요.',
  }
  const description = pending ? 'AI 서버에서 분석하고 있습니다. 완료 후 결과를 확인해 주세요.'
    : failed ? '분석을 완료하지 못했습니다. 검증을 다시 시도해 주세요.'
      : completed ? descriptions[verdict || ''] || '판정을 확인할 수 없어 등록할 수 없습니다.' : '실제 AI 분석 완료 후 다음 단계를 진행할 수 있습니다.'
  // An explicitly missing CLAP score must never fall back to a BLOCK sentinel.
  const raw = v?.evidence ? v.evidence.similarityScore : v?.riskScore
  const numeric = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : NaN
  const score = completed && !blocked && Number.isFinite(numeric) && numeric >= 0 && numeric <= 1 ? numeric : null
  return { completed, verdict, blocked: completed && blocked, pending, failed, eligible, heading, description, score,
    purchasable: eligible && verdict !== 'HOLD' && v?.evidence?.reviewRequired !== true,
    matchedTrackId: completed && blocked ? v?.evidence?.duplicate?.matchedTrackId : null,
    windowNote: completed && v?.evidence?.queryWindowCount === 0 ? 'CLAP 분석 구간 수가 0으로 보고되었습니다. 유사도는 미산출이며 내부 처리 사유는 이 결과만으로 확인할 수 없습니다.' : null }
}

export const missingLabels: Record<string, string> = {
  realMetadataCid: '검증된 IPFS 메타데이터 업로드', realEligibleAiVerification: '등록 가능한 실제 AI 판정(PASS / WARN / HOLD)',
  finalizedContributions: '기여도 확정', creatorWallets: '창작자·기여자의 유효한 지갑과 지분',
  currentMetadataVerification: '최신 AI 결과가 반영된 메타데이터', registrationRequest: '등록 서명 준비',
  verificationSigner: '검증 서명 설정', contractAddress: '등록 컨트랙트 설정', audioHash: '음원 무결성 확인',
  signedPayloadChanged: '최신 조건으로 등록 서명 재준비', wallet: 'MetaMask 지갑 연결', network: 'MetaMask 네트워크 전환',
  walletAccount: '계정에 연결된 지갑 선택', backendReady: 'Backend 등록 준비 확인', alreadyRegistered: '이미 등록된 음원',
}
export function missingText(items: string[] = []) {
  return [...new Set(items)].map(key => missingLabels[key] || '서버의 추가 등록 조건 확인').join(' · ')
}
