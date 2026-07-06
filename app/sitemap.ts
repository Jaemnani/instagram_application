import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";
import { getInstagramData } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, syncedAt } = await getInstagramData();
  const lastModified = syncedAt ? new Date(syncedAt) : new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteConfig.url}/posts/${p.slug}`,
    lastModified: new Date(p.timestamp),
    changeFrequency: "monthly",
    priority: 0.8,
    images: p.coverImage ? [`${siteConfig.url}${p.coverImage.src}`] : undefined,
  }));

  return [...staticRoutes, ...postRoutes];
}
