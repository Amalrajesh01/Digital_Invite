/**
 * Edge guard for the public template previews: refuses automated clients and caps request rates per address.
 * A template that a browser can display cannot be made impossible to copy, so the aim is to make bulk copying
 * (scrapers, AI crawlers, headless browsers, scripted downloads) slow, noisy and traceable.
 */
const BAD_AGENTS = /gptbot|chatgpt|oai-searchbot|claudebot|claude-web|anthropic|ccbot|google-extended|perplexity|bytespider|amazonbot|applebot-extended|facebookbot|meta-external|cohere|diffbot|imagesift|omgili|youbot|ai2bot|timpi|scrapy|python-requests|python-urllib|aiohttp|httpx|go-http-client|okhttp|curl\/|wget|libwww|java\/|node-fetch|axios|undici|got \(|headlesschrome|phantomjs|puppeteer|playwright|selenium|httrack|webcopier|teleport|offline explorer|sitesucker|webzip|crawler|spider|scraper|bot\b/i;

const hits = new Map<string, { n: number; reset: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 40; // page + asset-free requests per address per minute — a person browsing never gets near it

export function guardPreview(headers: Headers, ip: string): { ok: true } | { ok: false; status: number; retry?: number } {
  const ua = headers.get("user-agent") ?? "";
  // Real browsers always send a User-Agent and Accept-Language; scripted clients usually omit one of them.
  if (!ua || ua.length < 20 || BAD_AGENTS.test(ua) || !headers.get("accept-language")) return { ok: false, status: 403 };
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || e.reset < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { n: 1, reset: now + WINDOW_MS });
    return { ok: true };
  }
  e.n += 1;
  return e.n > LIMIT ? { ok: false, status: 429, retry: Math.ceil((e.reset - now) / 1000) } : { ok: true };
}
