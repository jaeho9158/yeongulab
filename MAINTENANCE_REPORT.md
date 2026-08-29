# MAINTENANCE_REPORT

## 요약 (2026-08-29, 브랜치 chore/maintenance — push 안 함)

**실제로 바뀐 것**
- 커밋 5개, 변경 파일 12개: 의존성 패치 3건(next 16.3.1→16.3.3, eslint-config-next 동기, @types/react-dom 19.2.5), vitest 도입, 테스트 파일 7개(52건 전부 통과), 이 보고서.
- 프로덕션 코드는 한 줄도 수정하지 않음 (2·4단계 지시대로 조사·계획만).

**판단이 필요한 것**
1. major 업그레이드 3건 보류: eslint 10, typescript 7, @types/node 26 (1단계 표 참고).
2. `npm run lint` 오류 12건 — 업그레이드 전부터 있던 기존 문제(react-hooks/set-state-in-effect). 수정하려면 컴포넌트 리팩터링 필요 → 부채 #1.
3. 4단계 리팩터링 계획 A·B·C — 검토 후 지시 주시면 실행.

**막혀서 건너뛴 것**
- 없음 (테스트 2회 연속 실패로 포기한 대상 없음). 컴포넌트 렌더링 테스트는 jsdom 셋업이 선행돼야 해서 의도적으로 범위 제외.

---

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

## 3단계: 테스트 작성

프레임워크가 없어 **vitest 4.x**를 devDependency로 설치하고 `npm test`(=`vitest run`) 스크립트를 추가했다. 컴포넌트(jsdom) 테스트는 이번 범위에서 제외하고, 서비스가 틀린 결과를 내보낼 수 있는 순수 로직부터 채웠다. **7개 파일, 52개 테스트, 전부 통과.** 각 배치 후 vitest + tsc 통과 확인 후 커밋.

| 배치 | 파일 | 대상 | 이유 |
|---|---|---|---|
| 1 | lib/__tests__/stats.test.ts | Welch t-검정·상관·회귀·p값·파싱 | 손으로 옮긴 수치해석 — 틀리면 사용자에게 틀린 통계 판정 (부채 #5). 알려진 통계값(t=2, df=10 → p≈.0734 등)과 대조 |
| 1 | lib/__tests__/paperSearch.test.ts | 3개 API 매퍼·JATS 제거·역색인 복원·초록 보강 | 외부 입력 지점 (부채 #6). 깨진 응답/누락 필드 실패 케이스 포함 |
| 1 | lib/__tests__/citations.test.ts | APA/IEEE 포맷 | "Study.." 이중 마침표 회귀 방지 |
| 2 | lib/__tests__/checklist.test.ts | v2 저장·구버전 boolean[] 마이그레이션 | 사용자 진행 데이터의 핵심 저장소. localStorage는 스텁으로 대체 |
| 2 | lib/__tests__/korean.test.ts | 받침·조사 | 괄호 제거·숫자 읽기 경계 |
| 2 | lib/__tests__/activity.test.ts | 소요일수·일별 집계 | "0일" 버그 회귀 방지(같은 날=1일) |
| 3 | lib/__tests__/guide.test.ts | H2 추출·슬러그 중복 번호 | 레일 목차 앵커가 여기서 나옴 |

건너뛴 것: 자명한 코드(usePersistentState의 단순 위임부, stageToolMeta 상수), 컴포넌트 렌더링(jsdom 셋업 필요 — 별도 작업 권장), search-papers route 자체(fetch 목킹 필요 — 매퍼 계층으로 핵심은 커버됨). 2회 연속 실패로 포기한 대상: 없음.

## 4단계: 리팩터링 계획 (실행 안 함 — 검토 후 지시 대기)

테스트가 확보된 부채 항목만 대상으로 한다.

### 계획 A — 부채 #5: lib/stats.ts 죽은 코드 정리 및 StatsCalculator 분리 준비
- **보호 테스트**: stats.test.ts (t/df/p/d 수치 고정, 오류 경계 5건)
- **변경**: ① `parseNumberList`(stats.ts:233) 삭제 — 외부 사용처 0, `parseNumberListDetailed`만 사용됨. ② `tTestTwoTailedP`는 welchTTest 내부에서 사용하므로 유지하되 export 제거 여부는 선택(현재 테스트가 직접 참조하므로 export 유지 권장). ③ 이후 StatsCalculator.tsx의 `verdict()`를 lib/stats.ts 옆 `lib/statsVerdict.ts`로 옮기면 컴포넌트 없이 판정 문구까지 테스트 가능.
- **위험**: 낮음. 삭제 대상은 grep 상 사용처 없음 + 전체 테스트가 잡아줌.

### 계획 B — 부채 #6: search-papers route 슬림화
- **보호 테스트**: paperSearch.test.ts (매퍼·보강 로직 전부)
- **변경**: route.ts의 3단 폴백 제어 흐름을 `lib/paperSearch.ts`의 `searchWithFallback(fetchers)` 같은 순수 조합 함수로 추출하고, route는 fetch 함수 주입만 담당. 그러면 폴백 순서·shouldFallback 분기(429/5xx vs 4xx)도 fetch 목 없이 단위 테스트 가능.
- **위험**: 중간. 현재 route 테스트가 없으므로 **추출 후 폴백 체인 테스트를 먼저 추가하고 나서** 배포 권장.

### 계획 C — 부채 #7: 죽은 코드 제거 (lib 한정)
- **보호 테스트**: 전체 스위트 + tsc + next build
- **변경**: `lib/ideaBank.ts pickRandom`, `lib/checklist.ts checklistKey`(내부 사용 있음 — export만 제거), `lib/activity.ts getActivityLog`(내부 사용 있음 — export만 제거), `lib/citations.ts REFERENCES_STORAGE_KEY`(PlanBackup의 prefix 스캔과 무관한지 확인 후). 각각 삭제→빌드→테스트로 개별 확인.
- **위험**: 낮음. 단, PlanBackup이 키 문자열을 동적으로 다루므로 문자열 검색까지 확인할 것.

### 보류 (테스트 미확보로 이번 계획에서 제외)
부채 #1·#2(컴포넌트 localStorage 패턴 통일)는 대상 컴포넌트의 렌더링 테스트가 없어 계획에서 뺐다. 착수하려면 jsdom + @testing-library/react 셋업이 선행돼야 한다.

## 5단계(추가 지시): 리팩터링 계획 A·B·C 전부 실행 (2026-08-29)

- **A 완료**: `parseNumberList` 삭제(사용처 없음). `verdict()`를 `lib/statsVerdict.ts`로 추출하고 테스트 4건 추가(모드별 문구·p<.01/.05 경계·NaN 판정 불가).
- **C 완료**: 외부 미사용 export 4건 내부화 — `getActivityLog`, `checklistKey`, `REFERENCES_STORAGE_KEY`, `pickRandom` (모두 파일 내부 사용은 유지). PlanBackup은 prefix 스캔 방식이라 영향 없음 확인.
- **B 완료**: 3단 폴백 제어 흐름을 `lib/searchChain.ts`의 `runSearchChain(query, fetchers)`로 추출. 권장 순서대로 **체인 테스트 7건을 먼저 추가**(1차 성공 시 단락, 4xx 무폴백 전달, 429→Crossref 폴백+초록 보강, 보강 실패 격리, 2차 0건→OpenAlex, 3차 429/502) 후 route를 교체. route는 fetch 함수 4개 주입만 담당.
- 검증: vitest **63건 전부 통과**, tsc 0 오류, `next build` 성공, `next start` 스모크에서 실검색("white noise short-term memory" → 1969 Sloboda 논문 1위)과 빈 쿼리 400 확인.
- 커밋 2개 추가 (A+C, B). push는 하지 않음.
