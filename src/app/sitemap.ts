import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://legalnavigator.jo";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1, alternates: { languages: { ar: `${base}/`, en: `${base}/en` } } },
    { url: `${base}/upload`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/lawyers`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/learn`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/analyses`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
