// Clean Shop round: compact phone header, look page as an entry from a video, guest saving, funnel events.
// Imported by scripts/e2e.mjs; expects `run`, `base`, `out`, `draft` from there.
export async function cleanshop({ run, base, out }) {
  const events = (p) => p.evaluate(() => JSON.parse(sessionStorage.getItem("kollage.v1.events") || "[]").map((e) => `${e.event}:${e.source ?? ""}`));

  await run("r4-phone-menu", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/");
    await page.waitForLoadState("networkidle"); // hydrated: the menu button responds
    const header = await page.locator(".nav").boundingBox();
    if (header.height > 60) throw new Error("phone header is " + header.height + "px high");
    const opener = page.getByRole("button", { name: "Menü öffnen" });
    await opener.tap();
    const menu = page.locator("dialog.menu[open]");
    await menu.getByRole("link", { name: "Entdecken" }).waitFor();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/r4-phone-menu-open.png` });
    // Escape closes it (after the slide-out) and focus returns to the menu button.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(450);
    if (await page.locator("dialog.menu[open]").count()) throw new Error("menu did not close");
    if (!(await opener.evaluate((el) => el === document.activeElement))) throw new Error("focus did not return to the menu button");
    // Occasion tiles lead to filtered looks; links close the menu.
    await opener.tap();
    await menu.getByRole("link", { name: "Büro" }).tap();
    await page.waitForURL(/anlass=buero/);
    // Reopen right away, while the panel is still sliding out: it must come back, not stay empty.
    await opener.tap();
    await page.waitForTimeout(500);
    if (!(await page.locator(".menu:not(.is-closing) .menu__panel").isVisible())) throw new Error("menu stuck after fast reopen");
    await menu.getByRole("link", { name: /Gemerkt/ }).tap();
    await page.waitForURL(/\/gemerkt/);
    await page.waitForTimeout(450);
    if (await page.locator("dialog.menu[open]").count()) throw new Error("menu still open after navigation");
    await page.screenshot({ path: `${out}/r4-phone-menu.png` });
  });

  await run("r4-video-entry", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/look/herbst-in-bern?von=tiktok");
    const bar = page.locator(".look-buybar");
    await bar.waitFor();
    const box = await bar.boundingBox();
    if (box.y + box.height > 844 + 1) throw new Error("buy bar not on screen");
    await page.screenshot({ path: `${out}/r4-video-entry.png` });
    await bar.getByRole("link", { name: "Anpassen" }).tap();
    await page.waitForURL(/\/builder/);
    await page.locator(".piece--edit").nth(5).waitFor();
    await page.getByRole("button", { name: "Produkte", exact: true }).tap();
    await page.locator(".product-card", { hasText: "Boxy T-Shirt" }).first().tap();
    await page.getByRole("button", { name: "Fertig" }).tap();
    await page.waitForTimeout(300);
    const ev = await events(page);
    for (const want of ["landing:tiktok", "look_viewed:tiktok", "builder_loaded:tiktok", "first_edit:tiktok"])
      if (!ev.includes(want)) throw new Error(`missing event ${want}: ${ev.join(", ")}`);
    if (ev.filter((e) => e.startsWith("first_edit")).length !== 1) throw new Error("first_edit counted more than once");
  });

  await run("r4-guest-save", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.locator(".piece--edit").nth(4).waitFor();
    await page.fill("#look-title", "Mein Seetag");
    await page.getByRole("button", { name: "Speichern", exact: true }).click();
    if (await page.locator("dialog[open]").count()) throw new Error("saving asked for a sign-in");
    await page.locator(".builder__status").getByText("Gespeichert in «Meine Looks»").waitFor();
    await page.goto(base + "/meine-looks");
    await page.getByText("Mein Seetag").first().waitFor();
    const ev = await events(page);
    if (!ev.some((e) => e.startsWith("look_saved"))) throw new Error("look_saved not tracked");
  });
}
