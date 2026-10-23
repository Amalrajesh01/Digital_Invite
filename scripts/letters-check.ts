/**
 * npm run letters:check — the quality gate for Forever Letters (see src/domain/letters/check.ts).
 * Prints every finding; exits 1 if any is an error. Warnings (a shared backdrop, a photograph a little small) do not fail it.
 */
import { checkLetters } from "../src/domain/letters/check";
import { LETTERS } from "../src/domain/letters";

async function main() {
  const findings = await checkLetters();
  const errors = findings.filter((f) => f.level === "error");
  for (const f of findings) console.log(`${f.level === "error" ? "ERROR" : "warn "}  ${f.id}  ${f.message}`);
  console.log(`\n${LETTERS.length} experiences · ${errors.length} errors · ${findings.length - errors.length} warnings`);
  process.exit(errors.length ? 1 : 0);
}
void main();
