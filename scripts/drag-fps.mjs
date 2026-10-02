// Frame timing while dragging a piece, on a 4x slower CPU (lab check, not field data).
// Usage: node scripts/drag-fps.mjs [baseUrl]   (production build recommended)
import { chromium } from "playwright-core";

const base = process.argv[2] || "http://localhost:3200";
let browser;
for (const channel of ["chrome", "msedge"]) {
  try {
    browser = await chromium.launch({ channel });
    break;
  } catch {}
}
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(base + "/builder?look=sonntag-am-see");
await page.locator(".piece--edit").nth(4).waitFor();
await page.waitForTimeout(1500);
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

const el = page.locator('.piece--edit[aria-label^="Canvas-Tote"]');
const b = await el.boundingBox();
const c = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
await page.mouse.move(c.x, c.y);
await page.mouse.down();
await page.evaluate(() => {
  window.__frames = [];
  const tick = (t) => {
    window.__frames.push(t);
    if (window.__frames.length < 5000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
const t0 = await page.evaluate(() => performance.now());
for (let i = 1; i <= 90; i++) {
  await page.mouse.move(c.x - 2 * i, c.y + Math.sin(i / 6) * 40);
}
const t1 = await page.evaluate(() => performance.now());
await page.mouse.up();
const frames = (await page.evaluate(() => window.__frames)).filter((t) => t >= t0 && t <= t1);
const deltas = frames.slice(1).map((t, i) => t - frames[i]);
const avg = deltas.reduce((s, d) => s + d, 0) / Math.max(1, deltas.length);
console.log(
  JSON.stringify({
    base,
    moves: 90,
    // Time the page needed to handle 90 pointer moves: lower means less work per move.
    dragMs: Math.round(t1 - t0),
    msPerMove: +((t1 - t0) / 90).toFixed(1),
    frames: frames.length,
    fps: +(1000 / avg).toFixed(0),
    framesOver50ms: deltas.filter((d) => d > 50).length,
    worstFrameMs: Math.round(Math.max(0, ...deltas)),
  }),
);
await browser.close();
