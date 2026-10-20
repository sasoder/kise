// ---------------------------------------------------------------------------
// CloseToNewton (kyle-london, cut 22, V2: the character scene). Dwarkesh map style (styles/dwarkesh-map.md), the
// umber page with no map (kits/maps TexcocoPage), the engraved London cast (londonCast.tsx).
// Opaque 1080x1920, 29.97 fps, 148 frames. (V1, the portrait medallions, stays buildable as CloseToNewtonMedallions.)
//
// CHECK LINE: "Pepys, the diarist, stood shoulder to shoulder with Newton in the Royal Society's circle."
//
// THE LINE: "[...the very famous Diary of Samuel Pepys, who's this incredible] figure and is like very close to
// Newton and that social group. And his"
// WORD -> FRAME: incredible 4 · figure 15 · and 37 · is 50 · like 53 · very 62 · close 71 · to 81 · Newton 88 ·
// and 95 · that 103 · social 109 · group 119 · And 131 · his 142 (cut back to the speaker at 148)
// DURATION: the slot 22.155 -> 27.094 s (in frame 664 -> out frame 812 at 29.97) = 148 frames (f0..f147).
//
// THE MOTION: one continuous camera. f0 is close on Pepys (cream, a dark periwig, the rich coat), already walking in
// from the left in a three-quarter view (the upright gentleman's stroll, POSES.strollGent); PEPYS slides up over his head (f6 -> f16). The camera travels with him and
// eases back as he walks up to Newton (orange coat: the new science), who stands by the Society's table with its
// globe and reflecting telescope; Pepys slows and stops at his side, shoulder to shoulder (stops f84), and Newton
// turns his head to him with a small nod (f80 -> f98); NEWTON slides up f78 -> f88. "that social group": the camera
// pulls back (f88 -> f128) while four Fellows (dimmer cream: the circle) step in from the frame edges (f94 -> f127, in a
// stagger), two in front and two behind, and turn toward the pair, a loose semicircle in depth with Pepys inside it
// next to Newton. Then the settled frame breathes (idle, head turns) and the camera creeps to the cut.
// Orange = the new science: Newton's coat is the ONLY orange. Pepys is full-bright cream with his label; the circle is
// cream at the context level (a step dimmer), so the picture reads "Pepys and Newton at the centre of their circle".
//
// SOURCES: costume after Hayls's Pepys (1666), Kneller's Newton (1689), Kneller's Wren (1711), Murray's Halley
// (c.1690), Kerseboom's Boyle (1689) and Hollar's frontispiece to Sprat's History of the Royal Society (1667), as
// listed in <working>/animation_source/refs/refs_sources.txt and images/image_sources.txt; the reflector after
// Newton's 1668 telescope (images/42.5_FundamentalDiscoveries_NewtonReflectingTelescope1668.jpg). No figures or dates.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg, makeCamera, type Cam } from "../kits/maps/texcocoShared";
import { INK, fellSC, swayCam } from "../kits/maps/incaShared";
import {
  DARK,
  Fellow,
  Globe,
  Newton,
  ORANGE,
  GENT_STRIDE,
  POSES,
  Pepys,
  Reflector,
  TABLE,
  Table,
  WALK_CYCLE,
  headTurn,
  idle,
  lerpFig,
  tableTop,
  shadeInk,
  walkPose,
  type FigPose,
} from "./londonCast";

export const FPS = 30000 / 1001;
export const DURATION = 148;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const easeOut = (v: number) => 1 - Math.pow(1 - c01(v), 3);
type P2 = [number, number];

// ---------------------------------------------------------------------------
// WORLD: world px = figure units (a man ~310 tall, scale 1 in the front row); the floor of the front row is y = 0,
// figures further back stand higher (y < 0) and smaller.
// ---------------------------------------------------------------------------
const PEPYS_X = -56;
const NEWTON_X = 58;
const TABLE_AT: P2 = [180, -152];
const TABLE_S = 0.8;

/** a walker that comes in at speed v (units / frame) and slows to a stop at xEnd on fStop over `brake` frames */
const walker = (xEnd: number, dir: 1 | -1, fStop: number, v: number, brake: number) => {
  const dBrake = (v * brake) / 2;
  const dist = (f: number) => {
    // distance still to go at frame f (>= 0)
    if (f >= fStop) return 0;
    if (f >= fStop - brake) {
      const u = (fStop - f) / brake;
      return dBrake * u * u;
    }
    return dBrake + v * (fStop - brake - f);
  };
  return {
    x: (f: number) => xEnd - dir * dist(f),
    /** how much he is still walking (1 = full stride) */
    amount: (f: number) => (f >= fStop ? 0 : f >= fStop - brake ? Math.sqrt((fStop - f) / brake) : 1),
    /** distance covered from an arbitrary origin (for the stride phase) */
    covered: (f: number) => -dist(f),
  };
};

// Pepys: the gentleman's stroll (2 x GENT_STRIDE units per 30-frame cycle), braking from f60 to stop at f84
const PEPYS_V = (2 * GENT_STRIDE) / WALK_CYCLE;
const pepysWalk = walker(PEPYS_X, 1, 84, PEPYS_V, 24);

// the four Fellows: front flanks and rear flanks of the semicircle (x, floor y, depth scale, the side they come from)
type FellowSpec = { variant: number; x: number; y: number; s: number; dir: 1 | -1; fStop: number; seed: number };
const FELLOWS: FellowSpec[] = [
  { variant: 2, x: -298, y: -24, s: 0.95, dir: 1, fStop: 116, seed: 1 },
  { variant: 3, x: -200, y: -112, s: 0.85, dir: 1, fStop: 122, seed: 2 },
  { variant: 1, x: 232, y: -112, s: 0.85, dir: -1, fStop: 126, seed: 3 },
  { variant: 4, x: 318, y: -20, s: 0.95, dir: -1, fStop: 119, seed: 4 },
];
const FELLOW_STRIDE = 46;
// the circle at the style's context level (a step dimmer than the cream in play)
const CONTEXT_COAT = shadeInk(0.66);
const CONTEXT_INK = shadeInk(0.72);
const FELLOW_V = (2 * FELLOW_STRIDE) / WALK_CYCLE; // 4 units / frame at scale 1
const fellowWalks = FELLOWS.map((F) => walker(F.x, F.dir, F.fStop, FELLOW_V * F.s, 14));

// ---------------------------------------------------------------------------
// CAMERA: close on Pepys walking (f0), travelling with him onto the pair (f88), then one pull-back to the circle
// (f128) and a slow creep. (wx, wy) lands on screen (540, sy) at zoom k.
// ---------------------------------------------------------------------------
const HEAD_Y = -292; // a front-row head's middle
const camAt = makeCamera([
  { f: 0, k: 4.0, wx: pepysWalk.x(0) + 30, wy: HEAD_Y, sy: 716 },
  { f: 44, k: 3.38, wx: pepysWalk.x(44) + 28, wy: HEAD_Y, sy: 708 },
  { f: 88, k: 2.82, wx: (PEPYS_X + NEWTON_X) / 2, wy: HEAD_Y, sy: 702 },
  { f: 128, k: 1.36, wx: 4, wy: 0, sy: 1060 },
  { f: 147, k: 1.32, wx: 4, wy: 0, sy: 1062 },
]);
const camOf = (frame: number): Cam => swayCam(camAt(frame), frame);
const screenX = (cam: Cam, x: number) => 540 + (x - cam.cx) * cam.k;

// ---------------------------------------------------------------------------
// LABEL: IM Fell English SC, cream, widely spaced, in world space; slides up while it fades in (10 frames)
// ---------------------------------------------------------------------------
const NameLabel: React.FC<{ text: string; x: number; y: number; size: number; frame: number; f0: number }> = ({ text, x, y, size, frame, f0 }) => {
  const u = c01((frame - f0) / 10);
  if (u <= 0) return null;
  const e = easeOut(u);
  return (
    <text
      x={x + size * 0.11}
      y={y + size * 0.45 * (1 - e)}
      textAnchor="middle"
      opacity={ease(u)}
      fill={INK}
      stroke={DARK}
      strokeOpacity={0.75}
      strokeWidth={size * 0.13}
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * 0.22 }}
    >
      {text}
    </text>
  );
};

/** the ground shadow under a standing man: short hatched strokes in a flat ellipse */
const GroundShadow: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  let d = "";
  const n = 13;
  const hw = 62 * s;
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * 2 - 1;
    const l = hw * 0.2 * Math.sqrt(Math.max(0.08, 1 - u * u));
    const px = x + u * hw;
    d += `M${(px - l).toFixed(1)},${(y + 4 * s + l * 0.4).toFixed(1)}L${(px + l).toFixed(1)},${(y + 4 * s - l * 0.4).toFixed(1)}`;
  }
  return <path d={d} fill="none" stroke={INK} strokeWidth={1.6 * s} strokeOpacity={0.32} strokeLinecap="round" />;
};

const CloseToNewton: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const g = frame;

  // ---- Pepys: walking in, braking, standing at Newton's side; he looks to Newton ------------------
  const pX = pepysWalk.x(frame);
  const pAmt = pepysWalk.amount(frame);
  const pPhase = pepysWalk.covered(frame) / (2 * GENT_STRIDE) + 0.15;
  const pWalk = POSES.strollGent(1, pPhase, pAmt);
  const pStand = headTurn(POSES.stand(1), 0.78, 2);
  const pPose: FigPose = idle(lerpFig(pWalk, pStand, ease((frame - 70) / 22)), g, 1, ease((frame - 84) / 16));

  // ---- Newton: standing by the table, three-quarter to screen left; he turns his head to Pepys and nods -----
  const nBase = POSES.stand(-1);
  const turn = ease((frame - 78) / 16);
  const nod = 7 * Math.sin(Math.PI * c01((frame - 84) / 18));
  const nPose: FigPose = idle(headTurn(nBase, -0.22 - 0.62 * turn, 1 + nod), g, 2, 1);

  // ---- the Fellows: walking in from the edges, stopping, turning to the pair ------------------------
  const fellows = FELLOWS.map((F, i) => {
    const w = fellowWalks[i];
    const x = w.x(frame);
    const amt = w.amount(frame);
    const ph = w.covered(frame) / (2 * FELLOW_STRIDE * F.s) + 0.37 * i;
    const walkQ = walkPose(POSES.walk(F.dir, 0, 0), ph, amt, FELLOW_STRIDE);
    const toPair = F.dir; // the pair is on his facing side
    const standQ = headTurn(POSES.stand(toPair), toPair * (0.7 + 0.08 * i), 1 + (i % 2) * 2);
    let q = lerpFig(walkQ, standQ, ease((frame - (F.fStop - 8)) / 18));
    // a later small head turn, so the settled frame lives
    q = headTurn(q, q.headYaw + toPair * -0.18 * ease((frame - (134 + i * 3)) / 14) * (i % 2 ? 1 : -1), q.pitch);
    if (F.variant === 3) q = POSES.stoop(q, toPair);
    q = idle(q, g, 3 + i, ease((frame - F.fStop) / 14));
    return { F, x, q, on: frame >= F.fStop - 60 };
  });

  // draw far to near (by the floor y they stand on): the Fellow behind the table, the table, the others, Newton, Pepys
  const order = [...fellows].sort((a, b) => a.F.y - b.F.y);
  const rear = order.filter((o) => o.F.y < TABLE_AT[1]);
  const front = order.filter((o) => o.F.y >= TABLE_AT[1]);
  const fellowEl = (o: (typeof fellows)[number], i: number) =>
    o.on ? (
      <g key={`f${o.F.variant}`}>
        <GroundShadow x={o.x} y={o.F.y} s={o.F.s} />
        <Fellow variant={o.F.variant} pose={o.q} at={[o.x, o.F.y]} scale={o.F.s} uid={`fl${i}${o.F.variant}`} coat={CONTEXT_COAT} ink={CONTEXT_INK} />
      </g>
    ) : null;
  const top = tableTop(TABLE_AT, TABLE_S);

  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        {/* soft floor shadows under the groups (the room is the umber page; no wall line) */}
        <defs>
          <radialGradient id="ctn-floor">
            <stop offset="0" stopColor={DARK} stopOpacity={0.42} />
            <stop offset="1" stopColor={DARK} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={0} cy={6} rx={250} ry={34} fill="url(#ctn-floor)" />
        <ellipse cx={TABLE_AT[0]} cy={TABLE_AT[1] + 4} rx={200} ry={26} fill="url(#ctn-floor)" />
        <ellipse cx={-250} cy={-66} rx={170} ry={40} fill="url(#ctn-floor)" />
        <ellipse cx={260} cy={-66} rx={170} ry={40} fill="url(#ctn-floor)" />
        {rear.map(fellowEl)}
        {/* the Society's table, the globe and Newton's reflector on it */}
        <GroundShadow x={TABLE_AT[0] - 120 * TABLE_S} y={TABLE_AT[1]} s={TABLE_S} />
        <GroundShadow x={TABLE_AT[0] + 120 * TABLE_S} y={TABLE_AT[1]} s={TABLE_S} />
        <Table at={TABLE_AT} scale={TABLE_S} uid="ctn-tbl" w={TABLE.w * 0.86} />
        <Reflector at={[top[0] + 50 * TABLE_S, top[1] - 14 * TABLE_S]} scale={TABLE_S} uid="ctn-rfl" dir={-1} />
        <Globe at={[top[0] + 150 * TABLE_S, top[1] - 14 * TABLE_S]} scale={TABLE_S} uid="ctn-glb" turn={18 + frame * 0.12} />
        {front.map(fellowEl)}
        <GroundShadow x={NEWTON_X} y={0} s={1} />
        <Newton pose={nPose} at={[NEWTON_X, 0]} scale={1} uid="ctn-nwt" coat={ORANGE} />
        <GroundShadow x={pX} y={0} s={1} />
        <Pepys pose={pPose} at={[pX, 0]} scale={1} uid="ctn-pep" />
        {/* the names, over their heads, in world space */}
        <NameLabel text="PEPYS" x={pX - 12} y={HEAD_Y - 68} size={23} frame={frame} f0={6} />
        <NameLabel text="NEWTON" x={NEWTON_X + 24} y={HEAD_Y - 68} size={23} frame={frame} f0={78} />
      </WorldSvg>
    </TexcocoPage>
  );
};

/** for checks: where the Fellows stand on screen at a frame (their feet x) */
export const fellowScreenX = (frame: number) => {
  const cam = camOf(frame);
  return fellowWalks.map((w) => screenX(cam, w.x(frame)));
};

export default CloseToNewton;
