// ---------------------------------------------------------------------------
// MoreValuePerWatt (sam-gigawatt-cost, cut 3), rev 3 "stacks of cash". Cheeky Pint style, the realistic variant
// carried into the AIR (the Scott "air" look: scott-aircraft-order/aircraftShared.tsx AirStage, imported read-only).
// Opaque 1080x1920, 23.976 fps, 78 frames. Render with --gl=angle.
//
// CHECK LINE: with the sound off a viewer says "the money one watt earns is shooting up, fast."
//
// THE LINE (Sam Altman): "...if AI just gets increases in value per what it can do per watt so quickly, and there's
// such a supply shortage..." — this slot holds "increases in value per what it can do per watt so quickly, and".
// WORD -> FRAME (from f0; whisper, may run ~5 f early): AI -14 · just -9 · increases -2 · in 11 · value 16 · what 24 ·
// it 35 · can 38 · do 40 · per 44 · watt 47 · so 53 · quickly 58 · and 74 · (on camera) there's 80.
// DURATION: the slot 7.799 -> 11.053 s (sequence frames 187-265) = 3.254 s x 24000/1001 = 78 frames (f0..f77).
//
// THE PICTURE: nearly front-on at golden hour on the concrete apron, the far ground melting into the haze. In the
// lower foreground a small cream power tile says "1 W" in ink; its cable runs along the apron into a socket on the
// front of a cream pedestal at the centre. On the pedestal's tray sits a short stack of 4 banknote bundles (sage notes,
// an AMBER strap round the middle; cashBundle.tsx at 10x real size). Bundles drop into the frame from above and land
// on the stack with weight: a small squash that recovers without overshoot, a puff of paper air squirting out of the
// seam, and their contact shadow under them for good. They come faster and faster (gaps 11 -> 9.1 -> 7.6 -> 6.3 ->
// 5.2 -> 4.4 -> 3.5 -> 3.0 -> 2.6 f), and from f58 each drop is a strapped PAIR (the gap never goes under 2.6 f:
// identical bundles arriving faster than one every 2 f alias at 23.976 and the stream reads as hanging still), so the
// stack shoots up through "so quickly" (f53-58) and to the end, still being fed. The "1 W" never changes and the
// current in its cable (soft light bands) runs at one constant speed the whole cut: only the cash grows.
// CAMERA: ONE slow move, eased in before f0 and landing by the end (pedestal-top screen speed 0.24 px/f at f0,
// peaking 3.7 at f42-49, 0.96 at f77): a crane up with a tilt-up and a small pull-back (d 4.8 -> 6.1 m, pitch 10.7 ->
// 4.3 deg, target height 0.98 -> 1.8 m), so the frame follows the stack up while the tile stays in the lower left. Its
// "1 W" stays inside y 1471-1649 at every quarter frame, below the 1360-1460 caption band. The stack is 597 px wide at
// f0 (55 %) and 475 px at f77. Its top climbs from y 909 to y 348.
// Cause before effect: each drop's lowest bundle meets the top below it on the landing frame tL (4.5, 15.5, 24.6,
// 32.2, 38.5, 43.7, 48.1, 51.6, 54.6, then pairs at 57.2, 59.8, 62.4, 65.0, 67.6, 70.2, 72.8, 75.4); its squash and
// its puff start on that same frame. 4 bundles at f0, 28 by f77, more still falling. Every bundle is checked at 1/8 f
// at module load: none overlaps the one under it in the air (throws otherwise).
// AMBER = the dollars (the bundles' straps). Cream = the tile, the pedestal, the cable. Nothing else glows.
//
// SOURCES: none on screen (no figures; "value per watt rising fast" is the speaker's claim drawn as a mechanism).
// Pieces: valuePerWattPlan.ts (geometry, schedule, camera), valuePerWattWorld.tsx (the 3D world), cashBundle.tsx
// (the banknote bundles; owned by cut 6, imported read-only).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_NUM } from "../kits/cheeky-pint/stoutShared";
import { AirStage, airProject, type GroundSpec } from "../scott-aircraft-order/aircraftShared";
import {
  BUNDLES,
  CAM_REST,
  COLLISIONS,
  DURATION as PLAN_DURATION,
  FPS as PLAN_FPS,
  PUFF,
  TILE,
  TILE_FACE_Z,
  TILE_TEXT,
  bundleAt,
  camAt,
} from "./valuePerWattPlan";
import { ValueWorld } from "./valuePerWattWorld";

export const FPS = PLAN_FPS;
export const DURATION = PLAN_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

if (COLLISIONS.length) throw new Error(`MoreValuePerWatt: bundle collisions: ${COLLISIONS.join("; ")}`);

const GROUND: GroundSpec = { aprons: [[-40, -12, 40, 60]], joints: 4 };
const c01 = (v: number) => Math.max(0, Math.min(1, v));
type Cam = ReturnType<typeof camAt>;
type V3 = [number, number, number];

/** "1 W" printed on the tile's face: an affine map of the face plane (metres) to the screen, so it sits in the
 *  world's perspective and moves with the camera. In ink, Söhne Dreiviertelfett. */
const TileText: React.FC<{ cam: Cam }> = ({ cam }) => {
  const o: V3 = [TILE.x, TILE_TEXT.y, TILE_FACE_Z - 0.001];
  const P0 = airProject(cam, o);
  const Px = airProject(cam, [o[0] + 1, o[1], o[2]]);
  const Py = airProject(cam, [o[0], o[1] + 1, o[2]]);
  // local (u right, v down) metres -> screen
  const a = Px.x - P0.x;
  const b = Px.y - P0.y;
  const c = -(Py.x - P0.x);
  const d = -(Py.y - P0.y);
  const cap = TILE_TEXT.cap;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <g transform={`matrix(${a} ${b} ${c} ${d} ${P0.x} ${P0.y})`}>
        <text x={0} y={cap / 2} textAnchor="middle" fontFamily={FONT_NUM} fontWeight={700} fontSize={cap / 0.7} fill={COLOR.inkDark}>
          <tspan>1</tspan>
          <tspan dx={cap * 0.42}>W</tspan>
        </text>
      </g>
    </svg>
  );
};

/** The paper puff: at each landing the air trapped between the notes squirts out of the seam at both ends of the
 *  bundle and along its front, a thin wisp of paper dust that shoots out, slows, rises a touch and thins out. */
const Puffs: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const els: React.ReactNode[] = [];
  for (const b of BUNDLES) {
    if (b.tL < 0 || !b.lead) continue;
    const t = f - b.tL;
    const u = t / PUFF.life;
    if (u < 0 || u > 1) continue;
    const p = bundleAt(b, f);
    const out = 1 - Math.pow(1 - u, 3);
    const alpha = 0.8 * c01(t / 0.6 + 0.3) * Math.pow(1 - u, 1.8);
    const y = p.y + 0.01 + PUFF.rise * out;
    const zf = p.z - p.W / 2;
    const reach = PUFF.reach * out;
    // ends: an elongated wisp whose inner end stays at the seam; front: a low band along the seam
    const spots: { at: V3; rx: number; ry: number; o: number }[] = [
      { at: [p.x - p.L / 2 - reach * 0.55, y, zf + 0.12], rx: PUFF.size * 0.4 + reach * 0.6, ry: PUFF.size * (0.28 + 0.5 * out), o: 1 },
      { at: [p.x + p.L / 2 + reach * 0.55, y, zf + 0.12], rx: PUFF.size * 0.4 + reach * 0.6, ry: PUFF.size * (0.28 + 0.5 * out), o: 1 },
      { at: [p.x, y - 0.006, zf - 0.04 - 0.1 * out], rx: p.L * (0.42 + 0.1 * out), ry: PUFF.size * (0.16 + 0.32 * out), o: 0.45 },
    ];
    spots.forEach((s, j) => {
      const q = airProject(cam, s.at);
      els.push(<ellipse key={`${b.i}-${j}`} cx={q.x} cy={q.y} rx={s.rx * q.s} ry={s.ry * q.s} fill="url(#vpwPuff)" opacity={alpha * s.o} />);
    });
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id="vpwPuff">
          <stop offset="0" stopColor="#FCF7EE" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#F7EFE0" stopOpacity="0.5" />
          <stop offset="1" stopColor="#F7EFE0" stopOpacity="0" />
        </radialGradient>
      </defs>
      {els}
    </svg>
  );
};

const MoreValuePerWatt: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={CAM_REST}
      ground={GROUND}
      world={<ValueWorld f={f} />}
      overlay={
        <>
          <TileText cam={cam} />
          <Puffs f={f} cam={cam} />
        </>
      }
    />
  );
};

export default MoreValuePerWatt;
