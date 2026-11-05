// heBuiltMapParts: the paper cut-outs of HeBuiltTheMap (robert-power-drug), drawn in the pictogram language of the
// sister clip (robert-graft-machine/graftShared: flat black card, white details, INK / WHITE / PAPER values).
// Every part draws in WORLD px anchored at its bottom centre (0, 0), y up = negative. A cut-out is painted twice:
// first its silhouette grown by RIM_W in the rim colour (the cut paper's light edge), then the silhouette itself,
// then its details. The drop shadow and bloom are one filter on the whole layer (HeBuiltTheMap).
import React from "react";
import { INK, PAPER, WHITE } from "../robert-graft-machine/graftShared";

// The die-cut paper border (sticker-style, ~6-10 screen px at hero size), its hand-cut wobble and the card's paper
// grain come from the filters in <PaperDefs/>; the drop shadow is the piece lying on the map: tight, down-right, one
// size throughout (it fades in with the piece, never shrinks as if dropped).
export const RIM_W = 7;
export const RIM_LIGHT = "rgb(238,237,234)"; // the white paper border of a black card
export const RIM_DARK = "rgb(206,205,202)"; // the border of a white card (a shade under the card so the cut reads)
const n = (v: number) => Math.round(v * 100) / 100;

// A silhouette function paints its shapes in one colour; grow > 0 adds a stroke of that width on every side.
type Sil = (c: string, grow: number) => React.ReactNode;
const shape = (c: string, grow: number): React.SVGProps<SVGPathElement> =>
  grow > 0
    ? { fill: c, stroke: c, strokeWidth: grow * 2, strokeLinejoin: "round" }
    : { fill: c };
const line = (
  c: string,
  w: number,
  grow: number,
): React.SVGProps<SVGPathElement> => ({
  fill: "none",
  stroke: c,
  strokeWidth: w + grow * 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const SHADOW = { id: "pShadow", dx: 7, dy: 10, o: 0.4 };
const grainRow = (c: number) => `0 0 0 0 ${c}  0 0 0 0 ${c}  0 0 0 0 ${c}`;
export const PaperDefs: React.FC = () => (
  <>
    <filter id={SHADOW.id} x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation={4} />
    </filter>
    {/* the paper border: a slight hand-cut wobble (displacement in the piece's own space, so it never boils) + grain */}
    <filter
      id="pEdge"
      x="-15%"
      y="-15%"
      width="130%"
      height="130%"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.045"
        numOctaves={2}
        seed={4}
        result="w"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="w"
        scale={7}
        xChannelSelector="R"
        yChannelSelector="G"
        result="d"
      />
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.85"
        numOctaves={2}
        seed={9}
        result="g"
      />
      <feColorMatrix
        in="g"
        type="matrix"
        values={`${grainRow(0.25)}  0 0 0 0.7 -0.33`}
        result="ga"
      />
      <feComposite in="ga" in2="d" operator="in" result="gc" />
      <feMerge>
        <feMergeNode in="d" />
        <feMergeNode in="gc" />
      </feMerge>
    </filter>
    {/* grain on a black card (light fibres) and on a white card (dark fibres) */}
    {[
      ["pGrainL", 1, "0.5 -0.24"],
      ["pGrainD", 0.2, "0.6 -0.29"],
    ].map(([id, c, a]) => (
      <filter
        key={id as string}
        id={id as string}
        x="0"
        y="0"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves={2}
          seed={id === "pGrainL" ? 13 : 17}
          result="g"
        />
        <feColorMatrix
          in="g"
          type="matrix"
          values={`${grainRow(c as number)}  0 0 0 ${a}`}
          result="ga"
        />
        <feComposite in="ga" in2="SourceGraphic" operator="in" result="gc" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="gc" />
        </feMerge>
      </filter>
    ))}
  </>
);

export const Cutout: React.FC<{
  sil: Sil;
  detail?: React.ReactNode;
  card?: "black" | "white";
}> = ({ sil, detail, card = "black" }) => {
  const sh = SHADOW;
  const body = card === "black" ? INK : PAPER;
  const rim = card === "black" ? RIM_LIGHT : RIM_DARK;
  return (
    <g>
      <g
        transform={`translate(${n(sh.dx)} ${n(sh.dy)})`}
        opacity={n(sh.o)}
        filter={`url(#${sh.id})`}
      >
        {sil("#000", RIM_W + 2)}
      </g>
      <g filter="url(#pEdge)">{sil(rim, RIM_W)}</g>
      <g filter={card === "black" ? "url(#pGrainL)" : "url(#pGrainD)"}>
        {sil(body, 0)}
        {detail}
      </g>
    </g>
  );
};

const rect = (x0: number, y0: number, x1: number, y1: number) =>
  `M${n(x0)} ${n(y0)} L${n(x1)} ${n(y0)} L${n(x1)} ${n(y1)} L${n(x0)} ${n(y1)} Z`;
// an arched opening: a rectangle from y0 (bottom) up to y1 (top of the arch), width w, round top
const arch = (cx: number, w: number, y0: number, y1: number) => {
  const r = w / 2;
  return `M${n(cx - r)} ${n(y0)} L${n(cx - r)} ${n(y1 + r)} A${n(r)} ${n(r)} 0 0 1 ${n(cx + r)} ${n(y1 + r)} L${n(cx + r)} ${n(y0)} Z`;
};

// ---------------------------------------------------------------------------------------------------------------
// Suspension bridge (Triborough: short and stout; Verrazano: long, tall towers, long sag)
// ---------------------------------------------------------------------------------------------------------------
type BridgeSpec = {
  w: number;
  tx: number;
  th: number;
  dy: number;
  dt: number;
  beams: number;
  susp: number;
};
export const TRIBOROUGH: BridgeSpec = {
  w: 280,
  tx: 62,
  th: 118,
  dy: 30,
  dt: 12,
  beams: 1,
  susp: 22,
};
export const VERRAZANO: BridgeSpec = {
  w: 380,
  tx: 118,
  th: 165,
  dy: 38,
  dt: 13,
  beams: 2,
  susp: 24,
};

export const Bridge: React.FC<{ b: BridgeSpec }> = ({ b }) => {
  const { w, tx, th, dy, dt, beams, susp } = b;
  const tw = Math.max(16, th * 0.12);
  const deckTop = -dy - dt;
  const half = w / 2;
  const cableTop = -th + 5;
  const sagY = deckTop - 7;
  // main span parabola through the tower tops and (0, sagY)
  const mainY = (x: number) => sagY + (cableTop - sagY) * (x / tx) * (x / tx);
  // side spans: tower top -> anchorage, a gentle sag
  const anchorY = deckTop - 6;
  const sideY = (x: number) => {
    const u = (Math.abs(x) - tx) / (half - 12 - tx);
    return cableTop + (anchorY - cableTop) * u + 10 * u * (1 - u);
  };
  const cablePath = () => {
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = -half + 12 + ((half - 12 - tx) * i) / 40;
      pts.push(`${n(x)} ${n(sideY(x))}`);
    }
    for (let i = 0; i <= 60; i++) {
      const x = -tx + (2 * tx * i) / 60;
      pts.push(`${n(x)} ${n(mainY(x))}`);
    }
    for (let i = 0; i <= 40; i++) {
      const x = tx + ((half - 12 - tx) * i) / 40;
      pts.push(`${n(x)} ${n(sideY(x))}`);
    }
    return "M" + pts.join(" L");
  };
  const hangers: string[] = [];
  for (let x = -tx + susp; x < tx - susp / 2; x += susp)
    hangers.push(`M${n(x)} ${n(mainY(x))} L${n(x)} ${n(deckTop)}`);
  for (const sgn of [-1, 1]) {
    for (let d = tx + susp; d < half - 26; d += susp) {
      const x = sgn * d;
      hangers.push(`M${n(x)} ${n(sideY(x))} L${n(x)} ${n(deckTop)}`);
    }
  }
  const sil: Sil = (c, g) => (
    <g>
      <path d={rect(-half, deckTop, half, -dy)} {...shape(c, g)} />
      {/* anchorages */}
      <path d={rect(-half, deckTop - 8, -half + 26, 0)} {...shape(c, g)} />
      <path d={rect(half - 26, deckTop - 8, half, 0)} {...shape(c, g)} />
      {/* towers */}
      {[-tx, tx].map((x) => (
        <path
          key={x}
          d={rect(x - tw / 2, -th, x + tw / 2, 0)}
          {...shape(c, g)}
        />
      ))}
      <path d={cablePath()} {...line(c, 6, g)} />
      <path d={hangers.join(" ")} {...line(c, 3.4, g)} />
    </g>
  );
  // white details: the tower portals (slots between the legs, split by cross beams) and the deck's lane line
  const slots: React.ReactNode[] = [];
  for (const x of [-tx, tx]) {
    const sw = tw * 0.36;
    const top = -th + 12;
    const bot = deckTop - 7;
    const seg = (bot - top) / (beams + 1);
    for (let i = 0; i <= beams; i++) {
      const y0 = top + i * seg + (i > 0 ? 4 : 0);
      const y1 = top + (i + 1) * seg - (i < beams ? 4 : 0);
      slots.push(
        <path
          key={`${x}-${i}`}
          d={rect(x - sw / 2, y0, x + sw / 2, y1)}
          fill={WHITE}
        />,
      );
    }
    slots.push(
      <path
        key={`${x}-low`}
        d={rect(x - sw / 2, -dy + 6, x + sw / 2, -8)}
        fill={WHITE}
      />,
    );
  }
  const dashes: string[] = [];
  for (let x = -half + 30; x < half - 30; x += 22)
    dashes.push(rect(x, -dy - dt / 2 - 1.6, x + 12, -dy - dt / 2 + 1.6));
  return (
    <Cutout
      sil={sil}
      detail={
        <g>
          {slots}
          <path d={dashes.join(" ")} fill={WHITE} />
        </g>
      }
    />
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Lincoln Center: the Metropolitan Opera's facade, five tall arches
// ---------------------------------------------------------------------------------------------------------------
export const MetOpera: React.FC = () => {
  const sil: Sil = (c, g) => (
    <g>
      <path d={rect(-150, -14, 150, 0)} {...shape(c, g)} />
      <path d={rect(-132, -170, 132, -14)} {...shape(c, g)} />
      <path d={rect(-140, -185, 140, -168)} {...shape(c, g)} />
    </g>
  );
  const xs = [-96, -48, 0, 48, 96];
  const detail = (
    <g>
      {xs.map((x) => (
        <path key={x} d={arch(x, 34, -30, -150)} fill={WHITE} />
      ))}
      {/* mullions of the arched windows */}
      {xs.map((x) => (
        <path
          key={`m${x}`}
          d={`M${x} -30 L${x} -140 M${x - 17} -72 L${x + 17} -72 M${x - 17} -108 L${x + 17} -108`}
          stroke={INK}
          strokeWidth={3.2}
          fill="none"
        />
      ))}
      <path d={rect(-132, -165, 132, -161)} fill={WHITE} />
      <path d={rect(-150, -8, 150, -5)} fill={WHITE} />
    </g>
  );
  return <Cutout sil={sil} detail={detail} />;
};

// ---------------------------------------------------------------------------------------------------------------
// Shea Stadium: the round bowl, seen a little from above, light towers on the rim
// ---------------------------------------------------------------------------------------------------------------
const SHEA_RX = 150;
const SHEA_TOP = -100;
const SHEA_RY = 32;
const rimY = (x: number) =>
  SHEA_TOP - SHEA_RY * Math.sqrt(Math.max(0, 1 - (x / SHEA_RX) ** 2));
export const SheaBowl: React.FC = () => {
  const posts = [-112, -42, 42, 112];
  const sil: Sil = (c, g) => (
    <g>
      <path
        d={`M${-SHEA_RX} ${SHEA_TOP} A${SHEA_RX} ${SHEA_RY} 0 0 1 ${SHEA_RX} ${SHEA_TOP} L136 -16 A136 16 0 0 1 -136 -16 Z`}
        {...shape(c, g)}
      />
      {posts.map((x) => {
        const y = rimY(x) + 4;
        return (
          <g key={x}>
            <path d={rect(x - 3, y - 30, x + 3, y)} {...shape(c, g)} />
            <path d={rect(x - 12, y - 40, x + 12, y - 29)} {...shape(c, g)} />
          </g>
        );
      })}
    </g>
  );
  const band = (cy: number, rx: number, ry: number) =>
    `M${-rx} ${cy} A${rx} ${ry} 0 0 0 ${rx} ${cy}`;
  const detail = (
    <g>
      <ellipse cx={0} cy={SHEA_TOP} rx={124} ry={22} fill={WHITE} />
      <path d="M0 -83 L24 -96 L0 -109 L-24 -96 Z" fill={INK} />
      <path
        d={band(-74, 146, 26)}
        stroke={WHITE}
        strokeWidth={4.5}
        fill="none"
      />
      <path
        d={band(-44, 140, 20)}
        stroke={WHITE}
        strokeWidth={4.5}
        fill="none"
      />
      {posts.map((x) => {
        const y = rimY(x) + 4;
        return (
          <path key={x} d={rect(x - 9, y - 37, x + 9, y - 32)} fill={WHITE} />
        );
      })}
    </g>
  );
  return <Cutout sil={sil} detail={detail} />;
};

// ---------------------------------------------------------------------------------------------------------------
// Jones Beach: the water tower (the tall brick obelisk with its belfry and pointed cap) and a beach umbrella
// ---------------------------------------------------------------------------------------------------------------
export const JonesTower: React.FC = () => {
  // a square brick shaft, barely tapered, an arcaded top the shaft's own width and a tall pointed copper cap
  const sil: Sil = (c, g) => (
    <g>
      <path d={rect(-44, -24, 44, 0)} {...shape(c, g)} />
      <path d="M-31 -24 L31 -24 L27 -300 L-27 -300 Z" {...shape(c, g)} />
      <path d={rect(-27, -338, 27, -298)} {...shape(c, g)} />
      <path d="M-27 -338 L0 -400 L27 -338 Z" {...shape(c, g)} />
      <path d={rect(-2.5, -412, 2.5, -396)} {...shape(c, g)} />
    </g>
  );
  const detail = (
    <g fill={WHITE}>
      {[-14, 0, 14].map((x) => (
        <path key={x} d={arch(x, 8, -306, -330)} />
      ))}
      <path d={rect(-27, -298, 27, -295)} />
      {[-80, -150, -220].map((y) => (
        <path key={y} d={rect(-3, y, 3, y - 26)} />
      ))}
      <path d={rect(-31, -30, 31, -27)} />
      <path d={rect(-44, -10, 44, -7)} />
    </g>
  );
  return <Cutout sil={sil} detail={detail} />;
};

export const Umbrella: React.FC = () => {
  const R = 76;
  const cy = -132; // canopy rim height
  const top = -192;
  // scalloped rim: five shallow arcs from right to left
  const sc = 5;
  let rim = "";
  for (let i = 0; i < sc; i++) {
    const x1 = R - ((i + 1) * 2 * R) / sc;
    rim += ` A${n(R / sc)} 9 0 0 1 ${n(x1)} ${cy}`;
  }
  const canopy = `M${-R} ${cy} Q${-R * 0.75} ${top} 0 ${top} Q${R * 0.75} ${top} ${R} ${cy}${rim} Z`;
  const sil: Sil = (c, g) => (
    <g>
      <path d={canopy} {...shape(c, g)} />
      <path d={`M0 ${top + 2} L0 0`} {...line(c, 6, g)} />
      <path d={rect(-3, top - 12, 3, top + 2)} {...shape(c, g)} />
    </g>
  );
  // white panels: the 2nd and 4th of five gores, from the top to the rim
  const gore = (a: number, b: number) => {
    const xa = -R + ((2 * R) / sc) * a;
    const xb = -R + ((2 * R) / sc) * b;
    return `M0 ${top + 3} L${n(xa * 0.98)} ${cy - 2} L${n(xb * 0.98)} ${cy - 2} Z`;
  };
  const clipId = "umbClip";
  const detail = (
    <g>
      <clipPath id={clipId}>
        <path d={canopy} />
      </clipPath>
      <g clipPath={`url(#${clipId})`} fill={WHITE}>
        <path d={gore(1, 2)} />
        <path d={gore(3, 4)} />
      </g>
    </g>
  );
  return <Cutout sil={sil} detail={detail} />;
};

// ---------------------------------------------------------------------------------------------------------------
// The power dams: white cards on the dark ground, black spillway bays, foaming water at the foot
// ---------------------------------------------------------------------------------------------------------------
export const Dam: React.FC<{
  w: number;
  h: number;
  gates: number;
  block: "right" | "left";
}> = ({ w, h, gates, block }) => {
  // front elevation from downstream: the wall, its crest, a row of spillway gates under the crest pouring black
  // water down the face into the foaming tailwater, and the powerhouse at one end
  const half = w / 2;
  const bx0 = block === "right" ? half - 96 : -half + 30;
  const bx1 = bx0 + 66;
  const blockH = block === "right" ? 60 : 46;
  const foot = 24;
  const sil: Sil = (c, g) => (
    <g>
      <path
        d={`M${-half} ${-foot} L${-half + 26} ${-h} L${half - 26} ${-h} L${half} ${-foot} Z`}
        {...shape(c, g)}
      />
      <path d={rect(-half + 14, -h - 14, half - 14, -h + 1)} {...shape(c, g)} />
      <path d={rect(bx0, -h - 12 - blockH, bx1, -h - 12)} {...shape(c, g)} />
      <path d={rect(-half - 18, -foot - 2, half + 18, 0)} {...shape(c, g)} />
    </g>
  );
  const span = (bx0 < 0 ? [bx1 + 24, half - 50] : [-half + 50, bx0 - 24]) as [
    number,
    number,
  ];
  const pitch = (span[1] - span[0]) / gates;
  const gw = pitch * 0.62;
  const gateTop = -h + 8;
  const gateBot = -h + 30;
  const water: string[] = [];
  const streaks: string[] = [];
  for (let i = 0; i < gates; i++) {
    const x = span[0] + pitch * (i + 0.5);
    water.push(rect(x - gw / 2, gateTop, x + gw / 2, gateBot));
    // the falling sheet widens a little toward the foot
    water.push(
      `M${n(x - gw / 2)} ${n(gateBot)} L${n(x + gw / 2)} ${n(gateBot)} L${n(x + gw / 2 + 5)} ${-foot + 1} L${n(x - gw / 2 - 5)} ${-foot + 1} Z`,
    );
    streaks.push(
      `M${n(x - gw * 0.18)} ${n(gateBot + 6)} L${n(x - gw * 0.22)} ${-foot - 8}`,
    );
    streaks.push(
      `M${n(x + gw * 0.2)} ${n(gateBot + 16)} L${n(x + gw * 0.24)} ${-foot - 4}`,
    );
  }
  const winPaths: string[] = [];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 3; j++) {
      const x = bx0 + 10 + j * 17;
      const y = -h - 12 - blockH + 12 + i * 20;
      winPaths.push(rect(x, y, x + 11, y + 12));
    }
  const wave = (y: number, ph: number) => {
    const pts: string[] = [];
    for (let x = -half - 12; x <= half + 12; x += 6)
      pts.push(`${n(x)} ${n(y + 2.4 * Math.sin(x / 8 + ph))}`);
    return "M" + pts.join(" L");
  };
  return (
    <Cutout
      card="white"
      sil={sil}
      detail={
        <g>
          <path d={water.join(" ")} fill={INK} />
          <path
            d={streaks.join(" ")}
            stroke={WHITE}
            strokeWidth={2.6}
            strokeLinecap="round"
            fill="none"
          />
          <path d={winPaths.join(" ")} fill={INK} />
          <path d={rect(-half + 14, -h - 3, half - 14, -h)} fill={INK} />
          <path d={rect(-half - 18, -foot - 2, half + 18, 0)} fill={INK} />
          <path
            d={wave(-17, 0) + " " + wave(-8, 2.2)}
            stroke={WHITE}
            strokeWidth={2.8}
            fill="none"
          />
        </g>
      }
    />
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Parks and pools: a round tree; a lap pool and a kidney pool with their ladders (seen from above)
// ---------------------------------------------------------------------------------------------------------------
export const Tree: React.FC = () => {
  // a round, lobed crown on a short flared trunk (a single disc on a stick reads as a map pin)
  const sil: Sil = (c, g) => (
    <g>
      <path d="M-8 0 L-5 -30 L5 -30 L8 0 Z" {...shape(c, g)} />
      {[
        [0, -62, 20],
        [-17, -48, 18],
        [17, -48, 18],
        [-8, -36, 15],
        [8, -36, 15],
        [0, -48, 20],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          {...(shape(c, g) as React.SVGProps<SVGCircleElement>)}
        />
      ))}
    </g>
  );
  return (
    <Cutout
      sil={sil}
      detail={
        <path
          d="M-20 -50 A16 16 0 0 1 -8 -66 M6 -40 A12 12 0 0 0 16 -48"
          stroke={WHITE}
          strokeWidth={3.6}
          fill="none"
          strokeLinecap="round"
        />
      }
    />
  );
};

// The pool, seen from above, in the map's own language: water is black on this map, so a pool is black water cut
// into a white paper deck (black decks round white water read as an envelope, a lined card or a keyboard at phone
// size). The lap pool carries white lane lines with their T-ends and the ladder's two rails hooked over its
// right-hand end; it alternates with a kidney pool.
export const Pool: React.FC = () => {
  // deck x -54..54, y -50..0; water x -44..44, y -42..-8 in three lanes
  const sil: Sil = (c, g) => (
    <rect
      x={-54}
      y={-50}
      width={108}
      height={50}
      rx={6}
      {...(shape(c, g) as React.SVGProps<SVGRectElement>)}
    />
  );
  const lane = (y: number) =>
    `M-37 ${y} L31 ${y} M-37 ${y - 4} L-37 ${y + 4} M31 ${y - 4} L31 ${y + 4}`;
  return (
    <Cutout
      card="white"
      sil={sil}
      detail={
        <g>
          <rect x={-44} y={-42} width={88} height={34} rx={3} fill={INK} />
          <path
            d={lane(-30.7) + " " + lane(-19.3)}
            stroke={WHITE}
            strokeWidth={3.2}
            fill="none"
          />
          {/* the ladder: two rails over the deck, hooked down into the water */}
          <path
            d="M53 -29 L44 -29 q-4 0 -4 4 M53 -21 L44 -21 q-4 0 -4 4"
            stroke={INK}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      }
    />
  );
};
// kidney pool: the water outline, a bean (big lobe left, small right) dented on top; the deck an 11-wide band round it
const KIDNEY =
  "M-44 -28 C-44 -49 -24 -56 -12 -46 C-4 -40 4 -40 12 -44 C26 -50 40 -44 40 -30 C40 -15 26 -8 8 -8 C-10 -8 -44 -6 -44 -28 Z";
export const KidneyPool: React.FC = () => {
  const sil: Sil = (c, g) => (
    <path
      d={KIDNEY}
      fill={c}
      stroke={c}
      strokeWidth={22 + g * 2}
      strokeLinejoin="round"
    />
  );
  return (
    <Cutout
      card="white"
      sil={sil}
      detail={
        <g>
          <path d={KIDNEY} fill={INK} />
          {/* the ladder over the big lobe's end, one ripple in the small lobe */}
          <path
            d="M-54 -33 L-46 -33 q4 0 4 4 M-54 -25 L-46 -25 q4 0 4 4"
            stroke={INK}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M10 -27 q5 -4.5 10 0 t10 0"
            stroke={WHITE}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      }
    />
  );
};
