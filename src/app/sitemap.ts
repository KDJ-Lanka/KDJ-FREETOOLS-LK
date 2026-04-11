import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

const BASE = "https://freetools.lk";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPages = TOOLS.filter((t) => !t.soon).map((tool) => ({
    url: `${BASE}/${tool.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: tool.popular ? 0.9 : 0.8,
  }));

  return [
    { url: BASE,              lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/about`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...toolPages,
  ];
}
