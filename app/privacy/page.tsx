import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "연구랩 가이드의 개인정보 처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        개인정보처리방침
      </h1>
      <p className="mt-3 text-sm text-ink-soft">시행일: 2026년 8월 23일</p>

      <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-bold prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-accent prose-a:no-underline hover:prose-a:underline">
        <p>
          연구랩 가이드(이하 &quot;이 사이트&quot;)는 회원가입이나 로그인
          없이 누구나 이용할 수 있는 무료 서비스입니다. 이 방침은 이 사이트가
          어떤 정보를 어떻게 다루는지 설명합니다.
        </p>

        <h2>1. 서버에 수집하는 개인정보</h2>
        <p>
          이 사이트는 <strong>회원가입, 로그인, 결제 기능이 없으며</strong>,
          이름·이메일·전화번호 등 개인을 식별할 수 있는 정보를 서버에
          수집하지 않습니다. 다만 사이트를 운영하는 호스팅 서비스(Vercel)의
          서버 로그에 접속 시각과 요청 URL, IP 주소가 짧은 기간 남을 수
          있습니다. 이는 장애 확인·부정 접근 방지 목적으로만 쓰이며 별도로
          모아 분석하지 않습니다.
        </p>

        <h2>2. 브라우저에만 저장되는 정보 (localStorage)</h2>
        <p>
          아래 항목은 모두 <strong>이용자의 브라우저에만</strong> 저장되며
          이 사이트의 서버로 전송되지 않습니다. 저장 키는 모두{" "}
          <code>research-guide:</code>로 시작합니다.
        </p>
        <ul>
          <li>단계별 체크리스트 완료 여부</li>
          <li>자가검증 질문에 적은 메모</li>
          <li>마감일 트래커에 등록한 대회·저널 이름과 날짜</li>
          <li>레퍼런스 목록(직접 입력하거나 검색에서 저장한 문헌 정보)</li>
          <li>활동 기록(체크·메모 시각, 최대 2,000건까지만 보관)</li>
          <li>
            도구 입력값과 초안(IMRaD 초고, 글자 수 계산, 통계 계산기 입력 등)
          </li>
          <li>AI 활용 문구 생성기에 입력한 내용</li>
          <li>연구윤리 체크 결과</li>
          <li>테마(라이트/다크) 설정</li>
        </ul>
        <p>
          <strong>처리 목적:</strong> 페이지를 옮기거나 새로고침해도 작업
          내용이 사라지지 않게 하기 위한 것입니다.
          <br />
          <strong>보유 기간:</strong> 이용자가 브라우저에서 삭제할 때까지
          보관됩니다. 브라우저 저장 데이터를 지우거나 다른 기기·브라우저로
          접속하면 보이지 않습니다.
          <br />
          <strong>삭제·백업 방법:</strong>{" "}
          <Link href="/guide">6단계 가이드</Link> 페이지 하단 &quot;내
          기록&quot; 영역의 <strong>전부 삭제하기</strong> 버튼으로 이 사이트가
          저장한 기록을 한 번에 지울 수 있고, <strong>백업 파일 내려받기</strong>
          ·<strong>백업 파일 불러오기</strong> 버튼으로 다른 기기에 옮길 수
          있습니다. 브라우저 설정의 사이트 데이터 삭제로도 지워집니다.
        </p>

        <h2>3. 선행연구 검색 기능</h2>
        <p>
          &quot;선행연구 검색해보기&quot; 도구를 사용하면 입력한 검색어가 이
          사이트의 서버를 거쳐 외부 학술 검색 API인 Semantic Scholar로
          전달되고, 요청이 몰려 응답을 받지 못하면 OpenAlex로 대신
          전달됩니다. 검색어 외의 개인정보는 전달되지 않으며, 검색 기록을
          서버에 별도로 저장하지 않습니다. 같은 검색어의 결과는 최대 10분간
          서버에 임시 보관(캐시)됩니다.
        </p>

        <h2>4. 쿠키, 방문 통계, 광고</h2>
        <p>
          이 사이트는 Google Analytics(GA4)를 사용해 방문자 수, 자주 보는
          페이지 같은 통계를 수집합니다. 이 과정에서 쿠키가 사용되며,
          수집되는 정보에 이름·이메일 등 직접 식별 정보는 포함되지
          않습니다.
        </p>
        <p>
          또한 이 사이트는 Google AdSense 광고 스크립트를 싣고 있으며,
          AdSense 승인이 완료되면 광고가 표시됩니다. 이때 Google 및 광고
          파트너가 맞춤 광고 제공을 위해 쿠키를 사용할 수 있습니다. 쿠키
          사용을 원하지 않는 경우 브라우저 설정에서 쿠키를 차단하거나 삭제할
          수 있으며,{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 광고 설정 페이지
          </a>
          에서 맞춤 광고를 직접 해제할 수도 있습니다.
        </p>

        <h2>5. 국외로 전달되는 정보</h2>
        <p>
          위에서 설명한 외부 서비스는 모두 미국에 있는 회사가 운영하므로,
          해당 정보는 국외로 전달됩니다.
        </p>
        <ul>
          <li>
            Google(미국) — 방문 통계(GA4)와 광고(AdSense)에 쓰이는 쿠키·접속
            정보
          </li>
          <li>Semantic Scholar / OpenAlex(미국) — 선행연구 검색어</li>
          <li>Vercel(미국) — 사이트 호스팅, 서버 로그</li>
        </ul>

        <h2>6. 만 14세 미만 이용자</h2>
        <p>
          이 사이트는 청소년 연구자를 주 대상으로 하지만 회원가입이나 개인
          식별정보 입력 절차가 없어, 만 14세 미만 이용자로부터도 이름·연락처
          같은 개인정보를 서버에 수집하지 않습니다. 다만 방문 통계와 광고를
          위한 Google 쿠키는 나이에 관계없이 사용되므로, 만 14세 미만이라면
          보호자와 함께 이 방침을 읽고 이용해주세요. 쿠키 사용을 원하지
          않으면 브라우저 설정에서 쿠키를 차단해도 가이드와 도구는 모두 정상
          동작합니다.
        </p>

        <h2>7. 문의</h2>
        <p>
          이 방침이나 사이트 운영에 대해 문의할 사항이 있으면{" "}
          <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a>
          으로 연락해주세요.
        </p>

        <h2>8. 방침 변경</h2>
        <p>
          이 방침은 서비스 변경(예: 광고 게재 시작, 로그인 기능 추가 등)에
          따라 개정될 수 있으며, 개정 시 이 페이지에 반영하고 시행일을
          갱신합니다.
        </p>
      </div>
    </div>
  );
}
