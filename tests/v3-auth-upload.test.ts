import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";

test("v3 restores login, uploads the actual file, reports failure and logs out without chain calls", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost:8443/Frontend/" });
  for (const key of ["window", "document", "localStorage", "FormData", "File", "Blob", "HTMLElement", "Event", "MouseEvent"])
    Object.defineProperty(globalThis, key, { configurable: true, value: (dom.window as any)[key] });
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  let uploaded = 0, fail = true, signedIn = true, filename = 'my-song.wav';
  const calls: string[] = [];
  const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
  globalThis.fetch = async (url, init = {}) => {
    const path = new URL(String(url)).pathname; calls.push(path);
    if (path.endsWith('/refresh')) return response({ result: { accessToken: 'fixture' } });
    if (path.endsWith('/me')) return signedIn ? response({ result: { id: 1, nickname: 'Creator', email: 'test@example.test' } }) : response({}, 401);
    if (path.endsWith('/logout')) { signedIn = false; return response({}); }
    assert.equal(path, '/api/tracks');
    assert.equal(init.method, 'POST');
    assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer fixture');
    assert.equal(new Headers(init.headers).has('Content-Type'), false);
    const form = init.body as FormData;
    assert.equal((form.get('audio') as File).name, filename);
    assert.equal(form.get('title'), 'my-song');
    assert.equal(form.get('isPublic'), 'true');
    uploaded++;
    return fail ? response({ error: '저장 실패' }, 503) : response({ id: 42 }, 201);
  };
  const { createRoot } = await import('react-dom/client');
  const { default: GNB } = await import('../src/shared/layout/GNB');
  const { default: Upload } = await import('../src/features/upload/UploadPage');
  const { SCENARIOS } = await import('../src/features/chain-result/scenarios');
  const root = createRoot(document.getElementById('root')!);
  const noop = () => {};
  await act(async () => root.render(createElement('div', {}, createElement(GNB, { screen: 'upload', setScreen: noop, walletConnected: false, setWalletConnected: noop, showWalletModal: false, setShowWalletModal: noop, showHowItWorks: false, setShowHowItWorks: noop }), createElement(Upload, { chainResult: SCENARIOS['success-pass'].result }))));
  assert.match(document.body.textContent!, /Creator/);
  const input = document.querySelector('input[type=file]')!;
  Object.defineProperty(input, 'files', { configurable: true, value: [new File(['audio'], 'my-song.wav', { type: 'audio/wav' })] });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  const button = () => Array.from(document.querySelectorAll('button')).find(b => b.textContent === '음원 업로드')!;
  await act(async () => button().click());
  assert.match(document.querySelector('[role=alert]')!.textContent!, /저장 실패/);
  assert.equal(document.querySelector('[role=status]'), null);
  fail = false;
  filename = 'my-song.webm';
  Object.defineProperty(input, 'files', { configurable: true, value: [new File(['webm fixture'], filename, { type: 'audio/webm' })] });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  await act(async () => button().click());
  assert.equal(uploaded, 2);
  assert.match(document.querySelector('[role=status]')!.textContent!, /ID: 42/);
  assert.equal(calls.some(p => /verify|metadata|registration|wallet/.test(p)), false);
  await act(async () => Array.from(document.querySelectorAll('button')).find(b => b.textContent === '로그아웃')!.click());
  assert.match(document.body.textContent!, /구글로 3초/);
  await act(async () => root.unmount());
  dom.window.close();
});
