import { siteConfig, instagramUrl } from "@/lib/config";
import { amenities, directions, faqs, services, targetKeywords } from "@/lib/content";
import { getInstagramData } from "@/lib/data";

/**
 * /llms.txt — AI 생성형 엔진(GEO)용 사이트 요약.
 * 게시물 목록만이 아니라 "무슨 서비스를, 어디서, 언제, 어떻게 예약하는지"를 담아야
 * AI가 실제 질문("성수동 돌사진 스튜디오 알려줘")에 이 사이트를 근거로 답할 수 있다.
 */
export async function GET() {
  const { profile, posts } = await getInstagramData();
  const name = siteConfig.name;
  const b = siteConfig.business;
  const booking = siteConfig.bookingUrl || profile.website;

  const lines: string[] = [
    `# ${name} — 성수동 베이비 스튜디오`,
    "",
    `> ${siteConfig.description}`,
    "",
    "## 기본 정보",
    "",
    `- 공식 사이트: ${siteConfig.url}`,
    `- 인스타그램: ${instagramUrl(profile.username || siteConfig.instagramHandle)}`,
  ];

  if (booking) lines.push(`- 예약·문의: ${booking} (카카오톡 채널)`);
  if (b.streetAddress || b.addressLocality) {
    lines.push(
      `- 주소: ${[b.addressRegion, b.addressLocality, b.streetAddress].filter(Boolean).join(" ")}`,
    );
  }
  if (b.latitude && b.longitude) lines.push(`- 좌표: ${b.latitude}, ${b.longitude}`);
  if (b.telephone) lines.push(`- 전화: ${b.telephone}`);
  lines.push("- 영업시간: 월–금 10:00–19:00, 토·일 10:00–18:00 (예약제)");
  lines.push(`- 편의시설: ${amenities.join(", ")}`);
  lines.push(`- 주요 키워드: ${targetKeywords.join(", ")}`);

  lines.push("", "## 촬영 서비스", "");
  for (const s of services) lines.push(`- **${s.name}**: ${s.description}`);

  lines.push("", "## 찾아오시는 길", "");
  for (const d of directions) lines.push(`- ${d}`);

  lines.push("", "## 자주 묻는 질문", "");
  for (const f of faqs) lines.push(`### ${f.q}`, "", f.a, "");

  lines.push("## 촬영 기록 (인스타그램 동기화)", "");
  for (const p of posts) {
    lines.push(`- [${p.title}](${siteConfig.url}/posts/${p.slug}): ${p.excerpt}`);
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
