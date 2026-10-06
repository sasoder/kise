import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BG_OVERSIZE, sway } from "./fieldShared";
import {
  CAM_DAMP,
  CAM_STIFF,
  FONT_SANS,
  FONT_SERIF,
  INK,
  INK_HI,
  InkDiffuse,
  PAPER,
  PAPER_SRC,
  RED,
  RED_DEEP,
  RISE_PX,
  clamp01,
  cumLen,
  easeInCubic,
  easeOutCubic,
  hash01,
  inkDiffuse,
  labelWidth,
  labelPx,
  lerp,
  mixHex,
  paperShadow,
  pointAtLen,
  smoothstep,
  subPathD,
  textBlurPx,
  worldBlur,
} from "./chinatalkShared";
import type { Anchor, Cam, FollowerState, Glide, Pt } from "./chinatalkShared";

// Everything a maven cut needs from the house kit, so a cut imports ONE module.
export {
  Bead,
  DashedPath,
  ENTER_F,
  ENTER_LEAD,
  FONT_SANS,
  FONT_SERIF,
  INK,
  INK_HI,
  INK_LO,
  InkDiffuse,
  InkPath,
  PAPER,
  RED,
  RED_DEEP,
  RED_WET,
  RISE_PX,
  RUNG_F,
  WetLine,
  camEase,
  camFromTrack,
  clamp01,
  cumLen,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  enterFrom,
  enterU,
  evenEase,
  exitU,
  glideTargetAt,
  hash01,
  inkDiffuse,
  lerp,
  mixHex,
  paperShadow,
  pointAtLen,
  polyD,
  rungAt,
  shootEase,
  smoothstep,
  subPathD,
  textBlurPx,
  worldBlur,
} from "./chinatalkShared";
export type { Anchor, Cam, FollowerState, Glide, Pt } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// mavenShared — the picture vocabulary of the Bharat "Project Maven's data
// problem" clip (ChinaTalk style, LANDSCAPE 1920x1080, 24 fps, opaque).
//
// ACCENT: vermilion = THE RELEVANT TARGET. A solid RED seal square is a real
// target that is there; a DASHED red square is the target the model expects;
// RED_DEEP is a target that is there but not found. Nothing else is red.
//
// CONVENTIONS (as chinatalkShared): coordinates are WORLD px, y down; `k` is
// the camera zoom; `rung` is an ABSOLUTE ink opacity (INK_HI 0.90 / INK_LO
// 0.42); progress props are raw linear 0..1 and the component applies the
// curve; everything time-dependent takes the clock S (never useCurrentFrame).
// Unlike chinatalkShared, stroke weights here are set from the ON-SCREEN size
// of the thing (mStrokePx), because a DataFrame is used from a 600 px hero down
// to a 60 px field tile and the k^0.75 law alone gives hairlines in the wide.
// ---------------------------------------------------------------------------

// --- the landscape frame ------------------------------------------------------
export const W = 1920;
export const H = 1080;
/** content centre on screen */
export const CX = 960;
export const CY = 470;
/** captions: no subject ink or label below this screen y */
export const CAPTION_TOP = 830;
/** clear margin at the left / right frame edge, screen px */
export const SIDE_SAFE = 110;
/** camera centre = look + M_CAM_LIFT / k, so a LOOK lands at screen y CY */
export const M_CAM_LIFT = H / 2 - CY;

// --- the landscape camera -----------------------------------------------------
/** A camera centre from a LOOK (content centre, lands at screen (CX, CY)) and k. */
export const mCamFromLook = (x: number, y: number, k: number): Cam => ({ x, y: y + M_CAM_LIFT / k, k });
/** The LOOK (content centre) of a camera. */
export const mLookOf = (c: Cam): Cam => ({ x: c.x, y: c.y - M_CAM_LIFT / c.k, k: c.k });
/** Where a world point lands on screen under camera c (no sway). */
export const mToScreen = (c: Cam, x: number, y: number): Pt => ({ x: W / 2 + (x - c.x) * c.k, y: H / 2 + (y - c.y) * c.k });
/** The world point under a screen point for camera c (no sway). */
export const mToWorld = (c: Cam, sx: number, sy: number): Pt => ({ x: c.x + (sx - W / 2) / c.k, y: c.y + (sy - H / 2) / c.k });

/** The damped follower (chinatalkShared.runFollower with the landscape lift),
 *  run over integer frames f0..f1 chasing `targetAt(f)` (LOOK space). It
 *  follows ln k, not k, so a long pull-back is as smooth in the wide as in the
 *  close. Starts at rest on the first target unless `from` (the state at f0) is
 *  given. Returns camera centres and states indexed f - f0. */
export const mRunFollower = (targetAt: (f: number) => Cam, f0: number, f1: number, from?: FollowerState) => {
  const cams: Cam[] = [];
  const states: FollowerState[] = [];
  const t0 = targetAt(f0);
  // internal state: x, look-y and ln k (the lift is applied on the way out)
  let c: Cam = from ? { x: from.pos.x, y: from.pos.y - M_CAM_LIFT / from.pos.k, k: Math.log(from.pos.k) } : { x: t0.x, y: t0.y, k: Math.log(t0.k) };
  let v: Cam = from ? { x: from.vel.x, y: from.vel.y, k: from.vel.k / from.pos.k } : { x: 0, y: 0, k: 0 };
  for (let f = f0; f <= f1; f++) {
    const tl = targetAt(f);
    if (f > f0) {
      v = {
        x: v.x + (tl.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (tl.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (Math.log(tl.k) - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    const kk = Math.exp(c.k);
    const pos = mCamFromLook(c.x, c.y, kk);
    cams.push(pos);
    states.push({ pos, vel: { x: v.x, y: v.y, k: v.k * kk }, target: { ...tl } });
  }
  return { cams, states };
};

/** A whole landscape camera track from a start LOOK + glides: returns camAt(S)
 *  (fractional S), the per-frame cams, the states and the last camera. */
export const mCameraTrack = (start: Cam, glides: Glide[], f0: number, f1: number, from?: FollowerState) => {
  const targetAt = (f: number): Cam => {
    let x = start.x;
    let y = start.y;
    let lk = Math.log(start.k);
    let kPrev = start.k;
    for (const g of glides) {
      const u = clamp01((f - g.f0) / (g.f1 - g.f0));
      let e: number;
      if (g.even !== undefined) {
        const rr = Math.max(0.01, Math.min(0.5, g.even));
        const vmax = 1 / (1 - rr);
        e = u < rr ? (vmax * u * u) / (2 * rr) : u > 1 - rr ? 1 - (vmax * (1 - u) * (1 - u)) / (2 * rr) : (vmax * rr) / 2 + vmax * (u - rr);
      } else {
        e = smoothstep(Math.pow(u, g.warp ?? 1));
      }
      x += (g.dx ?? 0) * e;
      y += (g.dy ?? 0) * e;
      if (g.k !== undefined) {
        lk += (Math.log(g.k) - Math.log(kPrev)) * e;
        kPrev = g.k;
      }
    }
    return { x, y, k: Math.exp(lk) };
  };
  const { cams, states } = mRunFollower(targetAt, f0, f1, from);
  const camAt = (S: number): Cam => {
    const t = Math.max(0, Math.min(cams.length - 1, S - f0));
    const i = Math.max(0, Math.min(cams.length - 2, Math.floor(t)));
    const u = t - i;
    const a = cams[i];
    const b = cams[i + 1] ?? a;
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, k: Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * u) };
  };
  return { camAt, cams, states, targetAt, last: cams[cams.length - 1] };
};

/** Camera smoothness over S0..S1 on the landscape frame: max |dv| of fixed
 *  world points (screen px / frame^2), where, and the max screen speed. */
export const mCamJerk = (camAt: (S: number) => Cam, S0: number, S1: number, skip: number[] = []) => {
  let maxA = 0;
  let atS = S0;
  let maxV = 0;
  let atV = S0;
  const pts = [
    [-700, -330],
    [700, 300],
    [0, 0],
  ];
  for (let S = S0 + 1; S < S1; S++) {
    const c0 = camAt(S - 1);
    const c1 = camAt(S);
    const c2 = camAt(S + 1);
    for (const [ox, oy] of pts) {
      const wx = c1.x + ox / c1.k;
      const wy = c1.y + oy / c1.k;
      const s0 = mToScreen(c0, wx, wy);
      const s1 = mToScreen(c1, wx, wy);
      const s2 = mToScreen(c2, wx, wy);
      const vv = Math.hypot(s1.x - s0.x, s1.y - s0.y);
      if (vv > maxV) {
        maxV = vv;
        atV = S;
      }
      const a = Math.hypot(s2.x - 2 * s1.x + s0.x, s2.y - 2 * s1.y + s0.y);
      if (a > maxA && !skip.some((f) => S >= f && S < f + 3)) {
        maxA = a;
        atS = S;
      }
    }
  }
  return { maxA, atS, maxV, atV };
};

// --- the landscape stage --------------------------------------------------------
export type MStageView = { cam: Cam; dx: number; dy: number };
const MStageViewContext = React.createContext<MStageView | null>(null);
export const useMStageView = (): MStageView | null => React.useContext(MStageViewContext);
/** label edge-fade margin, screen px */
export const M_EDGE_SAFE = 48;
/** 1 when the world box sits >= M_EDGE_SAFE screen px inside every frame edge, 0 when it touches one. */
export const mEdgeFactor = (view: MStageView | null, x0: number, y0: number, x1: number, y1: number) => {
  if (!view) return 1;
  const { cam, dx, dy } = view;
  const sx0 = W / 2 + (x0 - cam.x) * cam.k + dx;
  const sx1 = W / 2 + (x1 - cam.x) * cam.k + dx;
  const sy0 = H / 2 + (y0 - cam.y) * cam.k + dy;
  const sy1 = H / 2 + (y1 - cam.y) * cam.k + dy;
  return smoothstep(Math.min(sx0, W - sx1, sy0, H - sy1) / M_EDGE_SAFE);
};

const MPaperGround: React.FC<{ S: number; cam: Cam; rest: Cam }> = ({ S, cam, rest }) => {
  const k = cam.k;
  const bgY = -(cam.y - rest.y) * k * 0.15 - S * 0.3;
  const bgX = -(cam.x - rest.x) * k * 0.15;
  const bgScale = 1 + (k / rest.k - 1) * 0.3;
  // the fibre grain is a portrait bitmap: draw it WIDTH-fitted and oversized, so
  // the grain keeps its scale and there is slack on every side for the parallax
  const side = W * BG_OVERSIZE;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(PAPER_SRC)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: side,
          height: side,
          objectFit: "cover",
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${Math.max(0.72, Math.min(2.4, bgScale)).toFixed(4)})`,
        }}
      />
    </AbsoluteFill>
  );
};
const MWarmVignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      mixBlendMode: "multiply",
      background: "radial-gradient(ellipse 100% 100% at 50% 50%, #FFFFFF 32%, #FCFBF9 52%, #F5F3EF 70.7%, #F3F1ED 100%)",
    }}
  />
);
/** The landscape rice-paper Stage (1920x1080): paper + fibre grain at parallax
 *  0.15 with the slow drift, the world group under the camera with the house
 *  sway, the warm vignette. `rest` = the camera the parallax is measured against
 *  (use the cut's LAST camera). Children are SVG, in world px. */
export const MStage: React.FC<{ S: number; cam: Cam; rest: Cam; children: React.ReactNode }> = ({ S, cam, rest, children }) => {
  const sw = sway(S);
  const k = cam.k;
  const tx = W / 2 - cam.x * k + sw.dx;
  const ty = H / 2 - cam.y * k + sw.dy;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <MPaperGround S={S} cam={cam} rest={rest} />
      <AbsoluteFill>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <g transform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(6)})`}>
            <MStageViewContext.Provider value={{ cam, dx: sw.dx, dy: sw.dy }}>{children}</MStageViewContext.Provider>
          </g>
        </svg>
      </AbsoluteFill>
      <MWarmVignette />
    </AbsoluteFill>
  );
};

// --- sizes ------------------------------------------------------------------------
/** The ink stroke (SCREEN px) of a thing that is `sizeS` screen px wide: 5.5 px
 *  on a 560 px hero frame, ~2.9 px on a 130 px grid tile, 2 px on a 60 px field
 *  tile. One law for frames, brackets and rings, so a piece keeps one weight. */
export const mStrokePx = (sizeS: number) => Math.max(1.9, Math.min(6, 5.5 * Math.pow(Math.max(1, sizeS) / 560, 0.45)));
/** the standard grid tile (WORLD px): A's 9 x 4 field is built from these at k 1 */
export const TILE_W = 130;
export const TILE_H = 97.5;
export const TILE_GAP = 16;
export const TILE_PITCH_X = TILE_W + TILE_GAP;
export const TILE_PITCH_Y = TILE_H + TILE_GAP;
/** the seed of the field tile at (col, row) — the same tile looks the same in every cut */
export const tileSeed = (col: number, row: number) => 1000 + col * 37 + row * 101;
/** title labels (DATA, MODEL, OPERATIONS): SCREEN font px */
export const M_TITLE_PX = 58;
/** small labels, SCREEN font px (never go below this for words) */
export const M_WORD_PX = 46;
/** numbers, SCREEN font px */
export const M_VALUE_PX = 84;

// --- labels -----------------------------------------------------------------------
export type MLabelKind = "word" | "value";
const M_TYPE = {
  value: { font: FONT_SERIF, weight: 700, track: 0, cap: 0.667, numeric: "lining-nums" as string | undefined },
  word: { font: FONT_SANS, weight: 600, track: 0.12, cap: 0.669, numeric: undefined as string | undefined },
};
/** The WORLD font size of a label drawn at `px` screen px: constant on screen,
 *  or, with `kRef`, following the house k^0.75 law about that zoom, floored at
 *  `minPx` screen px. */
export const mLabelFs = (px: number, k: number, kRef?: number, minPx?: number) => {
  const s = kRef === undefined ? px : px * Math.pow(k / kRef, 0.75);
  return Math.max(s, minPx ?? 0) / k;
};
/** Approximate advance width (WORLD px) of a label at world font size `fs`. */
export const mLabelWidth = (text: string, kind: MLabelKind, fs: number) => (labelWidth(text, kind, 1.2) / labelPx(kind, 1.2)) * fs;

/** A landscape label (world space). (x, y) anchors the CAPITALS' box (y = the
 *  caps' vertical centre). `px` is its SCREEN font size (default M_TITLE_PX for
 *  words, M_VALUE_PX for values); it stays that size on screen unless `kRef` is
 *  given (then k^0.75 about kRef, floored at `minPx`). Enters sliding up 24
 *  screen px + fade + blur 6 -> 0 (`appear`, raw 0..1, 12 f: use enterU /
 *  enterFrom); exits by the reverse (`exit`) or diffuses like ink (`diffuse`).
 *  Fades within 48 px of a frame edge. Words are Source Sans 3 SemiBold caps
 *  tracked 0.12 em; values Source Serif 4 Bold. Colour is ink unless given. */
export const MLabel: React.FC<{
  text: string;
  x: number;
  y: number;
  k: number;
  kind?: MLabelKind;
  px?: number;
  kRef?: number;
  minPx?: number;
  rung?: number;
  appear?: number;
  exit?: number;
  diffuse?: number;
  anchor?: Anchor;
  color?: string;
}> = ({ text, x, y, k, kind = "word", px, kRef, minPx, rung = INK_HI, appear = 1, exit = 0, diffuse = 0, anchor = "middle", color = INK }) => {
  const view = useMStageView();
  const a = clamp01(appear);
  const e = clamp01(exit);
  const t = M_TYPE[kind];
  const fs = mLabelFs(px ?? (kind === "value" ? M_VALUE_PX : M_TITLE_PX), k, kRef, minPx);
  const lift = ((1 - easeOutCubic(a)) + easeInCubic(e)) * (RISE_PX / k);
  const w = mLabelWidth(text, kind, fs);
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const capH = t.cap * fs;
  const yy = y + lift;
  const dif = inkDiffuse(diffuse);
  const op = rung * smoothstep(a) * (1 - smoothstep(e)) * dif.opacity * mEdgeFactor(view, x0, yy - capH / 2, x0 + w, yy + capH / 2);
  if (op <= 0.002) return null;
  const comp = anchor === "middle" ? t.track / 2 : anchor === "end" ? t.track : 0;
  const blur = textBlurPx(a, e) + (diffuse > 0 ? dif.blur : 0);
  const cx = x0 + w / 2;
  const s = 1 + (diffuse > 0 ? dif.spread : 0);
  return (
    <g style={{ filter: worldBlur(blur, k) }} opacity={op.toFixed(4)}>
      <text
        x={(x + comp * fs).toFixed(3)}
        y={(yy + (t.cap / 2) * fs).toFixed(3)}
        fontFamily={t.font}
        fontWeight={t.weight}
        fontSize={fs.toFixed(3)}
        letterSpacing={`${t.track}em`}
        textAnchor={anchor}
        fill={color}
        transform={s !== 1 ? `translate(${cx.toFixed(2)} ${yy.toFixed(2)}) scale(${s.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-yy).toFixed(2)})` : undefined}
        style={t.numeric ? { fontVariantNumeric: t.numeric } : undefined}
      >
        {kind === "word" ? text.toUpperCase() : text}
      </text>
    </g>
  );
};

// --- the wet-ink line (screen-weighted) ---------------------------------------------
/** A polyline written in wet ink at a SCREEN stroke weight. Drawn [0, len]
 *  (world px of arc length; all of it when omitted). The freshest `wetPx` screen
 *  px behind the tip are wet (full ink, 15 % thicker) fading by `wet` (0..1, the
 *  caller's dryness clock: 1 = just written, 0 = dry); the tip carries an ink
 *  bead at `bead` (0..1). Ink sits flat (no shadow). */
export const MWetLine: React.FC<{
  points: Pt[];
  k: number;
  strokePx: number;
  len?: number;
  rung?: number;
  wet?: number;
  bead?: number;
  wetPx?: number;
  color?: string;
}> = ({ points, k, strokePx, len, rung = INK_HI, wet = 0, bead = 0, wetPx = 90, color = INK }) => {
  if (points.length < 2 || rung <= 0.002) return null;
  const cum = cumLen(points);
  const total = cum[cum.length - 1];
  const L = Math.max(0, Math.min(total, len ?? total));
  if (L <= 0.05) return null;
  const w = strokePx / k;
  const wl = wetPx / k;
  const segs: React.ReactNode[] = [];
  if (wet > 0.02) {
    const n = 6;
    const s00 = Math.max(0, L - wl);
    for (let i = 0; i < n; i++) {
      const s0 = s00 + ((L - s00) * i) / n;
      const s1 = s00 + ((L - s00) * (i + 1)) / n;
      const ww = wet * smoothstep((i + 1) / n);
      segs.push(
        <path
          key={i}
          d={subPathD(points, cum, s0, s1)}
          fill="none"
          stroke={color}
          strokeOpacity={ww.toFixed(4)}
          strokeWidth={(w * (1 + 0.15 * ww)).toFixed(3)}
          strokeLinecap={i === n - 1 ? "round" : "butt"}
          strokeLinejoin="round"
        />,
      );
    }
  }
  const tip = pointAtLen(points, cum, L);
  const br = w * 1.15;
  return (
    <g>
      <path d={subPathD(points, cum, 0, L)} fill="none" stroke={color} strokeOpacity={rung.toFixed(4)} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
      {segs}
      {bead > 0.01 ? (
        <g opacity={(bead * Math.min(1, rung / INK_HI)).toFixed(4)}>
          <circle cx={tip.x.toFixed(3)} cy={tip.y.toFixed(3)} r={(2.6 * br).toFixed(3)} fill={color} opacity={0.1} />
          <circle cx={tip.x.toFixed(3)} cy={tip.y.toFixed(3)} r={br.toFixed(3)} fill={color} />
          <circle cx={(tip.x - 0.36 * br).toFixed(3)} cy={(tip.y - 0.36 * br).toFixed(3)} r={(0.28 * br).toFixed(3)} fill={PAPER} opacity={0.5} />
        </g>
      ) : null}
    </g>
  );
};

// --- the seal ---------------------------------------------------------------------
/** The smallest a seal is ever drawn, SCREEN px. */
export const SEAL_MIN_PX = 9;
/** The colour of a target between found/there (0 = RED) and missed (1 = RED_DEEP). */
export const targetColor = (deep: number) => (deep <= 0 ? RED : deep >= 1 ? RED_DEEP : mixHex(RED, RED_DEEP, deep));
/** THE TARGET: a chop-seal square centred on (x, y), `side` WORLD px (never
 *  drawn smaller than 9 screen px), corner ~2 screen px. `deep` 0..1 eases RED
 *  -> RED_DEEP (missed / at rest). `grow` (raw 0..1) scales it in from 0.
 *  Warm paper shadow under it (`shadow`, on by default; switch it off in a
 *  field of many for speed). */
export const TargetSeal: React.FC<{
  x: number;
  y: number;
  side: number;
  k: number;
  deep?: number;
  grow?: number;
  opacity?: number;
  shadow?: boolean;
}> = ({ x, y, side, k, deep = 0, grow = 1, opacity = 1, shadow = true }) => {
  const g = easeOutCubic(grow);
  if (g <= 0.001 || opacity <= 0.002) return null;
  const s = Math.max(side, SEAL_MIN_PX / k) * g;
  const rr = Math.min(s * 0.16, (2.5 / k) * g + s * 0.03);
  return (
    <rect
      x={(x - s / 2).toFixed(3)}
      y={(y - s / 2).toFixed(3)}
      width={s.toFixed(3)}
      height={s.toFixed(3)}
      rx={rr.toFixed(3)}
      fill={targetColor(deep)}
      opacity={opacity < 1 ? opacity.toFixed(4) : undefined}
      style={shadow ? { filter: paperShadow(k) } : undefined}
    />
  );
};

// --- the data frame ---------------------------------------------------------------
/** The outline of a tile w x h centred on (0, 0) as a closed polyline that
 *  starts at the top-left corner's end and runs clockwise (near-square corners,
 *  radius 5 % of the height). */
export const framePoints = (w: number, h: number): Pt[] => {
  const r = Math.min(w, h) * 0.05;
  const hw = w / 2;
  const hh = h / 2;
  const pts: Pt[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 5; i++) {
      const a = a0 + (i / 5) * (Math.PI / 2);
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  };
  pts.push({ x: -hw + r, y: -hh });
  corner(hw - r, -hh + r, -Math.PI / 2);
  corner(hw - r, hh - r, 0);
  corner(-hw + r, hh - r, Math.PI / 2);
  corner(-hw + r, -hh + r, Math.PI);
  return pts;
};
/** Where the target sits inside the tile of this seed, as fractions of the
 *  tile's width / height from its top-left (kept clear of the edges). */
export const seedTargetPos = (seed: number) => ({ tx: 0.24 + 0.52 * hash01(seed, 71), ty: 0.26 + 0.48 * hash01(seed, 72) });
/** The seal's world side inside a frame `w` wide. */
export const frameSealSide = (w: number) => w * 0.105;

const terrainD = (w: number, h: number, seed: number) => {
  // three contour hairlines that cross the tile edge to edge (a ridge, a track,
  // a river): seeded, so every tile reads as a different image
  const iw = w * 0.5;
  const ih = h * 0.5;
  const parts: string[] = [];
  const n = 2 + (hash01(seed, 5) > 0.45 ? 1 : 0);
  const tilt = (hash01(seed, 6) - 0.5) * 0.5;
  for (let i = 0; i < n; i++) {
    const base = -0.62 + (1.24 * (i + 0.5 + (hash01(seed, 10 + i) - 0.5) * 0.5)) / n;
    const y0 = (base - tilt) * ih;
    const y1 = (base + tilt + (hash01(seed, 20 + i) - 0.5) * 0.3) * ih;
    const c1 = (base + (hash01(seed, 30 + i) - 0.5) * 0.9) * ih;
    const c2 = (base + (hash01(seed, 40 + i) - 0.5) * 0.9) * ih;
    const cl = (v: number) => Math.max(-ih * 0.86, Math.min(ih * 0.86, v));
    parts.push(
      `M${(-iw).toFixed(2)} ${cl(y0).toFixed(2)}C${(-iw * 0.35).toFixed(2)} ${cl(c1).toFixed(2)} ${(iw * 0.3).toFixed(2)} ${cl(c2).toFixed(2)} ${iw.toFixed(2)} ${cl(y1).toFixed(2)}`,
    );
  }
  // one short cross stroke (a road meeting the track)
  const xr = (hash01(seed, 50) - 0.5) * iw * 1.1;
  const up = hash01(seed, 51) > 0.5 ? -1 : 1;
  parts.push(`M${xr.toFixed(2)} ${(up * ih).toFixed(2)}Q${(xr + iw * 0.18).toFixed(2)} ${(up * ih * 0.55).toFixed(2)} ${(xr + iw * 0.1).toFixed(2)} ${(up * ih * 0.12).toFixed(2)}`);
  return parts.join("");
};

/** ONE PIECE OF DATA: a 4:3 tile (one drone video frame) centred on (x, y),
 *  `w` WORLD px wide (h = 0.75 w). Ink outline at mStrokePx of its on-screen
 *  width, near-square corners, an INK 0.06 wash, and seeded terrain hairlines
 *  inside (they fade out below ~90 screen px wide). `target`: 'none' | 'red'
 *  (a real target, solid RED seal) | 'deep' (there but not found, RED_DEEP);
 *  `deep` (0..1) overrides the mix for an eased RED -> RED_DEEP change;
 *  (tx, ty) place the seal as fractions of the tile (default: from the seed).
 *  `reveal` (raw 0..1): the outline is written clockwise in wet ink (0..0.7)
 *  and the wash + terrain soak in (0.35..1); `wet` (0..1) keeps the tip wet +
 *  beaded. `diffuse` (raw 0..1) retires the tile like ink on wet paper.
 *  `strokePx` overrides the stroke. `soak` (0..1, ADDED) overrides how far the
 *  wash + terrain have soaked in, independent of `reveal` (a frame whose inside
 *  is there while its outline is still being written). */
export const DataFrame: React.FC<{
  x: number;
  y: number;
  w: number;
  k: number;
  seed: number;
  rung?: number;
  target?: "none" | "red" | "deep";
  deep?: number;
  tx?: number;
  ty?: number;
  reveal?: number;
  wet?: number;
  diffuse?: number;
  strokePx?: number;
  sealShadow?: boolean;
  soak?: number;
}> = ({ x, y, w, k, seed, rung = INK_HI, target = "none", deep, tx, ty, reveal = 1, wet, diffuse = 0, strokePx, sealShadow = true, soak: soakIn }) => {
  const rv = clamp01(reveal);
  if (rv <= 0.001 || rung <= 0.002 || diffuse >= 1) return null;
  const h = w * 0.75;
  const wS = w * k;
  const sp = strokePx ?? mStrokePx(wS);
  const pts = framePoints(w, h);
  const closed = [...pts, pts[0]];
  const cum = cumLen(closed);
  const total = cum[cum.length - 1];
  const drawU = rv >= 1 ? 1 : 1 - Math.pow(1 - clamp01(rv / 0.7), 2);
  const soak = soakIn !== undefined ? clamp01(soakIn) : rv >= 1 ? 1 : smoothstep((rv - 0.35) / 0.65);
  const wetness = wet ?? (rv >= 1 ? 0 : 1 - smoothstep((rv - 0.6) / 0.4));
  const rel = Math.min(1, rung / INK_HI);
  const terrainOp = 0.24 * rel * soak * smoothstep((wS - 78) / 24);
  const tp = seedTargetPos(seed);
  const fx = tx ?? tp.tx;
  const fy = ty ?? tp.ty;
  const dp = deep ?? (target === "deep" ? 1 : 0);
  const body = (
    <g transform={`translate(${x.toFixed(3)} ${y.toFixed(3)})`}>
      {soak > 0.002 ? (
        <path d={`${subPathD(closed, cum, 0, total)}Z`} fill={INK} fillOpacity={(0.06 * soak * (0.55 + 0.45 * rel)).toFixed(4)} stroke="none" />
      ) : null}
      {terrainOp > 0.004 ? (
        <path
          d={terrainD(w - (2.2 * sp) / k, h - (2.2 * sp) / k, seed)}
          fill="none"
          stroke={INK}
          strokeOpacity={terrainOp.toFixed(4)}
          strokeWidth={(Math.max(1.3, sp * 0.42) / k).toFixed(3)}
          strokeLinecap="round"
        />
      ) : null}
      {target !== "none" ? (
        <TargetSeal x={(fx - 0.5) * w} y={(fy - 0.5) * h} side={frameSealSide(w)} k={k} deep={dp} opacity={soak} shadow={sealShadow} />
      ) : null}
      {drawU >= 1 && wetness <= 0.02 ? (
        <path d={`${subPathD(closed, cum, 0, total)}Z`} fill="none" stroke={INK} strokeOpacity={rung.toFixed(4)} strokeWidth={(sp / k).toFixed(3)} strokeLinejoin="round" />
      ) : (
        <MWetLine points={closed} k={k} strokePx={sp} len={total * drawU} rung={rung} wet={wetness} bead={wetness} wetPx={Math.min(90, wS * 0.5)} />
      )}
    </g>
  );
  if (diffuse > 0) {
    return (
      <InkDiffuse u={diffuse} k={k} cx={x} cy={y}>
        {body}
      </InkDiffuse>
    );
  }
  return body;
};

// --- the model's eye ---------------------------------------------------------------
/** The smooth searching drift of a hunting Bracket: a point in the unit box
 *  [-1, 1]^2 at frame f (fractional f is fine). Continuous velocity, never
 *  jitter, never at rest for long; `seed` picks a different wander. Multiply by
 *  the radius you want it to roam. Peak speed ~0.115 units / frame. */
export const huntPath = (seed: number, f: number): Pt => {
  const a = hash01(seed, 1) * Math.PI * 2;
  const b = hash01(seed, 2) * Math.PI * 2;
  const c = hash01(seed, 3) * Math.PI * 2;
  const d = hash01(seed, 4) * Math.PI * 2;
  return {
    x: 0.62 * Math.sin(f / 13 + a) + 0.38 * Math.sin(f / 7.1 + b),
    y: 0.6 * Math.sin(f / 10.3 + c) + 0.4 * Math.cos(f / 6.2 + d),
  };
};

/** How far the bracket's corners pull in when locked (fraction of its side),
 *  when no `lockSide` is given. */
export const BRACKET_LOCK = 0.62;
/** the dashed expected-target square: its side as a fraction of the bracket's */
export const BRACKET_EXPECT = 0.3;

/** THE MODEL'S EYE: four ink corner marks (a viewfinder / detection box, each
 *  arm 22 % of the side) centred on (x, y), `size` WORLD px a side, with the
 *  DASHED RED expected-target square at its centre (dashes march on S).
 *  `lock` (raw 0..1): 0 = hunting (loose, dashed square marching); 1 = locked:
 *  the corners tighten (to `lockSide` world px, default 62 % of size) and the
 *  dashed square closes into a SOLID red seal (`sealSide` world px, default
 *  30 % of size). `expect` = false hides the red square (a bare viewfinder).
 *  `strokePx` overrides the ink weight (default mStrokePx of its screen size,
 *  floored at 3). The caller moves it (huntPath for the drift). */
export const Bracket: React.FC<{
  x: number;
  y: number;
  size: number;
  k: number;
  S: number;
  lock?: number;
  rung?: number;
  expect?: boolean;
  lockSide?: number;
  sealSide?: number;
  strokePx?: number;
  opacity?: number;
}> = ({ x, y, size, k, S, lock = 0, rung = INK_HI, expect = true, lockSide, sealSide, strokePx, opacity = 1 }) => {
  if (opacity <= 0.002 || size <= 0) return null;
  const lk = smoothstep(lock);
  const side = lerp(size, lockSide ?? size * BRACKET_LOCK, lk);
  const sp = strokePx ?? Math.max(3, mStrokePx(size * k * 1.6));
  const w = sp / k;
  const arm = side * 0.22;
  const hs = side / 2;
  const corners: string[] = [];
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const cx = x + sx * hs;
    const cy = y + sy * hs;
    corners.push(`M${(cx - sx * arm).toFixed(3)} ${cy.toFixed(3)}L${cx.toFixed(3)} ${cy.toFixed(3)}L${cx.toFixed(3)} ${(cy - sy * arm).toFixed(3)}`);
  }
  // the expected square: dashed while hunting; the dashes lengthen until they
  // meet and the square fills as the bracket locks
  const es = lerp(size * BRACKET_EXPECT, sealSide ?? size * BRACKET_EXPECT, lk);
  const eh = es / 2;
  const per = es * 4;
  const nDash = 12;
  const period = per / nDash;
  const dashLen = period * lerp(0.56, 1.02, lk);
  const march = ((S * 0.9) / k) % period;
  const ew = Math.max(2.2 / k, w * 0.8);
  return (
    <g opacity={opacity < 1 ? opacity.toFixed(4) : undefined}>
      {expect ? (
        <g style={lk > 0.5 ? { filter: paperShadow(k) } : undefined}>
          {lk > 0.02 ? (
            <rect x={(x - eh).toFixed(3)} y={(y - eh).toFixed(3)} width={es.toFixed(3)} height={es.toFixed(3)} rx={(Math.min(es * 0.16, 2.5 / k + es * 0.03)).toFixed(3)} fill={RED} opacity={lk.toFixed(4)} />
          ) : null}
          {lk < 0.98 ? (
            <rect
              x={(x - eh).toFixed(3)}
              y={(y - eh).toFixed(3)}
              width={es.toFixed(3)}
              height={es.toFixed(3)}
              rx={(es * 0.08).toFixed(3)}
              fill="none"
              stroke={RED}
              strokeWidth={ew.toFixed(3)}
              strokeDasharray={`${dashLen.toFixed(3)} ${Math.max(0, period - dashLen).toFixed(3)}`}
              strokeDashoffset={(-march).toFixed(3)}
              strokeLinecap="butt"
              opacity={(1 - lk).toFixed(4)}
            />
          ) : null}
        </g>
      ) : null}
      <path d={corners.join("")} fill="none" stroke={INK} strokeOpacity={rung.toFixed(4)} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

// --- the model ----------------------------------------------------------------------
/** the inner ring's radius as a fraction of the outer */
export const MODEL_INNER = 0.74;
/** the bracket's side inside a ModelGlyph, as a fraction of the outer radius */
export const MODEL_BRACKET = 0.78;
/** THE MODEL: two concentric ink rings centred on (x, y), outer radius `r`
 *  WORLD px, with the Bracket (the model's eye, dashed red expected square)
 *  inside. The inner disc holds a wash that fills bottom-up, `fill` 0..1 (what
 *  it has learned from): plain INK wash at `tint` 0 (trained on nothing useful),
 *  a RED-tinted wash at `tint` 1 (trained on relevant data). `eye` = false
 *  draws the rings without the bracket (when the bracket has come out to hunt);
 *  `eyeLock` passes through to the bracket's lock. `appear` (raw 0..1) writes
 *  the rings in (they sweep round) and fades the eye in. */
export const ModelGlyph: React.FC<{
  id: string;
  x: number;
  y: number;
  r: number;
  k: number;
  S: number;
  fill?: number;
  tint?: number;
  rung?: number;
  eye?: boolean | number;
  eyeLock?: number;
  appear?: number;
  strokePx?: number;
}> = ({ id, x, y, r, k, S, fill = 0, tint = 0, rung = INK_HI, eye = true, eyeLock = 0, appear = 1, strokePx }) => {
  const a = clamp01(appear);
  if (a <= 0.001 || rung <= 0.002) return null;
  const sp = strokePx ?? mStrokePx(r * 2 * k * 1.3);
  const w = sp / k;
  const ri = r * MODEL_INNER;
  const sweep = easeOutCubic(a);
  const circ = (rad: number) => 2 * Math.PI * rad;
  const f = clamp01(fill);
  const t = clamp01(tint);
  const rd = ri - w / 2;
  // the wash: a soft-topped level rising inside the inner ring
  const level = y + rd - 2 * rd * smoothstep(f) * 1.12;
  const feather = rd * 0.24;
  const washCol = t <= 0 ? INK : mixHex(INK, RED, t);
  const washOp = lerp(0.2, 0.26, t) * Math.min(1, rung / INK_HI);
  const eyeOp = (typeof eye === "number" ? clamp01(eye) : eye ? 1 : 0) * smoothstep((a - 0.4) / 0.6);
  return (
    <g>
      {f > 0.003 ? (
        <>
          <defs>
            <linearGradient id={`${id}-wash`} gradientUnits="userSpaceOnUse" x1={0} y1={(level - feather).toFixed(3)} x2={0} y2={(level + feather).toFixed(3)}>
              <stop offset={0} stopColor={washCol} stopOpacity={0} />
              <stop offset={0.5} stopColor={washCol} stopOpacity={(washOp * 0.5).toFixed(4)} />
              <stop offset={1} stopColor={washCol} stopOpacity={washOp.toFixed(4)} />
            </linearGradient>
          </defs>
          <circle cx={x.toFixed(3)} cy={y.toFixed(3)} r={rd.toFixed(3)} fill={`url(#${id}-wash)`} />
        </>
      ) : null}
      <g fill="none" stroke={INK} strokeOpacity={rung.toFixed(4)} strokeWidth={w.toFixed(3)} strokeLinecap="round" transform={`rotate(-90 ${x.toFixed(3)} ${y.toFixed(3)})`}>
        <circle cx={x.toFixed(3)} cy={y.toFixed(3)} r={r.toFixed(3)} strokeDasharray={sweep < 1 ? `${(circ(r) * sweep).toFixed(3)} ${circ(r).toFixed(3)}` : undefined} />
        <circle
          cx={x.toFixed(3)}
          cy={y.toFixed(3)}
          r={ri.toFixed(3)}
          strokeDasharray={sweep < 1 ? `${(circ(ri) * sweep).toFixed(3)} ${circ(ri).toFixed(3)}` : undefined}
          transform={sweep < 1 ? `rotate(${(180).toFixed(0)} ${x.toFixed(3)} ${y.toFixed(3)})` : undefined}
        />
      </g>
      {eyeOp > 0.004 ? <Bracket x={x} y={y} size={r * MODEL_BRACKET} k={k} S={S} lock={eyeLock} rung={rung} strokePx={sp} opacity={eyeOp} /> : null}
    </g>
  );
};
