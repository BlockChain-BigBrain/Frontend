import { useState, useEffect, useRef } from "react";
import { auth } from "../api";
import { ServiceProvider, useService } from "../integration";
import { API_BASE } from "../api/service";
import { creatorRows, type TrackView } from "../domain";
import { ReportPanel, SessionPanel, PendingPanel, CreatorActions, liveButton } from "../components/LivePanels";
import { AuthError, type User } from "../auth";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Screen = "marketplace" | "upload" | "detail" | "dashboard" | "checkout" | "certificate";
type UploadStage = "idle" | "ai_checking" | "ai_pass" | "ai_fail" | "signing" | "done";
type LicenseType = "standard" | "exclusive";
type CheckoutStage = "summary" | "signing" | "confirmed";

type TrackData = TrackView;

// ─── Badge ──────────────────────────────────────────────────────────────────────
function Badge({ children, variant = "verified" }: {
  children: React.ReactNode;
  variant?: "verified" | "primary" | "muted" | "warning" | "danger";
}) {
  const styles = {
    verified: "border border-emerald-500 text-emerald-400 bg-emerald-500/10",
    primary: "border border-blue-500 text-blue-400 bg-blue-500/10",
    muted: "border border-[#30363d] text-[#9CA3AF] bg-[#161b22]",
    warning: "border border-amber-500 text-amber-400 bg-amber-500/10",
    danger: "border border-red-500 text-red-400 bg-red-500/10",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-mono ${styles[variant]}`}>
      {children}
    </span>
  );
}

// ─── Waveform ───────────────────────────────────────────────────────────────────
function Waveform({ color = "#2f80ed", playing = false, seed = 0 }: {
  color?: string; playing?: boolean; seed?: number;
}) {
  const base = [14, 24, 32, 20, 38, 28, 16, 36, 22, 30, 18, 26];
  const heights = base.map((h, i) => {
    const r = ((seed * 17 + i * 31) % 22) - 11;
    return Math.max(6, Math.min(42, h + r));
  });
  return (
    <div className="flex items-center gap-[3px] h-10">
      {heights.map((h, i) => (
        <div key={i} className="w-[3px] rounded-full transition-all" style={{
          height: h, background: color, opacity: playing ? 1 : 0.45,
          animation: playing ? `wave 1.2s ease-in-out ${(i * 0.08).toFixed(2)}s infinite` : "none",
        }} />
      ))}
    </div>
  );
}

// ─── How It Works Modal ─────────────────────────────────────────────────────────
function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-[540px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-white">서비스 작동 방식</h3>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="space-y-4">
          {[
            { num: "01", title: "AI 유사도 검증", desc: "Audio Fingerprint로 동일 파일을 먼저 검사하고, LAION-CLAP 512-dim 임베딩으로 등록 음원과의 음향 유사도를 비교합니다.", icon: "01", color: "#2f80ed" },
            { num: "02", title: "온체인 기록", desc: "음원과 검증 메타데이터를 IPFS에 저장하고 Hardhat에 등록 증명을 기록합니다.", icon: "02", color: "#7c3aed" },
            { num: "03", title: "라이선스·자동 정산", desc: "구매자에게 상업 이용 라이선스 영수증을 발급하고, 확정된 기여도 비율대로 수익을 자동 분배합니다.", icon: "03", color: "#10b981" },
          ].map((s, i, arr) => (
            <div key={s.num} className="flex gap-4">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border" style={{ background: `${s.color}15`, borderColor: `${s.color}40` }}>{s.icon}</div>
                {i < arr.length - 1 && <div className="w-px flex-1 bg-[#21262d] min-h-[16px]"></div>}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono" style={{ color: s.color }}>Step {s.num}</span>
                  <span className="text-sm font-semibold text-white">{s.title}</span>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="text-xs font-semibold text-amber-400 mb-2">한계와 안내</div>
          <ul className="space-y-1 text-xs text-[#9CA3AF] list-disc pl-4">
            <li>유사도는 음향적 비교이며 법적 표절 판단이 아닙니다.</li>
            <li>AI 서버가 보유한 기준 코퍼스와 비교합니다.</li>
            <li>검토가 필요한 WARN/HOLD는 자동 등록을 보류합니다.</li>
          </ul>
        </div>
        <div className="mt-4 pt-4 border-t border-[#21262d]">
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            Hardhat localhost · 브라우저 지갑 · 실제 AI 서버
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GNB ───────────────────────────────────────────────────────────────────────
function GNB({ screen, setScreen, walletConnected, setWalletConnected, showWalletModal, setShowWalletModal, showHowItWorks, setShowHowItWorks, user, authLoading, onLogout }: {
  screen: Screen; setScreen: (s: Screen) => void;
  walletConnected: boolean; setWalletConnected: (v: boolean) => void;
  showWalletModal: boolean; setShowWalletModal: (v: boolean) => void;
  showHowItWorks: boolean; setShowHowItWorks: (v: boolean) => void;
  user: User | null; authLoading: boolean; onLogout: () => void;
}) {
  const service = useService();
  const navItems: { id: Screen; label: string }[] = [
    { id: "marketplace", label: "Explore" },
    { id: "upload", label: "Upload" },
    { id: "dashboard", label: "Dashboard" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 mr-8">
          <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10 Q7 2 12 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              <circle cx="7" cy="5" r="1.5" fill="white"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Track-AI</span>
        </div>
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setScreen(item.id)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${screen === item.id ? "text-white bg-[#21262d]" : "text-[#9CA3AF] hover:text-[#e6edf3]"}`}>
              {item.label}
            </button>
          ))}
          <button onClick={() => setShowHowItWorks(true)} className="px-3 py-1.5 rounded text-sm transition-colors text-[#9CA3AF] hover:text-[#e6edf3]">
            How it works
          </button>
        </nav>
        <div className="flex items-center gap-2">
          {authLoading ? <span className="text-xs text-[#9CA3AF]">로그인 확인 중...</span> : user ? <><span className="text-xs text-[#e6edf3]" title={user.email}>{user.nickname}님 · ID {user.id}</span><button disabled={!!service.busy} onClick={onLogout} className="px-3 py-1.5 rounded bg-[#161b22] border border-[#30363d] text-[#9CA3AF] text-xs">로그아웃</button><button disabled={!!service.busy} onClick={() => void service.operation("새로고침 중", () => service.refresh()).catch(() => undefined)} className="text-xs text-[#9CA3AF]">새로고침</button></> : <a href={auth.loginUrl} className="flex items-center gap-2 px-3 py-1.5 rounded bg-white hover:bg-gray-100 text-gray-800 text-xs font-medium transition-colors border border-gray-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            구글로 3초 만에 시작하기
          </a>}
          {walletConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#161b22] border border-[#30363d]">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-mono text-[#e6edf3]">{service.wallet.slice(0, 6)}...{service.wallet.slice(-4)}</span>
            </div>
          ) : (
            <button onClick={() => setShowWalletModal(true)} className="px-4 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors">
              지갑 연결
            </button>
          )}
        </div>
      </header>

      {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}

      {showWalletModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWalletModal(false)}>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-[360px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">지갑 연결</h3>
              <button onClick={() => setShowWalletModal(false)} className="text-[#9CA3AF] hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="space-y-2">
              {[
                { name: "Web3Auth (Google)", icon: "🔵", desc: "준비 중" },
                { name: "MetaMask", icon: "🦊", desc: "Browser Extension" },
                { name: "WalletConnect", icon: "🔗", desc: "준비 중" },
              ].map(w => (
                <button key={w.name} disabled={!!service.busy || w.name !== "MetaMask"} onClick={() => void service.operation("지갑 소유 확인 서명 중", async () => { await service.bind(); setShowWalletModal(false); }).catch(() => undefined)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1c2128] hover:bg-[#21262d] border border-[#30363d] transition-colors">
                  <span className="text-xl">{w.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">{w.name}</div>
                    <div className="text-xs text-[#9CA3AF]">{w.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Track Card ─────────────────────────────────────────────────────────────────
function TrackCard({ track, onClick, onBuy }: { track: TrackData; onClick: () => void; onBuy: () => void }) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const service = useService();
  const play = () => { if (!audio.current) return; if (playing) audio.current.pause(); else void audio.current.play().catch(() => service.setError("오디오를 재생하지 못했습니다.")); };
  const isPass = track.status === "pass";
  const isWarn = track.status === "warn";
  const isHold = track.status === "hold";
  const isChecking = track.status === "checking";
  const statusColor = isPass ? "#10b981" : isWarn ? "#f59e0b" : isHold ? "#f97316" : "#2f80ed";
  const statusLabel = isPass ? "PASS" : isWarn ? "WARN" : isHold ? "HOLD" : "검증 중";

  return (
    <div onClick={onClick}
      className={`bg-[#161b22] border rounded-xl overflow-hidden transition-all group cursor-pointer ${isHold ? "border-orange-500/40" : isWarn ? "border-amber-500/30" : "border-[#21262d] hover:border-[#30363d]"}`}>
      <audio ref={audio} src={`${API_BASE}/api/tracks/${track.id}/audio`} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      <div className="h-28 bg-gradient-to-br from-[#1c2128] to-[#0d1117] relative flex items-center justify-center">
        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at 30% 50%, ${statusColor}33 0%, transparent 70%)` }} />
        {!isChecking ? (
          <button onClick={e => { e.stopPropagation(); play(); }}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors z-10">
            {playing ? <svg width="12" height="12" viewBox="0 0 12 12" fill="white"><rect x="1" y="1" width="4" height="10" rx="1"/><rect x="7" y="1" width="4" height="10" rx="1"/></svg>
              : <svg width="12" height="12" viewBox="0 0 12 12" fill="white"><path d="M3 2L10 6L3 10V2Z"/></svg>}
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center z-10 border border-blue-500/30 bg-blue-500/10">
            <div className="w-4 h-4 rounded-full border border-blue-400 border-t-transparent animate-spin"></div>
          </div>
        )}
        <div className="absolute bottom-3 left-4 right-4">
          <Waveform seed={track.id} playing={playing} color={statusColor} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{track.title}</h3>
            <span className="text-xs text-[#9CA3AF] font-mono">{track.model}</span>
          </div>
          <div>
            <Badge variant={isPass ? "verified" : isWarn ? "warning" : isHold ? "danger" : "primary"}>
              {track.similarity == null ? statusLabel : `${statusLabel} · 유사도 ${(track.similarity / 100).toFixed(2)}`}
            </Badge>
          </div>
        </div>
        {track.note && (
          <div className={`text-[10px] font-mono rounded px-2 py-1 mb-2 border ${isHold ? "text-orange-400 bg-orange-500/5 border-orange-500/20" : "text-amber-400 bg-amber-500/5 border-amber-500/20"}`}>
            {track.note}
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#9CA3AF] bg-[#1c2128] px-2 py-0.5 rounded font-mono">{track.genre}</span>
          {!isChecking && <span className="text-xs text-[#9CA3AF]">▶ {track.plays}</span>}
          <span className="text-xs text-[#9CA3AF] ml-auto">👥 {track.contributors ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-[#21262d]">
          <div>
            {!isChecking ? <div className="text-sm font-semibold text-white">{track.price}</div>
              : <div className="text-xs text-[#9CA3AF] font-mono">검증 진행 중</div>}
          </div>
          {(isPass || isWarn) && (
            <button onClick={e => { e.stopPropagation(); onBuy(); }}
              className="px-3 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white text-xs font-medium transition-all">
              {isWarn ? "ⓘ 라이선스 구매" : "라이선스 구매"}
            </button>
          )}
          {isHold && <div className="flex gap-1"><button onClick={e => { e.stopPropagation(); onClick(); }} className="px-2 py-1.5 rounded border border-orange-500/30 text-orange-400 text-[10px]">근거 보기</button><button disabled title="검토 승인 기능 준비 중" className="px-2 py-1.5 rounded border border-[#30363d] text-[#9CA3AF] text-[10px] opacity-40">이의 제기</button></div>}
        </div>
        {track.similarity != null && <div className="mt-3"><div className="relative h-1 rounded-full bg-[#30363d]"><div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, track.similarity))}%`, background: statusColor }}/></div><div className="flex justify-between text-[9px] text-[#6B7280] font-mono mt-1"><span>유사도 0</span><span>1</span></div></div>}
      </div>
    </div>
  );
}

// ─── Marketplace ────────────────────────────────────────────────────────────────
function MarketplaceScreen({ setScreen, tracks, loading, error }: { setScreen: (s: Screen) => void; tracks: TrackData[]; loading: boolean; error: string }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const genres = ["All", "미분류"];
  const service = useService();
  const displayedTracks = tracks;
  const filtered = displayedTracks.filter(t =>
    (filter === "All" || t.genre === filter) &&
    (search === "" || t.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="pt-14 min-h-screen">
      <div className="px-6 py-12 border-b border-[#21262d]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#30363d] bg-[#161b22] text-xs text-[#9CA3AF] font-mono mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            Hardhat localhost · Chain ID 31337
            <span className="text-[9px] text-blue-400 border border-blue-500/30 rounded px-1">실제 연결 데이터</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            AI 음원의 상업적 이용권을 거래하는<br />
            <span className="text-blue-400">Web3 마켓</span>
          </h1>
          <p className="text-[#9CA3AF] text-sm mb-2 max-w-2xl mx-auto">
            유사도 리스크 확인, 온체인 기록, 합의 비율 정산으로 구매자에게는 라이선스 영수증을, 창작자에게는 투명한 수익 정산을 제공합니다.
          </p>
          <p className="text-[#6B7280] text-[10px] mb-7 max-w-2xl mx-auto">
            유사도는 음향적 비교이며 법적 표절 판단이 아닙니다. AI 서버가 보유한 기준 코퍼스와 비교합니다.
          </p>
          <div className="relative max-w-lg mx-auto">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="트랙 제목, AI 모델, 장르 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#161b22] border border-[#30363d] text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>
      </div>
      <div className="border-b border-[#21262d] bg-[#0d1117]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6 text-xs font-mono text-[#9CA3AF]">
          {[["판매 중인 음원", String(tracks.length)], ["확인 범위", "현재 조회 목록"], ["결제 통화", "로컬 ETH"]].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2"><span>{k}</span><span className="text-white font-semibold">{v}</span><span className="text-[9px] text-blue-400">실제 연결 데이터</span></div>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            ["01", "유사도 검증", "Fingerprint + LAION-CLAP"],
            ["02", "온체인 기록", "등록 증명 · 구매 시 ERC-1155"],
            ["03", "라이선스 영수증", "EIP-712 · 자동 정산"],
          ].map(([n, title, desc]) => (
            <div key={n} className="flex items-center gap-3 rounded-lg border border-[#21262d] bg-[#161b22] px-4 py-3">
              <span className="text-xs font-mono text-blue-400">{n}</span>
              <div><div className="text-xs font-semibold text-white">{title}</div><div className="text-[10px] text-[#9CA3AF] font-mono">{desc}</div></div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-6">
          {genres.map(g => (
            <button key={g} onClick={() => setFilter(g)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filter === g ? "bg-blue-500 text-white" : "bg-[#161b22] text-[#9CA3AF] hover:text-white border border-[#21262d] hover:border-[#30363d]"}`}>
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 mb-3 rounded-lg border border-[#21262d] bg-[#161b22] px-3 py-2 text-[10px] text-[#9CA3AF]">
          <span><b className="text-emerald-400">PASS</b> 정산 정상</span>
          <span><b className="text-amber-400">WARN</b> 구매자 확인 필요</span>
          <span><b className="text-orange-400">HOLD</b> 등록 검토 필요</span>
          <span className="ml-auto font-mono">판정 근거는 상세 화면에서 확인</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {loading && <p className="col-span-3 text-sm text-[#9CA3AF]">트랙을 불러오는 중...</p>}
          {error && <p role="alert" className="col-span-3 text-sm text-red-400">{error}</p>}
          {!loading && !error && tracks.length === 0 && <p className="col-span-3 text-sm text-[#9CA3AF]">등록된 트랙이 없습니다.</p>}
          {filtered.map(track => (
            <TrackCard key={track.id} track={track} onClick={() => void service.operation("음원 조회 중", async () => { await service.select(track); setScreen("detail"); }).catch(() => undefined)} onBuy={() => void service.operation("주문 조회 중", async () => { await service.select(track); setScreen("checkout"); }).catch(() => undefined)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI Checking View ───────────────────────────────────────────────────────────
function AICheckingView({ fileName }: { fileName: string }) {
  const service = useService();
  return <div className="pt-14 min-h-screen"><div className="max-w-3xl mx-auto px-6 py-12"><div className="bg-[#161b22] border border-blue-500/30 rounded-2xl p-8 text-center"><div className="mx-auto mb-5 h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"/><h2 className="text-xl font-bold text-white">AI 유사도 검증</h2><p className="mt-3 text-sm text-[#9CA3AF]">{fileName}</p><p role="status" className="mt-5 text-sm text-blue-400">{service.busy || "실제 분석 결과를 기다리고 있습니다."}</p><p className="mt-3 text-xs text-[#6B7280]">음원 길이와 서버 상태에 따라 몇 분 걸릴 수 있습니다.</p></div></div></div>;
}
function AIPassView({ onSign, onReset }: { onSign: () => void; onReset: () => void }) {
  const service = useService();
  return <div className="pt-14 min-h-screen"><div className="max-w-3xl mx-auto px-6 py-8 space-y-5"><div className="bg-[#161b22] border border-emerald-500/30 rounded-2xl p-6"><h2 className="text-xl font-bold text-white mb-5">AI 검증 결과</h2><ReportPanel/></div><p className="text-xs text-[#9CA3AF]">등록을 승인하면 공개 IPFS에 음원과 메타데이터를 저장합니다. 프롬프트와 작업 기록은 기본적으로 공개하지 않습니다.</p><button className={liveButton} disabled={!!service.busy} onClick={onSign}>IPFS 저장 · 지갑으로 온체인 등록</button><button onClick={onReset} className="ml-3 text-sm text-[#9CA3AF]">돌아가기</button></div></div>;
}
function AIFailView({ onReset }: { onReset: () => void }) {
  return <div className="pt-14 min-h-screen"><div className="max-w-3xl mx-auto px-6 py-8 space-y-5"><div className="bg-[#161b22] border border-orange-500/30 rounded-2xl p-6"><h2 className="mb-5 text-xl font-bold text-white">등록 보류 · 검증 결과 확인</h2><ReportPanel/></div><button onClick={onReset} className={liveButton}>새 음원 선택</button></div></div>;
}

// ─── Upload Screen ──────────────────────────────────────────────────────────────
function UploadScreen({ onUploaded }: { onUploaded: () => void }) {
  const service = useService();
  const [stage, setStage] = useState<UploadStage>("idle");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [prompt, setPrompt] = useState("Pulsing neon synth with driving 4/4 beat, hypnotic arpeggios, and late-night Tokyo cityscape vibes for a commercial trailer");
  const [platform, setPlatform] = useState("Suno v4.5");
  const [promptWeight, setPromptWeight] = useState(70);
  const [voiceWeight, setVoiceWeight] = useState(0);
  const [voiceAddress, setVoiceAddress] = useState("");
  const [voiceInvited, setVoiceInvited] = useState(false);
  const [voiceSigned, setVoiceSigned] = useState(false);
  const [projectFile, setProjectFile] = useState("");

  const editWeight = 100 - promptWeight - voiceWeight;

  const handleInvite = () => {
    setInviteError("");
    try { if (!/^[1-9]\d*$/.test(voiceAddress)) throw new Error("가입한 보이스 제공자의 사용자 ID를 입력해 주세요."); setVoiceInvited(true); }
    catch (error) { setInviteError(error instanceof Error ? error.message : "사용자 ID를 확인해 주세요."); }
  };
  const selectFile = (file?: File) => { if (file) { if (service.draftId) { setUploadError("진행 중인 음원이 있습니다. 아래 새 음원 시작을 눌러 주세요."); return; } setSelectedFile(file); setFileName(file.name); setUploadError(""); } };
  const handleAnalyze = async () => {
    if (!selectedFile || !service.user) { setUploadError("로그인 후 WAV/MP3를 선택해 주세요."); return; }
    try {
      const rows = creatorRows(service.user.id, promptWeight, voiceWeight, voiceAddress);
      const form = new FormData(); form.set("audio", selectedFile); form.set("title", selectedFile.name.replace(/\.[^.]+$/, "")); form.set("isPublic", "true"); form.set("prompt", prompt); form.set("workLog", JSON.stringify({ platform, projectFile })); form.set("contributors", JSON.stringify(rows));
      setStage("ai_checking"); setUploading(true); setUploadError("");
      const result = await service.operation("업로드 · 기여도 확정 · 실제 AI 분석 중", () => service.verifyDraft(form));
      setStage(result.duplicate || result.evidence?.reviewRequired || result.riskStatus === "HOLD" ? "ai_fail" : "ai_pass"); onUploaded();
    } catch (e) { setUploadError(e instanceof Error ? e.message : "검증에 실패했습니다."); setStage("idle"); } finally { setUploading(false); }
  };
  const handleSign = async () => {
    setUploading(true); setUploadError("");
    try { await service.operation("IPFS 저장 · 지갑 등록 · 영수증 확인 중", () => service.register()); setStage("done"); onUploaded(); }
    catch (e) { setUploadError(e instanceof Error ? e.message : "등록에 실패했습니다."); setStage("ai_pass"); }
    finally { setUploading(false); }
  };

  const handleReset = () => {
    service.setDraftId(null);
    setStage("idle");
    setFileName(""); setSelectedFile(null); setUploadError("");
    setVoiceInvited(false);
    setVoiceSigned(false);
    setVoiceAddress("");
  };

  if (stage === "ai_checking") return <AICheckingView fileName={fileName} />;
  if (stage === "ai_pass") return <AIPassView onSign={handleSign} onReset={() => setStage("idle")} />;
  if (stage === "ai_fail") return <AIFailView onReset={handleReset} />;

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-white mb-1">음원 업로드 & AI 검증</h2>
          <p className="text-sm text-[#9CA3AF]">AI 유사도 분석 후 블록체인에 창작 이력을 영구 기록합니다</p>
        </div>
        <div className="flex items-center mb-8">
          {["파일 업로드", "AI 유사도 검증", "온체인 등록"].map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              {i > 0 && <div className="flex-1 h-px bg-[#21262d]"></div>}
              <div className="flex items-center gap-2 px-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-blue-500 text-white" : "bg-[#21262d] text-[#484f58]"}`}>{i + 1}</div>
                <span className={`text-xs font-medium ${i === 0 ? "text-white" : "text-[#484f58]"}`}>{step}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-[#21262d]"></div>}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Drop zone */}
          <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files[0]); }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragging ? "border-blue-500 bg-blue-500/5" : fileName ? "border-emerald-500/40 bg-emerald-500/5" : "border-[#30363d] hover:border-[#484f58]"}`}
            onClick={() => document.getElementById("audio-upload")?.click()}>
            <input id="audio-upload" type="file" accept=".wav,.mp3" className="hidden" onChange={e => selectFile(e.target.files?.[0])} />
            {fileName ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 12V4M5 8L9 4L13 8" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 14h12" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-emerald-400">{fileName}</div>
                  <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · ${selectedFile.type || "WAV/MP3"}` : ""}</div>
                </div>
                <Waveform seed={42} color="#10b981" />
                <button onClick={e => { e.stopPropagation(); setFileName(""); setSelectedFile(null); }} className="text-xs text-[#9CA3AF] hover:text-white underline">파일 제거</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1c2128] border border-[#30363d] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 13V5M6 9L10 5L14 9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15h14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[#e6edf3]">WAV, MP3 파일을 업로드하세요</div>
                  <div className="text-xs text-[#9CA3AF] mt-1">드래그 & 드롭 또는 클릭하여 선택 · 최대 50MB</div>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-white">창작 이력 (비공개 원본 보관)</h3>
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">사용된 프롬프트 <span className="text-blue-400">*</span></label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-blue-500 resize-none font-mono text-xs leading-relaxed transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">AI 플랫폼</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  {["Suno v4.5", "Suno", "Udio v2", "Stable Audio 2.0", "MusicGen"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">라이선스 유형</label>
                <select className="w-full px-3 py-2.5 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option>COMMERCIAL</option>
                </select>
              </div>
            </div>

            {/* Contributor split */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-[#9CA3AF]">기여도 설정 (수익 분배 비율)</label>
                <span className="text-xs font-mono font-semibold text-emerald-400">합계: 100% ✓</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "프롬프트 엔지니어", value: promptWeight, onChange: (v: number) => setPromptWeight(Math.min(v, 100 - voiceWeight)), color: "#2f80ed" },
                  { label: "보이스 제공자", value: voiceWeight, onChange: (v: number) => setVoiceWeight(Math.min(v, 100 - promptWeight)), color: "#7c3aed" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-xs text-[#e6edf3] w-32">{s.label}</span>
                    <input type="range" min={0} max={100} value={s.value} onChange={e => s.onChange(+e.target.value)} className="flex-1 accent-blue-500" />
                    <span className="text-xs font-mono w-8 text-right" style={{ color: s.color }}>{s.value}%</span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#e6edf3] w-32">편집 기여자</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#30363d]">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${editWeight}%` }}></div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 w-8 text-right">{editWeight}%</span>
                </div>
              </div>
            </div>

            {/* Voice contributor invite */}
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">보이스 제공자 사용자 ID</label>
              <div className="flex gap-2">
                <input value={voiceAddress} onChange={e => setVoiceAddress(e.target.value)} placeholder="가입 사용자 ID (지갑 연결 필요)"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-blue-500 font-mono text-xs transition-colors" />
                <button onClick={handleInvite} disabled={!voiceAddress || voiceInvited}
                  className="px-3 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  기여자 ID 지정
                </button>
              </div>
              {inviteError && <p role="alert" className="mt-2 text-xs text-red-400">{inviteError}</p>}
              {voiceInvited && (
                <div className={`mt-2 flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${voiceSigned ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-amber-500/5 border-amber-500/20 text-amber-400"}`}>
                  {voiceSigned ? "사용자 ID 지정됨" : "기여도 확정 시 사용자와 연결 지갑을 서버에서 확인합니다"}
                </div>
              )}
            </div>

            {/* Smart contract deploy notice */}
            <p className="text-[10px] leading-relaxed text-[#6B7280] border-l-2 border-purple-500/30 pl-2.5 -mt-1">
              💡 기여자 모두 가입 후 지갑을 연결해야 합니다. 기여도 확정 후 이미 배포된 컨트랙트에 등록합니다.
            </p>

            {/* Optional work-log filename, without implying file upload support. */}
            <div><label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">작업 파일명 <span className="font-normal">(선택 · 파일명만 비공개 기록)</span></label><input value={projectFile} onChange={e => setProjectFile(e.target.value)} placeholder="DAW 세션 또는 작업 로그 파일명" className="w-full px-3 py-2.5 rounded-lg border border-dashed border-[#30363d] bg-[#1c2128] text-xs text-white"/></div>
          </div>

          {/* Verification pipeline preview */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">검증·등록 파이프라인</h3>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">서버 분석 결과와 온체인 영수증을 확인한 후에만 완료로 표시합니다.</p>
              </div>
              <div className="flex rounded-lg border border-[#30363d] p-0.5 text-[10px]">
                {["실제 파일 분석"].map((item, i) => <button type="button" disabled key={item} className={`px-2 py-1 rounded ${i === 0 ? "bg-blue-500 text-white" : "text-[#9CA3AF]"}`}>{item}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {["업로드", "AI 검증", "IPFS 저장", "EIP-712 서명", "컨트랙트 검증", "등록 확정"].map((item, i) => (
                <div key={item} className="relative rounded-lg border border-[#30363d] bg-[#1c2128] p-2.5 min-h-[78px]">
                  <span className="text-[9px] font-mono text-blue-400">0{i + 1}</span>
                  <div className="text-[10px] font-medium text-white mt-1">{item}</div>
                  <div className="text-[9px] text-[#6B7280] mt-2">처리 순서 안내</div>
                </div>
              ))}
            </div>
            <details className="mt-3 rounded-lg border border-[#30363d] bg-[#1c2128] px-3 py-2">
              <summary className="cursor-pointer text-[10px] text-[#9CA3AF]">서명 Payload 미리보기</summary>
              <div className="grid grid-cols-2 gap-1 mt-2 text-[9px] font-mono text-[#6B7280]">
                <span>signer: {service.wallet || "미연결"}</span><span>audioHash: 업로드 후 생성</span><span>score / zone: 분석 후 생성</span><span>nonce: 004892</span>
              </div>
            </details>
            <p className="text-[10px] text-[#6B7280] mt-3">서명 확인은 검증 서버가 낸 판정이라는 의미이며 판정의 정확도를 보증하지 않습니다.</p>
          </div>

          {/* Creation history and rights */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">창작 이력 및 권리 확인</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-[#9CA3AF]">생성 서비스 (참고)<select disabled className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[#1c2128] border border-[#30363d] text-white"><option>Suno</option><option>Udio</option><option>Stable Audio</option><option>기타</option></select></label>
              <label className="text-xs text-[#9CA3AF]">이용 플랜 (참고)<select disabled className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[#1c2128] border border-[#30363d] text-white"><option>유료</option><option>무료</option></select></label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["공식 다운로드 경로로 받은 곡입니다", "Remix 기능으로 만든 곡이 아닙니다", "상업적 이용이 허용된 플랜입니다"].map(label => <label key={label} className="flex gap-2 rounded-lg border border-[#30363d] p-2.5 text-[10px] text-[#9CA3AF]"><input type="checkbox" className="accent-blue-500" disabled />{label}</label>)}
            </div>
            <div className="rounded-lg border border-dashed border-[#30363d] px-3 py-2.5 text-xs text-[#9CA3AF]">프롬프트와 플랫폼 정보는 서버의 작업 기록으로 보관합니다. 권리 확인 항목과 증빙 파일 업로드는 준비 중이며 저장하지 않습니다.</div>
            <p className="text-[10px] leading-relaxed text-[#6B7280]">프롬프트와 작업 로그는 기본적으로 서버에 비공개 보관합니다. AI 검증은 창작자 여부를 보증하지 않습니다. 정산 비율은 AI가 측정한 값이 아니라 창작자가 입력하고 확정한 비율입니다. 별도의 기여도 합의 서명 수집은 지원하지 않습니다.</p>
          </div>

          {service.draftId && <button onClick={handleReset} className="text-xs text-blue-400">새 음원 시작 (기존 업로드는 대시보드에 보관)</button>}
          {uploadError && <p role="alert" className="text-sm text-red-400">{uploadError}</p>}
          <button onClick={() => void handleAnalyze()} disabled={!selectedFile || uploading || !!service.busy || !service.wallet}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
            AI 검증 시작
          </button>
        </div>
      </div>

      {stage === "signing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 w-[380px] text-center">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">🦊</div>
            <h3 className="text-base font-semibold text-white mb-2">MetaMask 서명 대기 중</h3>
            <p className="text-sm text-[#9CA3AF]">지갑에서 트랜잭션을 승인하면 등록 증명을 Hardhat 체인에 기록합니다.</p>
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 w-[420px] text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">온체인 등록 완료!</h3>
            <p className="text-sm text-[#9CA3AF] mb-4">Hardhat에 등록 증명을 기록했습니다. 라이선스 NFT는 구매할 때 발급됩니다.</p>
            <div className="bg-[#1c2128] rounded-lg p-3 text-left space-y-2 mb-5">
              {[["TX Hash", service.chain?.txHash || "—"], ["음원 ID", service.chain?.blockchainTrackId || "—"], ["IPFS CID", service.selected?.raw.metadataCid || "—"]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-xs text-[#9CA3AF] font-mono">{k}</span>
                  <span className="text-xs text-blue-400 font-mono break-all text-right max-w-[230px]">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={handleReset} className="w-full py-2.5 rounded-xl bg-[#1c2128] hover:bg-[#21262d] border border-[#30363d] text-white text-sm font-medium transition-colors">
              새 음원 업로드
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pie Chart ──────────────────────────────────────────────────────────────────
function PieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  let offset = 0;
  const r = 40, cx = 50, cy = 50;
  const paths = slices.map(s => {
    const angle = (s.value / 100) * 360;
    const startRad = ((offset - 90) * Math.PI) / 180;
    const endRad = ((offset + angle - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
    offset += angle;
    return { d, color: s.color, label: s.label, value: s.value };
  });
  return (
    <div className="flex items-center gap-5">
      <svg width="100" height="100" viewBox="0 0 100 100">{paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}</svg>
      <div className="space-y-1.5">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }}></div>
            <span className="text-xs text-[#9CA3AF]">{p.label}</span>
            <span className="text-xs font-mono text-white ml-auto">{p.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Infringement Modal ─────────────────────────────────────────────────────────
// ─── Detail Screen ──────────────────────────────────────────────────────────────
function DetailScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const service = useService(), track = service.selected;
  if (!track) return <div className="pt-24 max-w-6xl mx-auto px-6 text-[#9CA3AF]">마켓 또는 대시보드에서 음원을 선택해 주세요.</div>;
  const contributions = track.raw.contributions || [];
  return <div className="pt-14 min-h-screen">
    <div className="border-b border-[#21262d] px-6 py-3"><div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-[#9CA3AF]"><button onClick={() => setScreen("marketplace")}>Explore</button><span>/</span><span className="text-white">{track.title}</span></div></div>
    <div className="max-w-6xl mx-auto px-6 py-7"><div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-5"><div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden"><div className="h-44 bg-gradient-to-br from-[#1a1f2e] via-[#161b22] to-[#0d1117] relative flex items-end p-5"><div className="w-full"><Waveform seed={track.id}/><audio controls preload="none" src={`${API_BASE}/api/tracks/${track.id}/audio`} className="w-full mt-5"/></div></div><div className="p-5"><h1 className="text-2xl font-bold text-white">{track.title}</h1><p className="mt-2 text-xs text-[#9CA3AF] font-mono">{track.raw.owner?.name || "창작자"} · {track.model}</p><div className="mt-3"><Badge variant={track.status === "pass" ? "verified" : "warning"}>{service.verification?.evidence?.decision || track.status.toUpperCase()}</Badge></div></div></div>
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5"><h3 className="text-sm font-semibold text-white mb-4">AI 유사도 검증 리포트</h3><ReportPanel/></div>
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5"><h3 className="text-sm font-semibold text-white mb-4">기여도 · 수익 분배</h3>{contributions.length ? <PieChart slices={contributions.map((c: any, i: number) => ({ label: `${c.user?.name || `사용자 #${c.userId}`} · ${c.role}`, value: Number(c.percentage), color: ["#2f80ed", "#7c3aed", "#10b981"][i % 3] }))}/> : <p className="text-xs text-[#9CA3AF]">기여도 정보가 없습니다.</p>}</div></div>
      <div className="space-y-5"><div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 sticky top-20"><h3 className="text-sm font-semibold text-white">상업 이용 라이선스</h3><p className="mt-4 text-2xl font-bold text-white">{track.price}</p><p className="my-4 text-xs text-[#9CA3AF]">COMMERCIAL · 구매 시 ERC-1155 발급<br/>가스비는 연결한 지갑에서 확인합니다.</p><button disabled={!!service.busy || !track.listing?.purchasable} onClick={() => setScreen("checkout")} className={`${liveButton} w-full`}>라이선스 구매</button></div><CreatorActions/><div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5"><h3 className="text-sm font-semibold text-white mb-3">등록 증명</h3><dl className="space-y-2 text-xs text-[#9CA3AF] break-all"><dt>Audio SHA-256</dt><dd className="font-mono">{track.raw.audioHash || "—"}</dd><dt>IPFS CID</dt><dd className="font-mono text-blue-400">{track.raw.metadataCid || "미등록"}</dd><dt>등록 트랜잭션</dt><dd className="font-mono">{service.chain?.txHash || "미확인"}</dd></dl></div></div>
    </div></div>
  </div>;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────
function DashboardScreen({ tracks, loading, error, setScreen }: { tracks: TrackData[]; loading: boolean; error: string; setScreen: (s: Screen) => void }) {
  const service = useService();
  const [trackTab, setTrackTab] = useState<"all" | "verified" | "pending" | "rejected">("all");
  const totalEarned = service.revenue?.balances?.find((x: any) => x.currency === "ETH")?.confirmed || "0";
  const animated = false, justBought = false;
  const txns = service.transactions.map((x: any) => ({ date: x.createdAt.slice(0, 10), track: service.mine.find(t => t.id === x.trackId)?.title || `음원 #${x.trackId}`, buyer: service.wallet || "—", license: "COMMERCIAL", role: "buyer", split: "—", earned: `${x.amount} ${x.currency}`, status: x.status === "COMPLETED" ? "settled" : "pending", hash: x.txHash || "미확인" }));
  const stats = [
    { label: "총 누적 수익", value: `${totalEarned} ETH`, sub: "확인된 수익 배분", delta: "", up: false, animate: false },
    { label: "내 구매 거래", value: `${service.transactions.length}건`, sub: "현재 조회 목록", delta: "", up: false, animate: false },
    { label: "등록한 음원", value: `${tracks.length}개`, sub: "현재 조회 목록", delta: "", up: false, animate: false },
    { label: "보유 라이선스", value: `${service.licenses.filter((x: any) => x.ownershipConfirmed).length}개`, sub: "실제 민팅 확인", delta: "", up: false, animate: false },
  ];
  const filteredTracks = tracks.filter(t => trackTab === "all" || (trackTab === "verified" ? t.status === "pass" : trackTab === "pending" ? t.status === "checking" : t.status === "hold" || t.status === "warn"));

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">크리에이터 대시보드</h2>
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF] font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              실시간 정산 · 스마트 컨트랙트 자동 실행
              {justBought && <span className="text-emerald-400 ml-2">· 새 거래 확인됨</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF] bg-[#161b22] border border-[#21262d] px-3 py-1.5 rounded-lg">
            <span>지갑</span><span className="text-white">{service.wallet || "미연결"}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className={`bg-[#161b22] border rounded-xl p-4 transition-all ${s.animate ? "border-emerald-500/50 bg-emerald-500/5" : "border-[#21262d]"}`}>
              <div className="text-xs text-[#9CA3AF] mb-2">{s.label}</div>
              <div className="text-2xl font-bold text-white mb-1 font-mono">{s.value}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">{s.sub}</span>
                {s.delta && <span className={`text-xs font-mono ${s.up ? "text-emerald-400" : "text-[#9CA3AF]"}`}>{s.up ? "↑ " : ""}{s.delta}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-2 bg-[#161b22] border border-[#21262d] rounded-xl p-5"><h3 className="text-sm font-semibold text-white mb-4">보유 라이선스</h3>{service.licenses.length === 0 && <p className="text-xs text-[#9CA3AF]">아직 발급받은 라이선스가 없습니다.</p>}{service.licenses.map((l: any) => <div key={l.id} className="border-t border-[#21262d] py-3"><p className="text-sm text-white">{l.track?.title || `음원 #${l.trackId}`} · {l.type}</p><p className="text-xs text-[#9CA3AF] mt-2">{l.licenseStatus} · Token ID: {l.tokenId || "미발급"}</p><code className="text-[10px] text-blue-400 break-all">{l.purchaseTxHash || "미확인"}</code></div>)}</div>
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5"><h3 className="text-sm font-semibold text-white mb-3">출금 가능한 수익</h3><p className="text-xl font-bold font-mono text-white">{service.revenue ? `${service.revenue.available} ETH` : "지갑 연결 필요"}</p><button className={`${liveButton} mt-4`} disabled={!!service.busy || !service.wallet || !service.revenue || BigInt(service.revenue.availableWei || "0") === 0n} onClick={() => void service.operation("출금 영수증 확인 중", () => service.withdraw()).catch(() => undefined)}>지갑으로 출금</button><p className="text-[10px] text-[#6B7280] mt-3">연결된 지갑의 실제 컨트랙트 잔액입니다.</p></div>
        </div>

        {/* My Tracks with tabs */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
            <h3 className="text-sm font-semibold text-white">내 음원</h3>
            <div className="flex items-center gap-1">
              {(["all", "verified", "pending", "rejected"] as const).map(tab => (
                <button key={tab} onClick={() => setTrackTab(tab)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${trackTab === tab ? "bg-[#21262d] text-white" : "text-[#9CA3AF] hover:text-white"}`}>
                  {tab === "all" ? "전체" : tab === "verified" ? "PASS" : tab === "pending" ? "검증 중" : "HOLD"}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-[#21262d]">
            {loading && <div className="px-5 py-6 text-sm text-[#9CA3AF]">트랙을 불러오는 중...</div>}
            {error && <div role="alert" className="px-5 py-6 text-sm text-red-400">{error}</div>}
            {!loading && !error && filteredTracks.length === 0 && <div className="px-5 py-6 text-sm text-[#9CA3AF]">등록된 트랙이 없습니다.</div>}
            {filteredTracks.map((t) => (
              <button key={t.id} disabled={!!service.busy} onClick={() => void service.operation("음원 조회 중", async () => { await service.select(t); setScreen("detail"); }).catch(() => undefined)} className="w-full text-left flex items-center px-5 py-3 hover:bg-[#1c2128] transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{t.title}</span>
                    {t.status === "pass" && <Badge variant="verified">PASS</Badge>}
                    {t.status === "checking" && <Badge variant="warning">검증 중</Badge>}
                    {t.status === "hold" && <Badge variant="danger">HOLD</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#9CA3AF] font-mono">
                    <span>{t.genre}</span><span>·</span><span>{t.model}</span><span>·</span><span>{t.date}</span>
                  </div>
                </div>
                <div className="text-sm font-mono font-semibold text-emerald-400">{t.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
            <h3 className="text-sm font-semibold text-white">구매 트랜잭션 히스토리</h3>
            <span className="text-xs text-[#9CA3AF] font-mono">{txns.length}건</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#21262d]">
                {["날짜", "음원명", "구매자 지갑", "라이선스", "역할", "지분", "결제 금액", "상태 / TX"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.map((tx, i) => (
                <tr key={i} className={`border-b border-[#21262d] last:border-0 transition-colors ${tx.status === "frozen" ? "bg-amber-500/5" : i === 0 && justBought ? "bg-emerald-500/5" : "hover:bg-[#1c2128]"}`}>
                  <td className="px-5 py-3 text-xs font-mono text-[#9CA3AF]">{tx.date}</td>
                  <td className="px-5 py-3 text-xs text-white font-medium">{tx.track}</td>
                  <td className="px-5 py-3 text-xs font-mono text-blue-400">{tx.buyer}</td>
                  <td className="px-5 py-3"><Badge variant={tx.license === "Exclusive" ? "primary" : "muted"}>{tx.license}</Badge></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-mono ${tx.role === "voice" ? "text-purple-400" : "text-[#9CA3AF]"}`}>
                      {tx.role === "voice" ? "보이스" : "구매자"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-[#9CA3AF]">{tx.split}</td>
                  <td className="px-5 py-3">
                    {tx.status === "frozen"
                      ? <span className="text-xs font-mono font-semibold text-amber-400">⏸ {tx.earned} 동결</span>
                      : <span className="text-xs font-mono font-semibold text-emerald-400">{i === 0 && justBought ? "↑ " : ""}{tx.earned}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className={`text-[10px] font-medium ${tx.status === "frozen" ? "text-orange-400" : "text-emerald-400"}`}>{tx.status === "settled" ? "확인 완료" : "처리 중"}</div>
                    <div className="text-[9px] font-mono text-blue-400 mt-0.5">{tx.hash}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout ───────────────────────────────────────────────────────────────────
function CheckoutScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const service = useService(), track = service.selected;
  const [stage, setStage] = useState<CheckoutStage>("summary");
  useEffect(() => { if (service.licenses.some((x: any) => x.trackId === track?.id && x.ownershipConfirmed)) setStage("confirmed"); }, [service.licenses, track?.id]);
  if (!track?.listing) return <div className="pt-24 max-w-6xl mx-auto px-6 text-[#9CA3AF]">판매 중인 음원을 선택해 주세요.</div>;
  const handleConfirm = async () => { setStage("signing"); try { await service.operation("구매 · 민팅 · 영수증 확인 중", () => service.buy()); setStage("confirmed"); } catch { setStage("summary"); } };
  return <div className="pt-14 min-h-screen flex items-start justify-center"><div className="w-full max-w-6xl px-6 py-8 grid grid-cols-5 gap-6">
    <div className="col-span-3 space-y-4"><div className="mb-6"><div className="flex items-center gap-4 text-xs text-[#9CA3AF] mb-4 font-mono">{["주문 확인", "결제 서명", "완료"].map((x, i) => <span key={x} className={i === (stage === "summary" ? 0 : stage === "signing" ? 1 : 2) ? "text-blue-400" : ""}>{i + 1}. {x}</span>)}</div><h2 className="text-xl font-bold text-white">결제 및 스마트 컨트랙트 서명</h2></div>
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden"><div className="px-5 py-3 border-b border-[#21262d] bg-[#1c2128]"><span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">주문 내역</span></div><div className="p-5 flex items-center gap-4"><div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] flex items-center justify-center border border-[#30363d]"><Waveform seed={track.id}/></div><div><h3 className="text-base font-semibold text-white">{track.title}</h3><p className="text-xs text-[#9CA3AF] my-2">{track.raw.owner?.name} · {track.model}</p><Badge variant="verified">{service.verification?.evidence?.decision || track.status.toUpperCase()}</Badge></div></div><div className="px-5 pb-5 grid grid-cols-2 gap-2"><div className="p-3 rounded-lg border border-blue-500 bg-blue-500/5"><span className="text-xs font-semibold text-white">COMMERCIAL</span><p className="text-sm font-bold text-white mt-1">{track.price}</p></div><div className="p-3 rounded-lg border border-[#30363d] text-xs text-[#6B7280]">Exclusive · 준비 중</div></div></div>
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5"><h3 className="text-sm font-semibold text-white mb-4">결제 수단</h3><div className="rounded-lg border border-blue-500 bg-blue-500/5 p-4"><p className="text-sm text-white">🦊 연결한 브라우저 지갑</p><p className="mt-2 text-xs text-[#9CA3AF] break-all">{service.wallet || "로그인 후 지갑을 연결해 주세요."}</p></div><p className="text-[10px] text-[#6B7280] mt-3">Hardhat localhost · 로컬 ETH · 지갑에서 가스비를 확인합니다.</p></div>
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5"><h3 className="text-sm font-semibold text-white mb-4">수익 자동 분배</h3>{(track.raw.contributions || []).map((x: any) => <div key={x.id} className="flex items-center justify-between py-2 border-t border-[#21262d] text-xs"><span className="text-[#9CA3AF]">{x.user?.name || `사용자 #${x.userId}`} · {x.role}</span><span className="text-white font-mono">{x.percentage}%</span></div>)}</div>
    </div>
    <div className="col-span-2 space-y-4"><div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-4 sticky top-20"><h3 className="text-sm font-semibold text-white">결제 요약</h3><div className="space-y-2 pb-4 border-b border-[#21262d]"><div className="flex justify-between text-xs text-[#9CA3AF]"><span>COMMERCIAL 라이선스</span><span className="text-white font-mono">{track.price}</span></div><div className="flex justify-between text-xs text-[#9CA3AF]"><span>가스비</span><span>지갑에서 별도 확인</span></div></div><div className="flex justify-between items-baseline"><span className="text-sm font-semibold text-white">라이선스 결제 금액</span><span className="text-xl font-bold text-white font-mono">{track.price}</span></div>
      {stage === "summary" && <button className={`${liveButton} w-full py-3`} disabled={!!service.busy || !service.wallet || !track.listing.purchasable} onClick={() => void handleConfirm()}>지갑으로 결제</button>}
      {stage === "signing" && <div role="status" className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3 text-sm text-orange-400">지갑 승인 및 실제 채굴 결과를 기다리고 있습니다.</div>}
      {stage === "confirmed" && <div className="space-y-3"><p className="text-sm text-emerald-400">결제 · 라이선스 발급 확인 완료</p><button className={`${liveButton} w-full`} onClick={() => setScreen("certificate")}>라이선스 영수증 보기 →</button></div>}
      <p className="text-xs text-[#9CA3AF]">실제 거래와 민팅 영수증을 확인한 후에만 완료로 표시합니다.</p></div></div>
  </div></div>;
}

// ─── Certificate ────────────────────────────────────────────────────────────────
function CertificateScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const service = useService();
  const license = service.licenses.find((x: any) => x.trackId === service.selected?.id && x.ownershipConfirmed);
  return <div className="pt-14 min-h-screen"><div className="max-w-4xl mx-auto px-6 py-8">
    <div className="bg-[#161b22] border border-emerald-500/30 rounded-2xl p-7 mb-6 text-center relative overflow-hidden"><div className="relative z-10"><div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">✓</div><h2 className="text-xl font-bold text-white mb-2">{license?.ownershipConfirmed ? "라이선스 발급을 확인했습니다" : "확인된 라이선스가 없습니다"}</h2><p className="text-sm text-[#9CA3AF]">{license?.track?.title || service.selected?.title || "음원을 선택해 주세요."}</p></div></div>
    {license?.ownershipConfirmed && <div className="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden mb-6"><div className="px-6 py-4 border-b border-[#21262d] bg-[#1c2128]"><span className="text-sm font-semibold text-white">온체인 라이선스 영수증</span></div><dl className="p-6 space-y-4 text-xs break-all">{[["TX", license.purchaseTxHash], ["NFT Token ID", license.tokenId], ["라이선스", license.type], ["가격", `${license.price} ${license.currency}`], ["발급 시각", license.issuedAt], ["네트워크", "Hardhat 31337"]].map(([k, v]) => <div key={k}><dt className="text-[#9CA3AF] mb-1">{k}</dt><dd className="font-mono text-blue-400">{v || "—"}</dd></div>)}</dl></div>}
    <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-6 mb-6"><h3 className="text-sm font-semibold text-white mb-4">AI 검증 근거</h3><ReportPanel/></div><button onClick={() => setScreen("marketplace")} className={liveButton}>마켓플레이스로 →</button>
  </div></div>;
}

// ─── App Root ───────────────────────────────────────────────────────────────────
function ConnectedApp() {
  const service = useService();
  const [screen, setScreen] = useState<Screen>("marketplace");
  useEffect(() => setScreen("marketplace"), [service.user?.id]);
  const [showWalletModal, setShowWalletModal] = useState(false), [showHowItWorks, setShowHowItWorks] = useState(false);
  return <div className="min-h-screen bg-[#0d1117]">
    <GNB screen={screen} setScreen={setScreen} walletConnected={!!service.wallet} setWalletConnected={() => undefined} showWalletModal={showWalletModal} setShowWalletModal={setShowWalletModal} showHowItWorks={showHowItWorks} setShowHowItWorks={setShowHowItWorks} user={service.user} authLoading={service.authLoading} onLogout={() => void service.operation("로그아웃 중", service.logout).catch(() => undefined)}/>
    <SessionPanel/><PendingPanel/>
    {(service.error || service.busy) && <div className="max-w-6xl mx-auto px-6 pt-20">{service.error && <p role="alert" className="rounded-lg border border-red-500/30 bg-[#161b22] px-4 py-3 text-sm text-red-400">{service.error}</p>}{service.busy && <p role="status" aria-live="polite" className="mt-2 text-xs text-blue-400">{service.busy}</p>}</div>}

    {screen === "marketplace" && <MarketplaceScreen setScreen={setScreen} tracks={service.tracks} loading={service.loading} error=""/>}
    {screen === "upload" && <UploadScreen onUploaded={() => undefined}/>}
    {screen === "detail" && <DetailScreen key={service.selected?.id} setScreen={setScreen}/>}
    {screen === "dashboard" && <DashboardScreen tracks={service.mine} loading={service.loading} error="" setScreen={setScreen}/>}
    {screen === "checkout" && <CheckoutScreen key={service.selected?.id} setScreen={setScreen}/>}
    {screen === "certificate" && <CertificateScreen setScreen={setScreen}/>}
  </div>;
}
export default function App() { return <ServiceProvider><ConnectedApp/></ServiceProvider>; }
