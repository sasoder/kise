import React from "react";
import { Easing, interpolate } from "remotion";

// ---------------------------------------------------------------------------
// The sheet inside `PdfHieroglyphics`: one engineering drawing in PAGE units
// (1280 x 1760), black ink on the white page. A welded-then-machined flanged
// bearing housing at 5 units per mm: front view, SECTION A-A, DETAIL B, a hole
// table and a title block, dimensioned and toleranced to ASME Y14.5.
//
// `DrawingBase` is everything the thumbnail already shows (it never changes).
// `DrawingLate` is the notation that arrives while the camera pushes in: lines
// draw on, frames and symbols snap in by scale from their anchor. No fades.
//
// Every geometric-characteristic symbol is a path, not a font glyph. Text is a
// monospace face so every callout's width is exact (0.6 em per character).
// ---------------------------------------------------------------------------

export const PW = 1280;
export const PH = 1760;

const INK = "#000000";
const PAGE = "#FFFFFF";
const FS = 15; // dimension text, page units
const CH = 0.6; // mono advance, em
const VIS = 2.3; // visible outlines
const THIN = 1.0; // dimension, extension, leader, hatch
const HID = 1.4; // hidden lines
const CEN = 0.9; // centre lines
const CEN_DASH = "18 4 3 4";
const HID_DASH = "7 4";
const BOX = 1.75 * FS; // feature-control-frame height
const PAD = 0.4 * FS;

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const n2 = (v: number) => v.toFixed(2);

// -- symbols, em units, baseline at y 0, cap height 0.7 -----------------------
type Sym = "dia" | "pos" | "flat" | "perp" | "prof" | "runout" | "conc" | "par" | "cyl" | "cbore" | "depth" | "M";
const SYM_W: Record<Sym, number> = {
  dia: 0.74,
  pos: 0.9,
  flat: 1.0,
  perp: 0.9,
  prof: 0.9,
  runout: 0.85,
  conc: 0.9,
  par: 0.9,
  cyl: 1.0,
  cbore: 0.8,
  depth: 0.7,
  M: 0.95,
};
const symShape = (s: Sym): React.ReactNode => {
  switch (s) {
    case "dia":
      return (
        <>
          <circle cx={0.37} cy={-0.35} r={0.26} />
          <path d="M0.1 0L0.64 -0.7" />
        </>
      );
    case "pos":
      return (
        <>
          <circle cx={0.45} cy={-0.35} r={0.23} />
          <path d="M0.45 -0.78V0.08M0.02 -0.35H0.88" />
        </>
      );
    case "flat":
      return <path d="M0.06 -0.12L0.3 -0.58H0.94L0.7 -0.12Z" />;
    case "perp":
      return <path d="M0.45 -0.68V-0.04M0.08 -0.04H0.82" />;
    case "prof":
      return <path d="M0.08 -0.1A0.37 0.37 0 0 1 0.82 -0.1Z" />;
    case "runout":
      return (
        <>
          <path d="M0.12 -0.04L0.62 -0.54" />
          <path d="M0.78 -0.7L0.7 -0.36L0.44 -0.62Z" fill={INK} stroke="none" />
        </>
      );
    case "conc":
      return (
        <>
          <circle cx={0.45} cy={-0.35} r={0.34} />
          <circle cx={0.45} cy={-0.35} r={0.16} />
        </>
      );
    case "par":
      return <path d="M0.16 -0.04L0.42 -0.68M0.48 -0.04L0.74 -0.68" />;
    case "cyl":
      return (
        <>
          <circle cx={0.5} cy={-0.35} r={0.2} />
          <path d="M0.1 -0.04L0.38 -0.68M0.62 -0.04L0.9 -0.68" />
        </>
      );
    case "cbore":
      return <path d="M0.1 -0.62V-0.06H0.7V-0.62" />;
    case "depth":
      return (
        <>
          <path d="M0.08 -0.66H0.62M0.35 -0.66V-0.2" />
          <path d="M0.35 0L0.2 -0.26H0.5Z" fill={INK} stroke="none" />
        </>
      );
    case "M":
      return <circle cx={0.475} cy={-0.34} r={0.42} strokeWidth={0.07} />;
  }
};

// "6X {dia}6.6 THRU" -> tokens
type Tok = string | { s: Sym };
const tk = (str: string): Tok[] =>
  str
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map((p) => (p.startsWith("{") ? { s: p.slice(1, -1) as Sym } : p));
const measure = (str: string, fs = FS) =>
  tk(str).reduce((w, t) => w + (typeof t === "string" ? t.length * CH : SYM_W[t.s]) * fs, 0);

// A run of text and symbols on one baseline. anchor: s(tart) m(iddle) e(nd).
const run = (key: string, str: string, x: number, y: number, anchor: "s" | "m" | "e" = "s", fs = FS) => {
  const w = measure(str, fs);
  let cx = x - (anchor === "m" ? w / 2 : anchor === "e" ? w : 0);
  const out: React.ReactNode[] = [];
  tk(str).forEach((t, i) => {
    if (typeof t === "string") {
      out.push(
        <text key={i} x={n2(cx)} y={n2(y)} fontSize={fs} fill={INK} style={{ whiteSpace: "pre" }}>
          {t}
        </text>,
      );
      cx += t.length * CH * fs;
    } else {
      out.push(
        <g
          key={i}
          transform={`translate(${n2(cx)} ${n2(y)}) scale(${fs})`}
          fill="none"
          stroke={INK}
          strokeWidth={0.09}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {symShape(t.s)}
        </g>,
      );
      if (t.s === "M") {
        out.push(
          <text key={`${i}m`} x={n2(cx + 0.475 * fs)} y={n2(y - 0.12 * fs)} fontSize={fs * 0.62} textAnchor="middle" fill={INK}>
            M
          </text>,
        );
      }
      cx += SYM_W[t.s] * fs;
    }
  });
  return <g key={key}>{out}</g>;
};

// A filled arrowhead with its tip at (x, y), pointing along `ang` (radians).
const arrow = (key: string, x: number, y: number, ang: number, len = 11, half = 2.7) => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const bx = x - c * len;
  const by = y - s * len;
  return (
    <path
      key={key}
      d={`M${n2(x)} ${n2(y)}L${n2(bx - s * half)} ${n2(by + c * half)}L${n2(bx + s * half)} ${n2(by - c * half)}Z`}
      fill={INK}
    />
  );
};

// Feature control frame: rows of compartments. Top-left at (x, y).
const fcfRowW = (row: string[]) => row.reduce((w, c) => w + Math.max(BOX, measure(c) + 2 * PAD), 0);
const fcf = (key: string, x: number, y: number, rows: string[][]) => (
  <g key={key}>
    {rows.map((row, r) => {
      const top = y + r * BOX;
      let cx = x;
      const cells: React.ReactNode[] = [];
      row.forEach((c, i) => {
        const w = Math.max(BOX, measure(c) + 2 * PAD);
        if (i > 0) {
          cells.push(<path key={`d${i}`} d={`M${n2(cx)} ${n2(top)}V${n2(top + BOX)}`} stroke={INK} strokeWidth={THIN * 1.3} />);
        }
        cells.push(run(`c${i}`, c, cx + w / 2, top + BOX / 2 + 0.35 * FS, "m"));
        cx += w;
      });
      return (
        <g key={r}>
          <rect x={n2(x)} y={n2(top)} width={n2(cx - x)} height={BOX} fill={PAGE} stroke={INK} strokeWidth={THIN * 1.3} />
          {cells}
        </g>
      );
    })}
  </g>
);

// Datum feature symbol: filled triangle with its base centred on (x, y), a
// stem, then the boxed letter. dir: where the box goes from the base.
const datum = (key: string, x: number, y: number, dir: "down" | "up" | "left" | "right", letter: string, stem = 13) => {
  const rot = { down: 0, left: 90, up: 180, right: -90 }[dir];
  const ux = { down: 0, left: -1, up: 0, right: 1 }[dir];
  const uy = { down: 1, left: 0, up: -1, right: 0 }[dir];
  const bc = 9 + stem + BOX / 2;
  return (
    <g key={key}>
      <g transform={`translate(${n2(x)} ${n2(y)}) rotate(${rot})`}>
        <path d="M-6.5 0H6.5L0 9Z" fill={INK} />
        <path d={`M0 9V${9 + stem}`} stroke={INK} strokeWidth={THIN * 1.3} />
      </g>
      <rect
        x={n2(x + ux * bc - BOX / 2)}
        y={n2(y + uy * bc - BOX / 2)}
        width={BOX}
        height={BOX}
        fill={PAGE}
        stroke={INK}
        strokeWidth={THIN * 1.3}
      />
      {run("t", letter, x + ux * bc, y + uy * bc + 0.35 * FS, "m")}
    </g>
  );
};

// Surface texture symbol, tip on the surface at (x, y). flip: the surface is
// the underside of the part, so the symbol hangs below it.
const finish = (key: string, x: number, y: number, label: string, flip = false) => {
  const k = flip ? -1 : 1;
  return (
    <g key={key}>
      <path
        d={`M${n2(x - 7)} ${n2(y - 12 * k)}L${n2(x)} ${n2(y)}L${n2(x + 14)} ${n2(y - 24 * k)}H${n2(x + 22 + measure(label))}M${n2(x - 7)} ${n2(y - 12 * k)}H${n2(x + 7)}`}
        fill="none"
        stroke={INK}
        strokeWidth={THIN * 1.3}
      />
      {run("t", label, x + 19, flip ? y + 24 + 0.95 * FS : y - 28)}
    </g>
  );
};

const balloonShape = (key: string, cx: number, cy: number, label: string, tx: number, ty: number) => {
  const d = Math.hypot(tx - cx, ty - cy);
  const r = 14;
  return (
    <g key={key}>
      <path
        d={`M${n2(cx + ((tx - cx) / d) * r)} ${n2(cy + ((ty - cy) / d) * r)}L${n2(tx)} ${n2(ty)}`}
        stroke={INK}
        strokeWidth={THIN}
      />
      <circle cx={tx} cy={ty} r={2.8} fill={INK} />
      <circle cx={cx} cy={cy} r={r} fill={PAGE} stroke={INK} strokeWidth={THIN * 1.3} />
      {run("t", label, cx, cy + 0.35 * FS, "m")}
    </g>
  );
};

const revTriangle = (key: string, cx: number, cy: number, letter: string) => (
  <g key={key}>
    <path d={`M${n2(cx)} ${n2(cy - 17)}L${n2(cx + 16)} ${n2(cy + 10)}H${n2(cx - 16)}Z`} fill={PAGE} stroke={INK} strokeWidth={THIN * 1.3} />
    {run("t", letter, cx, cy + 6, "m", 13)}
  </g>
);

// 45 deg (or 135 deg) hatch across a box; the caller clips it.
const hatchLines = (x0: number, y0: number, x1: number, y1: number, back: boolean, sp = 9) => {
  const h = y1 - y0;
  let d = "";
  for (let c = x0 - h; c < x1; c += sp) {
    d += back ? `M${n2(c)} ${n2(y0)}L${n2(c + h)} ${n2(y1)}` : `M${n2(c)} ${n2(y1)}L${n2(c + h)} ${n2(y0)}`;
  }
  return d;
};
const poly = (pts: number[][]) => `${pts.map((p, i) => `${i ? "L" : "M"}${n2(p[0])} ${n2(p[1])}`).join("")}Z`;
const polyline = (pts: number[][]) => pts.map((p, i) => `${i ? "L" : "M"}${n2(p[0])} ${n2(p[1])}`).join("");

// ---------------------------------------------------------------------------
// THE PART. 5 page units per mm.
// ---------------------------------------------------------------------------
const C1X = 385; // front view centre
const C1Y = 1120;
const R_FLANGE = 250; // dia 100
const R_BC = 205; // dia 82 bolt circle
const R_PILOT = 165; // dia 66 g6
const R_HUB = 140; // dia 56 h6
const R_BORE = 95; // dia 38 H7
const R_HOLE = 16.5; // dia 6.6
const R_CBORE = 27.5; // dia 11
const R_TAP = 117.5; // M5 on dia 47
const KEY_HALF = 25; // 10 JS9
const KEY_R = 111.5; // 41.3 over the keyway

const SX0 = 850; // pilot face
const SXA = 865; // datum A, the mounting face
const SXF = 925; // flange front, the weld
const SXE = 1035; // hub end
const SCY = 1120;

const HOLE_ANGLES = [30, 90, 150, 210, 270, 330];
const rad = (deg: number) => (deg * Math.PI) / 180;
const polar = (r: number, deg: number) => [C1X + r * Math.cos(rad(deg)), C1Y - r * Math.sin(rad(deg))];

// (x, radius) outlines of the section's two members; `sgn` -1 is the upper
// half, +1 the lower.
const sec = (pts: number[][], sgn: number) => pts.map(([x, r]) => [x, SCY + sgn * r]);
const PLATE = [
  [SX0 + 5, R_BORE],
  [SX0, R_BORE + 5],
  [SX0, R_PILOT],
  [SXA, R_PILOT],
  [SXA, R_FLANGE],
  [SXF, R_FLANGE],
  [SXF, R_BORE],
];
const HUB = [
  [SXF, R_HUB],
  [SXE - 5, R_HUB],
  [SXE, R_HUB - 5],
  [SXE, R_BORE + 5],
  [SXE - 5, R_BORE],
  [1014, R_BORE],
  [1014, R_BORE + 5],
  [1005, R_BORE + 5],
  [1005, R_BORE],
  [SXF, R_BORE],
];
const HOLE_FILL = [
  [SXA - 3, R_BC - R_HOLE],
  [893, R_BC - R_HOLE],
  [893, R_BC - R_CBORE],
  [SXF + 3, R_BC - R_CBORE],
  [SXF + 3, R_BC + R_CBORE],
  [893, R_BC + R_CBORE],
  [893, R_BC + R_HOLE],
  [SXA - 3, R_BC + R_HOLE],
];
const HOLE_EDGE_IN = [
  [SXA, R_BC - R_HOLE],
  [893, R_BC - R_HOLE],
  [893, R_BC - R_CBORE],
  [SXF, R_BC - R_CBORE],
];
const HOLE_EDGE_OUT = [
  [SXA, R_BC + R_HOLE],
  [893, R_BC + R_HOLE],
  [893, R_BC + R_CBORE],
  [SXF, R_BC + R_CBORE],
];

const NOTES = [
  "NOTES:",
  "1. INTERPRET DIMENSIONS AND TOLERANCES PER ASME Y14.5-2018.",
  "2. ALL DIMENSIONS IN MILLIMETRES. DO NOT SCALE DRAWING.",
  "3. WELD PER AWS D1.2. MACHINE AFTER WELD.",
  "4. BREAK ALL SHARP EDGES 0.2 MAX.",
  "5. ANODIZE PER MIL-A-8625 TYPE II, CLASS 1. MASK DATUM A.",
];

const HOLE_ROWS = [
  ["TAG", "X", "Y", "SIZE"],
  ["A1", "35.51", "20.50", "{dia}6.6 THRU"],
  ["A2", "0.00", "41.00", "{dia}6.6 THRU"],
  ["A3", "-35.51", "20.50", "{dia}6.6 THRU"],
  ["A4", "-35.51", "-20.50", "{dia}6.6 THRU"],
  ["A5", "0.00", "-41.00", "{dia}6.6 THRU"],
  ["A6", "35.51", "-20.50", "{dia}6.6 THRU"],
  ["B1", "-16.62", "16.62", "M5x0.8 - 6H"],
  ["B2", "16.62", "-16.62", "M5x0.8 - 6H"],
];

// -- static dimension pieces (used by the base, fully drawn) ------------------
const hdimStatic = (key: string, x1: number, x2: number, yA: number, yB: number, yL: number, label: string) => {
  const w = measure(label) + 8;
  const mid = (x1 + x2) / 2;
  const s1 = Math.sign(yL - yA);
  const s2 = Math.sign(yL - yB);
  return (
    <g key={key}>
      <path
        d={`M${x1} ${yA + s1 * 3}V${yL + s1 * 5}M${x2} ${yB + s2 * 3}V${yL + s2 * 5}M${x1} ${yL}H${x2}`}
        stroke={INK}
        strokeWidth={THIN}
        fill="none"
      />
      {arrow("a", x1, yL, Math.PI)}
      {arrow("b", x2, yL, 0)}
      <rect x={mid - w / 2} y={yL - FS * 0.6} width={w} height={FS * 1.2} fill={PAGE} />
      {run("t", label, mid, yL + 0.35 * FS, "m")}
    </g>
  );
};
const leaderStatic = (
  key: string,
  target: number[],
  elbow: number[],
  dir: 1 | -1,
  lines: string[],
  rows: string[][] = [],
) => {
  const xs = elbow[0] + dir * 16;
  const blockW = Math.max(...lines.map((l) => measure(l)), ...rows.map(fcfRowW));
  const left = dir === 1 ? xs : xs - blockW;
  const lastBase = elbow[1] + 0.35 * FS + (lines.length - 1) * 1.4 * FS;
  return (
    <g key={key}>
      <path
        d={`M${n2(target[0])} ${n2(target[1])}L${elbow[0]} ${elbow[1]}H${elbow[0] + dir * 12}`}
        fill="none"
        stroke={INK}
        strokeWidth={THIN}
      />
      {arrow("a", target[0], target[1], Math.atan2(target[1] - elbow[1], target[0] - elbow[0]))}
      {lines.map((l, i) => run(`l${i}`, l, left, elbow[1] + 0.35 * FS + i * 1.4 * FS))}
      {rows.length ? fcf("f", left, lastBase + 0.5 * FS, rows) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE BASE: what the thumbnail already shows.
// ---------------------------------------------------------------------------
const sectionHalf = (sgn: number) => {
  const id = sgn < 0 ? "u" : "l";
  const plate = sec(PLATE, sgn);
  const hub = sec(HUB, sgn);
  const y0 = Math.min(SCY + sgn * R_BORE, SCY + sgn * R_FLANGE);
  const y1 = Math.max(SCY + sgn * R_BORE, SCY + sgn * R_FLANGE);
  const weld = sec(
    [
      [SXF, R_HUB],
      [SXF, R_HUB + 13],
      [SXF + 13, R_HUB],
    ],
    sgn,
  );
  return (
    <g key={id}>
      <clipPath id={`pdfh-plate-${id}`}>
        <path d={poly(plate)} />
      </clipPath>
      <clipPath id={`pdfh-hub-${id}`}>
        <path d={poly(hub)} />
      </clipPath>
      <path d={hatchLines(SX0, y0, SXF, y1, false)} stroke={INK} strokeWidth={THIN} clipPath={`url(#pdfh-plate-${id})`} />
      <path d={hatchLines(SXF, y0, SXE, y1, true, 7)} stroke={INK} strokeWidth={THIN} clipPath={`url(#pdfh-hub-${id})`} />
      <path d={poly(plate)} fill="none" stroke={INK} strokeWidth={VIS} strokeLinejoin="miter" />
      <path d={poly(hub)} fill="none" stroke={INK} strokeWidth={VIS} strokeLinejoin="miter" />
      {/* the counterbored bolt hole on the cutting plane */}
      <path d={poly(sec(HOLE_FILL, sgn))} fill={PAGE} />
      <path d={polyline(sec(HOLE_EDGE_IN, sgn))} fill="none" stroke={INK} strokeWidth={VIS} />
      <path d={polyline(sec(HOLE_EDGE_OUT, sgn))} fill="none" stroke={INK} strokeWidth={VIS} />
      <path
        d={`M${SXA - 14} ${SCY + sgn * R_BC}H${SXF + 14}`}
        stroke={INK}
        strokeWidth={CEN}
        strokeDasharray={CEN_DASH}
      />
      {/* the fillet weld, in section */}
      <path d={poly(weld)} fill={INK} />
    </g>
  );
};

const Base: React.FC = () => {
  const tbX = 720;
  const tbY = 1490;
  const tbM = 975;
  const htX = [70, 130, 230, 330, 500];
  const htY = 1452;
  const htH = 27;
  return (
    <g>
      {/* sheet border, with zone ticks */}
      <rect x={40} y={40} width={PW - 80} height={PH - 80} fill="none" stroke={INK} strokeWidth={VIS} />
      <rect x={56} y={56} width={PW - 112} height={PH - 112} fill="none" stroke={INK} strokeWidth={THIN} />
      {[1, 2, 3, 4, 5].map((i) => (
        <path
          key={`zx${i}`}
          d={`M${56 + (i * (PW - 112)) / 6} 40V56M${56 + (i * (PW - 112)) / 6} ${PH - 56}V${PH - 40}`}
          stroke={INK}
          strokeWidth={THIN}
        />
      ))}
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path
          key={`zy${i}`}
          d={`M40 ${56 + (i * (PH - 112)) / 8}H56M${PW - 56} ${56 + (i * (PH - 112)) / 8}H${PW - 40}`}
          stroke={INK}
          strokeWidth={THIN}
        />
      ))}

      {/* general notes */}
      {NOTES.map((l, i) => run(`n${i}`, l, 78, 96 + i * 23))}

      {/* ---------------- DETAIL B: the retaining-ring groove ---------------- */}
      <g>
        <clipPath id="pdfh-detail">
          <circle cx={985} cy={450} r={128} />
        </clipPath>
        <clipPath id="pdfh-detail-metal">
          <path d="M840 300H1130V440H1020V495H950V440H840Z" />
        </clipPath>
        <g clipPath="url(#pdfh-detail)">
          <path d={hatchLines(840, 300, 1130, 500, true, 14)} stroke={INK} strokeWidth={THIN} clipPath="url(#pdfh-detail-metal)" />
          <path d="M840 440H950V495H1020V440H1130" fill="none" stroke={INK} strokeWidth={VIS} />
        </g>
        <circle cx={985} cy={450} r={128} fill="none" stroke={INK} strokeWidth={THIN * 1.3} />
        {hdimStatic("gw", 950, 1020, 498, 498, 540, "1.85")}
        {run("gwt", "H13", 1030, 540 + 0.35 * FS)}
        {leaderStatic("gr", [951.5, 493.5], [905, 525], -1, ["2X R0.4 MAX"])}
        {leaderStatic("gd", [985, 495], [1105, 600], 1, ["{dia}40 H12"])}
        {run("dl", "DETAIL B", 985, 618, "m", 20)}
        {run("ds", "SCALE 10:1", 985, 640, "m")}
      </g>

      {/* ---------------- FRONT VIEW ---------------- */}
      <g fill="none" stroke={INK}>
        <circle cx={C1X} cy={C1Y} r={R_FLANGE} strokeWidth={VIS} />
        <circle cx={C1X} cy={C1Y} r={R_HUB} strokeWidth={VIS} />
        <circle cx={C1X} cy={C1Y} r={R_HUB + 13} strokeWidth={THIN} />
        <path
          d={`M${n2(C1X - 91.65)} ${C1Y - KEY_HALF}A${R_BORE} ${R_BORE} 0 1 1 ${n2(C1X - 91.65)} ${C1Y + KEY_HALF}H${C1X - KEY_R}V${C1Y - KEY_HALF}Z`}
          strokeWidth={VIS}
        />
        <circle cx={C1X} cy={C1Y} r={R_BORE + 5} strokeWidth={THIN} />
        <circle cx={C1X} cy={C1Y} r={R_PILOT} strokeWidth={HID} strokeDasharray={HID_DASH} />
        <circle cx={C1X} cy={C1Y} r={R_BC} strokeWidth={CEN} strokeDasharray={CEN_DASH} />
        {HOLE_ANGLES.map((a) => {
          const [hx, hy] = polar(R_BC, a);
          const [ax, ay] = polar(R_BC - 40, a);
          const [bx, by] = polar(R_BC + 40, a);
          return (
            <g key={a}>
              <circle cx={n2(hx)} cy={n2(hy)} r={R_CBORE} strokeWidth={VIS} />
              <circle cx={n2(hx)} cy={n2(hy)} r={R_HOLE} strokeWidth={VIS} />
              <path d={`M${n2(ax)} ${n2(ay)}L${n2(bx)} ${n2(by)}`} strokeWidth={CEN} />
            </g>
          );
        })}
        {[135, 315].map((a) => {
          const [hx, hy] = polar(R_TAP, a);
          return (
            <g key={a}>
              <circle cx={n2(hx)} cy={n2(hy)} r={10.5} strokeWidth={VIS} />
              <path
                d={`M${n2(hx + 13)} ${n2(hy)}A13 13 0 1 1 ${n2(hx)} ${n2(hy - 13)}`}
                strokeWidth={THIN}
              />
              <path d={`M${n2(hx - 19)} ${n2(hy)}H${n2(hx + 19)}M${n2(hx)} ${n2(hy - 19)}V${n2(hy + 19)}`} strokeWidth={CEN} />
            </g>
          );
        })}
        <path d={`M105 ${C1Y}H665`} strokeWidth={CEN} strokeDasharray={CEN_DASH} />
        <path d={`M${C1X} 862V1378`} strokeWidth={CEN} strokeDasharray={CEN_DASH} />
        {/* cutting plane A-A */}
        <path d={`M${C1X} 826V862M${C1X} 1378V1414`} strokeWidth={3.6} />
        <path d={`M${C1X} 829H${C1X - 44}M${C1X} 1411H${C1X - 44}`} strokeWidth={THIN * 1.4} />
      </g>
      {arrow("sa1", C1X - 48, 829, Math.PI, 14, 3.6)}
      {arrow("sa2", C1X - 48, 1411, Math.PI, 14, 3.6)}
      {run("sA1", "A", C1X - 70, 836, "m", 22)}
      {run("sA2", "A", C1X - 70, 1418, "m", 22)}
      {leaderStatic("key", [C1X - KEY_R + 4, C1Y - KEY_HALF], [226, 800], -1, ["41.3 +0.2/0"])}
      {/* 6X 60 deg, lower left */}
      <g fill="none" stroke={INK} strokeWidth={THIN}>
        <path
          d={`M${n2(polar(255, 210)[0])} ${n2(polar(255, 210)[1])}L${n2(polar(300, 210)[0])} ${n2(polar(300, 210)[1])}M${n2(polar(255, 270)[0])} ${n2(polar(255, 270)[1])}L${n2(polar(300, 270)[0])} ${n2(polar(300, 270)[1])}`}
        />
        <path
          d={`M${n2(polar(290, 210)[0])} ${n2(polar(290, 210)[1])}A290 290 0 0 0 ${n2(polar(290, 270)[0])} ${n2(polar(290, 270)[1])}`}
        />
      </g>
      {arrow("an1", polar(290, 210)[0], polar(290, 210)[1], rad(-60))}
      {arrow("an2", polar(290, 270)[0], polar(290, 270)[1], 0)}
      <rect x={176} y={1374} width={82} height={30} fill={PAGE} />
      {run("ant", "6X", 208, 1394, "e")}
      {fcf("anb", 213, 1376, [["60°"]])}
      {/* 30 deg from the horizontal to the first hole (basic), left */}
      <path
        d={`M${n2(polar(264, 180)[0])} ${n2(polar(264, 180)[1])}A264 264 0 0 1 ${n2(polar(264, 150)[0])} ${n2(polar(264, 150)[1])}M${n2(polar(248, 150)[0])} ${n2(polar(248, 150)[1])}L${n2(polar(276, 150)[0])} ${n2(polar(276, 150)[1])}`}
        fill="none"
        stroke={INK}
        strokeWidth={THIN}
      />
      {arrow("a30a", polar(264, 180)[0], polar(264, 180)[1], Math.PI / 2)}
      {arrow("a30b", polar(264, 150)[0], polar(264, 150)[1], rad(-60))}
      {fcf("a30t", 109, 1040, [["30°"]])}

      {/* ---------------- SECTION A-A ---------------- */}
      {sectionHalf(-1)}
      {sectionHalf(1)}
      <g fill="none" stroke={INK}>
        {/* edges seen beyond the cutting plane: bore ends, groove, keyway */}
        <path
          d={`M${SX0 + 5} ${SCY - R_BORE}V${SCY + R_BORE}M${SXE - 5} ${SCY - R_BORE}V${SCY + R_BORE}M${SX0} ${SCY - R_BORE - 5}V${SCY + R_BORE + 5}M${SXE} ${SCY - R_BORE - 5}V${SCY + R_BORE + 5}M1005 ${SCY - R_BORE}V${SCY + R_BORE}M1014 ${SCY - R_BORE}V${SCY + R_BORE}`}
          strokeWidth={VIS}
        />
        <path d={`M${SX0} ${SCY - KEY_HALF}H${SXE}M${SX0} ${SCY + KEY_HALF}H${SXE}`} strokeWidth={VIS} />
        <path d={`M${SX0 - 22} ${SCY}H${SXE + 22}`} strokeWidth={CEN} strokeDasharray={CEN_DASH} />
        {/* DETAIL B marker */}
        <circle cx={1009.5} cy={SCY - R_BORE - 2} r={21} strokeWidth={THIN * 1.3} />
      </g>
      {run("dB", "B", 1046, SCY - R_BORE - 34, "m", 18)}
      {run("secl", "SECTION A-A", 942, 1466, "m", 20)}
      {/* right of the section: outside the final frame, in the thumbnail */}
      {leaderStatic("par", [SXE, SCY + R_HUB - 22], [1075, 1330], 1, [], [["{par}", "0.05", "A"]])}
      {leaderStatic("hch", [SXE - 2.5, SCY - R_HUB + 2.5], [1085, 930], 1, ["1 X 45°"])}

      {/* ---------------- HOLE TABLE ---------------- */}
      <g fill="none" stroke={INK}>
        <rect x={htX[0]} y={htY} width={htX[4] - htX[0]} height={htH * HOLE_ROWS.length} strokeWidth={VIS} />
        {htX.slice(1, 4).map((x) => (
          <path key={x} d={`M${x} ${htY}V${htY + htH * HOLE_ROWS.length}`} strokeWidth={THIN} />
        ))}
        {HOLE_ROWS.slice(1).map((_, i) => (
          <path key={i} d={`M${htX[0]} ${htY + htH * (i + 1)}H${htX[4]}`} strokeWidth={i === 0 ? VIS : THIN} />
        ))}
      </g>
      {HOLE_ROWS.map((row, r) =>
        row.map((c, i) => run(`ht${r}-${i}`, c, (htX[i] + htX[i + 1]) / 2, htY + htH * r + 19, "m")),
      )}

      {/* ---------------- TITLE BLOCK ---------------- */}
      <g fill="none" stroke={INK}>
        <rect x={tbX} y={tbY} width={1224 - tbX} height={1704 - tbY} strokeWidth={VIS} fill={PAGE} />
        <path d={`M${tbM} ${tbY}V1704`} strokeWidth={VIS} />
        <path
          d={`M${tbX} ${tbY + 118}H${tbM}M${tbX} ${tbY + 166}H${tbM}M${tbM} ${tbY + 62}H1224M${tbM} ${tbY + 124}H1224M${tbM} ${tbY + 166}H1224M1130 ${tbY + 124}V${tbY + 166}M1100 ${tbY + 166}V1704`}
          strokeWidth={THIN}
        />
        {/* third-angle projection symbol */}
        <path d={`M1150 ${tbY + 180}L1180 ${tbY + 173}V${tbY + 203}L1150 ${tbY + 196}Z`} strokeWidth={THIN * 1.3} />
        <circle cx={1205} cy={tbY + 188} r={8} strokeWidth={THIN * 1.3} />
        <circle cx={1205} cy={tbY + 188} r={14} strokeWidth={THIN * 1.3} />
      </g>
      {[
        "UNLESS OTHERWISE SPECIFIED",
        "DIMENSIONS ARE IN MM",
        ".X    ±0.1",
        ".XX   ±0.02",
        "ANGLES ±0.5°",
      ].map((l, i) => run(`tb${i}`, l, tbX + 10, tbY + 22 + i * 21))}
      {run("tbm1", "MATERIAL", tbX + 10, tbY + 136, "s", 11)}
      {run("tbm2", "AL 6061-T6", tbX + 10, tbY + 157)}
      {run("tbf1", "FINISH", tbX + 10, tbY + 184, "s", 11)}
      {run("tbf2", "ANODIZE TYPE II", tbX + 10, tbY + 205)}
      {run("tbt1", "TITLE", tbM + 10, tbY + 18, "s", 11)}
      {run("tbt2", "BEARING HOUSING, WELDMENT", tbM + 10, tbY + 44)}
      {run("tbd1", "DWG NO.", tbM + 10, tbY + 80, "s", 11)}
      {run("tbd2", "2041-117", tbM + 10, tbY + 110, "s", 22)}
      {run("tbs", "SCALE 2:1", tbM + 10, tbY + 151)}
      {run("tbr", "REV C", 1140, tbY + 151)}
      {run("tbsh", "SHEET 1 OF 2", tbM + 10, tbY + 196)}
    </g>
  );
};
export const DrawingBase = React.memo(Base);

// ---------------------------------------------------------------------------
// THE LATE NOTATION: arrives during the push. Each piece has its own frame.
// ---------------------------------------------------------------------------
export const DrawingLate: React.FC<{ frame: number }> = ({ frame }) => {
  const prog = (at: number, n: number) => interpolate(frame, [at - 1, at - 1 + n], [0, 1], { easing: EASE, ...clamp });
  const lin = (at: number, n: number) => interpolate(frame, [at - 1, at - 1 + n], [0, 1], clamp);

  // snap in by scale from an anchor
  const pop = (key: string, at: number, ax: number, ay: number, node: React.ReactNode) => {
    if (frame < at) return null;
    const s = prog(at, 6);
    return (
      <g key={key} transform={`translate(${n2(ax)} ${n2(ay)}) scale(${s.toFixed(4)}) translate(${n2(-ax)} ${n2(-ay)})`}>
        {node}
      </g>
    );
  };
  // draw a path on
  const draw = (key: string, at: number, n: number, d: string, w = THIN) => {
    if (frame < at) return null;
    return (
      <path key={key} d={d} fill="none" stroke={INK} strokeWidth={w} pathLength={1} strokeDasharray={`${lin(at, n).toFixed(4)} 1`} />
    );
  };

  // leader -> shoulder -> lines of text -> feature control frame rows
  const leader = (
    key: string,
    at: number,
    target: number[],
    elbow: number[],
    dir: 1 | -1,
    lines: string[],
    rows: string[][] = [],
  ) => {
    if (frame < at) return null;
    const xs = elbow[0] + dir * 16;
    const blockW = Math.max(0, ...lines.map((l) => measure(l)), ...rows.map(fcfRowW));
    const left = dir === 1 ? xs : xs - blockW;
    const lastBase = elbow[1] + 0.35 * FS + (lines.length - 1) * 1.4 * FS;
    const fTop = lines.length ? lastBase + 0.5 * FS : elbow[1] - BOX / 2;
    return (
      <g key={key}>
        {draw("p", at, 6, `M${n2(target[0])} ${n2(target[1])}L${elbow[0]} ${elbow[1]}H${elbow[0] + dir * 12}`)}
        {arrow("a", target[0], target[1], Math.atan2(target[1] - elbow[1], target[0] - elbow[0]))}
        {lines.map((l, i) => pop(`l${i}`, at + 3 + i, xs, elbow[1] + i * 1.4 * FS, run("r", l, left, elbow[1] + 0.35 * FS + i * 1.4 * FS)))}
        {rows.map((row, i) =>
          pop(`f${i}`, at + 4 + lines.length + i * 2, dir === 1 ? left : left + blockW, fTop + i * BOX + BOX / 2, fcf("f", left, fTop + i * BOX, [row])),
        )}
      </g>
    );
  };

  // horizontal dimension. out: arrows outside, text beyond that end.
  const hdim = (
    key: string,
    at: number,
    x1: number,
    x2: number,
    yA: number,
    yB: number,
    yL: number,
    label: string,
    out?: "l" | "r",
  ) => {
    if (frame < at) return null;
    const e = prog(at, 5);
    const l = prog(at + 2, 7);
    const s1 = Math.sign(yL - yA);
    const s2 = Math.sign(yL - yB);
    const w = measure(label);
    const ext = `M${x1} ${yA + s1 * 3}V${n2(yA + s1 * 3 + (yL + s1 * 5 - yA - s1 * 3) * e)}M${x2} ${yB + s2 * 3}V${n2(yB + s2 * 3 + (yL + s2 * 5 - yB - s2 * 3) * e)}`;
    if (!out) {
      const mid = (x1 + x2) / 2;
      const tip = x1 + (x2 - x1) * l;
      return (
        <g key={key}>
          <path d={ext} stroke={INK} strokeWidth={THIN} fill="none" />
          {frame >= at + 2 ? (
            <>
              <path d={`M${x1} ${yL}H${n2(tip)}`} stroke={INK} strokeWidth={THIN} />
              {arrow("a", x1, yL, Math.PI)}
              {arrow("b", tip, yL, 0)}
            </>
          ) : null}
          {pop(
            "t",
            at + 5,
            mid,
            yL,
            <>
              <rect x={mid - w / 2 - 4} y={yL - FS * 0.6} width={w + 8} height={FS * 1.2} fill={PAGE} />
              {run("r", label, mid, yL + 0.35 * FS, "m")}
            </>,
          )}
        </g>
      );
    }
    const far = out === "l" ? x1 - (24 + w + 4) * l : x2 + (24 + w + 4) * l;
    const near = out === "l" ? x2 + 20 * l : x1 - 20 * l;
    const tx = out === "l" ? x1 - 22 - w : x2 + 22;
    return (
      <g key={key}>
        <path d={ext} stroke={INK} strokeWidth={THIN} fill="none" />
        {frame >= at + 2 ? (
          <>
            <path d={`M${n2(far)} ${yL}H${n2(near)}`} stroke={INK} strokeWidth={THIN} />
            {arrow("a", x1, yL, 0)}
            {arrow("b", x2, yL, Math.PI)}
          </>
        ) : null}
        {pop("t", at + 5, out === "l" ? x1 - 22 : x2 + 22, yL, run("r", label, tx, yL - 5))}
      </g>
    );
  };

  // welding symbol: arrow, reference line, weld-all-around, fillet on the arrow side
  const weld = (key: string, at: number, target: number[], elbow: number[], size: string) => {
    if (frame < at) return null;
    const [ex, ey] = elbow;
    return (
      <g key={key}>
        {draw("p", at, 7, `M${n2(target[0])} ${n2(target[1])}L${ex} ${ey}H${ex + 74}`, THIN * 1.3)}
        {arrow("a", target[0], target[1], Math.atan2(target[1] - ey, target[0] - ex))}
        {pop(
          "s",
          at + 4,
          ex,
          ey,
          <>
            <circle cx={ex} cy={ey} r={5} fill={PAGE} stroke={INK} strokeWidth={THIN * 1.3} />
            <path d={`M${ex + 36} ${ey}V${ey + 15}L${ex + 51} ${ey}`} fill="none" stroke={INK} strokeWidth={THIN * 1.3} />
            {run("t", size, ex + 32, ey + 15, "e")}
            <path d={`M${ex + 74} ${ey}l10 -9M${ex + 74} ${ey}l10 9`} fill="none" stroke={INK} strokeWidth={THIN * 1.3} />
            {run("n", "TYP", ex + 90, ey + 0.35 * FS)}
          </>,
        )}
      </g>
    );
  };

  const flatX = 640;
  const flatY = 826;
  const flatW = fcfRowW(["{flat}", "0.02"]);
  const profRow = ["{prof}", "0.1", "A", "B"];
  const perpRow = ["{perp}", "{dia}0.03", "A"];
  const perpW = fcfRowW(perpRow);

  return (
    <g>
      {/* 6X bolt holes: counterbore callout + position */}
      {leader(
        "bolt",
        46,
        [585, 1001.7],
        [648, 928],
        1,
        ["6X {dia}6.6 THRU", "{cbore} {dia}11 {depth}6.5"],
        [["{pos}", "{dia}0.05{M}", "A", "B", "C"]],
      )}
      {/* overall length */}
      {hdim("len", 49, SX0, SXE, SCY - R_PILOT, SCY - R_HUB, 762, "37.00")}
      {/* hub diameter: runout + cylindricity */}
      {leader("hub", 51, [522, 1091], [650, 1046], 1, ["{dia}56 h6"], [
        ["{runout}", "0.02", "B"],
        ["{cyl}", "0.01"],
      ])}
      {/* flange thickness */}
      {hdim("thk", 54, SXA, SXF, SCY - R_FLANGE, SCY - R_FLANGE, 802, "12.00 ±0.02", "l")}
      {/* tapped holes */}
      {leader("tap", 56, [477, 1194], [650, 1166], 1, ["2X M5x0.8 - 6H", "{depth}10 MIN"], [["{pos}", "{dia}0.1", "A", "B"]])}
      {/* flatness of the mounting face, and datum A hanging off the frame */}
      {draw("flatl", 58, 6, `M${n2(flatX + flatW)} ${flatY + BOX / 2}H${SXA}`)}
      {frame >= 58 ? arrow("flata", SXA, flatY + BOX / 2, 0) : null}
      {pop("flat", 59, flatX + flatW, flatY + BOX / 2, fcf("f", flatX, flatY, [["{flat}", "0.02"]]))}
      {pop("dA", 61, flatX + 22, flatY + BOX, datum("d", flatX + 22, flatY + BOX, "down", "A"))}
      {/* pilot diameter: perpendicularity, datum B */}
      {leader("pilot", 60, [SX0 + 7, SCY + R_PILOT], [816, 1300], -1, ["{dia}66 g6"], [perpRow])}
      {pop("dB", 66, 800 - perpW + 22, 1300 + 0.85 * FS + BOX, datum("d", 800 - perpW + 22, 1300 + 0.85 * FS + BOX, "down", "B"))}
      {/* bolt circle, basic */}
      {leader("bc", 62, [487.5, 942.5], [566, 772], 1, [], [["{dia}82"]])}
      {/* the weld */}
      {weld("weld", 64, [SXF + 6, SCY + R_HUB + 6], [940, 1330], "5")}
      {/* pilot depth */}
      {hdim("pil", 65, SX0, SXA, SCY + R_PILOT, SCY + R_FLANGE, 1422, "3.00", "l")}
      {/* bore chamfers */}
      {leader("chm", 66, [SX0 + 2, SCY + R_BORE + 3], [838, 1250], -1, ["2X 0.5 X 45°"])}
      {/* surface texture, hub */}
      {pop("fin1", 67, 966, SCY - R_HUB, finish("f", 966, SCY - R_HUB, "Ra 0.8"))}
      {/* item balloon, the flange */}
      {pop("bal1", 68, 792, 886, balloonShape("b", 792, 886, "1", 880, 882))}
      {/* flange OD: size + runout */}
      {leader("od", 69, [576.5, 1280.7], [590, 1408], 1, ["{dia}100 h9"], [["{runout}", "0.05", "B"]])}
      {/* profile of the hub */}
      {draw("profl", 70, 6, `M940 ${818 + BOX}V${SCY - R_HUB}`)}
      {frame >= 70 ? arrow("profa", 940, SCY - R_HUB, Math.PI / 2) : null}
      {pop("prof", 71, 940, 818 + BOX, fcf("f", 924, 818, [profRow]))}

      {/* ---- still being annotated, f72 to the cut ---- */}
      {/* the bore: size + cylindricity, inside the section */}
      {leader("bore", 72, [897, SCY - R_BORE], [905, 1048], 1, ["{dia}38 H7"], [["{cyl}", "0.01"]])}
      {/* flange edge chamfer, top left */}
      {leader("chf", 74, [561.8, 943.2], [575, 812], 1, ["2X 0.3 X 45°"])}
      {/* keyway width across the bore, datum C on its dimension line */}
      {draw("keyl", 76, 5, `M872 1077V1163H880`)}
      {frame >= 76 ? arrow("keya", 872, SCY - KEY_HALF, Math.PI / 2) : null}
      {frame >= 76 ? arrow("keyb", 872, SCY + KEY_HALF, -Math.PI / 2) : null}
      {pop("keyt", 77, 884, 1163, run("r", "10 JS9", 884, 1168))}
      {/* undercut radius at the pilot */}
      {leader("rad", 78, [SXA - 1, SCY - R_PILOT - 1], [846, 912], -1, ["R0.3 MAX"])}
      {pop("keyf", 79, 858, 1180 + BOX / 2, fcf("f", 858, 1180, [["{pos}", "0.05{M}", "A", "B"]]))}
      {pop("dC", 80, 872, 1077, datum("d", 872, 1077, "up", "C"))}
      {pop("fin4", 81, 872, SCY - R_FLANGE, finish("f", 872, SCY - R_FLANGE, "1.6"))}
      {/* item balloon, the hub */}
      {pop("bal2", 82, 962, 1291, balloonShape("b", 962, 1291, "2", 985, 1240))}
      {/* revision flag on the hub diameter */}
      {pop("rev", 83, 792, 1064, revTriangle("r", 792, 1064, "C"))}
      {pop("fin2", 84, 895, SCY + R_FLANGE, finish("f", 895, SCY + R_FLANGE, "Ra 1.6", true))}
      {/* general surface texture */}
      {pop("fin3", 85, 585, 1502, finish("f", 585, 1502, "Ra 3.2"))}
    </g>
  );
};
