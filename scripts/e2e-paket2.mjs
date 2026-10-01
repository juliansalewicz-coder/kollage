// Package 2: every style entry opens matching looks; the start page leads straight into the builder.
export async function paket2({ run, base, draft }) {
  await run("p2-style-entries", { width: 1440, height: 900 }, async (page) => {
    const checks = [
      ["Alltag", (meta) => meta.startsWith("Alltag")],
      ["Büro", (meta) => meta.startsWith("Büro")],
      ["Wochenende", (meta) => meta.startsWith("Wochenende")],
      ["Unter CHF 500", (meta) => Number(meta.split("CHF ")[1].replace(/[’']/g, "")) <= 500],
    ];
    for (const [label, ok] of checks) {
      await page.goto(base + "/");
      await page.locator(".entry", { hasText: label }).click();
      await page.waitForURL(/\/entdecken\?/);
      await page.locator(".look-tile").first().waitFor();
      const metas = await page.locator(".look-tile__meta").allTextContents();
      if (!metas.length || !metas.every((m) => ok(m.trim()))) throw new Error(`${label}: unmatched looks ${metas.join(" | ")}`);
    }
  });

  await run("p2-hero-to-builder", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/");
    await page.getByRole("link", { name: "Diesen Look anpassen" }).tap();
    await page.waitForURL(base + "/builder");
    await page.locator(".piece--edit").nth(5).waitFor();
    await page.waitForTimeout(500); // autosave debounce
    const d = await draft(page);
    if (!d.title.includes("Herbst unter den Lauben")) throw new Error("hero look not opened: " + d.title);
  });
}
