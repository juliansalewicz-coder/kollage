// Lab measurement on a throttled phone, for before/after comparisons (not field data).
// Usage: node scripts/perf.mjs [baseUrl] [outFile]
// Needs a production server, e.g. NEXT_DIST_DIR=.next-build npx next build && NEXT_DIST_DIR=.next-build npx next start -p 3200
// Conditions: 390x844, DPR 3, empty cache, 1.6 Mbit/s down, 750 kbit/s up, 150 ms latency, CPU 4x slower.
import { chromium } from "playwright-core";
import fs from "node:fs";

const base = process.argv[2] || "http://localhost:3200";
const outFile = process.argv[3];
const pages = [
  ["Startseite", "/"],
  ["Builder mit Apéro-Look", "/builder?look=apero-am-abend"],
  ["Look-Seite", "/look/herbst-in-bern"],
];

let browser;
for (const channel of ["chrome", "msedge"]) {
  try {
    browser = await chromium.launch({ channel });
    break;
  } catch {}
}

const results = [];
for (const [name, path] of pages) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    window.__perf = { lcp: 0, cls: 0, fcp: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__perf.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__perf.fcp = e.startTime;
    }).observe({ type: "paint", buffered: true });
  });
  const t0 = Date.now();
  await page.goto(base + path, { waitUntil: "commit" });
  // Outfit pictures visible on the first screen and finished 3 s after navigation start. Timed in the page
  // (performance.now() starts at navigation), not from the commit, which can itself arrive late on a slow line.
  await page.waitForFunction(() => performance.now() >= 3000, null, { polling: 50, timeout: 60000 });
  const at3 = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll(".window img, .featured img")].filter((i) => {
      const r = i.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0 && r.width > 0;
    });
    return { visible: imgs.length, complete: imgs.filter((i) => i.complete && i.naturalWidth > 0).length, at: performance.now() };
  });
  await page.waitForTimeout(9000);
  const data = await page.evaluate(() => {
    const res = performance.getEntriesByType("resource");
    const sum = (f) => Math.round(res.filter(f).reduce((s, r) => s + (r.transferSize || 0), 0) / 1024);
    return {
      ...window.__perf,
      totalKB: sum(() => true),
      imagesKB: sum((r) => r.initiatorType === "img" || /\.(webp|png|jpe?g|avif)(\?|$)/.test(r.name)),
      jsKB: sum((r) => /\.js(\?|$)/.test(r.name)),
      imageRequests: res.filter((r) => /\.(webp|png|jpe?g|avif)(\?|$)/.test(r.name)).length,
    };
  });
  results.push({
    name,
    path,
    fcp: +(data.fcp / 1000).toFixed(2),
    lcp: +(data.lcp / 1000).toFixed(2),
    cls: +data.cls.toFixed(3),
    totalKB: data.totalKB,
    imagesKB: data.imagesKB,
    jsKB: data.jsKB,
    imageRequests: data.imageRequests,
    outfitImagesAt3s: `${at3.complete}/${at3.visible}`,
    // When the snapshot was really taken (s after navigation start); above 3.0 means the commit came later.
    snapshotAt: +(at3.at / 1000).toFixed(2),
    wallSeconds: Math.round((Date.now() - t0) / 1000),
  });
  await ctx.close();
}
await browser.close();
console.table(results.map(({ path, wallSeconds, ...r }) => r));
if (outFile) fs.writeFileSync(outFile, JSON.stringify({ base, date: new Date().toISOString(), results }, null, 2));
