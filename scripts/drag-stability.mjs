// Regression check: dragging any footer slider must never move that slider's own box.
// (A control whose width depends on the watch's state shifts its neighbours under a held
// pointer, and the drag then oscillates. Found by Akash at the 40 h stop threshold.)
import { chromium } from "playwright";
import { createServer } from "vite";
const server = await createServer({ root: process.cwd(), server: { port: 5192, strictPort: false }, logLevel: "silent" });
await server.listen();
const browser = await chromium.launch();
let failed = 0;
for (const width of [1280, 1000, 760, 390]) {
  for (const [puzzle, id] of [["out-of-beat", "wind"], ["runs-fast", "wind"], ["runs-fast", "regulator"], ["position-error", "poise"], ["", "wind"], ["", "screws"]]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.goto(server.resolvedUrls.local[0]); await page.waitForSelector("#puzzle h2");
    await page.selectOption("#puzzle-select", puzzle);
    await page.evaluate((id) => document.querySelector("#" + id).scrollIntoView({ block: "center" }), id);
    await page.evaluate((id) => {
      window.__boxes = new Set(); window.__vals = [];
      const f = () => { const e = document.querySelector("#" + id), r = e.getBoundingClientRect(); window.__boxes.add([Math.round(r.left), Math.round(r.width), Math.round(r.top + scrollY)].join(",")); window.__vals.push(Number(e.value)); requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }, id);
    const box = await (await page.$("#" + id)).boundingBox();
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + 3, y); await page.mouse.down();
    await page.waitForTimeout(60);
    await page.evaluate(() => { window.__vals = []; }); // count from the press, not from the resting value
    for (let i = 0; i <= 60; i++) { await page.mouse.move(box.x + 3 + (box.width - 6) * (i / 60), y); await page.waitForTimeout(12); }
    const { boxes, vals } = await page.evaluate(() => ({ boxes: [...window.__boxes], vals: window.__vals }));
    await page.mouse.up(); await page.close();
    const backwards = vals.slice(1).filter((v, i) => v < vals[i] - 1e-9).length; // a left-to-right drag must never step back
    const ok = boxes.length === 1 && backwards === 0;
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"} ${String(width).padStart(4)}px ${(puzzle || "free play").padEnd(14)} #${id.padEnd(9)} boxes ${boxes.length} backward steps ${backwards}`);
  }
}
await browser.close(); await server.close();
console.log(failed ? `${failed} failure(s)` : "every slider holds still while dragged");
process.exit(failed ? 1 : 0);
