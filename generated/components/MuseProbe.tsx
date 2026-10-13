import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AgentTile,
  AmberThread,
  BAG,
  BROWSER,
  ServiceBase,
  BigBust,
  BrowserCard,
  BustSilo,
  CAPTION_Y0,
  CAPTION_Y1,
  CARD,
  CursorArrow,
  DeadlinePost,
  FPS,
  GIFT,
  GLYPH_NAMES,
  GiftBox,
  GlassColumn,
  Label,
  Ledge,
  LightSweep,
  MARK_STROKE,
  MUSE_MARK_D,
  MuseStage,
  PARCEL,
  POST,
  Parcel,
  PaymentCard,
  PERSON_VARIANTS,
  PersonTile,
  ProductTile,
  ShoppingBag,
  Slotted,
  TILE,
  WeekRail,
  amberBandM,
  beadDistances,
  dayX,
  makeThread,
  productPiece,
  tilePiece,
  type Cam,
} from "./museShared";

// ---------------------------------------------------------------------------
// MuseProbe — still frames laying out museShared's whole cast on the stage at realistic sizes (the WORLD
// builder's check; not a cut). One page per frame:
//   0 the cast (agent, people, pieces in slots)      1 every glyph, cream      2 every glyph, board
//   3 browser cards, cursor, loose pieces, threads   4 the week rail + post    5 the glass silos + the bust
//   6 the Muse mark over its reference               7 a wide wall (small tiles: the phone test)
// `strip` draws the caption strip's bounds (measurement only).
// ---------------------------------------------------------------------------
export { FPS };
export const DURATION = 8;
export const schema = z.object({ strip: z.boolean().default(false) });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const MuseProbe: React.FC<Props> = ({ strip }) => {
  const page = useCurrentFrame();
  const K = [2.5, 2.5, 2.5, 2.2, 1.35, 2.0, 2.5, 1.25][page] ?? 2.5;
  const cam: Cam = { x: 0, y: 0, k: K };
  const k = cam.k;
  const band = amberBandM(cam);
  let world: React.ReactNode = null;
  let overlay: React.ReactNode = null;
  let pool = { x: 0, y: 0 };

  if (page === 0) {
    pool = { x: -40, y: -230 };
    const small = PERSON_VARIANTS.filter((v) => v !== "plain");
    world = (
      <>
        {/* the pair of cut 1: the person with the card half out, the agent */}
        <Slotted x={-110} floor={-250} k={k} face={{ kind: "person" }} piece={CARD} out={0.5} />
        <AgentTile x={110} floor={-250} k={k} band={band} />
        {/* people: five variants (the child smaller), then two in board */}
        {small.map((v, i) => (
          <PersonTile key={v} x={-164 + i * 82} floor={-140} k={k} variant={v} size={v === "child" ? 54 : 72} />
        ))}
        {(["long", "cap", "plain", "curly", "bun"] as const).map((v, i) => (
          <PersonTile key={v} x={-164 + i * 82} floor={-50} k={k} variant={v} size={72} role="lo" />
        ))}
        {/* things in slots: agent + bag standing, agent + gift half out, agent + lamp tile, person + board parcel tile */}
        <Slotted x={-160} floor={150} k={k} face={{ kind: "agent" }} band={band} piece={BAG} out={1} />
        <Slotted x={-54} floor={150} k={k} face={{ kind: "agent" }} band={band} piece={GIFT} out={0.55} />
        <Slotted x={54} floor={150} k={k} face={{ kind: "agent" }} band={band} piece={productPiece("lamp")} out={1} />
        <Slotted x={160} floor={150} k={k} face={{ kind: "person", variant: "long" }} piece={productPiece("parcel")} pieceDim={1} out={1} />
        <Slotted x={-160} floor={350} k={k} face={{ kind: "person", variant: "cap" }} piece={PARCEL} out={0.6} />
        <Slotted x={-54} floor={350} k={k} face={{ kind: "agent" }} band={band} piece={tilePiece({ kind: "product", glyph: "gift" })} out={0.5} />
        <Slotted x={54} floor={350} k={k} face={{ kind: "person" }} lift={1} piece={productPiece("sneaker")} out={1} />
        <ProductTile x={160} floor={350} k={k} glyph="tea" lift={1} />
        <LightSweep x={110 - TILE / 2} y={-250 - TILE} w={TILE} h={TILE} k={k} t={0.5} on="amber" />
      </>
    );
  } else if (page === 1 || page === 2) {
    pool = { x: 0, y: -40 };
    world = (
      <>
        {GLYPH_NAMES.map((g, i) => (
          <ProductTile key={g} x={-156 + (i % 4) * 104} floor={-250 + Math.floor(i / 4) * 130} k={k} glyph={g} role={page === 1 ? "hi" : "lo"} />
        ))}
      </>
    );
  } else if (page === 3) {
    pool = { x: 0, y: -200 };
    const th = makeThread([
      [-200, 330],
      [-120, 250],
      [-10, 300],
      [90, 210],
      [200, 250],
    ]);
    const th2 = makeThread([
      [-200, 400],
      [-60, 380],
      [60, 420],
      [200, 380],
    ]);
    world = (
      <>
        {/* a fanned pile and a cursor */}
        <BrowserCard cx={-90} cy={-300} k={k} rot={-7} />
        <BrowserCard cx={40} cy={-270} k={k} rot={5} />
        <BrowserCard cx={-20} cy={-200} k={k} rot={-2} lift={1} />
        <BrowserCard cx={110} cy={-150} k={k} rot={9} dim={0} w={BROWSER.w * 0.8} h={BROWSER.h * 0.8} />
        <CursorArrow x={-10} y={-215} k={k} />
        <CursorArrow x={-190} y={-150} k={k} press={1} />
        {/* loose pieces: at rest, and lifted (travelling) */}
        <PaymentCard x={-170} bottom={60} k={k} />
        <ShoppingBag x={-85} bottom={60} k={k} />
        <GiftBox x={0} bottom={60} k={k} />
        <Parcel x={88} bottom={60} k={k} />
        <Parcel x={172} bottom={60} k={k} dim={1} />
        <PaymentCard x={-170} bottom={170} k={k} lift={1} />
        <ShoppingBag x={-85} bottom={170} k={k} lift={1} />
        <GiftBox x={0} bottom={170} k={k} lift={1} />
        <Parcel x={88} bottom={170} k={k} lift={1} />
        <GlassColumn x={172} baseY={170} w={56} h={90} k={k} />
        {/* threads: one drawing (its tip), one whole with beads */}
        <AmberThread thread={th} k={k} draw={0.72} band={band} />
        <AmberThread thread={th2} k={k} band={band} beads={beadDistances(th2, 40, { speed: 5, spacing: 64 })} />
        <AgentTile x={-200} floor={440} k={k} size={64} band={band} />
        <PersonTile x={200} floor={410} k={k} size={56} variant="bun" />
      </>
    );
  } else if (page === 4) {
    pool = { x: -80, y: -60 };
    const x0 = -360;
    const x1 = 360;
    const y = 30;
    const px = dayX(x0, x1, 2) + (x1 - x0) / 10;
    const parcels: [number, number, number][] = [
      [0, -30, 0],
      [0, 34, 0],
      [1, 0, 0],
      [2, -32, 0],
      [2, 34, 0],
      [3, 0, 1],
      [4, -30, 1],
      [4, 36, 1],
    ];
    world = (
      <>
        <WeekRail x0={x0} x1={x1} y={y} k={k} amber={[0, 0, 1, 0, 0]} slots={[[px, POST.headW]]} />
        {parcels.map(([d, dx, dim], i) => (
          <ProductTile key={i} x={dayX(x0, x1, d) + dx} floor={y} k={k} glyph="parcel" size={56} dim={dim} />
        ))}
        <DeadlinePost x={px} baseY={y} k={k} band={band} />
        <AgentTile x={x0 + 40} floor={y + 130} k={k} size={72} band={band} />
        {/* a half-risen post, and a shelf of cut 2 */}
        <Ledge x0={-360} x1={360} y={-330} k={k} dim={1} slots={[[200, POST.headW]]} />
        <DeadlinePost x={200} baseY={-330} k={k} band={band} rise={0.45} />
        {(["tea", "sneaker", "headphones", "book", "lamp"] as const).map((g, i) => (
          <ProductTile key={g} x={-300 + i * 96} floor={-330} k={k} glyph={g} size={80} dim={i === 1 ? 0 : 1} lift={i === 1 ? 1 : 0} />
        ))}
        <Label x={0} y={-460} k={k} text="family" tone="creamLo" />
        <Label x={-200} y={-460} k={k} text="coworkers" tone="cream" />
      </>
    );
  } else if (page === 5) {
    pool = { x: 0, y: -150 };
    const bustH = 224;
    const w = bustH / 4;
    const gap = 52;
    const glyphs = ["music", "play", "bag", "pin"] as const;
    world = (
      <>
        {glyphs.map((g, i) => (
          <BustSilo key={g} x={(i - 1.5) * (w + gap)} floor={-60} k={k} size={w} glyph={g} i={i} bustH={bustH} glass={i === 3 ? 120 : bustH + 14} />
        ))}
        {/* the four closed: one base, the whole bust, the agent under it */}
        <ServiceBase x={0} floor={330} k={k} size={w} glyphs={glyphs} />
        <BigBust cx={0} bottom={330 - w} h={bustH} k={k} />
        <AgentTile x={0} floor={330 + 110} k={k} band={band} />
      </>
    );
  } else if (page === 6) {
    // the mark over its reference: the reference icon at 700 px, the path in ink at 55 % on top
    overlay = (
      <AbsoluteFill>
        <Img src={staticFile("cheekypint2/muse/muse_app_icon_reference.png")} style={{ position: "absolute", left: 190, top: 120, width: 700, height: 700 }} />
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={`translate(190 120) scale(${700 / 1024})`}>
            <path d={MUSE_MARK_D} fill="none" stroke="#2E1E14" strokeOpacity={0.6} strokeWidth={MARK_STROKE} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </AbsoluteFill>
    );
    pool = { x: 0, y: 200 };
    world = (
      <>
        <AgentTile x={-90} floor={300} k={k} size={144} band={band} />
        <AgentTile x={60} floor={300} k={k} band={band} />
        <AgentTile x={150} floor={300} k={k} size={48} band={band} />
      </>
    );
  } else {
    // a wide wall: tiles 96 world at k 1.25 = 120 px (30 px on a 270 px phone), shelves, three picks, the agent
    pool = { x: 0, y: 0 };
    const rows = [-420, -280, -140, 0, 140, 280, 420];
    world = (
      <>
        {rows.map((fy, r) => (
          <React.Fragment key={r}>
            <Ledge x0={-460} x1={460} y={fy} k={k} dim={1} />
            {Array.from({ length: 8 }, (_, c) => {
              const g = GLYPH_NAMES[(r * 5 + c * 3) % 14];
              const pick = (r === 2 && c === 2) || (r === 3 && c === 5) || (r === 2 && c === 6);
              if (r === 3 && c === 3) return <AgentTile key={c} x={-385 + c * 110} floor={fy} k={k} band={band} />;
              return <ProductTile key={c} x={-385 + c * 110} floor={fy} k={k} glyph={g} dim={pick ? 0 : 1} lift={pick ? 1 : 0} />;
            })}
          </React.Fragment>
        ))}
      </>
    );
  }

  return (
    <AbsoluteFill>
      <MuseStage S={0} cam={cam} pool={pool} sway={false} overlay={overlay}>
        {world}
      </MuseStage>
      {strip ? (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 0, right: 0, top: CAPTION_Y0, height: CAPTION_Y1 - CAPTION_Y0, border: "2px dashed rgba(243,235,221,0.5)" }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export default MuseProbe;
