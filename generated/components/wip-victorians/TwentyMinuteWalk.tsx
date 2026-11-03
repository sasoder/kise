// ---------------------------------------------------------------------------
// TwentyMinuteWalk (wip-victorians, cut 32, rev 2). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 186 frames.
//
// CHECK LINE: "The men who ran the empire went to one school and lived a walk apart." With no sound: five statesmen gather in
// front of Eton College, then step down onto a Victorian map of London, landing at their own houses inside a small red ring.
//
// THE LINE: "there was a high level of social integration. All of these elites went to the same schools and lived within a 20
// minute walking distance of one another in Mayfair and Belgravia"
// WORD -> FRAME: there 1 · was 4 · a 6 · high 9 · level 16 · of 24 · social 28 · integration 34 · All 52 · of 55 · these 59 ·
// elites 62 · went 69 · to 73 · the 76 · same 77 · schools 83 · and 92 · lived 98 · within 102 · a 106 · 20 110 · minute 116 ·
// walking 122 · distance 128 · of 138 · one 143 · another 145 · in 151 · Mayfair 156 · and 164 · Belgravia 168 · which 182
// DURATION: the slot 32.750 -> 40.500 s = 7.75 s x 24 = 186 frames (f0..f185).
//
// THE MOTION: one page, one camera, no holds. Five b&w cut-out prints of the men stand spread over the paper (three below, two
// above) and drift into one close group, like a group photograph, as the camera pushes in (settled f49). On "All of
// these elites went to the same schools" the real Eton College rises behind them out of the group's own foot line (f46-86), so they
// stand in front of their school. On "and lived" (f88-155) the camera pulls back down the page about a point above the frame: Eton stays put and
// leaves the top, and the men step off one by one on an even rhythm onto the 1877 map lying below on the same sheet, each landing
// with his base on his own house. The red ring draws round from its moving tip, the two district names print in on their words,
// and the settled frame creeps to the cut.
// Contact frames: Derby lifts f96 and touches f122, Salisbury f100 -> f126, Gladstone f104 -> f130, Balfour f108 -> f134,
// Rosebery f112 -> f138 (26-frame flights, one every 4 frames; the front row leaves first, then the two behind; on the map later prints lie on top, so
// they land north to south where they overlap). Eton rises f46-86. Ring tip f110 -> f138. Mayfair rises f151-163 (word f156), Belgravia f163-175 (word f168).
// SPOT INK: red = the empire's own (the ring). Indigo = the printed labels. No postmarks, no stamps.
//
// THE SUM: the ring's diameter = 20 minutes at a brisk 3.3 mph walk = 1.1 statute miles. The sheet is 6 in to the mile; on the crop its
// own printed scale bar reads 0 ft at x 2884 and 5000 ft at x 6206, so 664.4 crop px per 1000 ft, 3508 crop px per mile, 3859 crop px
// for the ring. Its centre is the smallest circle round the five addresses and Belgrave Square's whole garden (r 1902 crop px), so it
// holds all of them with 27 crop px to spare. Longest pair: Gladstone's house to the garden's west corner, 3804 crop px, 1.08 miles, 19.7 minutes.
// THE MEN ON THE MAP: each print's base stands on its owner's true address point (Gladstone's and Balfour's, 234 crop px apart, sit a
// little either side of theirs so both faces show). Rosebery's, Derby's and Gladstone's houses lie 27-46 crop px inside the ring's
// north and north-east edge, so a print standing up from them reaches over the line: those three cross it, unavoidably.
// Every print stands wholly on the map: the window runs 140 crop px north of the crop's top (from the full sheet) so Rosebery's head
// has about 40 px of map above it when settled, and its east edge leaves about 45 px beyond Gladstone's print.
//
// SOURCES: animation_source/assets_raw/SOURCES.txt. Map: Stanford's Library Map of London, sheet 10, 1877 edition (NOT 1862: same
// plates, revised), David Rumsey via Internet Archive; bake scripts/clips/wip-victorians/bake-walk.py. Eton College: Lupton's Tower over
// School Yard, the left half of the stereograph "70 - Eton College" (London and Neighbourhood, Stereoscopic Gems), Met DP73247 via
// Commons, CC0; bake scripts/clips/wip-victorians/bake-walk-eton.py. Portraits, public domain, Commons, bake
// scripts/clips/wip-victorians/bake-walk-men.py (Vision person matte, bake-photo.py, one head size): Gladstone 1892 (S. A. Walker),
// Salisbury (Elliott & Fry), Balfour (Bain, LOC), Rosebery ("The Earl of Rosebery", 1890s, the decade he held No. 38), Derby
// (W. & D. Downey). Eton: all five on the Windsor Local History Group's list. Addresses, Survey of London + Historic England
// (SOURCES.txt FACTS): Gladstone 11 Carlton House Terrace 1856-75; Salisbury 20 Arlington Street; Balfour 4 Carlton Gardens 1874-97,
// 1908-29; Rosebery 38 Berkeley Square; Derby 23 (now 33) St James's Square 1854-69, printed on this very sheet as "Ld Derby London Ho."
// The five did not all live there at once. Points on the sheet read by eye from the street names; no addresses on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBandsDebug,
  CutOut,
  INDIGO,
  InkPrint,
  PaperGround,
  RED,
  SERIF,
  SERIF_WEIGHT,
  THEMES,
  WipCamKey,
  WipFilmLife,
  WipPlane,
  inkOn,
  runWipCamera,
  slide,
  textRise,
} from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 186;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// -- the map, in the Stanford crop's own px (O), mapped to world px; the ring's centre at (BX, BY) ---------------------------
const BX = 540;
const BY = 800;
const RING_O = 1.1 * 3508; // 20 minutes at 3.3 mph, in crop px
const WORLD_PER_O = 810 / RING_O / (150 / 190); // world px per crop px (the group's whole layout is built on it)
const RING_OX = 4203;
const RING_OY = 2533;
const wx = (ox: number) => BX + (ox - RING_OX) * WORLD_PER_O;
const wy = (oy: number) => BY + (oy - RING_OY) * WORLD_PER_O;
// bake-walk.py BOX. It reaches 140 crop px north of the crop's top (cut from the full sheet), so Rosebery's print stands well inside the
// map's top edge, and 124 px east of the ring's west-east middle, so Gladstone's stands well inside its right edge.
const MAP_OX0 = 2080;
const MAP_OY0 = -140;
const MAP_OX1 = 6470;
const MAP_OY1 = 4577;
const MAP_X = wx(MAP_OX0);
const MAP_Y = wy(MAP_OY0);
const MAP_W = (MAP_OX1 - MAP_OX0) * WORLD_PER_O;
const MAP_H = (MAP_OY1 - MAP_OY0) * WORLD_PER_O;
const RING_R = (RING_O / 2) * WORLD_PER_O;
// Settled: the map at x 90..990, y 93..1060 (the ring 791 px across).
const SCREEN_PER_O = 900 / (MAP_OX1 - MAP_OX0);
const KF = SCREEN_PER_O / WORLD_PER_O; // the settled zoom
const MAP_TOP = 1060 - (MAP_OY1 - MAP_OY0) * SCREEN_PER_O;
const END_CX = BX - (90 + (RING_OX - MAP_OX0) * SCREEN_PER_O - 540) / KF;
const END_CY = BY - (MAP_TOP + (RING_OY - MAP_OY0) * SCREEN_PER_O - 960) / KF;

// -- the group, above the map on the same sheet. Laid out in the screen px of the group's frame (zoom KG, centre GX, GY) -------
const KG = 2.5;
const GX = 890; // right of the ring's centre: the zoom's fixed point then keeps the north-east houses in frame as the men land
const GY = MAP_Y - 15 - 960 / KG; // the map's top edge lies just under that frame
const gw = (sx: number) => GX + (sx - 540) / KG;
const gh = (sy: number) => GY + (sy - 960) / KG;
const BASE = gh(1075); // the front row's foot line, clear of the caption band

// The prints: bake-walk-men.py, every one 692 x 900 px with the crown at 28.2 and the eyes at 263.2, so one head = 470 px.
const PRINT_PX_W = 692;
const PRINT_PX_H = 900;
const HEAD_PX = 2 * (263.2 - 28.2);
const PS = 220 / KG / HEAD_PX; // world px per print px: a head is 220 px in the group's frame
const PW = PRINT_PX_W * PS;
const PH = PRINT_PX_H * PS;
const BORDER = 3.5;
const FRONT_Y = BASE - PH / 2;
const BACK_Y = FRONT_Y - 165 / KG; // the back row stands a head-and-a-bit higher; its print foot stays behind the front row

// -- the camera: a push in on the gathering, a creep while Eton rises, then one pull-back about a point above the frame ------------
const K0 = 2.1;
const GY0 = GY - 75; // the opening frame's bottom stays above the map too
const KA = 2.6; // the creep: a slow push through "All of these elites" while Eton comes up
const CA = { x: GX, y: GY + 2 }; // keeps the foot line above the caption band at the creep's closest
const KB = KF * 1.012;
const PULL_FROM = 84;
const PULL_TO = 150;
// The fixed point P of a pure zoom from (CA, KA) to (END, KB): everything shrinks towards it, so Eton leaves by the top as the map
// comes up from below, and nothing slides sideways on the way.
const PX = (KA * CA.x - KB * END_CX) / (KA - KB);
const PY = (KA * CA.y - KB * END_CY) / (KA - KB);
const pullKeys: WipCamKey[] = [];
for (let f = PULL_FROM + 6; f <= PULL_TO; f += 6) {
  const u = Math.min(1, (f - PULL_FROM) / (PULL_TO - PULL_FROM));
  const s = u * u * (3 - 2 * u);
  const k = KA * (KB / KA) ** s;
  pullKeys.push({ f, x: PX + ((CA.x - PX) * KA) / k, y: PY + ((CA.y - PY) * KA) / k, k, ease: "linear" });
}
const camAt = runWipCamera(
  [
    { f: -30, x: GX, y: GY0, k: K0 },
    { f: 40, x: GX, y: GY, k: KG },
    { f: PULL_FROM, x: CA.x, y: CA.y, k: KA, ease: "linear" },
    ...pullKeys,
    { f: DURATION, x: END_CX, y: END_CY, k: KF, ease: "linear" },
  ],
  DURATION,
);
// The sheet's rest point at the middle of the camera's travel, so its slack covers both ends.
const SHEET_X0 = (GX + END_CX) / 2;
const SHEET_Y0 = (GY0 + END_CY) / 2;

// -- the five men ---------------------------------------------------------------------------------------------------------------
// f0: spread, in the opening frame's screen px (print centres). Group: three in front, two behind, in the group frame's screen px.
// `addr` the true address (crop px), `dx` how far the print's centre sits from it (world px), `lift` the frame he leaves the group.
const C0 = camAt(0);
const fromOpening = (sx: number, sy: number) => [C0.x + (sx - 540) / C0.k, C0.y + (sy - 960) / C0.k] as const;
type Man = { name: string; aspect: number; s0: [number, number]; r0: number; gx: number; back: boolean; addr: [number, number]; dx: number; rEnd: number; lift: number; lag: number };
const FLIGHT = 26;
const MEN: Man[] = [
  // paint order before the deal: the back row first, then the front row with the first to leave on top
  { name: "rosebery", aspect: 692 / 900, s0: [375, 500], r0: -1.8, gx: 415, back: true, addr: [3700, 700], dx: 0, rEnd: -1.2, lift: 112, lag: 1 },
  { name: "balfour", aspect: 692 / 900, s0: [705, 492], r0: 2.0, gx: 665, back: true, addr: [5700, 1790], dx: -24, rEnd: -1.0, lift: 108, lag: 3 },
  { name: "gladstone", aspect: 691 / 900, s0: [225, 878], r0: -2.4, gx: 290, back: false, addr: [5925, 1725], dx: 20, rEnd: 1.3, lift: 104, lag: 0 },
  { name: "salisbury", aspect: 692 / 900, s0: [540, 884], r0: 1.4, gx: 540, back: false, addr: [4570, 1530], dx: 0, rEnd: -0.8, lift: 100, lag: 2 },
  { name: "derby", aspect: 692 / 900, s0: [855, 878], r0: 2.2, gx: 790, back: false, addr: [5637, 1312], dx: 0, rEnd: 1.0, lift: 96, lag: 1 },
];
const GATHER_START = -4;
const GATHER_DUR = 52; // settled by f49, the last of "integration"

const manPose = (m: Man, frame: number) => {
  const [x0, y0] = fromOpening(m.s0[0], m.s0[1]);
  const gx = gw(m.gx);
  const gy = m.back ? BACK_Y : FRONT_Y;
  const g = slide(frame, GATHER_START + m.lag, GATHER_DUR);
  const t = slide(frame, m.lift, FLIGHT);
  const lx = wx(m.addr[0]) + m.dx;
  const ly = wy(m.addr[1]) - PH / 2;
  const bx = x0 + (gx - x0) * g;
  const by = y0 + (gy - y0) * g;
  return {
    x: bx + (lx - bx) * t,
    y: by + (ly - by) * t,
    rotate: m.r0 * (1 - g) + m.rEnd * t,
    lift: 0.75 * Math.sin(Math.PI * t),
  };
};
// Before the deal: the given order. Once lifted, by lift frame: a print in flight passes over the rest, a later one lands on top.
const paintOrder = (frame: number) => MEN.map((m, i) => ({ m, z: frame >= m.lift ? 100 + m.lift : i })).sort((a, b) => a.z - b.z).map((o) => o.m);

// -- Eton: rises out of the group's foot line behind them; nothing of it shows below that line ---------------------------------------
const ETON_ASPECT = 1150 / 1090;
const ETON_W = 840 / KG; // no wider than the front row's three prints, so it only ever comes out from behind a man
const ETON_H = ETON_W / ETON_ASPECT;
const ETON_START = 46;
const ETON_DUR = 40;
// it starts with its finials behind the back row's prints and its wings below the foot line
const ETON_DROP = gh(760) - (BASE - ETON_H);

// -- the ring: an arc from its moving tip, clockwise from the top. Not a dash: the path itself grows ---------------------------
const RING_START = 110;
const RING_END = 138;
const RING_W = 13;
const ringArc = (frame: number) => {
  const t = interpolate(frame, [RING_START, RING_END], [0, 1], clamp);
  if (t <= 0) return "";
  const c = RING_R + 30;
  const a1 = -Math.PI / 2 + Math.min(t, 0.9999) * Math.PI * 2;
  const x1 = c + Math.cos(a1) * RING_R;
  const y1 = c + Math.sin(a1) * RING_R;
  return `M${c} ${c - RING_R}A${RING_R} ${RING_R} 0 ${t > 0.5 ? 1 : 0} 1 ${x1} ${y1}${t >= 1 ? "Z" : ""}`;
};

// -- the two names, true places, in world px ------------------------------------------------------------------------------
const LABEL_SIZE = 58 / KF;
const LABELS = [
  { text: "Mayfair", x: wx(3400), y: wy(1770), start: 151 },
  { text: "Belgravia", x: wx(3135), y: wy(3330), start: 163 },
];
const PAPER = THEMES.mint.paper;
const HALO = [8, 16, 26].map((b) => `0 0 ${b / KF}px ${PAPER}`).join(", ");
/** One name: `halo` is the paper-coloured knock-back on the normal plane under it, otherwise the solid indigo on the ink plane. */
const Label: React.FC<{ l: (typeof LABELS)[number]; frame: number; halo?: boolean }> = ({ l, frame, halo = false }) =>
  frame >= l.start ? (
    <div
      style={{
        position: "absolute",
        left: l.x - 500,
        top: l.y - LABEL_SIZE * 0.6,
        width: 1000,
        textAlign: "center",
        fontFamily: SERIF,
        fontWeight: SERIF_WEIGHT,
        fontSize: LABEL_SIZE,
        lineHeight: 1.2,
        color: halo ? "transparent" : inkOn(INDIGO),
        textShadow: halo ? `${HALO}, ${HALO}` : undefined,
        ...textRise(frame, l.start, 12, 22),
      }}
    >
      {l.text}
    </div>
  ) : null;

const TwentyMinuteWalk: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = { ...camAt(frame), x0: SHEET_X0, y0: SHEET_Y0 };
  const box = 2 * (RING_R + 30);
  const arc = ringArc(frame);
  const etonRise = slide(frame, ETON_START, ETON_DUR);
  const etonCy = BASE - ETON_H / 2 + (1 - etonRise) * ETON_DROP;
  // the clip window: everything above the foot line, wide enough for Eton's border and shadow
  const clipL = GX - ETON_W;
  const clipT = BASE - 3 * ETON_H;
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} d={1.7} />
        <WipPlane cam={cam} ink>
          <div style={{ position: "absolute", left: MAP_X, top: MAP_Y, width: MAP_W, height: MAP_H }}>
            <Img src={staticFile("wip-victorians/tw_map.jpg")} style={{ position: "absolute", inset: 0, width: MAP_W, height: MAP_H, maxWidth: "none" }} />
            <div style={{ position: "absolute", inset: 0, border: "5px solid #3B4A46", boxSizing: "border-box" }} />
          </div>
          {arc ? (
            <InkPrint x={BX - box / 2} y={BY - box / 2} w={box} h={box} ink={RED} seed="ring" rough={1.3} wear={0.22} misregister={1.2}>
              <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                <path d={arc} fill="none" stroke="currentColor" strokeWidth={RING_W} strokeLinecap="round" />
              </svg>
            </InkPrint>
          ) : null}
        </WipPlane>
        <WipPlane cam={cam}>
          {LABELS.map((l) => (
            <Label key={l.text} l={l} frame={frame} halo />
          ))}
        </WipPlane>
        <WipPlane cam={cam} ink>
          {LABELS.map((l) => (
            <Label key={l.text} l={l} frame={frame} />
          ))}
        </WipPlane>
        <WipPlane cam={cam}>
          {frame >= ETON_START ? (
            <div style={{ position: "absolute", left: clipL, top: clipT, width: 2 * ETON_W, height: BASE - clipT, overflow: "hidden" }}>
              <CutOut src="wip-victorians/tw_eton.png" x={GX - clipL} y={etonCy - clipT} w={ETON_W} aspect={ETON_ASPECT} border={BORDER} grain={0.06} seed="eton" />
            </div>
          ) : null}
        </WipPlane>
        <WipPlane cam={cam}>
          {paintOrder(frame).map((m) => {
            const p = manPose(m, frame);
            return <CutOut key={m.name} src={`wip-victorians/tw_${m.name}.png`} x={p.x} y={p.y} w={PW} aspect={m.aspect} rotate={p.rotate} border={BORDER} lift={p.lift} grain={0.06} seed={m.name} />;
          })}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default TwentyMinuteWalk;
