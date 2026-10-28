// Per-frame checks for cut 17 WhatAmIPayingFor (sam-pricing-tokens): the receipt (standing out of the tile's slot,
// swaying about the slot mouth) vs the two customers' heads, head vs head, the chins against the caption band, f0
// hidden busts, and the camera's speed. Run: bun scripts/clips/sam-pricing-tokens/receipt-check.ts
// the kit loads its fonts at module scope: stub the browser font API so the modules import under bun
const g = globalThis as unknown as Record<string, unknown>;
g.FontFace = class {
  load() {
    return Promise.resolve(this);
  }
};
g.document = { fonts: { add: () => undefined } };
const { camCheck } = await import("../../../generated/components/kits/cheeky-pint/museShared");
const C = await import("../../../generated/components/sam-pricing-tokens/WhatAmIPayingFor");

type Cam = { x: number; y: number; k: number };
const toS = (c: Cam, x: number, y: number) => ({ x: 540 + (x - c.x) * c.k, y: 960 + (y - c.y) * c.k });
const BAND0 = 1080;
let w = { nose: Infinity, fN: -1, iN: -1, disc: Infinity, fD: -1, iD: -1, hh: Infinity, fH: -1, chin: -Infinity, fC: -1, iC: -1, f0vis: false, crop: Infinity, fK: -1, iK: -1, tag: Infinity, fT: -1, iT: -1 };
const lines: string[] = [];
const perCrop = [Infinity, Infinity];
for (let f = 0; f < C.DURATION; f++) {
  const cam = C.camAt(f);
  const out = C.outAt(f);
  const a = (C.swayAt(f) * Math.PI) / 180;
  // receipt in its own unswayed frame: x in [540 - w/2, 540 + w/2], y in [SLOT_Y - out, SLOT_Y]; a point's distance
  // to it = the distance of the point rotated back by -sway about the slot mouth
  const unsway = (x: number, y: number) => {
    const dx = x - C.TILE_X;
    const dy = y - C.SLOT_Y;
    return { x: C.TILE_X + dx * Math.cos(-a) - dy * Math.sin(-a), y: C.SLOT_Y + dx * Math.sin(-a) + dy * Math.cos(-a) };
  };
  const x0 = C.TILE_X - C.RECEIPT.w / 2;
  const x1 = C.TILE_X + C.RECEIPT.w / 2;
  const y0 = C.SLOT_Y - out;
  const heads = C.PEOPLE.map((p, i) => ({ ...C.headAt(i, f), p }));
  heads.forEach((h, i) => {
    if (out > 1) {
      // the nose tip (head-local (-1.16 R, 0.1 R), facing, tilt about the head centre ~ small) and the whole head disc
      const t = (-h.tilt * Math.PI) / 180 + (h.lean * Math.PI) / 180;
      const nl = { x: -1.16 * h.r, y: 0.1 * h.r };
      const nx = h.x - h.p.facing * (nl.x * Math.cos(t) - nl.y * Math.sin(t));
      const ny = h.y + (nl.x * Math.sin(t) + nl.y * Math.cos(t)) * 1;
      const n = unsway(nx, ny);
      const dN = Math.hypot(Math.max(x0 - n.x, 0, n.x - x1), Math.max(y0 - n.y, 0, n.y - C.SLOT_Y)) * cam.k;
      if (dN < w.nose) w = { ...w, nose: dN, fN: f, iN: i };
      const c = unsway(h.x, h.y);
      const dD = (Math.hypot(Math.max(x0 - c.x, 0, c.x - x1), Math.max(y0 - c.y, 0, c.y - C.SLOT_Y)) - 1.3 * h.r) * cam.k;
      if (dD < w.disc) w = { ...w, disc: dD, fD: f, iD: i };
    }
    if (f >= 104) {
      // the back of the head (hair disc `back` x r behind the centre) against the frame edges, from the camera's
      // push-in on: no head crop at rest
      const bx = toS(cam, h.x - h.p.facing * h.p.back * h.r, h.y).x;
      const m = h.p.facing === 1 ? bx : 1080 - bx;
      if (m < w.crop) w = { ...w, crop: m, fK: f, iK: i };
      perCrop[i] = Math.min(perCrop[i], m);
    }
    {
      // every frame: the chin above the caption band
      const chin = toS(cam, h.x, h.y + h.r).y;
      if (chin > w.chin) w = { ...w, chin, fC: f, iC: i };
    }
    if (f === 0) {
      // f0 must be cut 11's frame: every head (a 1.3 r disc, hair included) wholly outside it (the leaned body
      // trails out behind the head, so a hidden head means a hidden bust)
      const c = toS(cam, h.x, h.y);
      const R = 1.3 * h.r * cam.k;
      if (c.x + R > -2 && c.x - R < 1082 && c.y + R > -2 && c.y - R < 1922) w = { ...w, f0vis: true };
    }
  });
  // the standing tag (before it sinks): heads vs its rectangle (world 540 +- TAG.w / 2, its top to the slot)
  if (f < C.SINK0) {
    heads.forEach((h, i) => {
      const t0 = C.SLOT_Y - C.TAG_H;
      const dD = (Math.hypot(Math.max(x0 - 2 - h.x, 0, h.x - (x1 + 2)), Math.max(t0 - h.y, 0, h.y - C.SLOT_Y)) - 1.3 * h.r) * cam.k;
      if (dD < w.tag) w = { ...w, tag: dD, fT: f, iT: i };
    });
  }
  const d = Math.hypot(heads[0].x - heads[1].x, heads[0].y - heads[1].y) - 1.3 * (heads[0].r + heads[1].r);
  if (d < w.hh) w = { ...w, hh: d * cam.k, fH: f };
  if (f % 6 === 0 || f === C.DURATION - 1) {
    const rt = toS(cam, C.TILE_X, y0).y;
    const sl = toS(cam, C.TILE_X, C.SLOT_Y).y;
    lines.push(
      `f${f} k${cam.k.toFixed(3)} y${cam.y.toFixed(0)} | receipt top ${rt.toFixed(0)} slot ${sl.toFixed(0)} | heads ${heads.map((h) => { const s = toS(cam, h.x, h.y); return `${s.x.toFixed(0)},${s.y.toFixed(0)} r${(h.r * cam.k).toFixed(0)}`; }).join("  ")}`,
    );
  }
}
console.log(lines.join("\n"));
console.log("min gap nose -> receipt (screen px)", w.nose.toFixed(1), "at f", w.fN, "bust", w.iN);
console.log("min gap head disc (1.3 r) -> receipt (screen px)", w.disc.toFixed(1), "at f", w.fD, "bust", w.iD);
console.log("min gap head <-> head (1.3 r discs, screen px)", w.hh.toFixed(1), "at f", w.fH);
console.log("lowest chin on screen, every frame", w.chin.toFixed(1), "at f", w.fC, "bust", w.iC, "(band from", BAND0, ")");
console.log("a bust visible at f0:", w.f0vis);
console.log("min gap head disc (1.3 r) -> standing tag (screen px)", w.tag.toFixed(1), "at f", w.fT, "bust", w.iT);
console.log("back of head -> frame edge from f104 (screen px, < 0 = cropped)", w.crop.toFixed(1), "at f", w.fK, "bust", w.iK, "| per bust", perCrop.map((v) => v.toFixed(1)).join(" "));
console.log("camera", JSON.stringify(camCheck(C.camAt, 0, C.DURATION)));
