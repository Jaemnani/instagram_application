import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { hasLocalBusinessData, siteConfig } from "@/lib/config";
import { breadcrumbLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${siteConfig.name} 웹사이트의 개인정보 수집·이용에 관한 안내입니다.`,
  alternates: { canonical: "/privacy" },
  // 정책 페이지는 색인은 하되 검색 노출 우선순위가 낮다.
  robots: { index: true, follow: true },
};

function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-bold text-ink-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-[1.9] text-ink-600">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const b = siteConfig.business;
  const address = [b.addressRegion, b.addressLocality, b.streetAddress].filter(Boolean).join(" ");

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <JsonLd
        data={breadcrumbLd([
          { name: "홈", path: "/" },
          { name: "개인정보처리방침", path: "/privacy" },
        ])}
      />

      <nav aria-label="탐색 경로" className="text-sm text-ink-400">
        <Link href="/" className="hover:text-ink-900">
          홈
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-ink-600">개인정보처리방침</span>
      </nav>

      <h1 className="mt-8 font-serif text-3xl font-bold text-ink-900">개인정보처리방침</h1>
      <p className="mt-4 text-[15px] leading-[1.9] text-ink-600">
        {siteConfig.name}(이하 &ldquo;스튜디오&rdquo;)은 이 웹사이트를 통해 이용자의 개인정보를
        수집하지 않습니다. 아래는 이 사이트가 어떤 정보를 다루는지에 대한 안내입니다.
      </p>

      <Clause title="1. 수집하는 개인정보">
        <p>
          이 웹사이트에는 회원가입, 로그인, 문의 양식 등 개인정보를 입력받는 기능이 없습니다.
          따라서 이름·연락처·이메일 등 어떠한 개인정보도 수집하거나 저장하지 않습니다.
        </p>
      </Clause>

      <Clause title="2. 게시되는 콘텐츠">
        <p>
          이 사이트에 표시되는 사진과 글은 스튜디오가 운영하는 공식 인스타그램 계정(@
          {siteConfig.instagramHandle})의 게시물을 인스타그램이 제공하는 공식 API를 통해 가져와
          보여주는 것입니다. 촬영 사진의 게시는 촬영 당사자의 동의를 받은 범위에서 이루어집니다.
        </p>
        <p>
          게시된 사진의 삭제를 원하시면 아래 문의처로 연락해 주시면 확인 후 지체 없이
          내리겠습니다.
        </p>
      </Clause>

      <Clause title="3. 쿠키 및 분석 도구">
        <p>
          이 사이트는 광고·추적 목적의 쿠키를 사용하지 않습니다. 웹사이트가 배포된 호스팅
          서비스가 서비스 운영과 보안을 위해 접속 기록(IP 주소, 브라우저 종류 등)을 일시적으로
          기록할 수 있으며, 이는 스튜디오가 개별적으로 열람하거나 보관하지 않습니다.
        </p>
      </Clause>

      <Clause title="4. 외부 링크">
        <p>
          이 사이트는 인스타그램, 카카오톡 채널, 지도 서비스 등 외부 사이트로 연결되는 링크를
          포함합니다. 연결된 사이트에서의 개인정보 처리는 각 사업자의 개인정보처리방침을 따릅니다.
        </p>
      </Clause>

      <Clause title="5. 문의처">
        <p>
          개인정보 및 게시물과 관련한 문의는 카카오톡 채널 또는 인스타그램 다이렉트 메시지로
          연락해 주시기 바랍니다.
        </p>
        {hasLocalBusinessData() && address && <p>주소: {address}</p>}
        {b.telephone && <p>전화: {b.telephone}</p>}
      </Clause>

      <Clause title="6. 방침의 변경">
        <p>
          이 개인정보처리방침의 내용이 변경되는 경우 이 페이지를 통해 안내합니다.
        </p>
      </Clause>
    </div>
  );
}
