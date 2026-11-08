import type { MetadataRoute } from "next";
import { getAllActiveProducts } from "@/lib/products.server";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllActiveProducts();
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...products.map((product) => ({
      url: absoluteUrl(`/produto/${product.id}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
