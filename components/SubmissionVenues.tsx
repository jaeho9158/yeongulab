const VENUES = [
  {
    name: "Journal of Emerging Investigators (JEI)",
    region: "해외 · 오픈액세스 학술지",
    note: "중·고등학생 대상 동료심사 학술지. 생물·물리 전 분야, 지도교사/멘토 필요. 무료 게재.",
    href: "https://emerginginvestigators.org",
  },
  {
    name: "International Journal of High School Research (IJHSR)",
    region: "해외 · 오픈액세스 학술지",
    note: "고등학생 저자 대상. 리뷰어 3인을 저자가 직접 섭외해야 하며, 게재 확정 후에만 비용 발생.",
    href: "https://ijhsr.terrajournals.org",
  },
  {
    name: "Curieux Academic Journal",
    region: "해외 · 오픈액세스 학술지",
    note: "중·고등학생 대상, 전 학문분야 수용. 투고 시 비용 없음, 게재 확정 후 비용 발생.",
    href: "https://www.curieuxacademicjournal.com",
  },
  {
    name: "삼성휴먼테크논문대상",
    region: "국내 · 논문 공모전",
    note: "국내 대표 청소년·대학(원)생 논문 공모전. 매년 초록 접수 일정이 바뀌므로 공고를 확인하세요.",
    href: "https://humantech.samsung.com",
  },
  {
    name: "사이언스올",
    region: "국내 · 과학문화 포털",
    note: "한국과학창의재단이 운영하는 과학경진대회·공모전 정보 포털. 청소년 대상 대회 일정을 모아볼 수 있습니다.",
    href: "https://www.scienceall.com",
  },
];

export function SubmissionVenues() {
  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">투고처 후보 모음</h2>
      <p className="mt-1 text-sm text-ink-soft">
        청소년 저자를 받는 곳 위주로 모았습니다. 접수 기간·비용·요건은 자주
        바뀌니 투고 전 반드시 공식 사이트에서 최신 공고를 확인하세요.
      </p>

      <ul className="mt-4 space-y-3">
        {VENUES.map((v) => (
          <li key={v.name} className="rounded-lg bg-surface px-4 py-3">
            <a
              href={v.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-ink hover:text-accent hover:underline"
            >
              {v.name} ↗
            </a>
            <p className="mt-0.5 text-xs font-medium text-ink-soft">
              {v.region}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {v.note}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
