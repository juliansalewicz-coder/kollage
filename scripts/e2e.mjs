// End-to-end smoke test against a running dev server (npm run dev).
// Usage: node scripts/e2e.mjs [outDir]   Needs Chrome or Edge installed.
import { chromium } from "playwright-core";
import fs from "node:fs";
import { paket1 } from "./e2e-paket1.mjs";
import { paket2 } from "./e2e-paket2.mjs";
import { paket3 } from "./e2e-paket3.mjs";
import { review2 } from "./e2e-review2.mjs";
import { audit } from "./e2e-audit.mjs";
import { cleanshop } from "./e2e-cleanshop.mjs";

const out = process.argv[2] || "acceptance-out/e2e";
const only = process.env.ONLY;
fs.mkdirSync(out, { recursive: true });
const base = process.env.BASE_URL || "http://localhost:3100";
let browser;
for (const channel of ["chrome", "msedge"]) {
  try {
    browser = await chromium.launch({ channel });
    break;
  } catch {}
}
let failed = 0;

// Runtime errors fail a scenario. `allow` lists patterns for errors a scenario provokes on purpose.
async function run(name, viewport, fn, { allow = [] } = {}) {
  if (only && !name.startsWith(only)) return;
  const mobile = viewport.width < 800;
  const ctx = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  try {
    await fn(page);
    // Playwright hides the text caret for screenshots by styling inputs; if that lands before
    // hydration, React reports a mismatch on `caret-color`. That is the test tool, not the app.
    const tool = /hydrated but some attributes[\s\S]*caret-color/;
    const unexpected = errors.filter((e) => !tool.test(e) && !allow.some((re) => re.test(e)));
    if (unexpected.length) throw new Error("runtime error: " + unexpected.join(" | "));
    console.log(name, "OK", errors.length ? "(" + errors.length + " known errors ignored)" : "");
  } catch (e) {
    failed++;
    console.log(name, "FAIL", e.message.split("\n")[0], errors.join(" | "));
    await page.screenshot({ path: `${out}/${name}-fail.png` });
  }
  await ctx.close();
}

const draft = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("kollage.v1.draft") || "null"));
const item = async (p, id) => (await draft(p)).items.find((i) => i.productId === id);

await run("builder-desktop", { width: 1440, height: 900 }, async (page) => {
  await page.goto(base + "/builder");
  for (const t of ["Oxford-Hemd", "Weite Bundfaltenhose", "Penny Loafer", "Leder-Shopper"]) {
    await page.locator(".product-card", { hasText: t }).first().click();
  }
  await page.waitForTimeout(400);
  const shirt = page.locator('.piece--edit[aria-label^="Oxford-Hemd"]');
  const b = await shirt.boundingBox();
  const before = await item(page, "hemd-hellblau");
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(b.x + b.width / 2 + i * 10, b.y + b.height / 2 + i * 5);
  await page.mouse.up();
  await page.waitForTimeout(500);
  const after = await item(page, "hemd-hellblau");
  if (!(after.x > before.x + 50)) throw new Error(`drag did not move: ${before.x} -> ${after.x}`);

  const hb = await page.locator(".handle--scale").boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(hb.x + hb.width / 2 + i * 8, hb.y + hb.height / 2 + i * 8);
  await page.mouse.up();
  await page.waitForTimeout(400);
  const scaled = await item(page, "hemd-hellblau");
  if (!(scaled.w > after.w)) throw new Error("scale handle failed");

  await shirt.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("r");
  await page.waitForTimeout(400);
  const k = await item(page, "hemd-hellblau");
  if (!(k.x < scaled.x && k.rotation === scaled.rotation + 5)) throw new Error("keyboard failed " + JSON.stringify(k));

  await page.getByRole("button", { name: "Rückgängig" }).click();
  await page.waitForTimeout(400);
  if ((await item(page, "hemd-hellblau")).rotation !== scaled.rotation) throw new Error("undo failed");
  await page.screenshot({ path: `${out}/builder-desktop.png` });

  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await page.getByText("Gib dem Look einen Titel").waitFor();
  if ((await page.evaluate(() => document.activeElement.id)) !== "look-title") throw new Error("focus not moved to title");
  await page.fill("#look-title", "Testlook Büro");
  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await page.locator("dialog[open]").waitFor();
  await page.getByRole("button", { name: "Anmelden und fortfahren" }).click();
  await page.getByText("Bitte gib einen Namen ein").waitFor();
  await page.fill("#auth-name", "Test Person");
  await page.fill("#auth-email", "falsch@");
  await page.getByRole("button", { name: "Anmelden und fortfahren" }).click();
  await page.getByText("Diese E-Mail-Adresse ist unvollständig").waitFor();
  await page.screenshot({ path: `${out}/auth-error.png` });
  await page.fill("#auth-email", "test@example.ch");
  await page.getByRole("button", { name: "Anmelden und fortfahren" }).click();
  await page.waitForURL(/\/look\//);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/look-published.png`, fullPage: true });
  const links = await page.locator(".buy-row a.btn").count();
  if (links !== 4) throw new Error("expected 4 shop links, got " + links);

  await page.goto(base + "/meine-looks");
  await page.getByText("Testlook Büro").first().waitFor();
  await page.getByRole("button", { name: "Zurückziehen" }).click();
  await page.getByRole("button", { name: "Duplizieren" }).first().click();
  await page.getByText("Testlook Büro (Kopie)").waitFor();
  await page.screenshot({ path: `${out}/meine-looks.png`, fullPage: true });

  await page.goto(base + "/entdecken?anlass=abend");
  await page.waitForTimeout(800);
  const n = await page.locator(".look-tile").count();
  if (n !== 1) throw new Error("filter abend expected 1 got " + n);

  await page.goto(base + "/look/sonntag-am-see");
  await page.getByRole("link", { name: "Look anpassen" }).click();
  await page.waitForURL(base + "/builder");
  await page.waitForTimeout(800);
  const d = await draft(page);
  if (!d.title.includes("Sonntag am See") || d.items.length !== 6) throw new Error("remix failed " + d.title);

  await page.goto(base + "/weiter/trench--rhone?look=herbst-in-bern");
  await page.getByText("subid=").waitFor();
});

await run("guest-draft-survives", { width: 1280, height: 800 }, async (page) => {
  await page.goto(base + "/builder");
  await page.locator(".product-card", { hasText: "Boxy T-Shirt" }).first().click();
  await page.locator(".product-card", { hasText: "Straight Jeans, hell" }).first().click();
  await page.waitForTimeout(400);
  await page.reload();
  await page.locator(".piece--edit").nth(1).waitFor({ timeout: 10000 }).catch(() => {});
  if ((await page.locator(".piece--edit").count()) !== 2) throw new Error("draft lost after reload");
  // Publishing asks for a name; cancelling that keeps the draft.
  await page.fill("#look-title", "Gast-Look");
  await page.getByRole("button", { name: "Anmelden & veröffentlichen" }).click();
  await page.locator("dialog[open]").waitFor();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  if (await page.locator("dialog[open]").count()) throw new Error("Escape did not close the dialog");
  if ((await page.locator(".piece--edit").count()) !== 2) throw new Error("draft lost after cancelled sign-in");
});

await run("builder-phone", { width: 390, height: 844 }, async (page) => {
  await page.goto(base + "/builder?look=apero-am-abend");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/builder-phone.png` });
  await page.locator(".piece--edit").nth(1).tap();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/builder-phone-selected.png` });
  await page.getByRole("button", { name: "Produkte", exact: true }).tap();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/builder-phone-sheet.png` });
  await page.locator(".product-card", { hasText: "Leder-Sneaker" }).first().tap();
  await page.getByRole("button", { name: "Fertig" }).tap();
  await page.waitForTimeout(400);
  if ((await page.locator(".piece--edit").count()) !== 6) throw new Error("drawer add failed");
  await page.screenshot({ path: `${out}/builder-phone-full.png`, fullPage: true });
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  if (sw > 390) throw new Error("sideways scroll " + sw);
});

await run("pages-phone", { width: 390, height: 844 }, async (page) => {
  for (const [p, f] of [
    ["/entdecken", "entdecken-phone"],
    ["/look/herbst-in-bern", "look-phone"],
    ["/meine-looks", "meine-phone"],
  ]) {
    await page.goto(base + p);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${f}.png`, fullPage: true });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > 390) throw new Error(p + " sideways " + sw);
  }
});

await run("pages-desktop", { width: 1440, height: 900 }, async (page) => {
  for (const [p, f] of [
    ["/entdecken", "entdecken-desktop"],
    ["/look/herbst-in-bern", "look-desktop"],
  ]) {
    await page.goto(base + p);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${f}.png`, fullPage: true });
  }
});

await paket1({ run, base, out, draft });
await paket2({ run, base, out, draft });
await paket3({ run, base, out, draft });
await review2({ run, base, out, draft });
await audit({ run, base, out, draft });
await cleanshop({ run, base, out, draft });

await browser.close();
process.exit(failed ? 1 : 0);
