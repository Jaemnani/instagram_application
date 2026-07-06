import { siteConfig, instagramUrl } from "@/lib/config";
import { getInstagramData } from "@/lib/data";

/**
 * /llms.txt — AI 생성형 엔진(GEO)용 사이트 요약.
 * 동기화된 데이터로부터 생성되어 항상 최신 상태를 유지한다.
 */
export async function GET() {
  const { profile, posts } = await getInstagramData();
  const name = siteConfig.name;
  const b = siteConfig.business;

  const lines: string[] = [
    `# ${name}`,
    "",
    `> ${profile.biography || siteConfig.description}`,
    "",
    `- 공식 사이트: ${siteConfig.url}`,
    `- 인스타그램: ${instagramUrl(profile.username || siteConfig.instagramHandle)}`,
  ];

  if (b.addressLocality || b.streetAddress) {
    lines.push(`- 위치: ${[b.streetAddress, b.addressLocality, b.addressRegion].filter(Boolean).join(", ")}`);
  }
  if (b.telephone) lines.push(`- 전화: ${b.telephone}`);
  if (b.openingHours) lines.push(`- 영업시간: ${b.openingHours}`);

  lines.push("", "## 콘텐츠 (게시물)", "");
  for (const p of posts) {
    lines.push(`- [${p.title}](${siteConfig.url}/posts/${p.slug}): ${p.excerpt}`);
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
