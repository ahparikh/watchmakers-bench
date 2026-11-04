// Onboarding checks: the first-visit guide (steps, skip, persistence, replay), the hint timer, mobile layout.
import { chromium } from "playwright";
import { createServer } from "vite";
import { createServer as net } from "node:net";
const port = await new Promise((res) => { const s = net(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
const server = await createServer({ root: process.cwd(), server: { port, strictPort: true }, logLevel: "silent" });
await server.listen();
const browser = await chromium.launch();
const out = [];
const check = (name, ok, detail = "") => out.push(`${ok ? "ok  " : "FAIL"} ${name} ${detail}`);
const url = `http://localhost:${port}/`;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.clock.install();
  await page.goto(url);
  await page.waitForSelector("#guide");
  check("guide opens on first visit", await page.isVisible("#guide"));
  check("welcome has Start and Skip", (await page.textContent("#guide .nav"))?.includes("Start") && (await page.textContent("#guide .nav"))?.includes("Skip"));
  await page.screenshot({ path: "shots/onboarding-live-guide-welcome.png" });
  await page.click('#guide [data-act="next"]');
  check("step 1 is the mainspring", (await page.textContent("#guide h2"))?.includes("mainspring"));
  check("step 1 links the manual", (await page.getAttribute("#guide .manual a", "href"))?.endsWith("#power"));
  // Walk to the regulator step and confirm the slider is spotlighted and the card moved out of its way.
  for (let i = 0; i < 3; i++) await page.click('#guide [data-act="next"]');
  check("step 4 is the regulator", (await page.textContent("#guide h2"))?.includes("regulator"));
  check("regulator control spotlighted", await page.$eval("#ctl-regulator", (el) => el.classList.contains("guide-spot")));
  check("card moves to the top for a footer spotlight", await page.$eval("#guide", (el) => el.classList.contains("at-top")));
  await page.screenshot({ path: "shots/onboarding-live-guide-regulator.png" });
  await page.keyboard.press("ArrowLeft");
  check("ArrowLeft goes back", (await page.textContent("#guide h2"))?.includes("balance"));
  await page.keyboard.press("ArrowRight");
  // Hidden controls are not spotlighted (beat slider is hidden on puzzle 1).
  await page.click('#guide [data-act="next"]');
  check("hidden control is not spotlighted", !(await page.$(".guide-spot")));
  // Finish the tour.
  for (let i = 0; i < 3; i++) await page.click('#guide [data-act="next"]');
  check("last step offers Start fixing", (await page.textContent("#guide .nav"))?.includes("Start fixing"));
  await page.click('#guide [data-act="next"]');
  check("guide closes after the last step", !(await page.isVisible("#guide")));
  check("no spotlight left behind", !(await page.$(".guide-spot")));
  await page.reload();
  await page.waitForSelector("#onboarding");
  check("guide stays closed after reload", !(await page.isVisible("#guide")));
  check("replay button present", await page.isVisible('[data-act="replay"]'));
  await page.click('[data-act="replay"]');
  check("replay reopens at welcome", await page.isVisible("#guide") && (await page.textContent("#guide h2"))?.includes("bad time"));
  await page.keyboard.press("Escape");
  check("Escape closes the guide", !(await page.isVisible("#guide")));
  // Hint after 60 s without progress, timer restarted at guide close.
  await page.clock.runFor(59_000);
  check("no hint at 59 s", !(await page.isVisible("#bench-help .hint")));
  await page.clock.runFor(2_500);
  check("hint shown after 60 s", await page.isVisible("#bench-help .hint"), (await page.textContent("#bench-help .hint"))?.trim());
  await page.selectOption("#puzzle-select", "out-of-beat");
  await page.clock.runFor(1_500);
  check("hint cleared on puzzle change", !(await page.isVisible("#bench-help .hint")));
  await page.clock.runFor(61_000);
  check("puzzle 2 hint after 60 s", (await page.textContent("#bench-help .hint"))?.includes("Beat adjustment"));
  check("no page errors", errs.length === 0, errs.join("; "));
  // Skip on first visit persists too.
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p2.goto(url); await p2.waitForSelector("#guide");
  await p2.click('#guide [data-act="skip"]');
  await p2.reload(); await p2.waitForSelector("#onboarding");
  check("skip persists across reload", !(await p2.isVisible("#guide")));
  // Mobile: guide fits, no horizontal scroll.
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(url); await m.waitForSelector("#guide");
  const sw = await m.evaluate(() => document.documentElement.scrollWidth);
  check("mobile: no horizontal scroll", sw <= 390, `scrollWidth ${sw}`);
  const gb = await m.locator("#guide").boundingBox();
  check("mobile: guide card fits the viewport", gb && gb.x >= 0 && gb.x + gb.width <= 390 && gb.height <= 844, JSON.stringify(gb));
  await m.screenshot({ path: "shots/onboarding-live-mobile.png" });
} finally { await browser.close(); await server.close(); }
console.log(out.join("\n"));
process.exit(out.some((l) => l.startsWith("FAIL")) ? 1 : 0);
