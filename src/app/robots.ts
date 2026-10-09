import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** AI-training and bulk scrapers are refused everywhere; search engines may see the product site but not previews, invitations or the studio. */
const AI_CRAWLERS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "CCBot", "Google-Extended", "PerplexityBot", "Bytespider", "Amazonbot", "Applebot-Extended", "FacebookBot", "Meta-ExternalAgent", "cohere-ai", "Diffbot", "ImagesiftBot", "Omgilibot", "YouBot", "AI2Bot", "Timpibot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_CRAWLERS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/preview/", "/admin/", "/client/", "/editor/", "/api/", "/invite/", "/wall/", "/login"] },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
