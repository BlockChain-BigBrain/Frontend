import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import TrackCard from '../src/features/marketplace/TrackCard'
import { verificationView, type PublicTrack } from '../src/features/marketplace/tracks'
const track: PublicTrack = { id: 1, title: 'Long actual uploaded title', isPublic: true, mimeType: 'audio/mpeg', audioPath: '/api/tracks/1/audio', owner: { name: 'Creator' }, verifications: [] }

test('only real completed AI evidence shows verdicts and actual scores including zero', () => {
  const ai = { source: 'AI', status: 'VERIFIED', riskStatus: 'PASS', riskScore: '0', duplicate: false }
  assert.deepEqual(verificationView(track), { label: 'AI 검증 미실시', score: null })
  for (const source of ['MOCK', 'UNCONFIGURED']) assert.equal(verificationView({ ...track, verifications: [{ ...ai, source }] }).label, 'AI 검증 미실시')
  assert.deepEqual(verificationView({ ...track, verifications: [ai] }), { label: 'PASS', score: 0, queryVerifierScore: null, thresholds: null, scoreVersion: null, decisionPolicyVersion: null, similarTracks: [] })
  assert.deepEqual(verificationView({ ...track, verifications: [{ ...ai, evidence: { decision: 'WARN', similarityScore: 0.31 } }] }), { label: 'WARN', score: 0.31, queryVerifierScore: null, thresholds: null, scoreVersion: null, decisionPolicyVersion: null, similarTracks: [] })
  const dual = verificationView({ ...track, verifications: [{ ...ai, evidence: { decision: 'WARN', similarityScore: 0.91, queryVerifierScore: 0.42, thresholds: { warn: 0.4, hold: 0.95 }, scoreVersion: 'score-v', decisionPolicyVersion: 'policy-v', similarTracks: [{ trackId: 'candidate-1', score: 0.8, matchedSegments: [{ queryStartSec: 1, queryEndSec: 5, refStartSec: 11, refEndSec: 15, score: 0.8 }] }] } }] })
  assert.equal(dual.score, 0.91)
  assert.equal(dual.queryVerifierScore, 0.42)
  assert.deepEqual(dual.thresholds, { warn: 0.4, hold: 0.95 })
  assert.equal(dual.similarTracks[0].matchedSegments?.[0].queryStartSec, 1)
  assert.equal(verificationView({ ...track, verifications: [{ ...ai, evidence: { decision: 'HOLD', similarityScore: null } }] }).score, null)
  assert.equal(verificationView({ ...track, verifications: [{ ...ai, duplicate: true }] }).score, null)
  for (const riskScore of [null, '', 'NaN', -1, 1.1]) assert.equal(verificationView({ ...track, verifications: [{ ...ai, riskScore }] }).score, null)
})

test('custom player toggles MP3/WebM, cancels previous/pending playback, retries and cleans up', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:8443/Frontend/' })
  for (const key of ['window', 'document', 'HTMLElement', 'Event']) Object.defineProperty(globalThis, key, { configurable: true, value: (dom.window as any)[key] })
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  const paused = new WeakMap<HTMLMediaElement, boolean>()
  let fail = false, pending = false
  let deferred: () => void = () => {}
  const media = dom.window.HTMLMediaElement.prototype
  Object.defineProperty(media, 'paused', { configurable: true, get() { return paused.get(this) ?? true } })
  media.pause = function () { paused.set(this, true); this.dispatchEvent(new Event('pause')) }
  media.play = function () {
    if (fail) return Promise.reject(new Error('Unsupported media'))
    paused.set(this, false)
    if (pending) return new Promise<void>(resolve => { deferred = () => { this.dispatchEvent(new Event('playing')); resolve() } })
    this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  }
  media.load = function () {}
  const root = createRoot(document.getElementById('root')!)
  try {
    await act(async () => root.render(createElement('div', {}, createElement(TrackCard, { track }), createElement(TrackCard, { track: { ...track, id: 2, title: 'Actual WebM', mimeType: 'audio/webm', audioPath: '/api/tracks/2/audio' } }))))
    const buttons = [...document.querySelectorAll('button')], audios = [...document.querySelectorAll('audio')]
    assert.ok(audios.every(a => a.hidden && !a.controls))
    assert.ok(audios[1].src.endsWith('/api/tracks/2/audio'))
    assert.equal(document.querySelector('h3')!.title, track.title)
    assert.ok(document.querySelector('h3')!.classList.contains('truncate'))
    assert.equal(document.querySelector('[role=meter]'), null)
    await act(async () => buttons[0].click())
    assert.equal(buttons[0].getAttribute('aria-pressed'), 'true')
    await act(async () => buttons[0].click())
    assert.ok(audios[0].paused)
    await act(async () => buttons[0].click())
    await act(async () => buttons[1].click())
    assert.ok(audios[0].paused)
    assert.equal(buttons[0].getAttribute('aria-pressed'), 'false')
    assert.equal(buttons[1].getAttribute('aria-pressed'), 'true')
    await act(async () => audios[1].dispatchEvent(new Event('ended')))
    assert.equal(buttons[1].getAttribute('aria-pressed'), 'false')
    fail = true
    await act(async () => buttons[0].click())
    assert.match(document.querySelector('[role=alert]')!.textContent!, /다시 시도/)
    fail = false
    await act(async () => buttons[0].click())
    assert.equal(document.querySelector('[role=alert]'), null)
    await act(async () => buttons[0].click())
    pending = true
    await act(async () => buttons[0].click())
    assert.equal(buttons[0].getAttribute('aria-busy'), 'true')
    const resolveOld = deferred
    pending = false
    await act(async () => buttons[1].click())
    await act(async () => resolveOld())
    assert.ok(audios[0].paused)
    assert.equal(buttons[0].getAttribute('aria-pressed'), 'false')
    assert.equal(buttons[1].getAttribute('aria-pressed'), 'true')
    await act(async () => root.unmount())
    assert.ok(audios.every(a => a.paused))
  } finally { dom.window.close() }
})
