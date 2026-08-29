# MAINTENANCE_REPORT

(요약은 마지막에 작성)

## 1단계: 의존성 점검 (2026-08-29)

### 취약점 감사
`npm audit` 결과 **취약점 0건** (info/low/moderate/high/critical 모두 0, 총 582개 패키지).

### 적용한 업그레이드 (패치/마이너만)
| 패키지 | 이전 | 이후 | 비고 |
|---|---|---|---|
| next | 16.3.1 | 16.3.3 | 패치. 빌드·tsc 통과 확인 |
| eslint-config-next | 16.3.1 | 16.3.3 | next와 버전 동기 |
| @types/react-dom | 19.2.4 | 19.2.5 | 패치 |

검증: `next build` 성공(전체 라우트 정상 생성), `tsc --noEmit` 0 오류.
`npm run lint`는 12건 오류가 나오지만 **업그레이드 전 커밋에서도 동일 12건**(stash로 확인) — 기존 문제이며 업그레이드로 인한 회귀 아님. 2단계 기술부채에 기재.

### major 업그레이드 — 적용하지 않음 (목록만)
| 패키지 | 현재 | 최신 | 메모 |
|---|---|---|---|
| @types/node | 20.x | 26.4.0 | Node 런타임 버전과 맞춰야 함. Vercel 런타임 확인 후 결정 |
| eslint | 9.39.5 | 10.9.1 | flat config는 이미 사용 중이나 플러그인 호환성 검증 필요 |
| typescript | 5.9.3 | 7.0.2 | major 2단계 점프. next/eslint-config와의 호환 매트릭스 확인 필요 |
