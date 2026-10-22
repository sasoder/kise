// ---------------------------------------------------------------------------
// pandemicFolkCrowd — the CROWD of the drawn cast (kyle-pandemics V3, take 2, style A "gouache"): front-facing people
// in the same hand as the approved style frames, for cut 13 (hundreds killed by TB over 200 years, in rows facing us,
// 60–260 px) and cut 1 (Europeans in the plague era on a map, 100–210 px, half of them fall over). They are drawn
// once per (kind, ink, seed, size) into a sprite with the gouache filter baked in (pandemicFolkPaint useFolkSprites).
//   CROWD_KINDS            c1900: man (flat cap, jacket, moustache) | woman (headscarf knotted under the chin, shawl,
//                          cream apron) | boy (flat cap, short trousers) | girl (pinafore, plaits, a ribbon) | oldMan
//                          (bowler, long coat, white moustache, a stick) | oldWoman (bonnet, shawl, spectacles);
//                          medieval: medMan (hood with its shoulder cape, short tunic, hose) | medWoman (white wimple and
//                          veil, a long belted gown) | medChild (a plain tunic, bowl-cut hair) | medOld (hood, white
//                          beard, a staff)
//   crowdDrawing(kind, ink, seed) -> { shapes, hUnits, wUnits }   inks: "orange" | "cream" | "dead" | "natural"
//   crowdSpriteReq(kind, ink, seed, hPx) -> SpriteReq (key = kind|ink|seed%8|hPx)
//   heightOf(kind, seed) -> a small height factor (0.96..1.04) to multiply hPx by
//   sway(frame, seed) -> { rot (deg), sy }     the walk-free idle about the feet
//   fall(t, dir) -> { rot (deg), pivot ([x, y] figure units) }   the cut-1 fall
// ---------------------------------------------------------------------------
import { INK_CREAM, INK_DEAD, INK_ORANGE, VARIANTS, boy, ell, faceFront, limb, mir, oldMan, woman, type Drawing, type Inks, type Part } from "./pandemicFolkSketch";
import type { Shape, SpriteReq } from "./pandemicFolkPaint";

export type CrowdKind = "man" | "woman" | "boy" | "girl" | "oldMan" | "oldWoman" | "medMan" | "medWoman" | "medChild" | "medOld";
export type CrowdInk = "orange" | "cream" | "dead" | "natural";
export const CROWD_KINDS: CrowdKind[] = ["man", "woman", "boy", "girl", "oldMan", "oldWoman", "medMan", "medWoman", "medChild", "medOld"];

const INK_NATURAL: Inks = { c1: "#A9785E", c2: "#7D8775", c3: "#5E5348", c4: "#EBE2CD", c5: "#3F342C" };
const INKS: Record<CrowdInk, Inks> = { orange: INK_ORANGE, cream: INK_CREAM, dead: INK_DEAD, natural: INK_NATURAL };
const SKINS = ["#E9C6A4", "#DFB794", "#F0D2B4", "#D2A685"];
const HAIRS = ["#4B3427", "#6E4E38", "#8A6440", "#3A2A22", "#A07A52"];
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---- shared bits (front view, figure units, feet at 0) ------------------------------------------------------------
const head = (cy: number, r: number): string => `M 0 ${cy - r * 1.04} C ${r * 0.6} ${cy - r * 1.04} ${r} ${cy - r * 0.6} ${r} ${cy} C ${r} ${cy + r * 0.62} ${r * 0.65} ${cy + r * 1.04} 0 ${cy + r * 1.04} C ${-r * 0.65} ${cy + r * 1.04} ${-r} ${cy + r * 0.62} ${-r} ${cy} C ${-r} ${cy - r * 0.6} ${-r * 0.6} ${cy - r * 1.04} 0 ${cy - r * 1.04} Z`;
const shoe = (x: number, w: number, h: number, ink: string, out: number): Part => ({
  d: `M ${x - w / 2} ${-h} C ${x - w / 2} ${-h - 6} ${x + w / 2} ${-h - 6} ${x + w / 2} ${-h} C ${x + w / 2 + out * 6} ${-h * 0.4} ${x + w / 2 + out * 4} 0 ${x + out * 5} 0 L ${x - w / 2 + out * 2} 0 C ${x - w / 2 - 8} 0 ${x - w / 2 - 6} ${-h * 0.5} ${x - w / 2} ${-h} Z`,
  ink,
  g: "l",
});
const mitten = (x: number, y: number, s = 1): Part => ({ d: ell(x, y, 11 * s, 14 * s), ink: "skin" });

const man = (): Drawing => ({
  hipY: -216,
  neckY: -390,
  tilt: { body: -1.4, head: 4 },
  parts: [
    { d: limb([[-30, -236], [-34, -128], [-34, -28]], 54, 24), ink: "c3", g: "l" },
    { d: limb([[30, -236], [32, -128], [31, -28]], 54, 24), ink: "c3", g: "l" },
    shoe(-36, 22, 24, "c5", -1),
    shoe(32, 22, 24, "c5", 1),
    // jacket (open), the waistcoat and collar inside
    { d: "M -20 -390 C -40 -389 -54 -380 -58 -362 C -66 -330 -82 -290 -86 -250 C -90 -214 -86 -186 -76 -166 L -6 -162 L 0 -196 L 6 -162 L 76 -166 C 86 -186 90 -214 86 -250 C 82 -290 66 -330 58 -362 C 54 -380 40 -389 20 -390 Z", ink: "c2" },
    { d: "M -17 -388 L 17 -388 L 22 -252 L 0 -232 L -22 -252 Z", ink: "c5", sh: 0.5 },
    { d: "M -14 -392 C -6 -386 6 -386 14 -392 L 16 -378 L 4 -372 L 0 -376 L -4 -372 L -16 -378 Z", ink: "c4", sh: 0.5 },
    { d: ell(0, -330, 2.6, 2.6), ink: "c4", sh: 0 },
    { d: ell(0, -300, 2.6, 2.6), ink: "c4", sh: 0 },
    { d: ell(0, -272, 2.6, 2.6), ink: "c4", sh: 0 },
    { d: "M -18 -386 L -26 -300 L -24 -250", ink: "c2", det: 1.4, op: 0.6 },
    { d: "M 18 -386 L 26 -300 L 24 -250", ink: "c2", det: 1.4, op: 0.6 },
    { d: "M -60 -230 L -36 -230", ink: "c2", det: 1.3, op: 0.5 },
    // arms in sleeves, mitten hands
    { d: limb([[-50, -372], [-80, -300], [-72, -226]], 31, 25), ink: "c2" },
    { d: limb([[50, -372], [80, -300], [72, -226]], 31, 25), ink: "c2" },
    mitten(-72, -212),
    mitten(72, -212),
    // head, ears, flat cap, a moustache
    { d: "M -15 -404 L 15 -404 L 16 -384 L -16 -384 Z", ink: "skin", sh: 0.5 },
    { d: ell(-49, -432, 8, 11), ink: "skin", g: "h", sh: 0.5 },
    { d: ell(49, -432, 8, 11), ink: "skin", g: "h", sh: 0.5 },
    { d: head(-440, 50), ink: "skin", g: "h" },
    { d: "M -46 -448 C -20 -440 20 -440 46 -448 C 44 -440 40 -434 34 -431 C 14 -436 -14 -436 -34 -431 C -40 -434 -44 -440 -46 -448 Z", ink: "skin", g: "h", cast: true, op: 0.5 },
    { d: "M -54 -452 C -58 -482 -30 -502 4 -502 C 40 -502 66 -488 66 -470 C 66 -460 58 -456 46 -455 C 20 -453 -30 -451 -54 -452 Z", ink: "c3", g: "h" },
    { d: "M -52 -456 C -20 -450 30 -450 60 -458 C 72 -456 76 -450 70 -446 C 40 -440 -20 -440 -50 -446 Z", ink: "c5", g: "h", sh: 0.4 },
    { d: ell(4, -500, 6, 3.5), ink: "c5", g: "h", sh: 0 },
    { d: "M -15 -404 C -9 -411 -3 -409 0 -405 C 3 -409 9 -411 15 -404 C 9 -399 3 -399 0 -402 C -3 -399 -9 -399 -15 -404 Z", ink: "hair", g: "h", sh: 0.3 },
    ...faceFront(0, -426, 18, {}),
  ],
});

const girl = (): Drawing => ({
  hipY: -150,
  neckY: -262,
  tilt: { body: 1.5, head: -7 },
  parts: [
    // plaits behind the shoulders
    { d: limb([[-36, -300], [-44, -262], [-42, -226]], 14, 11), ink: "hair", g: "h", sh: 0.5 },
    { d: limb([[36, -300], [44, -262], [42, -226]], 14, 11), ink: "hair", g: "h", sh: 0.5 },
    { d: ell(-42, -222, 7, 6), ink: "c1", g: "h", sh: 0.4 },
    { d: ell(42, -222, 7, 6), ink: "c1", g: "h", sh: 0.4 },
    // stockings, boots
    { d: limb([[-16, -110], [-17, -60], [-16, -18]], 18, 14), ink: "c3", g: "l" },
    { d: limb([[16, -110], [17, -60], [15, -18]], 18, 14), ink: "c3", g: "l" },
    shoe(-17, 18, 20, "c5", -1),
    shoe(16, 18, 20, "c5", 1),
    // dress, pinafore over it
    { d: "M -14 -268 C -32 -266 -42 -256 -46 -238 C -50 -200 -60 -140 -66 -100 C -40 -92 40 -92 66 -100 C 60 -140 50 -200 46 -238 C 42 -256 32 -266 14 -268 Z", ink: "c2" },
    { d: "M -24 -246 L 24 -246 L 28 -200 C 42 -170 50 -132 54 -106 C 30 -100 -30 -100 -54 -106 C -50 -132 -42 -170 -28 -200 Z", ink: "c4", sh: 0.7 },
    { d: "M -24 -246 L -30 -264 L -24 -266 L -18 -246 Z", ink: "c4", sh: 0 },
    { d: mir("M -24 -246 L -30 -264 L -24 -266 L -18 -246 Z"), ink: "c4", sh: 0 },
    { d: "M -36 -188 C -12 -184 12 -184 36 -188", ink: "c4", det: 1.2, op: 0.45 },
    // puff sleeves and arms
    { d: ell(-44, -248, 15, 14), ink: "c2" },
    { d: ell(44, -248, 15, 14), ink: "c2" },
    { d: limb([[-48, -240], [-56, -200], [-50, -162]], 15, 13), ink: "skin" },
    { d: limb([[48, -240], [56, -200], [50, -162]], 15, 13), ink: "skin" },
    mitten(-50, -156, 0.75),
    mitten(50, -156, 0.75),
    // head, bob hair with a fringe, a ribbon
    { d: "M -10 -278 L 10 -278 L 11 -262 L -11 -262 Z", ink: "skin", sh: 0.5 },
    { d: "M 0 -364 C 32 -364 50 -344 50 -316 C 50 -296 46 -284 40 -276 L -40 -276 C -46 -284 -50 -296 -50 -316 C -50 -344 -32 -364 0 -364 Z", ink: "hair", g: "h" },
    { d: head(-316, 42), ink: "skin", g: "h" },
    { d: "M -42 -322 C -40 -348 -22 -362 0 -362 C 22 -362 40 -348 42 -322 C 30 -334 14 -336 2 -332 C -10 -336 -28 -334 -42 -322 Z", ink: "hair", g: "h", sh: 0.4 },
    { d: "M 18 -356 C 26 -370 40 -368 38 -356 C 36 -350 28 -350 22 -352 Z", ink: "c1", g: "h", sh: 0.5 },
    { d: "M 18 -356 C 14 -370 2 -370 4 -358 C 6 -352 14 -352 18 -354 Z", ink: "c1", g: "h", sh: 0.5 },
    ...faceFront(0, -310, 15, {}),
  ],
});

const oldManC = (): Drawing => ({
  hipY: -210,
  neckY: -384,
  tilt: { body: 2.2, head: -5 },
  inks: { hair: "#E2DCCF" },
  parts: [
    { d: limb([[86, -250], [88, -120], [90, 0]], 8, 7), ink: "c5", sh: 0.4 },
    { d: limb([[-24, -200], [-28, -110], [-28, -26]], 40, 24), ink: "c3", g: "l" },
    { d: limb([[24, -200], [26, -110], [25, -26]], 40, 24), ink: "c3", g: "l" },
    shoe(-29, 22, 24, "c5", -1),
    shoe(26, 22, 24, "c5", 1),
    // long coat to the knee, a scarf
    { d: "M -20 -384 C -42 -383 -56 -372 -60 -354 C -68 -320 -80 -260 -84 -200 C -86 -160 -84 -130 -80 -112 L 80 -112 C 84 -130 86 -160 84 -200 C 80 -260 68 -320 60 -354 C 56 -372 42 -383 20 -384 Z", ink: "c2" },
    { d: "M 0 -340 L 0 -114", ink: "c2", det: 1.3, op: 0.55 },
    { d: ell(-8, -300, 2.6, 2.6), ink: "c5", sh: 0 },
    { d: ell(-8, -262, 2.6, 2.6), ink: "c5", sh: 0 },
    { d: ell(-8, -224, 2.6, 2.6), ink: "c5", sh: 0 },
    { d: "M -26 -390 C -10 -380 10 -380 26 -390 L 28 -372 C 10 -364 -10 -364 -28 -372 Z", ink: "c1", sh: 0.5 },
    { d: "M 10 -372 L 22 -372 L 26 -320 L 14 -318 Z", ink: "c1", sh: 0.5 },
    // arms, the near hand on the stick
    { d: limb([[-52, -366], [-72, -296], [-66, -232]], 30, 25), ink: "c2" },
    mitten(-66, -218),
    { d: limb([[52, -366], [76, -306], [84, -262]], 30, 25), ink: "c2" },
    { d: ell(86, -252, 12, 14), ink: "skin" },
    // head: white hair at the sides, a bowler hat, a white moustache, worried brows
    { d: "M -14 -398 L 14 -398 L 15 -378 L -15 -378 Z", ink: "skin", sh: 0.5 },
    { d: ell(-47, -426, 7.5, 10.5), ink: "skin", g: "h", sh: 0.5 },
    { d: ell(47, -426, 7.5, 10.5), ink: "skin", g: "h", sh: 0.5 },
    { d: head(-434, 47), ink: "skin", g: "h" },
    { d: "M -47 -450 C -50 -430 -46 -418 -40 -412 C -40 -426 -38 -440 -32 -450 Z", ink: "hair", g: "h", sh: 0.3 },
    { d: mir("M -47 -450 C -50 -430 -46 -418 -40 -412 C -40 -426 -38 -440 -32 -450 Z"), ink: "hair", g: "h", sh: 0.3 },
    { d: "M -40 -452 C -42 -488 -22 -500 0 -500 C 22 -500 42 -488 40 -452 Z", ink: "c5", g: "h" },
    { d: "M -62 -452 C -40 -460 40 -460 62 -452 C 66 -446 62 -442 56 -442 C 30 -446 -30 -446 -56 -442 C -62 -442 -66 -446 -62 -452 Z", ink: "c5", g: "h", sh: 0.5 },
    { d: "M -40 -462 C -20 -466 20 -466 40 -462", ink: "c3", g: "h", det: 2.2, op: 0.6 },
    { d: "M -16 -398 C -10 -406 -3 -404 0 -400 C 3 -404 10 -406 16 -398 C 10 -392 3 -393 0 -396 C -3 -393 -10 -392 -16 -398 Z", ink: "hair", g: "h", sh: 0.3 },
    ...faceFront(0, -422, 16, { brows: 3, blush: false }),
  ],
});

const oldWoman = (): Drawing => ({
  hipY: -200,
  neckY: -350,
  tilt: { body: -2, head: 6 },
  inks: { hair: "#DCD5C8" },
  parts: [
    { d: ell(-18, -6, 14, 7), ink: "c5", g: "l" },
    { d: ell(20, -6, 14, 7), ink: "c5", g: "l" },
    { d: "M -50 -222 C -60 -160 -74 -80 -84 -22 C -60 -10 -30 -6 0 -9 C 30 -6 60 -10 84 -22 C 74 -80 60 -160 50 -222 Z", ink: "c3", g: "l" },
    { d: "M -20 -200 C -22 -140 -26 -80 -30 -16", ink: "c3", g: "l", det: 1.2, op: 0.4 },
    // bodice, the shawl wrapped round her shoulders and arms, hands folded
    { d: "M -18 -352 C -40 -350 -56 -338 -60 -316 C -64 -280 -58 -246 -50 -218 L 50 -218 C 58 -246 64 -280 60 -316 C 56 -338 40 -350 18 -352 Z", ink: "c2" },
    { d: "M -22 -354 C -58 -350 -80 -330 -82 -296 C -84 -266 -78 -242 -70 -228 C -46 -232 -24 -232 0 -226 C 24 -232 46 -232 70 -228 C 78 -242 84 -266 82 -296 C 80 -330 58 -350 22 -354 Z", ink: "c1" },
    { d: "M -70 -228 C -46 -232 -24 -232 0 -226 C 24 -232 46 -232 70 -228", ink: "c3", det: 1.3, op: 0.5 },
    { d: "M -30 -300 C -24 -280 -16 -262 -6 -248", ink: "c1", det: 1.3, op: 0.45 },
    { d: "M -30 -232 C -18 -238 -4 -234 4 -226 C 8 -218 0 -212 -10 -212 C -20 -212 -30 -216 -32 -222 Z", ink: "skin" },
    { d: mir("M -30 -232 C -18 -238 -4 -234 4 -226 C 8 -218 0 -212 -10 -212 C -20 -212 -30 -216 -32 -222 Z"), ink: "skin" },
    // head: white hair, a bonnet tied under the chin, round spectacles
    { d: "M -12 -366 L 12 -366 L 13 -348 L -13 -348 Z", ink: "skin", sh: 0.5 },
    { d: head(-396, 44), ink: "skin", g: "h" },
    { d: "M -42 -404 C -40 -430 -22 -442 0 -442 C 22 -442 40 -430 42 -404 C 30 -416 14 -420 0 -416 C -14 -420 -30 -416 -42 -404 Z", ink: "hair", g: "h", sh: 0.3 },
    { d: "M -50 -400 C -54 -440 -30 -462 0 -462 C 30 -462 54 -440 50 -400 C 46 -414 30 -428 0 -430 C -30 -428 -46 -414 -50 -400 Z", ink: "c2", g: "h" },
    { d: "M -46 -398 C -40 -384 -30 -370 -14 -360 L -10 -364 C -24 -374 -34 -386 -40 -400 Z", ink: "c2", g: "h", sh: 0 },
    { d: mir("M -46 -398 C -40 -384 -30 -370 -14 -360 L -10 -364 C -24 -374 -34 -386 -40 -400 Z"), ink: "c2", g: "h", sh: 0 },
    { d: "M -6 -360 C -16 -352 -22 -340 -18 -332 L -10 -334 C -10 -342 -4 -350 0 -356 Z", ink: "c2", g: "h", sh: 0.4 },
    { d: "M 6 -360 C 16 -352 22 -342 22 -334 L 14 -334 C 12 -342 8 -350 0 -356 Z", ink: "c2", g: "h", sh: 0.4 },
    ...faceFront(0, -396, 15, { brows: 2 }),
    { d: "M -24 -396 C -24 -404 -8 -404 -8 -396 C -8 -388 -24 -388 -24 -396 Z", ink: "#8C7F6E", g: "h", det: 1.4, keep: true, op: 0.8 },
    { d: "M 8 -396 C 8 -404 24 -404 24 -396 C 24 -388 8 -388 8 -396 Z", ink: "#8C7F6E", g: "h", det: 1.4, keep: true, op: 0.8 },
    { d: "M -8 -397 L 8 -397", ink: "#8C7F6E", g: "h", det: 1.3, keep: true, op: 0.8 },
  ],
});

const medMan = (): Drawing => ({
  hipY: -210,
  neckY: -384,
  tilt: { body: -1.6, head: 4 },
  parts: [
    { d: limb([[-20, -214], [-22, -110], [-21, -24]], 26, 18), ink: "c3", g: "l" },
    { d: limb([[20, -214], [21, -110], [20, -24]], 26, 18), ink: "c3", g: "l" },
    { d: "M -27 -28 C -27 -34 -12 -34 -11 -28 C -9 -12 -9 0 -15 0 L -40 0 C -54 0 -56 -5 -46 -9 C -38 -13 -31 -18 -27 -28 Z", ink: "c5", g: "l" },
    { d: mir("M -27 -28 C -27 -34 -12 -34 -11 -28 C -9 -12 -9 0 -15 0 L -40 0 C -54 0 -56 -5 -46 -9 C -38 -13 -31 -18 -27 -28 Z"), ink: "c5", g: "l" },
    // short tunic to mid-thigh, belted
    { d: "M -20 -380 C -46 -378 -62 -364 -66 -340 C -72 -290 -76 -220 -80 -150 C -50 -140 50 -140 80 -150 C 76 -220 72 -290 66 -340 C 62 -364 46 -378 20 -380 Z", ink: "c2" },
    { d: "M -72 -232 C -30 -226 30 -226 72 -232 L 72 -222 C 30 -216 -30 -216 -72 -222 Z", ink: "c5", sh: 0.4 },
    { d: "M -20 -200 C -24 -176 -28 -160 -32 -146", ink: "c2", det: 1.2, op: 0.5 },
    { d: "M 16 -200 C 18 -176 20 -160 22 -146", ink: "c2", det: 1.2, op: 0.5 },
    { d: limb([[-56, -350], [-74, -290], [-70, -232]], 28, 24), ink: "c2" },
    { d: limb([[56, -350], [74, -290], [70, -232]], 28, 24), ink: "c2" },
    mitten(-70, -218),
    mitten(70, -218),
    // the hood with its shoulder cape, a young face with a brown fringe
    { d: "M -30 -388 C -64 -384 -88 -366 -92 -336 C -94 -320 -90 -308 -82 -300 C -50 -304 50 -304 82 -300 C 90 -308 94 -320 92 -336 C 88 -366 64 -384 30 -388 Z", ink: "c1" },
    { d: "M -82 -300 C -60 -296 -30 -310 0 -306 C 30 -310 60 -296 82 -300", ink: "c3", det: 1.3, op: 0.5 },
    { d: "M 0 -484 C 40 -486 62 -458 62 -420 C 62 -398 58 -384 50 -372 L -50 -372 C -58 -384 -62 -398 -62 -420 C -62 -458 -40 -484 0 -484 Z", ink: "c1", g: "h" },
    { d: "M 0 -458 C 28 -458 42 -438 42 -414 C 42 -392 28 -376 0 -376 C -28 -376 -42 -392 -42 -414 C -42 -438 -28 -458 0 -458 Z", ink: "c5", g: "h", sh: 0 },
    { d: "M 0 -452 C 25 -452 37 -434 37 -412 C 37 -392 24 -378 0 -378 C -24 -378 -37 -392 -37 -412 C -37 -434 -25 -452 0 -452 Z", ink: "skin", g: "h" },
    { d: "M -34 -428 C -28 -446 -12 -452 0 -446 C 12 -452 28 -446 34 -428 C 22 -436 10 -436 0 -432 C -10 -436 -22 -436 -34 -428 Z", ink: "hair", g: "h", sh: 0.4 },
    ...faceFront(0, -418, 14, {}),
  ],
});

const medWoman = (): Drawing => ({
  hipY: -214,
  neckY: -372,
  tilt: { body: 1.4, head: -5 },
  parts: [
    { d: ell(-20, -5, 14, 7), ink: "c5", g: "l" },
    { d: ell(20, -5, 14, 7), ink: "c5", g: "l" },
    // long gown, belted high, long sleeves, hands clasped
    { d: "M -20 -372 C -44 -370 -58 -358 -62 -336 C -66 -290 -70 -200 -88 -22 C -60 -10 -30 -6 0 -9 C 30 -6 60 -10 88 -22 C 70 -200 66 -290 62 -336 C 58 -358 44 -370 20 -372 Z", ink: "c2" },
    { d: "M -24 -250 C -26 -170 -30 -90 -36 -16", ink: "c2", det: 1.2, op: 0.45 },
    { d: "M 22 -250 C 26 -170 32 -90 40 -16", ink: "c2", det: 1.2, op: 0.45 },
    { d: "M -62 -268 C -20 -262 20 -262 62 -268 L 62 -258 C 20 -252 -20 -252 -62 -258 Z", ink: "c3", sh: 0.4 },
    { d: limb([[-6, -258], [-4, -200], [-8, -150]], 6, 5), ink: "c3", sh: 0.3 },
    { d: limb([[-58, -350], [-66, -290], [-28, -246]], 28, 24), ink: "c2" },
    { d: limb([[58, -350], [66, -290], [28, -246]], 28, 24), ink: "c2" },
    { d: "M -30 -256 C -18 -260 -4 -256 4 -248 C 8 -240 0 -234 -10 -234 C -20 -234 -30 -238 -32 -244 Z", ink: "skin" },
    { d: mir("M -30 -256 C -18 -260 -4 -256 4 -248 C 8 -240 0 -234 -10 -234 C -20 -234 -30 -238 -32 -244 Z"), ink: "skin" },
    // the veil over the head falling to the shoulders, the white wimple framing the face
    { d: "M 0 -472 C 38 -472 60 -446 60 -412 C 60 -380 66 -358 74 -336 C 40 -346 -40 -346 -74 -336 C -66 -358 -60 -380 -60 -412 C -60 -446 -38 -472 0 -472 Z", ink: "c1", g: "h" },
    { d: "M 0 -456 C 30 -456 44 -436 44 -410 C 44 -384 34 -362 0 -356 C -34 -362 -44 -384 -44 -410 C -44 -436 -30 -456 0 -456 Z", ink: "c4", g: "h", sh: 0.6 },
    { d: "M 0 -446 C 22 -446 34 -430 34 -410 C 34 -390 22 -378 0 -378 C -22 -378 -34 -390 -34 -410 C -34 -430 -22 -446 0 -446 Z", ink: "skin", g: "h" },
    ...faceFront(0, -412, 13, {}),
  ],
});

const medChild = (): Drawing => ({
  hipY: -150,
  neckY: -262,
  tilt: { body: -1.5, head: 7 },
  parts: [
    { d: limb([[-15, -140], [-16, -70], [-15, -18]], 18, 14), ink: "c3", g: "l" },
    { d: limb([[15, -140], [16, -70], [15, -18]], 18, 14), ink: "c3", g: "l" },
    shoe(-16, 18, 20, "c5", -1),
    shoe(15, 18, 20, "c5", 1),
    { d: "M -14 -268 C -32 -266 -42 -256 -46 -238 C -52 -200 -56 -150 -58 -106 C -30 -98 30 -98 58 -106 C 56 -150 52 -200 46 -238 C 42 -256 32 -266 14 -268 Z", ink: "c2" },
    { d: "M -50 -170 C -20 -164 20 -164 50 -170 L 50 -162 C 20 -156 -20 -156 -50 -162 Z", ink: "c5", sh: 0.4 },
    { d: "M -8 -268 L 0 -244 L 8 -268", ink: "c2", det: 1.2, op: 0.5 },
    { d: limb([[-40, -252], [-52, -212], [-46, -172]], 20, 17), ink: "c2" },
    { d: limb([[40, -252], [52, -212], [46, -172]], 20, 17), ink: "c2" },
    mitten(-46, -160, 0.8),
    mitten(46, -160, 0.8),
    { d: "M -10 -278 L 10 -278 L 11 -262 L -11 -262 Z", ink: "skin", sh: 0.5 },
    { d: ell(-41, -314, 7, 9), ink: "skin", g: "h", sh: 0.5 },
    { d: ell(41, -314, 7, 9), ink: "skin", g: "h", sh: 0.5 },
    { d: head(-318, 42), ink: "skin", g: "h" },
    // a bowl cut
    { d: "M -46 -318 C -48 -350 -26 -366 0 -366 C 26 -366 48 -350 46 -318 C 40 -324 34 -328 28 -330 C 10 -332 -10 -332 -28 -330 C -34 -328 -40 -324 -46 -318 Z", ink: "hair", g: "h", sh: 0.4 },
    ...faceFront(0, -308, 15, {}),
  ],
});

const womanC = (): Drawing => {
  const w = woman(INK_ORANGE);
  // the shawl's one soft drape fold (after the shawl shape)
  const i = w.parts.findIndex((p) => p.ink === "c1" && p.d.startsWith("M -24 -378"));
  const fold: Part = { d: "M 10 -362 C 26 -340 34 -310 36 -282 L 26 -276 C 24 -306 20 -336 8 -358 Z", ink: "c1", cast: true, op: 0.4 };
  const parts = [...w.parts];
  if (i >= 0) parts.splice(i + 1, 0, fold);
  return { ...w, inks: { hair: "#6A4630", boots: "#3A2C22" }, parts };
};

const DRAW: Record<CrowdKind, () => Drawing> = {
  man,
  woman: womanC,
  boy: () => ({ ...boy(INK_CREAM), inks: { hair: "#8A6440" } }),
  girl,
  oldMan: oldManC,
  oldWoman,
  medMan,
  medWoman,
  medChild,
  medOld: () => ({ ...oldMan(INK_DEAD), inks: { beard: "#E4DED0" } }),
};
const H_UNITS: Record<CrowdKind, number> = { man: 506, woman: 474, boy: 376, girl: 368, oldMan: 502, oldWoman: 464, medMan: 486, medWoman: 474, medChild: 368, medOld: 486 };

/** a Sketch-format drawing -> paint shapes in an ink (the drawing's own inks for skin, hair, eyes) */
const toShapes = (d: Drawing, ink: Inks, skin: string, hair: string, flip: boolean): Shape[] => {
  const base: Inks = { ...VARIANTS.A.inks, ...(d.inks ?? {}), ...ink, skin, skinSh: mixHex(skin, "#8A5A44", 0.22), hair };
  const bt = (d.tilt?.body ?? 0) * (flip ? -1 : 1);
  const ht = (d.tilt?.head ?? 0) * (flip ? -1 : 1);
  return d.parts.map((p) => {
    const fill = p.ink.startsWith("#") ? p.ink : (base[p.ink] ?? "#ff00ff");
    const g = p.g ?? "b";
    const tf = g === "l" ? undefined : g === "h" ? `rotate(${bt} 0 ${d.hipY}) rotate(${ht} 0 ${d.neckY})` : `rotate(${bt} 0 ${d.hipY})`;
    const dd = flip ? mir(p.d) : p.d;
    if (p.det !== undefined) return { d: dd, fill, det: p.det, keep: p.keep || p.ink.startsWith("#"), op: p.op, tf };
    if (p.cast) return { d: dd, fill, cast: true, op: p.op, tf };
    return { d: dd, fill, sh: p.sh, op: p.op, tf };
  });
};
const mixHex = (a: string, b: string, t: number) => {
  const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};

export const crowdDrawing = (kind: CrowdKind, ink: CrowdInk, seed: number): { shapes: Shape[]; hUnits: number; wUnits: number } => {
  const d = DRAW[kind]();
  const s = ((seed % 8) + 8) % 8;
  const skin = SKINS[Math.floor(hash(s + 1) * SKINS.length)];
  const old = kind === "oldMan" || kind === "oldWoman" || kind === "medOld";
  const hair = old ? (d.inks?.hair ?? "#DCD5C8") : HAIRS[Math.floor(hash(s + 7) * HAIRS.length)];
  const flip = hash(s + 13) > 0.5;
  return { shapes: toShapes(d, INKS[ink], skin, hair, flip), hUnits: H_UNITS[kind], wUnits: 120 };
};
export const crowdSpriteReq = (kind: CrowdKind, ink: CrowdInk, seed: number, hPx: number): SpriteReq => {
  const c = crowdDrawing(kind, ink, seed);
  const s = ((seed % 8) + 8) % 8;
  return { key: `${kind}|${ink}|${s}|${Math.round(hPx)}`, shapes: c.shapes, hPx, hUnits: c.hUnits, wUnits: c.wUnits };
};
export const heightOf = (kind: CrowdKind, seed: number) => 0.96 + 0.08 * hash(seed * 3.1 + kind.length);

/** the walk-free idle: a slow sway about the feet, a breath */
export const sway = (frame: number, seed: number, fps = 30000 / 1001) => {
  const t = frame / fps;
  const ph = hash(seed) * Math.PI * 2;
  const ph2 = hash(seed + 4) * Math.PI * 2;
  return { rot: 0.9 * Math.sin((t / (5 + 1.4 * hash(seed + 2))) * 2 * Math.PI + ph), sy: 1 + 0.005 * Math.sin((t / 3.9) * 2 * Math.PI + ph2) };
};
/** the cut-1 fall, t 0..1: tips over about the outer edge of a foot (slow, then quicker under gravity), lands flat, a
 *  small settle; dir +1 = to screen right. rot in deg for blitFolk, pivot in figure units */
export const fall = (t: number, dir: 1 | -1 = 1) => {
  const u = Math.max(0, Math.min(1, t));
  const LAND = 0.74;
  let a: number;
  if (u <= LAND) {
    const s = u / LAND;
    a = 90 * (s * s * (0.35 + 0.65 * s)); // gravity: starts slow, accelerates
  } else {
    const s = (u - LAND) / (1 - LAND);
    a = 90 - 7 * Math.sin(Math.PI * Math.min(1, s * 1.15)) * (1 - s) ** 1.2; // a small bounce, settling flat
  }
  return { rot: dir * a, pivot: [dir * 24, 0] as [number, number] };
};
