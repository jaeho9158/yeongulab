# 연구랩 가이드

청소년 연구 6단계 로드맵을 무료로 안내하는 콘텐츠 사이트. 로그인·DB 없이 정적으로 동작하며, 애드센스 승인을 전제로 설계했다.

## 스택

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS v4 + `@tailwindcss/typography`
- MDX 콘텐츠 (`content/guide/*.mdx`, `gray-matter` + `next-mdx-remote`)

## 개발

```bash
npm run dev
```

## 콘텐츠 추가/수정

`content/guide/`에 있는 `.mdx` 파일의 frontmatter(`order`, `slug`, `title`, `description`, `estimatedWeeks`, `keywords`)와 본문을 수정하면 된다. 새 단계를 추가하려면 같은 형식으로 파일을 하나 더 만들면 `/guide`와 사이트맵에 자동으로 반영된다.

## 애드센스 연동

1. AdSense 계정 승인
2. `.env.local`에 `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_SITE_URL` 설정
3. `app/layout.tsx`에 AdSense 로더 스크립트 추가
4. `components/AdSlot.tsx`의 `<ins>` 태그에 실제 `data-ad-slot` 값 채우기

승인 전에는 광고 자리에 플레이스홀더만 표시된다.

## 다음 단계 (2차 범위)

이 저장소는 로드맵 문서의 1차(공개 가이드 콘텐츠) 범위만 구현한 상태다. 로그인 워크스페이스(연구 프로젝트 진행 + 노트 + 활동기록)는 트래픽 검증 후 Supabase를 붙여 확장한다.
