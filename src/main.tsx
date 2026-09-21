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
  return <main>
    <header><a href="/" className="brand"><span className="mark">t</span> Track AI</a><span className="tag">CREATED BY YOU</span></header>
    <section className="layout">
      <div className="intro"><p className="eyebrow">YOUR SOUND. YOUR RIGHTS.</p><h1>당신의 음악,<br/>당신의 권리.</h1><p className="description">음악의 시작부터 창작의 기록까지.<br/>Track AI에서 나만의 음악 여정을 시작하세요.</p><div className="wave" aria-hidden="true">{Array.from({length:29},(_,i)=><i key={i} style={{height:`${20 + Math.abs(Math.sin(i * 0.7)) * 65}px`}}/>)}</div></div>
      <div className="card" aria-busy={loading}>
        <p className="eyebrow">MY WORKSPACE</p>
        <h2>{loading ? '로그인 확인 중' : user ? `${user.name}님, 반가워요` : '시작할 준비가 됐나요?'}</h2>
        <p className="muted">{user ? 'Google 계정으로 로그인되었습니다.' : 'Google 계정으로 간편하게 시작하세요.'}</p>
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? <p role="status" className="muted">계정 정보를 불러오고 있습니다…</p> : user ? <><div className="account"><span className="avatar">{user.name.slice(0,1)}</span><div><strong>{user.name}</strong><p>{user.email}</p></div></div><button className="secondary" onClick={logout} disabled={loggingOut}>{loggingOut ? '로그아웃 중…' : '로그아웃'}</button></> : <a className="google" href={auth.loginUrl}><span aria-hidden="true">G</span>Google로 계속하기<span aria-hidden="true">↗</span></a>}
        <div className="divider"/><p className="footnote">당신의 다음 트랙이 시작되는 곳.</p>
      </div>
    </section><footer>TRACK AI <span>음악에 담긴 창작의 가치를 기록합니다.</span></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
