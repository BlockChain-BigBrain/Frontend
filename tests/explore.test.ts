import { test } from "node:test"
import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import { act, createElement } from "react"
import { createRoot } from "react-dom/client"
import Explore from "../src/features/marketplace/MarketplacePage"

const nativeFetch = globalThis.fetch
const mockNames = /Neon Cascade|Ambient Drift 01|Lo-Fi Morning|Synthetic Pulse|Void Echoes|Solar Wind/

test("Explore has empty/error states, excludes private tracks, and reloads persisted public audio", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost:8443/Frontend/" })
  for (const key of ["window", "document", "HTMLElement", "Event"])
    Object.defineProperty(globalThis, key, { configurable: true, value: (dom.window as any)[key] })
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  let status = 200
  let items: unknown[] = []
  const calls: string[] = []
  globalThis.fetch = async url => {
    calls.push(String(url))
    if (/\/api\/tracks\/\d+$/.test(new URL(String(url)).pathname)) {
      const id = Number(new URL(String(url)).pathname.split("/").pop())
      return new Response(JSON.stringify({ id, isPublic: true, audioPath: `/api/tracks/${id}/audio`, verifications: [] }))
    }
    assert.equal(new URL(String(url)).searchParams.get("scope"), "public")
    return new Response(JSON.stringify(items), { status })
  }
  const mount = async () => {
    const root = createRoot(document.getElementById("root")!)
    await act(async () => { root.render(createElement(Explore, { setScreen: () => {} })) })
    return root
  }
  let root = await mount()
  try {
    assert.match(document.body.textContent!, /공개된 음원이 아직 없습니다/)
    assert.doesNotMatch(document.body.textContent!, mockNames)
    await act(async () => root.unmount())
    status = 503
    root = await mount()
    assert.match(document.querySelector('[role=alert]')!.textContent!, /503/)
    assert.equal(document.querySelectorAll('audio').length, 0)
    await act(async () => root.unmount())
    status = 200
    items = [{ id: 5, title: "Public song", isPublic: true, mimeType: "audio/webm" }, { id: 6, title: "Private song", isPublic: false }]
    root = await mount()
    assert.equal(document.querySelectorAll('audio').length, 1)
    assert.doesNotMatch(document.body.textContent!, /Private song|유사도 0|PASS|WARN|HOLD/)
    await act(async () => root.unmount())
    root = await mount()
    assert.equal(document.querySelectorAll('audio').length, 1)
    assert.ok(document.querySelector('audio[src$="/api/tracks/5/audio"]'))
    assert.equal(calls.filter(url => new URL(url).pathname === "/api/tracks").length, 4)
  } finally {
    await act(async () => root.unmount())
    globalThis.fetch = nativeFetch
    dom.window.close()
  }
})

test("live Explore renders five persisted MySQL tracks after remount", { skip: !process.env.EXPLORE_LIVE_TEST }, async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost:8443/Frontend/" })
  for (const key of ["window", "document", "HTMLElement", "Event"])
    Object.defineProperty(globalThis, key, { configurable: true, value: (dom.window as any)[key] })
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  const calls: Promise<unknown>[] = []
  // jsdom has no media decoder; test controls here, and verify actual bytes separately.
  const paused = new WeakMap<HTMLMediaElement, boolean>()
  const media = dom.window.HTMLMediaElement.prototype
  Object.defineProperty(media, 'paused', { configurable: true, get() { return paused.get(this) ?? true } })
  media.play = function () { paused.set(this, false); this.dispatchEvent(new Event('playing')); return Promise.resolve() }
  media.pause = function () { paused.set(this, true); this.dispatchEvent(new Event('pause')) }
  globalThis.fetch = (...args) => {
    const result = nativeFetch(...args)
    calls.push(result)
    return result
  }
  try {
    for (let i = 0; i < 2; i++) {
      const root = createRoot(document.getElementById("root")!)
      await act(async () => { root.render(createElement(Explore, { setScreen: () => {} })) })
      for (let attempt = 0; attempt < 100 && document.querySelectorAll('article').length !== 5; attempt++) {
        await act(async () => { await Promise.all(calls); await new Promise(resolve => setTimeout(resolve, 20)) })
      }
      try {
        assert.equal(document.querySelectorAll('article').length, 5)
        assert.equal(document.querySelectorAll('audio[hidden]:not([controls])').length, 5)
        assert.equal(document.querySelectorAll('article button').length, 5)
        assert.doesNotMatch(document.body.textContent!, mockNames)
        assert.equal(document.querySelectorAll('[role=meter]').length, 0)
        for (const button of document.querySelectorAll<HTMLButtonElement>('article button')) {
          await act(async () => button.click())
          assert.equal(button.getAttribute('aria-pressed'), 'true')
          await act(async () => button.click())
          assert.equal(button.getAttribute('aria-pressed'), 'false')
        }
        for (const audio of document.querySelectorAll('audio')) {
          const response = await nativeFetch(audio.src, { headers: { Range: "bytes=0-1023" } })
          assert.equal(response.status, 206)
          assert.equal((await response.arrayBuffer()).byteLength, 1024)
        }
      } finally { await act(async () => root.unmount()) }
    }
  } finally {
    globalThis.fetch = nativeFetch
    dom.window.close()
  }
})
