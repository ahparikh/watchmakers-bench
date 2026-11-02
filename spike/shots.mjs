// Screenshot five phases of one beat (plus the exit-side beat) via Playwright.
import { chromium } from "playwright";
import { createServer } from "vite";

const server = await createServer({ root: process.cwd(), server: { port: 5199, strictPort: true }, logLevel: "silent" });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
const shots = [];
for (const beat of [0, 1]) {
  for (const phase of ["lock", "unlock", "impulse", "drop"]) {
    for (const frac of phase === "impulse" ? [0.1, 0.5, 0.9] : [0.5]) {
      const url = `http://localhost:5199/?phase=${phase}&beat=${beat}&frac=${frac}`;
      await page.goto(url);
      await page.waitForSelector("svg[data-phase]");
      const got = await page.getAttribute("svg", "data-phase");
      const file = `shots/beat${beat}-${phase}-${frac}.png`;
      await page.screenshot({ path: file });
      shots.push({ file, requested: phase, rendered: got });
    }
  }
}
console.table(shots);
await browser.close();
await server.close();
