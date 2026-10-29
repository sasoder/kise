// ---------------------------------------------------------------------------
// saddamPovCam: the pure half of cut 26 (SaddamsPointOfView): its camera, the portrait's place in the world and the
// Iraqi fields' lit timeline. No React, no fonts: bun can import it for probes. Everything about cut 12 is READ from
// gulfMapCore (CUT12_END_CAM, cut12Track), never copied, so a change there flows into this cut's f0.
// ---------------------------------------------------------------------------
import {
  CUT12_END_CAM,
  CUT12_END_FRAME,
  IRAQ_FIELDS,
  camFrom,
  c01,
  cut12Track,
  groundAt,
  toScreen,
  type Cam,
  type FieldKey,
  type P2,
} from "./gulfMapCore";
import { FIELDS } from "./gulfMapData";

export const DURATION = 68;
/** this cut's frame 0 is cut 12's last frame: the absolute frame (air, grain, the fields' breathing, the tanks' idle) */
export const ABS0 = CUT12_END_FRAME;

// ===================================================================================================================
// THE CAMERA: one eased pull-back and tilt-up out of cut 12's last frame to the wide
// ===================================================================================================================
/** the wide (absolute map framing): looking a touch east of south down the invasion route from over Iraq, the target
 *  pulled north toward Basra, D doubled, the pitch halved; the horizon comes into the top third for the portrait and
 *  all nine fields sit in one glowing cluster in y ~650-1070, above the upper caption band */
export const WIDE = { tx: -32, ty: 0, tz: -175, D: 250, pitch: 27, yaw: 176 };
type Ch = [number, number, number, number, number, number]; // tx, ty, tz, lnD, pitch, yaw
const chOf = (c: Cam): Ch => [c.T[0], c.T[1], c.T[2], Math.log(c.D), c.pitch, c.yaw];
const E0 = chOf(CUT12_END_CAM);
/** cut 12's motion on its last frame, per frame (continued here so the join has no kink) */
const E1 = chOf(cut12Track.camAt(CUT12_END_FRAME + 1));
export const V0: Ch = E0.map((v, i) => E1[i] - v) as Ch;
const W1: Ch = [WIDE.tx, WIDE.ty, WIDE.tz, Math.log(WIDE.D), WIDE.pitch, WIDE.yaw];
/** the move's progress 0..1: a critically damped response (still at f0, fastest ~f10, settling ~f50, a creep to the
 *  end); A sets how front-loaded it is */
const A = 6.5;
const N = 1 - (1 + A) * Math.exp(-A);
export const progress = (f: number) => {
  const t = Math.max(0, f) / DURATION;
  return (1 - (1 + A * t) * Math.exp(-A * t)) / N;
};
export const chAt = (f: number): Ch => {
  const p = progress(f);
  return E0.map((e, i) => e + (W1[i] - e) * p + V0[i] * f * (1 - p)) as Ch;
};
export const camAt = (f: number): Cam => {
  if (f <= 0) return CUT12_END_CAM;
  const q = chAt(f);
  return camFrom(q[0], q[1], q[2], Math.exp(q[3]), q[4], q[5]);
};
export const WIDE_CAM: Cam = camAt(DURATION - 1);

// ===================================================================================================================
// THE PORTRAIT: a giant mural standing far out in the haze beyond Kuwait (south, toward Saudi Arabia), an upright
// sprite anchored at a ground point B and sized in world km, so it moves with the world under the camera. Units below
// are the SOURCE photo's px (the 1462x1080 ITN frame).
// ===================================================================================================================
export const FACE_SRC_X = 780;
export const HEAD_TOP_SRC = 72;
/** the final framing on the wide: the face's column, the top of his hair, the scale (screen px per source px) */
export const PORTRAIT_END = { x: 500, headTop: 232, k: 0.6 };
/** the base line on screen at the wide (the ground line he stands behind: everything below it is nearer ground) */
export const BASE_Y = 640;
/** the source row that sits on the base line when he has landed, and the dissolve's height above it */
export const BASE_SRC = HEAD_TOP_SRC + (BASE_Y - PORTRAIT_END.headTop) / PORTRAIT_END.k;
export const FADE_SRC = 150;
export const B: P2 = groundAt(WIDE_CAM, PORTRAIT_END.x, BASE_Y) as P2;
/** km per source px: the sprite's world size */
export const KM_PER_SRC = PORTRAIT_END.k / toScreen(WIDE_CAM, B[0], 0, B[1]).s;
/** the rise, timed on SCREEN so the landing never overshoots: the top of his hair goes from just under the base line
 *  (hidden) at f12 to y HOLD.y0 by f39 (cubic-bezier 0.3, 0, 0.2, 1), then keeps creeping up a hair to HOLD.y1 at the
 *  last frame while the camera settles (he goes on emerging from the haze as the world sinks under him) */
export const RISE = { f0: 12, f1: 39 };
export const HOLD = { y0: PORTRAIT_END.headTop + 8, y1: PORTRAIT_END.headTop - 2 };
const bez = (t: number) => {
  // cubic-bezier(0.3, 0, 0.2, 1) solved for x = t
  const x1 = 0.3;
  const x2 = 0.2;
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t;
    const dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
    u = Math.max(0, Math.min(1, u - x / Math.max(1e-6, dx)));
  }
  return 3 * (1 - u) * u * u + u * u * u;
};
/** the mural looms a hair after it lands (scale), and breathes */
export const loomAt = (f: number) => 1 + 0.012 * c01((f - 34) / 60) + 0.0025 * Math.sin((f - 30) * 0.16) * c01((f - 36) / 10);
/** the portrait's screen placement at a frame: base line (x, y), scale k (screen px per source px), lift (source px
 *  the photo still sits below its landed place in the world; it is what the base line hides), the hair's top y */
export const portraitAt = (cam: Cam, f: number) => {
  const s = toScreen(cam, B[0], 0, B[1]);
  const k = s.s * KM_PER_SRC * loomAt(f);
  const landed = s.y - (BASE_SRC - HEAD_TOP_SRC) * k;
  const hidden = s.y + 14 * k;
  const hold = HOLD.y0 + (HOLD.y1 - HOLD.y0) * c01((f - RISE.f1) / (DURATION - 1 - RISE.f1));
  const u = c01((f - RISE.f0) / (RISE.f1 - RISE.f0));
  const head = f <= RISE.f0 ? hidden : hidden + (hold - hidden) * bez(u);
  return { baseX: s.x, baseY: s.y, k, z: s.z, lift: Math.max(0, (head - landed) / k), head };
};

// ===================================================================================================================
// IRAQ'S FIELDS: they light one after another (staggered nearest the border first: Rumaila, Zubair, West Qurna,
// Majnoon), each no earlier than a few frames after its heart has come well into the frame (never lit as a sliver at
// the edge). With the wide as built: Zubair f8, Rumaila f14, Majnoon f18, West Qurna f21.5; all fully lit by ~f40.
// ===================================================================================================================
const ORDER: FieldKey[] = ["rumaila", "zubair", "westQurna", "majnoon"];
const STAGGER = [3, 8, 14, 18];
export const IRAQ_RAMP = 18;
const onScreenFrom = (k: FieldKey) => {
  for (let f = 0; f < DURATION; f += 0.5) {
    const c = FIELDS[k].centre;
    const s = toScreen(camAt(f), c[0], 0, c[1]);
    if (s.z > 0 && s.y < 1780 && s.x > 160 && s.x < 920) return f;
  }
  return DURATION;
};
export const IRAQ_ENTRY: Record<string, number> = Object.fromEntries(ORDER.map((k, i) => [k, Math.max(STAGGER[i], onScreenFrom(k) + 3)]));
export const iraqLitAt = (k: FieldKey, f: number) => {
  const u = c01((f - IRAQ_ENTRY[k]) / IRAQ_RAMP);
  return 1 - Math.pow(1 - u, 2.2);
};
if (IRAQ_FIELDS.some((k) => !ORDER.includes(k))) throw new Error("saddamPovCam: an Iraqi field has no entry");
