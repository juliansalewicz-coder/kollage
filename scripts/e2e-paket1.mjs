// Package 1 regressions: blocked storage, draft protection, product details from the collage.
// Imported by scripts/e2e.mjs; expects `run`, `base`, `out`, `draft` from there.
export async function paket1({ run, base, out, draft }) {
  await run("p1-blocked-storage", { width: 1280, height: 800 }, async (page) => {
    await page.addInitScript(() => {
      const deny = () => {
        throw new DOMException("blocked", "SecurityError");
      };
      Storage.prototype.setItem = deny;
      Storage.prototype.getItem = deny;
      Storage.prototype.removeItem = deny;
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + "/builder");
    await page.getByText("Browserspeicher blockiert").first().waitFor();
    await page.locator(".product-card", { hasText: "Boxy T-Shirt" }).first().click();
    await page.locator(".product-card", { hasText: "Straight Jeans, hell" }).first().click();
    // Saving needs no sign-in; the toast says honestly that it only lasts for this session.
    await page.getByRole("button", { name: "Speichern", exact: true }).click();
    await page.getByText("nur für diese Sitzung").first().waitFor();
    await page.screenshot({ path: `${out}/p1-blocked-storage.png` });
    if (errors.length) throw new Error("page error: " + errors.join(" | "));
  });

  await run("p1-draft-guard", { width: 1280, height: 800 }, async (page) => {
    await page.goto(base + "/builder");
    await page.locator(".product-card", { hasText: "Wollmantel" }).first().click();
    await page.fill("#look-title", "Mein Mantel-Look");
    await page.waitForTimeout(400);
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.getByRole("heading", { name: "Ungesicherten Entwurf behalten?" }).waitFor();
    await page.screenshot({ path: `${out}/p1-draft-guard.png` });
    // Keep working: nothing changes.
    await page.getByRole("button", { name: "Am Entwurf weiterarbeiten" }).first().click();
    if ((await draft(page)).title !== "Mein Mantel-Look") throw new Error("keep did not keep the draft");
    // Archive and open.
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.getByRole("button", { name: "Entwurf sichern und öffnen" }).click();
    await page.waitForTimeout(400);
    await page.reload();
    await page.waitForTimeout(600);
    const d = await draft(page);
    if (!d.title.includes("Sonntag am See")) throw new Error("template not opened: " + d.title);
    await page.goto(base + "/meine-looks");
    await page.getByRole("heading", { name: "Gesicherte Entwürfe" }).waitFor();
    await page.getByText("Mein Mantel-Look").waitFor();
    await page.getByRole("link", { name: "Entwurf öffnen" }).first().click();
    await page.getByRole("heading", { name: "Ungesicherten Entwurf behalten?" }).waitFor();
    await page.getByRole("button", { name: "Entwurf verwerfen und öffnen" }).click();
    await page.waitForTimeout(500);
    const back = await draft(page);
    if (back.title !== "Mein Mantel-Look" || back.items.length !== 1) throw new Error("archived draft not restored");
  });

  await run("p1-piece-details", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/look/herbst-in-bern");
    const piece = page.locator('.piece--button[data-product="trench"]');
    await piece.click();
    const dlg = page.locator("dialog.sheet[open]");
    await dlg.getByRole("heading", { name: "Trenchcoat" }).waitFor();
    await dlg.getByText("CHF 289.00").first().waitFor();
    await dlg.getByRole("link", { name: /Zum Shop/ }).first().waitFor();
    await page.screenshot({ path: `${out}/p1-piece-details.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-product"));
    if (focused !== "trench") throw new Error("focus not returned to piece: " + focused);
    // Keyboard: next piece via Tab, open with Enter.
    await page.keyboard.press("Tab");
    const next = await page.evaluate(() => document.activeElement?.getAttribute("data-product"));
    await page.keyboard.press("Enter");
    await dlg.waitFor();
    const title = await dlg.locator(".sheet__title").textContent();
    if (!next || !title) throw new Error("keyboard open failed");
  });

  await run("p1-piece-details-phone", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/look/apero-am-abend");
    await page.locator('.piece--button[data-product="rock-plisse"]').tap();
    const dlg = page.locator("dialog.sheet[open]");
    await dlg.getByRole("heading", { name: "Midirock mit Falten" }).waitFor();
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${out}/p1-piece-details-phone.png` });
  });
}
