import { MANIFEST } from "../src/domain/baptism/images";
import { checkBaptism } from "../src/domain/baptism/check";

/** npm run baptism:check — the image gate for the twenty baptism templates (see src/domain/baptism/check.ts). */
async function main() {
  const findings = await checkBaptism();
  for (const f of findings) console.log(`${f.level === "error" ? "✗" : "!"} ${f.templateId ?? ""}${f.slot ? `/${f.slot}` : ""}  ${f.message}`);
  const count = (s: string) => MANIFEST.filter((r) => r.status === s).length;
  const heroes = MANIFEST.filter((r) => r.slot === "hero");
  console.log(`\n${MANIFEST.length} slots · ${count("stand-in")} licensed stand-ins · ${count("generated")} generated · ${count("pending")} waiting for a picture (prompts ready)`);
  console.log(`heroes: ${heroes.filter((r) => r.status !== "pending").length} with a picture, ${heroes.filter((r) => r.status === "pending").length} drawn scene only`);
  const errors = findings.filter((f) => f.level === "error").length;
  console.log(`${errors} errors, ${findings.length - errors} warnings`);
  process.exit(errors ? 1 : 0);
}
main();
