// Clean Shop round: compact phone header, look page as an entry from a video, guest saving, funnel events.
// Imported by scripts/e2e.mjs; expects `run`, `base`, `out`, `draft` from there.
export async function cleanshop({ run, base, out }) {
  const events = (p) => p.evaluate(() => JSON.parse(sessionStorage.getItem("kollage.v1.events") || "[]").map((e) => `${e.event}:${e.source ?? ""}`));

  await run("r4-phone-menu", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/");
    const header = await page.locator(".nav").boundingBox();
    if (header.height > 60) throw new Error("phone header is " + header.height + "px high");
    await page.getByRole("button", { name: "Menü" }).tap();
    const sheet = page.locator("dialog.sheet[open]");
    await sheet.getByRole("link", { name: /Gemerkt/ }).tap();
    await page.waitForURL(/\/gemerkt/);
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
