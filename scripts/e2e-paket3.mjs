// Package 3 acceptance: a guest takes a look, replaces a too expensive piece, stays within budget,
// remembers two products and continues after a reload. Desktop and phone.
export async function paket3({ run, base, out, draft }) {
  const favs = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("kollage.v1.favorites") || '{"products":[],"looks":[]}'));

  await run("p3-desktop", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=herbst-in-bern");
    await page.locator(".piece--edit").nth(5).waitFor();
    // Budget below the look value (CHF 994.90).
    await page.fill("#side-budget", "950");
    await page.locator(".budget__lines dt", { hasText: "Über Budget" }).first().waitFor();
    const before = (await draft(page)) ?? { items: [] };
    await page.waitForTimeout(400);
    const d0 = await draft(page);
    const trench0 = d0.items.find((i) => i.productId === "trench");
    // Replace the trench from the selection toolbar.
    await page.locator('.piece--edit[aria-label^="Trenchcoat"]').click();
    await page.getByRole("toolbar", { name: "Ausgewähltes Teil" }).getByRole("button", { name: "Ersetzen" }).click();
    const dlg = page.locator("dialog.sheet[open]");
    await dlg.getByRole("heading", { name: "Teil ersetzen" }).waitFor();
    await page.screenshot({ path: `${out}/p3-replace-desktop.png` });
    await dlg.locator(".alt-list").first().locator(".alt-row").first().click();
    await page.waitForTimeout(400);
    const d1 = await draft(page);
    const replaced = d1.items.find((i) => i.uid === trench0.uid);
    if (!replaced || replaced.productId === "trench") throw new Error("not replaced");
    if (replaced.x !== trench0.x || replaced.y !== trench0.y || replaced.rotation !== trench0.rotation || replaced.z !== trench0.z)
      throw new Error("position/rotation/layer changed");
    if (d1.budget !== 950) throw new Error("budget lost: " + d1.budget);
    // Undo brings the trench back in one step.
    await page.getByRole("button", { name: "Rückgängig" }).click();
    await page.waitForTimeout(400);
    const d2 = await draft(page);
    if (d2.items.find((i) => i.uid === trench0.uid).productId !== "trench") throw new Error("undo did not restore");
    if (d2.budget !== 950) throw new Error("undo changed the budget");
    await page.getByRole("button", { name: "Wiederholen" }).click();
    await page.locator(".budget__lines dt", { hasText: "Restbudget" }).first().waitFor();
    // Saving suggestion: names a piece, opens the replace sheet for exactly that piece.
    await page.fill("#side-budget", "600");
    const tip = page.locator(".budget__cheaper").first();
    await tip.waitFor();
    const named = (await tip.locator("span").innerText()).split(":")[0].trim();
    const box = await page.evaluate(() => document.querySelector(".builder__side").scrollWidth - document.querySelector(".builder__side").clientWidth);
    if (box > 0) throw new Error("side panel overflows by " + box);
    await tip.click();
    await dlg.getByRole("heading", { name: "Teil ersetzen" }).waitFor();
    const cur = await dlg.locator(".replace-current__title").innerText();
    if (cur !== named) throw new Error(`suggestion named ${named}, sheet shows ${cur}`);
    await dlg.getByRole("button", { name: "Schliessen" }).click();
    await page.fill("#side-budget", "950");
    await page.locator(".budget__lines dt", { hasText: "Restbudget" }).first().waitFor();
    // Remember two products in the gallery.
    await page.locator(".product-cell", { hasText: "Boxy T-Shirt" }).first().locator(".fav").click();
    await page.locator(".product-cell", { hasText: "Leder-Sneaker" }).first().locator(".fav").click();
    // Filter chips: category + colour visible and removable.
    await page.getByRole("group", { name: "Kategorie" }).getByRole("button", { name: "Schuhe" }).click();
    await page.getByRole("button", { name: "Filter Schuhe entfernen" }).waitFor();
    await page.getByRole("button", { name: "Alle zurücksetzen" }).first().click();
    await page.getByRole("button", { name: /Gemerkt 2/ }).click();
    if ((await page.locator(".product-cell").count()) !== 2) throw new Error("favourites filter wrong");
    await page.screenshot({ path: `${out}/p3-desktop.png` });
    await page.reload();
    await page.locator(".piece--edit").nth(5).waitFor();
    const f = await favs(page);
    const d3 = await draft(page);
    if (f.products.length !== 2) throw new Error("favourites lost after reload");
    if (d3.budget !== 950 || !d3.items.some((i) => i.productId !== "trench" && i.uid === trench0.uid)) throw new Error("work lost after reload");
    await page.locator(".budget__lines dt", { hasText: "Restbudget" }).first().waitFor();
    void before;
  });

  await run("p3-phone", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/builder?look=herbst-in-bern");
    await page.locator(".piece--edit").nth(5).waitFor();
    // Select the trench, replace it from the selection toolbar.
    await page.locator('.piece--edit[aria-label^="Trenchcoat"]').tap();
    await page.screenshot({ path: `${out}/p3-phone-selected.png` });
    await page.getByRole("toolbar", { name: "Ausgewähltes Teil" }).getByRole("button", { name: "Ersetzen" }).tap();
    const dlg = page.locator("dialog.sheet[open]");
    await dlg.getByRole("heading", { name: "Teil ersetzen" }).waitFor();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/p3-phone-replace.png` });
    await dlg.locator(".alt-list").first().locator(".alt-row").first().tap();
    await page.waitForTimeout(300);
    // Budget from the summary bar.
    await page.locator(".lookbar").tap();
    await page.fill("#sheet-budget", "800");
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/p3-phone-budget.png` });
    await page.getByRole("button", { name: "Schliessen" }).tap();
    // Remember from the toolbar.
    await page.locator('.piece--edit[aria-label^="Rundhals"]').tap();
    await page.getByRole("toolbar", { name: "Ausgewähltes Teil" }).getByRole("button", { name: "Merken" }).tap();
    await page.locator('.piece--edit[aria-label^="Straight Jeans"]').tap();
    await page.getByRole("toolbar", { name: "Ausgewähltes Teil" }).getByRole("button", { name: "Merken" }).tap();
    await page.waitForTimeout(400);
    await page.reload();
    await page.locator(".piece--edit").nth(5).waitFor();
    const d = await draft(page);
    const f = await favs(page);
    if (d.budget !== 800) throw new Error("budget lost");
    if (d.items.some((i) => i.productId === "trench")) throw new Error("replacement lost");
    if (f.products.length !== 2) throw new Error("favourites lost: " + f.products.length);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > 390) throw new Error("sideways scroll " + sw);
    await page.screenshot({ path: `${out}/p3-phone.png`, fullPage: true });
  });

  await run("p3-gemerkt", { width: 1280, height: 800 }, async (page) => {
    await page.goto(base + "/look/sonntag-am-see");
    await page.getByRole("button", { name: "Merken" }).first().click();
    await page.locator('.piece--button[data-product="t-streifen"]').click();
    await page.locator("dialog.sheet[open]").getByRole("button", { name: "Merken" }).click();
    await page.keyboard.press("Escape");
    await page.goto(base + "/gemerkt");
    await page.getByRole("heading", { name: "Streifenshirt" }).waitFor();
    await page.locator(".look-tile", { hasText: "Sonntag am See" }).waitFor();
    await page.getByRole("link", { name: "In den Look" }).first().click();
    await page.waitForURL(base + "/builder");
    await page.locator('.piece--edit[aria-label^="Streifenshirt"]').waitFor();
  });
}
