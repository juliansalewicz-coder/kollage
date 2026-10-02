// Tablet widths (found in a bug pass): builder side panel at 1100 px, dock vs canvas at 800 px,
// centred look page at 800 px. Imported by scripts/e2e.mjs.
export async function tablet({ run, base, out }) {
  await run("r7-builder-1100", { width: 1100, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=herbst-in-bern");
    await page.locator(".piece--edit").nth(5).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    await page.locator('.piece--edit[aria-label^="Trenchcoat"]').click();
    const back = await page.locator(".side-back").boundingBox();
    const panel = await page.locator(".builder__side").boundingBox();
    if (Math.abs(back.width - panel.width) > 2) throw new Error(`«Look» row ${back.width}px in a ${panel.width}px panel`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error("sideways scroll");
  });

  await run("r7-builder-800", { width: 800, height: 900 }, async (page) => {
    await page.goto(base + "/builder?look=herbst-in-bern");
    await page.locator(".piece--edit").nth(5).waitFor();
    await page.locator(".builder[data-ready]").waitFor();
    const canvas = await page.locator(".window--edit").boundingBox();
    const dock = await page.locator(".stage-dock").boundingBox();
    if (canvas.y + canvas.height > dock.y + 2) throw new Error(`dock covers the canvas: canvas ends ${canvas.y + canvas.height}, dock starts ${dock.y}`);
    await page.screenshot({ path: `${out}/r7-builder-800.png` });
  });

  await run("r7-look-800", { width: 800, height: 900 }, async (page) => {
    await page.goto(base + "/look/herbst-in-bern");
    const win = await page.locator(".look-page__window").boundingBox();
    const left = win.x;
    const right = 800 - (win.x + win.width);
    if (Math.abs(left - right) > 24) throw new Error(`collage not centred: ${left} / ${right}`);
  });
}
