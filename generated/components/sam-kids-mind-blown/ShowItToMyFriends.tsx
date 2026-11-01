// ---------------------------------------------------------------------------
// ShowItToMyFriends (sam-kids-mind-blown, cut 29). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 94 frames.
//
// CHECK LINE: "They make little apps for their own lives, then turn the screen round and show their friends."
//
// THE LINE: "this constant, I'm gonna make useful stuff for me and show it to my friends." (John: "Yes.")
// WORD -> FRAME: constant 2 · I'm 16 · gonna 25 · make 28 · useful 34 · stuff 41 · for 49 · me 53 · and 58 · show 63 ·
//   it 67 · to 70 · my 71 · friends 74 · Yes 85 · (next line "And" 92)
// DURATION: the slot 29.613 -> 33.533 s (sequence frames 710 -> 804) = 94 frames (f0..f93).
//
// THE MOTION: one pull-back and one turn. Close on a homemade checklist app held by a hoodie sleeve at the frame's edge: a slow
// push from f0, its rows tick (f6, f20, f36), its robot hops on "for me" (f49). The pull-back starts about f35 and eases out by
// about f85, discovering the kid behind that sleeve and three friends on stools leaning in from off frame; a thin plank on a
// nearer plane rises into frame during it. From f50 to "friends" (f74) the kid's hands turn the tablet in true perspective, yaw
// 0 -> 58: the lit screen stays in view at an angle, finished checklist and robot, and everyone looks at it. Its back is never
// shown. Its light is a soft glow in the air behind the friends (derived from the yaw, fixed after it); skin is never tinted.
// CONTACTS: the near hand is on the tablet's lower left corner on every frame.
// AMBER = what gets made: the app's ticks and robot, then its light; cream = the tablet, board = the table and stools.
//
// SOURCES: none (no real figures or logos). MY CHORES is hand-drawn stroke lettering, the app's own title.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, StoutStage, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, makeClockCam, makePoolTrack, type SilItem } from "../kits/cheeky-pint/museShared";
import { solveArm } from "../scott-free-wifi/cabinCast";
import { CHILD, FRIEND_SPECS, Friend, Kid, KID_SPEC, Person, Stool, blinkAt, hull, personSil, polyD, stoolSil, swingAt, worldToLocal, type P2 } from "./kidsShared";

export const FPS = 24000 / 1001;
export const DURATION = 94;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const ss = (f: number, a: number, b: number) => smoothstep((f - a) / (b - a));
const D2R = Math.PI / 180;

// ---------------------------------------------------------------------------
// THE CAMERA: world = the end frame's screen (k 1). A close drift, one pull-back, a slow creep to the last frame.
// ---------------------------------------------------------------------------
const CAM = makeClockCam(
  { x: 412, y: 889, k: 2.7 },
  [
    { f0: -30, f1: 42, k: 2.8, dx: 4 },
    { f0: 26, f1: 80, dx: 124, dy: 71, k: 0.985 },
    { f0: 72, f1: 104, k: 1.02 },
  ],
  DURATION,
);
const POOL = makePoolTrack({ x: 412, y: 830 }, [{ f0: 30, f1: 80, x: 500, y: 860 }], DURATION);

// ---------------------------------------------------------------------------
// THE TABLET: a real box under one perspective projection. Local x right, y down, z toward the viewer at yaw 0.
// ---------------------------------------------------------------------------
const TAB = { W: 300, H: 225, T: 11, R: 20, BEZEL: 15, D: 1150 } as const;
type Pose = { x: number; y: number; yaw: number; pitch: number; roll: number };
const projector = (p: Pose) => {
  const cy = Math.cos(p.yaw * D2R);
  const sy = Math.sin(p.yaw * D2R);
  const cp = Math.cos(p.pitch * D2R);
  const sp = Math.sin(p.pitch * D2R);
  const cr = Math.cos(p.roll * D2R);
  const sr = Math.sin(p.roll * D2R);
  return (lx: number, ly: number, lz = 0): P2 => {
    const x1 = lx * cy + lz * sy;
    const z1 = -lx * sy + lz * cy;
    const y2 = ly * cp - z1 * sp;
    const z2 = ly * sp + z1 * cp;
    const x3 = x1 * cr - y2 * sr;
    const y3 = x1 * sr + y2 * cr;
    const s = TAB.D / (TAB.D - z2);
    return [p.x + x3 * s, p.y + y3 * s];
  };
};
type Proj = ReturnType<typeof projector>;
/** a rounded rectangle as points, clockwise on screen at yaw 0 */
const rrPts = (x: number, y: number, w: number, h: number, r: number, n = 6): P2[] => {
  const out: P2[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (90 * i) / n) * D2R;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  corner(x + w - r, y + r, -90);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, 90);
  corner(x + r, y + r, 180);
  return out;
};
const area = (pts: P2[]) => pts.reduce((a, p, i) => {
  const q = pts[(i + 1) % pts.length];
  return a + p[0] * q[1] - q[0] * p[1];
}, 0);
/** the local affine of the projection at a screen-plane point: small glyphs keep true foreshortening and stroke weight */
const jacobian = (P: Proj, lx: number, ly: number, z: number) => {
  const e = P(lx, ly, z);
  const a = P(lx + 1, ly, z);
  const c = P(lx, ly + 1, z);
  return `matrix(${f3(a[0] - e[0])} ${f3(a[1] - e[1])} ${f3(c[0] - e[0])} ${f3(c[1] - e[1])} ${f3(e[0])} ${f3(e[1])})`;
};

// ---------------------------------------------------------------------------
// THE APP: a kid's own checklist. Screen units: x -135..135, y -97.5..97.5
// ---------------------------------------------------------------------------
const INK = COLOR.inkDark;
const PAPER = "#FFF8EA";
const BAR = mixHex(COLOR.board, PAPER, 0.18);
const BAR_DONE = mixHex(COLOR.board, PAPER, 0.62);
type Stroke = P2[];
/** marker lettering, unit box; a little uneven, as a kid draws it */
const LETTERS: Record<string, { w: number; s: Stroke[] }> = {
  M: { w: 24, s: [[[0, 1], [0.06, 0.02], [0.5, 0.66], [0.94, 0], [1, 1]]] },
  Y: { w: 19, s: [[[0, 0], [0.5, 0.52]], [[1, 0.02], [0.5, 0.52], [0.47, 1]]] },
  H: { w: 20, s: [[[0, 0.02], [0.02, 1]], [[1, 0], [0.98, 1]], [[0.01, 0.52], [0.99, 0.48]]] },
  O: { w: 22, s: [[[0.5, 0], [0.85, 0.12], [1, 0.5], [0.85, 0.88], [0.5, 1], [0.15, 0.88], [0, 0.5], [0.15, 0.12], [0.5, 0]]] },
  E: { w: 16, s: [[[0.95, 0.02], [0, 0], [0.02, 1], [1, 0.98]], [[0.01, 0.5], [0.8, 0.48]]] },
  W: { w: 28, s: [[[0, 0], [0.25, 1], [0.5, 0.34], [0.75, 1], [1, 0.02]]] },
  R: { w: 19, s: [[[0, 1], [0, 0], [0.68, 0.01], [0.92, 0.26], [0.68, 0.52], [0, 0.52]], [[0.4, 0.52], [1, 1]]] },
  C: { w: 20, s: [[[0.95, 0.14], [0.6, 0], [0.2, 0.1], [0, 0.5], [0.2, 0.9], [0.6, 1], [0.97, 0.86]]] },
  S: { w: 18, s: [[[0.92, 0.14], [0.55, 0], [0.12, 0.1], [0.1, 0.36], [0.5, 0.5], [0.92, 0.66], [0.9, 0.88], [0.5, 1], [0.05, 0.86]]] },
};
const TITLE = "MY CHORES";
const TITLE_H = 28;
const TITLE_X = -119;
const TITLE_Y = -72;
const titleLayout = (() => {
  const out: { c: string; cx: number; w: number; tilt: number; dy: number }[] = [];
  let x = TITLE_X;
  [...TITLE].forEach((c, i) => {
    if (c === " ") {
      x += 9;
      return;
    }
    const w = LETTERS[c].w * 1.12;
    out.push({ c, cx: x + w / 2, w, tilt: [-3, 2, -2, 3, -1, 2, -3, 1, 3, -2, 2][i], dy: [0, 1.2, -0.8, 0.6, 1, -1, 0.5, 1.2, -0.6, 0.8, 0][i] });
    x += w + 4.6;
  });
  return out;
})();
const RY = [-24, 17, 58];
const BW = [136, 100, 124];
const TICK_AT = [6, 20, 36];
const BOX = 28;
const BOX_X = -119;
const BAR_X = -79;

const App: React.FC<{ P: Proj; z: number; S: number }> = ({ P, z, S }) => {
  const poly = (x: number, y: number, w: number, h: number, r: number) => polyD(rrPts(x, y, w, h, r).map((q) => P(q[0], q[1], z)));
  // the robot: one small happy hop on "for me" (lift-off f49, landing f57)
  const hopT = clamp01((S - 49) / 8);
  const hop = S >= 49 && S <= 57 ? 4 * hopT * (1 - hopT) : 0;
  const squash = Math.exp(-Math.pow((S - 47.5) / 1.6, 2)) + Math.exp(-Math.pow((S - 58) / 1.8, 2));
  const rx = 92;
  const ry = 76;
  const blink = blinkAt(S, 3, 41);
  return (
    <g>
      {titleLayout.map((l, i) => (
        <g key={i} transform={`${jacobian(P, l.cx, TITLE_Y + l.dy, z)} rotate(${l.tilt})`}>
          <g fill="none" stroke={INK} strokeWidth={5.4} strokeLinecap="round" strokeLinejoin="round">
            {LETTERS[l.c].s.map((st, j) => (
              <path key={j} d={st.map((q, n) => `${n ? "L" : "M"}${f3((q[0] - 0.5) * l.w)} ${f3((q[1] - 0.5) * TITLE_H)}`).join("")} />
            ))}
          </g>
        </g>
      ))}
      {RY.map((y, i) => {
        const t0 = TICK_AT[i];
        const fill = ss(S, t0, t0 + 4);
        const draw = ss(S, t0 + 1, t0 + 6);
        const done = ss(S, t0 + 3, t0 + 12);
        const h = BOX - 7;
        const fh = h * fill;
        return (
          <g key={i}>
            <path d={poly(BAR_X, y - 9, BW[i], 18, 9)} fill={mixHex(BAR, BAR_DONE, done)} />
            <g transform={jacobian(P, BOX_X + BOX / 2, y, z)}>
              <rect x={-BOX / 2} y={-BOX / 2} width={BOX} height={BOX} rx={7} fill={PAPER} stroke={INK} strokeWidth={3.6} />
              {fill > 0.001 ? <rect x={-h / 2} y={h / 2 - fh} width={h} height={fh} rx={Math.min(4, fh / 2)} fill={COLOR.amberTop} /> : null}
              {draw > 0.001 ? (
                <path d="M-7.5 0.5L-2 6L8 -6.5" pathLength={1} strokeDasharray={`${f3(draw)} 1`} fill="none" stroke={INK} strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
            </g>
          </g>
        );
      })}
      {/* the robot stands on the app's bottom edge in the corner */}
      <g transform={jacobian(P, rx, ry, z)}>
        <ellipse cx={0} cy={15.5} rx={21 - 7 * hop} ry={2.6 - hop} fill={mixHex(COLOR.board, PAPER, 0.25)} />
        <g transform={`translate(0 ${f3(-20 * hop)}) translate(0 14) scale(${f3(1 + 0.09 * squash)} ${f3(1 - 0.11 * squash + 0.06 * hop)}) translate(0 -14)`}>
          <path d="M-9 9L-9 14M9 9L9 14" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
          <path d="M-21 -6L-27 -1M21 -6L27 -1" stroke={COLOR.amberFoot} strokeWidth={4.8} strokeLinecap="round" />
          <path d="M0 -21L0 -28" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <circle cx={0} cy={-30.5} r={4} fill={COLOR.amberTop} />
          <rect x={-21} y={-21} width={42} height={32} rx={9} fill={COLOR.amberTop} />
          <rect x={-21} y={-6} width={42} height={17} rx={8} fill={COLOR.amberFoot} opacity={0.42} />
          <ellipse cx={-8} cy={-8} rx={3.6} ry={3.6 * (1 - 0.85 * blink)} fill={INK} />
          <ellipse cx={8} cy={-8} rx={3.6} ry={3.6 * (1 - 0.85 * blink)} fill={INK} />
          <path d={`M-6.5 1Q0 ${f3(5.5 + 3 * hop)} 6.5 1`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
};

const Tablet: React.FC<{ P: Proj; S: number; uid: string; y0: number; y1: number }> = ({ P, S, uid, y0, y1 }) => {
  const zF = TAB.T / 2;
  const outline = rrPts(-TAB.W / 2, -TAB.H / 2, TAB.W, TAB.H, TAB.R, 7);
  const front = outline.map((q) => P(q[0], q[1], zF));
  const back = outline.map((q) => P(q[0], q[1], -zF));
  const frontOn = area(front) > 0;
  const sw = TAB.W - 2 * TAB.BEZEL;
  const sh = TAB.H - 2 * TAB.BEZEL;
  const inset = (d: number, r: number, z: number) => polyD(rrPts(-sw / 2 - d, -sh / 2 - d, sw + 2 * d, sh + 2 * d, r).map((q) => P(q[0], q[1], z)));
  const edge = mixHex(COLOR.creamFoot, COLOR.shadow, 0.34);
  return (
    <g>
      <defs>
        <linearGradient id={uid} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <path d={polyD(hull([...front, ...back]))} fill={edge} />
      {frontOn ? (
        <g>
          <path d={polyD(front)} fill={`url(#${uid})`} />
          <path d={inset(2.4, 7, zF)} fill={mixHex(INK, COLOR.ground, 0.3)} />
          <path d={inset(0, 6, zF)} fill={PAPER} />
          <App P={P} z={zF} S={S} />
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE PEOPLE
// ---------------------------------------------------------------------------
const END_YAW = 58; // the screen stays lit and in view, at an angle; its back is never shown
const FIG = 1.44; // heads 190 px wide at k 1
const KID = { x: 150, y: 1089, scale: FIG } as const;
const FRIENDS = [
  // left to right, each drawn in front of the one on its left: a nose can only land on the next one's back hair, never a face
  { variant: 0, x: 586, y: 1086, slide: 225, in: 46, seed: 5, lean: 5 },
  { variant: 2, x: 786, y: 1075, slide: 190, in: 50, seed: 2, lean: 5 },
  { variant: 1, x: 942, y: 1098, slide: 150, in: 53, seed: 8, lean: 5 },
] as const;
// the table and stools as in cut 1: a thin plank on legs, whole figures on stools behind it, feet dangling short of the floor
const FLOOR = 1330;
const STOOL_W = 130;
const PLANK_Y = 1030;
const PLANK_D = 20;
const PLANK_EDGE = 8;
const PLANK_X0 = -500;
const PLANK_X1 = 1580;
const TABLE_LEGS = [34, 1052];
const tableLegD = (x: number, w: number, y1: number) => `M${x - w / 2} ${PLANK_Y + PLANK_D + PLANK_EDGE - 2}H${x + w / 2}L${x + w / 2 - 3} ${y1}H${x - w / 2 + 3}Z`;
/** the ponytail friend, on a warm cream skin (her ear follows, the rig derives it from the skin) */
const PONY_SPEC = { ...FRIEND_SPECS[1], skin: "#F3D7B5" };
const rotL = (p: P2, deg: number): P2 => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};

// ---------------------------------------------------------------------------
const ShowItToMyFriends: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const pool = POOL(S);
  const tableM = cam.k; // nearer the lens: it is below the frame until the pull-back brings it up

  // the tablet: the turn is one eased change of the yaw; its position comes in to the kid's reach and goes out again
  const turn = ss(S, 50, 74);
  const yaw = -3 + 3 * ss(S, 0, 50) + END_YAW * turn + 1.4 * Math.sin((S - 74) / 11) * ss(S, 72, 86);
  const pose: Pose = {
    x: 412 - 59 * ss(S, 52, 76),
    y: 830 + 2.5 * Math.sin(S / 17) - 4 * ss(S, 50, 76),
    yaw,
    pitch: 3 + 2 * Math.sin(S / 23),
    roll: -1.2 + 3.6 * ss(S, 50, 78),
  };
  const P = projector(pose);

  // the kid: leans back out of frame at the start, comes forward with the turn, stands back proud (nose clear of the far edge)
  const kidLean = lerp(-15, -6, ss(S, 44, 70)) + 0.8 * Math.sin(S / 15);
  // the screen's left edge swings toward us and stays on the kid's side, so both hands keep one grip on it
  const nearGrip = P(-142, TAB.H / 2 - 7, -TAB.T / 2);
  const farGrip = P(-146, TAB.H / 2 - 34, -TAB.T / 2);
  const hand = worldToLocal(nearGrip, KID);
  const farHand = worldToLocal(farGrip, KID);
  const kidPose = {
    ...KID,
    lean: kidLean,
    headTilt: lerp(lerp(-14, 2, ss(S, 42, 62)), -7, ss(S, 70, 86)), // chin up while off frame, so no nose-tip sliver at the edge
    legs: "seat" as const,
    swing: swingAt(S, 12, 29, 0),
    swingFar: swingAt(S, 10, 29, 12),
    hand,
    farHand,
    blink: blinkAt(S, 1, 53),
    smile: lerp(0.7, 1, ss(S, 74, 84)),
    happy: ss(S, 82, 88),
  };
  // the same arm the Person solves for, so the near mitten can sit on top of the tablet's edge on every frame
  const nearArm = solveArm(rotL(CHILD.shoulder, kidLean), hand, CHILD.upper, CHILD.fore, 1);

  // the screen's light reaches the friends as the screen comes round to them; it is the yaw, so it holds once the yaw holds
  const light = smoothstep((Math.sin(yaw * D2R) - 0.3) / 0.5) * (yaw > 0 ? 1 : 0);

  const friendPoses = FRIENDS.map((fr, i) => {
    const arrive = ss(S, fr.in, fr.in + 24);
    const turnTo = ss(S, 54 + i * 2, 72);
    const isPointer = fr.variant === 0;
    const raise = isPointer ? ss(S, 73, 84) : 0;
    const base = {
      x: fr.x + fr.slide * (1 - arrive) + 2.5 * Math.sin((S + fr.seed * 7) / 21),
      y: fr.y,
      scale: FIG,
      facing: -1 as const,
      lean: lerp(-7, fr.lean, turnTo) + 0.9 * Math.sin((S + fr.seed * 5) / 14),
      headTilt: lerp(-9, 0, turnTo) + 1.1 * Math.sin((S + fr.seed * 9) / 19),
      legs: "seat" as const,
      swing: swingAt(S, 12, 31, fr.seed * 4),
      swingFar: swingAt(S, 10, 31, fr.seed * 4 + 13),
      blink: blinkAt(S, fr.seed, 47 + fr.seed * 3),
    };
    const shoulderL = rotL(CHILD.shoulder, base.lean);
    const rest: P2 = [shoulderL[0] + 8, shoulderL[1] + (CHILD.upper + CHILD.fore) * 0.92];
    const aim = worldToLocal([pose.x + 96, pose.y + 124], base); // an easy arm under the chin toward the tablet's near low corner, clear of the face
    const hand2: P2 = [lerp(rest[0], aim[0], raise), lerp(rest[1], aim[1], raise)];
    return {
      ...base,
      variant: fr.variant,
      hand: hand2,
      smile: lerp(0.45, 1, ss(S, 72, 82)),
      mouth: isPointer ? 0.8 * ss(S, 74, 82) : i === 1 ? 0.5 * ss(S, 76, 84) : 0,
      happy: i === 2 ? ss(S, 78, 84) : 0,
      raise,
    };
  });

  // one shadow: the kid and the tablet touch, the friends stand as a huddle
  const tabletSil: SilItem[] = [{ d: polyD(hull([...rrPts(-TAB.W / 2, -TAB.H / 2, TAB.W, TAB.H, TAB.R, 4).map((q) => P(q[0], q[1], TAB.T / 2)), ...rrPts(-TAB.W / 2, -TAB.H / 2, TAB.W, TAB.H, TAB.R, 4).map((q) => P(q[0], q[1], -TAB.T / 2))])) }];
  // the kid's legs and stool wait further left, off frame, through the close, and slide in under the body as the plank arrives
  const legOff = -260 * (1 - ss(S, 42, 55));
  const curlyLegOff = 200 * (1 - ss(S, 42, 55)); // the same for the first friend, who arrives from the other edge
  const kidLegs = { ...kidPose, x: KID.x + legOff };
  const kidUpper = { ...kidPose, legs: "none" as const };
  const legsClipX = kidLegs.x + 62 * clamp01(-legOff / 60); // only forward of the torso while the two are apart
  const kidStool = { x: KID.x + legOff - 8, seatY: KID.y + 3, floorY: FLOOR, w: STOOL_W };
  const stoolOf = (p: { x: number; y: number }) => ({ x: p.x + 8, seatY: p.y + 3, floorY: FLOOR, w: STOOL_W });
  const groupSil: SilItem[] = [...tabletSil, ...personSil(kidUpper), ...personSil(kidLegs).slice(-6), ...stoolSil(kidStool), ...friendPoses.flatMap((p) =>
      p.variant === 0
        ? [...personSil({ ...p, legs: "none" as const }), ...personSil({ ...p, x: p.x + curlyLegOff }).slice(-6), ...stoolSil(stoolOf({ x: p.x + curlyLegOff, y: p.y }))]
        : [...personSil(p), ...stoolSil(stoolOf(p))],
    )];
  const tableSil: SilItem[] = [{ d: `M${PLANK_X0} ${PLANK_Y}H${PLANK_X1}V${PLANK_Y + PLANK_D + PLANK_EDGE}H${PLANK_X0}Z` }, ...TABLE_LEGS.map((x) => ({ d: tableLegD(x, 26, FLOOR) }))];

  // the screen's far edge: where its light leaves for the friends
  const edgeA = P(TAB.W / 2, 0, TAB.T / 2);

  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={pool}>
      <UnionShadow sil={groupSil} s={1.5} elevation="rest" />
      {/* the soft glow in the air between the tablet and the friends: behind them, so it never tints a face */}
      {light > 0.002 ? (
        <g style={{ mixBlendMode: "screen" }}>
          <defs>
            <radialGradient id="screenBand" gradientUnits="userSpaceOnUse" cx={f3(edgeA[0])} cy={f3(pose.y + 20)} r={520} gradientTransform={`translate(0 ${f3(pose.y + 20)}) scale(1 0.34) translate(0 ${f3(-(pose.y + 20))})`}>
              <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.34 * light)} />
              <stop offset="0.5" stopColor={COLOR.amberTop} stopOpacity={f3(0.13 * light)} />
              <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x={edgeA[0] - 530} y={pose.y - 240} width={1060} height={520} fill="url(#screenBand)" />
        </g>
      ) : null}
      {friendPoses.map((p, i) => {
        const { raise: _raise, ...fp } = p;
        const { variant: _variant, ...figure } = fp;
        const arm = solveArm(rotL(CHILD.shoulder, fp.lean), fp.hand, CHILD.upper, CHILD.fore, 1);
        const len = Math.hypot(arm.W[0] - arm.E[0], arm.W[1] - arm.E[1]);
        const ux = (arm.W[0] - arm.E[0]) / len;
        const uy = (arm.W[1] - arm.E[1]) / len;
        const wx = fp.x - arm.W[0] * FIG;
        const wy = fp.y + arm.W[1] * FIG;
        return (
          <g key={i}>
            <Stool {...stoolOf({ x: fp.x + (fp.variant === 0 ? curlyLegOff : 0), y: fp.y })} />
            {fp.variant === 0 ? (
              <>
                <defs>
                  <clipPath id="curlyLegsClip">
                    <rect x={f3(fp.x + curlyLegOff - 62 * clamp01(curlyLegOff / 60) - 900)} y={fp.y - 50} width={900} height={500} />
                  </clipPath>
                </defs>
                <g clipPath="url(#curlyLegsClip)">
                  <Friend {...fp} x={fp.x + curlyLegOff} shadow={false} />
                </g>
                <Friend {...fp} legs="none" shadow={false} />
              </>
            ) : fp.variant === 1 ? (
              <Person {...figure} build={CHILD} spec={PONY_SPEC} shadow={false} />
            ) : (
              <Friend {...fp} shadow={false} />
            )}
            {p.variant === 0 ? <path d={`M${f3(wx)} ${f3(wy)}L${f3(wx - ux * 31)} ${f3(wy + uy * 31)}`} stroke={FRIEND_SPECS[0].skin} strokeWidth={11} strokeLinecap="round" /> : null}
          </g>
        );
      })}
      <Stool {...kidStool} />
      <defs>
        <clipPath id="kidLegsClip">
          <rect x={f3(legsClipX)} y={KID.y - 50} width={900} height={500} />
        </clipPath>
      </defs>
      <g clipPath="url(#kidLegsClip)">
        <Kid {...kidLegs} shadow={false} />
      </g>
      <Kid {...kidUpper} shadow={false} />
      <Tablet P={P} S={S} uid="tabletCream" y0={pose.y - 130} y1={pose.y + 130} />
      <g transform={`translate(${f3(KID.x)} ${f3(KID.y)}) scale(${FIG})`}>
        <g transform={`translate(${f3(nearArm.W[0])} ${f3(nearArm.W[1])}) rotate(${f3(Math.atan2(nearArm.W[1] - nearArm.E[1], nearArm.W[0] - nearArm.E[0]) / D2R)})`}>
          <ellipse cx={f3(CHILD.hand * 0.32)} cy={0} rx={f3(CHILD.hand * 1.18)} ry={f3(CHILD.hand * 0.94)} fill={KID_SPEC.skin} />
          <circle cx={f3(CHILD.hand * 0.5)} cy={f3(-CHILD.hand * 0.74)} r={f3(CHILD.hand * 0.34)} fill={KID_SPEC.skin} />
        </g>
      </g>
      {/* a plane nearer the lens: it magnifies faster as the camera closes, so it is below the frame through the close */}
      <g transform={`translate(${f3(cam.x)} ${f3(cam.y)}) scale(${f3(tableM)}) translate(${f3(-cam.x)} ${f3(-cam.y)})`}>
        <UnionShadow sil={tableSil} s={1.2} />
        <path d={TABLE_LEGS.map((x) => tableLegD(x + 44, 18, FLOOR - 26)).join("")} fill={mixHex(COLOR.boardFoot, COLOR.ground, 0.6)} />
        <path d={TABLE_LEGS.map((x) => tableLegD(x, 26, FLOOR)).join("")} fill={mixHex(COLOR.boardFoot, COLOR.ground, 0.38)} />
        <rect x={PLANK_X0} y={PLANK_Y} width={PLANK_X1 - PLANK_X0} height={PLANK_D} fill={COLOR.board} />
        <rect x={PLANK_X0} y={PLANK_Y + PLANK_D} width={PLANK_X1 - PLANK_X0} height={PLANK_EDGE} fill={COLOR.boardFoot} />
      </g>
    </StoutStage>
  );
};

export default ShowItToMyFriends;
