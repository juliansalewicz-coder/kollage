// Open points after the quality round: server-rendered builder canvas, link previews, central events.
// Imported by scripts/e2e.mjs.
export async function openPoints({ run, base }) {
  await run("r9-builder-server-canvas", { width: 390, height: 844 }, async (page) => {
    // The outfit is in the HTML itself, before any JavaScript runs.
    const html = await (await page.request.get(base + "/builder?look=apero-am-abend")).text();
    const pieces = (html.match(/piece__img/g) || []).length;
    if (pieces < 4) throw new Error(`server HTML has ${pieces} pieces`);
    await page.goto(base + "/builder?look=apero-am-abend");
    await page.waitForLoadState("networkidle");
    // After hydration the same look is on the canvas and editable.
    const canvas = await page.locator(".piece--edit").count();
    if (canvas !== pieces) throw new Error(`canvas ${canvas} pieces, server ${pieces}`);
    await page.locator(".piece--edit").first().tap();
    await page.locator(".piece-tools__name").waitFor();
  });

  await run("r9-link-preview", { width: 1440, height: 900 }, async (page) => {
    const og = await page.request.get(base + "/og?look=herbst-in-bern");
    if (og.status() !== 200 || og.headers()["content-type"] !== "image/png") throw new Error(`og ${og.status()} ${og.headers()["content-type"]}`);
    const code = Buffer.from(JSON.stringify({ v: 1, t: "Apéro mit Mara", o: "abend", b: "papier", i: [["t-weiss", 300, 400, 300, 0], ["jeans-hell", 320, 800, 300, 0]] })).toString("base64url");
    const html = await (await page.request.get(`${base}/look/geteilt?d=${code}`, { headers: { "user-agent": "facebookexternalhit/1.1" } })).text();
    if (!html.includes('property="og:title" content="Apéro mit Mara · Kollage"')) throw new Error("shared look has no own preview title");
    if (!html.includes("/og?d=")) throw new Error("shared look has no preview picture");
  });

  await run("r9-events-central", { width: 1440, height: 900 }, async (page) => {
    const sent = [];
    await page.route("**/api/events", async (route) => {
      sent.push(JSON.parse(route.request().postData() || "{}"));
      await route.fulfill({ status: 204 });
    });
    const own = {
      id: "geheimer-titel-ab12c",
      title: "Geheimer Titel",
      note: "",
      occasion: "alltag",
      backdrop: "papier",
      items: [
        { uid: "u1", productId: "t-weiss", x: 500, y: 400, w: 300, rotation: 0, z: 1 },
        { uid: "u2", productId: "jeans-hell", x: 500, y: 850, w: 300, rotation: 0, z: 2 },
      ],
      status: "privat",
      authorName: "Mara",
      ownerEmail: "mara@beispiel.ch",
      createdAt: "2026-10-02T10:00:00.000Z",
      updatedAt: "2026-10-02T10:00:00.000Z",
      basedOn: null,
      isExample: false,
    };
    await page.goto(base + "/hinweise");
    await page.evaluate((l) => localStorage.setItem("kollage.v1.looks", JSON.stringify([l])), own);
    await page.goto(base + "/look/geheimer-titel-ab12c?von=tiktok");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    const viewed = sent.find((e) => e.event === "look_viewed");
    if (!viewed) throw new Error("look_viewed not sent: " + sent.map((e) => e.event).join());
    const raw = JSON.stringify(sent);
    if (/Geheimer|geheimer|mara@/i.test(raw)) throw new Error("personal data or title sent: " + raw.slice(0, 200));
    if (viewed.look !== "eigen" || viewed.source !== "tiktok" || !viewed.visit) throw new Error("unexpected payload " + JSON.stringify(viewed));
  });

  await run("r9-events-endpoint", { width: 1440, height: 900 }, async (page) => {
    const ok = await page.request.post(base + "/api/events", { data: { event: "landing", source: "test", email: "x@y.ch" } });
    if (ok.status() !== 204) throw new Error("valid event " + ok.status());
    const bad = await page.request.post(base + "/api/events", { data: { event: "irgendwas" } });
    if (bad.status() !== 400) throw new Error("unknown event accepted " + bad.status());
  });
}
