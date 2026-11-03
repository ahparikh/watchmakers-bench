// Does puzzle 1 report "solved" once the regulator is set right and the hold elapses?
import { chromium } from "playwright";
import { createServer } from "vite";
const server = await createServer({ root: process.cwd(), server: { port: 5198, strictPort: true }, logLevel: "silent" });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
await page.goto("http://localhost:5198/");
await page.waitForSelector("#puzzle h2");
await page.evaluate(() => { const el = document.querySelector("#regulator"); el.value = "-1.2"; el.dispatchEvent(new Event("input")); });
const before = await page.textContent("#puzzle");
await page.waitForFunction(() => document.querySelector("#puzzle")?.textContent?.includes("solved"), null, { timeout: 40000 });
const after = await page.textContent("#puzzle");
console.log("puzzle 1 — before:", before?.includes("in band"), "| after:", after?.includes("Why it worked"));
// Puzzle 4: diagnose crown up, remove 10 µg·cm at 0°, hold.
await page.selectOption("#puzzle-select", "position-error");
await page.selectOption("#position", "CU");
await page.evaluate(() => { for (const [id, v] of [["poise", "10"], ["poise-angle", "0"]]) { const el = document.querySelector("#" + id); el.value = v; el.dispatchEvent(new Event("input")); } });
await page.waitForFunction(() => document.querySelector("#puzzle")?.textContent?.includes("Why it worked"), null, { timeout: 40000 });
console.log("puzzle 4 — solved:", true);
// Puzzle 3: pick the right answer.
await page.selectOption("#puzzle-select", "afternoon-slump");
await page.click('.choice[data-choice="1"]');
console.log("puzzle 3 — solved:", (await page.textContent("#puzzle"))?.includes("Why it worked"));
await browser.close(); await server.close();
