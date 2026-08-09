import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";
import { getInstagramData } from "@/lib/data";
import { htmlLang, localizedPath, locales } from "@/lib/i18n";

/** 같은 문서의 언어별 주소 (sitemap 의 hreflang) */
function alternates(path: string) {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[htmlLang[l]] = `${siteConfig.url}${localizedPath(l, path)}`;
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, syncedAt } = await getInstagramData();
  const lastModified = syncedAt ? new Date(syncedAt) : new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: `${siteConfig.url}${localizedPath(locale)}`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
      alternates: alternates("/"),
    });
    entries.push({
      url: `${siteConfig.url}${localizedPath(locale, "/privacy")}`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.1,
      alternates: alternates("/privacy"),
    });

    for (const p of posts) {
      const path = `/posts/${p.slug}`;
      entries.push({
        url: `${siteConfig.url}${localizedPath(locale, path)}`,
        lastModified: new Date(p.timestamp),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: alternates(path),
        images: p.coverImage ? [`${siteConfig.url}${p.coverImage.src}`] : undefined,
      });
    }
  }

  return entries;
}
