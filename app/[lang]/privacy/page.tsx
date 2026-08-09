import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomeLink } from "@/components/HomeLink";
import { JsonLd } from "@/components/JsonLd";
import { hasLocalBusinessData, siteConfig } from "@/lib/config";
import { getDictionary, isLocale, locales, localizedPath, type Locale } from "@/lib/i18n";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { languageAlternates } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.privacy.title,
    description: `${siteConfig.name} — ${dict.privacy.metaDescription}`,
    alternates: {
      canonical: localizedPath(lang, "/privacy"),
      languages: languageAlternates("/privacy"),
    },
    robots: { index: true, follow: true },
  };
}

function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-bold text-ink-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-[1.9] text-ink-600">{children}</div>
    </section>
  );
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const b = siteConfig.business;
  const address = [b.addressRegion, b.addressLocality, b.streetAddress].filter(Boolean).join(" ");

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <JsonLd
        data={breadcrumbLd([
          { name: siteConfig.name, path: localizedPath(locale) },
          { name: dict.privacy.title, path: localizedPath(locale, "/privacy") },
        ])}
      />

      <HomeLink lang={locale} dict={dict} />

      <h1 className="mt-8 font-serif text-3xl font-bold text-ink-900">{dict.privacy.title}</h1>
      <p className="mt-4 text-[15px] leading-[1.9] text-ink-600">
        <span className="wordmark text-ink-900">{siteConfig.name}</span>
        {dict.privacy.intro}
      </p>

      {dict.privacy.clauses.map((c) => (
        <Clause key={c.title} title={c.title}>
          {c.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {/* 연락처 조항에는 확인된 사업장 정보를 덧붙인다 */}
          {c.title.startsWith("5") && hasLocalBusinessData() && (
            <>
              {address && <p>{`${dict.location.address}: ${address}`}</p>}
              {b.telephone && <p>{`${dict.location.phone}: ${b.telephone}`}</p>}
            </>
          )}
        </Clause>
      ))}
    </div>
  );
}
