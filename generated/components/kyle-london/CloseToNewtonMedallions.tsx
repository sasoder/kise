// ---------------------------------------------------------------------------
// CloseToNewtonMedallions (kyle-london, cut 22, V1: the portrait-medallion version, kept buildable; delivered as 22_CloseToNewton.mov V1). Dwarkesh map style (styles/dwarkesh-map.md), the umber page with no map
// (kits/maps TexcocoPage). Opaque 1080x1920, 29.97 fps, 148 frames.
//
// CHECK LINE: "Pepys, the diarist, sat right inside Newton's circle of scientists — shoulder to shoulder with them."
//
// THE LINE: "[...the very famous Diary of Samuel Pepys, who's this incredible] figure and is like very close to
// Newton and that social group. And his"
// WORD -> FRAME: incredible 4 · figure 15 · and 37 · is 50 · like 53 · very 62 · close 71 · to 81 · Newton 88 ·
// and 95 · that 103 · social 109 · group 119 · And 131 · his 142 (cut back to the speaker at 148)
// DURATION: the slot 22.155 -> 27.094 s (in frame 664 -> out frame 812 at 29.97) = 148 frames (f0..f147).
//
// THE MOTION: one continuous log-space pull-back (ln k falls ~0.0082 / frame from f0 to ~f120, then eases into a
// creep) that gathers a circle round one man. f0 opens tight on Pepys's oval engraved-portrait medallion (oval
// ~1100 px tall, face at y~810; cream frame: the man of the diary), already travelling; as the face shrinks it rises
// once so PEPYS can slide up inside the oval foot clear of the caption band (f20 -> f30). "very close to Newton":
// Newton's medallion (orange frame) glides in at full size from off the right edge (enters f47, rests f86, a 20 px
// gap: the closeness is the motion) while the camera pans onto the pair; NEWTON slides up f78 -> f88. "that social
// group": Wren, Halley, Boyle and Evelyn (orange frames, no labels) glide in from the frame edges in a stagger
// (f97 -> f127) and tuck in behind the pair. PAYOFF, just after "group" (f119): Pepys's frame takes the orange, a
// wipe running round the oval both ways from the point facing Newton (f118 -> f132, eased); his portrait stays cream
// duotone like everyone's. The cluster settles at ~90 % of the width, labels above y~945; then it breathes to the cut.
// Orange = the new science: the scientists' frames, and Pepys's once he is inside the circle. No lines, dates or
// Principia.
//
// SOURCES (portraits; baked by scripts/clips/kyle-london/bake-close-to-newton.ts from the refs the director's
// image agent downloaded, <working>/animation_source/refs/, licences per refs_sources.txt):
//   Pepys  — John Hayls, Samuel Pepys, 1666 (National Portrait Gallery, London), public domain,
//            https://commons.wikimedia.org/wiki/File:Samuel_Pepys.jpg
//   Newton — Godfrey Kneller, Isaac Newton, 1689, public domain,
//            https://commons.wikimedia.org/wiki/File:Portrait_of_Sir_Isaac_Newton,_1689.jpg
//   Wren   — Godfrey Kneller, Sir Christopher Wren, 1711 (NPG), public domain (PD-Art; NPG asserts rights over its
//            photograph), https://commons.wikimedia.org/wiki/File:Christopher_Wren_by_Godfrey_Kneller_1711.jpg
//            (the 960 px full portrait: the CC0 close-up photo has no shoulders and would not match the others' scale)
//   Halley — Thomas Murray, Edmond Halley, c.1690 (Royal Society), public domain,
//            https://commons.wikimedia.org/wiki/File:Edmund_Halley.jpg (inscription cropped out)
//   Boyle  — Johann Kerseboom, Robert Boyle ("Shannon portrait"), 1689 (Science History Institute), public domain,
//            https://commons.wikimedia.org/wiki/File:The_Shannon_Portrait_of_the_Hon_Robert_Boyle.jpg
//   Evelyn — after Godfrey Kneller, John Evelyn, 1687 (Surrey Archaeological Society), public domain,
//            https://commons.wikimedia.org/wiki/File:Godfrey_Kneller_(1646-1723)_(after)_-_John_Evelyn,_1687_-_PD-EV_-_Surrey_Archaeological_Society.jpg
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg, makeCamera, type Cam } from "../kits/maps/texcocoShared";
import { ACCENT, INK, LAND, fellSC, swayCam } from "../kits/maps/incaShared";
import { PORTRAITS, PORTRAIT_ASPECT, type PortraitName } from "./closeToNewtonData";

export const FPS = 30000 / 1001;
export const DURATION = 148;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const DARK = "#17120D"; // the style's casing (pearlShared), not incaShared's near-black

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t: number) => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};

// ---------------------------------------------------------------------------
// WORLD (world px; Pepys's medallion centre is the origin)
// ---------------------------------------------------------------------------
const PAIR_W = 400; // oval width of Pepys and Newton
const RING_W = 340; // the circle: a step smaller, behind the pair
const ovalH = (w: number) => w / PORTRAIT_ASPECT;
const GAP = 20;
const NEWTON_X = PAIR_W + GAP; // Newton's resting centre
const MID_X = NEWTON_X / 2; // the pair's midpoint

type Member = { name: PortraitName; x: number; y: number; from: [number, number]; f0: number; f1: number };
// final places round the pair (a group portrait: two above, one on each flank, all tucked behind)
const RING: Member[] = [
  { name: "halley", x: MID_X + 186, y: -388, from: [0.45, -1], f0: 97, f1: 119 },
  { name: "wren", x: MID_X - 478, y: -170, from: [-1, -0.2], f0: 101, f1: 123 },
  { name: "boyle", x: MID_X - 186, y: -392, from: [-0.45, -1], f0: 104, f1: 125 },
  { name: "evelyn", x: MID_X + 478, y: -166, from: [1, -0.15], f0: 107, f1: 127 },
];

// ---------------------------------------------------------------------------
// CAMERA: one pull-back. (wx, wy) lands on screen (540, sy) at zoom k.
// ---------------------------------------------------------------------------
// ln k falls at one steady rate (~0.0082 / frame) from the face filling the frame (f0) through the pair (f88) to the
// cluster (f128), then eases into the creep. sy = Pepys's centre on screen: it rises once, while the face shrinks,
// so his label clears the caption band, and then holds (no reversal).
const camAt = makeCamera([
  { f: 0, k: 2.15, wx: -8, wy: 0, sy: 965 },
  { f: 20, k: 1.83, wx: 30, wy: 0, sy: 812 },
  { f: 88, k: 1.04, wx: MID_X, wy: 0, sy: 822 },
  { f: 120, k: 0.81, wx: MID_X, wy: 0, sy: 835 },
  { f: 147, k: 0.74, wx: MID_X, wy: 0, sy: 840 },
]);
const camOf = (frame: number): Cam => swayCam(camAt(frame), frame);
const toScreen = (cam: Cam, x: number, y: number) => [540 + (x - cam.cx) * cam.k, 960 + (y - cam.cy) * cam.k];

// how far out along `dir` a medallion must start to be fully off frame at frame f
const offFrameStart = (x: number, y: number, w: number, dir: [number, number], f: number): [number, number] => {
  const cam = camOf(f);
  const n = Math.hypot(dir[0], dir[1]);
  const ux = dir[0] / n;
  const uy = dir[1] / n;
  const hw = w / 2 + 12;
  const hh = ovalH(w) / 2 + 12;
  for (let d = 0; d < 4000; d += 4) {
    const [sx, sy] = toScreen(cam, x + ux * d, y + uy * d);
    if (sx + hw * cam.k < 0 || sx - hw * cam.k > 1080 || sy + hh * cam.k < 0 || sy - hh * cam.k > 1920) return [x + ux * (d + 40), y + uy * (d + 40)];
  }
  return [x + ux * 4000, y + uy * 4000];
};

// Newton: from off the right edge (f47) to rest beside Pepys (f86)
const PEPYS_LABEL_F = 20; // the slide starts once the oval foot has risen clear of the caption band
const NEWTON_F0 = 47;
const NEWTON_F1 = 86;
const NEWTON_START = offFrameStart(NEWTON_X, 0, PAIR_W, [1, 0], NEWTON_F0)[0];
const RING_START = RING.map((m) => offFrameStart(m.x, m.y, RING_W, m.from, m.f0));

// the settled breath: a tiny seeded drift per medallion once it has landed
const breath = (frame: number, seed: number, land: number) => {
  const a = clamp01((frame - land) / 20);
  return [a * 2.2 * Math.sin(frame / 17 + seed * 1.7), a * 2.6 * Math.sin(frame / 21 + seed * 2.3)];
};

// ---------------------------------------------------------------------------
// MEDALLION: the cream duotone portrait in an oval, a thin frame (cream or orange) on a dark casing
// ---------------------------------------------------------------------------
const LABEL_BASE = 0.54; // label baseline, as a fraction of the half-height below the oval centre (the oval foot)
const Medallion: React.FC<{ name: PortraitName; cx: number; cy: number; w: number; frameColor: string; label?: string; labelT?: number; wipe?: number }> = ({
  name,
  cx,
  cy,
  w,
  frameColor,
  label,
  labelT = 0,
  wipe = 0,
}) => {
  const rx = w / 2;
  const ry = ovalH(w) / 2;
  const lw = w * 0.012; // frame line
  const clip = `ctn-clip-${name}`;
  const lab = clamp01(labelT);
  const labE = easeOut(lab);
  const size = w * 0.16;
  return (
    <g>
      {/* soft contact shade, then the casing */}
      <ellipse cx={cx + w * 0.015} cy={cy + w * 0.03} rx={rx + lw * 5} ry={ry + lw * 5} fill={DARK} fillOpacity={0.35} />
      <ellipse cx={cx} cy={cy} rx={rx + lw * 3.2} ry={ry + lw * 3.2} fill={DARK} fillOpacity={0.92} />
      <clipPath id={clip}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x={cx - rx} y={cy - ry} width={w} height={2 * ry} fill={LAND} />
        <image href={PORTRAITS[name]} x={cx - rx} y={cy - ry} width={w} height={2 * ry} preserveAspectRatio="none" />
        {label && lab > 0 ? (
          <g opacity={easeInOut(lab)}>
            <ellipse cx={cx} cy={cy + LABEL_BASE * ry - size * 0.34} rx={rx * 0.8} ry={size * 0.72} fill={DARK} fillOpacity={0.72} style={{ filter: `blur(${size * 0.3}px)` }} />
            <text
              x={cx + size * 0.05}
              y={cy + LABEL_BASE * ry + size * 0.25 * (1 - labE)}
              textAnchor="middle"
              fill={INK}
              stroke={DARK}
              strokeOpacity={0.88}
              strokeWidth={size * 0.15}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * 0.07 }}
            >
              {label}
            </text>
          </g>
        ) : null}
      </g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={DARK} strokeWidth={lw * 0.8} />
      <ellipse cx={cx} cy={cy} rx={rx + lw * 1.1} ry={ry + lw * 1.1} fill="none" stroke={frameColor} strokeWidth={lw * 1.25} />
      <ellipse cx={cx} cy={cy} rx={rx + lw * 2.6} ry={ry + lw * 2.6} fill="none" stroke={frameColor} strokeWidth={lw * 0.45} strokeOpacity={0.85} />
      {wipe > 0 ? (
        // the orange running round the frame from its right-hand point (where it faces Newton), both ways at once
        <g fill="none" stroke={ACCENT} strokeLinecap="butt">
          {[1.1, 2.6].map((o, i) => {
            const ax = rx + lw * o;
            const ay = ry + lw * o;
            const sw = i === 0 ? lw * 1.25 + 0.6 : lw * 0.45 + 0.4;
            const op = i === 0 ? 1 : 0.85;
            if (wipe >= 1) return <ellipse key={o} cx={cx} cy={cy} rx={ax} ry={ay} strokeWidth={sw} strokeOpacity={op} />;
            return (
              <g key={o} strokeWidth={sw} strokeOpacity={op}>
                <path d={`M${cx + ax},${cy} A${ax},${ay} 0 0 0 ${cx - ax},${cy}`} pathLength={1} strokeDasharray={`${wipe} 2`} />
                <path d={`M${cx + ax},${cy} A${ax},${ay} 0 0 1 ${cx - ax},${cy}`} pathLength={1} strokeDasharray={`${wipe} 2`} />
              </g>
            );
          })}
        </g>
      ) : null}
    </g>
  );
};

const CloseToNewtonMedallions: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);

  // Newton: ease-out glide (already moving as he crosses the edge), the last few px closing slowly
  const nt = easeOut((frame - NEWTON_F0) / (NEWTON_F1 - NEWTON_F0));
  const newtonX = NEWTON_START + (NEWTON_X - NEWTON_START) * nt;
  const nb = breath(frame, 2, NEWTON_F1);
  const pb = breath(frame, 1, 30);

  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        {RING.map((m, i) => {
          if (frame < m.f0) return null;
          const t = easeOut((frame - m.f0) / (m.f1 - m.f0));
          const [sx, sy] = RING_START[i];
          const b = breath(frame, 3 + i, m.f1);
          return <Medallion key={m.name} name={m.name} cx={sx + (m.x - sx) * t + b[0]} cy={sy + (m.y - sy) * t + b[1]} w={RING_W} frameColor={ACCENT} />;
        })}
        {frame >= NEWTON_F0 ? (
          <Medallion name="newton" cx={newtonX + nb[0]} cy={nb[1]} w={PAIR_W} frameColor={ACCENT} label="NEWTON" labelT={(frame - 78) / 10} />
        ) : null}
        <Medallion name="pepys" cx={pb[0]} cy={pb[1]} w={PAIR_W} frameColor={INK} label="PEPYS" labelT={(frame - PEPYS_LABEL_F) / 10} wipe={easeInOut((frame - 118) / 14)} />
      </WorldSvg>
    </TexcocoPage>
  );
};

export default CloseToNewtonMedallions;
