// ---------------------------------------------------------------------------
// executionScale — the balance of ExecutionOutweighs (nik-any-idea, cut 4): geometry, the beam's physics and
// the blocks' falls, pure (no React), so the component and the probe scripts read the same numbers.
//
// WORLD px = SCREEN px at the wide camera (k 1, look (540, 960)).
// The beam turns about PIVOT by THETA (degrees; + = the RIGHT end down). Its angular motion is a damped
// spring toward the torque angle of the weights on the pans (THETA_MAX x tanh(dm / SOFT), dm = right - left),
// integrated on the frame clock with substeps from F_SIM0 (the opening rock is already running on f0).
// A block's contact adds an angular kick on its contact frame: the beam's first reaction is the next frame.
// Pans hang plumb from the beam ends (translation only).
//
// SIZE (revision 1): a tall scale. The right pan's pile is a 4-3-2-1 pyramid of ten 80 x 68 blocks; the
// hanger triangle (rods from the rim at +-ROD_AT to the hook, HANG tall) clears every row's top corners by
// >= 6 px, which sets the pan's width and the hangers' length; the arm is the shortest that keeps the low
// pan's inner edge clear of the base at the deepest tilt.
// ---------------------------------------------------------------------------

export const PIVOT = { x: 540, y: 422 } as const;
/** half the beam: pivot to the hanger hook */
export const ARM = 292;
/** hook to the pan's top surface (the pan hangs this far below the beam end) */
export const HANG = 468;
/** the pan: top surface half-width, bottom half-width, depth */
export const PAN = { top: 216, bottom: 160, depth: 52 } as const;
/** where the hanger rods meet the pan rim (half-width at the pan's top) */
export const ROD_AT = 213;
export const ROD_W = 16;
/** the block: an amber crate */
export const BLOCK = { w: 80, h: 68, gap: 4 } as const;

// --- the weights --------------------------------------------------------------------------------------
export const M_IDEA = 1;
export const M_BLOCK = 1; // one block of execution balances the idea; the other nine tip it
export const THETA_MAX = 20.5;
export const THETA_IDEA = -4; // the bulb alone: left down a little (the idea has weight)
export const SOFT = 1 / Math.atanh(Math.abs(THETA_IDEA) / THETA_MAX);
export const thetaFor = (dm: number) => THETA_MAX * Math.tanh(dm / SOFT);

// --- the blocks ---------------------------------------------------------------------------------------
// the 4-3-2-1 pyramid on the right pan: slot (dx from the pan centre, row), in landing order
const P = BLOCK.w + BLOCK.gap;
export const SLOTS: { dx: number; row: number }[] = [
  { dx: -1.5 * P, row: 0 },
  { dx: 1.5 * P, row: 0 },
  { dx: -0.5 * P, row: 0 },
  { dx: 0.5 * P, row: 0 },
  { dx: -P, row: 1 },
  { dx: P, row: 1 },
  { dx: 0, row: 1 },
  { dx: -0.5 * P, row: 2 },
  { dx: 0.5 * P, row: 2 },
  { dx: 0, row: 3 },
];
/** contact frames: the frame a block's foot touches the pan or the blocks under it */
export const CONTACT = [47, 48, 48, 47, 50, 51, 50, 52, 53, 55] as const;
/** the fall: a block enters from just above the frame's top edge already moving (V0), speeds up (G) and
 *  falls at a terminal speed VT (world px / frame; the house cap on a mover is ~70 screen px / frame) */
// `from` is 190 world px higher than the frame top because the cut is drawn 190 px lower (StoutStage dy, Nov 13);
// at the fall the camera is at k 1, so the block still enters from just above the frame's top edge.
export const FALL = { from: -2 - 190, v0: 54, g: 6, vt: 66 } as const;
const T1 = (FALL.vt - FALL.v0) / FALL.g; // frames to reach the terminal speed
const S1 = FALL.v0 * T1 + 0.5 * FALL.g * T1 * T1;
/** distance fallen t frames after entering */
export const fallDist = (t: number) =>
  t <= 0 ? 0 : t <= T1 ? FALL.v0 * t + 0.5 * FALL.g * t * t : S1 + FALL.vt * (t - T1);
/** frames to fall a distance d */
export const fallTime = (d: number) =>
  d <= S1 ? (-FALL.v0 + Math.sqrt(FALL.v0 * FALL.v0 + 2 * FALL.g * d)) / FALL.g : T1 + (d - S1) / FALL.vt;

// --- the spring --------------------------------------------------------------------------------------
export const OMEGA_IDEA = (2 * Math.PI) / 24; // rad / frame: the bulb alone rocks on a 24-frame period
export const OMEGA_LOAD = (2 * Math.PI) / 15; // the loaded beam answers faster
/** damping: light while the bulb rocks alone (it rocks, then settles), heavier once the blocks pile on
 *  (eased over f28-36, where the beam is already at rest: no visible change) */
export const ZETA_IDEA = 0.25;
export const ZETA_LOAD = 0.7;
const loadMix = (f: number) => Math.max(0, Math.min(1, (f - 36) / 8));
export const zetaAt = (f: number) => ZETA_IDEA + (ZETA_LOAD - ZETA_IDEA) * loadMix(f);
export const omegaAt = (f: number) => OMEGA_IDEA + (OMEGA_LOAD - OMEGA_IDEA) * loadMix(f);
export const KICK = 0.35; // deg / frame added on contact (the small dip of each landing)
/** "important" (f26): a small dip of the idea's pan (an angular kick toward left-down, deepest ~f26) */
export const DIP = { f: 21, kick: -0.95 } as const;
export const F_SIM0 = -5;
export const THETA_START = -1.5; // at F_SIM0, at rest, nearly level: the bulb was just set down (the rock is running on f0)
const SUB = 16;

export const landedAt = (f: number) => CONTACT.filter((c) => c <= f).length;
export const targetAt = (f: number) => thetaFor(M_BLOCK * landedAt(f) - M_IDEA);

/** THETA per frame, f = F_SIM0 .. f1 (index f - F_SIM0). */
export const simulate = (f1: number) => {
  const out: { th: number; w: number }[] = [];
  let th = THETA_START;
  let w = 0;
  for (let f = F_SIM0; f <= f1; f++) {
    out.push({ th, w });
    // contact on frame f: the kick acts from here on (first visible reaction f + 1)
    if ((CONTACT as readonly number[]).includes(f)) w += KICK * CONTACT.filter((c) => c === f).length;
    if (f === DIP.f) w += DIP.kick; // "important": the idea presses its pan down a little
    const tgt = targetAt(f);
    const zeta = zetaAt(f);
    const om = omegaAt(f);
    const h = 1 / SUB;
    for (let i = 0; i < SUB; i++) {
      const a = om * om * (tgt - th) - 2 * zeta * om * w;
      w += a * h;
      th += w * h;
    }
  }
  return out;
};

// --- the state per frame ------------------------------------------------------------------------------
const SIM = simulate(120);
export const thetaAt = (f: number) => {
  const i = Math.max(0, Math.min(SIM.length - 2, f - F_SIM0));
  const a = Math.floor(i);
  return SIM[a].th + (SIM[a + 1].th - SIM[a].th) * (i - a);
};
/** the beam's ends (the hanger hooks) at frame f */
export const endsAt = (f: number) => {
  const r = (thetaAt(f) * Math.PI) / 180;
  const c = Math.cos(r) * ARM;
  const s = Math.sin(r) * ARM;
  return { L: { x: PIVOT.x - c, y: PIVOT.y - s }, R: { x: PIVOT.x + c, y: PIVOT.y + s }, deg: thetaAt(f) };
};

export type BlockState = { x: number; foot: number; landed: boolean; falling: boolean; lift: number; start: number };
/** block i at frame f: falling (entered at `start` from just above the frame's top edge, x over its slot at
 *  contact), landed (rides the pan), or null (not yet entered) */
export const blockAt = (i: number, f: number): BlockState | null => {
  const c = CONTACT[i];
  const s = SLOTS[i];
  const restFoot = (ff: number) => endsAt(ff).R.y + HANG - s.row * BLOCK.h;
  const yc = restFoot(c);
  const start = c - fallTime(yc - FALL.from);
  if (f < start) return null;
  if (f >= c) return { x: endsAt(f).R.x + s.dx, foot: restFoot(f), landed: true, falling: false, lift: 0, start };
  const foot = FALL.from + fallDist(f - start);
  // its shadow: float while it falls, settling toward rest over the last frames
  const u = Math.max(0, Math.min(1, (f - (c - 3)) / 3));
  return { x: endsAt(c).R.x + s.dx, foot, landed: false, falling: true, lift: 1 - u * u * (3 - 2 * u), start };
};
export const blockRect = (b: BlockState) => ({ x: b.x - BLOCK.w / 2, y: b.foot - BLOCK.h, w: BLOCK.w, h: BLOCK.h });
