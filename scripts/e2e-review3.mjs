// Review of 2 Oct 2026: breakpoint changes, one publish rule, wardrobe, favourites, share abort,
// failing images, export size, account menu, compact Entdecken. Imported by scripts/e2e.mjs.
import fs from "node:fs";

const LOOK = (over = {}) => ({
  id: "ein-teil-test",
  title: "Unbenannter Look",
  note: "",
  occasion: "alltag",
  backdrop: "papier",
  items: [{ uid: "u1", productId: "t-weiss", x: 500, y: 600, w: 300, rotation: 0, z: 1 }],
  status: "privat",
  authorName: "Gast",
  ownerEmail: null,
  createdAt: "2026-10-02T10:00:00.000Z",
  updatedAt: "2026-10-02T10:00:00.000Z",
  basedOn: null,
  isExample: false,
  ...over,
});

async function seed(page, base, values) {
  await page.goto(base + "/hinweise");
  await page.evaluate((v) => {
    for (const [k, val] of Object.entries(v)) localStorage.setItem(k, JSON.stringify(val));
  }, values);
}

const usable = (page) =>
  page.evaluate(() => !document.querySelector(".builder__stage")?.closest("[inert]") && !document.querySelector(".nav")?.closest("[inert]"));

export async function review3({ run, base, out, draft }) {
  await run("r8-gallery-widen-closed", { width: 768, height: 1024 }, async (page) => {
    await page.goto(base + "/builder?look=herbst-in-bern");
    await page.locator(".piece--edit").nth(5).waitFor();
    await page.waitForLoadState("networkidle");
    if (await page.locator(".product-card").count()) throw new Error("closed tablet sheet already builds the grid");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator(".product-card").first().waitFor({ timeout: 5000 });
  });

  await run("r8-gallery-widen-open", { width: 768, height: 1024 }, async (page) => {
    await page.goto(base + "/builder?look=herbst-in-bern");
    await page.locator(".piece--edit").nth(5).waitFor();
    await page.waitForLoadState("networkidle");
    await page.locator(".add-sheet-btn").click();
    await page.locator(".product-card").first().waitFor();
    if (await usable(page)) throw new Error("open sheet is not modal on the tablet");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    if (!(await usable(page))) throw new Error("canvas or navigation still inert after widening");
    await page.locator('.piece--edit[aria-label^="Trenchcoat"]').click();
    await page.locator(".side-back").waitFor();
    // And back: narrow again, the sheet is closed and the canvas usable.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    if (!(await usable(page))) throw new Error("inert after narrowing again");
  });

  await run("r8-publish-card-incomplete", { width: 1440, height: 900 }, async (page) => {
    await seed(page, base, { "kollage.v1.looks": [LOOK()] });
    await page.goto(base + "/meine-looks");
    await page.getByRole("button", { name: "Veröffentlichen" }).click();
    await page.waitForURL(/\/builder/);
    await page.getByText("Gib dem Look einen Titel").first().waitFor();
    await page.getByText("mindestens zwei verschiedene Teile").first().waitFor();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("kollage.v1.looks"))[0].status);
    if (stored !== "privat") throw new Error("incomplete look got published: " + stored);
  });

  await run("r8-publish-card-guest", { width: 1440, height: 900 }, async (page) => {
    const two = LOOK({ title: "Apéro am See", items: [...LOOK().items, { uid: "u2", productId: "jeans-hell", x: 500, y: 900, w: 300, rotation: 0, z: 2 }] });
    await seed(page, base, { "kollage.v1.looks": [two] });
    await page.goto(base + "/meine-looks");
    await page.getByRole("button", { name: "Veröffentlichen" }).click();
    // Same as the builder: a guest is asked for a name first.
    await page.locator("#auth-name").waitFor();
    await page.fill("#auth-name", "Mara");
    await page.fill("#auth-email", "mara@beispiel.ch");
    await page.getByRole("button", { name: "Anmelden und fortfahren" }).click();
    await page.locator(".badge--live").waitFor();
    const look = await page.evaluate(() => JSON.parse(localStorage.getItem("kollage.v1.looks"))[0]);
    if (look.status !== "veroeffentlicht" || look.authorName !== "Mara") throw new Error(`published as ${look.status} by ${look.authorName}`);
    const events = await page.evaluate(() => (window.dataLayer || []).map((e) => e.event));
    if (!events.includes("look_published")) throw new Error("no look_published event");
  });

  await run("r8-fav-delete", { width: 1440, height: 900 }, async (page) => {
    await seed(page, base, { "kollage.v1.looks": [LOOK({ title: "Zum Löschen" })], "kollage.v1.favorites": { products: [], looks: ["ein-teil-test"] } });
    await page.goto(base + "/meine-looks");
    await page.locator(".nav__badge").waitFor();
    await page.getByRole("button", { name: "«Zum Löschen» löschen" }).click();
    await page.getByRole("button", { name: "Löschen", exact: true }).click();
    await page.waitForTimeout(300);
    if (await page.locator(".nav__badge").count()) throw new Error("header still counts the deleted look");
    // A stale id from before the fix is not counted either.
    await seed(page, base, { "kollage.v1.favorites": { products: ["trench"], looks: ["gibt-es-nicht"] } });
    await page.goto(base + "/gemerkt");
    const badge = await page.locator(".nav__badge").innerText();
    if (badge.trim() !== "1") throw new Error("badge counts missing entries: " + badge);
  });

  await run("r8-share-abort", { width: 390, height: 844 }, async (page) => {
    await page.addInitScript(() => {
      navigator.share = () => Promise.reject(new DOMException("closed", "AbortError"));
    });
    let prompted = false;
    page.on("dialog", (d) => {
      prompted = true;
      d.dismiss();
    });
    await page.goto(base + "/look/herbst-in-bern");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Teilen/ }).first().tap();
    await page.waitForTimeout(400);
    if (prompted) throw new Error("cancelled share opened a copy prompt");
    const events = await page.evaluate(() => (window.dataLayer || []).map((e) => e.event));
    if (!events.includes("share_started")) throw new Error("intent not tracked");
    if (events.includes("look_shared")) throw new Error("cancelled share counted as shared");
  });

  await run("r8-share-copy", { width: 1440, height: 900 }, async (page) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
    await page.goto(base + "/look/herbst-in-bern");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Teilen/ }).first().click();
    await page.getByText("Link kopiert").waitFor();
    const shared = await page.evaluate(() => (window.dataLayer || []).filter((e) => e.event === "look_shared").length);
    if (shared !== 1) throw new Error("expected one look_shared, got " + shared);
  });

  await run(
    "r8-image-late-error",
    { width: 1440, height: 900 },
    async (page) => {
      await page.route(/\/products\/(sm\/)?trench[^/]*$/, async (route) => {
        await new Promise((r) => setTimeout(r, 2500));
        await route.fulfill({ status: 404, body: "" });
      });
      await page.goto(base + "/look/herbst-in-bern");
      await page.locator(".look-page__window .img-fallback").first().waitFor({ timeout: 8000 });
      const pending = await page.locator(".look-page__window img.is-pending").count();
      if (pending) throw new Error(`${pending} pictures stuck invisible`);
    },
    { allow: [/404/, /Failed to load resource/] },
  );

  await run(
    "r8-image-early-error",
    { width: 390, height: 844 },
    async (page) => {
      // Fails before React is ready: the error event is gone, the ref sees a broken picture instead.
      await page.route(/\/products\/(sm\/)?trench[^/]*$/, (route) => route.fulfill({ status: 404, body: "" }));
      await page.goto(base + "/look/herbst-in-bern");
      await page.waitForLoadState("networkidle");
      await page.locator(".look-page__window .img-fallback").first().waitFor({ timeout: 5000 });
      const broken = await page.evaluate(() => [...document.querySelectorAll(".look-page__window img")].filter((i) => i.complete && i.naturalWidth === 0).length);
      if (broken) throw new Error(`${broken} broken pictures left in the collage`);
    },
    { allow: [/404/, /Failed to load resource/] },
  );

  await run("r8-builder-bad-link", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder?d=kaputt");
    await page.locator(".toast", { hasText: "keinen gültigen Look" }).waitFor();
  });

  await run("r8-export-size", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=herbst-in-bern");
    await page.locator(".piece--edit").nth(5).waitFor();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Als Bild" }).click()]);
    const file = `${out}/r8-export.png`;
    await download.saveAs(file);
    const png = fs.readFileSync(file);
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(20);
    if (w !== 1080 || h !== 1350) throw new Error(`export is ${w} × ${h}, promised 1080 × 1350 (4:5)`);
  });

  await run("r8-owned-into-builder", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/look/herbst-in-bern");
    await page.waitForLoadState("networkidle");
    const row = page.locator(".buy-row", { hasText: "Trenchcoat" });
    await row.getByRole("button", { name: /Habe ich schon/ }).click();
    await page.getByText(/Noch zu kaufen/).first().waitFor();
    const toBuy = await page.locator(".buy-total .ticker__value").innerText();
    await page.goto(base + "/builder?look=herbst-in-bern");
    await page.locator(".piece--edit").nth(5).waitFor();
    await page.getByText(/Noch zu kaufen \(1 im Schrank\)/).waitFor();
    const builderValue = await page.locator(".budget__lines .ticker__value").first().innerText();
    if (builderValue.replace(/\s/g, "") !== toBuy.replace(/\s/g, "")) throw new Error(`look page ${toBuy}, builder ${builderValue}`);
    await page.locator('.piece--edit[aria-label^="Trenchcoat"]').click();
    const own = page.locator(".builder__side .own-toggle");
    if ((await own.getAttribute("aria-pressed")) !== "true") throw new Error("inspector does not show the owned piece");
    await page.screenshot({ path: `${out}/r8-owned-builder.png` });
  });

  await run("r8-sheet-save", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.locator(".piece--edit").nth(3).waitFor();
    await page.waitForLoadState("networkidle");
    await page.locator(".mbar__look").tap();
    await page.fill("#sheet-look-title", "Sonntag mit Mara");
    await page.getByRole("button", { name: /Speichern & schliessen/ }).tap();
    await page.locator(".toast", { hasText: "Gespeichert in «Meine Looks»" }).waitFor();
    if (await page.locator("#sheet-look-title").isVisible()) throw new Error("sheet stayed open");
    const looks = await page.evaluate(() => JSON.parse(localStorage.getItem("kollage.v1.looks") || "[]"));
    if (!looks.some((l) => l.title === "Sonntag mit Mara")) throw new Error("sheet save did not store the look");
  });

  await run("r8-variant-phone", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.locator(".piece--edit").nth(3).waitFor();
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => localStorage.getItem("kollage.v1.draft"));
    const before = (await draft(page)).items.map((i) => i.productId).sort().join();
    // The jeans have several variants of the same kind in the catalog.
    await page.locator('.piece--edit[aria-label*="Jeans"]').first().tap();
    await page.locator(".piece-tools").getByRole("button", { name: /Variante testen/ }).tap();
    await page.waitForTimeout(500);
    const after = (await draft(page)).items.map((i) => i.productId).sort().join();
    if (before === after) throw new Error("Variante changed nothing");
  });

  await run("r8-account-menu", { width: 1440, height: 900 }, async (page) => {
    await seed(page, base, { "kollage.v1.session": { name: "Mara", email: "mara@beispiel.ch" } });
    await page.goto(base + "/entdecken");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Konto: Mara" }).click();
    const still = await page.evaluate(() => localStorage.getItem("kollage.v1.session"));
    if (!still || !still.includes("Mara")) throw new Error("tap on the icon signed out");
    await page.locator("#account-menu").getByRole("button", { name: "Abmelden" }).click();
    await page.getByRole("button", { name: "Anmelden" }).waitFor();
    // The general sign-in text no longer claims saving needs an account.
    await page.getByRole("button", { name: "Anmelden" }).click();
    const lead = await page.locator("#auth-reason").innerText();
    if (!/ohne Anmeldung/.test(lead)) throw new Error("sign-in text: " + lead);
  });

  await run("r8-discover-phone", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/entdecken");
    await page.waitForLoadState("networkidle");
    const top = (await page.locator(".look-tile").first().boundingBox()).y;
    if (top > 420) throw new Error(`first look starts ${Math.round(top)} px down`);
    await page.getByRole("button", { name: /^Filter/ }).tap();
    await page.locator("#look-sort").waitFor({ state: "visible" });
    await page.screenshot({ path: `${out}/r8-discover-phone.png` });
  });
}
