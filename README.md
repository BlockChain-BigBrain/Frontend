# Track AI Frontend

React + TypeScript + Vite 기반 Google 로그인 화면입니다.

## 실행

```bash
npm install
cp .env.example .env
npm run dev
```

프론트 http://localhost:8443/Frontend/ / 백엔드 주소는 VITE_API_BASE_URL로 설정합니다.
백엔드 설정: PORT=3000, FRONTEND_URL=http://localhost:8443/Frontend/,
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/callback/google.
Google Cloud 승인된 리디렉션 URI에도 같은 콜백 주소를 등록하세요.
Google/JWT 비밀키는 백엔드에만 저장하세요.

Google 로그인 후 프론트 루트로 복귀하면 HttpOnly 쿠키로 토큰을 재발급하고 내 정보를 표시합니다. Access token은 메모리에만 보관합니다.
새로고침 시 쿠키로 복원하고, API 401은 한 번만 재발급 후 재시도합니다.
로그아웃은 서버 쿠키와 메모리 토큰을 폐기합니다. src/auth.ts의 apiFetch를 인증 요청에 사용하세요.
재시도 불가능한 스트림 body는 전달하지 마세요. 여러 탭에서 사용 시 재로그인이 필요할 수 있습니다.

## GitHub Pages 배포: main /docs

Settings → Pages → Build and deployment에서 **Source: Deploy from a branch → Branch: main → /docs → Save**를 선택하세요. GitHub Actions 워크플로는 사용하지 않습니다.

```bash
npm ci
npm run build
```

production 빌드는 `docs/index.html`, `docs/assets/`, `docs/robots.txt`, `docs/.nojekyll`을 생성합니다. `docs/` 전체를 소스 변경과 함께 커밋해야 합니다. 배포 URL은 `https://blockchain-bigbrain.github.io/Frontend/`이며 URL에 `/docs/`를 붙이지 않습니다.

`vite.config.ts`의 `base`는 `/Frontend/`입니다. 루트 `index.html`은 기존 개발용 HTML로 유지하며, Vite가 빌드할 때 `/src/main.tsx` 참조를 production JS 경로로 변환합니다. 기존 루트 배포용 복사 플러그인과 `index.source.html`, `pages-assets/`는 제거했습니다. `docs/`는 빌드 생성물 전용 폴더이므로 직접 편집하지 마세요.

`npm run dev`는 기존처럼 `http://localhost:8443/Frontend/`에서 실행됩니다 (`PORT` 환경변수 설정 시 해당 포트). Figma preview의 `--mode development` 빌드는 기존 배포 스크립트와 호환되도록 `dist/`에 생성됩니다. `npm run preview`는 production 결과인 `docs/`를 미리 보여줍니다.

빌드 전에 기존 `.env` 또는 `.env.production.local`의 `VITE_API_BASE_URL`을 실제 HTTPS API 주소로 설정하세요. 기존 환경변수 구조는 그대로 유지합니다. Vite는 빌드 시 API 주소를 JS에 포함하므로 주소가 바뀌면 다시 빌드해야 합니다. `VITE_*`에 비밀키를 넣지 마세요. `.env`는 커밋하지 않습니다.

현재 React Router는 없으며 화면 전환은 React 상태로 처리합니다. 첫 화면은 Google 로그인 버튼이 있는 마켓플레이스입니다. 실제 로그인은 백엔드의 복귀 주소가 `https://blockchain-bigbrain.github.io/Frontend/`로 설정되어 있어야 하며 CORS 및 쿠키 설정도 별도 확인해야 합니다.

변경 내용을 검토한 후에만 커밋·push하세요.

```bash
git diff
git status --short
git add vite.config.ts index.html .gitignore README.md docs
git commit -m "Configure GitHub Pages deployment from docs"
git push origin main
```

이후 앱 수정 시에도 `npm run build`를 실행하고 `docs/`의 변경·추가·삭제를 함께 커밋하세요. `dist/`, `node_modules/`, 실제 `.env*` 파일은 제외합니다 (`.env.example`은 예외).
