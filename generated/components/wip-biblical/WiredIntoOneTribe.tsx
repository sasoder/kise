// ---------------------------------------------------------------------------
// WiredIntoOneTribe (wip-biblical, cut 43). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx). The globe, wires and ring live in ./globeShared.tsx.
// Opaque 1080x1920, 24 fps, 185 frames.
//
// CHECK LINE: "Electric wires pulled the separated people back into one circle, this time the size of the Earth." With no
// sound: red wires flash between continents instantly, period listeners at the ends get joined, and a red ring closes
// round the whole globe.
//
// THE LINE: "Its instantaneous global nature meant that man began to be reintegrated within a tribal consciousness, this
// one spanning the entire globe." ("Its" = electronic media from the 19th century on: telegraph, cable, radio.)
// WORD -> FRAME: Its 0 · instantaneous 3 · global 18 · nature 33 · meant 44 · that 52 · man 57 · began 61 · to 69 · be 75 ·
// reintegrated 78 · within 99 · a 106 · tribal 110 · consciousness 117 · this 135 · one 145 · spanning 150 · the 158 ·
// entire 166 · globe 171
// DURATION: the slot 43.000 -> 50.708 s = 7.708 s x 24 = 185 frames (f0..f184).
//
// THE MOTION: one camera pull-back. It opens close on a field telegrapher in his tent at a Morse key, the tent pitched
// on the rim of a printed globe at London; on "instantaneous" a red wire leaves his key and crosses the Atlantic at one
// fast, constant speed, and the camera eases back to the whole globe while the 1901 cables follow, one every 8 frames.
// Then three listeners rise from behind the globe's rim at the far ends (New York, Bombay, the line to Singapore and
// Sydney), each joined by its wire, and on "this one spanning the entire globe" a red ring draws closed round the globe,
// behind the people, from the operator back to him. The globe turns about 4 degrees over the cut; the camera creeps.
// Contact frames: wire tips leave the key f3 (Atlantic) and f18 (Suez); branch tips leave Lisbon f26, Bombay f34,
// New York f42. Listeners start to rise f52, f72, f92 (first visible ~6 frames later, out 18 frames after the start); each
// tail leaves its route's end 14 frames after the rise starts, runs over the globe to the rim under the listener and up to
// the earphone or set, touching it 2-3 frames later. Ring f135 -> closed f171. Camera: the pull-back is anchored on the
// tent (k 4.6 -> 1.0, settled ~f40); then a creep to k 1.03 about the tent.
// PEOPLE: every print stands behind the globe with its cut edges (the photo's bottom, and the chair's straight edge on
// the 1938 telegrapher and Mrs Hult-Nylander) below the limb, solved per print so no cut edge is ever seen; the tent's
// ground is bent to the rim's curve (scripts/clips/wip-biblical/bake-w43-tent.py) so it sits on it.
// SPOT INK: red = the bond (the wires and the ring); indigo = the graticule and the limb. No text.
//
// SOURCES (animation_source/assets_raw/globe/): Earth: NASA Blue Marble Next Generation, topography and bathymetry,
// June 2004 (21600 px; public domain), baked by scripts/clips/wip-biblical/bake-globe-43.py. Cables: checked against the
// Eastern Telegraph Co.'s "System and its General Connections" map (1901, A.B.C. Telegraphic Code 5th ed., PD); the
// New York - Buenos Aires line follows the coast cables shown on it (West India & Panama, Western & Brazilian, River Plate).
// People: British field telegrapher, Klip Drift 1900, Underwood stereograph (Rijksmuseum, CC0); railroad telegrapher at
// work with headphones, Worthington, Ohio, 1938 (Don O'Brien, CC BY 2.0); Elsa Hult-Nylander with headphones, Helsinki
// 1937 (Finnish Heritage Agency, CC BY 4.0); Anne Pennington at a radio set, Wireless Age 1922 (PD). Mattes: Apple
// Vision; grade: scripts/clips/wip-anthropic/bake-photo.py. Mirrored: the tent and Pennington (no lettering in either).
// ---------------------------------------------------------------------------
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, CutOut, INDIGO, InkPrint, PaperGround, RED, WipCam, WipFilmLife, WipPlane, runWipCamera, slide } from "../kits/works-in-progress/wipShared";
import {
  CITIES,
  EarthPrint,
  GLOBE_R,
  GLOBE_X,
  GLOBE_Y,
  GRATICULE,
  InkLines,
  RING_R,
  RING_W,
  WIRE_W,
  geoD,
  globePoint,
  globeProjection,
  globeRotate,
  routeById,
  routeExit,
  wireLength,
  wirePartial,
} from "./globeShared";

export const FPS = 24;
export const DURATION = 185;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// -- the people (settled world px = screen px), placed by the tuck solver -----------------------------------------------------
type Person = {
  id: string;
  src: string;
  aspect: number;
  w: number;
  x: number;
  y: number;
  /** CSS degrees, clockwise: leaning a little along the rim's normal */
  rotate: number;
  flipX?: boolean;
  /** the rim direction it rises along (math degrees, y up) */
  theta: number;
  enter: number;
  /** where the wire meets the print: fraction of the unflipped image (0..1, 0..1) */
  plug: [number, number];
  route?: string;
};

// theta / tilt / tuck per print solved offline: every cut edge >= 4 px inside the limb at rest
export const OPERATOR: Person = {
  id: "operator",
  src: "wip-biblical/w43_operator_arc.png",
  aspect: 1.1517,
  w: 180,
  x: 496.2,
  y: 183.6,
  rotate: -8,
  flipX: true,
  theta: 98,
  enter: -999,
  plug: [0.754, 0.7], // his hand on the key
};
export const LISTENERS: Person[] = [
  {
    id: "newYork",
    src: "wip-biblical/w43_operator1938.png",
    aspect: 0.8272,
    w: 152,
    x: 330.7,
    y: 285.7,
    rotate: -22,
    theta: 135,
    enter: 52,
    plug: [0.44, 0.16], // his earphone
    route: "atlantic",
  },
  {
    id: "bombay",
    src: "wip-biblical/w43_elsa.png",
    aspect: 0.9622,
    w: 155,
    x: 702.4,
    y: 254.2,
    rotate: 6,
    theta: 56,
    enter: 72,
    plug: [0.3, 0.18], // her earphone
    route: "suez",
  },
  {
    id: "east",
    src: "wip-biblical/w43_anne.png",
    aspect: 0.67,
    w: 122,
    x: 806.1,
    y: 438.4,
    rotate: 14,
    flipX: true,
    theta: 12,
    enter: 92,
    plug: [0.6, 0.47], // the radio set
    route: "eastern",
  },
];
const RISE = 18; // frames, paper's ease
const HIDE = 170; // world px a print starts back along its normal: wholly behind the disc

const plugAt = (p: Person, at = { x: p.x, y: p.y }) => {
  const h = p.w / p.aspect;
  let lx = (p.plug[0] - 0.5) * p.w;
  const ly = (p.plug[1] - 0.5) * h;
  if (p.flipX) lx = -lx;
  const t = (p.rotate * Math.PI) / 180;
  return { x: at.x + lx * Math.cos(t) - ly * Math.sin(t), y: at.y + lx * Math.sin(t) + ly * Math.cos(t) };
};
const personAt = (p: Person, frame: number) => {
  const t = slide(frame, p.enter, RISE);
  const a = (p.theta * Math.PI) / 180;
  return { x: p.x - Math.cos(a) * HIDE * (1 - t), y: p.y + Math.sin(a) * HIDE * (1 - t) };
};
const KEY = plugAt(OPERATOR);

// -- the camera: one pull-back off the tent to the whole globe, then a creep --------------------------------------------------
// The tent is the anchor: its screen position runs on the same progress as the zoom (log k), from the top band's middle at
// f0 to its settled place, so it never leaves the frame on the way out. The progress is the kit's damped follower on one
// eased key (moving at f0, settled about f40); a slow linear creep (k x 1.03 by the end) scales about the tent.
const K0 = 4.6; // the tent ~37 % of the frame height at f0, the man at his key in the middle of it
const S0 = { x: 540, y: 470 }; // the tent's centre on screen at f0
const PULL_END = 34;
const progress = runWipCamera(
  [
    { f: -14, x: 0, y: 0, k: 1 },
    { f: -4, x: 0, y: 0, k: 1 },
    { f: PULL_END, x: 1, y: 0, k: 1 },
  ],
  DURATION,
);
const CREEP = 0.03;
export const camAt = (frame: number): WipCam => {
  const p = progress(frame).x;
  const creep = 1 + CREEP * Math.min(1, Math.max(0, (frame - 20) / (DURATION - 20)));
  const k = K0 ** (1 - p) * creep;
  const sx = S0.x + (OPERATOR.x - S0.x) * p;
  const sy = S0.y + (OPERATOR.y - S0.y) * p;
  const c0 = { x: OPERATOR.x - (S0.x - 540) / K0, y: OPERATOR.y - (S0.y - 960) / K0 };
  return { x: OPERATOR.x - (sx - 540) / k, y: OPERATOR.y - (sy - 960) / k, k, x0: c0.x, y0: c0.y };
};

// -- the wires: every tip at one speed ------------------------------------------------------------------------------------------
const SPEED = 75; // world px per frame
const WIRES: { id: string; start: number; lead: boolean }[] = [
  { id: "atlantic", start: 3, lead: true },
  { id: "suez", start: 18, lead: true },
  { id: "westafrica", start: 26, lead: false },
  { id: "eastern", start: 34, lead: false },
  { id: "southamerica", start: 42, lead: false },
];
const TAIL_DELAY = 14;

// ink box (world px) holding the globe, ring, wires and tails
const PAD = 200;
const BX = GLOBE_X - RING_R - PAD;
const BY = GLOBE_Y - RING_R - PAD;
const BW = 2 * (RING_R + PAD);

// -- the ring: drawn by one tip from behind the operator, round past every listener, closing on "globe" ------------------------
export const RING_START = 135;
export const RING_END = 171;
const RING_FROM = OPERATOR.theta;
const ringD = (sweep: number) => {
  const cx = GLOBE_X - BX;
  const cy = GLOBE_Y - BY;
  const n = Math.max(2, Math.ceil(sweep / 1.5));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = ((RING_FROM + (sweep * i) / n) * Math.PI) / 180;
    d += `${i === 0 ? "M" : "L"}${(cx + RING_R * Math.cos(a)).toFixed(3)} ${(cy - RING_R * Math.sin(a)).toFixed(3)}`;
  }
  return d;
};

/** The people stand behind the globe: their plane is clipped by the disc (world px). */
const DISC_CLIP = `path(evenodd, "M-4000 -4000H5000V5000H-4000Z M${GLOBE_X + GLOBE_R} ${GLOBE_Y}A${GLOBE_R} ${GLOBE_R} 0 1 0 ${GLOBE_X - GLOBE_R} ${GLOBE_Y}A${GLOBE_R} ${GLOBE_R} 0 1 0 ${GLOBE_X + GLOBE_R} ${GLOBE_Y}Z")`;

const seg = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) =>
  `M${a.x - BX} ${a.y - BY}L${a.x + (b.x - a.x) * t - BX} ${a.y + (b.y - a.y) * t - BY}`;

const WiredIntoOneTribe: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const rot = globeRotate(frame);
  const proj = globeProjection(rot, GLOBE_X - BX, GLOBE_Y - BY, GLOBE_R);
  const london = globePoint(CITIES.london as [number, number], rot);

  const wirePaths: string[] = [];
  for (const w of WIRES) {
    let s = (frame - w.start) * SPEED;
    if (s <= 0) continue;
    if (w.lead) {
      const lead = Math.hypot(london.x - KEY.x, london.y - KEY.y);
      wirePaths.push(seg(KEY, london, Math.min(1, s / lead)));
      s -= lead;
      if (s <= 0) continue;
    }
    wirePaths.push(geoD(proj, wirePartial(routeById(w.id).path, s).line));
  }
  // the tails: over the globe's surface from the route's end (or where it turns away) to the rim under the listener,
  // then up off the rim to their earphone or set
  const world = globeProjection(rot);
  for (const p of LISTENERS) {
    let s = (frame - p.enter - TAIL_DELAY) * SPEED;
    if (s <= 0) continue;
    const start = routeExit(routeById(p.route ?? "").path, rot).lonlat;
    const plug = plugAt(p, personAt(p, frame));
    const d = Math.hypot(plug.x - GLOBE_X, plug.y - GLOBE_Y);
    const rimXY = { x: GLOBE_X + ((plug.x - GLOBE_X) / d) * GLOBE_R * 0.994, y: GLOBE_Y + ((plug.y - GLOBE_Y) / d) * GLOBE_R * 0.994 };
    const rimLL = world.invert([rimXY.x, rimXY.y]) as [number, number];
    const leg: [number, number][] = [start, rimLL];
    const legLen = wireLength(leg);
    wirePaths.push(geoD(proj, wirePartial(leg, Math.min(s, legLen)).line));
    s -= legLen;
    if (s <= 0) continue;
    wirePaths.push(seg(rimXY, plug, Math.min(1, s / Math.hypot(plug.x - rimXY.x, plug.y - rimXY.y))));
  }
  const ringSweep = interpolate(frame, [RING_START, RING_END], [0, 360], clamp);

  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        {/* the ring, under the people: it runs behind them */}
        <WipPlane cam={cam} ink>
          {ringSweep > 0 ? (
            <InkLines x={BX} y={BY} w={BW} h={BW} ink={RED} seed="ring43" rough={1}>
              {ringSweep >= 360 ? (
                <circle cx={GLOBE_X - BX} cy={GLOBE_Y - BY} r={RING_R} fill="none" stroke="currentColor" strokeWidth={RING_W} />
              ) : (
                <path d={ringD(ringSweep)} fill="none" stroke="currentColor" strokeWidth={RING_W} strokeLinecap="butt" />
              )}
            </InkLines>
          ) : null}
        </WipPlane>
        <WipPlane cam={cam} style={{ clipPath: DISC_CLIP }}>
          {[OPERATOR, ...LISTENERS].map((p) => {
            if (frame < p.enter) return null;
            const at = p.enter < 0 ? { x: p.x, y: p.y } : personAt(p, frame);
            return <CutOut key={p.id} src={p.src} x={at.x} y={at.y} w={p.w} aspect={p.aspect} rotate={p.rotate} flipX={p.flipX} border={5} seed={p.id} />;
          })}
        </WipPlane>
        <EarthPrint cam={cam} rotate={rot} />
        <WipPlane cam={cam} ink>
          <InkPrint x={BX} y={BY} w={BW} h={BW} ink={INDIGO} seed="grat43" rough={0.8} wear={0.3} misregister={0}>
            <svg width={BW} height={BW} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <path d={geoD(proj, GRATICULE)} fill="none" stroke="currentColor" strokeWidth={1.1} opacity={0.55} />
              <circle cx={GLOBE_X - BX} cy={GLOBE_Y - BY} r={GLOBE_R} fill="none" stroke="currentColor" strokeWidth={1.6} />
            </svg>
          </InkPrint>
          {wirePaths.length > 0 ? (
            <InkLines x={BX} y={BY} w={BW} h={BW} ink={RED} seed="wires43" rough={0.9}>
              <path d={wirePaths.join(" ")} fill="none" stroke="currentColor" strokeWidth={WIRE_W} strokeLinecap="round" strokeLinejoin="round" />
            </InkLines>
          ) : null}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default WiredIntoOneTribe;
