import { VerificationEvidence } from "./VerificationEvidence";
import { auth } from "../api";
import { useState, type FormEvent } from "react";
import { useService } from "../integration";
import { api, passwordAuth } from "../api/service";
export const liveButton = "px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed";
export function ReportPanel() {
  const s = useService();
  return <VerificationEvidence verification={s.verification} />;
}
export function SessionPanel() {
  const s = useService(), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [name, setName] = useState(""), [signup, setSignup] = useState(false);
  if (s.user || s.authLoading) return null;
  const submit = (e: FormEvent) => { e.preventDefault(); void s.operation("로그인 중", async () => { if (signup) await passwordAuth("signup", email, password, name); await passwordAuth("login", email, password, name); const who = await auth.me(); s.setUser(who); setPassword(""); await s.refresh(who); }).catch(() => undefined); };
  const input = "rounded-lg border border-[#30363d] bg-[#1c2128] p-2 text-xs text-white";
  return <div className="max-w-6xl mx-auto px-6 pt-20"><form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border border-[#21262d] bg-[#161b22] p-4"><label className="text-xs text-[#9CA3AF]">이메일<input aria-label="이메일" type="email" required className={`${input} block mt-1`} value={email} onChange={e => setEmail(e.target.value)}/></label><label className="text-xs text-[#9CA3AF]">비밀번호<input aria-label="비밀번호" type="password" minLength={8} required className={`${input} block mt-1`} value={password} onChange={e => setPassword(e.target.value)}/></label>{signup && <label className="text-xs text-[#9CA3AF]">닉네임<input required className={`${input} block mt-1`} value={name} onChange={e => setName(e.target.value)}/></label>}<button className={liveButton} disabled={!!s.busy}>{signup ? "가입 후 로그인" : "로그인"}</button><button type="button" onClick={() => setSignup(!signup)} className="p-2 text-xs text-blue-400">{signup ? "기존 계정 로그인" : "회원가입"}</button></form></div>;
}
export function PendingPanel() {
  const s = useService();
  if (!s.pending.length) return null;
  return <div className="max-w-6xl mx-auto px-6 pt-20"><section className="rounded-xl border border-amber-500/30 bg-[#161b22] p-4"><h3 className="mb-3 text-sm text-amber-400">전송 내역 · 확인 대기</h3>{s.pending.map(p => <div className="mb-3" key={p.hash}><p className="text-xs">{p.label}</p><code className="block text-xs break-all text-[#9CA3AF] my-2">{p.hash}</code><button className={liveButton} disabled={!!s.busy} onClick={() => void s.operation("영수증 확인 중", () => s.retry(p)).catch(() => undefined)}>다시 전송하지 않고 확인</button></div>)}</section></div>;
}
export function CreatorActions() {
  const s = useService(), [price, setPrice] = useState("0.001");
  if (!s.selected || s.selected.raw.ownerId !== s.user?.id) return null;
  const id = s.selected.id, v = s.verification, reviewing = v?.duplicate || v?.evidence?.reviewRequired || v?.riskStatus === "HOLD";
  const perform = (label: string, action: () => Promise<unknown>) => void s.operation(label, action).catch(() => undefined);
  return <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5 space-y-3"><h3 className="text-sm font-semibold text-white">음원 등록 · 판매 설정</h3><p className="text-xs text-[#9CA3AF]">{s.chain?.registrationStatus || "미등록"}</p>{s.chain?.registrationStatus !== "REGISTERED" ? <><button className={liveButton} disabled={!!s.busy || !s.wallet || s.chain?.registrationStatus === "PENDING"} onClick={() => perform("AI 검증 중", async () => { if (!s.selected!.raw.contributionsFinalizedAt) await api(`/api/tracks/${id}/contributors/finalize`, {}); await api(`/api/tracks/${id}/${v?.status === "VERIFIED" ? "reverify" : "verify"}`, {}); await s.select(s.selected!); await s.refresh(); })}>기여도 확정 · AI 검증</button><button className={`${liveButton} ml-2`} disabled={!!s.busy || !s.wallet || v?.status !== "VERIFIED" || reviewing} onClick={() => perform("IPFS 저장 · 등록 중", () => s.register())}>IPFS 저장 · 온체인 등록</button></> : <><label className="block text-xs text-[#9CA3AF]">판매 가격 (로컬 ETH)<input aria-label="판매 가격" className="block w-full mt-2 rounded-lg border border-[#30363d] bg-[#1c2128] p-2 text-white" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)}/></label><button className={liveButton} disabled={!!s.busy || !s.wallet} onClick={() => perform("판매 가격 확인 중", () => s.setPrice(price))}>가격 설정 · 판매 시작</button></>}<code className="block break-all text-[10px] text-blue-400">{s.chain?.txHash}</code></div>;
}
