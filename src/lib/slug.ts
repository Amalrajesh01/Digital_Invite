/** Browser-safe slug helper (mirrors the server's normalizeSlug, which also enforces reserved words). */
export function normalizeSlugClient(input: string, typing = false): string {
  let s = input.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-");
  if (!typing) s = s.replace(/^-+|-+$/g, "");
  else s = s.replace(/^-+/, "");
  return s.replace(/-{2,}/g, "-").slice(0, 60);
}
