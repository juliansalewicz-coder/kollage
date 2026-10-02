// Review package 2: start page interaction, honest save states, compact phone builder, motion feedback.
// Imported by scripts/e2e.mjs; expects `run`, `base`, `out`, `draft` from there.
export async function review2({ run, base, out, draft }) {
  await run("r2-home-labels", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/");
    const window = page.locator(".featured .window__glass");
    await window.waitFor();
    if (await page.locator(".featured .tag-mark").count()) throw new Error("number tags visible at rest");
    if (await page.locator(".piece-label").count()) throw new Error("label visible at rest");
    // Mouse: pointing shows name and price.
    await page.locator('.featured .piece--button[data-product="trench"]').hover();
    await page.locator(".piece-label", { hasText: "Trenchcoat" }).waitFor();
    // Keyboard: focus shows the label, Enter opens price and shop.
    await page.mouse.move(5, 5);
    await page.locator('.featured .piece--button[data-product="boot-braun"]').focus();
    await page.locator(".piece-label", { hasText: "Chelsea Boots" }).waitFor();
    await page.keyboard.press("Enter");
    await page.locator("dialog.sheet[open]").getByRole("link", { name: /Zum Shop/ }).waitFor();
    await page.keyboard.press("Escape");
    // First screen: outfit and its action are visible without scrolling.
    const cta = await page.getByRole("link", { name: "Diesen Look anpassen" }).boundingBox();
    if (!cta || cta.y + cta.height > 900) throw new Error("hero action below the fold: " + JSON.stringify(cta));
  });

  for (const [name, vp] of [
    ["r2-home-phone", { width: 390, height: 844 }],
    ["r2-home-360", { width: 360, height: 780 }],
  ]) {
    await run(name, vp, async (page) => {
      await page.goto(base + "/");
      const cta = await page.getByRole("link", { name: "Diesen Look anpassen" }).boundingBox();
      const fig = await page.locator(".featured__window").boundingBox();
      if (!cta || cta.y + cta.height > vp.height) throw new Error("hero action below the fold " + JSON.stringify(cta));
      if (!fig || fig.y > vp.height / 2) throw new Error("outfit starts too low");
      // Touch: a tap opens the product sheet.
      await page.locator('.featured .piece--button[data-product="strick-camel"]').tap();
      await page.locator("dialog.sheet[open]").getByRole("heading", { name: /Pullover/ }).waitFor();
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > vp.width) throw new Error("sideways scroll " + sw);
      await page.screenshot({ path: `${out}/${name}.png` });
    });
  }

  await run("r2-save-desktop", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder");
    const status = page.locator(".builder__status .save-status");
    await status.getByText("Leere Leinwand").waitFor();
    if (!(await page.getByRole("button", { name: "Speichern", exact: true }).isVisible())) throw new Error("guest save label");
    if (!(await page.getByRole("button", { name: "Anmelden & veröffentlichen" }).isVisible())) throw new Error("guest publish label");
    await page.locator(".product-card", { hasText: "Boxy T-Shirt" }).first().click();
    // Motion: the new piece is marked as just arrived.
    await page.locator(".piece--edit.fx-add").first().waitFor();
    await status.getByText("Entwurf in diesem Browser gesichert").waitFor();
    // Publishing (two pieces needed) asks for a name; cancelling keeps the draft and its state.
    await page.locator(".product-card", { hasText: "Straight Jeans, hell" }).first().click();
    await page.fill("#look-title", "Gast-Look");
    await page.getByRole("button", { name: "Anmelden & veröffentlichen" }).click();
    await page.getByRole("button", { name: "Abbrechen" }).click();
    await page.waitForTimeout(400);
    if ((await draft(page)).items.length !== 2) throw new Error("draft lost after cancel");
    // A guest saves without signing in.
    await page.getByRole("button", { name: "Speichern", exact: true }).click();
    if (await page.locator("dialog[open]").count()) throw new Error("saving asked for a sign-in");
    await status.getByText("Gespeichert in «Meine Looks»").waitFor();
    // A change after saving: draft is safe, but not yet in «Meine Looks».
    await page.locator(".product-card", { hasText: "Leder-Sneaker" }).first().click();
    await status.getByText("Entwurf in diesem Browser gesichert").waitFor();
    await page.getByText("Noch nicht in «Meine Looks» gespeichert").waitFor();
    await page.screenshot({ path: `${out}/r2-save-desktop.png` });
  });

  await run("r2-save-blocked", { width: 390, height: 844 }, async (page) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("blocked", "QuotaExceededError");
      };
    });
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.locator(".piece--edit").nth(3).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    await page.locator(".mbar .save-status", { hasText: "Nicht gesichert" }).waitFor();
    if (await page.locator(".save-status", { hasText: "gesichert" }).filter({ hasNotText: "Nicht" }).count())
      throw new Error("claims saved while storage is blocked");
    await page.screenshot({ path: `${out}/r2-save-blocked.png` });
  });

  for (const [name, vp] of [
    ["r2-phone-builder", { width: 390, height: 844 }],
    ["r2-phone-builder-360", { width: 360, height: 780 }],
  ]) {
    await run(name, vp, async (page) => {
      await page.goto(base + "/builder?look=herbst-in-bern");
      await page.locator(".piece--edit").nth(5).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
      // The outfit starts high and fits together with the dock on the first screen.
      const canvas = await page.locator(".window--edit").boundingBox();
      const dock = await page.locator(".stage-dock").boundingBox();
      if (canvas.y > 200) throw new Error("canvas starts at " + canvas.y);
      if (canvas.y + canvas.height > dock.y + 4) throw new Error("dock covers the canvas");
      if (await page.locator("#look-title").isVisible()) throw new Error("title field still above the canvas");
      // Selecting a piece shows its tools in the dock, still on screen.
      await page.locator('.piece--edit[aria-label^="Jeans"], .piece--edit[aria-label^="Straight Jeans"]').first().tap();
      const tools = await page.getByRole("toolbar", { name: "Ausgewähltes Teil" }).boundingBox();
      if (tools.y + tools.height > vp.height) throw new Error("tools below the screen");
      // Publishing without a title opens the save sheet with focus in the title field.
      await page.locator(".mbar__look").tap();
      const sheet = page.locator("dialog.sheet[open]");
      await sheet.getByRole("heading", { name: "Dein Look" }).waitFor();
      await sheet.locator("#sheet-look-title").fill("");
      await sheet.getByRole("button", { name: /Anmelden & veröffentlichen/ }).tap();
      await sheet.getByText("Gib dem Look einen Titel").waitFor();
      const focused = await page.evaluate(() => document.activeElement?.id);
      if (focused !== "sheet-look-title") throw new Error("focus not in title: " + focused);
      // Long title: kept in full, shown shortened in the bar without overflow.
      const long = "Herbst unter den Lauben mit Trench, Strick, Velours-Boots und karierter Wolle für Bern";
      await sheet.locator("#sheet-look-title").fill(long);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
      if ((await draft(page)).title !== long.slice(0, 80)) throw new Error("title not kept");
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > vp.width) throw new Error("sideways scroll " + sw);
      const bar = await page.locator(".mbar").boundingBox();
      if (bar.height > 60) throw new Error("bar grew with long title: " + bar.height);
      await page.screenshot({ path: `${out}/${name}.png` });
    });
  }

  await run("r2-swap-motion", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=herbst-in-bern");
    await page.locator(".piece--edit").nth(5).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    await page.locator('.piece--edit[aria-label^="Trenchcoat"]').click();
    await page.getByRole("toolbar", { name: "Ausgewähltes Teil" }).getByRole("button", { name: "Ersetzen" }).click();
    await page.locator("dialog.sheet[open] .alt-row").first().click();
    await page.locator(".piece--edit.fx-swap .piece__ghost").waitFor({ timeout: 2000 });
    await page.locator(".ticker__delta").first().waitFor({ state: "attached", timeout: 2000 });
    await page.waitForTimeout(900);
    if (await page.locator(".piece__ghost").count()) throw new Error("ghost not cleaned up");
  });
}
