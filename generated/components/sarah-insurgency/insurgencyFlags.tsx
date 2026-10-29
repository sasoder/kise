// ---------------------------------------------------------------------------
// insurgencyFlags: the clip's period flags as block stickers, redrawn TWO-TONE in the palette (cream + dark umber;
// orange takes the red where the side is the orange one: the side fighting on its own ground). Drawn in a 30 x 20
// box (3:2) with a cream sticker margin and a dark hairline edge, built to read at ~40 px wide on a phone.
//   japan       Japan's Hinomaru: a dark disc (the red) on cream. The occupier: cream, never orange.
//   union1606   the pre-1801 Union Flag (St Andrew + St George, no St Patrick): dark field (the blue), the cream
//               saltire and the cream cross (white + red, two-tone: the cross a shade deeper so it reads as its own)
//   roc         the Republic of China, Blue Sky White Sun and a Wholly Red Earth: an orange field (the red), a dark
//               canton (the blue sky), the cream sun: twelve rays, a dark ring, a cream disc
//   grandUnion  the Continental Colours, 1776: thirteen stripes, orange (the red) and cream, the pre-1801 Union
//               in the canton
//   stars1777   the Flag Resolution flag, 1777: thirteen stripes, orange (the red) and cream, a dark canton (the blue)
//               with thirteen cream stars in a circle. Reads as American (not British) beside the cream Union block
// Re-exported by insurgencyShared.tsx.
// ---------------------------------------------------------------------------
import React from "react";

export type FlagKind = "japan" | "union1606" | "roc" | "grandUnion" | "stars1777";
export const FLAG_W = 30;
export const FLAG_H = 20;
export const FLAG_INK = { cream: "#EFE6D0", creamDeep: "#D6C7A2", dark: "#2E241B", orange: "#FFB000", orangeDeep: "#E39A10", edge: "#3A2D21" };

/** the pre-1801 union in a box (x, y, w, h): dark field, cream saltire, cream cross a shade deeper */
const Union1606: React.FC<{ x: number; y: number; w: number; h: number; id: string }> = ({ x, y, w, h, id }) => {
  const sw = h * 0.2; // the saltire's width
  const cw = h * 0.3; // the cross's width
  return (
    <g>
      <defs>
        <clipPath id={`${id}-u`}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-u)`}>
        <rect x={x} y={y} width={w} height={h} fill={FLAG_INK.dark} />
        <path d={`M${x},${y}L${x + w},${y + h}M${x + w},${y}L${x},${y + h}`} stroke={FLAG_INK.cream} strokeWidth={sw} />
        <rect x={x} y={y + (h - cw) / 2} width={w} height={cw} fill={FLAG_INK.creamDeep} />
        <rect x={x + (w - cw) / 2} y={y} width={cw} height={h} fill={FLAG_INK.creamDeep} />
        {/* the white fimbriation as a thin cream edge, so the cross reads apart from the saltire */}
        <rect x={x} y={y + (h - cw) / 2} width={w} height={cw} fill="none" stroke={FLAG_INK.cream} strokeWidth={h * 0.06} />
        <rect x={x + (w - cw) / 2} y={y} width={cw} height={h} fill="none" stroke={FLAG_INK.cream} strokeWidth={h * 0.06} />
        <rect x={x + (w - cw) / 2 + h * 0.03} y={y + (h - cw) / 2 + h * 0.03} width={cw - h * 0.06} height={cw - h * 0.06} fill={FLAG_INK.creamDeep} />
      </g>
    </g>
  );
};

const Sun: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => {
  // 12 triangular rays reaching r, the body (ring + disc) ~0.53 r (the ROC proportions, simplified)
  const rays: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    const b0 = a - Math.PI / 12;
    const b1 = a + Math.PI / 12;
    const rb = r * 0.5;
    rays.push(`M${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}L${cx + rb * Math.cos(b0)},${cy + rb * Math.sin(b0)}L${cx + rb * Math.cos(b1)},${cy + rb * Math.sin(b1)}Z`);
  }
  return (
    <g>
      <path d={rays.join("")} fill={FLAG_INK.cream} />
      <circle cx={cx} cy={cy} r={r * 0.53} fill={FLAG_INK.dark} />
      <circle cx={cx} cy={cy} r={r * 0.44} fill={FLAG_INK.cream} />
    </g>
  );
};

/** the flag art in [0, FLAG_W] x [0, FLAG_H], including the sticker margin and edge */
export const FlagArt: React.FC<{ kind: FlagKind; id: string }> = ({ kind, id }) => {
  const m = 1.3; // the sticker's cream margin
  const x = m;
  const y = m;
  const w = FLAG_W - 2 * m;
  const h = FLAG_H - 2 * m;
  let art: React.ReactNode = null;
  if (kind === "japan") {
    art = (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={FLAG_INK.cream} />
        <circle cx={x + w / 2} cy={y + h / 2} r={h * 0.3} fill={FLAG_INK.dark} />
      </g>
    );
  } else if (kind === "union1606") {
    art = <Union1606 x={x} y={y} w={w} h={h} id={id} />;
  } else if (kind === "roc") {
    const cw = w / 2;
    const ch = h / 2;
    art = (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={FLAG_INK.orange} />
        <rect x={x} y={y} width={cw} height={ch} fill={FLAG_INK.dark} />
        <Sun cx={x + cw / 2} cy={y + ch / 2} r={ch * 0.42} />
      </g>
    );
  } else if (kind === "stars1777") {
    const n = 13;
    const sh = h / n;
    const stripes: React.ReactNode[] = [];
    for (let i = 0; i < n; i++) stripes.push(<rect key={i} x={x} y={y + i * sh} width={w} height={sh + 0.02} fill={i % 2 === 0 ? FLAG_INK.orange : FLAG_INK.cream} />);
    const cw = w * 0.44;
    const ch = sh * 7;
    const cx = x + cw / 2;
    const cy = y + ch / 2;
    const ring = ch * 0.31;
    const sr = ch * 0.085;
    const stars: string[] = [];
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2 - Math.PI / 2;
      const px = cx + ring * Math.cos(a);
      const py = cy + ring * Math.sin(a);
      const pts: string[] = [];
      for (let k = 0; k < 10; k++) {
        const b = (k * Math.PI) / 5 - Math.PI / 2;
        const r = k % 2 === 0 ? sr : sr * 0.45;
        pts.push(`${(px + r * Math.cos(b)).toFixed(3)},${(py + r * Math.sin(b)).toFixed(3)}`);
      }
      stars.push(`M${pts.join("L")}Z`);
    }
    art = (
      <g>
        {stripes}
        <rect x={x} y={y} width={cw} height={ch} fill={FLAG_INK.dark} />
        <path d={stars.join("")} fill={FLAG_INK.cream} />
      </g>
    );
  } else {
    const n = 13;
    const sh = h / n;
    const stripes: React.ReactNode[] = [];
    for (let i = 0; i < n; i++) stripes.push(<rect key={i} x={x} y={y + i * sh} width={w} height={sh + 0.02} fill={i % 2 === 0 ? FLAG_INK.orange : FLAG_INK.cream} />);
    art = (
      <g>
        {stripes}
        <Union1606 x={x} y={y} w={w * 0.44} h={sh * 7} id={id} />
      </g>
    );
  }
  return (
    <g>
      <rect x={0.25} y={0.25} width={FLAG_W - 0.5} height={FLAG_H - 0.5} rx={0.9} fill={FLAG_INK.cream} stroke={FLAG_INK.edge} strokeWidth={0.5} />
      {art}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={FLAG_INK.edge} strokeWidth={0.35} strokeOpacity={0.6} />
    </g>
  );
};
