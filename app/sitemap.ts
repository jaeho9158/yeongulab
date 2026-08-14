import type { MetadataRoute } from "next";
import { getAllStages } from "@/lib/guide";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const stages = getAllStages();

  return [
    { url: BASE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/guide`, changeFrequency: "monthly", priority: 0.9 },
    ...stages.map((stage) => ({
      url: `${BASE_URL}/guide/${stage.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
