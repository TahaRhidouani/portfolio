import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/dashboard", "/projects"],
    },
    sitemap: process.env.URL + "/sitemap.xml",
  };
}
