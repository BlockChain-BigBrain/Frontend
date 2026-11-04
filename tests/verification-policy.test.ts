import { test } from 'node:test'
import assert from 'node:assert/strict'
import { latestVerification, missingText, verificationPolicy } from '../src/features/verification/policy'
import { prepareRegistration, readRegistration, registrationPacket } from '../src/features/verification/registration'
const account = '0x1111111111111111111111111111111111111111'
const ai = (riskStatus: string, id = 10) => ({ id, trackId: 19, status: 'VERIFIED', source: 'AI', riskStatus, duplicate: riskStatus === 'BLOCK', riskScore: '1', evidence: { decision: riskStatus, similarityScore: null, duplicate: { detected: riskStatus === 'BLOCK', matchedTrackId: 'original_music/zephiramusic-halloween-lofi-599381.mp3' }, queryWindowCount: 0 } })
const track = (riskStatus = 'PASS') => ({ id: 19, contributionsFinalizedAt: '2026-11-05', metadataCid: 'bafkreigh2akiscaildc6o6p2nhccz3u5c6afgzkgkbb37faqxnxm6woj5m', registrationStatus: 'NOT_REGISTERED', owner: { walletAddress: account }, verifications: [ai(riskStatus)] })
const packet = { ready: true, missing: [], transaction: { chainId: '31337', from: account, to: account, value: '0', data: '0x1234' } }
const wallet = { request: async ({ method }: { method: string }) => method === 'eth_chainId' ? '0x7a69' : [account] }

test('latest verification does not confuse old failures, newer BLOCK, pending or newer rejection', () => {
  const old = { id: 6, trackId: 19, source: 'AI', status: 'REJECTED' }, blocked = ai('BLOCK')
  assert.equal(latestVerification([old, { ...old, id: 7 }, blocked], 19)?.id, 10)
  assert.equal(verificationPolicy(latestVerification([ai('PASS', 5), old], 19)).failed, true)
  assert.equal(verificationPolicy(latestVerification([blocked, { ...old, id: 11, status: 'RUNNING' }], 19)).pending, true)
  assert.equal(latestVerification([ai('BLOCK'), { ...ai('PASS', 20), trackId: 18 }], 19)?.id, 10)
})
test('PASS/WARN/HOLD/BLOCK, analysis failures and progress have distinct policies; null never becomes 0/100%', () => {
  for (const verdict of ['PASS', 'WARN', 'HOLD']) {
    const p = verificationPolicy(ai(verdict)); assert.equal(p.eligible, true); assert.equal(p.purchasable, verdict !== 'HOLD'); assert.equal(p.score, null)
  }
  const p = verificationPolicy(ai('BLOCK')); assert.equal(p.eligible, false); assert.equal(p.purchasable, false); assert.equal(p.score, null); assert.match(p.description, /등록할 수 없습니다/); assert.ok(p.matchedTrackId)
  assert.equal(verificationPolicy({ ...ai('PASS'), riskStatus: 'BLOCK' }).eligible, false)
  for (const status of ['REJECTED', 'FAILED', 'PENDING', 'RUNNING']) assert.equal(verificationPolicy({ ...ai('PASS'), status }).eligible, false)
  assert.equal(verificationPolicy({ ...ai('PASS'), source: 'MOCK' }).eligible, false)
})
test('BLOCK guards prevent metadata, registration preparation and send-packet API calls even when invoked directly', async () => {
  for (const action of [prepareRegistration, registrationPacket]) {
    const calls: string[] = []
    const call = async (path: string) => { calls.push(path); assert.equal(path, '/api/tracks/19'); return track('BLOCK') }
    await assert.rejects(action(19, call), /BLOCK/)
    assert.deepEqual(calls, ['/api/tracks/19'])
  }
})
test('backend ready, finalization, real CID, connected account and network are all required', async () => {
  for (const missing of ['backend', 'finalized', 'cid', 'wallet', 'network', 'account']) {
    const t = track(), p = { ...packet, ready: missing !== 'backend' }
    if (missing === 'finalized') t.contributionsFinalizedAt = ''
    if (missing === 'cid') t.metadataCid = ''
    const provider = { request: async ({ method }: { method: string }) => method === 'eth_chainId' ? (missing === 'network' ? '0x1' : '0x7a69') : [missing === 'account' ? '0x2222222222222222222222222222222222222222' : account] }
    const call = async (path: string) => path.endsWith('/wallet') ? { walletAddress: missing === 'wallet' ? '' : account } : path.endsWith('/registration-payload') ? p : t
    assert.equal((await readRegistration(19, call, provider)).ready, false, missing)
  }
  const call = async (path: string) => path.endsWith('/wallet') ? { walletAddress: account } : path.endsWith('/registration-payload') ? packet : track()
  assert.equal((await readRegistration(19, call, wallet)).ready, true)
  assert.match(missingText(['realMetadataCid', 'realEligibleAiVerification']), /IPFS.*AI/)
})
test('eligible PASS/WARN/HOLD can prepare IPFS and signature before actual wallet sending', async () => {
  for (const verdict of ['PASS', 'WARN', 'HOLD']) {
    const t = track(verdict); t.metadataCid = ''
    const writes: string[] = []
    const call = async (path: string, data?: unknown) => {
      if (data !== undefined) writes.push(path)
      if (path.endsWith('/metadata/upload')) t.metadataCid = 'bafk-real-server-cid'
      if (path.endsWith('/registration-payload')) return data === undefined ? { ready: false, missing: ['realMetadataCid'] } : packet
      return t
    }
    assert.equal((await prepareRegistration(19, call)).ready, true)
    assert.deepEqual(writes, ['/api/tracks/19/metadata/prepare', '/api/tracks/19/metadata/upload', '/api/tracks/19/registration-payload'])
  }
})
test('changed selection or newly blocked server verdict stops preparation before mutations', async () => {
  const calls: string[] = []
  await assert.rejects(prepareRegistration(19, async path => { calls.push(path); return track() }, () => false))
  assert.deepEqual(calls, [])
  let reads = 0
  const writes: string[] = []
  const call = async (path: string, data?: unknown) => {
    if (data !== undefined) writes.push(path)
    return path.endsWith('/registration-payload') ? { missing: ['realMetadataCid'] } : track(++reads === 1 ? 'PASS' : 'BLOCK')
  }
  await assert.rejects(prepareRegistration(19, call), /BLOCK/)
  assert.deepEqual(writes, [])
})
