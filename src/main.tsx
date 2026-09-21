import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthError, createAuthClient, type User } from './auth';
import './style.css';

const auth = createAuthClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');
const reasons: Record<string, string> = {
  ACCESS_DENIED: 'Google 로그인이 취소되었습니다. 다시 로그인할 수 있어요.',
  INVALID_STATE: '로그인 요청이 만료되었습니다. 다시 시작해 주세요.',
  AUTH_FAILED: '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
};
function App() {
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    let active = true;
    if (window.location.pathname === '/auth/error') {
      setError(reasons[new URLSearchParams(window.location.search).get('reason') || ''] || reasons.AUTH_FAILED);
      setLoading(false);
      return;
    }
    auth.me().then(value => {
      if (!active) return;
      setUser(value);
      if (window.location.pathname === '/auth/callback') window.history.replaceState(null, '', '/');
    }).catch(cause => {
      if (active && (!(cause instanceof AuthError) || window.location.pathname === '/auth/callback')) {
        setError(cause instanceof Error ? cause.message : '서버에 연결하지 못했습니다.');
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function logout() {
    setLoggingOut(true); setError('');
    try { await auth.logout(); setUser(null); window.history.replaceState(null, '', '/'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '로그아웃에 실패했습니다.'); }
    finally { setLoggingOut(false); }
  }
  return <>
    <header className="topbar">
      <a href="/" className="brand" aria-label="Track-AI 홈">Track-AI</a>
      <nav aria-label="주 메뉴">
        <button className="nav-item active" aria-current="page" onClick={() => setNotice('')}>Explore</button>
        <button className="nav-item" onClick={() => setNotice('음원 업로드 기능은 준비 중입니다.')}>Upload</button>
        <button className="nav-item" onClick={() => setNotice(user ? `${user.name}님, 대시보드는 준비 중입니다.` : 'Google 로그인 후 대시보드를 이용할 수 있습니다.')}>Dashboard</button>
        <button className="nav-item" onClick={() => setNotice('Google 계정으로 시작하고, 음원과 창작 기여를 기록하세요. 유사도 검증과 자동 정산 기능은 준비 중입니다.')}>How it works</button>
      </nav>
      <div className="auth-actions" aria-busy={loading}>
        {loading ? <span className="session-status" role="status">로그인 확인 중…</span> : user ? <>
          <span className="user-name" title={user.email}>{user.name}님</span>
          <button className="logout" onClick={logout} disabled={loggingOut}>{loggingOut ? '로그아웃 중…' : '로그아웃'}</button>
        </> : <a className="google" href={auth.loginUrl}>
          <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
            <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15z"/>
            <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20.4 20.4 0 0 0 24 44z"/>
            <path fill="#FBBC05" d="M12.6 27.6a12.2 12.2 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8z"/>
            <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9A19.8 19.8 0 0 0 24 4 20.4 20.4 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12z"/>
          </svg>구글로 3초 만에 시작하기
        </a>}
      </div>
    </header>
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="network-badge"><span className="network-dot"/>Polygon Network (Amoy)<span className="badge-divider">·</span>온체인 등록 준비 중</div>
        <h1 id="hero-title">프롬프트·보이스·편집,<br/><span>기여한 만큼 자동 정산되는 AI 음원 마켓</span></h1>
        <p className="description">AI 유사도 검증부터 블록체인 기록, 기여자 자동 정산까지.<br className="mobile-break"/> 창작의 가치를 함께 나누는 음원 마켓을 준비하고 있습니다.</p>
        <form className="search" role="search" onSubmit={event => { event.preventDefault(); setNotice(query.trim() ? `“${query.trim()}” 검색 기능은 준비 중입니다.` : '검색할 트랙 제목, AI 모델 또는 장르를 입력하세요.'); }}>
          <button type="submit" aria-label="음원 검색"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button>
          <input aria-label="트랙 제목, AI 모델, 장르 검색" placeholder="트랙 제목, AI 모델, 장르 검색..." value={query} onChange={event => setQuery(event.target.value)}/>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}
      </section>
    </main>
  </>;
}
createRoot(document.getElementById('root')!).render(<App/>);
