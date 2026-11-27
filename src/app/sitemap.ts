import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paths = [
    "",
    "/markets",
    "/gold",
    "/wallets",
    "/wallets/top",
    "/wallets/elite",
    "/statistics",
    "/pricing",
    "/terms",
    "/privacy",
    "/disclaimer",
    "/contact",
  ];
  return paths.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));
}
