#!/usr/bin/env node
// Website acceptance helper: screenshots at phone/tablet/desktop width, horizontal
// overflow, keyboard focus walk, reduced-motion check, console + network errors.
// It never submits forms. It is evidence for a human-style review, not a verdict:
// you still have to LOOK at every screenshot and test flows by hand.
//
// Usage: node acceptance.mjs <url> [outDir] [--tabs=40] [--dark]
// Needs Google Chrome or Microsoft Edge installed (uses playwright-core, no bundled browser).

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));
if (!url) {
  console.error('Usage: node acceptance.mjs <url> [outDir] [--tabs=40] [--dark]');
  process.exit(2);
}
const outDir = path.resolve(args.filter(a => !a.startsWith('--'))[1] || 'acceptance-out');
const maxTabs = Number((args.find(a => a.startsWith('--tabs=')) || '--tabs=40').split('=')[1]);
const colorScheme = args.includes('--dark') ? 'dark' : 'light';
fs.mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'tablet', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
];

async function launch() {
  for (const channel of ['chrome', 'msedge']) {
    try { return await chromium.launch({ channel }); } catch { /* try next */ }
  }
  throw new Error('Neither Chrome nor Edge found. Install Chrome or set up the chrome-devtools MCP instead.');
}

function collectErrors(page, bucket) {
  page.on('console', m => { if (m.type() === 'error') bucket.console.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => bucket.console.push('pageerror: ' + String(e).slice(0, 300)));
  page.on('requestfailed', r => bucket.network.push(`${r.failure()?.errorText} ${r.url()}`.slice(0, 300)));
  page.on('response', r => { if (r.status() >= 400) bucket.network.push(`${r.status()} ${r.url()}`.slice(0, 300)); });
}

// Elements sticking out past the right edge cause sideways scrolling on phones.
const overflowProbe = () => {
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) {
        const ov = getComputedStyle(p).overflowX;
        if (ov === 'hidden' || ov === 'auto' || ov === 'scroll' || ov === 'clip') { clipped = true; break; }
        p = p.parentElement;
      }
      if (!clipped) offenders.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : ''} right=${Math.round(r.right)}`);
    }
  }
  return {
    pageScrollsSideways: document.documentElement.scrollWidth > vw + 1,
    scrollWidth: document.documentElement.scrollWidth,
    viewport: vw,
    offenders: offenders.slice(0, 15),
  };
};

// Describe the focused element and whether its focus is visible / obscured.
const focusProbe = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const label = (el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('title') || '').trim().slice(0, 40);
  const indicator = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
  let obscured = 'unknown';
  if (r.width && r.height) {
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + 2], [r.right - 2, r.bottom - 2]];
    const hits = pts.map(([x, y]) => {
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;
      const h = document.elementFromPoint(x, y);
      return h && (h === el || el.contains(h) || h.contains(el));
    });
    obscured = hits.every(h => !h) ? 'fully-hidden' : hits.some(h => !h) ? 'partly-hidden' : 'visible';
  }
  return {
    tag: el.tagName.toLowerCase(),
    label,
    indicatorStyle: indicator ? 'outline/box-shadow present' : 'NO outline or box-shadow (check visually: may use border/background)',
    obscured,
  };
};

const motionProbe = () => document.getAnimations()
  .filter(a => a.playState === 'running')
  .map(a => {
    const t = a.effect?.target;
    const timing = a.effect?.getTiming?.() || {};
    return `${a.constructor.name} ${a.animationName || a.transitionProperty || ''} on ${t ? t.tagName.toLowerCase() + (t.className && typeof t.className === 'string' ? '.' + t.className.split(' ')[0] : '') : '?'} iterations=${timing.iterations}`;
  })
  .slice(0, 20);

const report = { url, date: new Date().toISOString(), colorScheme, viewports: {}, keyboard: [], reducedMotion: {}, errors: { console: [], network: [] } };
const browser = await launch();
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, colorScheme });
    const page = await ctx.newPage();
    collectErrors(page, report.errors);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(800);
    const fold = path.join(outDir, `${vp.name}-viewport.png`);
    const full = path.join(outDir, `${vp.name}-fullpage.png`);
    await page.screenshot({ path: fold });
    await page.screenshot({ path: full, fullPage: true });
    report.viewports[vp.name] = { size: `${vp.width}x${vp.height}`, screenshots: [fold, full], overflow: await page.evaluate(overflowProbe) };
    await ctx.close();
  }

  // Keyboard walk on desktop: Tab through the page and record each stop.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(focusProbe);
      if (!f) continue;
      report.keyboard.push({ stop: i + 1, ...f });
      if (i < 6) await page.screenshot({ path: path.join(outDir, `focus-${String(i + 1).padStart(2, '0')}.png`) });
    }
    await ctx.close();
  }

  // Reduced motion: compare running animations with and without the preference.
  for (const pref of ['no-preference', 'reduce']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: pref, colorScheme });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(800);
    report.reducedMotion[pref] = await page.evaluate(motionProbe);
    if (pref === 'reduce') await page.screenshot({ path: path.join(outDir, 'reduced-motion.png') });
    await ctx.close();
  }
} finally {
  await browser.close();
}

report.errors.console = [...new Set(report.errors.console)];
report.errors.network = [...new Set(report.errors.network)];
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

// Short human-readable summary.
const lines = [`Acceptance run for ${url} -> ${outDir}`];
for (const [name, v] of Object.entries(report.viewports)) {
  lines.push(`${name.padEnd(8)} ${v.size}: ${v.overflow.pageScrollsSideways ? 'SIDEWAYS SCROLL ' + v.overflow.scrollWidth + 'px' : 'no page overflow'}${v.overflow.offenders.length ? ' | sticking out: ' + v.overflow.offenders.slice(0, 5).join(', ') : ''}`);
}
const noIndicator = report.keyboard.filter(k => k.indicatorStyle.startsWith('NO'));
const hidden = report.keyboard.filter(k => k.obscured !== 'visible');
lines.push(`keyboard: ${report.keyboard.length} focus stops; ${noIndicator.length} without outline/box-shadow; ${hidden.length} partly/fully hidden`);
lines.push(`reduced motion: ${report.reducedMotion['no-preference'].length} running animations normally, ${report.reducedMotion.reduce.length} with reduce${report.reducedMotion.reduce.length ? ' -> check: ' + report.reducedMotion.reduce.slice(0, 3).join(' | ') : ''}`);
lines.push(`console errors: ${report.errors.console.length}; failed/4xx/5xx requests: ${report.errors.network.length}`);
lines.push('NEXT: open and look at every screenshot; test navigation, main CTA and forms (incl. error states) by hand. This script does not prove good design or full accessibility.');
console.log(lines.join('\n'));
