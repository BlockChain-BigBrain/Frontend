import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";

// UI-level orchestration test. HTTP responses and wallet are explicit fixtures;
// this does not replace real AI/Kubo/Hardhat/MySQL execution.
test("design-v2 pages preserve the real upload/register/sale/purchase flow and retry mined receipts", async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "http://localhost:8443/Frontend/" });
  for (const name of ["window", "document", "localStorage", "FormData", "File", "Blob", "HTMLElement", "Event", "MouseEvent"]) Object.defineProperty(globalThis, name, { configurable: true, value: (dom.window as any)[name] });
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  let who: any = { id: 1, email: "creator@test.local", nickname: "Creator" }, track: any = null, listing: any = null, license: any = null;
  const wallets: Record<number, string> = {}, owner = "0x" + "1".repeat(40), buyer = "0x" + "2".repeat(40);
  const calls: string[] = [], sent: any[] = []; let failConfirm = true;
  const verification = { id: 1, status: "VERIFIED", source: "AI", duplicate: false, riskScore: "0.72", riskStatus: "PASS", modelVersion: "TEST_CLAP", evidence: { decision: "PASS", similarityScore: .72, reviewRequired: false, provisional: true, similarTracks: [], thresholds: { warn: .856638, hold: .894406 } } };
  const chain = () => ({ registrationStatus: track?.registrationStatus || "NOT_REGISTERED", txHash: track?.registrationTxHash || null, blockchainTrackId: track?.blockchainTrackId || null });
  const response = (value: any, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
  const tx = (data: string) => ({ chainId: "31337", from: who.id === 1 ? owner : buyer, to: "0x" + "3".repeat(40), data, value: data === "0x03" ? "1000000000000000" : "0" });
  const marketItem = () => listing ? { ...listing, track: { id: 42, title: track.title, creator: { id: 1, name: "Creator" }, verification: { source: "AI", riskScore: ".72", riskStatus: "PASS", modelVersion: "TEST_CLAP" } }, purchasable: listing.status === "ACTIVE" } : null;
  (globalThis as any).fetch = async (url: string, init: any = {}) => {
    const pathname = new URL(url).pathname, method = init.method || "GET"; calls.push(`${method} ${pathname}`);
    const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
    if (pathname.endsWith("/auth/refresh")) return who ? response({ result: { accessToken: `token-${who.id}` } }) : response({}, 401);
    if (pathname.endsWith("/auth/me")) return response({ result: who });
    if (pathname.endsWith("/auth/logout")) { who = null; return response({}); }
    if (pathname.endsWith("/auth/login")) { who = { id: 2, email: "buyer@test.local", nickname: "Buyer" }; return response({ result: { accessToken: "token-2" } }); }
    if (pathname === "/api/users/me/wallet/challenge") return response({ message: "TEST_ONLY_CHALLENGE" });
    if (pathname === "/api/users/me/wallet") { if (method === "POST") wallets[who.id] = who.id === 1 ? owner : buyer; return response({ bound: !!wallets[who.id], walletAddress: wallets[who.id] }); }
    if (pathname === "/api/users/me/revenue") return response({ available: "0", availableWei: "0", balances: [] });
    if (pathname === "/api/users/me/transactions") return response({ items: [] });
    if (pathname === "/api/users/me/licenses") return response({ items: who?.id === 2 && license ? [license] : [] });
    if (pathname === "/api/market/tracks") {
      if (method === "POST") { listing = { id: 8, trackId: 42, sellerId: 1, price: "0.001", currency: "ETH", status: "PREPARING", licenseType: "COMMERCIAL" }; return response(listing, 201); }
      return response({ items: listing && (new URL(url).searchParams.get("scope") === "mine" ? who?.id === 1 : listing.status === "ACTIVE") ? [marketItem()] : [] });
    }
    if (pathname === "/api/market/tracks/8/price-payload") return response({ transaction: tx("0x02") });
    if (pathname === "/api/market/tracks/8/price/confirm") { listing.status = "ACTIVE"; return response(marketItem()); }
    if (pathname === "/api/market/tracks/8") return response(marketItem());
    if (pathname === "/api/tracks") {
      if (method === "POST") { assert.equal(body.get("isPublic"), "true"); const rows = JSON.parse(body.get("contributors")); assert.equal(rows.reduce((sum: number, r: any) => sum + r.percentage, 0), 100); track = { id: 42, title: body.get("title"), ownerId: 1, owner: { name: "Creator" }, createdAt: new Date().toISOString(), contributions: rows.map((r: any, i: number) => ({ ...r, id: i + 1, user: { name: "Creator" } })), verifications: [], registrationStatus: "NOT_REGISTERED", audioHash: "a".repeat(64) }; return response(track, 201); }
      return response(track && who?.id === 1 ? [track] : []);
    }
    if (pathname === "/api/tracks/42") return response(track);
    if (pathname === "/api/tracks/42/contributors/finalize") { track.contributionsFinalizedAt = new Date().toISOString(); return response({}); }
    if (pathname === "/api/tracks/42/verify") { track.verifications = [verification]; return response(verification, 202); }
    if (pathname === "/api/tracks/42/blockchain") return response(chain());
    if (pathname === "/api/tracks/42/metadata/prepare") return response({}, 201);
    if (pathname === "/api/tracks/42/metadata/upload") { track.metadataCid = "TEST_ONLY_CID"; return response({ metadataCid: track.metadataCid }); }
    if (pathname === "/api/tracks/42/registration-payload") { track.registrationStatus = "PENDING"; return response({ ready: true, transaction: tx("0x01") }); }
    if (pathname === "/api/tracks/42/registration/confirm") { track.registrationStatus = "REGISTERED"; track.registrationTxHash = body.txHash; track.blockchainTrackId = "1"; return response(track); }
    if (pathname === "/api/licenses/purchase") return response({ id: 9, transaction: tx("0x03") }, 201);
    if (pathname === "/api/licenses/purchase/confirm") {
      if (failConfirm) { failConfirm = false; return response({ error: "TEST_ONLY_RECEIPT_DELAY" }, 503); }
      license = { id: 10, trackId: 42, type: "COMMERCIAL", source: "REAL", ownershipConfirmed: true, licenseStatus: "COMPLETED", tokenId: "1", purchaseTxHash: body.txHash, price: ".001", currency: "ETH", issuedAt: new Date().toISOString(), track: { title: track.title } }; return response({ status: "COMPLETED", licenseId: 10 });
    }
    throw new Error(`Unhandled test endpoint: ${method} ${url}`);
  };
  (dom.window as any).ethereum = { request: async ({ method, params }: any) => {
    if (method === "eth_requestAccounts") return [who.id === 1 ? owner : buyer];
    if (method === "personal_sign") return "0x" + "a".repeat(130);
    if (method === "eth_chainId") return "0x7a69";
    if (method === "eth_sendTransaction") { sent.push(params[0]); return "0x" + String(sent.length).repeat(64); }
    if (method === "eth_getTransactionReceipt") return { status: "0x1" };
    throw new Error(method);
  } };
  const { createRoot } = await import("react-dom/client"); const { default: App } = await import("../src/app/App.tsx");
  const root = createRoot(document.getElementById("root")!);
  const tick = () => new Promise(r => setTimeout(r, 30));
  const click = async (label: string) => { const element = [...document.querySelectorAll("button")].find(e => e.textContent?.trim() === label) as HTMLButtonElement; assert.ok(element, `button: ${label}`); assert.equal(element.disabled, false, `enabled: ${label}`); await act(async () => { element.click(); await tick(); }); };
  try {
    await act(async () => { root.render(createElement(App)); await tick(); });
    assert.ok(document.querySelector(".grid-cols-3")); assert.ok(document.body.textContent?.includes("Web3 마켓")); assert.ok(!document.body.textContent?.includes("Neon Cascade"));
    await click("지갑 연결"); await click("🦊MetaMaskBrowser Extension");
    await click("Upload");
    const fileInput = document.getElementById("audio-upload")!; Object.defineProperty(fileInput, "files", { value: [new dom.window.File(["TEST_ONLY"], "Original.wav", { type: "audio/wav" })] });
    await act(async () => { fileInput.dispatchEvent(new dom.window.Event("change", { bubbles: true })); await tick(); });
    await click("AI 검증 시작"); assert.ok(document.body.textContent?.includes("AI 검증 결과"));
    await click("IPFS 저장 · 지갑으로 온체인 등록"); assert.ok(document.body.textContent?.includes("온체인 등록 완료")); assert.equal(sent.length, 1);
    await click("새 음원 업로드"); await click("Dashboard"); await click("OriginalPASS미분류·TEST_CLAP·" + track.createdAt.slice(0, 10) + "미판매");
    assert.ok(document.querySelector(".grid-cols-3")); await click("가격 설정 · 판매 시작"); assert.equal(sent.length, 2);
    await click("로그아웃");
    for (const [label, value] of [["이메일", "buyer@test.local"], ["비밀번호", "test-password-123"]]) {
      const field = document.querySelector(`[aria-label="${label}"]`) as HTMLInputElement;
      await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(field, value); field.dispatchEvent(new dom.window.Event("input", { bubbles: true })); });
    }
    await act(async () => { document.querySelector("form")!.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })); await tick(); });
    await click("지갑 연결"); await click("🦊MetaMaskBrowser Extension");
    await click("라이선스 구매"); assert.ok(document.querySelector(".grid-cols-5")); assert.ok(document.body.textContent?.includes("Original"));
    await click("지갑으로 결제"); assert.equal(sent.length, 3); assert.ok(document.body.textContent?.includes("확인 대기")); assert.ok(!document.body.textContent?.includes("결제 · 라이선스 발급 확인 완료"));
    await click("다시 전송하지 않고 확인"); assert.equal(sent.length, 3, "receipt retry must not submit another purchase"); assert.ok(document.body.textContent?.includes("결제 · 라이선스 발급 확인 완료"));
    await click("라이선스 영수증 보기 →"); assert.ok(document.body.textContent?.includes("라이선스 발급을 확인했습니다")); assert.ok(document.body.textContent?.includes("NFT Token ID"));
    assert.ok(calls.includes("POST /api/tracks/42/metadata/upload")); assert.ok(calls.includes("POST /api/licenses/purchase/confirm"));
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});
