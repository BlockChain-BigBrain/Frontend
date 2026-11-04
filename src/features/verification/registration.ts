import { api } from '../../api/service'
import { type WalletProvider } from '../../wallet'
import { latestVerification, missingText, verificationPolicy } from './policy'

type Call = typeof api
export interface RegistrationState { track: any; packet: any; missing: string[]; ready: boolean }
export function requireEligible(track: any) {
  const policy = verificationPolicy(latestVerification(track.verifications, track.id))
  if (!policy.eligible) throw new Error(`${policy.heading}. ${policy.description}`)
  if (!track.contributionsFinalizedAt) throw new Error('먼저 기여도를 확정해 주세요.')
  if (track.registrationStatus === 'REGISTERED') throw new Error('이미 등록된 음원입니다.')
}
function walletProvider(): WalletProvider | undefined {
  return typeof window === 'undefined' ? undefined : (window as Window & { ethereum?: WalletProvider }).ethereum
}
export async function readRegistration(id: number, call: Call = api, provider = walletProvider()): Promise<RegistrationState> {
  const track = await call(`/api/tracks/${id}`)
  const policy = verificationPolicy(latestVerification(track.verifications, id))
  if (!policy.eligible) return { track, packet: null, missing: ['realEligibleAiVerification'], ready: false }
  const packet = await call(`/api/tracks/${id}/registration-payload`)
  const missing: string[] = [...(Array.isArray(packet.missing) ? packet.missing : [])]
  if (!track.contributionsFinalizedAt) missing.push('finalizedContributions')
  if (!track.metadataCid) missing.push('realMetadataCid')
  if (track.registrationStatus === 'REGISTERED') missing.push('alreadyRegistered')
  if (packet.ready !== true) missing.push('backendReady')
  if (!packet.transaction) missing.push('registrationRequest')
  try {
    const bound = await call('/api/users/me/wallet')
    if (!provider || !bound.walletAddress) missing.push('wallet')
    else {
      const [accounts, chainId] = await Promise.all([provider.request({ method: 'eth_accounts' }), provider.request({ method: 'eth_chainId' })])
      const account = accounts?.[0]?.toLowerCase()
      const expected = packet.transaction?.from || track.owner?.walletAddress || bound.walletAddress
      if (!account || account !== bound.walletAddress.toLowerCase() || account !== expected.toLowerCase()) missing.push('walletAccount')
      const expectedChain = packet.transaction?.chainId ?? packet.typedData?.domain?.chainId ?? '31337'
      if (BigInt(chainId) !== BigInt(expectedChain)) missing.push('network')
    }
  } catch { missing.push('wallet') }
  return { track, packet, missing: [...new Set(missing)], ready: packet.ready === true && missing.length === 0 }
}

// Recheck fresh server evidence before every mutating step, including direct handler calls.
export async function prepareRegistration(id: number, call: Call = api, isCurrent = () => true) {
  const check = async () => {
    if (!isCurrent()) throw new Error('선택한 음원이 변경되었습니다.')
    const track = await call(`/api/tracks/${id}`)
    if (!isCurrent()) throw new Error('선택한 음원이 변경되었습니다.')
    requireEligible(track)
    return track
  }
  await check()
  const preview = await call(`/api/tracks/${id}/registration-payload`)
  if (preview.missing?.includes('realMetadataCid') || preview.missing?.includes('currentMetadataVerification') || !(await check()).metadataCid) {
    await check(); await call(`/api/tracks/${id}/metadata/prepare`, {})
    await check(); await call(`/api/tracks/${id}/metadata/upload`, {})
  }
  const track = await check()
  if (!track.metadataCid) throw new Error('검증된 IPFS 메타데이터 업로드를 완료해 주세요.')
  const packet = await call(`/api/tracks/${id}/registration-payload`, {})
  if (packet.ready !== true) throw new Error(`등록 준비 필요: ${missingText(packet.missing)}`)
  return packet
}
export async function registrationPacket(id: number, call: Call = api, isCurrent = () => true) {
  const state = await readRegistration(id, call)
  if (!isCurrent()) throw new Error('선택한 음원이 변경되었습니다.')
  requireEligible(state.track)
  if (!state.ready) throw new Error(`등록 준비 필요: ${missingText(state.missing)}`)
  const packet = await call(`/api/tracks/${id}/registration-payload`, {})
  if (!isCurrent()) throw new Error('선택한 음원이 변경되었습니다.')
  if (packet.ready !== true || !packet.transaction) throw new Error(`등록 준비 필요: ${missingText(packet.missing || ['backendReady'])}`)
  return packet
}
