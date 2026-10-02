// Premium round: «Habe ich schon», colour palette, «Mischen», heart pop.
// Imported by scripts/e2e.mjs; expects `run`, `base`, `out`, `draft` from there.
export async function premium({ run, base, out, draft }) {
  const chf = (t) => Number(t.replace(/[^0-9.]/g, ""));

  await run("r6-owned", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/look/herbst-in-bern");
    await page.waitForLoadState("networkidle"); // hydrated: the toggles respond
    const total = page.locator(".buy-total .ticker__value");
    const before = chf(await total.innerText());
    const row = page.locator(".buy-row", { hasText: "Straight Jeans, dunkel" });
    const price = chf(await row.locator(".buy-row__price").innerText());
    await row.getByRole("button", { name: /Habe ich schon/ }).tap();
    await page.getByText(/Noch zu kaufen/).first().waitFor();
    const after = chf(await total.innerText());
    if (Math.abs(before - price - after) > 0.01) throw new Error(`total ${before} - ${price} != ${after}`);
    if (!(await page.locator(".look-page__window .piece.is-muted").count())) throw new Error("owned piece not faded in the collage");
    // Kept for this look after a reload.
    await page.reload();
    await page.getByText(/Noch zu kaufen/).first().waitFor();
    if (Math.abs(chf(await total.innerText()) - after) > 0.01) throw new Error("owned state lost after reload");
    await page.getByRole("button", { name: "Zurücksetzen" }).tap();
    await page.getByText("Alles zusammen, günstigste Angebote").waitFor();
    await page.screenshot({ path: `${out}/r6-owned.png` });
  });

  await run("r6-palette", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/look/herbst-in-bern");
    const label = await page.locator(".look-page .palette").first().getAttribute("aria-label");
    if (!label || !label.startsWith("Farben:") || label.split(",").length < 3) throw new Error("palette missing: " + label);
    await page.goto(base + "/entdecken");
    if ((await page.locator(".look-tile .palette--sm").count()) < 4) throw new Error("tiles without palette");
  });

  await run("r6-shuffle", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.locator(".piece--edit").nth(4).waitFor();
    await page.waitForTimeout(500);
    const before = (await draft(page)).items.map((i) => i.productId).sort().join();
    await page.getByRole("button", { name: "Mischen" }).first().click();
    await page.waitForTimeout(500);
    const after = (await draft(page)).items.map((i) => i.productId).sort().join();
    if (before === after) throw new Error("shuffle changed nothing");
    await page.locator(".piece--edit.fx-swap, .piece--edit").first().waitFor();
    await page.getByRole("button", { name: "Rückgängig" }).click();
    await page.waitForTimeout(500);
    if ((await draft(page)).items.map((i) => i.productId).sort().join() !== before) throw new Error("undo did not restore the piece");
  });

  await run("r6-heart-pop", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/entdecken");
    const heart = page.locator(".look-tile__fav").first();
    if (await heart.locator(".fav__icon.is-pop").count()) throw new Error("pop plays without a tap");
    await heart.click();
    await heart.locator(".fav__icon.is-pop").waitFor();
  });
}
