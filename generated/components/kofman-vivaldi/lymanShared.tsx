// ---------------------------------------------------------------------------
// lymanShared — the Lyman sector map in ChinaTalk material (kofman-vivaldi; owner: cut 0, VivaldiTookBack).
// Used by cuts 0, 11, 18, 28 and 50. After LYMAN_READY.md, exports are only ADDED; every change is logged in
// SHARED_CHANGES.md beside this file.
//
// Two sides, two colours (REVISION_1105, user request): Russian-held ground (HELD = occupied + grey zone) is an ink
// wash under a hatch (solid grey territory); Ukrainian-held ground is a flat wash of one muted print blue (UA_BLUE);
// red stays the one accent. The front is the edge between them, drawn by FrontLine. Rivers are an ink
// hair at INK_LO. Places are an ink dot + a kit "word" Label. No graticule, borders, compass, scale bar or legend.
// Everything is drawn in WORLD px (lymanFrontData.ts: 40 px per km, north up, world (540, 960) = 37.85E 49.10N) inside
// the kit's VStage; pass the CURRENT cam.k as `k` everywhere. Geometry is real (DeepStateMap via lymanFrontData.ts).
// ---------------------------------------------------------------------------
import React from "react";
import {
  BEAD_RATIO,
  Bead,
  HatchFill,
  INK_HI,
  INK_LO,
  LINE,
  Label,
  RED,
  RED_DEEP,
  V_INK,
  V_PAPER,
  WET_DRY_F,
  WET_LEN,
  WetLine,
  cumLen,
  hairW,
  inkDiffuse,
  lineW,
  mixHex,
  paperShadow,
  pointAtLen,
  polyD,
  smoothstep,
  subPathD,
  useVStageView,
  vCam,
  worldBlur,
  wpx,
} from "../kits/chinatalk/chinatalkVintage";
import type { Cam, Pt } from "../kits/chinatalk/chinatalkVintage";
import { HELD_20261015, MAINFRONT_20261015, PLACES, RETAKEN_VIVALDI, RIVERS } from "./lymanFrontData";

// --- geometry helpers ------------------------------------------------------------
/** `[x, y][]` (the data module's polylines) -> kit points */
export const toPts = (a: readonly (readonly [number, number])[]): Pt[] => a.map(([x, y]) => ({ x, y }));
/** an SVG path string of M/L/Z commands (the data module's areas and rivers) -> its subpaths as point lists */
export const parsePathD = (d: string): Pt[][] =>
  d
    .split("M")
    .filter((s) => s.trim())
    .map((s) =>
      s
        .replace(/Z/g, "")
        .trim()
        .split("L")
        .map((p) => {
          const [x, y] = p.trim().split(/\s+/).map(Number);
          return { x, y };
        }),
    );
const samePt = (a: Pt, b: Pt) => Math.abs(a.x - b.x) < 0.05 && Math.abs(a.y - b.y) < 0.05;
/** drops the vertices where a polyline doubles back on itself (a spur where two fronts were spliced) */
export const despike = (pts: Pt[]): Pt[] => {
  const out = [...pts];
  for (let changed = true; changed; ) {
    changed = false;
    for (let i = 1; i < out.length - 1; i++) {
      const a = out[i - 1];
      const b = out[i];
      const c = out[i + 1];
      const ux = b.x - a.x;
      const uy = b.y - a.y;
      const vx = c.x - b.x;
      const vy = c.y - b.y;
      const cos = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1);
      if (cos < -0.95) {
        out.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return out;
};

// --- the house map look ------------------------------------------------------------
/** HatchFill values for Russian-held ground: the kit's default pitch / line weight / angle, the wash and the lines
 *  raised from the house 0.10 / 0.35 so the held side reads as solid grey territory beside the blue (REVISION_1105) */
export const MAP_HATCH = { fill: 0.18, lineOpacity: 0.45, angleDeg: 45 } as const;
/** Ukrainian-held ground: one muted print blue, a quiet second spot ink on the newsprint (user request, 5 Nov 2026;
 *  this clip only). Flat: no gradient, no hatch. Drawn at UA_WASH over the paper. */
export const UA_BLUE = "#3F6A8C";
export const UA_WASH = 0.33;
/** the hatch is locked to the world at this anchor (it never swims while the camera moves) */
export const HATCH_ANCHOR: Pt = { x: 0, y: 0 };
/** a place dot's radius, SCREEN px at k = 1 (through the kit size law) */
export const PLACE_DOT_PX = 7;
/** a place label's gap from its dot, SCREEN px at k = 1 */
export const PLACE_GAP_PX = 16;

/** The visible world rect of the stage this is drawn in (+ margin), or null outside a VStage. */
const useViewRect = (margin = 80) => {
  const view = useVStageView();
  if (!view) return null;
  const { cam, dx, dy } = view;
  const hw = (540 + Math.abs(dx)) / cam.k + margin;
  const hh = (960 + Math.abs(dy)) / cam.k + margin;
  return { x0: cam.x - hw, y0: cam.y - hh, x1: cam.x + hw, y1: cam.y + hh };
};

/** Held ground: the house hatch + wash clipped to one or more area path strings (their UNION; holes by even-odd).
 *  `rung` multiplies the house values (1 = house; INK_LO dims it to context). `hatchK` fixes the hatch's pitch at
 *  one zoom so it stays locked to the world through a push (default: the current k, the kit's size law; pass the
 *  cut's middle zoom when the camera moves). `mask` is an optional `url(#id)` for a mask the caller defines. */
export const HeldWash: React.FC<{
  id: string;
  d: string | readonly string[];
  k: number;
  hatchK?: number;
  rung?: number;
  mask?: string;
}> = ({ id, d, k, hatchK, rung = 1, mask }) => {
  const view = useViewRect();
  if (rung <= 0.002) return null;
  const ds = typeof d === "string" ? [d] : d;
  // the hatch is laid over the visible window only (the areas run far off frame)
  const r = view ?? { x0: -2000, y0: -2000, x1: 3600, y1: 3600 };
  const rect: Pt[] = [
    { x: r.x0, y: r.y0 },
    { x: r.x1, y: r.y0 },
    { x: r.x1, y: r.y1 },
    { x: r.x0, y: r.y1 },
  ];
  return (
    <g mask={mask}>
      <defs>
        <clipPath id={`${id}-clip`}>
          {ds.map((p, i) => (
            <path key={i} d={p} clipRule="evenodd" />
          ))}
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`} opacity={rung < 1 ? rung.toFixed(4) : undefined}>
        <HatchFill id={`${id}-hatch`} region={rect} k={hatchK ?? k} anchor={HATCH_ANCHOR} {...MAP_HATCH} />
      </g>
    </g>
  );
};

/** Ukrainian-held ground: the flat UA_BLUE wash over everything in view that is NOT in `held` (the same path(s) you
 *  pass to HeldWash; several paths are treated as their union, so shared inner edges leave no seam). `rung`
 *  multiplies UA_WASH. */
export const UkraineWash: React.FC<{ id: string; held: string | readonly string[]; k: number; rung?: number }> = ({ id, held, rung = 1 }) => {
  const view = useViewRect();
  if (rung <= 0.002) return null;
  const ds = typeof held === "string" ? [held] : held;
  const r = view ?? { x0: -2000, y0: -2000, x1: 3600, y1: 3600 };
  const box = { x: r.x0, y: r.y0, width: r.x1 - r.x0, height: r.y1 - r.y0 };
  return (
    <g>
      <defs>
        <mask id={`${id}-out`} maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="#FFFFFF" />
          {ds.map((p, i) => (
            <path key={i} d={p} fill="#000000" fillRule="evenodd" />
          ))}
        </mask>
      </defs>
      <rect {...box} fill={UA_BLUE} opacity={(UA_WASH * rung).toFixed(4)} mask={`url(#${id}-out)`} />
    </g>
  );
};

/** The side labels (kit "word", INK_HI), world positions clear of both caption bands at FRAMING_SECTOR and
 *  STALEMATE_END_CAM (UKRAINE also at FRAMING_SALIENT / _OPEN and cut 0's whole camera path). RUSSIAN-HELD does not fit
 *  the narrow grey strip at FRAMING_SALIENT; there cut 0 sets it on the salient itself (SALIENT_RUSSIAN_LABEL, Aug
 *  state only: it bleeds away as the red takes the ground). */
export const SIDE_LABELS = {
  ukraine: { text: "Ukraine", x: 360, y: 420 },
  russian: { text: "Russian-held", x: 960, y: 700 },
} as const;
export const SALIENT_RUSSIAN_LABEL = { text: "Russian-held", x: 450, y: 760 } as const;
/** One side label: `which` picks the text and default place; `at` overrides the place; appear / diffuse as kit Label. */
export const SideLabel: React.FC<{
  which: "ukraine" | "russian";
  k: number;
  at?: Pt;
  appear?: number;
  diffuse?: number;
  rung?: number;
}> = ({ which, k, at, appear = 1, diffuse = 0, rung = INK_HI }) => {
  const d = SIDE_LABELS[which];
  return <Label text={d.text} x={at?.x ?? d.x} y={at?.y ?? d.y} k={k} size="word" rung={rung} appear={appear} diffuse={diffuse} />;
};

/** The retaken Vivaldi patch after cut 0 (the memory thread): `fill` (0..1) is cut 0's flat RED over the patch (1 =
 *  cut 0's last frame; 0 = the patch shows the blue under it, as Ukrainian ground); `edge` (0..1) is the fine RED_DEEP
 *  outline at rest (LINE / 2) it keeps in every later cut. Draw it inside LymanMap's children, with
 *  `held={HELD_20261015}` (the patch is then blue underneath), under the front lines. */
export const PATCH_EDGE_PX = LINE / 2;
export const RetakenPatch: React.FC<{ id: string; k: number; fill?: number; edge?: number }> = ({ id, k, fill = 0, edge = 1 }) => {
  const f = Math.max(0, Math.min(1, fill));
  const e = Math.max(0, Math.min(1, edge));
  return (
    <g>
      <defs>
        <mask id={`${id}-out`} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={9000} height={9000}>
          <rect x={-4000} y={-4000} width={9000} height={9000} fill="#FFFFFF" />
          <path d={RETAKEN_VIVALDI} fill="#000000" fillRule="evenodd" />
        </mask>
      </defs>
      {f > 0.002 ? (
        <>
          {/* the red's paper shadow, only where it falls outside the patch (as cut 0 draws it) */}
          <g mask={`url(#${id}-out)`} opacity={f < 1 ? f.toFixed(4) : undefined}>
            <g style={{ filter: paperShadow(k) }}>
              <path d={RETAKEN_VIVALDI} fill={RED} fillRule="evenodd" />
            </g>
          </g>
          <path d={RETAKEN_VIVALDI} fill={RED} fillRule="evenodd" opacity={f < 1 ? f.toFixed(4) : undefined} />
        </>
      ) : null}
      {e > 0.002 ? (
        <path
          d={RETAKEN_VIVALDI}
          fill="none"
          stroke={RED_DEEP}
          strokeOpacity={e.toFixed(4)}
          strokeWidth={wpx(PATCH_EDGE_PX, k).toFixed(3)}
          strokeLinejoin="round"
        />
      ) : null}
    </g>
  );
};

/** The rivers (the Donets): an ink hair at INK_LO. */
export const RIVER_PTS: Pt[][] = RIVERS.flatMap((r) => parsePathD(r.d));
export const Rivers: React.FC<{ k: number; rung?: number }> = ({ k, rung = INK_LO }) => {
  const w = hairW(k);
  return (
    <g fill="none" stroke={V_INK} strokeOpacity={rung.toFixed(4)} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round">
      {RIVER_PTS.map((pts, i) => (
        <path key={i} d={polyD(pts)} />
      ))}
    </g>
  );
};

export type PlaceName = keyof typeof PLACES;
/** Place dots (ink, INK_HI) with optional kit "word" labels to their right (or left). `labels` names the ones that
 *  get a label (default: all of `names`); `appear` per name is a raw 0..1 entrance (enterU / enterFrom) for the label. */
export const PlaceMarks: React.FC<{
  names: readonly string[];
  k: number;
  labels?: readonly string[];
  rung?: number;
  appear?: Partial<Record<string, number>>;
  left?: readonly string[];
}> = ({ names, k, labels, rung = INK_HI, appear, left }) => {
  const r = wpx(PLACE_DOT_PX, k);
  const gap = wpx(PLACE_GAP_PX, k);
  return (
    <g>
      {names.map((n) => {
        const p = PLACES[n as PlaceName];
        if (!p) return null;
        const onLeft = left?.includes(n) ?? false;
        const labelled = labels ? labels.includes(n) : true;
        return (
          <g key={n}>
            <circle cx={p[0]} cy={p[1]} r={r.toFixed(3)} fill={mixHex(V_PAPER, V_INK, rung)} />
            {labelled ? (
              <Label
                text={n}
                x={p[0] + (onLeft ? -gap : gap)}
                y={p[1]}
                k={k}
                size="word"
                rung={rung}
                anchor={onLeft ? "end" : "start"}
                appear={appear?.[n] ?? 1}
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/** A front line: a solid line along a polyline (`[x, y][]` like MAINFRONTOCC_20261103, or kit points).
 *  Ink by default (LINE, as one OPAQUE colour at `rung`, so joined pieces never darken where they meet); `red` makes
 *  it the kit's red WetLine (RED_LINE, paper shadow). Write-on: `draw` (0..1 of its length) or `len` (world px), with
 *  `ageAt(s)` (frames since arc length s was drawn) for the wet stretch, and `bead` (0..1) for the bead at the tip.
 *  `diffuse` (0..1) bleeds it away like ink on wet paper (blur, spread in weight, fade; it never moves). */
export const FrontLine: React.FC<{
  id: string;
  points: Pt[] | readonly (readonly [number, number])[];
  k: number;
  draw?: number;
  len?: number;
  red?: boolean;
  rung?: number;
  ageAt?: (s: number) => number;
  bead?: number;
  diffuse?: number;
}> = ({ id, points, k, draw = 1, len, red = false, rung = INK_HI, ageAt, bead = 0, diffuse = 0 }) => {
  const pts: Pt[] = points.length && Array.isArray(points[0]) ? toPts(points as readonly (readonly [number, number])[]) : (points as Pt[]);
  if (pts.length < 2) return null;
  const cum = cumLen(pts);
  const total = cum[cum.length - 1];
  const L = Math.max(0, Math.min(total, len ?? total * Math.max(0, Math.min(1, draw))));
  if (L <= 0.05) return null;
  const dif = inkDiffuse(diffuse);
  if (diffuse > 0 && dif.opacity <= 0.002) return null;
  if (red) {
    const body = <WetLine id={id} points={pts} len={L} k={k} ageAt={ageAt} bead={bead} />;
    return diffuse > 0 ? (
      <g opacity={dif.opacity.toFixed(4)} style={{ filter: worldBlur(dif.blur, k) }}>
        {body}
      </g>
    ) : (
      body
    );
  }
  const w = lineW(k) * (1 + (diffuse > 0 ? dif.spread : 0));
  const segs: React.ReactNode[] = [];
  if (ageAt) {
    const step = Math.max(2, WET_LEN / 14);
    for (let s0 = Math.max(0, L - WET_LEN); s0 < L - 0.05; s0 += step) {
      const s1 = Math.min(L, s0 + step);
      const mid = (s0 + s1) / 2;
      const wet = (1 - smoothstep(ageAt(mid) / WET_DRY_F)) * (1 - smoothstep((L - mid) / WET_LEN));
      if (wet < 0.02) continue;
      segs.push(
        <path
          key={s0.toFixed(1)}
          d={subPathD(pts, cum, s0, s1)}
          fill="none"
          stroke={V_INK}
          strokeOpacity={wet.toFixed(4)}
          strokeWidth={(w * (1 + 0.15 * wet)).toFixed(3)}
          strokeLinecap={s1 >= L - 0.05 ? "round" : "butt"}
          strokeLinejoin="round"
        />,
      );
    }
  }
  const tip = pointAtLen(pts, cum, L);
  return (
    <g opacity={diffuse > 0 ? dif.opacity.toFixed(4) : undefined} style={diffuse > 0 ? { filter: worldBlur(dif.blur, k) } : undefined}>
      <path
        d={subPathD(pts, cum, 0, L)}
        fill="none"
        stroke={mixHex(V_PAPER, V_INK, rung)}
        strokeWidth={w.toFixed(3)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {segs}
      {bead > 0.002 ? <Bead id={id} x={tip.x} y={tip.y} k={k} r={BEAD_RATIO * w} color={V_INK} opacity={bead} /> : null}
    </g>
  );
};

/** The whole map, bottom to top: Ukrainian blue (`ukraine`, default on), held wash, rivers, `children` (your overlays), the `fronts` (static FrontLines, ink
 *  at INK_HI), place dots + labels. `held` is one or more area path strings (union). `places` get a dot and a label;
 *  `dots` get a dot only. Paper is the kit's VStage page; the map draws none. */
export const LymanMap: React.FC<{
  id: string;
  k: number;
  held: string | readonly string[];
  hatchK?: number;
  rung?: number;
  heldMask?: string;
  rivers?: boolean;
  fronts?: readonly (Pt[] | readonly (readonly [number, number])[])[];
  places?: readonly string[];
  dots?: readonly string[];
  placeAppear?: Partial<Record<string, number>>;
  ukraine?: boolean;
  ukraineRung?: number;
  children?: React.ReactNode;
}> = ({ id, k, held, hatchK, rung = 1, heldMask, rivers = true, fronts, places = [], dots = [], placeAppear, ukraine = true, ukraineRung = 1, children }) => (
  <g>
    {ukraine ? <UkraineWash id={`${id}-ua`} held={held} k={k} rung={ukraineRung} /> : null}
    <HeldWash id={`${id}-held`} d={held} k={k} hatchK={hatchK} rung={rung} mask={heldMask} />
    {rivers ? <Rivers k={k} /> : null}
    {children}
    {fronts?.map((f, i) => <FrontLine key={i} id={`${id}-front-${i}`} points={f} k={k} />)}
    <PlaceMarks names={[...dots, ...places]} labels={places} k={k} appear={placeAppear} />
  </g>
);

// --- the Vivaldi salient: where the 15 Aug and 15 Oct 2026 fronts part ------------------------------------
const RETAKEN_RING: Pt[] = parsePathD(RETAKEN_VIVALDI).sort((a, b) => b.length - a.length)[0];
const OCT_FRONT: Pt[] = toPts(MAINFRONT_20261015);
const octIndex = (p: Pt) => OCT_FRONT.findIndex((q) => samePt(p, q));
/** ring segment i (ring[i] -> ring[i + 1]) lies on the 15 Oct front */
const segOnOct = RETAKEN_RING.map((p, i) => {
  const a = octIndex(p);
  const b = octIndex(RETAKEN_RING[(i + 1) % RETAKEN_RING.length]);
  return a >= 0 && b >= 0 && Math.abs(a - b) === 1;
});
const octRunStart = segOnOct.findIndex((on, i) => on && !segOnOct[(i - 1 + segOnOct.length) % segOnOct.length]);
const octRunLen = (() => {
  let n = 0;
  while (segOnOct[(octRunStart + n) % segOnOct.length]) n++;
  return n;
})();
const ringAt = (i: number) => RETAKEN_RING[((i % RETAKEN_RING.length) + RETAKEN_RING.length) % RETAKEN_RING.length];
const octEdgeRing: Pt[] = Array.from({ length: octRunLen + 1 }, (_, j) => ringAt(octRunStart + j));
const oldEdgeRing: Pt[] = Array.from({ length: RETAKEN_RING.length - octRunLen + 1 }, (_, j) => ringAt(octRunStart + octRunLen + j));
const northFirst = (pts: Pt[]) => (pts[0].y <= pts[pts.length - 1].y ? pts : [...pts].reverse());
/** the salient's east edge = the 15 Oct 2026 front along the retaken patch, north to south */
export const VIVALDI_NEW_EDGE: Pt[] = northFirst(octEdgeRing);
/** the salient's Ukrainian-side edge = the 15 Aug 2026 front around the patch (west and north), north to south */
export const VIVALDI_OLD_EDGE: Pt[] = northFirst(oldEdgeRing);
/** the two points where the old and new fronts meet (the ends of both edges) */
export const FRONT_PIN_N: Pt = VIVALDI_NEW_EDGE[0];
export const FRONT_PIN_S: Pt = VIVALDI_NEW_EDGE[VIVALDI_NEW_EDGE.length - 1];
const iPinN = octIndex(FRONT_PIN_N);
const iPinS = octIndex(FRONT_PIN_S);
/** MAINFRONT_20261015 north of the salient (ends on FRONT_PIN_N) and south of it (starts on FRONT_PIN_S) */
export const FRONT_OCT_NORTH: Pt[] = OCT_FRONT.slice(0, iPinN + 1);
export const FRONT_OCT_SOUTH: Pt[] = OCT_FRONT.slice(iPinS);
/** The front as cut 0 draws it on 15 Aug: the 15 Oct line outside the salient, the old edge around it (it matches
 *  HELD_AUG_DRAWN exactly). North first. */
export const FRONT_AUG_DRAWN: Pt[] = despike([...FRONT_OCT_NORTH, ...VIVALDI_OLD_EDGE.slice(1), ...FRONT_OCT_SOUTH.slice(1)]);
/** Held ground as cut 0 draws it on 15 Aug: HELD 15 Oct + the retaken patch (= HELD 15 Aug inside the salient; it
 *  also carries two small Russian gains made between the dates, ~1 km2 north of the salient and ~10 km2 at
 *  Kolodiazi, so that the map, its front line and the Oct end state agree). Pass as LymanMap / HeldWash `held`. */
export const HELD_AUG_DRAWN: readonly string[] = [HELD_20261015, RETAKEN_VIVALDI];

// --- camera framings (kit Cam: world point at the frame's centre, zoom k) -------------------------------------
/** Cut 0's settled framing: the retaken patch at ~80 % of the frame width, its middle at screen y ~ 900 */
export const FRAMING_SALIENT: Cam = vCam(415, 810, 1.1);
/** Cut 0's opening: the same centre, wider (the salient at ~60 % of the frame width) */
export const FRAMING_SALIENT_OPEN: Cam = vCam(415, 830, 0.83);
/** A wide view of ~50 km of front around Lyman, world y ~ -90 .. 2090 (the whole salient, Lyman, the Donets) */
export const FRAMING_SECTOR: Cam = vCam(600, 1000, 0.88);
