import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/dashboard", "/projects"],
    },
    sitemap: process.env.URL + "/sitemap.xml",
  };
}
