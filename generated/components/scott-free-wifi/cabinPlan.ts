// ---------------------------------------------------------------------------
// cabinPlan — the rows, the cast and every passenger's gesture for TryUsStayForTech (scott-free-wifi, cut 13).
// Each passenger's pose is a pure function of two frames: when the cream Starlink signal reaches their device
// (`cream`: the device lights) and when the amber wave wakes the screen in front of them (`amber`: they settle).
// ---------------------------------------------------------------------------
import { CLOTH, FAR_REST, HAIR, SKIN, bandGrip, headToHip, type CastSpec, type PassengerPose } from "./cabinCast";
import { SEAT } from "./cabinParts";

type P2 = [number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const c = c01(t);
  return c * c * (3 - 2 * c);
};
const win = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
const lerp2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** row pitch (world px between seat backs) */
export const PITCH = 430;

export type Kind = "phone" | "laptop" | "cans";
export type CastRow = CastSpec & { kind: Kind; content?: boolean };
export const CAST: CastRow[] = [
  // row 0: bob, sage jumper, phone
  { kind: "phone", skin: SKIN.light, hair: HAIR.ink, hairStyle: "bob", top: CLOTH.sage, pants: CLOTH.brown, content: true },
  // row 1: cap, cream tee, laptop
  { kind: "laptop", skin: SKIN.deep, hair: HAIR.ink, hairStyle: "cap", cap: CLOTH.terracotta, top: CLOTH.cream, pants: CLOTH.denim, shortSleeve: true },
  // row 2: curly, oat sweater, phone
  { kind: "phone", skin: SKIN.tan, hair: HAIR.chestnut, hairStyle: "curly", top: CLOTH.oat, pants: CLOTH.moss, glasses: true },
  // row 3: bun, plum top, phone + headphones
  { kind: "cans", skin: SKIN.cream, hair: HAIR.auburn, hairStyle: "bun", top: CLOTH.plum, pants: CLOTH.slate, headphones: CLOTH.cans },
  // row 4: bald + moustache + glasses, slate jacket, laptop
  { kind: "laptop", skin: SKIN.board, hair: HAIR.grey, hairStyle: "bald", top: CLOTH.sage, pants: CLOTH.brown, glasses: true, mustache: true, content: true },
  // row 5: ponytail, terracotta top, phone
  { kind: "phone", skin: SKIN.deeper, hair: HAIR.ink, hairStyle: "pony", top: CLOTH.terracotta, pants: CLOTH.denim },
  // row 6: crop, moss shirt, phone + headphones
  { kind: "cans", skin: SKIN.light, hair: HAIR.sandy, hairStyle: "crop", top: CLOTH.moss, pants: CLOTH.oat, headphones: CLOTH.cansLight },
  // row 7: child, rust hoodie, phone
  { kind: "phone", skin: SKIN.tan, hair: HAIR.ink, hairStyle: "crop", top: CLOTH.rust, pants: CLOTH.slate, child: false },
  // row 8: curly, cream top, laptop
  { kind: "laptop", skin: SKIN.deep, hair: HAIR.ink, hairStyle: "curly", top: CLOTH.oat, pants: CLOTH.brown },
];

// --- hand targets and props (hip frame) ------------------------------------------------------------------
const HOLD: P2 = [-168, -244];
const LAP: P2 = [-128, -76];
const PHONE_REST: P2 = [LAP[0] - 4, LAP[1] + 6];
/** the tray table (the seat ahead's) in this passenger's hip frame */
export const TRAY = { x0: SEAT.tray.x0 - SEAT.hip[0] - PITCH, x1: SEAT.tray.x1 - SEAT.hip[0] - PITCH, y: SEAT.tray.y - SEAT.hip[1] };
const LAP_HINGE: P2 = [TRAY.x0 + 14, TRAY.y];
const LAP_LEN = 124;
const LID_OPEN = 104;
const KEYS: P2 = [LAP_HINGE[0] + 96, TRAY.y - 16];
const lidTip = (lid: number): P2 => {
  const th = (lid * Math.PI) / 180;
  const L = LAP_LEN * 0.86;
  return [LAP_HINGE[0] + Math.cos(th) * L, LAP_HINGE[1] - 8 - Math.sin(th) * L];
};

/** blinks: two seeded blinks per passenger, 3 frames each */
const blinkAt = (row: number, f: number) => {
  const b1 = 9 + ((row * 37) % 23);
  const b2 = b1 + 31 + ((row * 17) % 19);
  const one = (b: number) => {
    const t = f - b;
    return t < 0 || t > 3 ? 0 : t < 1.5 ? t / 1.5 : (3 - t) / 1.5;
  };
  return Math.max(one(b1), one(b2));
};

/**
 * The pose of row `row` at frame f. `cream` = the frame the cream signal reaches its device (it lights over 4
 * frames); `amber` = the frame its seatback screen wakes (the settle starts 2 frames after: cause before effect).
 */
export const poseAt = (row: number, f: number, cream: number, amber: number): PassengerPose => {
  const spec = CAST[row];
  const lit = smooth((f - cream) / 4);
  const t = f - amber;
  const blink = blinkAt(row, f);
  const amberLight = smooth(t / 8);
  if (spec.kind === "laptop") {
    // keys -> the lid's top edge (2..8), lid shuts with the hand on it (8..18), hand to the lap (17..28)
    const lid = lerp(LID_OPEN, 0, win(t, 8, 18));
    const tip = lidTip(lid);
    const toLid = win(t, 2, 8);
    const toLap = win(t, 17, 28);
    const hand = lerp2(lerp2(KEYS, tip, toLid), LAP, toLap);
    const lean = lerp(-2, 7, win(t, 14, 30));
    const tilt = lerp(-7, 3, win(t, 12, 28));
    return {
      lean,
      tilt,
      hand,
      // the screen dims as the amber wakes (before the lid shuts), so its glow never sits over the amber tile
      laptop: { hinge: LAP_HINGE, len: LAP_LEN, lid, glow: lit * (lid / LID_OPEN) * (1 - smooth(t / 7)) },
      tray: TRAY,
      smile: win(t, 18, 28),
      content: spec.content ? win(t, 22, 30) : 0,
      blink: spec.content && t > 20 ? 0 : blink,
      creamLight: lit * (lid / LID_OPEN) * (1 - smooth(t / 7)),
      keep: (lid / LID_OPEN) * (1 - smooth(t / 7)),
      amberLight,
    };
  }
  if (spec.kind === "cans") {
    // the near hand puts the phone down in the lap (1..10); the far hand rises behind the head to the headband round
    // the neck (6..11), lifts it over the head onto the ears (11..19), holds (19..21), drops back behind (21..29)
    const lean = lerp(-3, 7, win(t, 14, 28));
    const tilt = lerp(-8, 3, win(t, 4, 18));
    const cans = win(t, 11, 19);
    const gripHip = headToHip(bandGrip(cans), lean, tilt, !!spec.child);
    const gripHand: P2 = [gripHip[0] + 6, gripHip[1] - 4];
    const farHand = lerp2(lerp2(FAR_REST, gripHand, win(t, 6, 11)), FAR_REST, win(t, 21, 29));
    const down = win(t, 1, 10);
    const hand = lerp2(HOLD, LAP, down);
    const placed = t >= 10;
    return {
      lean,
      tilt,
      hand,
      farHand,
      phone: placed ? { at: PHONE_REST, angle: 98, glow: 0 } : { at: [hand[0] - 4 * down, hand[1] + 6 * down], angle: lerp(14, 98, down), glow: lit * (1 - smooth(t / 9)) },
      cans,
      smile: win(t, 18, 28),
      content: 0,
      blink,
      creamLight: lit * (1 - smooth(t / 9)),
      keep: 1 - smooth(t / 9),
      amberLight,
    };
  }
  // phone: to the lap, face down (2..15), lean back (6..22)
  const down = win(t, 2, 15);
  const hand = lerp2(HOLD, LAP, down);
  const lean = lerp(-3, 7, win(t, 6, 22));
  const tilt = lerp(-8, 3, win(t, 4, 18));
  return {
    lean,
    tilt,
    hand,
    phone: { at: [hand[0] - 4 * down, hand[1] + 6 * down], angle: lerp(14, 98, down), glow: lit * (1 - smooth((t - 1) / 11)) },
    smile: win(t, 8, 18),
    content: spec.content ? win(t, 14, 22) : 0,
    blink: spec.content && t > 12 ? 0 : blink,
    creamLight: lit * (1 - smooth((t - 1) / 11)),
    keep: 1 - smooth((t - 1) / 11),
    amberLight,
  };
};

/** the probe's two states: 0 = trying (device lit cream), 1 = settled (screen amber) */
export const poseFor = (row: number, state: number) => (state < 0.5 ? poseAt(row, 50, 0, 1000) : poseAt(row, 200, 0, 100));
