import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";

// design-v3 integration: current public marketplace, navigation, and login-gated wallet.
// Upload and authenticated session behavior are covered by v3-auth-upload.test.ts.
// This uses HTTP fixtures, not a real database, chain, or MetaMask extension.
test("design-v3 shows public backend tracks and requires login before wallet linking", async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: "http://localhost:5173/",
  });
  for (const key of ["window", "document", "localStorage", "FormData", "File", "Blob", "HTMLElement", "Event", "MouseEvent"]) {
    Object.defineProperty(globalThis, key, { configurable: true, value: (dom.window as any)[key] });
  }
  // jsdom does not implement HTMLDialogElement.showModal/close.\n  Object.defineProperty(dom.window.HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });\n  Object.defineProperty(dom.window.HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } });\n  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const requests: string[] = [];
  globalThis.fetch = async (url, init = {}) => {
    const path = new URL(String(url)).pathname;
    requests.push(path);
    if (path === "/api/v1/auth/refresh") return new Response(JSON.stringify({ message: "Login required" }), { status: 401 });
    if (path === "/api/tracks") {
      assert.equal(new URL(String(url)).searchParams.get("scope"), "public");
      return new Response(JSON.stringify([{ id: 42, title: "Actual Track", registrationStatus: "NOT_REGISTERED" }]), { status: 200 });
    }
    throw new Error(`Unexpected request: ${init.method || "GET"} ${path}`);
  };
  const { createRoot } = await import("react-dom/client");
  const { default: App } = await import("../src/app/App.tsx");
  const root = createRoot(document.getElementById("root")!);
  const tick = () => new Promise(resolve => setTimeout(resolve, 10));
  const button = (label: string) => [...document.querySelectorAll("button")].find(b => b.textContent?.trim() === label) as HTMLButtonElement | undefined;
  try {
    await act(async () => { root.render(createElement(App)); await tick(); });
    assert.match(document.body.textContent || "", /Web3 마켓/);
    assert.match(document.body.textContent || "", /Actual Track/);
    assert.ok(document.querySelector('audio[src$="/api/tracks/42/audio"]'), "real track has an audio endpoint");
    assert.ok(requests.includes("/api/tracks"));

    await act(async () => { button("지갑 연결")!.click(); await tick(); });
    assert.ok(document.querySelector("dialog[open]"), "signed-out wallet click opens login");
    assert.equal(document.querySelector('[role="dialog"][aria-label="지갑 연결"]'), null, "wallet signature modal must stay closed");

    await act(async () => { (document.querySelector('button[aria-label="로그인 창 닫기"]') as HTMLButtonElement).click(); });
    await act(async () => { button("Upload")!.click(); await tick(); });
    assert.match(document.body.textContent || "", /음원 업로드/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
