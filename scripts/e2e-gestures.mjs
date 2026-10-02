// Direct manipulation: transform-only dragging, one undo step per gesture, centre snapping,
// two-finger pinch on touch, trackpad pinch, PNG export.
// Imported by scripts/e2e.mjs; expects `run`, `base`, `out`, `draft` from there.
export async function gestures({ run, base, out, draft }) {
  const item = async (page, id) => (await draft(page)).items.find((i) => i.productId === id);

  await run("r5-drag-smooth", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.locator(".piece--edit").nth(4).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    await page.waitForTimeout(500);
    const before = await item(page, "tote-natur");
    const el = page.locator('.piece--edit[aria-label^="Canvas-Tote"]');
    const b = await el.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 3; i++) await page.mouse.move(b.x + b.width / 2 - i * 4, b.y + b.height / 2 + i * 2);
    // Selecting the piece updates the side panel once; after that the drag must not re-render it.
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      window.__mut = 0;
      new MutationObserver((m) => (window.__mut += m.length)).observe(document.querySelector(".builder__side"), { subtree: true, childList: true, characterData: true, attributes: true });
    });
    for (let i = 4; i <= 30; i++) await page.mouse.move(b.x + b.width / 2 - i * 4, b.y + b.height / 2 + i * 2);
    const midDrag = await page.evaluate(() => window.__mut);
    const lifted = await el.evaluate((n) => n.classList.contains("is-lifted") && n.style.transform.includes("translate3d"));
    await page.mouse.up();
    await page.waitForTimeout(500);
    if (!lifted) throw new Error("piece not moved by transform while dragging");
    if (midDrag > 0) throw new Error(`side panel re-rendered ${midDrag}× during the drag`);
    const after = await item(page, "tote-natur");
    if (!(after.x < before.x - 60)) throw new Error(`drag did not move: ${before.x} -> ${after.x}`);
    if (await el.evaluate((n) => n.style.transform.includes("translate3d"))) throw new Error("gesture transform left behind");
    // One undo step brings it back.
    await page.getByRole("button", { name: "Rückgängig" }).click();
    await page.waitForTimeout(400);
    const undone = await item(page, "tote-natur");
    if (Math.abs(undone.x - before.x) > 0.01 || Math.abs(undone.y - before.y) > 0.01) throw new Error("undo did not restore in one step");
  });

  await run("r5-snap-centre", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.locator(".piece--edit").nth(4).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    await page.waitForTimeout(500);
    const glass = await page.locator(".window--edit .window__glass").boundingBox();
    const el = page.locator('.piece--edit[aria-label^="Canvas-Tote"]');
    const b = await el.boundingBox();
    const start = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    // Aim 4 px next to the vertical centre line: it must snap.
    const target = { x: glass.x + glass.width / 2 + 4, y: start.y };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    const steps = 20;
    for (let i = 1; i <= steps; i++) await page.mouse.move(start.x + ((target.x - start.x) * i) / steps, start.y);
    const guide = await page.locator(".guide--v.is-on").count();
    await page.screenshot({ path: `${out}/r5-snap-centre.png` });
    await page.mouse.up();
    await page.waitForTimeout(400);
    if (!guide) throw new Error("no guide shown while snapping");
    const x = (await item(page, "tote-natur")).x;
    if (x !== 500) throw new Error("did not snap to the centre: " + x);
  });

  await run("r5-pinch-touch", { width: 390, height: 844 }, async (page) => {
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.locator(".piece--edit").nth(4).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    await page.waitForTimeout(500);
    const before = await item(page, "tote-natur");
    const b = await page.locator('.piece--edit[aria-label^="Canvas-Tote"]').boundingBox();
    const c = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map((p, i) => ({ x: p.x, y: p.y, id: i })) });
    // Two fingers 30 px apart, spread to 90 px and turn by about 30 degrees.
    await touch("touchStart", [{ x: c.x - 15, y: c.y }]);
    await touch("touchStart", [{ x: c.x - 15, y: c.y }, { x: c.x + 15, y: c.y }]);
    for (let i = 1; i <= 12; i++) {
      const r = 15 + (30 * i) / 12;
      const a = ((30 * i) / 12) * (Math.PI / 180);
      await touch("touchMove", [
        { x: c.x - r * Math.cos(a), y: c.y - r * Math.sin(a) },
        { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) },
      ]);
    }
    await touch("touchEnd", []);
    await page.waitForTimeout(500);
    const after = await item(page, "tote-natur");
    if (!(after.w > before.w * 2.2)) throw new Error(`pinch did not scale: ${before.w} -> ${after.w}`);
    if (!(Math.abs(after.rotation - before.rotation - 30) < 6)) throw new Error(`pinch did not rotate: ${before.rotation} -> ${after.rotation}`);
    await page.screenshot({ path: `${out}/r5-pinch-touch.png` });
  });

  await run("r5-trackpad-pinch", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=sonntag-am-see");
    await page.locator(".piece--edit").nth(4).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    await page.waitForTimeout(500);
    const el = page.locator('.piece--edit[aria-label^="Canvas-Tote"]');
    await el.click();
    const before = await item(page, "tote-natur");
    const b = await el.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.keyboard.down("Control");
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -10);
    await page.keyboard.up("Control");
    // 200 ms until the pinch counts as finished, then the 250 ms autosave.
    await page.waitForTimeout(900);
    const after = await item(page, "tote-natur");
    if (!(after.w > before.w * 1.4)) throw new Error(`trackpad pinch did not scale: ${before.w} -> ${after.w}`);
  });

  await run("r5-export-png", { width: 1440, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=herbst-in-bern");
    await page.locator(".piece--edit").nth(5).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Als Bild" }).click()]);
    const name = download.suggestedFilename();
    if (!/\.png$/.test(name)) throw new Error("not a png: " + name);
    await download.saveAs(`${out}/r5-export.png`);
  });
}
