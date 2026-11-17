// Can each puzzle be solved through the page, and does the page refuse the shortcuts?
// Exits non-zero if any check fails. Loads "/" exactly as a visitor does (no special URL).
import { chromium } from "playwright";
import { createServer } from "vite";
const server = await createServer({ root: process.cwd(), server: { port: 5198, strictPort: false }, logLevel: "silent" });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const out = [];
const check = (name, ok, detail = "") => out.push(`${ok ? "ok  " : "FAIL"} ${name} ${detail}`);
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  const card = () => page.textContent("#puzzle");
  const solved = async (ms) => { try { await page.waitForFunction(() => document.querySelector("#puzzle")?.textContent?.includes("Why it worked"), null, { timeout: ms }); return true; } catch { return false; } };
  const set = (id, v) => page.evaluate(([id, v]) => { const el = document.querySelector("#" + id); el.value = v; el.dispatchEvent(new Event("input")); }, [id, v]);

  await page.goto(base);
  await page.waitForSelector("#puzzle h2");
  check("a visitor lands on puzzle 1, no dialog in the way", (await card()).includes("Runs fast") && !(await page.isVisible("#guide")));
  check("the guide is offered in the strip", await page.isVisible('[data-act="replay"]'));
  check("nothing on the drawing is lit on load", (await page.$$("#movement .part.hot")).length === 0);

  // Puzzle 1: not solved as loaded; solved with the regulator at −1.2°.
  await page.waitForTimeout(3000);
  check("puzzle 1 is not solved as loaded", !(await card()).includes("Why it worked") && (await card()).includes("0 / 60 s in band"));
  await set("regulator", "-1.2");
  check("puzzle 1 solves with the regulator 1.2° toward S", await solved(40000));

  // Puzzle 2: solved by taking out the 6° beat offset.
  await page.selectOption("#puzzle-select", "out-of-beat");
  await page.waitForTimeout(2000);
  check("puzzle 2 is not solved as loaded", !(await card()).includes("Why it worked"));
  await set("beat", "-6");
  check("puzzle 2 solves with the beat adjustment at −6°", await solved(40000));

  // Puzzle 3: the wrong answer does not solve it, the right one does.
  await page.selectOption("#puzzle-select", "afternoon-slump");
  await page.click('.choice[data-choice="0"]');
  check("puzzle 3 wrong answer is not accepted", !(await card()).includes("Why it worked"));
  await page.click('.choice[data-choice="1"]');
  check("puzzle 3 right answer is accepted", (await card()).includes("Why it worked"));

  // Puzzle 4: removing weight without diagnosing must not solve it; the full procedure must.
  await page.selectOption("#puzzle-select", "position-error");
  await set("poise", "10");
  await page.waitForTimeout(9000);
  check("puzzle 4 is not solved by the amount slider alone in dial up", !(await card()).includes("Why it worked"));
  for (const pos of ["CU", "CR", "CD", "CL"]) { await page.selectOption("#position", pos); await page.waitForTimeout(3500); }
  check("puzzle 4 is not solved by touring the positions with the weight removed at the wrong place", !(await card()).includes("Why it worked"));
  await set("poise-angle", "180");
  for (const pos of ["CU", "CR", "CD", "CL"]) {
    await page.selectOption("#position", pos);
    const mark = `✓ ${await page.$eval(`#position option[value="${pos}"]`, (o) => o.textContent)}`;
    let ok = true;
    try { await page.waitForFunction((m) => document.querySelector("#puzzle")?.textContent?.includes(m) || document.querySelector("#puzzle")?.textContent?.includes("Why it worked"), mark, { timeout: 20000 }); } catch { ok = false; }
    check(`puzzle 4 passes ${pos} once the rate is in band there`, ok);
  }
  check("puzzle 4 solves after all four crown positions", await solved(5000));
  // Real-time speed must keep up. Before the solver stopped searching for a wheel that is already
  // resting on a face, one frame cost 24 ms and this ran at 7 frames a second.
  await page.selectOption("#puzzle-select", "");
  await page.evaluate(() => { const s = document.querySelector("#speed-slider"); s.value = s.max; s.dispatchEvent(new Event("input")); });
  await page.waitForTimeout(500);
  const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n / 3); }; requestAnimationFrame(f); }));
  check("real-time speed holds at least 30 frames a second", fps >= 30, `${fps.toFixed(1)} fps`);
  check("no page errors", errs.length === 0, errs.join("; "));
} catch (e) {
  check("script ran to the end", false, String(e));
} finally { await browser.close(); await server.close(); }
console.log(out.join("\n"));
process.exit(out.some((l) => l.startsWith("FAIL")) ? 1 : 0);
