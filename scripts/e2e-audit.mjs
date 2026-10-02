// Fixes from the external audit (1 October 2026): first-screen action on short phones, direct remix
// without template images, modal product drawer, broken browser data, honest saving suggestion.
// Imported by scripts/e2e.mjs; expects `run`, `base`, `out`, `draft` from there.
export async function audit({ run, base, out, draft }) {
  await run("r3-short-phone", { width: 360, height: 640 }, async (page) => {
    await page.goto(base + "/");
    const cta = await page.getByRole("link", { name: "Diesen Look anpassen" }).boundingBox();
    if (!cta || cta.y + cta.height > 640) throw new Error("action below the fold on 360x640: " + JSON.stringify(cta));
    await page.screenshot({ path: `${out}/r3-short-phone.png` });
  });

  await run("r3-direct-remix", { width: 390, height: 844 }, async (page) => {
    const requested = new Set();
    page.on("request", (r) => {
      const m = r.url().match(/\/products\/(?:sm\/)?([^/.]+)\.webp/);
      if (m) requested.add(m[1]);
    });
    await page.goto(base + "/builder?look=apero-am-abend");
    await page.locator(".piece--edit").nth(4).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    await page.waitForTimeout(1500);
    const look = await draft(page);
    const inLook = new Set(look.items.map((i) => i.productId));
    const extra = [...requested].filter((id) => !inLook.has(id));
    if (extra.length) throw new Error("images outside the look were loaded: " + extra.join(", "));
    if (await page.getByText("Womit fängst du an?").count()) throw new Error("start templates shown");
  });

  await run("r3-drawer-modal", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.locator(".piece--edit").nth(4).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    const opener = page.getByRole("button", { name: "Produkte", exact: true });
    await opener.tap();
    await page.getByRole("button", { name: "Fertig" }).waitFor();
    await page.getByRole("button", { name: "Fertig" }).focus();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Shift+Tab");
      // nextjs-portal is the dev-mode overlay of Next.js; it does not exist in production builds.
      const inside = await page.evaluate(
        () => Boolean(document.activeElement?.closest("#panel-galerie")) || document.activeElement === document.body || document.activeElement?.tagName === "NEXTJS-PORTAL",
      );
      if (!inside) throw new Error("focus left the drawer: " + (await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80))));
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    if (!(await opener.evaluate((el) => el === document.activeElement))) throw new Error("focus did not return to «Produkte»");
    if (await page.locator("[inert]").count()) throw new Error("background still inert after closing");
  });

  await run(
    "r3-broken-storage",
    { width: 1280, height: 800 },
    async (page) => {
      await page.goto(base + "/");
      await page.evaluate(() => {
        localStorage.setItem("kollage.v1.favorites", JSON.stringify({ products: null, looks: [] }));
        localStorage.setItem("kollage.v1.draft", JSON.stringify({ items: "broken" }));
        localStorage.setItem("kollage.v1.looks", JSON.stringify([{ title: "ohne id" }, 7]));
      });
      await page.goto(base + "/gemerkt");
      await page.getByRole("heading", { name: "Gemerkt", level: 1 }).waitFor();
      await page.goto(base + "/builder");
      await page.getByText("Womit fängst du an?").waitFor();
      await page.locator(".product-card", { hasText: "Boxy T-Shirt" }).first().click();
      await page.waitForTimeout(400);
      if ((await draft(page)).items.length !== 1) throw new Error("builder did not recover");
      await page.goto(base + "/meine-looks");
      await page.getByRole("heading", { level: 1 }).waitFor();
      if (await page.getByText("Application error").count()) throw new Error("application error page");
    },
  );

  await run("r3-duplicate-saving", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/");
    await page.evaluate(() => {
      const it = (uid, x) => ({ uid, productId: "trench", x, y: 500, w: 330, rotation: 0, z: 1 });
      localStorage.setItem(
        "kollage.v1.draft",
        JSON.stringify({ items: [it("a", 300), it("b", 700)], title: "Zwei Trenchcoats", note: "", occasion: "alltag", backdrop: "papier", lookId: null, basedOn: null, updatedAt: "", budget: 100 }),
      );
    });
    await page.goto(base + "/builder");
    await page.locator(".piece--edit").nth(1).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    const value = async () => Number((await page.locator(".builder__side .budget__lines .ticker__value").first().innerText()).replace(/[^0-9.]/g, ""));
    const before = await value();
    if (before !== 289) throw new Error("duplicates not counted once: " + before);
    await page.locator(".budget__cheaper").first().click();
    const dlg = page.locator("dialog.sheet[open]");
    await dlg.getByText("Alle 2 Platzierungen ersetzen").waitFor();
    await dlg.locator(".alt-list").first().locator(".alt-row").first().click();
    await page.waitForTimeout(500);
    const after = await value();
    if (!(after < before)) throw new Error(`suggestion raised the total: ${before} -> ${after}`);
    const d = await draft(page);
    if (d.items.some((i) => i.productId === "trench")) throw new Error("one trench left behind");
    await page.screenshot({ path: `${out}/r3-duplicate-saving.png` });
  });
}
