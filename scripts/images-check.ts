/**
 * npm run images:check — the image-quality gate for the cinematic wedding templates (see src/domain/imagery/check.ts).
 * Prints every finding; exits 1 if any is an error. Warnings (a photograph a little small, a ratio that crops hard) do not fail it.
 */
import { checkManifest } from "../src/domain/imagery/check";
import { CASTING } from "../src/domain/imagery/casting";

async function main() {
  const findings = await checkManifest();
  const errors = findings.filter((f) => f.level === "error");
  for (const f of findings) console.log(`${f.level === "error" ? "ERROR" : "warn "}  ${f.templateId ?? "-"}  ${f.stock ?? ""}  ${f.message}`);
  console.log(`\n${Object.keys(CASTING).length} templates · ${errors.length} errors · ${findings.length - errors.length} warnings`);
  process.exit(errors.length ? 1 : 0);
}
void main();
