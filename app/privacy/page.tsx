import type { Metadata } from "next";

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
      <p className="mt-3 text-sm text-ink-soft">시행일: 2026년 8월 15일</p>

      <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-bold prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-accent prose-a:no-underline hover:prose-a:underline">
        <p>
          연구랩 가이드(이하 &quot;이 사이트&quot;)는 회원가입이나 로그인
          없이 누구나 이용할 수 있는 무료 서비스입니다. 이 방침은 이 사이트가
          어떤 정보를 어떻게 다루는지 설명합니다.
        </p>

        <h2>1. 수집하는 개인정보</h2>
        <p>
          이 사이트는 <strong>회원가입, 로그인, 결제 기능이 없으며</strong>,
          이름·이메일·전화번호 등 개인을 식별할 수 있는 정보를 서버에
          수집하지 않습니다.
        </p>

        <h2>2. 브라우저 저장 정보 (localStorage)</h2>
        <p>
          체크리스트 완료 여부, 자가검증 질문에 대한 메모, 마감일 트래커에
          등록한 대회·저널 이름과 날짜는 <strong>이용자의 브라우저에만</strong>{" "}
          저장됩니다(localStorage). 이 데이터는 이 사이트의 서버로 전송되지
          않으며, 브라우저 저장 데이터를 지우거나 다른 기기·브라우저로
          접속하면 사라집니다.
        </p>

        <h2>3. 선행연구 검색 기능</h2>
        <p>
          &quot;선행연구 검색해보기&quot; 도구를 사용하면 입력한 검색어가 이
          사이트의 서버를 거쳐 Semantic Scholar(외부 학술 검색 API)로
          전달됩니다. 검색어 외의 개인정보는 전달되지 않으며, 검색 기록을
          서버에 별도로 저장하지 않습니다.
        </p>

        <h2>4. 쿠키 및 광고, 방문 통계</h2>
        <p>
          이 사이트는 Google Analytics(GA4)를 사용해 방문자 수, 자주 보는
          페이지 같은 익명 통계를 수집합니다. 이 과정에서 쿠키가 사용될 수
          있으며, 수집되는 정보에는 개인을 특정할 수 있는 이름·이메일 등이
          포함되지 않습니다.
        </p>
        <p>
          또한 이 사이트는 Google AdSense를 통한 광고 게재를 준비하고
          있습니다. 광고가 게재되면 Google 및 광고 파트너가 맞춤 광고 제공을
          위해 쿠키를 사용할 수 있습니다. 쿠키 사용을 원하지 않는 경우
          브라우저 설정에서 쿠키를 차단하거나 삭제할 수 있으며,{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 광고 정책 페이지
          </a>
          에서 맞춤 광고를 직접 해제할 수도 있습니다.
        </p>

        <h2>5. 만 14세 미만 이용자</h2>
        <p>
          이 사이트는 청소년 연구자를 주 대상으로 하지만, 회원가입이나 개인
          식별정보 입력 절차가 없어 만 14세 미만 이용자로부터도 개인정보를
          수집하지 않습니다.
        </p>

        <h2>6. 문의</h2>
        <p>
          이 방침이나 사이트 운영에 대해 문의할 사항이 있으면{" "}
          <a href="mailto:jaeho9158@gmail.com">jaeho9158@gmail.com</a>으로
          연락해주세요.
        </p>

        <h2>7. 방침 변경</h2>
        <p>
          이 방침은 서비스 변경(예: 광고 게재 시작, 로그인 기능 추가 등)에
          따라 개정될 수 있으며, 개정 시 이 페이지에 반영합니다.
        </p>
      </div>
    </div>
  );
}
