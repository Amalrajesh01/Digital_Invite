import type { MetadataRoute } from "next";

/** AI-training and bulk scrapers are refused everywhere; search engines may see the home page but not previews or admin. */
const AI_CRAWLERS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "CCBot", "Google-Extended", "PerplexityBot", "Bytespider", "Amazonbot", "Applebot-Extended", "FacebookBot", "Meta-ExternalAgent", "cohere-ai", "Diffbot", "ImagesiftBot", "Omgilibot", "YouBot", "AI2Bot", "Timpibot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_CRAWLERS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/preview/", "/admin/", "/client/", "/editor/", "/api/", "/invite/", "/wall/"] },
    ],
  };
}
