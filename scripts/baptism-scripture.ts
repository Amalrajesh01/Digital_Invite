import { TRANSLATION, VERSES } from "../src/domain/baptism/scripture";

/**
 * Checks every verse a baptism invitation can quote against a published text of the same translation (the King James Version, public
 * domain) — word for word. Needs the internet. `npm run baptism:scripture`; a mismatch is a failure, an unreachable source is a warning.
 */
const norm = (s: string) => s.replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
const slug = (ref: string) => encodeURIComponent(ref.replace("–", "-").replace(/\s+/g, " "));

async function textOf(ref: string): Promise<string | null> {
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch(`https://bible-api.com/${slug(ref)}?translation=${TRANSLATION.id}`);
      const body = await res.text();
      const j = JSON.parse(body) as { text?: string; translation_id?: string };
      if (j.text && j.translation_id === TRANSLATION.id) return j.text;
    } catch { /* rate limited or offline: wait and try again */ }
    await new Promise((ok) => setTimeout(ok, 4000));
  }
  return null;
}

async function main() {
  let bad = 0, unreachable = 0;
  for (const v of VERSES) {
    const full = await textOf(v.ref);
    await new Promise((ok) => setTimeout(ok, 2500));
    if (full === null) { unreachable++; console.log(`?  ${v.ref}: could not reach the source`); continue; }
    const a = norm(full), b = norm(v.text);
    const same = v.excerpt ? a.includes(b) : a === b;
    if (!same) bad++;
    console.log(`${same ? "ok" : "✗ "} ${v.ref}${v.excerpt ? " (excerpt)" : ""}${same ? "" : `\n     ours:   ${v.text}\n     source: ${full.replace(/\s+/g, " ").trim()}`}`);
  }
  console.log(`\n${VERSES.length} verses · ${bad} differ · ${unreachable} not reachable (${TRANSLATION.name}, ${TRANSLATION.licence})`);
  return bad ? 1 : 0;
}

main().then((code) => process.exit(code));
