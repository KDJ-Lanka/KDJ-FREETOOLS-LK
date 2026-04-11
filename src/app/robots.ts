import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://freetools.lk/sitemap.xml",
    host: "https://freetools.lk",
  };
}
