# 실제 로컬 서비스 프론트엔드

Backend의 `docs/FULL_LOCAL_SERVICE.md`에 전체 실행 순서가 있습니다.

```bash
npm ci
npm run typecheck
npm test
npm run dev -- --host 127.0.0.1
```

접속: http://localhost:8443/Frontend/

기본 API는 http://localhost:4000 입니다. 다른 주소는 `.env.local`의 `VITE_API_BASE_URL`로 설정하고 Backend의 `FRONTEND_URL`도 접속 Origin과 맞추세요.

feat/design-v2의 내비게이션, 마켓 카드, 업로드 단계, 상세/대시보드/결제/영수증 화면 배치를 기준으로 유지하면서 타이머 기반 성공 표시를 제거했습니다. 실제 회원가입/로그인, 지갑 소유 확인, 업로드/기여도 확정, AI 결과 조회, IPFS 저장, 사용자 지갑 등록, 가격 설정, 구매/라이선스, 수익 출금을 사용합니다. 완료 표시는 실제 영수증과 Backend 확인 응답 후에만 표시됩니다. 확인되지 않은 전송 해시는 사용자별로 저장하여 새로고침 후 재확인할 수 있습니다.

현재 로컬 계약은 ETH COMMERCIAL 라이선스만 지원합니다. Google OAuth만으로 결제하거나 가스를 대납하지 않습니다. 실제 AI에서 검토를 요구한 WARN/HOLD는 등록을 보류합니다.

이 변경은 소스 브랜치에서 로컬 실행하는 구성이며, GitHub Pages 배포 출력은 별도로 배포 환경 API 주소를 정해 빌드해야 합니다.

검증에는 실제 모델을 대체하는 HTTP·지갑 응답을 명시한 DOM 통합 테스트가 포함됩니다. 업로드/등록/판매/구매 화면 전환과 채굴 후 확인 실패 재시도를 검사하며, 실제 모델·IPFS·MySQL·Hardhat 전체 실행을 대신하지 않습니다.
