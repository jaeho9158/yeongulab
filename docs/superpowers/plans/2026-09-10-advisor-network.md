# 자문위원 네트워크 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 연구할Lab에 자문위원(학·석·박사·교수·연구원·기업 전문가)이 기관 이메일로 인증하고 등록하면, 중·고등학생이 공개 Q&A와 1:1 텍스트 스레드로 연구 자문을 받을 수 있는 무료 네트워크를 만든다.

**Architecture:** 순수 로직(검증·배지 산출·정렬·응답률·연락처 탐지·쿼터)은 `lib/advisors/`에 DB 의존 없이 두고 vitest로 TDD한다. DB 접근은 Supabase 클라이언트를 감싼 얇은 질의 계층으로 격리하고, 쓰기는 전부 Server Action을 통과시킨다. 1:1은 화상이 아니라 사이트 내 텍스트 스레드라 대화 전문이 자동으로 기록에 남고, 이것이 미성년자 안전 요구(세션 녹화·보호자 참관·보호자 전용 열람)를 인프라 비용 0으로 충족한다.

**Tech Stack:** Next.js 16 App Router · React 19 · Supabase(Postgres + Auth + RLS) · `@supabase/ssr` · Tailwind v4 · vitest

**설계 근거:** [2026-09-10-advisor-network-design.md](../specs/2026-09-10-advisor-network-design.md)

---

## 이 코드베이스에서 반드시 지킬 것

이 저장소의 `AGENTS.md`는 다음을 명령한다.

> "This is NOT the Next.js you know. 이 버전은 breaking change가 있다 — API·관례·파일 구조가 학습 데이터와 다를 수 있다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 가이드를 읽어라."

**이 계획에서 실제로 문제가 되는 지점 두 개를 미리 확인해 두었다.**

1. **`middleware.ts`는 Next.js 16에서 폐기되었고 `proxy.ts`로 이름이 바뀌었다.**
   (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md`)
   Supabase 공식 문서는 아직 `middleware.ts`를 안내하므로 **그대로 따라 하면 동작하지 않는다.**
   내보내는 함수 이름도 `middleware`가 아니라 `proxy`(또는 default export)다.

2. **Server Action은 인증되지 않은 POST 엔드포인트다.**
   (`node_modules/next/dist/docs/01-app/02-guides/server-actions.md` — "Treat every action as an untrusted entry point")
   모든 action은 첫 줄에서 세션과 권한을 직접 확인해야 한다. 클라이언트가 폼을 숨겼다는 것은 아무 보호도 되지 않는다.

작업 중 Next.js API가 예상과 다르게 동작하면, 추측하지 말고 `node_modules/next/dist/docs/`를 먼저 읽어라.

## 테스트 방침

이 저장소의 기존 관행을 따른다(`lib/__tests__/`, `components/__tests__/` 참고).

- 순수 로직 → `node` 환경(기본). 파일 상단에 아무 지시자도 쓰지 않는다.
- 컴포넌트 → 파일 첫 줄에 `// @vitest-environment jsdom`.
- 실행: `npm test`
- **DB에 붙는 코드는 유닛 테스트하지 않는다.** 대신 순수 로직을 최대한 분리해 내고,
  DB 계층은 얇게 유지한 뒤 각 Phase 끝의 수동 검증 절차로 확인한다.

## 파일 구조

```
lib/advisors/
  types.ts          모든 도메인 타입 한 곳. DB·UI가 공유한다.
  validate.ts       프로필 입력 검증 (순수)
  badges.ts         배지 산출 (순수)
  ranking.ts        정렬·추천 점수·응답률·응답시간 표기 (순수)
  quota.ts          월 쿼터·수락 가능 여부 (순수)
  safety.ts         연락처 패턴 탐지 (순수)
  matching.ts       질문↔자문위원 분야 매칭 (순수)
  queries.ts        Supabase 읽기 전용 질의 (얇게)
  actions.ts        Server Actions — 모든 쓰기 경로

lib/supabase/
  server.ts         서버 컴포넌트·액션용 클라이언트
  client.ts         브라우저 클라이언트
  admin.ts          service_role 클라이언트 (운영자 전용)

proxy.ts            세션 갱신 (middleware.ts 아님 — 위 경고 참고)

supabase/migrations/
  0001_advisors.sql
  0002_questions.sql
  0003_threads.sql
  0004_stats.sql

app/advisors/
  page.tsx              디렉토리 (목록·정렬·필터)
  [id]/page.tsx         개별 프로필
  join/page.tsx         자문위원 지원
  verify/page.tsx       매직링크 착지점
  me/page.tsx           자문위원 본인 설정
app/questions/
  page.tsx              공개 Q&A 목록
  new/page.tsx          질문 작성
  [id]/page.tsx         질문 + 답변
app/threads/
  [id]/page.tsx         1:1 스레드
app/guardian/
  [token]/page.tsx      보호자 동의·열람
app/admin/advisors/
  page.tsx              승인 심사 (운영자 전용)

components/advisors/
  AdvisorCard.tsx
  AdvisorFilters.tsx
  AdvisorJoinForm.tsx
  AdvisorBadge.tsx
  QuestionForm.tsx
  AnswerForm.tsx
  ThreadView.tsx
  ReportButton.tsx
  SafetyNotice.tsx
```

**분리 원칙:** `lib/advisors/`의 파일들은 Supabase를 import하지 않는다. `queries.ts`와 `actions.ts`만 DB를 안다. 이 경계 덕분에 도메인 로직 전체가 DB 없이 테스트된다.

---
# Phase 0 — 선행 조건

**이 Phase는 코드가 아니라 차단 요인 제거다. 완료 전에는 Phase 1을 시작할 수 없다.**

### Task 0.1: Supabase 프로젝트 확보

**Files:** 없음 (수동 작업)

- [ ] **Step 1: 남은 프로젝트 슬롯 확인**

무료 플랜은 **조직당 프로젝트 2개**가 상한이다. 기존 조직이 이미 2개를 쓰고 있으면 새 조직을 만들어야 한다(계정당 조직 수에는 제한이 없다).

- [ ] **Step 2: 프로젝트 생성**

리전은 `Northeast Asia (Seoul)`을 고른다. 사용자가 전부 국내이므로 지연 시간이 가장 낮다.

- [ ] **Step 3: 키를 Vercel 환경변수에 등록**

Supabase 대시보드 → Project Settings → API에서 값을 복사한다.

| 변수 | 값 | 노출 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | 공개 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | 공개 |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **비공개** |
| `ADVISOR_ADMIN_EMAIL` | 운영자(회장) 이메일 | **비공개** |

`SUPABASE_SERVICE_ROLE_KEY`는 RLS를 전부 우회한다. **절대 `NEXT_PUBLIC_` 접두사를 붙이지 마라** — 붙이는 순간 클라이언트 번들에 들어가 누구나 전체 DB를 읽고 쓸 수 있게 된다.

- [ ] **Step 4: 로컬 `.env.local`에 같은 값을 넣고 gitignore 확인**

Run: `grep -n "env" .gitignore`
Expected: `.env*` 계열이 이미 무시되고 있다. 없으면 `.env*.local`을 추가하고 커밋한다.

- [ ] **Step 5: 자동 일시정지 주의사항 기록**

무료 플랜 프로젝트는 **1주일간 요청이 없으면 자동 일시정지**된다. 정지되면 사이트의 자문위원 기능이 통째로 죽는다. Phase 1 출시 후에는 주 1회 이상 접속하거나 Vercel Cron으로 가벼운 헬스체크를 걸어 둔다.

### Task 0.2: 개인정보처리방침 개정

**Files:**
- Modify: `app/privacy/page.tsx`

현재 방침은 이렇게 **공개적으로 약속**하고 있다.

> "이름·이메일·전화번호 등 개인을 식별할 수 있는 정보를 서버에 수집하지 않습니다"

자문위원 기능은 기관 이메일·소속·실명을 서버에 저장한다. **이 약속을 고치지 않고 기능을 배포하면 방침 위반이다.** 코드보다 이것이 먼저다.

- [ ] **Step 1: 현재 문구 확인**

Run: `sed -n '20,50p' app/privacy/page.tsx`

- [ ] **Step 2: 1번 항목을 "가이드·도구"와 "자문위원 네트워크"로 분리**

기존 약속을 지우지 말고 **적용 범위를 좁힌다.** 로그인 없이 쓰는 가이드·도구 영역은 지금도 정말로 아무것도 수집하지 않고, 그 사실이 이 사이트의 강점이기 때문이다.

새로 추가할 표:

| 구분 | 수집 항목 | 보유 기간 |
|---|---|---|
| 자문위원 | 기관 이메일, 표시명, 소속, 학과, 직위, 연구분야 | 탈퇴 시 즉시 파기 |
| 자문위원(선택) | 재학·학위 증빙 서류 | **확인 즉시 파기** |
| 질문자 | 이메일, 학교급 | 탈퇴 시 즉시 파기 |
| 미성년 질문자 | 보호자 이메일, 동의 일시 | 동의 철회 또는 탈퇴 시 파기 |
| 1:1 스레드 | 대화 전문 | 종료 후 1년, 이후 자동 삭제 |

반드시 들어가야 할 문장:
- 기관 이메일은 **인증 목적으로만** 사용하며 다른 이용자에게 공개되지 않는다.
- 증빙 서류는 확인 즉시 파기하며 보관하지 않는다.
- 1:1 스레드 대화는 안전 확인을 위해 **운영자와 보호자가 열람할 수 있다.** (이 고지가 없으면 열람 자체가 문제가 된다.)
- 만 14세 미만은 법정대리인 동의 후에만 이용할 수 있다.
- 처리 위탁: Supabase(미국) — 데이터 저장 및 인증.

- [ ] **Step 3: 커밋**

```bash
git add app/privacy/page.tsx && git commit -m "docs: 자문위원 네트워크 도입에 맞춰 개인정보처리방침 개정"
```

---

# Phase 1 — 자문위원 레지스트리

**완료 시 출시 가능한 상태:** 자문위원이 기관 이메일로 인증하고 프로필을 등록하면 운영자 승인 후 `/advisors`에 공개된다. 아직 질문 기능은 없다.

### Task 1: 도메인 타입과 프로필 검증

**Files:**
- Create: `lib/advisors/types.ts`
- Create: `lib/advisors/validate.ts`
- Test: `lib/__tests__/advisorValidate.test.ts`

- [ ] **Step 1: 타입 정의**

`lib/advisors/types.ts`:

```ts
/** 자문위원 도메인 타입. DB 스키마와 UI가 공유하는 단일 출처다. */

export const POSITIONS = [
  "학부생",
  "석사과정",
  "박사과정",
  "박사후연구원",
  "교수",
  "기업 연구원",
  "기업 실무자",
] as const;
export type Position = (typeof POSITIONS)[number];

/** 자문위원이 직접 켜고 끈다 — 무급이라 부담 제어권이 본인에게 있어야 한다. */
export type AdvisorStatus = "받는 중" | "쉬는 중";

/**
 * 배지는 두 단계다. 기관 이메일 도메인만으로는 학위과정을 보증할 수 없기 때문이다
 * (@*.ac.kr은 학부생도 갖는다). 서류를 운영자가 확인해야 상위 배지가 붙는다.
 */
export type AdvisorBadge = "이메일 인증" | "서류 확인";

export type AdvisorReviewState = "심사 대기" | "공개" | "보류";

/** 자문위원이 직접 입력하는 값. 시스템 산출값은 여기 없다. */
export type AdvisorProfileInput = {
  displayName: string;
  institution: string;
  department: string;
  position: Position;
  labName: string;
  fields: string[];
  bio: string;
  answerableTopics: string[];
  monthlyQuota: number;
  acceptsPrivate: boolean;
};

/** 공개 화면에 내려가는 형태. institutionEmail은 의도적으로 없다. */
export type Advisor = AdvisorProfileInput & {
  id: string;
  status: AdvisorStatus;
  /**
   * null일 수 있다 — 기관 도메인이 아닌 자문위원(기업 소속 등)을 운영자가
   * 서류 확인 전에 먼저 공개시킬 수 있기 때문이다. 화면은 배지 없는 경우를
   * 반드시 처리해야 한다.
   */
  badge: AdvisorBadge | null;
  reviewState: AdvisorReviewState;
  /** 누적 답변 수 */
  answerCount: number;
  /** 배정된 질문 수 — 응답률의 분모 */
  assignedCount: number;
  /** 응답까지 걸린 시간의 중앙값. 답변 이력이 없으면 null */
  medianResponseHours: number | null;
  /** ISO 8601 */
  joinedAt: string;
};

export const MAX_FIELDS = 5;
export const MAX_BIO_LENGTH = 120;
export const MAX_QUOTA = 20;
export const MIN_QUOTA = 1;
```

- [ ] **Step 2: 검증 테스트를 먼저 쓴다**

`lib/__tests__/advisorValidate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateAdvisorProfile } from "@/lib/advisors/validate";
import type { AdvisorProfileInput } from "@/lib/advisors/types";

const VALID: AdvisorProfileInput = {
  displayName: "김연구",
  institution: "한국대학교",
  department: "화학과",
  position: "박사과정",
  labName: "분자설계연구실",
  fields: ["유기화학", "촉매"],
  bio: "고분자 촉매를 연구합니다.",
  answerableTopics: ["실험 설계", "논문 읽기"],
  monthlyQuota: 3,
  acceptsPrivate: true,
};

describe("validateAdvisorProfile", () => {
  it("올바른 입력을 통과시킨다", () => {
    expect(validateAdvisorProfile(VALID).ok).toBe(true);
  });

  it("표시명이 비면 거절한다", () => {
    const result = validateAdvisorProfile({ ...VALID, displayName: "  " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContain("표시명을 입력해주세요.");
  });

  it("소속과 학과가 비면 각각 거절한다", () => {
    const result = validateAdvisorProfile({
      ...VALID,
      institution: "",
      department: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("소속 기관을 입력해주세요.");
      expect(result.errors).toContain("학과를 입력해주세요.");
    }
  });

  it("연구분야가 하나도 없으면 거절한다 — 질문 매칭이 불가능하다", () => {
    const result = validateAdvisorProfile({ ...VALID, fields: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("연구분야를 1개 이상 선택해주세요.");
    }
  });

  it("연구분야가 5개를 넘으면 거절한다", () => {
    const result = validateAdvisorProfile({
      ...VALID,
      fields: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("연구분야는 최대 5개까지 선택할 수 있습니다.");
    }
  });

  it("한 줄 소개가 120자를 넘으면 거절한다", () => {
    const result = validateAdvisorProfile({ ...VALID, bio: "가".repeat(121) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("한 줄 소개는 120자 이내로 써주세요.");
    }
  });

  it("쿼터가 범위를 벗어나거나 정수가 아니면 거절한다", () => {
    expect(validateAdvisorProfile({ ...VALID, monthlyQuota: 0 }).ok).toBe(false);
    expect(validateAdvisorProfile({ ...VALID, monthlyQuota: 21 }).ok).toBe(false);
    expect(validateAdvisorProfile({ ...VALID, monthlyQuota: 2.5 }).ok).toBe(false);
  });

  it("허용되지 않은 직위를 거절한다 — Server Action은 신뢰할 수 없는 입력을 받는다", () => {
    const result = validateAdvisorProfile({
      ...VALID,
      position: "총장" as AdvisorProfileInput["position"],
    });
    expect(result.ok).toBe(false);
  });

  it("통과하면 공백을 제거한 값을 돌려준다", () => {
    const result = validateAdvisorProfile({
      ...VALID,
      displayName: "  김연구  ",
      fields: [" 유기화학 ", "촉매"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.displayName).toBe("김연구");
      expect(result.value.fields).toEqual(["유기화학", "촉매"]);
    }
  });

  it("빈 연구분야 항목은 버리고 중복은 합친다", () => {
    const result = validateAdvisorProfile({
      ...VALID,
      fields: ["유기화학", "  ", "유기화학", "촉매"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.fields).toEqual(["유기화학", "촉매"]);
  });

  it("소속 랩은 비어도 통과한다 — 기업 소속은 랩이 없다", () => {
    expect(validateAdvisorProfile({ ...VALID, labName: "" }).ok).toBe(true);
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npx vitest run lib/__tests__/advisorValidate.test.ts`
Expected: FAIL — `Cannot find module '@/lib/advisors/validate'`

- [ ] **Step 4: 검증 구현**

`lib/advisors/validate.ts`:

```ts
import {
  MAX_BIO_LENGTH,
  MAX_FIELDS,
  MAX_QUOTA,
  MIN_QUOTA,
  POSITIONS,
  type AdvisorProfileInput,
  type Position,
} from "./types";

export type ValidationResult =
  | { ok: true; value: AdvisorProfileInput }
  | { ok: false; errors: string[] };

/** 공백만 남은 항목과 중복을 버리고 입력 순서를 지킨 목록을 만든다. */
function cleanList(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/**
 * 자문위원 프로필 입력 검증.
 *
 * Server Action은 인증되지 않은 POST 엔드포인트라(next docs: 02-guides/server-actions.md
 * — "Treat every action as an untrusted entry point") 브라우저에서 이미 검사했더라도
 * 서버에서 반드시 다시 통과시켜야 한다. 그래서 이 함수는 DOM도 DB도 모른다.
 */
export function validateAdvisorProfile(
  input: AdvisorProfileInput,
): ValidationResult {
  const errors: string[] = [];

  const displayName = input.displayName.trim();
  if (!displayName) errors.push("표시명을 입력해주세요.");

  const institution = input.institution.trim();
  if (!institution) errors.push("소속 기관을 입력해주세요.");

  const department = input.department.trim();
  if (!department) errors.push("학과를 입력해주세요.");

  if (!POSITIONS.includes(input.position as Position)) {
    errors.push("직위를 선택해주세요.");
  }

  const fields = cleanList(input.fields);
  if (fields.length === 0) errors.push("연구분야를 1개 이상 선택해주세요.");
  if (fields.length > MAX_FIELDS) {
    errors.push(`연구분야는 최대 ${MAX_FIELDS}개까지 선택할 수 있습니다.`);
  }

  const bio = input.bio.trim();
  if (bio.length > MAX_BIO_LENGTH) {
    errors.push(`한 줄 소개는 ${MAX_BIO_LENGTH}자 이내로 써주세요.`);
  }

  const quota = input.monthlyQuota;
  if (!Number.isInteger(quota) || quota < MIN_QUOTA || quota > MAX_QUOTA) {
    errors.push(
      `월 답변 가능 건수는 ${MIN_QUOTA}~${MAX_QUOTA} 사이로 정해주세요.`,
    );
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      displayName,
      institution,
      department,
      position: input.position,
      labName: input.labName.trim(),
      fields,
      bio,
      answerableTopics: cleanList(input.answerableTopics),
      monthlyQuota: quota,
      acceptsPrivate: input.acceptsPrivate,
    },
  };
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run lib/__tests__/advisorValidate.test.ts`
Expected: PASS — 11 tests

- [ ] **Step 6: 커밋**

```bash
git add lib/advisors lib/__tests__/advisorValidate.test.ts && git commit -m "feat: 자문위원 도메인 타입과 프로필 입력 검증"
```

### Task 2: 배지 산출

**Files:**
- Create: `lib/advisors/badges.ts`
- Test: `lib/__tests__/advisorBadges.test.ts`

기능 지도의 경고를 코드로 옮기는 작업이다.

> "한국 `@*.ac.kr`은 학부생도 갖는다 — 학위과정 증빙이 따로 필요하다"

- [ ] **Step 1: 테스트를 먼저 쓴다**

`lib/__tests__/advisorBadges.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { deriveBadge, isInstitutionalDomain, badgeExplanation } from "@/lib/advisors/badges";

describe("isInstitutionalDomain", () => {
  it("대학·연구기관 도메인을 인정한다", () => {
    expect(isInstitutionalDomain("kim@snu.ac.kr")).toBe(true);
    expect(isInstitutionalDomain("kim@kaist.ac.kr")).toBe(true);
    expect(isInstitutionalDomain("kim@kist.re.kr")).toBe(true);
    expect(isInstitutionalDomain("kim@mit.edu")).toBe(true);
    expect(isInstitutionalDomain("kim@cam.ac.uk")).toBe(true);
  });

  it("개인 메일 서비스를 거절한다", () => {
    expect(isInstitutionalDomain("kim@gmail.com")).toBe(false);
    expect(isInstitutionalDomain("kim@naver.com")).toBe(false);
    expect(isInstitutionalDomain("kim@daum.net")).toBe(false);
    expect(isInstitutionalDomain("kim@kakao.com")).toBe(false);
  });

  it("대소문자와 공백에 흔들리지 않는다", () => {
    expect(isInstitutionalDomain("  KIM@SNU.AC.KR  ")).toBe(true);
  });

  it("형태가 깨진 주소를 거절한다", () => {
    expect(isInstitutionalDomain("kim")).toBe(false);
    expect(isInstitutionalDomain("kim@")).toBe(false);
    expect(isInstitutionalDomain("@snu.ac.kr")).toBe(false);
    expect(isInstitutionalDomain("kim@@snu.ac.kr")).toBe(false);
  });

  it("기업 자문위원은 도메인만으로 판정하지 않는다 — 서류 경로로 보낸다", () => {
    expect(isInstitutionalDomain("kim@samsung.com")).toBe(false);
  });
});

describe("deriveBadge", () => {
  it("이메일만 인증하면 '이메일 인증'", () => {
    expect(deriveBadge({ emailVerifiedAt: "2026-09-01T00:00:00Z", documentVerifiedAt: null }))
      .toBe("이메일 인증");
  });

  it("서류까지 확인되면 '서류 확인'", () => {
    expect(deriveBadge({
      emailVerifiedAt: "2026-09-01T00:00:00Z",
      documentVerifiedAt: "2026-09-05T00:00:00Z",
    })).toBe("서류 확인");
  });

  it("이메일 인증 없이 서류만 있으면 '서류 확인' — 기업 자문위원 경로", () => {
    expect(deriveBadge({ emailVerifiedAt: null, documentVerifiedAt: "2026-09-05T00:00:00Z" }))
      .toBe("서류 확인");
  });

  it("둘 다 없으면 null — 공개 대상이 아니다", () => {
    expect(deriveBadge({ emailVerifiedAt: null, documentVerifiedAt: null })).toBeNull();
  });
});

describe("badgeExplanation", () => {
  it("두 배지의 의미 차이를 학생에게 설명한다", () => {
    expect(badgeExplanation("이메일 인증")).toContain("소속 기관 이메일");
    expect(badgeExplanation("서류 확인")).toContain("서류");
  });

  it("설명이 서로 달라야 한다 — 같으면 배지를 나눈 의미가 없다", () => {
    expect(badgeExplanation("이메일 인증")).not.toBe(badgeExplanation("서류 확인"));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/__tests__/advisorBadges.test.ts`
Expected: FAIL — `Cannot find module '@/lib/advisors/badges'`

- [ ] **Step 3: 구현**

`lib/advisors/badges.ts`:

```ts
import type { AdvisorBadge } from "./types";

/**
 * 기관 이메일 도메인 판정.
 *
 * 화이트리스트가 아니라 접미사 규칙으로 본다 — 국내 대학·연구기관만 해도 수백 개라
 * 목록을 유지할 수 없고, 빠진 기관을 거절하면 그 사람은 그냥 떠난다.
 *
 * 기업 도메인(@samsung.com 등)은 여기서 통과시키지 않는다. 아무나 살 수 있는
 * 도메인과 구별할 방법이 없기 때문이다. 기업 자문위원은 서류 확인 경로로 보낸다.
 */
const INSTITUTION_SUFFIXES = [
  ".ac.kr", // 대학
  ".re.kr", // 정부출연연구기관
  ".edu", // 미국 등
  ".ac.uk",
  ".ac.jp",
  ".edu.au",
  ".edu.cn",
];

export function isInstitutionalDomain(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split("@");
  // "a@b" 형태가 정확히 아니면 거절 — "kim@@snu.ac.kr"은 parts.length가 3이다
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  return INSTITUTION_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}

/**
 * 배지 산출. 서류 확인이 이메일 인증을 덮는다.
 *
 * 서류만 있고 이메일 인증이 없는 경우를 허용하는 이유는 기업 연구원·실무자다.
 * 이들은 기관 도메인 판정을 통과할 수 없지만 재직증명서는 낼 수 있다.
 */
export function deriveBadge(input: {
  emailVerifiedAt: string | null;
  documentVerifiedAt: string | null;
}): AdvisorBadge | null {
  if (input.documentVerifiedAt) return "서류 확인";
  if (input.emailVerifiedAt) return "이메일 인증";
  return null;
}

/**
 * 학생에게 배지의 의미를 설명하는 문구.
 *
 * 두 배지의 차이를 명시하지 않으면 학생은 둘 다 "검증된 사람"으로 읽는다.
 * 무엇이 확인됐고 무엇이 확인되지 않았는지를 정확히 말해야 한다.
 */
export function badgeExplanation(badge: AdvisorBadge): string {
  if (badge === "서류 확인") {
    return "재학·재직 서류를 운영자가 직접 확인했습니다.";
  }
  return "소속 기관 이메일 주소를 확인했습니다. 학위 과정은 본인이 적은 그대로이며 서류로 확인하지는 않았습니다.";
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/__tests__/advisorBadges.test.ts`
Expected: PASS — 11 tests

- [ ] **Step 5: 커밋**

```bash
git add lib/advisors/badges.ts lib/__tests__/advisorBadges.test.ts && git commit -m "feat: 기관 이메일 판정과 2단계 배지 산출"
```

### Task 3: 정렬 · 응답률 · 추천 점수

**Files:**
- Create: `lib/advisors/ranking.ts`
- Test: `lib/__tests__/advisorRanking.test.ts`

물어볼Lab의 정렬 4축을 그대로 옮긴다 — 추천순 / 응답 빠른 순 / 최근 합류순 / 가나다순.

- [ ] **Step 1: 테스트를 먼저 쓴다**

`lib/__tests__/advisorRanking.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  responseRate,
  formatResponseTime,
  recommendationScore,
  sortAdvisors,
  SORT_KEYS,
} from "@/lib/advisors/ranking";
import type { Advisor } from "@/lib/advisors/types";

function advisor(over: Partial<Advisor> = {}): Advisor {
  return {
    id: "a1",
    displayName: "김연구",
    institution: "한국대학교",
    department: "화학과",
    position: "박사과정",
    labName: "",
    fields: ["유기화학"],
    bio: "",
    answerableTopics: [],
    monthlyQuota: 3,
    acceptsPrivate: true,
    status: "받는 중",
    badge: "이메일 인증",
    reviewState: "공개",
    answerCount: 0,
    assignedCount: 0,
    medianResponseHours: null,
    joinedAt: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("responseRate", () => {
  it("배정 대비 답변 비율을 낸다", () => {
    expect(responseRate(advisor({ answerCount: 3, assignedCount: 4 }))).toBe(0.75);
  });

  it("배정이 0이면 null — 0%로 표시하면 신규 자문위원이 부당하게 불리해진다", () => {
    expect(responseRate(advisor({ answerCount: 0, assignedCount: 0 }))).toBeNull();
  });

  it("1을 넘지 않는다", () => {
    expect(responseRate(advisor({ answerCount: 9, assignedCount: 4 }))).toBe(1);
  });
});

describe("formatResponseTime", () => {
  it("24시간 미만은 시간 단위", () => {
    expect(formatResponseTime(5)).toBe("보통 5시간 안에 답변");
  });

  it("1시간 미만은 '1시간 안에'로 묶는다", () => {
    expect(formatResponseTime(0.4)).toBe("보통 1시간 안에 답변");
  });

  it("24시간 이상은 일 단위로 반올림", () => {
    expect(formatResponseTime(30)).toBe("보통 1일 안에 답변");
    expect(formatResponseTime(50)).toBe("보통 2일 안에 답변");
  });

  it("이력이 없으면 안내 문구", () => {
    expect(formatResponseTime(null)).toBe("아직 답변 이력이 없어요");
  });
});

describe("recommendationScore", () => {
  it("'받는 중'이 '쉬는 중'보다 항상 앞선다", () => {
    const active = advisor({ status: "받는 중", answerCount: 0 });
    const resting = advisor({ status: "쉬는 중", answerCount: 100 });
    expect(recommendationScore(active)).toBeGreaterThan(recommendationScore(resting));
  });

  it("서류 확인 배지가 이메일 인증보다 높다", () => {
    const doc = advisor({ badge: "서류 확인" });
    const mail = advisor({ badge: "이메일 인증" });
    expect(recommendationScore(doc)).toBeGreaterThan(recommendationScore(mail));
  });

  it("답변 수가 많을수록 높다", () => {
    expect(recommendationScore(advisor({ answerCount: 10 })))
      .toBeGreaterThan(recommendationScore(advisor({ answerCount: 1 })));
  });

  it("답변 수 기여는 상한이 있다 — 소수가 목록을 독점하면 신규가 첫 질문을 못 받는다", () => {
    const many = recommendationScore(advisor({ answerCount: 500 }));
    const some = recommendationScore(advisor({ answerCount: 50 }));
    expect(many - some).toBeLessThan(5);
  });
});

describe("sortAdvisors", () => {
  const a = advisor({ id: "a", displayName: "가교수", joinedAt: "2026-01-01T00:00:00Z", medianResponseHours: 40 });
  const b = advisor({ id: "b", displayName: "나교수", joinedAt: "2026-06-01T00:00:00Z", medianResponseHours: 2 });
  const c = advisor({ id: "c", displayName: "다교수", joinedAt: "2026-03-01T00:00:00Z", medianResponseHours: null });

  it("가나다순", () => {
    expect(sortAdvisors([c, b, a], "가나다순").map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("최근 합류순 — 최신이 먼저", () => {
    expect(sortAdvisors([a, b, c], "최근 합류순").map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("응답 빠른 순 — 이력 없는 사람은 뒤로", () => {
    expect(sortAdvisors([a, c, b], "응답 빠른 순").map((x) => x.id)).toEqual(["b", "a", "c"]);
  });

  it("원본 배열을 변형하지 않는다", () => {
    const input = [c, b, a];
    sortAdvisors(input, "가나다순");
    expect(input.map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  it("정렬 키 4개가 모두 노출된다", () => {
    expect(SORT_KEYS).toEqual(["추천순", "응답 빠른 순", "최근 합류순", "가나다순"]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/__tests__/advisorRanking.test.ts`
Expected: FAIL — `Cannot find module '@/lib/advisors/ranking'`

- [ ] **Step 3: 구현**

`lib/advisors/ranking.ts`:

```ts
import type { Advisor } from "./types";

/** 물어볼Lab의 정렬축을 그대로 가져왔다. 첫 값이 기본 정렬이다. */
export const SORT_KEYS = [
  "추천순",
  "응답 빠른 순",
  "최근 합류순",
  "가나다순",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/**
 * 응답률. 배정 이력이 없으면 null을 돌려준다.
 *
 * 0/0을 0%로 표시하면 방금 합류한 자문위원이 "응답률 0%"로 보여서 아무도 고르지 않고,
 * 그러면 영원히 첫 질문을 못 받는다. 신규는 수치가 아니라 안내 문구로 처리한다.
 */
export function responseRate(a: Advisor): number | null {
  if (a.assignedCount <= 0) return null;
  return Math.min(1, a.answerCount / a.assignedCount);
}

/** 응답 시간을 학생이 읽을 문장으로 바꾼다. */
export function formatResponseTime(hours: number | null): string {
  if (hours === null) return "아직 답변 이력이 없어요";
  if (hours < 24) {
    const h = Math.max(1, Math.round(hours));
    return `보통 ${h}시간 안에 답변`;
  }
  return `보통 ${Math.round(hours / 24)}일 안에 답변`;
}

/**
 * 추천 점수. 기본 정렬이라 목록의 첫인상을 결정한다.
 *
 * 설계 의도: "지금 답변을 받을 수 있는가"를 최우선으로 둔다. 아무리 훌륭한
 * 자문위원이라도 '쉬는 중'이면 학생에게는 쓸모가 없다.
 *
 * 답변 수에 로그를 씌우는 이유 — 선형으로 두면 상위 몇 명이 목록 앞을 영구히
 * 점유하고, 신규 자문위원은 첫 질문을 받지 못해 이탈한다. 무급 공급은 그렇게 죽는다.
 */
export function recommendationScore(a: Advisor): number {
  let score = 0;
  if (a.status === "받는 중") score += 100;
  if (a.badge === "서류 확인") score += 20;
  score += Math.log10(a.answerCount + 1) * 5;
  const rate = responseRate(a);
  if (rate !== null) score += rate * 10;
  return score;
}

/** 정렬. 항상 새 배열을 돌려준다 — 서버 컴포넌트가 받은 배열을 재사용하기 때문이다. */
export function sortAdvisors(list: Advisor[], key: SortKey): Advisor[] {
  const copy = [...list];
  switch (key) {
    case "가나다순":
      return copy.sort((x, y) => x.displayName.localeCompare(y.displayName, "ko"));
    case "최근 합류순":
      return copy.sort((x, y) => (x.joinedAt < y.joinedAt ? 1 : -1));
    case "응답 빠른 순":
      // 이력이 없는 사람은 '빠르다'고 볼 근거가 없으므로 뒤로 보낸다
      return copy.sort((x, y) => {
        const a = x.medianResponseHours;
        const b = y.medianResponseHours;
        if (a === null && b === null) return 0;
        if (a === null) return 1;
        if (b === null) return -1;
        return a - b;
      });
    case "추천순":
    default:
      return copy.sort((x, y) => recommendationScore(y) - recommendationScore(x));
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/__tests__/advisorRanking.test.ts`
Expected: PASS — 15 tests

- [ ] **Step 5: 커밋**

```bash
git add lib/advisors/ranking.ts lib/__tests__/advisorRanking.test.ts && git commit -m "feat: 자문위원 정렬 4축과 응답률·추천 점수"
```
### Task 4: DB 스키마와 RLS

**Files:**
- Create: `supabase/migrations/0001_advisors.sql`

**RLS(Row Level Security)를 켜지 않으면 anon 키만으로 누구나 전체 테이블을 읽고 씁니다.** anon 키는 공개 값이므로(브라우저 번들에 들어간다) RLS가 유일한 방어선이다.

- [ ] **Step 1: 마이그레이션 작성**

`supabase/migrations/0001_advisors.sql`:

```sql
-- 자문위원 테이블.
--
-- institution_email은 인증 전용이며 어떤 공개 화면에도 나가지 않는다.
-- 공개 조회는 아래 advisors_public 뷰로만 하고, 그 뷰에 이 칼럼이 없다.

create table advisors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  -- 인증 (비공개)
  institution_email text not null,
  email_verified_at timestamptz,
  document_verified_at timestamptz,

  -- 정체 (공개)
  display_name text not null,
  institution text not null,
  department text not null,
  position text not null,
  lab_name text not null default '',
  fields text[] not null default '{}',
  bio text not null default '',
  answerable_topics text[] not null default '{}',

  -- 활동 (본인이 제어)
  monthly_quota int not null default 3 check (monthly_quota between 1 and 20),
  status text not null default '받는 중' check (status in ('받는 중', '쉬는 중')),
  accepts_private boolean not null default false,

  -- 심사
  review_state text not null default '심사 대기'
    check (review_state in ('심사 대기', '공개', '보류')),

  -- 통계 (시스템 산출 — 본인이 못 고친다)
  answer_count int not null default 0,
  assigned_count int not null default 0,
  median_response_hours numeric,

  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index advisors_public_idx on advisors (review_state, status);
create index advisors_fields_idx on advisors using gin (fields);

-- 공개 뷰. institution_email과 문서 인증 시각이 의도적으로 빠져 있다.
-- 애플리케이션은 목록·프로필 조회에 반드시 이 뷰를 쓴다.
create view advisors_public as
select
  id, display_name, institution, department, position, lab_name,
  fields, bio, answerable_topics, monthly_quota, status, accepts_private,
  review_state, answer_count, assigned_count, median_response_hours, joined_at,
  case
    when document_verified_at is not null then '서류 확인'
    when email_verified_at is not null then '이메일 인증'
    else null
  end as badge
from advisors
where review_state = '공개';

alter table advisors enable row level security;

-- 누구나 '공개' 상태인 행을 읽을 수 있다. 뷰가 비공개 칼럼을 이미 걸러낸다.
create policy "공개 자문위원은 누구나 조회"
  on advisors for select
  using (review_state = '공개');

-- 본인은 자기 행 전체를 읽는다 (심사 대기 중에도 자기 상태를 봐야 한다).
create policy "본인 행 조회"
  on advisors for select
  using (auth.uid() = user_id);

-- 가입: 자기 user_id로만 만들 수 있다.
create policy "본인 행 생성"
  on advisors for insert
  with check (auth.uid() = user_id);

-- 수정: 본인만. 단 심사·통계 칼럼은 아래 트리거가 되돌린다.
create policy "본인 행 수정"
  on advisors for update
  using (auth.uid() = user_id);

-- 자문위원이 자기 배지·심사 상태·답변 수를 올리지 못하게 막는다.
-- RLS는 '어느 행'인지만 통제하고 '어느 칼럼'인지는 통제하지 못하므로 트리거가 필요하다.
create or replace function protect_advisor_system_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.review_state := old.review_state;
  new.answer_count := old.answer_count;
  new.assigned_count := old.assigned_count;
  new.median_response_hours := old.median_response_hours;
  new.email_verified_at := old.email_verified_at;
  new.document_verified_at := old.document_verified_at;
  new.institution_email := old.institution_email;
  new.user_id := old.user_id;
  new.updated_at := now();
  return new;
end;
$$;

create trigger advisors_protect_system_columns
  before update on advisors
  for each row execute function protect_advisor_system_columns();
```

- [ ] **Step 2: Supabase SQL Editor에 붙여넣어 실행**

대시보드 → SQL Editor → 위 내용 실행. 오류 없이 끝나야 한다.

- [ ] **Step 3: RLS가 실제로 막는지 확인**

SQL Editor에서:

```sql
-- 익명 역할로 전환해 비공개 행이 보이는지 본다
set local role anon;
select count(*) from advisors;
```

Expected: `0` — 아직 '공개' 상태 행이 없으므로 익명에게는 아무것도 안 보여야 한다.
**여기서 행이 보이면 RLS가 안 켜진 것이다. 다음 Task로 넘어가지 마라.**

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/0001_advisors.sql && git commit -m "feat: 자문위원 테이블·공개 뷰·RLS 정책"
```

### Task 5: Supabase 클라이언트와 세션 프록시

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/admin.ts`
- Create: `proxy.ts`
- Modify: `package.json`

**⚠ 이 Task가 이 계획에서 가장 틀리기 쉬운 곳이다.** Supabase 공식 문서는 `middleware.ts`를 안내하지만, **Next.js 16에서 그 파일 규약은 폐기되었고 `proxy.ts`로 바뀌었다.** 공식 문서를 그대로 복사하면 세션 갱신이 조용히 동작하지 않는다.

근거: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md`
> "The `middleware.js` file convention has been **deprecated** in Next.js 16 and renamed to `proxy.js`."

- [ ] **Step 1: 의존성 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: 서버 클라이언트**

`lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트·Server Action용 Supabase 클라이언트.
 *
 * 요청마다 새로 만든다 — 모듈 최상단에 캐시하면 한 사용자의 세션이 다른 사용자
 * 요청에 새어 나간다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 세션 갱신은 proxy.ts가 담당하므로
            // 여기서 실패하는 것은 정상이고 무시해도 된다.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: 브라우저 클라이언트**

`lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 4: 운영자 클라이언트**

`lib/supabase/admin.ts`:

```ts
import "server-only";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * RLS를 전부 우회하는 클라이언트. 운영자 승인·통계 갱신에만 쓴다.
 *
 * "server-only"를 import하는 이유 — 이 파일이 실수로 클라이언트 컴포넌트에
 * 딸려 들어가면 빌드가 실패한다. service_role 키가 브라우저 번들에 들어가는 것보다
 * 빌드가 깨지는 편이 압도적으로 낫다.
 */
export function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
```

- [ ] **Step 5: `server-only` 설치**

```bash
npm install server-only
```

- [ ] **Step 6: 세션 갱신 프록시**

`proxy.ts` (프로젝트 루트 — `app/`과 같은 높이):

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase 세션 토큰 갱신.
 *
 * 파일 이름과 내보내는 함수 이름에 주의하라. Next.js 16에서 middleware 규약은
 * 폐기되고 proxy로 바뀌었다(next docs: 03-file-conventions/middleware.md).
 * Supabase 공식 문서는 아직 middleware.ts를 안내하므로 그대로 따르면 안 된다.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser()를 반드시 호출해야 토큰이 갱신된다. 반환값은 쓰지 않아도 된다.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 자문위원 기능이 붙는 경로에서만 돈다 — 가이드·자료실은 로그인이 없어서
  // 세션 갱신이 필요 없고, 전 경로에 걸면 정적 페이지 응답까지 느려진다.
  matcher: ["/advisors/:path*", "/questions/:path*", "/threads/:path*", "/admin/:path*"],
};
```

- [ ] **Step 7: 타입 검사와 빌드 확인**

Run: `npm run typecheck`
Expected: 오류 없음

Run: `npm run lint`
Expected: 오류 없음

- [ ] **Step 8: 커밋**

```bash
git add lib/supabase proxy.ts package.json package-lock.json && git commit -m "feat: Supabase 클라이언트와 세션 프록시(proxy.ts)"
```

### Task 6: 자문위원 지원 폼과 등록 Server Action

**Files:**
- Create: `lib/advisors/actions.ts`
- Create: `app/advisors/join/page.tsx`
- Create: `components/advisors/AdvisorJoinForm.tsx`
- Create: `app/advisors/verify/page.tsx`

- [ ] **Step 1: Supabase 대시보드에서 매직링크 설정**

Authentication → Providers → Email → **Confirm email 끄기**, **Magic Link 켜기**.
Authentication → URL Configuration → Redirect URLs에 다음을 추가한다:
- `https://www.yeonguhallab.kr/advisors/verify`
- `http://localhost:3000/advisors/verify`

- [ ] **Step 2: 등록 Server Action**

`lib/advisors/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateAdvisorProfile } from "./validate";
import { isInstitutionalDomain } from "./badges";
import { POSITIONS, type AdvisorProfileInput, type Position } from "./types";

export type ActionResult = { ok: true } | { ok: false; errors: string[] };

/** FormData를 도메인 입력으로 옮긴다. 검증은 하지 않는다 — 그건 validate가 한다. */
function readProfile(form: FormData): AdvisorProfileInput {
  const list = (key: string) =>
    String(form.get(key) ?? "")
      .split(",")
      .map((s) => s.trim());
  return {
    displayName: String(form.get("displayName") ?? ""),
    institution: String(form.get("institution") ?? ""),
    department: String(form.get("department") ?? ""),
    position: String(form.get("position") ?? "") as Position,
    labName: String(form.get("labName") ?? ""),
    fields: list("fields"),
    bio: String(form.get("bio") ?? ""),
    answerableTopics: list("answerableTopics"),
    monthlyQuota: Number(form.get("monthlyQuota") ?? 3),
    acceptsPrivate: form.get("acceptsPrivate") === "on",
  };
}

/**
 * 자문위원 프로필 등록.
 *
 * 이 함수는 인증되지 않은 POST 엔드포인트다(next docs: 02-guides/server-actions.md).
 * 폼을 거치지 않고 직접 호출될 수 있으므로 세션 확인과 검증을 여기서 다시 한다.
 */
export async function registerAdvisor(form: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, errors: ["먼저 기관 이메일 인증을 완료해주세요."] };
  }

  // 동의 항목은 하나라도 빠지면 등록 자체를 막는다 — 안전 정책의 근거가 된다
  const consents = ["agreeGuidelines", "agreeNoGifts", "agreeNoOffPlatform", "agreeUnpaid"];
  const missing = consents.filter((k) => form.get(k) !== "on");
  if (missing.length > 0) {
    return { ok: false, errors: ["아래 동의 항목에 모두 체크해주세요."] };
  }

  const result = validateAdvisorProfile(readProfile(form));
  if (!result.ok) return result;
  const p = result.value;

  // 기관 도메인이면 이메일 인증 배지를 즉시 준다.
  // 아니면(기업 등) 배지 없이 심사 대기로 두고 서류 확인 경로로 안내한다.
  const emailVerifiedAt = isInstitutionalDomain(user.email)
    ? new Date().toISOString()
    : null;

  const { error } = await supabase.from("advisors").insert({
    user_id: user.id,
    institution_email: user.email,
    email_verified_at: emailVerifiedAt,
    display_name: p.displayName,
    institution: p.institution,
    department: p.department,
    position: p.position,
    lab_name: p.labName,
    fields: p.fields,
    bio: p.bio,
    answerable_topics: p.answerableTopics,
    monthly_quota: p.monthlyQuota,
    accepts_private: p.acceptsPrivate,
  });

  if (error) {
    // 23505 = unique_violation. user_id에 unique가 걸려 있다.
    if (error.code === "23505") {
      return { ok: false, errors: ["이미 등록된 계정입니다."] };
    }
    return { ok: false, errors: ["등록에 실패했습니다. 잠시 후 다시 시도해주세요."] };
  }

  revalidatePath("/advisors");
  return { ok: true };
}
```

- [ ] **Step 3: 지원 폼 컴포넌트**

`components/advisors/AdvisorJoinForm.tsx`. 두 단계로 만든다 — ① 기관 이메일 입력 → 매직링크 발송, ② 인증 후 프로필 작성.

필수 요소:
- `POSITIONS`를 `<select>`로 렌더
- `fields`·`answerableTopics`는 쉼표 구분 텍스트 입력 (`readProfile`이 쉼표로 자른다)
- `monthlyQuota`는 `<input type="number" min={1} max={20}>`, 기본값 3
- 동의 체크박스 4개: `agreeGuidelines` `agreeNoGifts` `agreeNoOffPlatform` `agreeUnpaid`
- `useActionState`로 `registerAdvisor`의 `errors`를 화면에 표시
- 기존 폼 컴포넌트(`components/ResearchShowcaseForm.tsx`)의 마크업·클래스 관례를 따른다

동의 문구는 정확히 이렇게 쓴다:

| 이름 | 문구 |
|---|---|
| `agreeGuidelines` | 자문 가이드라인을 읽었고 이에 따라 활동하겠습니다. |
| `agreeNoGifts` | 학생에게 금품·상품권 등을 제공하지 않겠습니다. |
| `agreeNoOffPlatform` | 개인 연락처를 주고받거나 외부 채널로 대화를 옮기지 않겠습니다. |
| `agreeUnpaid` | 이 활동이 무급 자원 활동임을 확인합니다. |

이메일 발송 단계는 브라우저 클라이언트로 처리한다:

```ts
const supabase = createClient();
await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${window.location.origin}/advisors/verify` },
});
```

- [ ] **Step 4: 매직링크 착지 페이지**

`app/advisors/verify/page.tsx` — 세션을 확인하고 이미 등록된 자문위원이면 `/advisors/me`로, 아니면 `/advisors/join`의 프로필 작성 단계로 보낸다.

- [ ] **Step 5: 수동 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/advisors/join` 을 연다.
1. 기관 이메일 입력 → 메일함에 매직링크 도착 확인
2. 링크 클릭 → `/advisors/verify` 착지 확인
3. 프로필 작성 후 제출
4. Supabase 대시보드 Table Editor에서 `advisors` 행 생성 확인
5. `review_state`가 `심사 대기`인지 확인
6. **`gmail.com` 주소로도 시도해 `email_verified_at`이 `null`인지 확인**

- [ ] **Step 6: 커밋**

```bash
git add lib/advisors/actions.ts app/advisors components/advisors && git commit -m "feat: 자문위원 지원 폼과 매직링크 인증"
```

### Task 7: 자문위원 디렉토리

**Files:**
- Create: `lib/advisors/queries.ts`
- Create: `app/advisors/page.tsx`
- Create: `components/advisors/AdvisorCard.tsx`
- Create: `components/advisors/AdvisorFilters.tsx`
- Create: `components/advisors/AdvisorBadge.tsx`

- [ ] **Step 1: 읽기 질의**

`lib/advisors/queries.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { Advisor } from "./types";

/** DB의 snake_case 행을 도메인 타입으로 옮긴다. */
type Row = Record<string, unknown>;

function toAdvisor(row: Row): Advisor {
  return {
    id: String(row.id),
    displayName: String(row.display_name),
    institution: String(row.institution),
    department: String(row.department),
    position: row.position as Advisor["position"],
    labName: String(row.lab_name ?? ""),
    fields: (row.fields as string[]) ?? [],
    bio: String(row.bio ?? ""),
    answerableTopics: (row.answerable_topics as string[]) ?? [],
    monthlyQuota: Number(row.monthly_quota),
    acceptsPrivate: Boolean(row.accepts_private),
    status: row.status as Advisor["status"],
    badge: row.badge as Advisor["badge"],
    reviewState: row.review_state as Advisor["reviewState"],
    answerCount: Number(row.answer_count),
    assignedCount: Number(row.assigned_count),
    medianResponseHours:
      row.median_response_hours === null ? null : Number(row.median_response_hours),
    joinedAt: String(row.joined_at),
  };
}

/**
 * 공개 자문위원 전체.
 *
 * advisors가 아니라 advisors_public 뷰에서 읽는다 — 그 뷰에는 institution_email이
 * 아예 없어서, 실수로 프로필 객체를 통째로 클라이언트에 내려도 이메일이 새지 않는다.
 */
export async function getPublicAdvisors(): Promise<Advisor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("advisors_public").select("*");
  if (error || !data) return [];
  return data.map(toAdvisor);
}

export async function getAdvisorById(id: string): Promise<Advisor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advisors_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toAdvisor(data);
}
```

- [ ] **Step 2: 디렉토리 페이지**

`app/advisors/page.tsx` — 서버 컴포넌트. `getPublicAdvisors()`로 읽고, `searchParams`의 `sort`·`field`·`onlyActive`를 받아 `sortAdvisors`로 정렬한 뒤 카드 목록을 그린다.

필수 요소:
- 정렬 4축을 링크로 노출 (`SORT_KEYS` 사용, 기본 `추천순`)
- **"지금 질문 받는 중"** 필터 — 물어볼Lab이 쓰는 그 필터다
- 연구분야 필터
- 자문위원이 0명일 때의 빈 상태 문구와 `/advisors/join` 링크
- `metadata` export — title `"자문위원"`, description 작성
- 기존 페이지(`app/articles/page.tsx`)의 레이아웃·클래스 관례를 따른다

- [ ] **Step 3: 카드 컴포넌트**

`components/advisors/AdvisorCard.tsx`가 보여줄 것:
- 표시명 · 소속 · 학과 · 직위
- `AdvisorBadge` (`badgeExplanation`을 `title` 속성에 넣어 의미를 설명)
  - **`badge`가 `null`인 경우를 반드시 처리한다.** 기업 소속 자문위원은 기관 도메인
    판정을 통과하지 못해 배지 없이 공개될 수 있다. `badgeExplanation(null)`을 호출하면
    타입 오류가 나므로, 배지 영역 자체를 렌더하지 않는 분기를 둔다.
- 연구분야 태그
- 한 줄 소개
- `formatResponseTime(medianResponseHours)`
- 응답률 — `responseRate()`가 `null`이면 수치 대신 "새로 합류했어요"
- 상태 표시 ("지금 질문 받는 중" / "쉬는 중")

**이메일은 어디에도 그리지 않는다.** 타입에 아예 없으므로 실수할 수 없지만, 리뷰 시 다시 확인한다.

- [ ] **Step 4: 수동 확인**

Supabase Table Editor에서 방금 만든 행의 `review_state`를 `공개`로 바꾼 뒤:

```bash
npm run dev
```

`http://localhost:3000/advisors` 에서 확인한다:
1. 카드가 보이는가
2. 정렬 4축이 모두 동작하는가
3. "지금 질문 받는 중" 필터가 동작하는가
4. **페이지 소스에 이메일 주소가 없는가** (`Ctrl+U` 후 검색)
5. 다크 모드에서 읽히는가
6. 375px 폭에서 레이아웃이 깨지지 않는가

- [ ] **Step 5: 커밋**

```bash
git add lib/advisors/queries.ts app/advisors components/advisors && git commit -m "feat: 자문위원 디렉토리 — 정렬 4축·분야 필터·상태 필터"
```

### Task 8: 운영자 승인 화면

**Files:**
- Create: `app/admin/advisors/page.tsx`
- Modify: `lib/advisors/actions.ts`

- [ ] **Step 1: 권한 확인 헬퍼와 승인 액션 추가**

`lib/advisors/actions.ts`에 추가:

```ts
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * 운영자 여부. 환경변수의 이메일과 정확히 일치해야 한다.
 *
 * 이 확인을 액션마다 직접 부르는 이유 — Server Action은 페이지 접근 제어와 무관하게
 * POST로 직접 호출될 수 있다. 화면을 감췄다는 사실은 아무 보호도 되지 않는다.
 */
async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = process.env.ADVISOR_ADMIN_EMAIL;
  return Boolean(user?.email && admin && user.email === admin);
}

export async function setReviewState(
  advisorId: string,
  next: "공개" | "보류",
): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, errors: ["권한이 없습니다."] };
  }
  // 트리거가 본인 수정 경로에서 review_state를 되돌리므로 service_role로 쓴다
  const admin = createServiceClient();
  const { error } = await admin
    .from("advisors")
    .update({ review_state: next })
    .eq("id", advisorId);
  if (error) return { ok: false, errors: ["변경에 실패했습니다."] };
  revalidatePath("/advisors");
  revalidatePath("/admin/advisors");
  return { ok: true };
}

export async function markDocumentVerified(advisorId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, errors: ["권한이 없습니다."] };
  }
  const admin = createServiceClient();
  const { error } = await admin
    .from("advisors")
    .update({ document_verified_at: new Date().toISOString() })
    .eq("id", advisorId);
  if (error) return { ok: false, errors: ["변경에 실패했습니다."] };
  revalidatePath("/advisors");
  revalidatePath("/admin/advisors");
  return { ok: true };
}
```

- [ ] **Step 2: 승인 화면**

`app/admin/advisors/page.tsx` — 서버 컴포넌트.
- 첫 줄에서 `requireAdmin()` 확인, 실패 시 `notFound()` (403보다 낫다 — 이 경로의 존재 자체를 숨긴다)
- `service_role`로 `advisors` 원본 테이블에서 `review_state = '심사 대기'` 행을 읽는다 (**여기서는 기관 이메일을 보여준다** — 도메인을 눈으로 확인하는 것이 심사의 핵심이다)
- 각 행에 `공개` / `보류` / `서류 확인 완료` 버튼
- `robots: { index: false, follow: false }` metadata 필수

- [ ] **Step 3: 수동 확인**

1. 운영자 이메일로 로그인 → `/admin/advisors` 접근 가능
2. 다른 이메일로 로그인 → 404
3. 로그아웃 상태 → 404
4. `공개` 클릭 → `/advisors`에 즉시 반영
5. `서류 확인 완료` 클릭 → 배지가 `서류 확인`으로 바뀜

- [ ] **Step 4: 커밋**

```bash
git add app/admin lib/advisors/actions.ts && git commit -m "feat: 운영자 자문위원 승인 화면"
```

### Task 8.5: 연구실 묶어보기

**Files:**
- Create: `lib/advisors/labs.ts`
- Test: `lib/__tests__/advisorLabs.test.ts`
- Modify: `app/advisors/page.tsx`

설계 §A의 "연구실 디렉토리 — 채택(축소)"에 해당한다. 별도 랩 DB를 만들지 않고, 이미 있는 프로필의 소속 랩을 역으로 묶는다.

- [ ] **Step 1: 테스트를 먼저 쓴다**

`lib/__tests__/advisorLabs.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { groupByLab } from "@/lib/advisors/labs";
import type { Advisor } from "@/lib/advisors/types";

function advisor(over: Partial<Advisor> = {}): Advisor {
  return {
    id: "a1", displayName: "김연구", institution: "한국대학교", department: "화학과",
    position: "박사과정", labName: "", fields: ["유기화학"], bio: "",
    answerableTopics: [], monthlyQuota: 3, acceptsPrivate: true,
    status: "받는 중", badge: "이메일 인증", reviewState: "공개",
    answerCount: 0, assignedCount: 0, medianResponseHours: null,
    joinedAt: "2026-01-01T00:00:00Z", ...over,
  };
}

describe("groupByLab", () => {
  it("같은 기관·같은 랩을 하나로 묶는다", () => {
    const a = advisor({ id: "a", labName: "분자설계연구실" });
    const b = advisor({ id: "b", labName: "분자설계연구실" });
    const groups = groupByLab([a, b]);
    expect(groups.length).toBe(1);
    expect(groups[0].members.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("기관이 다르면 랩 이름이 같아도 나눈다 — 흔한 이름이 섞이면 안 된다", () => {
    const a = advisor({ id: "a", institution: "한국대학교", labName: "생물학연구실" });
    const b = advisor({ id: "b", institution: "대한대학교", labName: "생물학연구실" });
    expect(groupByLab([a, b]).length).toBe(2);
  });

  it("랩 이름이 없는 자문위원은 제외한다 — 기업 소속은 랩이 없다", () => {
    expect(groupByLab([advisor({ labName: "" })])).toEqual([]);
  });

  it("'지금 질문 받는 중'인 인원 수를 함께 낸다", () => {
    const a = advisor({ id: "a", labName: "L", status: "받는 중" });
    const b = advisor({ id: "b", labName: "L", status: "쉬는 중" });
    expect(groupByLab([a, b])[0].activeCount).toBe(1);
  });

  it("인원이 많은 랩이 먼저 온다", () => {
    const solo = advisor({ id: "s", institution: "A대", labName: "혼자랩" });
    const x = advisor({ id: "x", institution: "B대", labName: "둘랩" });
    const y = advisor({ id: "y", institution: "B대", labName: "둘랩" });
    expect(groupByLab([solo, x, y])[0].labName).toBe("둘랩");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/__tests__/advisorLabs.test.ts`
Expected: FAIL — `Cannot find module '@/lib/advisors/labs'`

- [ ] **Step 3: 구현**

`lib/advisors/labs.ts`:

```ts
import type { Advisor } from "./types";

export type LabGroup = {
  institution: string;
  labName: string;
  members: Advisor[];
  /** 지금 질문을 받는 인원 수 — 물어볼Lab이 랩마다 붙이는 그 숫자다 */
  activeCount: number;
};

/**
 * 소속 랩으로 자문위원을 묶는다.
 *
 * 별도의 랩 테이블을 만들지 않는 이유 — 랩 정보를 따로 관리하면 프로필과 어긋나고,
 * 자문위원이 랩을 옮겼을 때 갱신할 주체가 없다. 프로필에서 파생시키면 항상 일치한다.
 *
 * 기관까지 키에 넣는 이유는 "생물학연구실" 같은 흔한 이름이 서로 다른 대학에서
 * 하나로 합쳐지는 것을 막기 위해서다.
 */
export function groupByLab(list: Advisor[]): LabGroup[] {
  const map = new Map<string, LabGroup>();

  for (const a of list) {
    const labName = a.labName.trim();
    if (!labName) continue;
    const key = JSON.stringify([a.institution, labName]);
    let group = map.get(key);
    if (!group) {
      group = { institution: a.institution, labName, members: [], activeCount: 0 };
      map.set(key, group);
    }
    group.members.push(a);
    if (a.status === "받는 중") group.activeCount += 1;
  }

  return [...map.values()].sort((x, y) => y.members.length - x.members.length);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/__tests__/advisorLabs.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: 디렉토리에 붙인다**

`app/advisors/page.tsx`에 "연구실로 보기" 섹션을 넣는다. 각 랩에 소속 자문위원과 `activeCount`를 표시한다. **랩이 하나도 없으면 섹션을 렌더하지 않는다.**

- [ ] **Step 6: 커밋**

```bash
git add lib/advisors/labs.ts lib/__tests__/advisorLabs.test.ts app/advisors/page.tsx && git commit -m "feat: 소속 랩으로 자문위원 묶어보기"
```

### Task 9: 개별 프로필 · 본인 설정 · 내비게이션

**Files:**
- Create: `app/advisors/[id]/page.tsx`
- Create: `app/advisors/me/page.tsx`
- Modify: `components/SiteNav.tsx:12-17`
- Modify: `app/sitemap.ts`

- [ ] **Step 1: 개별 프로필 페이지**

`app/advisors/[id]/page.tsx` — `getAdvisorById()`로 읽고, 없으면 `notFound()`.
`generateMetadata`로 제목을 `"{표시명} · {소속}"`으로 만든다.
카드보다 넓은 정보(답변 가능 분야 전체, 소속 랩, 누적 답변 수, 합류일)를 보여준다.

- [ ] **Step 2: 본인 설정 페이지**

`app/advisors/me/page.tsx` — 자문위원이 스스로 바꿀 수 있는 것만 노출한다.
`status`(받는 중/쉬는 중), `monthlyQuota`, `acceptsPrivate`, 프로필 텍스트.
DB 트리거가 시스템 칼럼을 되돌리므로 여기서 배지·심사 상태는 아예 폼에 넣지 않는다.

`lib/advisors/actions.ts`에 `updateOwnProfile(form: FormData)`을 추가한다.
`registerAdvisor`와 같은 검증(`validateAdvisorProfile`)을 통과시키고, `eq("user_id", user.id)`로 갱신한다.

- [ ] **Step 3: 헤더에 링크 추가**

`components/SiteNav.tsx`의 `LINKS` 배열에 추가:

```tsx
{ href: "/advisors", prefix: "", label: "자문위원" },
```

**주의:** 이 파일의 주석이 경고하듯 375px 헤더는 가용폭을 이미 다 쓰고 있다. 항목을 하나 더 늘린 뒤 **375px와 320px에서 실제로 확인해야 한다.** 넘치면 `prefix`/`label` 축약 방식을 다른 항목과 같은 규칙으로 조정한다.

- [ ] **Step 4: 사이트맵에 추가**

`app/sitemap.ts`에 `/advisors`와 각 자문위원 프로필 URL을 넣는다.
`/advisors/join`·`/advisors/me`·`/admin/*`은 **넣지 않는다.**

- [ ] **Step 5: 전체 검사**

Run: `npm test`
Expected: PASS — 전체

Run: `npm run typecheck`
Expected: 오류 없음

Run: `npm run lint`
Expected: 오류 없음

- [ ] **Step 6: 375px·320px 헤더 확인**

`npm run dev` 후 브라우저 개발자도구에서 폭을 375px와 320px로 두고, 헤더 항목이 세로로 접히거나 잘려서 닿을 수 없게 되지 않는지 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add app components/SiteNav.tsx lib/advisors/actions.ts && git commit -m "feat: 자문위원 프로필·본인 설정 페이지와 내비게이션 링크"
```

## Phase 1 완료 검증

전부 통과해야 Phase 2로 넘어간다.

- [ ] `npm test` · `npm run typecheck` · `npm run lint` 모두 통과
- [ ] 기관 이메일로 지원 → 매직링크 → 프로필 등록 → 운영자 승인 → 목록 노출까지 처음부터 끝까지 동작
- [ ] `gmail.com`으로 지원하면 배지 없이 심사 대기에 머무름
- [ ] `/advisors` 페이지 소스에 어떤 이메일 주소도 없음
- [ ] 비운영자 계정으로 `/admin/advisors` 접근 시 404
- [ ] Supabase SQL Editor에서 `set local role anon; select institution_email from advisors_public;` 실행 시 **칼럼 없음 오류**가 나는지 확인 (뷰에 칼럼이 없어야 정상)
- [ ] 375px·320px에서 헤더와 카드 레이아웃 정상
- [ ] 다크 모드 정상
---

# Phase 2 — 공개 비동기 Q&A

**완료 시 출시 가능한 상태:** 학생이 질문을 올리면 분야가 맞는 자문위원에게 배정되고, 답변이 공개 게시되어 검색에 노출된다.

**이 Phase의 실패 사례를 기억하라.** 기능 지도에 이렇게 기록돼 있다.

> "물어볼Lab의 게시판은 현재 **비어 있다** — 공급(79명)은 모았지만 질문이 안 올라온다."

그래서 질문 작성 화면의 마찰을 최대한 줄이는 것이 이 Phase의 핵심 설계 목표다. 로그인 요구를 뒤로 미루고, 기존 아이디어 생성 도구와 연결하고, 예시 질문을 보여준다.

### Task 10: 질문↔자문위원 매칭

**Files:**
- Create: `lib/advisors/matching.ts`
- Test: `lib/__tests__/advisorMatching.test.ts`

- [ ] **Step 1: 테스트를 먼저 쓴다**

`lib/__tests__/advisorMatching.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { matchAdvisors, type MatchInput } from "@/lib/advisors/matching";
import type { Advisor } from "@/lib/advisors/types";

function advisor(over: Partial<Advisor> = {}): Advisor {
  return {
    id: "a1",
    displayName: "김연구",
    institution: "한국대학교",
    department: "화학과",
    position: "박사과정",
    labName: "",
    fields: ["유기화학"],
    bio: "",
    answerableTopics: [],
    monthlyQuota: 3,
    acceptsPrivate: true,
    status: "받는 중",
    badge: "이메일 인증",
    reviewState: "공개",
    answerCount: 0,
    assignedCount: 0,
    medianResponseHours: null,
    joinedAt: "2026-01-01T00:00:00Z",
    ...over,
  };
}

const base: MatchInput = { fields: ["유기화학"], answeredThisMonth: {} };

describe("matchAdvisors", () => {
  it("분야가 겹치는 자문위원만 고른다", () => {
    const chem = advisor({ id: "chem", fields: ["유기화학"] });
    const bio = advisor({ id: "bio", fields: ["분자생물학"] });
    expect(matchAdvisors([chem, bio], base).map((a) => a.id)).toEqual(["chem"]);
  });

  it("겹치는 분야가 많을수록 앞에 온다", () => {
    const one = advisor({ id: "one", fields: ["유기화학"] });
    const two = advisor({ id: "two", fields: ["유기화학", "촉매"] });
    const input: MatchInput = { fields: ["유기화학", "촉매"], answeredThisMonth: {} };
    expect(matchAdvisors([one, two], input).map((a) => a.id)).toEqual(["two", "one"]);
  });

  it("'쉬는 중'인 자문위원은 제외한다", () => {
    const resting = advisor({ id: "r", status: "쉬는 중" });
    expect(matchAdvisors([resting], base)).toEqual([]);
  });

  it("이번 달 쿼터를 채웠으면 제외한다", () => {
    const full = advisor({ id: "full", monthlyQuota: 2 });
    const input: MatchInput = { fields: ["유기화학"], answeredThisMonth: { full: 2 } };
    expect(matchAdvisors([full], input)).toEqual([]);
  });

  it("쿼터에 여유가 있으면 포함한다", () => {
    const room = advisor({ id: "room", monthlyQuota: 3 });
    const input: MatchInput = { fields: ["유기화학"], answeredThisMonth: { room: 2 } };
    expect(matchAdvisors([room], input).map((a) => a.id)).toEqual(["room"]);
  });

  it("겹침 수가 같으면 답변이 적은 쪽을 먼저 — 신규에게 첫 질문을 준다", () => {
    const busy = advisor({ id: "busy", answerCount: 50 });
    const fresh = advisor({ id: "fresh", answerCount: 0 });
    expect(matchAdvisors([busy, fresh], base).map((a) => a.id)).toEqual(["fresh", "busy"]);
  });

  it("맞는 사람이 없으면 빈 배열 — 호출부가 안내 문구를 띄운다", () => {
    expect(matchAdvisors([], base)).toEqual([]);
  });

  it("질문 분야가 비면 아무도 고르지 않는다", () => {
    const any = advisor();
    expect(matchAdvisors([any], { fields: [], answeredThisMonth: {} })).toEqual([]);
  });

  it("원본 배열을 변형하지 않는다", () => {
    const list = [advisor({ id: "x" }), advisor({ id: "y" })];
    matchAdvisors(list, base);
    expect(list.map((a) => a.id)).toEqual(["x", "y"]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/__tests__/advisorMatching.test.ts`
Expected: FAIL — `Cannot find module '@/lib/advisors/matching'`

- [ ] **Step 3: 구현**

`lib/advisors/matching.ts`:

```ts
import type { Advisor } from "./types";

export type MatchInput = {
  /** 질문에 붙은 분야 태그 */
  fields: string[];
  /** 자문위원 id별 이번 달 답변 수 */
  answeredThisMonth: Record<string, number>;
};

/**
 * 질문에 맞는 자문위원을 고른다.
 *
 * 정렬 2순위를 '답변 적은 순'으로 둔 것이 이 함수의 핵심이다. 답변 많은 사람에게
 * 계속 몰아주면 신규 자문위원은 첫 질문을 못 받고 그대로 떠난다. 무급 공급에서는
 * 이 이탈이 곧 서비스 종료다.
 */
export function matchAdvisors(list: Advisor[], input: MatchInput): Advisor[] {
  const wanted = new Set(input.fields);
  if (wanted.size === 0) return [];

  const scored = list
    .filter((a) => a.status === "받는 중")
    .filter((a) => (input.answeredThisMonth[a.id] ?? 0) < a.monthlyQuota)
    .map((a) => ({
      advisor: a,
      overlap: a.fields.filter((f) => wanted.has(f)).length,
    }))
    .filter((entry) => entry.overlap > 0);

  scored.sort((x, y) => {
    if (y.overlap !== x.overlap) return y.overlap - x.overlap;
    return x.advisor.answerCount - y.advisor.answerCount;
  });

  return scored.map((entry) => entry.advisor);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/__tests__/advisorMatching.test.ts`
Expected: PASS — 9 tests

- [ ] **Step 5: 커밋**

```bash
git add lib/advisors/matching.ts lib/__tests__/advisorMatching.test.ts && git commit -m "feat: 질문 분야 기반 자문위원 매칭"
```

### Task 11: 월 쿼터 계산

**Files:**
- Create: `lib/advisors/quota.ts`
- Test: `lib/__tests__/advisorQuota.test.ts`

- [ ] **Step 1: 테스트를 먼저 쓴다**

`lib/__tests__/advisorQuota.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { monthKey, countThisMonth, quotaRemaining } from "@/lib/advisors/quota";

describe("monthKey", () => {
  it("한국 시각 기준 YYYY-MM을 낸다", () => {
    expect(monthKey(new Date("2026-09-10T05:00:00Z"))).toBe("2026-09");
  });

  it("UTC 기준 월말 밤은 한국에서 다음 달이다", () => {
    // 2026-08-31T20:00Z = 2026-09-01 05:00 KST
    expect(monthKey(new Date("2026-08-31T20:00:00Z"))).toBe("2026-09");
  });

  it("연말을 넘긴다", () => {
    expect(monthKey(new Date("2026-12-31T20:00:00Z"))).toBe("2027-01");
  });
});

describe("countThisMonth", () => {
  const now = new Date("2026-09-10T00:00:00Z");

  it("이번 달 답변만 센다", () => {
    const times = [
      "2026-09-01T00:00:00Z",
      "2026-09-09T00:00:00Z",
      "2026-08-20T00:00:00Z",
    ];
    expect(countThisMonth(times, now)).toBe(2);
  });

  it("이력이 없으면 0", () => {
    expect(countThisMonth([], now)).toBe(0);
  });
});

describe("quotaRemaining", () => {
  it("남은 건수를 낸다", () => {
    expect(quotaRemaining(5, 2)).toBe(3);
  });

  it("음수가 되지 않는다 — 운영자가 쿼터를 낮췄을 수 있다", () => {
    expect(quotaRemaining(2, 5)).toBe(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/__tests__/advisorQuota.test.ts`
Expected: FAIL — `Cannot find module '@/lib/advisors/quota'`

- [ ] **Step 3: 구현**

`lib/advisors/quota.ts`:

```ts
/**
 * 월 쿼터 계산.
 *
 * 자문위원이 "시간을 얼마나 뺏길지 모른다"고 느끼면 등록 자체를 하지 않는다.
 * 상한을 본인이 정하게 하는 것이 무급 공급을 유지하는 장치다
 * (Letters to a Pre-Scientist가 '연 4통'으로 자원봉사자 1,000명 이상을 모은 원리).
 */

/**
 * 한국 시각 기준 'YYYY-MM'.
 *
 * UTC로 계산하면 매월 1일 0~9시 사이 답변이 지난달로 집계돼, 자문위원이
 * "이번 달에 하나도 안 했는데 쿼터가 찼다"는 상황을 겪는다.
 */
export function monthKey(at: Date): string {
  const kst = new Date(at.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function countThisMonth(answeredAt: string[], now: Date): number {
  const key = monthKey(now);
  return answeredAt.filter((t) => monthKey(new Date(t)) === key).length;
}

export function quotaRemaining(quota: number, used: number): number {
  return Math.max(0, quota - used);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/__tests__/advisorQuota.test.ts`
Expected: PASS — 7 tests

- [ ] **Step 5: 커밋**

```bash
git add lib/advisors/quota.ts lib/__tests__/advisorQuota.test.ts && git commit -m "feat: 한국 시각 기준 월 답변 쿼터 계산"
```

### Task 12: 질문·답변 스키마

**Files:**
- Create: `supabase/migrations/0002_questions.sql`

- [ ] **Step 1: 마이그레이션 작성**

`supabase/migrations/0002_questions.sql`:

```sql
create table questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  fields text[] not null default '{}',
  school_level text not null check (school_level in ('중학생', '고등학생', '기타')),
  -- 게시 전 운영자 검토를 거친다. 공개 게시물이라 AdSense 정책 노출이 있다.
  review_state text not null default '검토 대기'
    check (review_state in ('검토 대기', '공개', '보류')),
  created_at timestamptz not null default now()
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  advisor_id uuid not null references advisors(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- 어떤 자문위원에게 어떤 질문이 배정됐는지. 응답률의 분모가 여기서 나온다.
create table question_assignments (
  question_id uuid not null references questions(id) on delete cascade,
  advisor_id uuid not null references advisors(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  answered_at timestamptz,
  primary key (question_id, advisor_id)
);

create index questions_public_idx on questions (review_state, created_at desc);
create index questions_fields_idx on questions using gin (fields);
create index assignments_advisor_idx on question_assignments (advisor_id, answered_at);

alter table questions enable row level security;
alter table answers enable row level security;
alter table question_assignments enable row level security;

create policy "공개 질문은 누구나 조회"
  on questions for select using (review_state = '공개');

create policy "본인 질문 조회"
  on questions for select using (auth.uid() = author_id);

create policy "로그인 사용자는 질문 작성"
  on questions for insert with check (auth.uid() = author_id);

create policy "공개 질문의 답변은 누구나 조회"
  on answers for select using (
    exists (
      select 1 from questions q
      where q.id = answers.question_id and q.review_state = '공개'
    )
  );

-- 배정받은 자문위원 본인만 답변을 쓸 수 있다.
create policy "배정된 자문위원만 답변 작성"
  on answers for insert with check (
    exists (
      select 1 from advisors a
      join question_assignments qa on qa.advisor_id = a.id
      where a.id = answers.advisor_id
        and a.user_id = auth.uid()
        and qa.question_id = answers.question_id
    )
  );

create policy "본인 배정 조회"
  on question_assignments for select using (
    exists (
      select 1 from advisors a
      where a.id = question_assignments.advisor_id and a.user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: SQL Editor에서 실행**

오류 없이 끝나야 한다.

- [ ] **Step 3: 권한 확인**

```sql
set local role anon;
select count(*) from questions;
```

Expected: `0`

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/0002_questions.sql && git commit -m "feat: 질문·답변·배정 테이블과 RLS"
```

### Task 13: 질문 작성과 목록

**Files:**
- Create: `app/questions/page.tsx`
- Create: `app/questions/new/page.tsx`
- Create: `app/questions/[id]/page.tsx`
- Create: `components/advisors/QuestionForm.tsx`
- Modify: `lib/advisors/actions.ts`

- [ ] **Step 1: 질문 작성 액션**

`lib/advisors/actions.ts`에 추가:

```ts
import { matchAdvisors } from "./matching";
import { getPublicAdvisors } from "./queries";
import { countThisMonth } from "./quota";

const MAX_TITLE = 100;
const MAX_BODY = 2000;
/** 한 질문에 배정할 자문위원 수. 너무 많으면 아무도 자기 차례라고 느끼지 않는다. */
const ASSIGN_COUNT = 3;

export async function askQuestion(form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, errors: ["로그인이 필요합니다."] };

  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const schoolLevel = String(form.get("schoolLevel") ?? "");
  const fields = String(form.get("fields") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const errors: string[] = [];
  if (!title) errors.push("질문 제목을 입력해주세요.");
  if (title.length > MAX_TITLE) errors.push(`제목은 ${MAX_TITLE}자 이내로 써주세요.`);
  if (!body) errors.push("질문 내용을 입력해주세요.");
  if (body.length > MAX_BODY) errors.push(`내용은 ${MAX_BODY}자 이내로 써주세요.`);
  if (fields.length === 0) errors.push("분야를 1개 이상 선택해주세요.");
  if (!["중학생", "고등학생", "기타"].includes(schoolLevel)) {
    errors.push("학교급을 선택해주세요.");
  }
  if (errors.length > 0) return { ok: false, errors };

  const { data: question, error } = await supabase
    .from("questions")
    .insert({ author_id: user.id, title, body, fields, school_level: schoolLevel })
    .select("id")
    .single();

  if (error || !question) {
    return { ok: false, errors: ["질문 등록에 실패했습니다."] };
  }

  await assignAdvisors(String(question.id), fields);
  revalidatePath("/questions");
  return { ok: true };
}

/**
 * 분야가 맞는 자문위원에게 질문을 배정한다.
 *
 * service_role을 쓰는 이유 — 배정 행은 질문자가 만들지만 대상은 남의 행이라
 * 질문자 권한으로는 쓸 수 없다. 배정 자체가 시스템 동작이다.
 */
async function assignAdvisors(questionId: string, fields: string[]): Promise<void> {
  const admin = createServiceClient();
  const advisors = await getPublicAdvisors();

  const { data: rows } = await admin
    .from("question_assignments")
    .select("advisor_id, answered_at")
    .not("answered_at", "is", null);

  const answeredThisMonth: Record<string, number> = {};
  for (const advisor of advisors) {
    const times = (rows ?? [])
      .filter((r) => String(r.advisor_id) === advisor.id)
      .map((r) => String(r.answered_at));
    answeredThisMonth[advisor.id] = countThisMonth(times, new Date());
  }

  const matched = matchAdvisors(advisors, { fields, answeredThisMonth }).slice(0, ASSIGN_COUNT);
  if (matched.length === 0) return;

  await admin.from("question_assignments").insert(
    matched.map((a) => ({ question_id: questionId, advisor_id: a.id })),
  );

  // 응답률의 분모를 올린다
  for (const a of matched) {
    await admin.rpc("increment_assigned_count", { advisor: a.id });
  }
}
```

- [ ] **Step 2: 카운터 증가 함수를 DB에 추가**

`supabase/migrations/0002_questions.sql` 아래에 이어 붙이고 SQL Editor에서 실행:

```sql
create or replace function increment_assigned_count(advisor uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update advisors set assigned_count = assigned_count + 1 where id = advisor;
$$;
```

- [ ] **Step 3: 질문 작성 화면**

`app/questions/new/page.tsx` + `components/advisors/QuestionForm.tsx`.

**마찰을 줄이는 것이 이 화면의 유일한 목표다.** 물어볼Lab이 79명을 모으고도 게시물 0건인 이유가 여기 있다.

반드시 넣을 것:
- 예시 질문 3개를 접이식으로 노출 — 빈 칸 앞에서 학생은 멈춘다
- 기존 아이디어 생성 도구(`components/TopicIdeaGenerator.tsx`) 링크
- 분야 선택은 자유 입력이 아니라 자문위원들이 실제로 등록한 분야 목록에서 고르게 한다 (매칭이 되는 분야만 보여야 한다)
- 글자 수 표시
- 로그인은 **제출 시점에** 요구한다. 작성 전에 막으면 대부분 떠난다

- [ ] **Step 4: 목록과 상세**

`app/questions/page.tsx` — `review_state = '공개'`인 질문 목록, 최신순, 분야 필터.
`app/questions/[id]/page.tsx` — 질문 본문과 답변 목록. 답변자는 `AdvisorCard`의 축약형으로 표시하고 배지를 붙인다. `generateMetadata`로 질문 제목을 페이지 제목에 넣는다(검색 자산이 되는 지점이다).

- [ ] **Step 5: 수동 확인**

1. 질문 작성 → `questions` 행 생성
2. `question_assignments`에 최대 3행 생성
3. 분야가 안 맞으면 배정 0행 (오류 없이 넘어가야 한다)
4. `advisors.assigned_count` 증가 확인
5. `review_state`를 `공개`로 바꾸면 `/questions`에 노출

- [ ] **Step 6: 커밋**

```bash
git add app/questions components/advisors lib/advisors/actions.ts supabase/migrations && git commit -m "feat: 공개 질문 작성·배정·목록"
```

### Task 14: 답변 작성과 통계 갱신

**Files:**
- Create: `components/advisors/AnswerForm.tsx`
- Modify: `lib/advisors/actions.ts`
- Create: `supabase/migrations/0004_stats.sql`

- [ ] **Step 1: 통계 갱신 함수**

`supabase/migrations/0004_stats.sql`:

```sql
-- 답변 저장 시 배정 행을 닫고 자문위원 통계를 다시 계산한다.
-- 애플리케이션이 아니라 DB에서 하는 이유 — 답변 저장과 통계가 갈라지면
-- 응답률이 영구히 틀어지고, 사후에 바로잡을 방법이 없다.
create or replace function record_answer(
  p_question_id uuid,
  p_advisor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update question_assignments
     set answered_at = now()
   where question_id = p_question_id
     and advisor_id = p_advisor_id
     and answered_at is null;

  update advisors a
     set answer_count = (
           select count(*) from question_assignments qa
            where qa.advisor_id = a.id and qa.answered_at is not null
         ),
         median_response_hours = (
           select percentile_cont(0.5) within group (
                    order by extract(epoch from (qa.answered_at - qa.assigned_at)) / 3600
                  )
             from question_assignments qa
            where qa.advisor_id = a.id and qa.answered_at is not null
         )
   where a.id = p_advisor_id;
end;
$$;
```

- [ ] **Step 2: SQL Editor에서 실행**

- [ ] **Step 3: 답변 액션**

`lib/advisors/actions.ts`에 추가:

```ts
const MAX_ANSWER = 4000;

export async function postAnswer(form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, errors: ["로그인이 필요합니다."] };

  const questionId = String(form.get("questionId") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { ok: false, errors: ["답변 내용을 입력해주세요."] };
  if (body.length > MAX_ANSWER) {
    return { ok: false, errors: [`답변은 ${MAX_ANSWER}자 이내로 써주세요.`] };
  }

  // 본인의 자문위원 행을 찾는다. 없으면 자문위원이 아니다.
  const { data: advisor } = await supabase
    .from("advisors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!advisor) return { ok: false, errors: ["자문위원만 답변할 수 있습니다."] };

  const advisorId = String(advisor.id);

  // 배정 여부는 RLS 정책이 다시 확인한다. 여기서 실패하면 배정받지 않은 질문이다.
  const { error } = await supabase
    .from("answers")
    .insert({ question_id: questionId, advisor_id: advisorId, body });
  if (error) {
    return { ok: false, errors: ["이 질문에 답변할 권한이 없습니다."] };
  }

  const admin = createServiceClient();
  await admin.rpc("record_answer", {
    p_question_id: questionId,
    p_advisor_id: advisorId,
  });

  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/advisors");
  return { ok: true };
}
```

- [ ] **Step 4: 답변 폼**

`components/advisors/AnswerForm.tsx` — 배정받은 자문위원에게만 보인다.
남은 쿼터를 함께 표시한다 (`quotaRemaining` 사용).

- [ ] **Step 5: 수동 확인**

1. 배정받은 자문위원 계정으로 답변 작성 → 성공
2. 배정받지 않은 자문위원 계정으로 같은 질문에 답변 시도 → **거부**
3. `question_assignments.answered_at` 채워짐
4. `advisors.answer_count` 증가, `median_response_hours` 계산됨
5. `/advisors` 카드의 응답률·응답시간 표시가 바뀜

- [ ] **Step 6: 커밋**

```bash
git add components/advisors/AnswerForm.tsx lib/advisors/actions.ts supabase/migrations/0004_stats.sql && git commit -m "feat: 답변 작성과 응답률·응답시간 자동 갱신"
```

## Phase 2 완료 검증

- [ ] `npm test` · `npm run typecheck` · `npm run lint` 통과
- [ ] 질문 작성 → 배정 → 답변 → 공개까지 전 과정 동작
- [ ] 배정받지 않은 자문위원의 답변이 **거부**됨
- [ ] 쿼터를 채운 자문위원이 새 질문에 배정되지 않음
- [ ] 응답률·응답 시간이 실제 이력에서 계산됨
- [ ] 질문 상세 페이지에 제목이 `<title>`로 들어감 (검색 자산)
- [ ] **AdSense 승인 이후인지 확인** — 사용자 생성 콘텐츠가 여기서 처음 생긴다
---

# Phase 3 — 1:1 텍스트 스레드와 안전 장치

**완료 시 출시 가능한 상태:** 학생이 특정 자문위원에게 1:1 자문을 요청하고, 미성년자는 보호자 동의를 거친 뒤 사이트 안에서 텍스트로 대화한다.

**이 Phase의 설계 근거를 다시 확인하라.** 1:1을 화상이 아니라 텍스트 스레드로 만든 이유는 다음 네 가지가 **추가 비용 없이** 동시에 충족되기 때문이다.

| 기능 지도 항목 | 여기서 충족되는 방식 |
|---|---|
| 세션 전량 녹화 | 대화 전문이 `thread_messages`에 그대로 남는다 |
| 보호자 참관 | 보호자에게 스레드 열람 링크를 준다 |
| 보호자 전용 대화창 | 보호자 열람은 읽기 전용이라 경로가 분리된다 |
| 카메라 상시 온 규칙 | 대상 자체가 없다 |

**이 Phase를 건너뛰고 화상·음성으로 바꾸면 위 네 가지를 전부 직접 지어야 한다.**

### Task 15: 연락처·외부 채널 패턴 탐지

**Files:**
- Create: `lib/advisors/safety.ts`
- Test: `lib/__tests__/advisorSafety.test.ts`

기능 지도의 "플랫폼 내 소통 강제"를 코드로 옮긴다. Outschool·Polygence가 쓰는 장치이며, 대화를 외부로 옮기는 것이 미성년자 대상 사고의 첫 단계이기 때문이다.

- [ ] **Step 1: 테스트를 먼저 쓴다**

`lib/__tests__/advisorSafety.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { detectContactInfo, hasContactInfo } from "@/lib/advisors/safety";

describe("detectContactInfo", () => {
  it("휴대폰 번호를 찾는다", () => {
    expect(detectContactInfo("010-1234-5678로 연락 주세요").map((h) => h.kind))
      .toContain("전화번호");
  });

  it("구분자 없는 번호도 찾는다", () => {
    expect(hasContactInfo("01012345678")).toBe(true);
  });

  it("점으로 구분된 번호도 찾는다", () => {
    expect(hasContactInfo("010.1234.5678")).toBe(true);
  });

  it("이메일 주소를 찾는다", () => {
    expect(detectContactInfo("kim@gmail.com으로 보내주세요").map((h) => h.kind))
      .toContain("이메일");
  });

  it("카카오톡 아이디 안내를 찾는다", () => {
    expect(hasContactInfo("카톡 아이디 research123")).toBe(true);
    expect(hasContactInfo("카카오톡으로 얘기해요")).toBe(true);
  });

  it("인스타·텔레그램·디스코드를 찾는다", () => {
    expect(hasContactInfo("인스타 디엠 주세요")).toBe(true);
    expect(hasContactInfo("텔레그램으로 옮길까요")).toBe(true);
    expect(hasContactInfo("디스코드 서버 링크 드릴게요")).toBe(true);
  });

  it("외부 화상 링크를 찾는다", () => {
    expect(hasContactInfo("https://zoom.us/j/123456")).toBe(true);
    expect(hasContactInfo("meet.google.com/abc-defg-hij")).toBe(true);
  });

  it("평범한 연구 이야기는 걸리지 않는다", () => {
    expect(hasContactInfo("대조군을 20명으로 잡으면 검정력이 부족합니다.")).toBe(false);
    expect(hasContactInfo("p값이 0.011이라 유의수준 0.05에서 유의합니다.")).toBe(false);
  });

  it("연도·숫자가 많은 문장을 오탐하지 않는다", () => {
    expect(hasContactInfo("2024년 논문 3편, 표본 150명, 응답률 87.5%")).toBe(false);
  });

  it("학술 논문 DOI 링크는 막지 않는다 — 정상적인 자문 내용이다", () => {
    expect(hasContactInfo("https://doi.org/10.1038/s41586-024-07123-4")).toBe(false);
  });

  it("찾은 위치를 함께 돌려준다", () => {
    const hits = detectContactInfo("연락처는 010-1234-5678입니다");
    expect(hits[0].match).toBe("010-1234-5678");
  });

  it("여러 개를 모두 찾는다", () => {
    expect(detectContactInfo("kim@gmail.com 아니면 010-1234-5678").length).toBe(2);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/__tests__/advisorSafety.test.ts`
Expected: FAIL — `Cannot find module '@/lib/advisors/safety'`

- [ ] **Step 3: 구현**

`lib/advisors/safety.ts`:

```ts
/**
 * 개인 연락처·외부 채널 유도 탐지.
 *
 * 목적은 차단이 아니라 경고와 기록이다. 완벽한 탐지는 불가능하고, 정상적인 자문을
 * 막으면(예: 논문 DOI 링크) 기능 자체가 못 쓰게 된다. 그래서 오탐을 줄이는 쪽으로
 * 규칙을 짰고, 걸린 메시지는 보내되 양쪽에 경고를 띄우고 운영자에게 표시한다.
 */

export type ContactKind =
  | "전화번호"
  | "이메일"
  | "메신저"
  | "외부 화상";

export type ContactHit = { kind: ContactKind; match: string };

/** 학술 자문에서 정상적으로 오가는 링크는 탐지 대상에서 뺀다. */
const ALLOWED_HOSTS = ["doi.org", "arxiv.org", "scholar.google.com", "pubmed.ncbi.nlm.nih.gov"];

const RULES: { kind: ContactKind; re: RegExp }[] = [
  // 010으로 시작하는 11자리. 구분자는 없거나 - 또는 .
  { kind: "전화번호", re: /01[016789][-.]?\d{3,4}[-.]?\d{4}/g },
  { kind: "이메일", re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { kind: "메신저", re: /(카톡|카카오톡|인스타|instagram|텔레그램|telegram|디스코드|discord|라인아이디)/gi },
  { kind: "외부 화상", re: /(zoom\.us|meet\.google\.com|teams\.microsoft\.com|webex\.com)/gi },
];

export function detectContactInfo(text: string): ContactHit[] {
  const hits: ContactHit[] = [];
  for (const rule of RULES) {
    // lastIndex가 남지 않도록 매번 새 정규식을 쓴다
    const re = new RegExp(rule.re.source, rule.re.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const match = m[0];
      if (ALLOWED_HOSTS.some((host) => match.includes(host))) continue;
      hits.push({ kind: rule.kind, match });
    }
  }
  return hits;
}

export function hasContactInfo(text: string): boolean {
  return detectContactInfo(text).length > 0;
}

export const CONTACT_WARNING =
  "개인 연락처나 외부 메신저로 대화를 옮기지 마세요. 이 사이트 안에서 주고받은 내용만 기록으로 남아 보호받을 수 있습니다.";
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/__tests__/advisorSafety.test.ts`
Expected: PASS — 12 tests

- [ ] **Step 5: 커밋**

```bash
git add lib/advisors/safety.ts lib/__tests__/advisorSafety.test.ts && git commit -m "feat: 개인 연락처·외부 채널 유도 탐지"
```

### Task 16: 보호자 동의 토큰

**Files:**
- Create: `lib/advisors/consent.ts`
- Test: `lib/__tests__/advisorConsent.test.ts`

- [ ] **Step 1: 테스트를 먼저 쓴다**

`lib/__tests__/advisorConsent.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  createConsentToken,
  isConsentExpired,
  CONSENT_TTL_HOURS,
  requiresGuardianConsent,
} from "@/lib/advisors/consent";

describe("createConsentToken", () => {
  it("URL에 안전한 문자만 쓴다", () => {
    expect(createConsentToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("추측하기 어려울 만큼 길다", () => {
    expect(createConsentToken().length).toBeGreaterThanOrEqual(32);
  });

  it("호출할 때마다 다르다", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => createConsentToken()));
    expect(tokens.size).toBe(100);
  });
});

describe("isConsentExpired", () => {
  const issued = "2026-09-10T00:00:00Z";

  it("유효 기간 안에서는 만료가 아니다", () => {
    expect(isConsentExpired(issued, new Date("2026-09-10T12:00:00Z"))).toBe(false);
  });

  it("유효 기간을 넘기면 만료다", () => {
    const after = new Date(
      Date.parse(issued) + (CONSENT_TTL_HOURS + 1) * 3600 * 1000,
    );
    expect(isConsentExpired(issued, after)).toBe(true);
  });

  it("경계 직전은 만료가 아니다", () => {
    const edge = new Date(Date.parse(issued) + (CONSENT_TTL_HOURS - 0.1) * 3600 * 1000);
    expect(isConsentExpired(issued, edge)).toBe(false);
  });
});

describe("requiresGuardianConsent", () => {
  it("중학생은 보호자 동의가 필요하다", () => {
    expect(requiresGuardianConsent("중학생")).toBe(true);
  });

  it("고등학생도 필요하다 — 대부분 미성년자다", () => {
    expect(requiresGuardianConsent("고등학생")).toBe(true);
  });

  it("'기타'도 필요하다 — 미성년자가 아님을 확인할 수 없으면 보수적으로 간다", () => {
    expect(requiresGuardianConsent("기타")).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/__tests__/advisorConsent.test.ts`
Expected: FAIL — `Cannot find module '@/lib/advisors/consent'`

- [ ] **Step 3: 구현**

`lib/advisors/consent.ts`:

```ts
import { randomBytes } from "node:crypto";

/**
 * 보호자 동의 링크의 유효 기간.
 *
 * 짧으면 보호자가 메일을 늦게 보고 놓치고, 길면 유출된 링크가 오래 살아 있다.
 * 72시간은 주말을 한 번 넘길 수 있는 최소치다.
 */
export const CONSENT_TTL_HOURS = 72;

/**
 * 동의 링크 토큰.
 *
 * Math.random()을 쓰면 안 된다 — 예측 가능해서 남의 보호자 동의를 대신 눌러줄 수 있다.
 * 32바이트를 base64url로 인코딩하므로 43자가 나온다.
 */
export function createConsentToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isConsentExpired(issuedAt: string, now: Date): boolean {
  const elapsedHours = (now.getTime() - Date.parse(issuedAt)) / 3_600_000;
  return elapsedHours > CONSENT_TTL_HOURS;
}

/**
 * 보호자 동의 필요 여부.
 *
 * 지금은 모든 학교급에 대해 true다. 이 사이트의 이용자는 중·고등학생이고,
 * 나이를 검증할 수단이 없는 상태에서 "성인일 것"이라고 가정하면 안 되기 때문이다.
 * 함수로 분리해 둔 이유는 나중에 성인 이용자 경로가 생겼을 때 여기만 고치기 위해서다.
 */
export function requiresGuardianConsent(
  _schoolLevel: "중학생" | "고등학생" | "기타",
): boolean {
  return true;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/__tests__/advisorConsent.test.ts`
Expected: PASS — 9 tests

- [ ] **Step 5: 커밋**

```bash
git add lib/advisors/consent.ts lib/__tests__/advisorConsent.test.ts && git commit -m "feat: 보호자 동의 토큰과 유효 기간"
```

### Task 17: 스레드·동의·신고 스키마

**Files:**
- Create: `supabase/migrations/0003_threads.sql`

- [ ] **Step 1: 마이그레이션 작성**

`supabase/migrations/0003_threads.sql`:

```sql
create table threads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  advisor_id uuid not null references advisors(id) on delete cascade,
  topic text not null,
  school_level text not null check (school_level in ('중학생', '고등학생', '기타')),

  state text not null default '동의 대기'
    check (state in ('동의 대기', '진행 중', '종료', '중단')),

  -- 보호자 동의
  guardian_email text not null,
  consent_token text not null unique,
  consent_issued_at timestamptz not null default now(),
  consent_granted_at timestamptz,

  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table thread_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  -- 연락처 패턴이 걸린 메시지. 운영자 화면에서 먼저 보여준다.
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references threads(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create index threads_student_idx on threads (student_id, state);
create index threads_advisor_idx on threads (advisor_id, state);
create index thread_messages_idx on thread_messages (thread_id, created_at);
create index reports_open_idx on reports (handled_at, created_at desc);

alter table threads enable row level security;
alter table thread_messages enable row level security;
alter table reports enable row level security;

-- 스레드 당사자만 조회. 보호자는 토큰 경로로 접근하므로 여기 정책이 아니라
-- service_role을 쓰는 별도 페이지로 처리한다(보호자에게는 계정이 없다).
create policy "당사자만 스레드 조회"
  on threads for select using (
    auth.uid() = student_id
    or exists (
      select 1 from advisors a
      where a.id = threads.advisor_id and a.user_id = auth.uid()
    )
  );

create policy "학생이 스레드 개설"
  on threads for insert with check (auth.uid() = student_id);

create policy "당사자만 메시지 조회"
  on thread_messages for select using (
    exists (
      select 1 from threads t
      where t.id = thread_messages.thread_id
        and (
          t.student_id = auth.uid()
          or exists (
            select 1 from advisors a
            where a.id = t.advisor_id and a.user_id = auth.uid()
          )
        )
    )
  );

-- '진행 중'인 스레드에만 쓸 수 있다. 보호자 동의 전에는 대화가 시작되지 않는다.
create policy "진행 중 스레드에만 메시지 작성"
  on thread_messages for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from threads t
      where t.id = thread_messages.thread_id
        and t.state = '진행 중'
        and (
          t.student_id = auth.uid()
          or exists (
            select 1 from advisors a
            where a.id = t.advisor_id and a.user_id = auth.uid()
          )
        )
    )
  );

create policy "로그인 사용자는 신고 작성"
  on reports for insert with check (auth.uid() = reporter_id);
```

- [ ] **Step 2: SQL Editor에서 실행**

- [ ] **Step 3: 동의 전 메시지 작성이 막히는지 확인**

`threads`에 `state = '동의 대기'` 행을 하나 만들고, 학생 계정으로 `thread_messages` insert를 시도한다.
Expected: RLS 위반으로 **실패**해야 한다. 성공하면 정책이 잘못된 것이다.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/0003_threads.sql && git commit -m "feat: 1:1 스레드·보호자 동의·신고 테이블과 RLS"
```

### Task 18: 1:1 요청과 보호자 동의 흐름

**Files:**
- Create: `app/guardian/[token]/page.tsx`
- Modify: `lib/advisors/actions.ts`

- [ ] **Step 1: 요청 액션**

`lib/advisors/actions.ts`에 추가:

```ts
import { createConsentToken, isConsentExpired } from "./consent";
import { SITE_URL } from "@/lib/site";

export async function requestThread(form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, errors: ["로그인이 필요합니다."] };

  const advisorId = String(form.get("advisorId") ?? "");
  const topic = String(form.get("topic") ?? "").trim();
  const schoolLevel = String(form.get("schoolLevel") ?? "");
  const guardianEmail = String(form.get("guardianEmail") ?? "").trim();

  const errors: string[] = [];
  if (!topic) errors.push("어떤 내용을 자문받고 싶은지 적어주세요.");
  if (!["중학생", "고등학생", "기타"].includes(schoolLevel)) {
    errors.push("학교급을 선택해주세요.");
  }
  if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(guardianEmail)) {
    errors.push("보호자 이메일 주소를 정확히 입력해주세요.");
  }
  if (errors.length > 0) return { ok: false, errors };

  // 자문위원이 1:1을 받는지 확인한다. 폼을 우회한 직접 호출을 막는다.
  const { data: advisor } = await supabase
    .from("advisors_public")
    .select("id, accepts_private, display_name")
    .eq("id", advisorId)
    .maybeSingle();
  if (!advisor || !advisor.accepts_private) {
    return { ok: false, errors: ["이 자문위원은 1:1 자문을 받지 않습니다."] };
  }

  const token = createConsentToken();
  const { error } = await supabase.from("threads").insert({
    student_id: user.id,
    advisor_id: advisorId,
    topic,
    school_level: schoolLevel,
    guardian_email: guardianEmail,
    consent_token: token,
  });
  if (error) return { ok: false, errors: ["요청에 실패했습니다."] };

  await sendGuardianConsentEmail(guardianEmail, token, String(advisor.display_name), topic);
  return { ok: true };
}
```

- [ ] **Step 2: 보호자 동의 메일 발송**

`lib/advisors/actions.ts`에 추가한다. **Supabase 내장 메일은 인증용이라 임의 발송에 쓸 수 없다.** Resend 등 발송 서비스를 붙이거나, 초기에는 운영자에게 알림을 보내 수동 발송한다.

메일에 반드시 들어갈 내용:
- 자녀가 누구에게 어떤 주제로 자문을 요청했는지
- 대화는 **사이트 안에서 텍스트로만** 이루어지며 전문이 기록된다는 사실
- 보호자가 **언제든 전체 대화를 열람할 수 있다**는 사실과 그 링크
- 동의 링크의 유효 기간(72시간)
- 동의 철회 방법

```ts
async function sendGuardianConsentEmail(
  to: string,
  token: string,
  advisorName: string,
  topic: string,
): Promise<void> {
  const link = `${SITE_URL}/guardian/${token}`;
  // 발송 구현체는 환경에 따라 다르다. 초기에는 운영자 알림으로 대체하고,
  // 발송량이 늘면 Resend 등으로 교체한다. 링크·문구는 그대로 유지한다.
  await notifyOperator({
    subject: "[연구할Lab] 보호자 동의 요청",
    body: [
      `보호자 메일: ${to}`,
      `자문위원: ${advisorName}`,
      `주제: ${topic}`,
      `동의 링크: ${link}`,
    ].join("\n"),
  });
}
```

운영자 알림 함수도 같은 파일에 둔다. 발송 수단이 바뀌어도 호출부는 그대로 두기 위해 한 곳으로 모은다.

```ts
/**
 * 운영자 알림.
 *
 * 발송 인프라가 아직 없으므로 지금은 DB에 남기고 운영자 화면에서 읽게 한다.
 * 메일 발송으로 바꾸더라도 호출부는 고치지 않도록 여기 한 곳에서만 처리한다.
 * 알림 실패가 본래 동작(메시지 저장·신고 접수)을 되돌리면 안 되므로 예외를 삼킨다.
 */
async function notifyOperator(input: { subject: string; body: string }): Promise<void> {
  try {
    const admin = createServiceClient();
    await admin.from("operator_notices").insert({
      subject: input.subject,
      body: input.body,
    });
  } catch {
    // 알림 실패는 조용히 넘긴다 — 이것 때문에 신고 접수가 실패하면 더 나쁘다
  }
}
```

이 테이블은 `supabase/migrations/0003_threads.sql`에 함께 넣고 SQL Editor에서 실행한다.

```sql
create table operator_notices (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table operator_notices enable row level security;
-- 정책을 하나도 만들지 않는다. RLS가 켜져 있고 정책이 없으면 service_role만 접근한다.
```

- [ ] **Step 3: 보호자 페이지**

`app/guardian/[token]/page.tsx` — **로그인 없이** 토큰으로 접근한다(보호자에게는 계정이 없다).

- `service_role`로 토큰에 해당하는 스레드를 찾는다
- `isConsentExpired`로 만료를 확인하고, 만료면 재요청 안내를 보여준다
- 동의 전: 자문위원 정보·주제·안전 정책을 보여주고 **동의** 버튼
- 동의 후: 대화 전문을 **읽기 전용**으로 보여주고 **중단** 버튼
- `robots: { index: false, follow: false }` 필수 — 토큰 URL이 색인되면 안 된다

동의 액션:

```ts
export async function grantGuardianConsent(token: string): Promise<ActionResult> {
  const admin = createServiceClient();
  const { data: thread } = await admin
    .from("threads")
    .select("id, consent_issued_at, state")
    .eq("consent_token", token)
    .maybeSingle();

  if (!thread) return { ok: false, errors: ["잘못된 링크입니다."] };
  if (thread.state !== "동의 대기") {
    return { ok: false, errors: ["이미 처리된 요청입니다."] };
  }
  if (isConsentExpired(String(thread.consent_issued_at), new Date())) {
    return { ok: false, errors: ["동의 링크가 만료되었습니다. 자녀에게 다시 요청하도록 안내해주세요."] };
  }

  const { error } = await admin
    .from("threads")
    .update({ consent_granted_at: new Date().toISOString(), state: "진행 중" })
    .eq("id", thread.id);
  if (error) return { ok: false, errors: ["처리에 실패했습니다."] };
  return { ok: true };
}
```

- [ ] **Step 4: 수동 확인**

1. 1:1 요청 → `threads` 행이 `동의 대기`로 생성
2. 동의 전 학생이 메시지 작성 시도 → **실패**
3. 보호자 링크 접속 → 동의 → `state`가 `진행 중`으로
4. 이제 메시지 작성 성공
5. **`consent_issued_at`을 4일 전으로 바꾸고 다시 접속 → 만료 안내**
6. 잘못된 토큰으로 접속 → "잘못된 링크입니다"
7. `accepts_private = false`인 자문위원에게 요청 → 거부

- [ ] **Step 5: 커밋**

```bash
git add app/guardian lib/advisors/actions.ts && git commit -m "feat: 1:1 요청과 보호자 동의 흐름"
```

### Task 19: 스레드 화면과 메시지

**Files:**
- Create: `app/threads/[id]/page.tsx`
- Create: `components/advisors/ThreadView.tsx`
- Create: `components/advisors/SafetyNotice.tsx`
- Modify: `lib/advisors/actions.ts`

- [ ] **Step 1: 메시지 작성 액션**

```ts
import { detectContactInfo } from "./safety";

const MAX_MESSAGE = 4000;

export async function postThreadMessage(form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, errors: ["로그인이 필요합니다."] };

  const threadId = String(form.get("threadId") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { ok: false, errors: ["내용을 입력해주세요."] };
  if (body.length > MAX_MESSAGE) {
    return { ok: false, errors: [`메시지는 ${MAX_MESSAGE}자 이내로 써주세요.`] };
  }

  // 차단하지 않고 표시만 한다 — 오탐으로 정상 자문을 막는 쪽이 더 나쁘다.
  const flagged = detectContactInfo(body).length > 0;

  // 당사자 여부와 '진행 중' 상태는 RLS 정책이 확인한다.
  const { error } = await supabase
    .from("thread_messages")
    .insert({ thread_id: threadId, sender_id: user.id, body, flagged });
  if (error) {
    return { ok: false, errors: ["메시지를 보낼 수 없습니다. 대화가 종료되었거나 권한이 없습니다."] };
  }

  if (flagged) {
    await notifyOperator({
      subject: "[연구할Lab] 연락처 패턴 감지",
      body: `스레드: ${threadId}\n작성자: ${user.id}`,
    });
  }

  revalidatePath(`/threads/${threadId}`);
  return { ok: true };
}
```

- [ ] **Step 2: 안전 고지 컴포넌트**

`components/advisors/SafetyNotice.tsx` — 스레드 상단에 항상 보인다.
`CONTACT_WARNING` 문구와 함께 다음을 명시한다.

- 이 대화는 전부 기록되며 **보호자와 운영자가 열람할 수 있습니다.**
- 개인 연락처를 주고받거나 외부 메신저로 옮기지 마세요.
- 자문위원은 금품·상품권을 제공할 수 없습니다.
- 불편한 일이 있으면 아래 신고 버튼을 눌러주세요.

**이 고지는 접거나 숨기지 않는다.** 열람 사실을 고지하지 않으면 열람 자체가 문제가 된다.

- [ ] **Step 3: 스레드 화면**

`app/threads/[id]/page.tsx` — 당사자만 접근(RLS가 보장하지만, 없으면 `notFound()`).
메시지를 시간순으로 그리고, `flagged` 메시지에는 경고 표시를 붙인다.
`state`가 `진행 중`이 아니면 입력창 대신 상태 안내를 보여준다.
`robots: { index: false, follow: false }` 필수.

- [ ] **Step 4: 수동 확인**

1. 학생·자문위원 양쪽에서 메시지 작성
2. 제3자 계정으로 스레드 URL 직접 접근 → 404
3. `010-1234-5678`을 보내면 `flagged = true`, 화면에 경고 표시
4. `https://doi.org/...`를 보내면 `flagged = false`
5. `state`를 `종료`로 바꾸면 입력창이 사라지고 메시지 작성이 거부됨

- [ ] **Step 5: 커밋**

```bash
git add app/threads components/advisors lib/advisors/actions.ts && git commit -m "feat: 1:1 스레드 화면·메시지·안전 고지"
```

### Task 20: 신고와 운영자 열람

**Files:**
- Create: `components/advisors/ReportButton.tsx`
- Create: `app/admin/reports/page.tsx`
- Modify: `lib/advisors/actions.ts`

- [ ] **Step 1: 신고 액션**

```ts
export async function reportContent(form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, errors: ["로그인이 필요합니다."] };

  const reason = String(form.get("reason") ?? "").trim();
  if (!reason) return { ok: false, errors: ["신고 사유를 적어주세요."] };

  const threadId = form.get("threadId") ? String(form.get("threadId")) : null;
  const questionId = form.get("questionId") ? String(form.get("questionId")) : null;

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    thread_id: threadId,
    question_id: questionId,
    reason,
  });
  if (error) return { ok: false, errors: ["신고 접수에 실패했습니다."] };

  await notifyOperator({
    subject: "[연구할Lab] 신고 접수",
    body: `스레드: ${threadId ?? "-"}\n질문: ${questionId ?? "-"}\n사유: ${reason}`,
  });
  return { ok: true };
}
```

- [ ] **Step 2: 신고 버튼**

`components/advisors/ReportButton.tsx` — 모든 스레드와 질문·답변에 노출한다.
찾기 어려우면 없는 것과 같으므로 **접거나 메뉴 안에 숨기지 않는다.**

- [ ] **Step 3: 운영자 화면**

`app/admin/reports/page.tsx` — `requireAdmin()` 확인 후 미처리 신고를 최신순으로.
각 신고에서 해당 스레드 전문으로 이동할 수 있어야 한다(`service_role`로 읽는다).
스레드를 `중단` 상태로 바꾸는 버튼을 둔다.

`robots: { index: false, follow: false }` 필수.

- [ ] **Step 4: 수동 확인**

1. 신고 제출 → `reports` 행 생성, 운영자 알림 도착
2. 운영자 화면에서 스레드 전문 열람 가능
3. `중단` 처리 시 양쪽 모두 메시지 작성 불가
4. 비운영자 접근 → 404

- [ ] **Step 5: 커밋**

```bash
git add components/advisors/ReportButton.tsx app/admin/reports lib/advisors/actions.ts && git commit -m "feat: 신고 접수와 운영자 처리 화면"
```

### Task 21: 자문 가이드라인 문서

**Files:**
- Create: `content/articles/advisor-guidelines.mdx`
- Modify: `lib/articles.ts`

- [ ] **Step 1: 가이드라인 작성**

기존 자료실 시스템을 그대로 쓴다. 등록 폼의 `agreeGuidelines` 체크박스가 이 문서를 가리킨다.

담을 내용:
- 우리가 하는 것 / 하지 않는 것 (과제 대필·첨삭·추천서는 **하지 않는다**)
- 답변할 때의 원칙 — 답을 주지 말고 다음 단계를 짚어준다
- 학생부·수행평가 관련 요청을 받았을 때의 대응 (2026.7.29 시행 법 언급)
- 개인 연락처 교환 금지와 그 이유
- 금품 제공 금지
- 무급 활동임의 확인
- 불편한 상황을 만났을 때의 신고 경로

- [ ] **Step 2: 카테고리 확인**

`lib/articles.ts`의 `ARTICLE_CATEGORIES`에 이 문서가 들어갈 카테고리가 있는지 본다. 없으면 `advisor` 카테고리를 추가하거나 기존 카테고리 중 맞는 곳에 넣는다. **자문위원용 문서가 학생용 자료실 목록에 섞여 혼란을 주지 않도록** 목록 노출 여부를 확인한다.

- [ ] **Step 3: 커밋**

```bash
git add content/articles/advisor-guidelines.mdx lib/articles.ts && git commit -m "docs: 자문위원 활동 가이드라인"
```

## Phase 3 완료 검증

- [ ] `npm test` · `npm run typecheck` · `npm run lint` 통과
- [ ] 보호자 동의 **전에는** 어떤 메시지도 저장되지 않음
- [ ] 만료된 동의 링크가 거부됨
- [ ] 제3자가 스레드 URL로 접근 시 404
- [ ] 연락처 패턴이 `flagged`로 기록되고 운영자에게 알림이 감
- [ ] 학술 DOI 링크는 `flagged`되지 않음
- [ ] 보호자가 로그인 없이 전체 대화를 읽을 수 있음
- [ ] 신고 → 운영자 열람 → 스레드 중단까지 동작
- [ ] `/threads/*`·`/guardian/*`·`/admin/*`이 모두 `noindex`
- [ ] 안전 고지가 스레드 상단에 항상 보임

---

# Phase 4 — 공급자 리텐션

**완료 시 출시 가능한 상태:** 자문위원이 자기 활동을 눈으로 확인하고, 신규 자문위원이 첫 질문을 받는다.

기능 지도의 G축이 근거다.

> "무보수 멘토를 3.8만 명 모은 ADPList가 실제로 쓰는 것들. 돈이 아니라 인정이 동력이다."

**랭킹은 만들지 않는다.** 같은 지도에 "랭킹 경쟁 기능은 멘토 반발 사례도 있다"고 기록돼 있고, 30명 규모에서 순위표는 하위권을 그냥 이탈시킨다.

### Task 22: 활동 배지

**Files:**
- Create: `lib/advisors/achievements.ts`
- Test: `lib/__tests__/advisorAchievements.test.ts`

- [ ] **Step 1: 테스트를 먼저 쓴다**

`lib/__tests__/advisorAchievements.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { earnedAchievements, ACHIEVEMENTS } from "@/lib/advisors/achievements";

describe("earnedAchievements", () => {
  it("답변이 없으면 아무 배지도 없다", () => {
    expect(earnedAchievements({ answerCount: 0, medianResponseHours: null })).toEqual([]);
  });

  it("첫 답변에 '첫 답변' 배지", () => {
    const earned = earnedAchievements({ answerCount: 1, medianResponseHours: 10 });
    expect(earned.map((a) => a.id)).toContain("first-answer");
  });

  it("답변이 쌓이면 누적 배지가 붙는다", () => {
    const earned = earnedAchievements({ answerCount: 10, medianResponseHours: 10 });
    expect(earned.map((a) => a.id)).toContain("ten-answers");
  });

  it("24시간 안에 답하면 '빠른 답변' 배지", () => {
    const earned = earnedAchievements({ answerCount: 5, medianResponseHours: 6 });
    expect(earned.map((a) => a.id)).toContain("fast-responder");
  });

  it("답변이 3건 미만이면 '빠른 답변'을 주지 않는다 — 한 건으로 판단할 수 없다", () => {
    const earned = earnedAchievements({ answerCount: 1, medianResponseHours: 1 });
    expect(earned.map((a) => a.id)).not.toContain("fast-responder");
  });

  it("모든 배지에 설명이 있다", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/__tests__/advisorAchievements.test.ts`
Expected: FAIL — `Cannot find module '@/lib/advisors/achievements'`

- [ ] **Step 3: 구현**

`lib/advisors/achievements.ts`:

```ts
/**
 * 활동 배지.
 *
 * 무급 자문위원에게 줄 수 있는 것은 보수가 아니라 인정이다. 다만 랭킹은 만들지 않는다 —
 * 30명 규모에서 순위표는 하위권을 그대로 이탈시키고, 경쟁 기능에 대한 멘토 반발 사례도
 * 조사에 기록돼 있다. 배지는 남과 비교하지 않고 자기 활동만 보여준다.
 */

export type Achievement = {
  id: string;
  label: string;
  description: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-answer", label: "첫 답변", description: "첫 질문에 답했습니다." },
  { id: "ten-answers", label: "답변 10건", description: "질문 10건에 답했습니다." },
  { id: "fifty-answers", label: "답변 50건", description: "질문 50건에 답했습니다." },
  {
    id: "fast-responder",
    label: "빠른 답변",
    description: "보통 하루 안에 답변합니다.",
  },
];

function byId(id: string): Achievement {
  const found = ACHIEVEMENTS.find((a) => a.id === id);
  if (!found) throw new Error(`알 수 없는 배지: ${id}`);
  return found;
}

export function earnedAchievements(stats: {
  answerCount: number;
  medianResponseHours: number | null;
}): Achievement[] {
  const earned: Achievement[] = [];
  if (stats.answerCount >= 1) earned.push(byId("first-answer"));
  if (stats.answerCount >= 10) earned.push(byId("ten-answers"));
  if (stats.answerCount >= 50) earned.push(byId("fifty-answers"));
  // 표본이 적으면 '빠르다'고 말할 근거가 없다
  if (
    stats.answerCount >= 3 &&
    stats.medianResponseHours !== null &&
    stats.medianResponseHours < 24
  ) {
    earned.push(byId("fast-responder"));
  }
  return earned;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/__tests__/advisorAchievements.test.ts`
Expected: PASS — 6 tests

- [ ] **Step 5: 프로필과 본인 화면에 표시**

`app/advisors/[id]/page.tsx`와 `app/advisors/me/page.tsx`에서 `earnedAchievements`를 호출해 배지를 그린다.

- [ ] **Step 6: 커밋**

```bash
git add lib/advisors/achievements.ts lib/__tests__/advisorAchievements.test.ts app/advisors && git commit -m "feat: 자문위원 활동 배지"
```

### Task 23: 이번 주 자문위원 큐레이션

**Files:**
- Create: `lib/advisors/spotlight.ts`
- Test: `lib/__tests__/advisorSpotlight.test.ts`
- Modify: `app/advisors/page.tsx`
- Modify: `app/page.tsx`

물어볼Lab의 "이번 주 커피챗 가능한 연구자"를 가져온다. **신규 자문위원에게 첫 질문을 몰아주는 장치다.**

- [ ] **Step 1: 테스트를 먼저 쓴다**

`lib/__tests__/advisorSpotlight.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pickSpotlight, weekKey } from "@/lib/advisors/spotlight";
import type { Advisor } from "@/lib/advisors/types";

function advisor(over: Partial<Advisor> = {}): Advisor {
  return {
    id: "a1", displayName: "김연구", institution: "한국대학교", department: "화학과",
    position: "박사과정", labName: "", fields: ["유기화학"], bio: "",
    answerableTopics: [], monthlyQuota: 3, acceptsPrivate: true,
    status: "받는 중", badge: "이메일 인증", reviewState: "공개",
    answerCount: 0, assignedCount: 0, medianResponseHours: null,
    joinedAt: "2026-01-01T00:00:00Z", ...over,
  };
}

describe("pickSpotlight", () => {
  it("'쉬는 중'은 뽑지 않는다", () => {
    expect(pickSpotlight([advisor({ status: "쉬는 중" })], "2026-W37")).toEqual([]);
  });

  it("답변이 적은 사람을 먼저 뽑는다 — 첫 질문을 몰아주는 것이 목적이다", () => {
    const busy = advisor({ id: "busy", answerCount: 100 });
    const fresh = advisor({ id: "fresh", answerCount: 0 });
    expect(pickSpotlight([busy, fresh], "2026-W37", 1).map((a) => a.id)).toEqual(["fresh"]);
  });

  it("요청한 수만큼만 뽑는다", () => {
    const many = Array.from({ length: 10 }, (_, i) => advisor({ id: `a${i}` }));
    expect(pickSpotlight(many, "2026-W37", 3).length).toBe(3);
  });

  it("같은 주에는 같은 결과를 낸다", () => {
    const many = Array.from({ length: 10 }, (_, i) => advisor({ id: `a${i}`, answerCount: 5 }));
    const first = pickSpotlight(many, "2026-W37", 3).map((a) => a.id);
    const second = pickSpotlight(many, "2026-W37", 3).map((a) => a.id);
    expect(first).toEqual(second);
  });

  it("주가 바뀌면 결과가 달라진다 — 매주 다른 사람이 노출돼야 한다", () => {
    const many = Array.from({ length: 12 }, (_, i) => advisor({ id: `a${i}`, answerCount: 5 }));
    const w37 = pickSpotlight(many, "2026-W37", 3).map((a) => a.id);
    const w38 = pickSpotlight(many, "2026-W38", 3).map((a) => a.id);
    expect(w37).not.toEqual(w38);
  });

  it("자문위원이 없으면 빈 배열", () => {
    expect(pickSpotlight([], "2026-W37")).toEqual([]);
  });
});

describe("weekKey", () => {
  it("ISO 주차를 낸다", () => {
    expect(weekKey(new Date("2026-09-10T00:00:00Z"))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("같은 주의 다른 날은 같은 키다", () => {
    // 2026-09-07(월) ~ 2026-09-13(일) 은 같은 주
    const mon = weekKey(new Date("2026-09-07T03:00:00Z"));
    const sun = weekKey(new Date("2026-09-13T03:00:00Z"));
    expect(mon).toBe(sun);
  });

  it("주가 넘어가면 키가 바뀐다", () => {
    const thisWeek = weekKey(new Date("2026-09-13T03:00:00Z"));
    const nextWeek = weekKey(new Date("2026-09-14T03:00:00Z"));
    expect(thisWeek).not.toBe(nextWeek);
  });

  it("한국 시각 기준이다 — 일요일 밤 UTC는 한국에서 이미 월요일이다", () => {
    // 2026-09-13T20:00Z = 2026-09-14 05:00 KST (월요일)
    expect(weekKey(new Date("2026-09-13T20:00:00Z")))
      .toBe(weekKey(new Date("2026-09-14T03:00:00Z")));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/__tests__/advisorSpotlight.test.ts`
Expected: FAIL — `Cannot find module '@/lib/advisors/spotlight'`

- [ ] **Step 3: 구현**

`lib/advisors/spotlight.ts`:

```ts
import type { Advisor } from "./types";

/** 문자열에서 안정적인 32비트 해시를 만든다. 같은 주에는 같은 값이 나온다. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 이번 주에 앞세울 자문위원을 뽑는다.
 *
 * 답변이 적은 순이 1순위인 이유 — 이 기능의 목적은 '잘하는 사람 보여주기'가 아니라
 * '아직 첫 질문을 못 받은 사람에게 기회 주기'다. 무급 자문위원은 등록만 하고
 * 아무 일도 일어나지 않으면 조용히 사라진다.
 *
 * 동률일 때 주차 해시로 섞는 이유는, 그렇게 하지 않으면 같은 사람이 매주 고정되기 때문이다.
 */
export function pickSpotlight(
  list: Advisor[],
  weekKey: string,
  count = 3,
): Advisor[] {
  return list
    .filter((a) => a.status === "받는 중")
    .map((a) => ({ a, tie: hash(`${weekKey}:${a.id}`) }))
    .sort((x, y) => {
      if (x.a.answerCount !== y.a.answerCount) {
        return x.a.answerCount - y.a.answerCount;
      }
      return x.tie - y.tie;
    })
    .slice(0, count)
    .map((entry) => entry.a);
}

/** 한국 시각 기준 ISO 주차 키. `pickSpotlight`의 weekKey로 쓴다. */
export function weekKey(at: Date): string {
  const kst = new Date(at.getTime() + 9 * 60 * 60 * 1000);
  const target = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
  // ISO 주차: 목요일이 속한 해가 그 주의 해다
  const day = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/__tests__/advisorSpotlight.test.ts`
Expected: PASS — 10 tests

- [ ] **Step 5: 화면에 붙인다**

`app/advisors/page.tsx` 상단에 "이번 주 답변 가능한 자문위원" 섹션을 넣는다.
`app/page.tsx`(홈)에도 자문위원이 1명 이상일 때만 보이는 작은 섹션을 넣는다.
**자문위원이 0명이면 섹션 자체를 렌더하지 않는다** — 빈 섹션은 사이트가 죽어 보이게 만든다.

- [ ] **Step 6: 커밋**

```bash
git add lib/advisors/spotlight.ts lib/__tests__/advisorSpotlight.test.ts app/advisors/page.tsx app/page.tsx && git commit -m "feat: 이번 주 자문위원 큐레이션"
```

### Task 24: 자문위원 활동 요약 화면

**Files:**
- Modify: `app/advisors/me/page.tsx`

- [ ] **Step 1: 활동 요약 추가**

`/advisors/me`에 본인 활동을 보여준다.
- 누적 답변 수, 이번 달 답변 수, 남은 쿼터 (`quotaRemaining`)
- 응답률, 평균 응답 시간
- 획득한 활동 배지
- 답변 대기 중인 배정 질문 목록 (여기서 바로 답변하러 갈 수 있어야 한다)

**대기 중인 배정이 눈에 보이는 것이 이 화면의 핵심이다.** 자문위원이 배정 사실을 모르면 응답률만 떨어지고 본인은 이유를 모른다.

- [ ] **Step 2: 수동 확인**

1. 배정된 질문이 목록에 보임
2. 답변 후 목록에서 사라지고 누적 답변 수 증가
3. 쿼터를 채우면 "이번 달 배정이 끝났습니다" 안내

- [ ] **Step 3: 커밋**

```bash
git add app/advisors/me && git commit -m "feat: 자문위원 활동 요약과 대기 질문 목록"
```

## Phase 4 완료 검증

- [ ] `npm test` · `npm run typecheck` · `npm run lint` 통과
- [ ] 활동 배지가 실제 통계에서 계산됨
- [ ] 이번 주 큐레이션이 같은 주에 안정적이고 주가 바뀌면 달라짐
- [ ] 답변이 적은 자문위원이 큐레이션에 먼저 노출됨
- [ ] 자문위원 0명일 때 홈의 큐레이션 섹션이 렌더되지 않음
- [ ] `/advisors/me`에서 대기 질문이 보이고 바로 답변 가능

---

## 전체 완료 후

- [ ] `app/sitemap.ts`에 `/advisors`·`/questions`와 공개 상세 URL 반영
- [ ] `app/robots.ts`에서 `/admin`·`/threads`·`/guardian` 차단 확인
- [ ] Google Search Console에 `/advisors`·`/questions` 색인 요청 (일일 할당량 주의)
- [ ] 개인정보처리방침의 표와 실제 저장 항목이 일치하는지 대조
- [ ] Supabase 무료 플랜 자동 일시정지 대책 적용 (주 1회 이상 접속 또는 헬스체크)

## 이 계획에서 의도적으로 만들지 않는 것

| 항목 | 이유 |
|---|---|
| 결제·정산·수수료 | 무료가 설계 목표다 |
| 자체 저널 | pay-to-publish로 지목된 패턴 |
| 추천서 발급 | 학생부 외부활동 기재 금지와 충돌 |
| 활동 확인서 발급 | 학생 임의단체 발급 증명의 신뢰도 문제 |
| 교수 평가·평판 | 명예훼손 리스크, 공급자 이탈 |
| 멘토 랭킹 | 30명 규모에서 하위권을 이탈시킨다 |
| 화상·음성 세션 | 안전 비용이 무료 모델을 무너뜨린다 |
| 신원조회·범죄경력 | 개인이 조회를 신청할 법적 경로가 없다 |

새 기능을 추가하자는 제안이 나오면 **먼저 이 표를 확인하라.** 대부분은 이미 검토하고 버린 것이다.
