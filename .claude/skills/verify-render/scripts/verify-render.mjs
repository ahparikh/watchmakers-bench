// Screenshot every named state of the app and run its numeric checks. See ../SKILL.md.
import { chromium } from "playwright";
import { createServer } from "vite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (flag, dflt) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : dflt; };
const root = resolve(opt("--root", process.cwd()));
const only = opt("--state", null);
const port = Number(opt("--port", 5199));
const viewport = { width: Number(opt("--width", 900)), height: Number(opt("--height", 900)) };

mkdirSync(resolve(root, "shots"), { recursive: true });
const server = await createServer({ root, server: { port, strictPort: true }, logLevel: "silent" });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

let failed = 0;
try {
  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__bench?.states, null, { timeout: 10000 });
  const states = await page.evaluate(() => window.__bench.states());
  const wanted = only ? states.filter((s) => s === only) : states;
  if (only && wanted.length === 0) { console.error(`no state named ${only}; have: ${states.join(", ")}`); process.exit(2); }
  for (const name of wanted) {
    await page.goto(`http://localhost:${port}/?state=${encodeURIComponent(name)}`);
    await page.waitForSelector(`svg[data-state="${name}"]`, { timeout: 10000 });
    const file = resolve(root, "shots", `${name}.png`);
    await page.screenshot({ path: file });
    const describe = await page.evaluate(() => window.__bench.describe());
    const checks = await page.evaluate(() => window.__bench.check());
    const bad = checks.filter((c) => !c.pass);
    failed += bad.length;
    console.log(`\n${bad.length ? "✗" : "✓"} ${name} — ${describe}\n  ${file}`);
    for (const c of checks) console.log(`  ${c.pass ? "ok  " : "FAIL"} ${c.name}: ${c.detail}`);
  }
} catch (e) {
  console.error(String(e));
  failed++;
} finally {
  if (errors.length) { console.error("\npage errors:\n" + errors.join("\n")); failed++; }
  await browser.close();
  await server.close();
}
console.log(`\n${failed ? `${failed} failure(s)` : "all states pass numeric checks"}; now read the screenshots.`);
process.exit(failed ? 1 : 0);
