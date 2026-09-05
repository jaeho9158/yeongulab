/**
 * 콘텐츠 디렉터리 읽기(fs + gray-matter) 결과를 **빌드 중에만** 재사용하는 캐시.
 *
 * 왜 필요한가
 * -----------
 * 이 함수들은 "디렉터리 전체를 읽어 프런트매터를 파싱한다"는 구조라 한 번
 * 호출할 때마다 파일 전부를 다시 읽는다. 그런데 페이지들이 이걸 아주 여러 번
 * 부른다. 실측(자료실 31편·단계 6편·사례 6편 기준, `next build` 1회):
 *
 *   getAllArticles()  166회
 *   getAllStages()     63회
 *   getAllShowcases()  22회
 *
 * generateStaticParams / generateMetadata / page / opengraph-image가 slug마다
 * 각각 부르기 때문이다. 사용자 로딩 시간과는 무관한 순수 빌드 비용이지만
 * 누적 CPU가 초 단위라 잡아둘 만하다.
 *
 * ★★ 개발 모드에서는 절대 켜지 말 것 ★★
 * -----------------------------------
 * 모듈 레벨 캐시를 조건 없이 넣으면 `next dev`에서 MDX를 고쳐도 화면에 반영되지
 * 않는다(모듈이 살아 있는 한 첫 읽기 결과가 그대로 붙박인다). 이 저장소는
 * 자료실 글을 수시로 고치는 곳이라 그 순간 콘텐츠 작업이 불가능해진다.
 * 그래서 `NODE_ENV === "production"`(= `next build`)일 때만 캐시를 쓴다.
 * dev와 test에서는 매번 디스크를 다시 읽는다 — 예전에 이 최적화를 미뤄둔
 * 이유가 정확히 이 함정이었으니, 조건을 떼어내지 마라.
 *
 * `React.cache()`도 검토했다. dev 스테일이 없다는 장점은 있지만 렌더 패스
 * 밖(generateStaticParams, sitemap.ts, opengraph-image의 params 생성 등)에서는
 * 메모이제이션이 걸리지 않아 실측상 166회 → 73회로 절반밖에 못 줄였다.
 * 아래 방식은 워커 프로세스당 1회까지 줄어든다.
 *
 * NODE_ENV는 모듈 로드 시점이 아니라 호출 시점에 읽는다 — 테스트에서
 * 프로덕션 동작을 검증할 수 있게 하려는 의도다.
 */
export function buildOnlyCache<T>(read: () => T[]): () => T[] {
  let cached: T[] | undefined;
  return () => {
    if (process.env.NODE_ENV !== "production") return read();
    cached ??= read();
    // 호출부가 반환 배열을 정렬·변형해도 캐시가 오염되지 않도록 얕은 복사.
    // (지금은 그런 호출부가 없지만, 캐시 도입 전과 동일한 "매번 새 배열"
    //  계약을 유지해 동작 변화를 원천 차단한다.)
    return cached.slice();
  };
}
