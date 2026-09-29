import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  DARK,
  FRAME_H,
  FRAME_W,
  FrontHatch,
  INK,
  INK_HI,
  INK_LO,
  LAND,
  MapLabel,
  SCREEN_CX,
  SCREEN_CY,
  SEA,
  WorldSvg,
  camTransform,
  dotScreen,
  levelOps,
  type Cam,
} from "./koreaShared";
import { LEVELS } from "./koreaLevels";
import {
  BORDER,
  BORDER_CUM,
  DURATION,
  FPS,
  camAt,
  creamAt,
  frontAt,
  litAt,
  unDotsAt,
} from "./chineseMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// ChineseAreIn (cut 5 of Sarah Paine, "Both sides overreached in Korea";
// delivered as 48_ChineseAreIn.mov). Dwarkesh map style on the shared 1950
// Korea world (koreaShared + korea1950Fronts, read-only), continuing cut 4
// (ReuniteTheWholeThing, reuniteMotion.ts, read-only).
//
//   "Well, when he gets too close to the Chinese border, the Chinese are in,"
//
// IN-POINT 48.320 s = f0. Speech 3.600 s: DURATION = round(3.6 x 24) + 16 =
// 86 + 16 = 102 frames, 24 fps, 1080x1920, opaque.
// Word onsets (frames): well 0 · when 12 · he 18 · gets 21 · too 25 ·
//   close 29 · to the 35 · chinese 40 · border 47 · the 59 · chinese 61 ·
//   are in 68 · and 78.
//
// OPENS ON cut 4's last frame, exactly (checked: 0.000 px): END_CAM
// (NORTH_FRAME), its front unFrontAt(END_U = 0.92) with the orange hatch
// south of it, and its 141-dot UN band (423,313 / 3,000). The camera, the
// front and the band all carry cut 4's velocities through the join.
//
// ORANGE = MacArthur's UN front, the overreach. The Chinese are cream.
//
// THE GESTURES, each with its word:
//   1. "well, when he gets too close" f0-30: the orange front inches on toward
//      the river along cut 4's own morph (u 0.92 -> 0.985 by f28, one cubic
//      from cut 4's closing du/df), until its Chosan and Hyesan spikes TOUCH
//      the Yalu (Hyesan ~f23, Chosan ~f30; the spike tips close the last
//      2-3 px onto the drawn border). The band rides it. The camera pushes
//      slowly toward the border (k 1.93 -> 2.74, f0 -> 58).          f0-31
//   2. "to the Chinese border" f23-50: from each touch point the Yalu-Tumen
//      border brightens INK_LO -> INK_HI and a hair heavier, travelling out
//      along its length both ways (9 world px/f, feathered): lit because the
//      front reached it, never on a timer. CHINA (IM Fell SC, widely spaced)
//      slides up 24 px + fades over Manchuria from f32, landed ~f46; on
//      "chinese" (40) it is fully in. The only text in the cut.       f23-60
//   3. "the Chinese are in" f30-102 (director's V2 of this beat): BOTH PVA
//      army groups, 127 cream dots (380,000 / 3,000), as COLUMNS marching in
//      from beyond the top edge along the approach roads (two abreast,
//      staggered, the rear thinning out) and converging on the real fords.
//      13th AG, west, 77: Andong -> Sinuiju 28, Changdian -> Sakju 22,
//      Ji'an -> Manpo 27. 9th AG, east, 50: Ji'an -> Manpo 34 (20th + 27th
//      Armies, to Yudam-ni / Chosin), Linjiang -> Chunggang 16 (26th Army).
//      Heads come into frame f30-45 (at <= 42 screen px/f), crowd up at the
//      water and cross f57-62, so the first are over the river well before
//      "are in" (68); each then fans (Hermite, leaving at the column's speed,
//      landing at rest) to its own blue-noise slot pressed against the orange
//      line along its whole width, the west fords to Chosin; the slots ride
//      the CURRENT front, so the crowd follows it as it gives way. Columns
//      are still entering on f80-89 and 7 dots are still above the frame on
//      the last frame. Where the cream lands (first ~f69, the pressure
//      spreading along the line at 5 px/f) the front's inching stops and it
//      gives way over 36 f (smootherstep, still easing on f101): 0.30 deg in
//      the west, 0.18 deg across the Chosin sector, nothing by Hyesan; the
//      Chosan spike collapses fully to the line between its shoulders
//      (40.88 -> 40.08 N). The hatch recedes with it and the orange band is
//      carried back. The camera eases back (k 2.75 -> 2.12, f42 -> 118) to
//      the whole front, content centred, still moving on the last frame.
// Nothing else: no arrows, no names but CHINA, no numbers, no dates.
//
// SOURCES
//   Front (FARTHEST_ADVANCE, the composite high-water line), UN strength and
//   the band: reuniteMotion.ts (Appleman, "South to the Naktong, North to the
//   Yalu", US Army CMH 1961; Mossman, "Ebb and Flow", CMH 1990, ch. 2 + map 1;
//   West Point Atlas vol. II). Crossings, PVA strength, border:
//   korea1950Fronts.ts. Checked for this cut (2026-09-29):
//   - Appleman ch. XXXVI: a ROK 6th Div column "on 26 October pushed its
//     reconnaissance troops all the way to the Yalu at Ch'osan"; the CCF 38th
//     Army crossed at An-tung -> Sinuiju, the 42d Army entered at Manp'ojin;
//     the Chinese crossed "from 13 or 14 to 20 October".
//   - Appleman ch. XXXVIII: 1st Bn, 17th Infantry entered Hyesanjin on 21 Nov
//     "to the banks of the Yalu River".
//   - Strength, late Nov 1950 (Second Phase Offensive): 13th Army Group
//     230,000 (Wikipedia "Battle of the Ch'ongch'on River", infobox) -> 77
//     dots; 9th Army Group 150,000 (koreanwar.org, "The Chinese Failure at
//     Chosin": "the 150,000 strong Ninth Army Group") -> 50 dots; 380,000 in
//     all, inside Wikipedia "Second Phase Offensive"'s 300,000-390,000.
//   - 9th AG crossings (warhistory.org, "The Chinese Cross the Yalu"): moving
//     into Korea from 5 Nov; the 20th Army from Manpojin to Yudam-ni, the 27th
//     following to Changjin, the 26th to Linjiang / Huchang. The split of the
//     13th AG over its three fords is an estimate (not sourced per ford).
//   Coordinates are approximate to ~0.1 deg.
//
// CHECKS (builder's scratchpad scripts): join to cut 4 (camera, front, dots:
// 0 px), camera max 16.3 screen px/f, |dv| 0.95 px/f^2, never below 0.7 px/f;
// cream <= 42 screen px/f (the columns far up), orange <= 14; lowest ink y
// ~1016
// (orange band), nothing important below y1150.
// ---------------------------------------------------------------------------

export const schema = z.object({
  china: z.string(),
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ china: "CHINA", vignette: 0.55 });

// CHINA: over Manchuria, just north of the river between the crossings
const CHINA_LL: [number, number] = [125.62, 41.55];
const CHINA_F0 = 32;

// ---------------------------------------------------------------------------
// The page: koreaShared's <KoreaPage>, line for line, plus one slot between the
// baked map and the world-space mottle, so the lit border is inked INTO the
// page (the mottle lies over it exactly as over the baked border).
// ---------------------------------------------------------------------------
const covers = (L: { x0: number; y0: number; w: number; h: number }, v: { x0: number; x1: number; y0: number; y1: number }) =>
  v.x0 >= L.x0 && v.y0 >= L.y0 && v.x1 <= L.x0 + L.w && v.y1 <= L.y0 + L.h;
const Page: React.FC<{ cam: Cam; vignette: number; underMottle?: React.ReactNode; children?: React.ReactNode }> = ({
  cam,
  vignette,
  underMottle,
  children,
}) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const ops = levelOps(k);
  const view = {
    x0: cam.cx - SCREEN_CX / k - 20,
    x1: cam.cx + (FRAME_W - SCREEN_CX) / k + 20,
    y0: cam.cy - SCREEN_CY / k - 20,
    y1: cam.cy + (FRAME_H - SCREEN_CY) / k + 20,
  };
  const levelImgs = LEVELS.map((L, li) => {
    const above = LEVELS[li + 1];
    const drawn = ops[li] > 0.001 && (!above || ops[li + 1] < 0.999 || !covers(above, view));
    if (!drawn) return null;
    return (
      <Img
        key={L.name}
        src={staticFile(`korea/lod-${L.name}.png`)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: L.W,
          height: L.H,
          transformOrigin: "0 0",
          transform: `translate(${(tx + L.x0 * k).toFixed(3)}px, ${(ty + L.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
          opacity: ops[li],
        }}
      />
    );
  });
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const tiles: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const x0 = Math.floor((view.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((view.y0 - oy) / S) * S + oy;
    for (let y = y0; y < view.y1; y += S) for (let x = x0; x < view.x1; x += S) tiles.push({ x, y, s: S, o: op });
  });
  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      {levelImgs}
      {underMottle}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          opacity: 0.9,
        }}
      >
        {tiles.map((t, i) => (
          <Img
            key={`m-${i}`}
            src={staticFile("korea/mottle.png")}
            style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
          />
        ))}
      </div>
      {children}
      <Img src={staticFile("korea/grain.png")} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(
            3,
          )}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// The lit border, in pieces of ~5 world px along the baked path: where lit, a
// land-coloured knock-out hides the baked 0.5 dashes and the same border is
// re-inked with world-anchored dashes (the close level's 8 / 5 px at k 2.6) at
// INK_LO -> INK_HI, a hair heavier as it brightens.
// ---------------------------------------------------------------------------
const PIECES: { a: number; b: number; s: number }[] = (() => {
  const out: { a: number; b: number; s: number }[] = [];
  let a = 0;
  for (let i = 1; i < BORDER.length; i++) {
    if (BORDER_CUM[i] - BORDER_CUM[a] >= 5 || i === BORDER.length - 1) {
      out.push({ a, b: i, s: (BORDER_CUM[a] + BORDER_CUM[i]) / 2 });
      a = i;
    }
  }
  return out;
})();
const DASH: [number, number] = [8 / 2.6, 5 / 2.6];
const LitBorder: React.FC<{ frame: number; cam: Cam }> = ({ frame, cam }) => {
  const k = cam.k;
  const x0 = cam.cx - SCREEN_CX / k - 30;
  const x1 = cam.cx + (FRAME_W - SCREEN_CX) / k + 30;
  const y0 = cam.cy - SCREEN_CY / k - 30;
  const y1 = cam.cy + (FRAME_H - SCREEN_CY) / k + 30;
  const knock: React.ReactNode[] = [];
  const ink: React.ReactNode[] = [];
  PIECES.forEach(({ a, b, s }, pi) => {
    const lit = litAt(s, frame);
    if (lit <= 0.001) return;
    const seg = BORDER.slice(a, b + 1);
    if (seg.every(([x, y]) => x < x0 || x > x1 || y < y0 || y > y1)) return;
    const d = `M${seg.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
    const ko = Math.min(1, lit / 0.12);
    knock.push(
      <path key={`k${pi}`} d={d} fill="none" stroke={LAND} strokeOpacity={ko} strokeWidth={3.6 / k} strokeLinecap="round" />,
    );
    ink.push(
      <path
        key={`i${pi}`}
        d={d}
        fill="none"
        stroke={INK}
        strokeOpacity={(INK_LO + (INK_HI - INK_LO) * lit) * ko}
        strokeWidth={(1.7 + 0.6 * lit) / k}
        strokeDasharray={`${DASH[0]} ${DASH[1]}`}
        strokeDashoffset={-BORDER_CUM[a]}
        strokeLinecap="round"
      />,
    );
  });
  return (
    <WorldSvg cam={cam}>
      {knock}
      {ink}
    </WorldSvg>
  );
};

// the UN crowd, drawn exactly as koreaShared's <Army color="orange">
const UnCrowd: React.FC<{ frame: number; cam: Cam }> = ({ frame, cam }) => {
  const k = cam.k;
  const r = dotScreen(k) / 2 / k;
  return (
    <g>
      {unDotsAt(frame, k).map((d) => (
        <circle key={d.id} cx={d.x} cy={d.y} r={r} fill={ACCENT} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.6 / k} />
      ))}
    </g>
  );
};

const CreamCrowd: React.FC<{ frame: number; cam: Cam }> = ({ frame, cam }) => {
  const k = cam.k;
  const r = dotScreen(k) / 2 / k;
  return (
    <g>
      {creamAt(frame, k).map((d) => (
        <circle
          key={`c${d.id}`}
          cx={d.x}
          cy={d.y}
          r={r}
          fill={INK}
          fillOpacity={d.op}
          stroke={DARK}
          strokeOpacity={0.6 * d.op}
          strokeWidth={1.6 / k}
        />
      ))}
    </g>
  );
};

const ChineseAreIn: React.FC<Props> = ({ china, vignette }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const front = frontAt(frame);
  return (
    <Page cam={cam} vignette={vignette} underMottle={<LitBorder frame={frame} cam={cam} />}>
      <WorldSvg cam={cam}>
        <FrontHatch front={front} side="south" cam={cam} id="cai" />
        <UnCrowd frame={frame} cam={cam} />
        <CreamCrowd frame={frame} cam={cam} />
        <MapLabel text={china} lon={CHINA_LL[0]} lat={CHINA_LL[1]} frame={frame} f0={CHINA_F0} cam={cam} size={46} spacing={0.6} />
      </WorldSvg>
    </Page>
  );
};

export default ChineseAreIn;
