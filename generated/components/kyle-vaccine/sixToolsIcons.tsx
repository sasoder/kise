// ---------------------------------------------------------------------------
// sixToolsIcons: the six icon signs of SixOrSevenTools (kyle-vaccine, cut 1). One family: solid shapes on a 24-unit
// grid at Lucide weight (2-unit limbs, round joins), umber ink on a soft cream plate; the syringe is the clip's one
// orange icon (THE ORANGE RULE: orange = the vaccine). Inline geometry only; no text.
//   ICONS[i](ink, plate)  the icon's <g> on the 24 grid (0..24), i = 0 water, 1 hygiene, 2 antibiotics,
//                         3 therapeutic (IV drip), 4 rehabilitation (a walking frame), 5 vaccine (syringe)
//   <SignPlate w h fill edge rim icon iconBox glow />   the plate in its own units, centred on (0, 0)
// ---------------------------------------------------------------------------
import React from "react";

type IconFn = (ink: string, plate: string, ink2: string) => React.ReactNode;

/** a clear drop */
const water: IconFn = (ink, plate) => (
  <g>
    <path d="M12 22.2a7.1 7.1 0 0 0 7.1-7.1c0-2.1-1-4-3-5.7S12.6 5.2 12 1.8c-.6 3.4-2.1 5.9-4.1 7.6S4.9 13 4.9 15.1a7.1 7.1 0 0 0 7.1 7.1z" fill={ink} />
    <path d="M8.3 15.4a3.9 3.9 0 0 0 3 3.6" fill="none" stroke={plate} strokeWidth={1.5} strokeLinecap="round" />
  </g>
);

/** an open hand with soap bubbles */
const hygiene: IconFn = (ink, plate) => (
  <g>
    {/* fingers */}
    <rect x={5.6} y={7.4} width={2.6} height={8.6} rx={1.3} fill={ink} />
    <rect x={8.6} y={4.6} width={2.6} height={10.4} rx={1.3} fill={ink} />
    <rect x={11.6} y={4} width={2.6} height={11} rx={1.3} fill={ink} />
    <rect x={14.6} y={5.6} width={2.5} height={9.6} rx={1.25} fill={ink} />
    {/* thumb */}
    <rect x={17.2} y={10.6} width={2.5} height={7.2} rx={1.25} fill={ink} transform="rotate(38 18.45 14.2)" />
    {/* palm */}
    <path d="M5.6 13h11.5v3.6c0 3.4-2.5 5.9-5.8 5.9s-5.7-2.5-5.7-5.9z" fill={ink} />
    {/* bubbles */}
    <circle cx={4.2} cy={4.4} r={2.4} fill={ink} />
    <circle cx={3.6} cy={3.7} r={0.8} fill={plate} />
    <circle cx={20.3} cy={4.3} r={1.7} fill={ink} />
    <circle cx={19.9} cy={3.8} r={0.55} fill={plate} />
    <circle cx={2.4} cy={9.6} r={1.25} fill={ink} />
  </g>
);

/** a two-part capsule and a scored tablet */
const antibiotics: IconFn = (ink, plate, ink2) => (
  <g>
    <g transform="rotate(-45 10.5 12.5)">
      <path d="M4.2 9.6h6.3v5.8H4.2a2.9 2.9 0 0 1 0-5.8z" fill={ink} />
      <path d="M10.5 9.6h6.3a2.9 2.9 0 0 1 0 5.8h-6.3z" fill={ink2} />
      <path d="M10.5 9.2v6.6" stroke={plate} strokeWidth={0.9} />
      <path d="M5 11.3h3.2" stroke={plate} strokeWidth={1} strokeLinecap="round" opacity={0.75} />
    </g>
    <circle cx={18.2} cy={18.4} r={3.6} fill={ink} />
    <path d="M15.9 20.7l4.6-4.6" stroke={plate} strokeWidth={1} strokeLinecap="round" />
  </g>
);

/** an IV drip: a bag on a hook at the end of a stand's arm, its drip chamber with one drop, the line curling down */
const therapy: IconFn = (ink, plate) => (
  <g>
    {/* the stand: pole, top arm, feet */}
    <path d="M19.6 1.6V22.4M19.6 1.8H10.2M16.6 22.6h6" fill="none" stroke={ink} strokeWidth={1.7} strokeLinecap="round" />
    {/* the hook */}
    <path d="M10.2 1.8v1.4a1 1 0 0 1-1 1" fill="none" stroke={ink} strokeWidth={1.3} strokeLinecap="round" />
    {/* the bag, its fluid line */}
    <rect x={5.4} y={4.2} width={8.6} height={9.6} rx={2.3} fill={ink} />
    <path d="M7.1 8.4c.8-.5 1.7-.5 2.6 0s1.8.5 2.6 0" fill="none" stroke={plate} strokeWidth={1} strokeLinecap="round" />
    <rect x={9.1} y={13.6} width={1.2} height={1.6} fill={ink} />
    {/* the drip chamber with one drop */}
    <rect x={8.1} y={15} width={3.2} height={4.2} rx={0.9} fill={ink} />
    <path d="M9.7 15.9c.45.6.7 1 .7 1.35a.7.7 0 0 1-1.4 0c0-.35.25-.75.7-1.35z" fill={plate} />
    {/* the line */}
    <path d="M9.7 19.2v1.4c0 1.3-.8 1.9-2.1 1.9H3.4" fill="none" stroke={ink} strokeWidth={1.3} strokeLinecap="round" />
  </g>
);

/** a figure leaning on a wheeled walking frame */
const rehab: IconFn = (ink) => (
  <g>
    <circle cx={6.6} cy={3.4} r={2.35} fill={ink} />
    <path d="M7.2 7.2l2.2 6.4" stroke={ink} strokeWidth={3.3} strokeLinecap="round" />
    <path d="M9.4 13.4l-1.6 8.6M9.4 13.4l3.1 8.2" stroke={ink} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.8 8.6l3.4 2.2 2.6-.1" fill="none" stroke={ink} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    {/* the frame: handle, two splayed legs, a crossbar, two wheels */}
    <path d="M13.2 10.6h2.6M15 10.6l-0.6 9.2M15 10.6l5 9.2M14.7 15.2h3" fill="none" stroke={ink} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={14.4} cy={21.2} r={1.55} fill={ink} />
    <circle cx={20.1} cy={21.2} r={1.55} fill={ink} />
  </g>
);

/** alternative rehab icon: a single crutch */
const crutch: IconFn = (ink, plate) => (
  <g transform="rotate(-22 12 12)">
    <rect x={7.2} y={1.2} width={9.6} height={2.6} rx={1.3} fill={ink} />
    <path d="M9 3.6L11 13.2M15 3.6L13 13.2" fill="none" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
    <rect x={9.4} y={8} width={5.2} height={1.8} rx={0.9} fill={ink} />
    <path d="M12 12.6V20.6" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
    <rect x={10.6} y={20.2} width={2.8} height={2.8} rx={1} fill={ink} />
    <circle cx={12} cy={16.4} r={0.5} fill={plate} />
  </g>
);

/** a syringe, needle down-left (the clip's orange) */
const vaccine: IconFn = (ink, plate, ink2) => (
  <g transform="rotate(-45 12 12)">
    <rect x={0.8} y={9.2} width={1.6} height={5.6} rx={0.7} fill={ink2} />
    <rect x={2.2} y={11.2} width={3.2} height={1.6} fill={ink2} />
    <rect x={5} y={7.8} width={1.6} height={8.4} rx={0.7} fill={ink2} />
    <rect x={6.4} y={9.1} width={9.4} height={5.8} rx={1} fill={ink} />
    <path d="M9 9.4v2.2M11.4 9.4v2.2M13.8 9.4v2.2" stroke={plate} strokeWidth={0.9} strokeLinecap="round" />
    <rect x={15.6} y={10.6} width={2.4} height={2.8} fill={ink2} />
    <path d="M17.8 12h5.2" stroke={ink2} strokeWidth={1.2} strokeLinecap="round" />
  </g>
);

export const ICONS: IconFn[] = [water, hygiene, antibiotics, therapy, rehab, vaccine, crutch];
/** ICONS index of the rehab alternative */
export const ICON_CRUTCH = 6;

/** the plate in its own units, centred on (0, 0); the icon fills iconBox units */
export const SignPlate: React.FC<{
  w: number;
  h: number;
  fill: string;
  fillLo: string;
  edge: string;
  rim: string;
  rimA: number;
  ink: string;
  ink2: string;
  icon: number;
  iconBox: number;
  uid: string;
  glow?: { color: string; amount: number };
}> = ({ w, h, fill, fillLo, edge, rim, rimA, ink, ink2, icon, iconBox, uid, glow }) => {
  const r = h * 0.14;
  const s = iconBox / 24;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-pg`} x1="0" y1={-h / 2} x2="0" y2={h / 2} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={fill} />
          <stop offset="1" stopColor={fillLo} />
        </linearGradient>
        {glow ? (
          <filter id={`${uid}-gf`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={1.2} />
          </filter>
        ) : null}
      </defs>
      {/* the plate's soft drop toward the lower right */}
      <rect x={-w / 2 + w * 0.02} y={-h / 2 + h * 0.04} width={w} height={h} rx={r} fill={edge} opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={`url(#${uid}-pg)`} stroke={edge} strokeWidth={h * 0.012} />
      <path d={`M${-w / 2 + r} ${-h / 2 + h * 0.012}H${w / 2 - r}M${-w / 2 + h * 0.012} ${-h / 2 + r}V${h / 2 - r}`} stroke={rim} strokeOpacity={rimA} strokeWidth={h * 0.02} strokeLinecap="round" />
      <g transform={`translate(${-iconBox / 2} ${-iconBox / 2}) scale(${s})`}>
        {glow && glow.amount > 0 ? (
          <g filter={`url(#${uid}-gf)`} opacity={glow.amount}>
            {ICONS[icon](glow.color, glow.color, glow.color)}
          </g>
        ) : null}
        {ICONS[icon](ink, fill, ink2)}
      </g>
    </g>
  );
};
