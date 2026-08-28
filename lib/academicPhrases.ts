/**
 * 논문에서 반복적으로 쓰이는 영어 정형표현(formulaic expression) 모음.
 *
 * 특정 출처의 목록을 옮기지 않고, 학술 영어에서 관용적으로 굳어진 문형만
 * 직접 정리했다. 예시에 들어가는 숫자·주제는 /example의 가상 연구
 * (백색소음과 단어 회상)와 맞춰서, 사이트 안에서 같은 예시가 이어지게 한다.
 *
 * `___`는 사용자가 채울 자리다.
 */

export const PHRASE_SECTIONS = [
  "서론",
  "방법",
  "결과",
  "논의",
  "한계·결론",
] as const;

export type PhraseSection = (typeof PHRASE_SECTIONS)[number];

export type Phrase = {
  /** 짧은 용도 태그 — 목록에서 어떤 상황인지 한눈에 보이게 한다 */
  tag: string;
  en: string;
  ko: string;
};

export const PHRASES: Record<PhraseSection, Phrase[]> = {
  서론: [
    {
      tag: "배경",
      en: "___ has received increasing attention in recent years.",
      ko: "최근 ___에 대한 관심이 커지고 있다.",
    },
    {
      tag: "배경",
      en: "Previous studies have shown that ___.",
      ko: "선행연구들은 ___임을 보여 왔다.",
    },
    {
      tag: "배경",
      en: "It is widely accepted that ___.",
      ko: "___라는 점은 널리 받아들여진다.",
    },
    {
      tag: "갭",
      en: "However, relatively little is known about ___.",
      ko: "그러나 ___에 대해서는 알려진 바가 많지 않다.",
    },
    {
      tag: "갭",
      en: "To date, few studies have examined ___ in ___.",
      ko: "지금까지 ___에서 ___를 다룬 연구는 드물다.",
    },
    {
      tag: "갭",
      en: "Previous research has focused mainly on ___, whereas ___ has received less attention.",
      ko: "선행연구는 주로 ___에 집중했고, ___는 상대적으로 덜 다뤄졌다.",
    },
    {
      tag: "목적",
      en: "The present study aims to examine whether ___ affects ___.",
      ko: "본 연구의 목적은 ___가 ___에 영향을 주는지 검토하는 것이다.",
    },
    {
      tag: "가설",
      en: "We hypothesized that participants in the ___ condition would score higher on ___ than those in the ___ condition.",
      ko: "___ 조건의 참여자가 ___ 조건보다 ___에서 더 높은 점수를 보일 것이라고 가설을 세웠다.",
    },
  ],

  방법: [
    {
      tag: "참여자",
      en: "A total of 32 high school students (16 per condition) participated in this study.",
      ko: "총 32명의 고등학생(조건당 16명)이 참여했다.",
    },
    {
      tag: "윤리",
      en: "Informed consent was obtained from all participants and their guardians before data collection.",
      ko: "자료 수집 전에 모든 참여자와 보호자로부터 사전 동의를 받았다.",
    },
    {
      tag: "배정",
      en: "Participants were randomly assigned to one of two conditions.",
      ko: "참여자를 두 조건 중 하나에 무작위로 배정했다.",
    },
    {
      tag: "도구",
      en: "___ was measured using ___.",
      ko: "___는 ___를 사용해 측정했다.",
    },
    {
      tag: "절차",
      en: "All sessions were conducted in the same classroom at the same time of day.",
      ko: "모든 회차는 같은 교실에서 같은 시간대에 진행했다.",
    },
    {
      tag: "통제",
      en: "The following variables were held constant across conditions: ___.",
      ko: "조건 간에 다음 변수를 동일하게 유지했다: ___.",
    },
    {
      tag: "제외 기준",
      en: "Data from two participants were excluded from the analysis because ___.",
      ko: "두 명의 자료는 ___ 이유로 분석에서 제외했다.",
    },
    {
      tag: "분석",
      en: "An independent-samples t-test was used to compare the two groups, with a significance level of .05.",
      ko: "두 집단 비교에 독립표본 t-검정을 사용했으며, 유의수준은 .05로 설정했다.",
    },
  ],

  결과: [
    {
      tag: "표·그림 안내",
      en: "Table 1 summarizes the descriptive statistics for both conditions.",
      ko: "표 1에 두 조건의 기술통계를 정리했다.",
    },
    {
      tag: "표·그림 안내",
      en: "As shown in Figure 1, ___.",
      ko: "그림 1에 나타난 것처럼 ___.",
    },
    {
      tag: "기술통계",
      en: "The white-noise group (M = 16.9, SD = 2.4, n = 16) scored higher than the quiet group (M = 14.5, SD = 2.6, n = 16).",
      ko: "백색소음 집단(M = 16.9, SD = 2.4, n = 16)이 조용한 집단(M = 14.5, SD = 2.6, n = 16)보다 높은 점수를 보였다.",
    },
    {
      tag: "검정 결과",
      en: "This difference was statistically significant, t(30) = 2.71, p = .011, d = 0.96.",
      ko: "이 차이는 통계적으로 유의했다, t(30) = 2.71, p = .011, d = 0.96.",
    },
    {
      tag: "검정 결과",
      en: "No statistically significant difference was found between the two groups, t(30) = 0.84, p = .41.",
      ko: "두 집단 간에 통계적으로 유의한 차이는 나타나지 않았다, t(30) = 0.84, p = .41.",
    },
    {
      tag: "상관",
      en: "There was a moderate positive correlation between ___ and ___, r = .43, p = .014.",
      ko: "___와 ___ 사이에 중간 정도의 양의 상관이 있었다, r = .43, p = .014.",
    },
    {
      tag: "보고 원칙",
      en: "Means and standard deviations for all measures are reported in Table 2.",
      ko: "모든 측정치의 평균과 표준편차는 표 2에 제시했다.",
    },
  ],

  논의: [
    {
      tag: "해석",
      en: "These findings suggest that ___.",
      ko: "이 결과는 ___를 시사한다.",
    },
    {
      tag: "선행연구 비교",
      en: "This result is consistent with the findings of ___ (2020), who reported that ___.",
      ko: "이 결과는 ___를 보고한 ___(2020)의 결과와 일치한다.",
    },
    {
      tag: "선행연구 비교",
      en: "In contrast to ___ (2019), we did not find ___.",
      ko: "___(2019)와 달리, 본 연구에서는 ___를 발견하지 못했다.",
    },
    {
      tag: "설명 제시",
      en: "One possible explanation for this result is that ___.",
      ko: "이 결과에 대한 한 가지 가능한 설명은 ___이다.",
    },
    {
      tag: "설명 제시",
      en: "This may be because ___, although the present study cannot confirm this directly.",
      ko: "이는 ___ 때문일 수 있으나, 본 연구로는 이를 직접 확인할 수 없다.",
    },
    {
      tag: "의의",
      en: "To our knowledge, this is one of the few studies to examine ___ in a high school setting.",
      ko: "확인한 범위에서, 본 연구는 고등학교 환경에서 ___를 다룬 소수의 연구 중 하나다.",
    },
  ],

  "한계·결론": [
    {
      tag: "한계",
      en: "This study has several limitations.",
      ko: "본 연구에는 몇 가지 한계가 있다.",
    },
    {
      tag: "한계",
      en: "The sample size was relatively small, which limits the generalizability of the findings.",
      ko: "표본 크기가 비교적 작아 결과를 일반화하는 데 한계가 있다.",
    },
    {
      tag: "한계",
      en: "Because participants were recruited from a single school, the results may not generalize to other populations.",
      ko: "참여자를 한 학교에서만 모집했으므로, 결과가 다른 집단에도 적용된다고 보기는 어렵다.",
    },
    {
      tag: "한계",
      en: "___ was not controlled in this study and may have influenced the results.",
      ko: "본 연구에서는 ___를 통제하지 못했으며, 이것이 결과에 영향을 주었을 수 있다.",
    },
    {
      tag: "후속 연구",
      en: "Future research should replicate these findings with a larger and more diverse sample.",
      ko: "후속 연구에서는 더 크고 다양한 표본으로 이 결과를 반복 검증할 필요가 있다.",
    },
    {
      tag: "후속 연구",
      en: "Further studies are needed to determine whether ___.",
      ko: "___인지 밝히기 위해서는 추가 연구가 필요하다.",
    },
    {
      tag: "결론",
      en: "In conclusion, the present study found that ___.",
      ko: "결론적으로, 본 연구는 ___를 확인했다.",
    },
  ],
};

/** 섹션별로 이 표현들을 언제 쓰는지 — 목록 위 안내문에 쓴다. */
export const SECTION_NOTES: Record<PhraseSection, string> = {
  서론: "배경 → 갭 → 목적·가설 순서로 이어지도록 골라 쓰세요.",
  방법: "다른 사람이 그대로 따라 할 수 있을 만큼 구체적으로 채워야 합니다.",
  결과:
    "결과에는 해석을 넣지 않습니다 — suggest, indicate, because 같은 말이 나오면 논의로 옮기세요.",
  논의: "결과에 없던 새로운 숫자를 여기서 처음 꺼내지 않습니다.",
  "한계·결론": "한계는 숨기는 게 아니라 먼저 밝히는 편이 신뢰를 줍니다.",
};
