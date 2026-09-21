# Track AI Frontend

React + TypeScript + Vite 기반 Google 로그인 화면입니다.

## 실행

```bash
npm install
cp .env.example .env
npm run dev
```

프론트 http://localhost:4000 / 백엔드 http://localhost:3000.
백엔드 설정: PORT=3000, FRONTEND_URL=http://localhost:4000,
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/callback/google.
Google Cloud 승인된 리디렉션 URI에도 같은 콜백 주소를 등록하세요.
Google/JWT 비밀키는 백엔드에만 저장하세요.

Google 로그인 → /auth/callback → HttpOnly 쿠키로 토큰 재발급 → 내 정보 표시.
/auth/error는 취소·만료·실패를 안내합니다. Access token은 메모리에만 보관합니다.
새로고침 시 쿠키로 복원하고, API 401은 한 번만 재발급 후 재시도합니다.
로그아웃은 서버 쿠키와 메모리 토큰을 폐기합니다. src/auth.ts의 apiFetch를 인증 요청에 사용하세요.
재시도 불가능한 스트림 body는 전달하지 마세요. 여러 탭에서 사용 시 재로그인이 필요할 수 있습니다.

## 검증과 배포

npm test / npm run build.
자동 테스트는 API를 모킹합니다. 실제 Google 로그인은 브라우저에서 별도 확인해야 합니다.
배포 시 VITE_API_BASE_URL에 실제 API 원본을 설정하고 빌드하세요.
SPA 호스팅은 /auth/callback과 /auth/error를 index.html로 연결해야 합니다.
백엔드 FRONTEND_URL을 실제 프론트 원본으로 변경하세요.
SameSite=Strict 쿠키를 사용하므로 프론트·백엔드는 같은 사이트에 배포하세요.
예: app.example.com / api.example.com. HTTPS에서는 COOKIE_SECURE=true를 사용합니다.
