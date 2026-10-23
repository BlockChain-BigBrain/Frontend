import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { auth } from "./api";
import { AuthError, type User } from "./auth";
import { api, publicApi, connectWallet, sendTransaction, readPending, savePending, confirmPending, type ChainTransaction, type PendingTransaction } from "./api/service";
import { trackView, type TrackView } from "./domain";
const errorText = (e: unknown) => e instanceof Error ? e.message : "요청을 완료하지 못했습니다.";
function useController() {
  const [user, setUser] = useState<User | null>(null), [authLoading, setAuthLoading] = useState(true);
  const [wallet, setWallet] = useState(""), [busy, setBusy] = useState(""), [error, setError] = useState(""), [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<TrackView[]>([]), [mine, setMine] = useState<TrackView[]>([]), [listings, setListings] = useState<any[]>([]);
  const [selected, setSelected] = useState<TrackView | null>(null), [verification, setVerification] = useState<any>(null), [chain, setChain] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]), [transactions, setTransactions] = useState<any[]>([]), [revenue, setRevenue] = useState<any>(null), [receipt, setReceipt] = useState<any>(null);
  const [pending, setPending] = useState<PendingTransaction[]>([]), [draftId, setDraftId] = useState<number | null>(null);
  const lock = useRef(false), generation = useRef(0);
  async function refresh(who: User | null = user) {
    const epoch = generation.current; setLoading(true);
    try {
      const market = await publicApi("/api/market/tracks?limit=100");
      if (epoch !== generation.current) return;
      setTracks(market.items.map((x: any) => trackView(x.track, x)));
      if (who) {
        const [owned, sales, bound, nft, tx] = await Promise.all([api("/api/tracks?scope=mine&limit=100"), api("/api/market/tracks?scope=mine&limit=100"), api("/api/users/me/wallet"), api("/api/users/me/licenses?limit=100"), api("/api/users/me/transactions?limit=100")]);
        const details = await Promise.all((Array.isArray(owned) ? owned : owned.items).map((x: any) => api(`/api/tracks/${x.id}`)));
        const balance = bound.walletAddress ? await api("/api/users/me/revenue") : null;
        if (epoch !== generation.current) return;
        setMine(details.map(x => trackView(x, sales.items.find((l: any) => l.trackId === x.id && l.status !== "INACTIVE"))));
        setListings(sales.items); setWallet(bound.walletAddress || ""); setLicenses(nft.items); setTransactions(tx.items); setRevenue(balance); setPending(readPending(who.id));
      }
    } finally { if (epoch === generation.current) setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    const returned = new URLSearchParams(window.location.search).get("login") === "success";
    auth.me().then(async who => { if (active) { setUser(who); await refresh(who); } }).catch(e => { if (active && (!(e instanceof AuthError) || returned)) setError(errorText(e)); }).finally(() => active && setAuthLoading(false));
    refresh(null).catch(e => active && setError(errorText(e)));
    return () => { active = false; generation.current++; };
  }, []);
  async function operation<T>(label: string, action: () => Promise<T>): Promise<T> {
    if (lock.current) throw new Error("진행 중인 작업을 기다려 주세요.");
    lock.current = true; setBusy(label); setError("");
    try { return await action(); } catch (e) { setError(errorText(e)); throw e; } finally { lock.current = false; setBusy(""); if (user) setPending(readPending(user.id)); }
  }
  async function select(view: TrackView) {
    const track = user ? await api(`/api/tracks/${view.id}`) : await publicApi(`/api/tracks/${view.id}`);
    setSelected(trackView(track, view.listing)); setVerification(track.verifications?.[0] || null);
    setChain(user?.id === track.ownerId ? await api(`/api/tracks/${view.id}/blockchain`) : { registrationStatus: track.registrationStatus, txHash: track.registrationTxHash, blockchainTrackId: track.blockchainTrackId });
  }
  async function bind() { if (!user) throw new Error("먼저 로그인해 주세요."); const address = await connectWallet(); setWallet(address); return address; }
  async function send(tx: ChainTransaction, endpoint: string, body: Record<string, unknown>, label: string) {
    if (!user || !wallet) throw new Error("로그인 후 지갑을 연결해 주세요.");
    if (!tx) throw new Error("거래 데이터가 준비되지 않았습니다.");
    if (readPending(user.id).some(p => p.endpoint === endpoint && JSON.stringify(p.body) === JSON.stringify(body))) throw new Error("이미 전송한 거래가 있습니다. 확인 대기 목록에서 결과를 확인해 주세요.");
    const hash = await sendTransaction(tx); const item = { hash, endpoint, body, label };
    savePending(user.id, item); setPending(readPending(user.id));
    const result = await confirmPending(user.id, item); setPending(readPending(user.id)); return result;
  }
  async function verifyDraft(form: FormData) {
    if (!user || !wallet) throw new Error("로그인 후 지갑을 연결해 주세요.");
    let id = draftId;
    if (!id) { const track = await api("/api/tracks", form); id = track.id; setDraftId(id); }
    const track = await api(`/api/tracks/${id}`);
    if (!track.contributionsFinalizedAt) await api(`/api/tracks/${id}/contributors/finalize`, {});
    const verified = track.verifications?.some((x: any) => x.status === "VERIFIED");
    const result = await api(`/api/tracks/${id}/${verified ? "reverify" : "verify"}`, {});
    await select(trackView(await api(`/api/tracks/${id}`))); await refresh();
    if (result.status !== "VERIFIED") throw new Error(`AI 검증 실패: ${result.errorCode || "서버를 확인해 주세요"}`);
    return result;
  }
  async function register(view = selected) {
    if (!view) throw new Error("등록할 음원을 선택해 주세요.");
    const id = view.id, current = await api(`/api/tracks/${id}/blockchain`);
    if (current.registrationStatus !== "REGISTERED") {
      if (current.registrationStatus !== "PENDING") { await api(`/api/tracks/${id}/metadata/prepare`, {}); await api(`/api/tracks/${id}/metadata/upload`, {}); }
      const packet = await api(`/api/tracks/${id}/registration-payload`, {});
      if (!packet.ready) throw new Error(`등록 준비 필요: ${(packet.missing || []).join(", ")}`);
      await send(packet.transaction, `/api/tracks/${id}/registration/confirm`, {}, `음원 ${id} 등록`);
    }
    await select(view); await refresh();
    return api(`/api/tracks/${id}/blockchain`);
  }
  async function setPrice(price: string) {
    if (!selected) throw new Error("음원을 선택해 주세요.");
    const sales = await api("/api/market/tracks?scope=mine&limit=100");
    let listing = sales.items.find((x: any) => x.trackId === selected.id && x.status !== "INACTIVE");
    if (!listing) listing = await api("/api/market/tracks", { trackId: selected.id, price, currency: "ETH", licenseType: "COMMERCIAL" });
    const packet = await api(`/api/market/tracks/${listing.id}/price-payload`, { price });
    await send(packet.transaction, `/api/market/tracks/${listing.id}/price/confirm`, {}, `음원 ${selected.id} 가격 설정`);
    await refresh(); await select({ ...selected, listing: await api(`/api/market/tracks/${listing.id}`) });
  }
  async function buy() {
    if (!selected?.listing || !user) throw new Error("로그인 후 판매 중인 음원을 선택해 주세요.");
    const key = `track-ai-buy:${user.id}:${selected.id}`; let idempotencyKey = localStorage.getItem(key);
    if (!idempotencyKey) { idempotencyKey = crypto.randomUUID(); localStorage.setItem(key, idempotencyKey); }
    const packet = await api("/api/licenses/purchase", { trackId: selected.id, idempotencyKey });
    const result = await send(packet.transaction, "/api/licenses/purchase/confirm", { requestId: packet.id }, `음원 ${selected.id} 구매`);
    setReceipt(result); await refresh(); return result;
  }
  async function withdraw() {
    const packet = await api("/api/revenue/withdraw", { idempotencyKey: crypto.randomUUID() });
    const result = await send(packet.transaction, "/api/revenue/withdraw/confirm", { requestId: packet.id }, "수익 출금"); await refresh(); return result;
  }
  async function logout() { await auth.logout(); generation.current++; setUser(null); setWallet(""); setMine([]); setListings([]); setLicenses([]); setTransactions([]); setRevenue(null); setPending([]); setSelected(null); setVerification(null); setChain(null); setReceipt(null); setDraftId(null); }
  async function retry(item: PendingTransaction) { if (!user) throw new Error("로그인이 필요합니다."); const result = await confirmPending(user.id, item); if (item.endpoint === "/api/licenses/purchase/confirm") setReceipt(result); await refresh(); if (selected) await select(selected); }
  return { user, setUser, authLoading, wallet, busy, error, setError, loading, tracks, mine, listings, selected, verification, chain, licenses, transactions, revenue, receipt, pending, draftId, setDraftId, refresh, operation, select, bind, verifyDraft, register, setPrice, buy, withdraw, logout, retry };
}
const ServiceContext = createContext<ReturnType<typeof useController> | null>(null);
export function ServiceProvider({ children }: { children: ReactNode }) { const service = useController(); return <ServiceContext.Provider value={service}>{children}</ServiceContext.Provider>; }
export function useService() { const value = useContext(ServiceContext); if (!value) throw new Error("Missing ServiceProvider"); return value; }
