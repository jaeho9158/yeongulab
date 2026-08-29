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

## 2단계: 기술부채 조사 (코드 수정 없음)

평가 기준: **수정 비용 × 방치 시 위험** (상 = 우선 처리 권장)

| # | 항목 | 위치 | 내용 | 우선순위 |
|---|---|---|---|---|
| 1 | 마운트 시 localStorage 로드 패턴 중복 + lint 오류 12건 | ActivityHeatmap, ChecklistCard, ContinueCard, DeadlineTracker, DisclosureGenerator, EthicsChecklist, PrintableChecklist 등 7+개 컴포넌트 | `useEffect` 안에서 동기 `setState`로 localStorage를 읽는 같은 코드가 컴포넌트마다 반복 → `react-hooks/set-state-in-effect` 오류 12건의 원인. `usePersistentState` 훅이 이미 있는데 절반만 쓰고 있음 | **상** — lint가 빨간 상태로 방치되면 새 오류가 묻힘 |
| 2 | localStorage 접근이 2가지 방식으로 혼재 | `lib/usePersistentState.ts`(14곳) vs 직접 `window.localStorage`(DeadlineTracker, DisclosureGenerator, ReflectionBox, ThemeToggle 등 9곳) | 키 prefix 규약(`research-guide:`)이 흩어져 있어 PlanBackup(전체 백업/복원)이 키 목록을 별도로 알아야 함 | **상** |
| 3 | StatsCalculator.tsx 463줄 단일 파일 | components/StatsCalculator.tsx | verdict/CaveatBlock/GuideBlock/본체가 한 파일. compute()가 80줄 | 중 — 동작엔 문제 없으나 수정 시 회귀 위험 |
| 4 | SimpleChart.tsx 442줄 | components/SimpleChart.tsx | 차트 종류별 렌더링이 한 파일에 집적 | 중 |
| 5 | `lib/stats.ts` 수치 알고리즘 무테스트 | logGamma/betacf/incompleteBeta → p값 | 손으로 옮긴 수치해석 코드인데 검증 테스트가 없음. 잘못되면 사용자에게 틀린 통계 판정 제공 | **상** — 3단계에서 테스트 작성 대상 1순위 |
| 6 | API 폴백 체인 무테스트 | app/api/search-papers/route.ts + lib/paperSearch.ts | 3단 폴백·초록 보강 로직이 실서비스 핵심인데 매퍼 테스트 없음 (외부 입력 지점) | **상** — 3단계 대상 |
| 7 | 죽은 코드 후보 | lib/stats.ts `parseNumberList`·`tTestTwoTailedP`(외부 미사용), lib/activity.ts `getActivityLog`, lib/ideaBank.ts `pickRandom`, lib/checklist.ts `checklistKey` | 파일 내부 사용 여부 개별 확인 후 제거 필요(일부는 내부 호출일 수 있음) | 하 |
| 8 | 하드코딩된 상수 산재 | search-papers route(타임아웃 8000, 캐시 600, LIMIT 10 — 이건 상수화 잘 됨), 반면 색·기준선(96px/100px)이 StageRail 주석에만 존재 | scroll-mt-24(96px)와 하이라이트 기준선 100이 별개 하드코딩 — 한쪽만 바꾸면 어긋남 | 중 |
| 9 | JSON.parse 결과 무검증 | DeadlineTracker:26, DisclosureGenerator:52, lib/activity.ts:32 | try로 예외는 잡지만 파싱 결과의 형태 검증 없이 setState → 손상된 저장값이면 렌더 단계에서 깨질 수 있음 | 중 |
| 10 | 에러 상태 미표시 | PlanBackup 복원 실패, ReflectionBox 저장 실패 등이 조용히 무시됨 | 사용자는 저장된 줄 알고 데이터를 잃을 수 있음 | 중 |

TODO/FIXME 주석: **0건** (깨끗함).
