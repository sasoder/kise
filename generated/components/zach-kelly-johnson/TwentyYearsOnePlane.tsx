// ---------------------------------------------------------------------------
// TwentyYearsOnePlane (zach-kelly-johnson, cut 6). Core Memory podcast, ARCHIVE COLLAGE (footage-matched variant)
// on the clip's shared module ./archiveShared. Opaque 1080x1920, 23.976 fps, 89 frames.
//
// CHECK LINE: "Today one new aircraft just sits in the hall while the calendar pages fly off for twenty years —
// only then does it roll out."
//
// THE LINE: "Nowadays, it takes 20 years to put a new aircraft into production."
// WORD -> FRAME (local onset): Nowadays -1 (under way at f0) · it 9 · takes 12 · 20 17 · years 22 · to 30 · put 38 ·
//   a 47 · new 50 · aircraft 52 · into 65 · production 71 · speech ends ~85 · cut at f89.
// DURATION: the slot 6.339667 -> 10.051708 s (sequence frames 152 -> 241) = 3.712 s x 23.976 = 89 frames (f0..f88).
//
// THE MOTION: one slow dolly push into the archive assembly hall runs the whole slot (k 1.0 -> 1.30, already moving
// at f0, a slow drift left and up, never following the roll), with parallax between the hall (and the calendar hung on its central column) and the lone aircraft standing in the
// middle of the floor. The tear-off calendar sheds one page per year, 2006 -> 2026, as ONE stream: a page is mid-tear
// at f0, the cadence speeds into a flurry through "20 years" (f15-40, about a page every 2 frames, several in the air
// at once), then slows so the last read: 2024 shows ~f53-57, 2025 ~f59-63, 2026 is uncovered at ~f65 and settled by
// f68. Each torn page flips up over the binding and tumbles out of the frame (it leaves; nothing fades). The aircraft is
// untouched all that while. On "production" it rolls forward about a fifth of its length (a tug pull: starts f67,
// moving by f71, at rest by f84) and the frame holds alive to f88 (camera creep, the 2026 page stirring, dust in the
// light, film life).
// CAUSE: the pages are torn by time itself (the montage convention: no hand); the roll is a tug pull from off-frame
// (first movement f67, rest f84).
// CHAIN: none in this cut (the chain means PRODUCTION RUN in this clip; this cut is about the lone plane).
//
// FACTS: no real program is named. "2006 -> 2026" are simply the last twenty years (2026 = this year).
// SOURCES (details, URLs: <working>/animation_source/refs/A/ASSETS_A_READY.md):
//   hall: Ellsworth AFB Readiness Hangar interior, HABS SD-21-A-16 (Library of Congress), public domain; near floor
//     extended by scripts/clips/zach-kelly-johnson/bake-hall-plate.py.
//   aircraft: Lockheed YF-12A 60-6935 at the National Museum of the USAF, USAF photo, public domain. It stands in for
//     "a new aircraft"; it is not named on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ARCHIVE_FILTER,
  ArchiveCam,
  ArchiveCamera,
  CaptionBands,
  CutOut,
  DustMotes,
  FilmLife,
  H,
  Plate,
  SHADOW,
  SHADOW_OFF,
  W,
  clamp,
  depthTransform,
  type,
} from "./archiveShared";

export const FPS = 24000 / 1001;
export const DURATION = 89;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// ---- assets (public/zach-kelly-johnson/A/) ----
// The hall: the Ellsworth hangar plate with its near floor extended for 9:16
// (scripts/clips/zach-kelly-johnson/bake-hall-plate.py: rows 0-1600 as photographed, the nearest floor stretched
// progressively below and going soft). Source 2600 x 3040; the floor/back-wall join is at source row 1520, the central truss
// column (where the calendar hangs) at source x 1325.
const HALL = { src: "zach-kelly-johnson/A/plate_hall_ellsworth_floorext.jpg", w: 2600, h: 3040, joinRow: 1520, columnX: 1325 };
const HALL_W = 2000; // world px (hall plane): 0.77x of source; the scale at which the aircraft sits in the hall
const HALL_SCALE = HALL_W / HALL.w;
const HALL_JOIN_Y = 905; // where the floor meets the back wall, at rest
const HALL_TOP = HALL_JOIN_Y - HALL.joinRow * HALL_SCALE;
const HALL_LEFT = W / 2 - HALL.columnX * HALL_SCALE;
// The aircraft: YF-12A 60-6935, pure side view, nose LEFT, wheels on the box's bottom edge (1085 x 224).
// Nose gear at 0.336 of its length from the nose, main gear at ~0.71.
const PLANE = { src: "zach-kelly-johnson/A/cutout_yf12a_side_facing-left.png", w: 1085, h: 224 };

// the aircraft matched to the plate: the grade, its blacks lifted and contrast eased toward the hall's, a touch soft
const PLANE_FILTER = `${ARCHIVE_FILTER} contrast(0.84) brightness(1.1) blur(0.7px)`;
// the near floor's darkening (hall plane world y where it starts) and the window light's pool in front of the aircraft
const FLOOR_DARK_Y = 1075;
const POOL = { x: 560, y: 1120, w: 1150, h: 300 };

// ---- depths (1 = the aircraft, the focus plane) ----
const D_HALL = 1.25; // the hall (one photograph): a little behind the aircraft, which stands near the back wall
const D_CAL = D_HALL; // the calendar hangs on the hall's central column

// ---- the camera: one dolly push, already moving at f0, creeping at the end ----
const CAM0 = { x: W / 2, y: H / 2 };
const K_END = 1.3; // the YF-12A ends near its native 1085 px
const camAt = (f: number): ArchiveCam => {
  const u = Math.min(1, Math.max(0, f / (DURATION - 1)));
  const p = u * (1.6 - 0.6 * u); // speed 1.6 -> 0.4: moving at f0, a creep at the end
  // a slow drift left and up (never following the roll, so the roll reads against the hall)
  return { x: CAM0.x - 30 * p, y: CAM0.y - 28 * p, k: 1 + (K_END - 1) * p, x0: CAM0.x, y0: CAM0.y };
};

// ---- the aircraft (focus plane, world px) ----
const PLANE_W = 690;
const PLANE_X = 620; // centre at rest (it rolls LEFT, the way its nose points)
const PLANE_Y = 1000; // where the wheels meet the floor
const ROLL = 0.2 * PLANE_W;
const ROLL_F0 = 67;
const ROLL_F1 = 84;
const ROLL_EASE = Easing.bezier(0.5, 0, 0.22, 1);
const rollAt = (f: number) => -ROLL * interpolate(f, [ROLL_F0, ROLL_F1], [0, 1], { easing: ROLL_EASE, ...clamp });

// ---- the calendar (calendar plane, world px) ----
const CAL_X = 540; // centre
const CAL_TOP = 440; // top of the binding
const PAD_W = 450;
const BIND_H = 34;
const FACE_H = 330;
const FACE_TOP = CAL_TOP + BIND_H;
const YEAR_SIZE = 172; // cap 120 world px: ~147 screen px in the resolved frame (the calendar plane at ~1.23)
const YEAR_BASE = 162; // baseline, in the face
const HOOK_Y = CAL_TOP - 112; // the hanger's hook on the truss column
const WIRE = "#23211e";
// the print under the year: the year's twelve months, 6 x 2 blocks of day cells (a real calendar layout, Sunday
// first), a black header bar per month; print, no words
const GRID_M = 26;
const GRID_GAP = 10;
const GRID_BW = (PAD_W - 2 * GRID_M - 5 * GRID_GAP) / 6;
const GRID_CELL = GRID_BW / 7;
const GRID_TOP = 192;
const GRID_ROW = 7;
const GRID_BLOCK_H = 5 + 4 + 6 * GRID_ROW;
const printCache = new Map<number, string>();
const printPath = (year: number) => {
  const hit = printCache.get(year);
  if (hit) return hit;
  let d = "";
  for (let mo = 0; mo < 12; mo++) {
    const x0 = GRID_M + (mo % 6) * (GRID_BW + GRID_GAP);
    const y0 = GRID_TOP + Math.floor(mo / 6) * (GRID_BLOCK_H + 14);
    d += `M${x0} ${y0}h${GRID_BW}v5h${-GRID_BW}z`;
    const first = new Date(Date.UTC(year, mo, 1)).getUTCDay();
    const days = new Date(Date.UTC(year, mo + 1, 0)).getUTCDate();
    for (let day = 0; day < days; day++) {
      const idx = first + day;
      const x = x0 + (idx % 7) * GRID_CELL + (GRID_CELL - 4.4) / 2;
      const y = y0 + 9 + Math.floor(idx / 7) * GRID_ROW;
      d += `M${x.toFixed(2)} ${y}h4.4v3.6h-4.4z`;
    }
  }
  printCache.set(year, d);
  return d;
};
// the paper stubs left under the binding by the torn pages: a fixed jagged edge
const STUB = Array.from({ length: 46 }, (_, j) => {
  const x = (j / 45) * PAD_W;
  const h = 3 + 6 * Math.abs(Math.sin(j * 2.17 + 0.4) * Math.cos(j * 0.83));
  return `${x.toFixed(1)},${h.toFixed(1)}`;
}).join(" ");
const YEAR0 = 2006;
// tear start of the page showing YEAR0 + i (it reveals YEAR0 + i + 1): a page mid-tear at f0, a flurry through
// "20 years", then slowing so 2024, 2025 and 2026 read.
const TEAR = [-1.5, 3.2, 7.6, 11.5, 14.8, 17.6, 20.0, 22.2, 24.3, 26.3, 28.3, 30.3, 32.4, 34.7, 37.5, 41.0, 45.5, 51.0, 57.0, 63.0];
const PAGES = TEAR.length; // 20 pages torn: 2006 .. 2025; 2026 stays
const STACK_PX = 1.4; // sheet thickness at the pad's lower edge

// ---- a torn page's flight ----
const PERSP = 1500;
const DETACH = 1.6; // frames after the tear starts that the page leaves the binding
const SMOOTH = 3; // frames over which the flight speed builds up
const flight = (i: number, a: number) => {
  const r = (n: number) => {
    const s = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  const side = i % 2 === 0 ? 1 : -1;
  const lift = 165 + 25 * r(1); // degrees the page flips over the binding, eased
  const rx = lift * (1 - Math.exp(-a / 3.2)) + (14 + 10 * r(2)) * Math.max(0, a - 4);
  const d = Math.max(0, a - DETACH);
  const s = d < SMOOTH ? (d * d) / (2 * SMOOTH) : d - SMOOTH / 2;
  const ang = (-90 + side * (28 + 26 * r(3))) * (Math.PI / 180); // up and out to one side
  const speed = 70 + 26 * r(4);
  const tx = Math.cos(ang) * speed * s;
  const ty = Math.sin(ang) * speed * s - 0.0 * s;
  const tz = (16 + 10 * r(5)) * s;
  const rz = side * ((2 + 4 * r(6)) * a + 0.6 * s * (1 + r(7)));
  const ry = side * (5 + 7 * r(8)) * s;
  return { tx, ty, tz, rx, ry, rz };
};

// thin paper: each torn page bends at two joints (three strips from the torn top down), the lower strips lagging the
// flip in the air and fluttering; 0 at the tear (a = 0), continuous every frame
const SEG = FACE_H / 3;
const curl = (i: number, a: number): [number, number] => {
  const ph = (i * 1.7) % (2 * Math.PI);
  const env = 1 - Math.exp(-a / 2.2);
  const b = -(15 + 3 * Math.sin(i * 2.3)) * env + 9 * env * Math.sin(0.55 * a + ph) - 9 * env * Math.sin(ph);
  return [b, 0.8 * b + 4 * env * Math.sin(0.8 * a + ph * 1.3)];
};
// each page's torn top edge (local px, depth below the nominal top)
const tornEdge = (i: number) =>
  Array.from({ length: 41 }, (_, j) => {
    const x = (j / 40) * (PAD_W + SHADOW_OFF);
    const d = 1 + 6 * Math.abs(Math.sin(j * 2.31 + i * 0.77) * Math.cos(j * 0.67 + i));
    return `${x.toFixed(1)}px ${d.toFixed(1)}px`;
  }).join(", ");

type Vec3 = [number, number, number];
const rad = (deg: number) => (deg * Math.PI) / 180;
/** CSS transform `perspective(P) translate3d(t) rotateZ(rz) rotateY(ry) rotateX(rx)` applied to a point about the origin. */
const project = (p: Vec3, t: ReturnType<typeof flight>): [number, number] => {
  let [x, y, z] = p;
  const cx = Math.cos(rad(t.rx));
  const sx = Math.sin(rad(t.rx));
  [y, z] = [y * cx - z * sx, y * sx + z * cx];
  const cy = Math.cos(rad(t.ry));
  const sy = Math.sin(rad(t.ry));
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  const cz = Math.cos(rad(t.rz));
  const sz = Math.sin(rad(t.rz));
  [x, y] = [x * cz - y * sz, x * sz + y * cz];
  x += t.tx;
  y += t.ty;
  z += t.tz;
  const wgt = 1 - z / PERSP;
  return [x / wgt, y / wgt];
};

/** Has the torn page i left the frame for good at age a? (all four corners off the same edge) */
const pageGone = (i: number, a: number, cam: ArchiveCam) => {
  if (a < 4) return false;
  const t = flight(i, a);
  const tr = depthTransform(cam, D_CAL);
  const [b1, b2] = curl(i, a);
  const y1 = SEG + SEG * Math.cos(rad(b1));
  const z1 = SEG * Math.sin(rad(b1));
  const y2 = y1 + SEG * Math.cos(rad(b1 + b2));
  const z2 = z1 + SEG * Math.sin(rad(b1 + b2));
  const pts = (
    [
      [-PAD_W / 2, 0, 0],
      [PAD_W / 2, 0, 0],
      [-PAD_W / 2, SEG, 0],
      [PAD_W / 2, SEG, 0],
      [-PAD_W / 2, y1, z1],
      [PAD_W / 2, y1, z1],
      [-PAD_W / 2, y2, z2],
      [PAD_W / 2, y2, z2],
    ] as Vec3[]
  ).map((p) => {
    const [x, y] = project(p, t);
    return tr.toScreen(CAL_X + x, FACE_TOP + y);
  });
  const m = 12;
  return pts.every((q) => q.y < -m) || pts.every((q) => q.x < -m) || pts.every((q) => q.x > W + m);
};

const INKBLACK = "#0b0b0b";

/** One calendar sheet's face (white paper, the year in black Barlow 900; no shadow on black print). */
const SheetFace: React.FC<{ year: number | null; shade: number; ink?: number }> = ({ year, shade, ink = 1 }) => {
  const v = Math.round(255 * shade);
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: `rgb(${v},${v},${Math.round(v * 0.985)})` }}>
      {year !== null ? (
        <svg width={PAD_W} height={FACE_H} style={{ position: "absolute", left: 0, top: 0, opacity: ink === 1 ? undefined : ink }}>
          <text x={PAD_W / 2} y={YEAR_BASE} textAnchor="middle" fill={INKBLACK} style={type(YEAR_SIZE, 900, -0.01)}>
            {year}
          </text>
          <path d={printPath(year)} fill={INKBLACK} />
        </svg>
      ) : null}
    </div>
  );
};

const TwentyYearsOnePlane: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);

  // the calendar's state
  const torn = TEAR.filter((t) => t <= frame).length; // pages that have started tearing
  const topYear = YEAR0 + torn; // the sheet now on the pad
  const remaining = PAGES + 1 - torn; // sheets still on the pad
  // the uncovered sheet lifts a little in the draught of the one leaving, then settles
  const stir = TEAR.reduce((acc, t) => {
    const a = frame - t - 2;
    if (a < 0) return acc;
    return acc + 7 * Math.exp(-a / 3.2) * Math.sin(a / 1.9);
  }, 0);
  const breeze = 0.8 * Math.sin(frame / 7.3) + 0.4 * Math.sin(frame / 3.1 + 1);
  const topRx = Math.max(-2, stir) + breeze;

  // the aircraft
  const roll = rollAt(frame);
  const accel = rollAt(frame + 1) - 2 * roll + rollAt(frame - 1);
  const pitch = -0.22 * accel; // the nose dips as the tug brakes it, lifts as it pulls

  const flying = TEAR.map((t, i) => ({ i, a: frame - t })).filter(({ i, a }) => a >= 0 && !pageGone(i, a, cam));

  const planeX = PLANE_X + roll;
  const planeAspect = PLANE.w / PLANE.h;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1c1b19" }}>
      <FilmLife frame={frame}>
        {/* 1. the hall */}
        <ArchiveCamera cam={cam} d={D_HALL}>
          <Plate src={HALL.src} x={HALL_LEFT} y={HALL_TOP} w={HALL_W} h={HALL.h * HALL_SCALE} />
          {/* the near floor sinks smoothly into deep grey-brown toward the bottom (out of the light) */}
          <div
            style={{
              position: "absolute",
              left: HALL_LEFT,
              top: FLOOR_DARK_Y,
              width: HALL_W,
              height: HALL_TOP + HALL.h * HALL_SCALE - FLOOR_DARK_Y,
              background:
                "linear-gradient(to bottom, rgba(44,38,32,0) 0%, rgba(44,38,32,0.3) 22%, rgba(42,36,30,0.62) 48%, rgba(40,34,28,0.8) 72%, rgba(38,32,27,0.86) 100%)",
            }}
          />
          {/* a soft pool of the clerestory's light on the floor in front of the aircraft */}
          <div
            style={{
              position: "absolute",
              left: POOL.x - POOL.w / 2,
              top: POOL.y - POOL.h / 2,
              width: POOL.w,
              height: POOL.h,
              background:
                "radial-gradient(closest-side, rgba(255,249,238,0.2) 0%, rgba(255,249,238,0.13) 40%, rgba(255,249,238,0.05) 72%, rgba(255,249,238,0) 100%)",
            }}
          />
        </ArchiveCamera>

        {/* 2. the wall calendar: a white pad on its hard black shadow, the binding a black bar */}
        <ArchiveCamera cam={cam} d={D_CAL}>
          {/* the hanger: a wire down the truss column to a hook, two wires from the hook to the binding's ends */}
          <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line x1={CAL_X} y1={-900} x2={CAL_X} y2={HOOK_Y - 8} stroke={WIRE} strokeWidth={4} />
            <polyline
              points={`${CAL_X - PAD_W * 0.36},${CAL_TOP + 6} ${CAL_X},${HOOK_Y + 6} ${CAL_X + PAD_W * 0.36},${CAL_TOP + 6}`}
              fill="none"
              stroke={WIRE}
              strokeWidth={3.5}
              strokeLinejoin="round"
            />
            <circle cx={CAL_X} cy={HOOK_Y} r={8} fill="none" stroke={WIRE} strokeWidth={4.5} />
          </svg>
          <div style={{ position: "absolute", left: CAL_X - PAD_W / 2, top: CAL_TOP, width: PAD_W, height: BIND_H + FACE_H + remaining * STACK_PX }}>
            {/* its soft shadow on the wall it hangs on (the hall's light) */}
            <div
              style={{
                position: "absolute",
                left: 4,
                top: 12,
                width: PAD_W + 8,
                height: BIND_H + FACE_H + remaining * STACK_PX + 6,
                backgroundColor: "rgba(0,0,0,0.42)",
                filter: "blur(16px)",
              }}
            />
            {/* hard shadow of the whole pad */}
            <div style={{ position: "absolute", left: SHADOW_OFF, top: SHADOW_OFF, width: PAD_W, height: BIND_H + FACE_H + remaining * STACK_PX, backgroundColor: SHADOW }} />
            {/* the stack's edge under the face: one hairline per sheet left */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: BIND_H + FACE_H,
                width: PAD_W,
                height: remaining * STACK_PX,
                background: `repeating-linear-gradient(to bottom, #d9d6d0 0px, #d9d6d0 ${STACK_PX * 0.6}px, #8d8a85 ${STACK_PX * 0.6}px, #8d8a85 ${STACK_PX}px)`,
              }}
            />
            {/* the sheet under the top one (seen while the top one stirs) */}
            <div style={{ position: "absolute", left: 0, top: BIND_H, width: PAD_W, height: FACE_H }}>
              <SheetFace year={topYear < YEAR0 + PAGES ? topYear + 1 : null} shade={0.9} />
            </div>
            {/* the top sheet, hinged at the binding */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: BIND_H,
                width: PAD_W,
                height: FACE_H,
                transformOrigin: "50% 0",
                transform: `perspective(${PERSP}px) rotateX(${topRx}deg)`,
              }}
            >
              <SheetFace year={topYear} shade={0.985 - 0.004 * Math.abs(topRx)} />
            </div>
            {/* the stubs of the torn pages, left under the binding */}
            {torn > 0 ? (
              <svg width={PAD_W} height={14} style={{ position: "absolute", left: 0, top: BIND_H - 1, overflow: "visible" }}>
                <polygon points={`0,0 ${STUB} ${PAD_W},0`} transform="translate(1.5 2)" fill="#5f5b55" />
                <polygon points={`0,0 ${STUB} ${PAD_W},0`} fill="#ebe8e1" />
              </svg>
            ) : null}
            {/* the binding: a black bar, two staples, the hanger's eyelets */}
            <div style={{ position: "absolute", left: -6, top: 0, width: PAD_W + 12, height: BIND_H, backgroundColor: INKBLACK }} />
            {[0.24, 0.76].map((u) => (
              <div
                key={u}
                style={{ position: "absolute", left: PAD_W * u - 17, top: BIND_H / 2 - 3, width: 34, height: 6, backgroundColor: "#a9a59e", borderRadius: 2 }}
              />
            ))}
            {[0.14, 0.86].map((u) => (
              <div
                key={u}
                style={{
                  position: "absolute",
                  left: PAD_W * u - 6,
                  top: 6,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: "3px solid #8f8b84",
                  boxSizing: "border-box",
                }}
              />
            ))}
            {/* a touch of the hall's light falloff */}
            <div
              style={{
                position: "absolute",
                left: -6,
                top: 0,
                width: PAD_W + 12,
                height: BIND_H + FACE_H + remaining * STACK_PX,
                background: "linear-gradient(to bottom right, rgba(0,0,0,0) 45%, rgba(0,0,0,0.12) 100%)",
              }}
            />
          </div>
        </ArchiveCamera>

        {/* 3. the aircraft, alone on the floor */}
        <ArchiveCamera cam={cam} d={1}>
          <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: `${planeX}px ${PLANE_Y}px`, transform: `rotate(${pitch}deg)` }}>
            {/* its faint, soft reflection in the concrete */}
            <div
              style={{
                position: "absolute",
                left: planeX - PLANE_W / 2,
                top: PLANE_Y + 1,
                width: PLANE_W,
                height: PLANE_W / planeAspect,
                opacity: 0.13,
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0) 70%)",
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0) 70%)",
              }}
            >
              <Img
                src={staticFile(PLANE.src)}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "scaleY(-1)", filter: `${ARCHIVE_FILTER} blur(5px)` }}
              />
            </div>
            <CutOut
              src={PLANE.src}
              x={planeX}
              y={PLANE_Y}
              w={PLANE_W}
              aspect={planeAspect}
              filter={PLANE_FILTER}
              shade="linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.12) 100%)"
              shadow={[
                { x: 0.04 * PLANE_W, dy: 2, w: PLANE_W * 0.98, h: 54, opacity: 0.36 },
                { x: 0.02 * PLANE_W, dy: 0, w: PLANE_W * 0.86, h: 14, opacity: 0.3 },
                { x: -0.164 * PLANE_W, w: 42, h: 13, opacity: 0.9 },
                { x: 0.205 * PLANE_W, w: 86, h: 16, opacity: 0.95 },
              ]}
            />
          </div>
          <DustMotes frame={frame} x={60} y={360} w={960} h={520} count={36} size={2.4} light={0.3} />
        </ArchiveCamera>

        {/* 4. the torn pages, in the air in front of everything until they leave the frame */}
        <ArchiveCamera cam={cam} d={D_CAL}>
          {flying.map(({ i, a }) => {
            const t = flight(i, a);
            const [b1, b2] = curl(i, a);
            const torn = `polygon(${tornEdge(i)}, ${PAD_W + SHADOW_OFF}px ${SEG + SHADOW_OFF + 1}px, 0px ${SEG + SHADOW_OFF + 1}px)`;
            // one strip of the page: its hard shadow and its slice of the sheet. Paper both sides: the same white
            // (only the scene's light on it); seen from behind, the front's print shows through mirrored, faintly.
            const strip = (k: number, rx: number) => {
              const nz = Math.cos(rad(t.ry)) * Math.cos(rad(rx));
              const front = nz > 0;
              const shade = 0.93 + 0.06 * Math.abs(nz);
              return (
                <div style={{ position: "absolute", left: 0, top: 0, width: PAD_W, height: SEG + 1, overflow: "visible", clipPath: k === 0 ? torn : undefined }}>
                  {/* the hard shadow stays inside the strip's own height (only the last strip's shows below), so it
                      never pokes past a bend as a black line */}
                  <div
                    style={{
                      position: "absolute",
                      left: SHADOW_OFF,
                      top: k === 0 ? SHADOW_OFF : 0,
                      width: PAD_W,
                      height: k === 2 ? SEG + 1 + SHADOW_OFF : SEG - (k === 0 ? SHADOW_OFF : 0),
                      backgroundColor: SHADOW,
                    }}
                  />
                  <div style={{ position: "absolute", left: 0, top: 0, width: PAD_W, height: SEG + 1, overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: -k * SEG, width: PAD_W, height: FACE_H }}>
                      <SheetFace year={YEAR0 + i} shade={shade} ink={front ? 1 : 0.14} />
                    </div>
                  </div>
                </div>
              );
            };
            const joint = (b: number): React.CSSProperties => ({
              position: "absolute",
              left: 0,
              top: SEG,
              width: PAD_W,
              height: SEG,
              transformOrigin: "50% 0",
              transform: `rotateX(${b}deg)`,
              transformStyle: "preserve-3d",
            });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: CAL_X - PAD_W / 2,
                  top: FACE_TOP,
                  width: PAD_W,
                  height: SEG,
                  transformOrigin: "50% 0",
                  transform: `perspective(${PERSP}px) translate3d(${t.tx}px, ${t.ty}px, ${t.tz}px) rotateZ(${t.rz}deg) rotateY(${t.ry}deg) rotateX(${t.rx}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {strip(0, t.rx)}
                <div style={joint(b1)}>
                  {strip(1, t.rx + b1)}
                  <div style={joint(b2)}>{strip(2, t.rx + b1 + b2)}</div>
                </div>
              </div>
            );
          })}
        </ArchiveCamera>
      </FilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default TwentyYearsOnePlane;
