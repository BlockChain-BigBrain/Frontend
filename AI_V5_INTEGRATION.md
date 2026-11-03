# AI v5 프론트엔드 연동

이 브랜치는 Frontend 최신 `origin/main`(`39a0f2f`)에서 분기한 연동 브랜치입니다. `main`에는 직접 변경하지 않았습니다.

화면에 표시하는 판정 정책은 다음과 같습니다.

- Layer 1: Chromaprint exact duplicate이면 `BLOCK`
- Layer 2: 10초 윈도우/5초 stride CLAP 후보 검색 후 pitch·rhythm·chroma·시간 일관성 검증
- `WARN`: query-level verifier `>= 0.351229127861893`
- `HOLD`: pairwise temporal score `>= 0.9471999941293027`
- 그 외: `PASS`

WARN와 HOLD는 서로 다른 점수의 임계값이며, HOLD는 수동 검토용 보류 상태입니다. UI에는 `scoreVersion=hybrid_query_top3_pairwise_hold-v5`, `decisionPolicyVersion=track-ai-balanced-policy-v5-20261102`, `modelVersion=laion/clap-htsat-unfused`를 함께 표시합니다.

프론트엔드 빌드(`npm run build`)는 통과했습니다. 빌드가 갱신하는 `docs/assets` 산출물은 배포 환경에서 생성되므로 이 연동 커밋에는 포함하지 않았습니다.
