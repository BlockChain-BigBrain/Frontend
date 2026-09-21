export type User = { id: number; email: string; nickname: string };
export class AuthError extends Error {}
export function createAuthClient(baseUrl: string, request: typeof fetch = fetch) {
  const base = baseUrl.replace(/\/$/, '');
  let accessToken: string | null = null;
  let refreshTask: Promise<void> | null = null;
  let generation = 0;
  const refresh = (): Promise<void> => {
    if (refreshTask) return refreshTask;
    const started = generation;
    refreshTask = (async () => {
      const response = await request(`${base}/api/v1/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!response.ok) {
        if (started === generation) accessToken = null;
        if (response.status === 401) throw new AuthError('로그인이 필요합니다.');
        throw new Error('로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
      const { result: body } = await response.json();
      if (typeof body?.accessToken !== 'string' || !body.accessToken) throw new Error('잘못된 인증 응답입니다.');
      if (started !== generation) throw new AuthError('로그아웃되었습니다.');
      accessToken = body.accessToken;
    })().finally(() => { refreshTask = null; });
    return refreshTask;
  };
  const apiFetch = async (path: string, init: RequestInit = {}) => {
    if (!path.startsWith('/api/') || path.startsWith('//') || /[\\\s]/.test(path)) throw new Error('허용되지 않은 API 경로입니다.');
    if (!accessToken) await refresh();
    const send = () => {
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${accessToken}`);
      return request(`${base}${path}`, { ...init, headers, credentials: 'include' });
    };
    let response = await send();
    if (response.status === 401) {
      await refresh();
      response = await send();
      if (response.status === 401) { accessToken = null; throw new AuthError('다시 로그인해 주세요.'); }
    }
    return response;
  };
  return {
    apiFetch,
    async me(): Promise<User> {
      const response = await apiFetch('/api/v1/auth/me');
      if (!response.ok) throw new Error('사용자 정보를 불러오지 못했습니다.');
      return (await response.json()).result;
    },
    loginUrl: `${base}/api/v1/auth/login/google`,
    async logout() {
      generation++;
      accessToken = null;
      // Wait for an in-flight refresh before clearing its newly rotated cookie.
      await refreshTask?.catch(() => undefined);
      const response = await request(`${base}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('로그아웃하지 못했습니다. 다시 시도해 주세요.');
    },
  };
}
