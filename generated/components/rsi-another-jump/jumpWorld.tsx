import React from "react";
import { ACCENT, clamp01, iconShadow } from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI } from "../kits/dwarkesh/alignShared";
import { arcPath } from "../kits/dwarkesh/trapShared";
import { BAR_TONE, BAR_W, FigurePose, HEAD_MARK, STROKE_W, figurePose } from "./timelineWorld";

/** the OpenAI head's outer contour: the mark's first subpath (absolute M), on its 24 box. The forecast contour
 *  follows this edge only, so the knot's inner bands are never dashed (that scribbles the mark). */
export const HEAD_OUTER = HEAD_MARK.paths[0].split(/(?=[Mm])/)[0];

// ---------------------------------------------------------------------------
// jumpWorld — cut 21's (`AnotherJumpThatBig`) additions to the timeline world.
// timelineWorld.tsx is cut 15's and frozen; everything new lives here.
//
// - `ForecastOutline`: the forecast treatment for the figure. timelineWorld's
//   `dashed` option (a dashed outline with NO fill) was rendered first and
//   loses the figure (see the cut's header); this one keeps the solid orange
//   figure and runs a marching dashed contour around its silhouette, offset by
//   a small gap, so it reads as one solid figure with a dashed line round it.
// - `HumanFigure`: a white standing adult in the same build as the intern
//   (figurePose at age 1, arms at its sides, no props), the human reference.
// - `DashedBar`: a dashed height mark that can be lifted off the rule.
// - `DomainStation`, `CheckMark` and the Lucide glyphs for the three domains.
// ---------------------------------------------------------------------------

type P = { x: number; y: number };
const line = (pts: P[]) => `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}`;
const poly = (pts: P[]) => `${line(pts)} Z`;

// --- the forecast outline -------------------------------------------------------
/** world px: the gap between the body and the dashed contour, its stroke, its dashes */
export const OUTLINE_GAP = 9;
export const OUTLINE_SW = STROKE_W * 1.1;
export const OUTLINE_DASH = 24;
export const OUTLINE_SPACE = 15;

/** The pose's parts the outline follows, shared by the outline and `SilhouetteCut`. */
const silhouetteParts = (g: FigurePose) => {
  const { p } = g;
  const legPts = (side: "near" | "far") => {
    const l = g.legs.find((q) => q.side === side)!;
    return [l.hip, l.knee, l.ankle];
  };
  const limbs: { pts: P[]; w: number }[] = [
    { pts: g.farArm, w: p.armT },
    { pts: legPts("far"), w: p.legT },
    { pts: g.neck, w: p.neckW },
    { pts: legPts("near"), w: p.legT },
    { pts: g.nearArm, w: p.armT },
  ];
  const feet = [g.footFar, g.footNear];
  const polys = [g.torso, g.drinkBody, ...(g.lidH > 0.05 ? [g.lid] : [])];
  const ms = g.mark.size / 24;
  const markT = `translate(${g.mark.x.toFixed(3)} ${g.mark.y.toFixed(3)}) scale(${ms.toFixed(5)})`;
  return { limbs, feet, polys, ms, markT };
};

/**
 * The figure's silhouette dilated by `grow`, filled black: goes inside a white
 * `<mask>` to cut out whatever lies behind the figure (the OpenAI head has gaps).
 */
export const SilhouetteCut: React.FC<{ pose: FigurePose; grow: number }> = ({ pose: g, grow }) => {
  const { limbs, feet, polys, ms, markT } = silhouetteParts(g);
  return (
    <g fill="black" stroke="black" strokeLinejoin="round" strokeLinecap="round">
      {polys.map((q, i) => (
        <path key={`p${i}`} d={poly(q)} strokeWidth={2 * grow} />
      ))}
      <g transform={markT} strokeWidth={(2 * grow) / ms}>
        <path d={HEAD_OUTER} />
      </g>
      {limbs.map((l, i) => (
        <path key={`l${i}`} d={line(l.pts)} fill="none" strokeWidth={l.w + 2 * grow} />
      ))}
      {feet.map((f, i) => (
        <ellipse key={`f${i}`} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} strokeWidth={2 * grow} />
      ))}
    </g>
  );
};

/**
 * A dashed contour OUTSIDE the figure's silhouette (body + drink), `gap` off it.
 * Every part is stroked with a band 2 x (gap + sw) wide (a limb: its own width
 * plus that), dashed along the part, and the silhouette dilated by `gap` is
 * masked out, so only a dashed strip gap..gap + sw outside the union is left.
 * `clipX0`: nothing left of this world x (the figure crosses into the forecast).
 */
export const ForecastOutline: React.FC<{
  id: string;
  k: number;
  pose: FigurePose;
  march: number;
  color?: string;
  clipX0?: number;
  gap?: number;
  sw?: number;
}> = ({ id, k, pose: g, march, color = ACCENT, clipX0 = -1e5, gap = OUTLINE_GAP, sw = OUTLINE_SW }) => {
  const { limbs, feet, polys, ms, markT } = silhouetteParts(g);
  const dashArr = `${OUTLINE_DASH} ${OUTLINE_SPACE}`;
  const band = 2 * (gap + sw);
  // the head is the OpenAI mark: its outer contour (HEAD_OUTER), in the mark's own 24-unit frame
  return (
    <g style={{ filter: iconShadow(k) }}>
      <defs>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-1e5} y={-1e5} width={2e5} height={2e5}>
          <rect x={-1e5} y={-1e5} width={2e5} height={2e5} fill="white" />
          <SilhouetteCut pose={g} grow={gap} />
        </mask>
        <clipPath id={`${id}-c`}>
          <rect x={clipX0} y={-1e5} width={2e5} height={2e5} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <g
          mask={`url(#${id}-m)`}
          fill="none"
          stroke={color}
          strokeDasharray={dashArr}
          strokeDashoffset={-march}
          strokeLinejoin="round"
          strokeLinecap="butt"
        >
          {polys.map((q, i) => (
            <path key={`p${i}`} d={poly(q)} strokeWidth={band} />
          ))}
          <g transform={markT} strokeWidth={band / ms} strokeDasharray={`${OUTLINE_DASH / ms} ${OUTLINE_SPACE / ms}`} strokeDashoffset={-march / ms}>
            <path d={HEAD_OUTER} />
          </g>
          {limbs.map((l, i) => (
            <path key={`l${i}`} d={line(l.pts)} strokeWidth={l.w + band} />
          ))}
          {feet.map((f, i) => (
            <ellipse key={`f${i}`} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} strokeWidth={band} />
          ))}
        </g>
      </g>
    </g>
  );
};

// --- the human reference ---------------------------------------------------------
export const HUMAN_FAR = "#D6D6D6"; // the far limbs, one flat shade under white so two legs read
/**
 * A white adult standing on the rule, the intern's own build (figurePose at
 * age 1, standing): head, neck, torso, legs, feet, and both arms hanging at its
 * sides (the far arm is figurePose's; the near arm is the same hang from the
 * near shoulder). No badge, tie or drink: just a person. SVG, world px.
 */
export const HumanFigure: React.FC<{ k: number; x: number; breathT: number; facing?: 1 | -1; opacity?: number }> = ({
  k,
  x,
  breathT,
  facing = 1,
  opacity = INK_HI,
}) => {
  const g = figurePose({ x, age: 1, breathT, identity: { badge: 0, tie: 0, child: 0, bun: 1, drink: 1 } });
  const { p } = g;
  const [fs, fe, fh] = g.farArm;
  const sh = g.nearArm[0];
  const dx = sh.x - fs.x + p.torsoW * 0.05;
  const nearArm = [sh, { x: fe.x + dx, y: fe.y }, { x: fh.x + dx - p.torsoW * 0.04, y: fh.y }];
  const legPts = (side: "near" | "far") => {
    const l = g.legs.find((q) => q.side === side)!;
    return [l.hip, l.knee, l.ankle];
  };
  const limb = (pts: P[], w: number, c: string) => (
    <path d={line(pts)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <g transform={facing === -1 ? `translate(${(2 * x).toFixed(3)} 0) scale(-1 1)` : undefined}>
      {limb(g.farArm, p.armT, HUMAN_FAR)}
      {limb(legPts("far"), p.legT, HUMAN_FAR)}
      <ellipse cx={g.footFar.cx} cy={g.footFar.cy} rx={g.footFar.rx} ry={g.footFar.ry} fill={HUMAN_FAR} />
      {limb(g.neck, p.neckW, INK)}
      <path d={poly(g.torso)} fill={INK} />
      <circle cx={g.head.x} cy={g.top + p.headD / 2} r={p.headD / 2} fill={INK} />
      {limb(legPts("near"), p.legT, INK)}
      <ellipse cx={g.footNear.cx} cy={g.footNear.cy} rx={g.footNear.rx} ry={g.footNear.ry} fill={INK} />
      {limb(nearArm, p.armT, INK)}
      </g>
    </g>
  );
};

// --- the dashed height mark -------------------------------------------------------
/** A dashed height mark standing on `bottom` (world y), h tall; the dashes
 *  start at the bottom and march up by `march` world px. */
export const DashedBar: React.FC<{
  x: number;
  bottom: number;
  h: number;
  march: number;
  color?: string;
  width?: number;
}> = ({ x, bottom, h, march, color = BAR_TONE, width = BAR_W }) =>
  h <= 0 ? null : (
    <line
      x1={x}
      y1={bottom}
      x2={x}
      y2={bottom - h}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={`${width * 1.6} ${width * 1.1}`}
      strokeDashoffset={march}
    />
  );

// --- the domains -----------------------------------------------------------------
// lucide-static (ISC), on the 24 grid: `cpu`, `chart-candlestick`, `flask-conical`, `check`.
export const ICON_CPU = `<path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/><path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/><path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/><path d="M7 20v2"/><path d="M7 2v2"/><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/>`;
export const ICON_CANDLES = `<path d="M9 5v4"/><rect width="4" height="6" x="7" y="9" rx="1"/><path d="M9 15v2"/><path d="M17 3v2"/><rect width="4" height="8" x="15" y="5" rx="1"/><path d="M17 13v3"/><path d="M3 3v16a2 2 0 0 0 2 2h16"/>`;
export const ICON_FLASK = `<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/>`;
/** lucide `check`, as the three points the stroke is written through */
export const CHECK_PTS: P[] = [
  { x: 4, y: 12 },
  { x: 9, y: 17 },
  { x: 20, y: 6 },
];

/**
 * A domain station: a white ring with a Lucide glyph. `draw` 0..1 wipes the
 * ring on clockwise from the top and reveals the glyph under the same sweep (a
 * sector clip, so the glyph is uncovered by the moving ring tip rather than
 * stroked on in specks). `lit` 0..1 wipes the ring orange both ways from
 * `litFrom` (world radians): the AI's thread has reached it. SVG, world px.
 */
export const DomainStation: React.FC<{
  id: string;
  k: number;
  x: number;
  y: number;
  r: number;
  icon: string;
  draw: number;
  lit: number;
  litFrom: number;
  sw: number;
  glyph?: number;
}> = ({ id, k, x, y, r, icon, draw, lit, litFrom, sw, glyph = 0.62 }) => {
  const d = clamp01(draw);
  if (d <= 0) return null;
  const a0 = -Math.PI / 2;
  const a1 = a0 + Math.PI * 2 * d;
  const box = 2 * r * glyph;
  // the sector the ring's tip has swept, as a clip for the glyph
  const R = r * 1.2;
  const sector = (() => {
    if (d >= 0.999) return null;
    const n = Math.max(2, Math.ceil(d * 90));
    let s = `M${x.toFixed(2)} ${y.toFixed(2)}`;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      s += ` L${(x + Math.cos(a) * R).toFixed(2)} ${(y + Math.sin(a) * R).toFixed(2)}`;
    }
    return `${s} Z`;
  })();
  const l = clamp01(lit);
  return (
    <g style={{ filter: iconShadow(k) }}>
      {sector ? (
        <defs>
          <clipPath id={`${id}-s`}>
            <path d={sector} />
          </clipPath>
        </defs>
      ) : null}
      <path
        d={arcPath(x, y, r, a0, a1)}
        fill="none"
        stroke={INK}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {l > 0 ? (
        <path
          d={arcPath(x, y, r, litFrom - Math.PI * l, litFrom + Math.PI * l)}
          fill="none"
          stroke={ACCENT}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      ) : null}
      <g clipPath={sector ? `url(#${id}-s)` : undefined}>
        <g
          transform={`translate(${(x - box / 2).toFixed(3)} ${(y - box / 2).toFixed(3)}) scale(${(box / 24).toFixed(5)})`}
          fill="none"
          stroke={INK}
          strokeWidth={(sw * 24) / box}
          strokeLinecap="round"
          strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      </g>
    </g>
  );
};

/** The white check, written by its tip along lucide `check` (`progress` 0..1),
 *  centred on (x, y), `size` world px for the 24 box. */
export const CheckMark: React.FC<{ k: number; x: number; y: number; size: number; progress: number; sw: number }> = ({
  k,
  x,
  y,
  size,
  progress,
  sw,
}) => {
  const t = clamp01(progress);
  if (t <= 0) return null;
  const s = size / 24;
  const pts = CHECK_PTS.map((q) => ({ x: x + (q.x - 12) * s, y: y + (q.y - 12) * s }));
  const segs = [Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y), Math.hypot(pts[2].x - pts[1].x, pts[2].y - pts[1].y)];
  let left = (segs[0] + segs[1]) * t;
  const out: P[] = [pts[0]];
  for (let i = 0; i < 2; i++) {
    const u = Math.min(1, left / segs[i]);
    out.push({ x: pts[i].x + (pts[i + 1].x - pts[i].x) * u, y: pts[i].y + (pts[i + 1].y - pts[i].y) * u });
    left -= segs[i];
    if (left <= 0) break;
  }
  return (
    <g style={{ filter: iconShadow(k) }}>
      <path d={line(out)} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

// --- the AI's reach -----------------------------------------------------------------
/** A quadratic thread p0 -> p2 (control p1), sampled by arc length. */
export const curveThread = (p0: P, p1: P, p2: P, n = 64) => {
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    pts.push({ x: a * p0.x + b * p1.x + c * p2.x, y: a * p0.y + b * p1.y + c * p2.y });
  }
  const cum = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const len = cum[n];
  /** the point at fraction u of the length */
  const at = (u: number): P => {
    const d = clamp01(u) * len;
    let i = 1;
    while (i < n && cum[i] < d) i++;
    const w = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * w, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * w };
  };
  /** the polyline from the start to fraction u */
  const upTo = (u: number): P[] => {
    const d = clamp01(u) * len;
    const out: P[] = [pts[0]];
    for (let i = 1; i <= n && cum[i] < d; i++) out.push(pts[i]);
    out.push(at(u));
    return out;
  };
  return { len, at, upTo };
};

/**
 * The AI's reach: an ACCENT thread drawn head-led along a curve with a small
 * white head (`progress` 0..1), then carrying packets out and back while it
 * holds. SVG, world px.
 */
export const ReachThread: React.FC<{
  k: number;
  frame: number;
  p0: P;
  p1: P;
  p2: P;
  progress: number;
  width: number;
  packetR: number;
  period?: number;
  speed?: number;
  phase?: number;
}> = ({ k, frame, p0, p1, p2, progress, width, packetR, period = 18, speed = 30, phase = 0 }) => {
  const pr = clamp01(progress);
  if (pr <= 0) return null;
  const c = curveThread(p0, p1, p2);
  const tip = c.at(pr);
  const packets: P[] = [];
  if (pr >= 1) {
    const travel = c.len / speed;
    const life = 2 * travel;
    const nMax = Math.floor((frame - phase) / period);
    const nMin = Math.ceil((frame - phase - life) / period);
    for (let n = nMin; n <= nMax; n++) {
      const t = frame - (phase + n * period);
      if (t < 0 || t > life) continue;
      packets.push(c.at(t <= travel ? t / travel : 2 - t / travel));
    }
  }
  return (
    <g style={{ filter: iconShadow(k) }}>
      <path d={line(c.upTo(pr))} fill="none" stroke={ACCENT} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      {packets.map((q, i) => (
        <circle key={i} cx={q.x} cy={q.y} r={packetR} fill={ACCENT} />
      ))}
      {pr < 1 ? <circle cx={tip.x} cy={tip.y} r={width * 1.5} fill={INK} /> : null}
    </g>
  );
};
