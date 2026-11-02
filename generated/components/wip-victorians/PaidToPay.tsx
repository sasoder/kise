// ---------------------------------------------------------------------------
// PaidToPay (wip-victorians, cut 44). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 178 frames.
//
// CHECK LINE: "An MP earned nothing, paid a fortune, and got to stand in a high place." With no sound: a top-hatted MP's own
// banknotes pile up under him until he stands beside the Clock Tower wearing a gold portcullis.
//
// THE LINE: "MPs weren't even paid and they were willing to shell out hundreds of thousands of pounds of their own money
// just because it was a prestigious position."
// WORD -> FRAME: MPs 0 · weren't 7 · even 12 · paid 15 · and 25 · they 35 · were 38 · willing 41 · to 47 · shell 51 · out 56 ·
// hundreds 62 · of 71 · thousands 77 · of 85 · pounds 89 · of 96 · their 102 · own 105 · money 112 · just 120 · because 128 ·
// it 133 · was 140 · a 142 · prestigious 145 · position 152
// DURATION: the slot 44.583 -> 52.000 s = 7.417 s x 24 = 178 frames (f0..f177).
//
// THE MOTION: one rising camera. A real MP stands on the paper; a red "£0" postmark presses beside him on "paid". From "shell
// out" white notes deal from behind his coat onto one growing pile that lifts him, the camera climbing with him, so the postmark
// sinks under the money. The Palace, tower first, rises from behind the pile and settles as he stops. On "prestigious" a gold crowned
// portcullis on a short red ribbon is pinned to his lapel, the badge level with the clock face; a glint crosses it once; a slow creep holds to the cut.
// Contact frames: postmark 15. Notes: first leaves the coat 51, first lands 60, last lands by 118 (derived from the lift curve; he
// starts lifting at 64, once the base row is down; the pile stops at 120). Tower 92-143. Portcullis touches 146, flat 150.
// SPOT INK: red = the empire's mark on the MP: the postmark, then the ribbon. Gold = the honour, the one real colour.
// NOT A FIGURE: "£0" is the speaker's "weren't even paid" (MPs had no salary until 1911). Nothing else on screen is a claim.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt): MP: Sir Benjamin Stone, MP at the Palace of Westminster gate, from his 1906
// Pictures (Commons, no restrictions), westminster_mp/MP_StoneFullLength_topHat2.jpg. Note: Bank of England £10 white note, 1888
// (Commons, public domain), objects/WhiteNote_BoE_1888_10pound_small.jpg. Palace: LOC photochrom LCCN 92518894 (Commons, public
// domain), greyscaled, mirrored so the tower stands at the right, its dial flipped back. Portcullis: objects/Crowned_Portcullis.svg
// (Commons, public domain), its crown and chains as drawn, the grille redrawn with bigger holes. Bake: scripts/clips/wip-victorians/bake-paid.py.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, CutOut, PaperGround, Postmark, RED, WipCam, WipFilmLife, WipPlane, inkPress, slide } from "../kits/works-in-progress/wipShared";
import { CHAINS_INNER, CROWN_INNER } from "./portcullisSvg";

export const FPS = 24;
export const DURATION = 178;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// -- the lift: how far the pile has raised his feet, and the camera that climbs with him ------------------------------------
const RISE = 900;
const LIFT_START = 64; // the base row has landed
const LIFT_END = 120; // "just"
const liftAt = (f: number) => interpolate(f, [LIFT_START, LIFT_END], [0, RISE], { ...clamp, easing: Easing.bezier(0.36, 0, 0.66, 1) });

const camAt = (f: number): WipCam => ({
  x: interpolate(f, [-10, LIFT_START + 10], [472, 540], { ...clamp, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
  y: 960 - interpolate(f, [0, LIFT_START], [0, 12], clamp) - liftAt(f) * 0.976,
  k: 1 + (0.02 * f) / (DURATION - 1),
  x0: 540,
  y0: 960,
});
const CAM_END_Y = camAt(DURATION - 1).y;

// -- the MP ----------------------------------------------------------------------------------------------------------------
const MP_ASPECT = 0.3278;
const MP_H = 780;
const MP_W = MP_H * MP_ASPECT;
const MP_X = 385;
const GROUND = 1032; // his soles on the page at f0
const feetY = (f: number) => GROUND - liftAt(f);

// -- the pile: three columns, one size, later notes on top. Each lands when the lift curve reaches its height -----------------
const NOTE_W = 340;
const NOTE_PAD = (28 * NOTE_W) / 495;
const NOTE_H = NOTE_W / 1.5325;
const NOTE_DH = 44;
const COLUMNS = [310, 565, 808]; // wider than the 700 px hint: the right column has to hide the tower's foot
const ORDER = [2, 0, 1]; // the last note lands under his feet
const FLIGHT = 9;
const contactFor = (h: number) => {
  // the frame the lift reaches h, a beat before the note that carries it is needed; a table lookup, so it stays exact
  for (let f = LIFT_START; f <= LIFT_END; f += 0.25) {
    if (liftAt(f) >= h) return f;
  }
  return LIFT_END;
};
const NOTES = Array.from({ length: Math.ceil(RISE / NOTE_DH) + 3 }, (_, i) => {
  const h = (i - 3) * NOTE_DH; // the first three make the base
  const base = i < 3 ? 60 + i * 3 : contactFor(h); // the first leaves the coat on "shell" (f51)
  return {
    i,
    contact: Math.min(118, base),
    x: COLUMNS[ORDER[i % 3]] + (random(`n-x-${i}`) - 0.5) * 24,
    y: GROUND + 12 - h + (random(`n-y-${i}`) - 0.5) * 22,
    r: (random(`n-r-${i}`) - 0.5) * 7,
  };
});

// -- the Palace: rises from behind the pile; the clip's foot is always under notes ------------------------------------------
const PALACE_ASPECT = 0.5587;
const PALACE_S = 0.587; // screen px per print px
const PALACE_W = 1000 * PALACE_S;
const PALACE_LEFT = 423;
const PALACE_TOP_END = 51; // settled, in the end frame's px
const PALACE_DROP = 1020;
const PALACE_IN = 92;
const PALACE_DUR = 51;
const CLIP_FOOT = 1112;

// -- the portcullis, on his chest level with the clock face --------------------------------------------------------------
// Gold as in DifferentTastes' chain: a dark keyline, the gold body, a light rim and light lines along the bars.
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F7E29A";
const GOLD_EDGE = "#2B1D05";
const GLINT_WARM = "#FFF8E2";
const RED_DEEP = "#8E0A28";
const PORT_W = 96;
const PORT_H = (PORT_W * 550) / 460;
const PORT_DX = 50; // from his centre line
const PORT_UP = 492; // the badge's centre above his soles: level with the clock face; the ribbon's top is on his lapel
const PORT_TOUCH = 146;
const PORT_FLAT = 150;
const GLINT_START = 156;
const GLINT_END = 170;

// The grille, redrawn from the mark on the same 460 x 550 grid: five uprights with pointed feet and three cross bars, open below
// the last one as on the real mark. Holes are larger and the rivets are gone, so it stays a grille at phone width.
const BAR_W = 26;
const BAR_X = [0, 1, 2, 3, 4].map((i) => 73 + i * 72.5);
const CROSS_Y = [166, 240, 314, 388];
const CROSS_H = 24;
const Grille: React.FC = () => (
  <g fill="currentColor">
    {BAR_X.map((x) => (
      <path key={x} d={`M${x} 166 H${x + BAR_W} V502 L${x + BAR_W / 2} 532 L${x} 502 Z`} />
    ))}
    {CROSS_Y.map((y) => (
      <rect key={y} x={73} y={y} width={316} height={CROSS_H} />
    ))}
  </g>
);
const Mark: React.FC<{ color: string }> = ({ color }) => (
  <g fill="currentColor" style={{ color }}>
    <g dangerouslySetInnerHTML={{ __html: CROWN_INNER }} />
    <g dangerouslySetInnerHTML={{ __html: CHAINS_INNER }} />
    <Grille />
  </g>
);

const Portcullis: React.FC<{ frame: number; x: number; y: number }> = ({ frame, x, y }) => {
  if (frame < PORT_TOUCH - 4) return null;
  const scale = interpolate(frame, [PORT_TOUCH - 4, PORT_TOUCH, PORT_FLAT], [1.09, 1.018, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.4, 1) });
  const opacity = interpolate(frame, [PORT_TOUCH - 4, PORT_TOUCH - 2], [0, 1], clamp);
  const t = (frame - GLINT_START) / (GLINT_END - GLINT_START);
  const glintOn = t > 0 && t < 1;
  const bandX = -160 + t * 780;
  const star = glintOn ? Math.max(0, Math.cos((t - 0.5) * Math.PI * 2.4)) ** 2 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x - PORT_W / 2,
        top: y - PORT_H / 2,
        width: PORT_W,
        height: PORT_H,
        opacity,
        transform: `scale(${scale})`,
        filter: `drop-shadow(0 ${1.5 + 6 * (scale - 1) * 10}px ${1.5 + 12 * (scale - 1) * 10}px rgba(4,10,8,0.65))`,
      }}
    >
      <svg viewBox="0 0 460 550" width={PORT_W} height={PORT_H} style={{ position: "absolute", overflow: "visible" }}>
        <defs>
          <mask id="ptp-port-mask" maskUnits="userSpaceOnUse" x="-20" y="-20" width="500" height="590">
            <Mark color="#fff" />
          </mask>
          <filter id="ptp-port-key" filterUnits="userSpaceOnUse" x="-30" y="-30" width="520" height="610" colorInterpolationFilters="sRGB">
            <feMorphology operator="dilate" radius={6} />
          </filter>
        </defs>
        {/* the ribbon, from the pin bar on his lapel down through the ring at the crown's cross */}
        <rect x={172} y={-186} width={118} height={196} fill={GOLD_EDGE} />
        <rect x={180} y={-180} width={102} height={190} fill={RED} />
        <rect x={222} y={-180} width={18} height={190} fill={RED_DEEP} />
        <rect x={156} y={-200} width={150} height={38} rx={6} fill={GOLD_EDGE} />
        <rect x={163} y={-193} width={136} height={24} rx={3} fill={GOLD} />
        <rect x={170} y={-189} width={122} height={6} fill={GOLD_LIGHT} />
        {/* the badge */}
        <g filter="url(#ptp-port-key)">
          <Mark color={GOLD_EDGE} />
        </g>
        <g mask="url(#ptp-port-mask)">
          <rect x={-20} y={-20} width={500} height={590} fill={GOLD_LIGHT} />
          <g transform="translate(5 6)">
            <Mark color={GOLD} />
          </g>
          {BAR_X.map((bx) => (
            <rect key={bx} x={bx + 5} y={166} width={5} height={336} fill={GOLD_LIGHT} />
          ))}
          {glintOn ? <rect x={bandX} y={-60} width={70} height={700} fill={GLINT_WARM} transform={`rotate(18 ${bandX + 35} 275)`} /> : null}
        </g>
        {star > 0.01 ? (
          <g transform={`translate(330 170) rotate(${(t - 0.5) * 40}) scale(${0.3 + 0.7 * star})`}>
            <path d="M0 -92 L7 -7 L92 0 L7 7 L0 92 L-7 7 L-92 0 L-7 -7 Z" fill={GLINT_WARM} />
          </g>
        ) : null}
      </svg>
    </div>
  );
};

const PaidToPay: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const feet = feetY(frame);
  const u = slide(frame, PALACE_IN, PALACE_DUR);
  const palaceTop = PALACE_TOP_END + CAM_END_Y - 960 + (1 - u) * (PALACE_DROP / cam.k) + (cam.y - CAM_END_Y);
  const notes = NOTES.filter((n) => frame >= n.contact - FLIGHT);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        {/* the Palace: only ever seen above the pile's top */}
        {frame >= PALACE_IN ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: CLIP_FOOT, overflow: "hidden" }}>
            <WipPlane cam={cam}>
              <CutOut
                src="wip-victorians/ptp_palace.png"
                x={PALACE_LEFT + PALACE_W / 2}
                y={palaceTop + PALACE_W / PALACE_ASPECT / 2}
                w={PALACE_W}
                aspect={PALACE_ASPECT}
                border={6}
                grain={0.1}
                seed="palace"
              />
            </WipPlane>
          </div>
        ) : null}
        {/* the red mark: multiplies into the page, then the notes bury it */}
        <WipPlane cam={cam} ink>
          <Postmark x={745} y={640} size={350} ink={RED} seed="ptp-salary" rotate={-9} top="MEMBER'S SALARY" bottom="HOUSE OF COMMONS" date="£0" press={inkPress(frame, 15)} wear={0.22} />
        </WipPlane>
        {/* the pile, later notes on top */}
        <WipPlane cam={cam}>
          {notes.map((n) => {
            const p = slide(frame, n.contact - FLIGHT, FLIGHT);
            const sx = MP_X + (n.i % 2 ? 6 : -6);
            const sy = feet - 450;
            const x = sx + (n.x - sx) * p;
            const y = sy + (n.y - sy) * p;
            const r = (n.x < MP_X ? -90 : 90) * (1 - p) + n.r * p;
            return (
              <Img
                key={n.i}
                src={staticFile("wip-victorians/ptp_note.png")}
                style={{
                  position: "absolute",
                  left: x - NOTE_W / 2 - NOTE_PAD,
                  top: y - NOTE_H / 2 - NOTE_PAD,
                  width: NOTE_W + 2 * NOTE_PAD,
                  height: NOTE_H + 2 * NOTE_PAD,
                  maxWidth: "none",
                  transform: `rotate(${r}deg)`,
                }}
              />
            );
          })}
        </WipPlane>
        {/* the man, nearest */}
        <WipPlane cam={cam}>
          <CutOut src="wip-victorians/ptp_mp.png" x={MP_X} y={feet - MP_H / 2} w={MP_W} aspect={MP_ASPECT} border={6} gamma={1.05} grain={0.1} seed="mp" />
          <Portcullis frame={frame} x={MP_X + PORT_DX} y={feet - PORT_UP} />
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default PaidToPay;
