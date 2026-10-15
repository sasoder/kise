// PearlKitDemo: the review sheet of the Pearl Harbor kit (pearlShared.tsx).
// One frame per state: each world wide and close and every vocabulary item, so
// the builders and the director can see it. Not a cut. 1080x1920, 24 fps.
//   PearlKitDemo (ASIA), frames:
//     0 all of China: Japan 1931 + Manchukuo growing from Kwantung + the plan outline being drawn
//     1 all of China: occupied 1938 + its front + faction crowds (dot fields)
//     2 Manchuria close (k 3.8): Manchukuo, coal / iron / soybeans glyphs, cities
//     3 the southwest (k 4.2): Burma railway + road, Yunnan railway, packets, Tonkin hatch sweeping south
//     4 the Yunnan railway close (k 9): the line cut near Lao Cai, packets stopped / queued
//     5 central China (k 1.7): faction crowds halfway to a band behind the front
//     6 vocabulary close-up (k 6, Shandong): ghost hatch, plan outline, label ruler, strike arc + target, big glyphs
//     7 East Asia (k 1.2): the ghost "plan" over all of China, Japan's empire hatched
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  type Cam,
  CityDot,
  CoalHeap,
  Dots,
  FRAME_H,
  FRAME_W,
  type CamKey,
  Hatch,
  INK,
  IronPig,
  IslandDots,
  lin,
  runCamera,
  clamp01,
  greatCirclePath,
  viaPath,
  Label,
  MapPage,
  type P2,
  Packets,
  PlanOutline,
  Route,
  SoySack,
  StrikeArc,
  Target,
  WorldSvg,
  arcPath,
  bandRing,
  dotScreen,
  dotsInDisc,
  dotsInRings,
  fell,
  lerpDots,
  matchDots,
  packetsAt,
  pointAt,
  relaxDots,
} from "./pearlShared";
import * as PAC from "./pearlPacificMapData";
import {
  BURMA_RAIL,
  BURMA_ROAD,
  BURMA_ROUTE,
  CHINA_ALL,
  CHINA_OUTLINE_PTS,
  CHINA_POLY,
  FACTIONS,
  FRAMINGS,
  FREE_CHINA_POLY,
  FRONT_1938_D,
  FRONT_1938_PTS,
  INDOCHINA_NORTH,
  JAPAN_1931,
  KWANTUNG,
  MANCHUKUO,
  OCCUPIED_1938,
  PLACES,
  RESOURCES,
  YUNNAN_RAILWAY,
  project,
} from "./pearlAsiaMapData";

export const FPS = 24;
export const DURATION = 8;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const F = FRAMINGS;
const cityLab = (name: keyof typeof PLACES, text: string, cam: Cam, dx = 14, dy = 12, anchor: "start" | "end" | "middle" = "start", color = INK) => (
  <g key={name}>
    <CityDot x={PLACES[name][0]} y={PLACES[name][1]} cam={cam} color={color === INK ? INK : ACCENT} />
    <Label x={PLACES[name][0]} y={PLACES[name][1]} text={text} appear={-30} frame={0} cam={cam} cap={30} sc={false} anchor={anchor} dx={dx} dy={dy} color={color} spacing={0.02} />
  </g>
);
const Caption: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", left: 30, top: 40, right: 30, color: INK, fontFamily: fell, fontSize: 30, lineHeight: 1.25, textShadow: "0 0 6px #000" }}>{text}</div>
);

// faction crowds: an even field round each seat, inside free China
const FACTION_N: Record<keyof typeof FACTIONS, number> = { nationalists: 70, communists: 22, shanxi: 18, guangxi: 22, sichuan: 26, yunnan: 16, ma: 14 };
const crowd = (spacing: number) =>
  (Object.keys(FACTIONS) as (keyof typeof FACTIONS)[]).flatMap((f, i) => {
    const [cx, cy] = FACTIONS[f];
    const n = FACTION_N[f];
    const r = spacing * Math.sqrt(n) * 0.62;
    return dotsInDisc(cx, cy, r, spacing, 11 + i, CHINA_POLY, n);
  });

const State: React.FC<{ i: number }> = ({ i }) => {
  if (i === 0) {
    const cam = { ...F.CHINA_WIDE, y: F.CHINA_WIDE.y - 40 };
    const kw: P2 = [(KWANTUNG.box[0] + KWANTUNG.box[2]) / 2, (KWANTUNG.box[1] + KWANTUNG.box[3]) / 2];
    return (
      <MapPage world="asia" cam={cam}>
        <WorldSvg cam={cam}>
          <PlanOutline pts={CHINA_OUTLINE_PTS} cam={cam} drawn={0.62} />
          <Hatch region={JAPAN_1931} cam={cam} id="j31" />
          <Hatch region={MANCHUKUO} cam={cam} id="mk" reveal={{ from: kw, progress: 0.55 }} />
          <Label x={PLACES.tokyo[0]} y={PLACES.tokyo[1]} text="JAPAN" appear={-30} frame={0} cam={cam} color={ACCENT} dx={-10} dy={-40} />
          <Label x={(MANCHUKUO.box[0] + MANCHUKUO.box[2]) / 2} y={(MANCHUKUO.box[1] + MANCHUKUO.box[3]) / 2} text="MANCHUKUO" appear={-30} frame={0} cam={cam} color={ACCENT} />
          <Label x={480} y={860} text="CHINA" appear={-30} frame={0} cam={cam} />
          {cityLab("beijing", "Beijing", cam)}
          {cityLab("shanghai", "Shanghai", cam)}
        </WorldSvg>
        <Caption text="0 · ASIA k 1.1: JAPAN_1931 hatch, MANCHUKUO growing from Kwantung (reveal 0.55, radial), CHINA plan outline (drawn 0.62)" />
      </MapPage>
    );
  }
  if (i === 1) {
    const cam = { ...F.CHINA_WIDE, y: F.CHINA_WIDE.y - 40 };
    const dots = crowd(dotScreen(cam.k) * 1.45 / cam.k);
    return (
      <MapPage world="asia" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={JAPAN_1931} cam={cam} id="j31" />
          <Hatch region={MANCHUKUO} cam={cam} id="mk" />
          <Hatch region={OCCUPIED_1938} cam={cam} id="oc" />
          <Dots pts={dots} cam={cam} />
          {cityLab("nanjing", "Nanjing", cam, 14, 12, "start", ACCENT)}
          {cityLab("yanan", "Yan'an", cam, -14, -10, "end")}
          {cityLab("chongqing", "Chongqing", cam, -14, 30, "end")}
        </WorldSvg>
        <Caption text="1 · OCCUPIED_1938 (east of FRONT_1938, + Canton, Hainan); faction crowds = dotsInDisc round FACTIONS inside CHINA_POLY" />
      </MapPage>
    );
  }
  if (i === 2) {
    const cam = { x: (RESOURCES.iron[0] + RESOURCES.soybeans[0]) / 2 + 6, y: (RESOURCES.iron[1] + RESOURCES.soybeans[1]) / 2 + 8, k: 5 };
    return (
      <MapPage world="asia" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={JAPAN_1931} cam={cam} id="j31" />
          <Hatch region={MANCHUKUO} cam={cam} id="mk" />
          {cityLab("mukden", "Mukden", cam, -14, 12, "end")}
          {cityLab("hsinking", "Hsinking", cam, 14, 12)}
          {cityLab("harbin", "Harbin", cam, 14, 12)}
          {cityLab("dairen", "Dairen", cam, 14, 12, "start", ACCENT)}
          <CityDot x={PLACES.fushun[0]} y={PLACES.fushun[1]} cam={cam} />
          <CityDot x={PLACES.anshan[0]} y={PLACES.anshan[1]} cam={cam} />
          <CoalHeap x={RESOURCES.coal[0] + 50 / cam.k} y={RESOURCES.coal[1] + 4 / cam.k} cam={cam} id="coal" h={52} />
          <IronPig x={RESOURCES.iron[0] - 46 / cam.k} y={RESOURCES.iron[1] + 40 / cam.k} cam={cam} id="iron" h={48} />
          <SoySack x={RESOURCES.soybeans[0]} y={RESOURCES.soybeans[1]} cam={cam} id="soy" h={58} />
          <Label x={PLACES.fushun[0]} y={PLACES.fushun[1]} text="FUSHUN" appear={-30} frame={0} cam={cam} dy={-28} dx={60} cap={34} />
          <Label x={PLACES.anshan[0]} y={PLACES.anshan[1]} text="ANSHAN" appear={-30} frame={0} cam={cam} dy={100} dx={-40} cap={34} />
        </WorldSvg>
        <Caption text="2 · k 5: CoalHeap (Fushun), IronPig (Anshan), SoySack (central plain), h 48-58 px; Dairen in the Kwantung tip (JAPAN_1931)" />
      </MapPage>
    );
  }
  if (i === 3) {
    const cam = F.SOUTHWEST;
    const pk = packetsAt({ len: BURMA_ROUTE.len, frame: 40, f0: -800, speed: 0.55, gap: 16 });
    const pky = packetsAt({ len: YUNNAN_RAILWAY.len, frame: 40, f0: -400, speed: 0.5, gap: 12 });
    return (
      <MapPage world="asia" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={INDOCHINA_NORTH} cam={cam} id="tk" reveal={{ from: project(105, 23.5), dir: [0, 1], progress: 0.6 }} />
          <Route route={BURMA_RAIL} kind="rail" cam={cam} />
          <Route route={BURMA_ROAD} kind="road" cam={cam} />
          <Route route={YUNNAN_RAILWAY} kind="rail" cam={cam} />
          <Packets route={BURMA_ROUTE} packets={pk} cam={cam} />
          <Packets route={YUNNAN_RAILWAY} packets={pky} cam={cam} />
          {cityLab("rangoon", "Rangoon", cam, -14, 12, "end")}
          {cityLab("lashio", "Lashio", cam, -14, 12, "end")}
          {cityLab("kunming", "Kunming", cam, 14, -10)}
          {cityLab("chongqing", "Chongqing", cam, 14, 12)}
          {cityLab("hanoi", "Hanoi", cam, -14, 12, "end")}
          {cityLab("haiphong", "Haiphong", cam, 14, 12)}
        </WorldSvg>
        <Caption text="3 · SOUTHWEST k 4.2: BURMA_RAIL (rail) + BURMA_ROAD (road), YUNNAN_RAILWAY, Packets; INDOCHINA_NORTH sweeping south (linear reveal 0.6)" />
      </MapPage>
    );
  }
  if (i === 4) {
    const cutS = YUNNAN_RAILWAY.stations.laoCai - 6;
    const c = pointAt(YUNNAN_RAILWAY.pts, cutS);
    const cam = { x: c.x - 4, y: c.y + 8, k: 9 };
    const pky = packetsAt({ len: YUNNAN_RAILWAY.len, frame: 60, f0: -400, speed: 0.5, gap: 5, cut: { s: cutS, frame: 30, gap: 2.2 } });
    return (
      <MapPage world="asia" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={INDOCHINA_NORTH} cam={cam} id="tk" />
          <Route route={YUNNAN_RAILWAY} kind="rail" cam={cam} cut={{ s: cutS, open: 1, dim: 1 }} />
          <Packets route={YUNNAN_RAILWAY} packets={pky} cam={cam} dimBeyond={1} />
          {cityLab("kunming", "Kunming", cam, 14, 12)}
          <Label x={c.x} y={c.y} text="LAO CAI" appear={-30} frame={0} cam={cam} dx={-30} dy={-40} anchor="end" />
        </WorldSvg>
        <Caption text="4 · k 9: the Yunnan railway CUT near Lao Cai (cut.open 1, dim 1): packets beyond stopped and dimmed, packets before queued at the break" />
      </MapPage>
    );
  }
  if (i === 5) {
    const cam = { x: 545, y: 880, k: 1.7 };
    const sp = (dotScreen(cam.k) * 1.45) / cam.k;
    const from = crowd(sp);
    const band = bandRing(FRONT_1938_PTS, -1, 4, 26);
    const slots = dotsInRings([band], sp, 5, 2000).filter(([x, y]) => dotsFilter(x, y));
    const to = matchDots(from, slots, [0, 1]);
    const mid = relaxDots(lerpDots(from, to, 0.5, 0.35, 3), sp * 0.9);
    return (
      <MapPage world="asia" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={OCCUPIED_1938} cam={cam} id="oc" />
          <path d={FRONT_1938_D} fill="none" stroke={ACCENT} strokeWidth={3 / cam.k} />
          <Dots pts={mid} cam={cam} />
        </WorldSvg>
        <Caption text="5 · k 1.7: crowds halfway (lerpDots 0.5, stagger) from their seats to a band behind FRONT_1938 (bandRing + dotsInRings + matchDots + relaxDots)" />
      </MapPage>
    );
  }
  if (i === 6) {
    const cam = { x: project(118.6, 36.4)[0], y: project(118.6, 36.4)[1], k: 6 };
    const a = project(121.6, 38.9);
    const b = project(117.2, 39.13);
    const arc = arcPath(a, b, 0.18);
    const tg = project(118.0, 36.8);
    const arc2 = arcPath(project(121.3, 37.4), tg, -0.15);
    return (
      <MapPage world="asia" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={OCCUPIED_1938} cam={cam} id="ocg" ghost />
          <StrikeArc pts={arc} t={0.65} cam={cam} />
          <StrikeArc pts={arc2} t={1} cam={cam} />
          <Target x={tg[0]} y={tg[1]} cam={cam} arrive={0.55} from={arc2[arc2.length - 3]} />
          {cityLab("tianjin", "Tianjin", cam, 14, -14)}
          <CoalHeap x={project(116.0, 35.6)[0]} y={project(116.0, 35.6)[1]} cam={cam} id="c2" h={130} />
          <IronPig x={project(117.6, 35.0)[0]} y={project(117.6, 35.0)[1]} cam={cam} id="i2" h={120} />
          <SoySack x={project(119.4, 35.0)[0]} y={project(119.4, 35.0)[1]} cam={cam} id="s2" h={130} />
        </WorldSvg>
        {/* label ruler: a 38 px bar beside a default (cap 38) label */}
        <svg width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0 }}>
          <rect x={150} y={1500 - 38} width={10} height={38} fill={ACCENT} />
          <WorldLabelScreen />
        </svg>
        <Caption text="6 · k 6: ghost hatch (PLANNED), StrikeArc (t 0.65; t 1) + Target arriving 0.55, glyphs large; bottom: a 38 px bar vs a cap-38 Label" />
      </MapPage>
    );
  }
  const cam = { ...F.EAST_ASIA };
  return (
    <MapPage world="asia" cam={cam}>
      <WorldSvg cam={cam}>
        <Hatch region={CHINA_ALL} cam={cam} id="plan" ghost />
        <Hatch region={JAPAN_1931} cam={cam} id="j31" />
        <Hatch region={MANCHUKUO} cam={cam} id="mk" />
        <Label x={PLACES.tokyo[0]} y={PLACES.tokyo[1]} text="TOKYO" appear={-30} frame={0} cam={cam} color={ACCENT} dy={-30} />
      </WorldSvg>
      <Caption text="7 · EAST_ASIA k 1.2: CHINA_ALL as the ghost plan (dashed outline + sparse hatch), the empire of 1931 + Manchukuo hatched" />
    </MapPage>
  );
};
// keep the band's slots on land in China
const dotsFilter = (x: number, y: number) => {
  for (const poly of FREE_CHINA_POLY) {
    let c = false;
    for (const r of poly)
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i];
        const [xj, yj] = r[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
    if (c) return true;
  }
  return false;
};
const WorldLabelScreen: React.FC = () => {
  const cam = { x: 540, y: 960, k: 1 };
  return <Label x={175} y={1500} text="SHANDONG" appear={-30} frame={0} cam={cam} anchor="start" />;
};

const PearlKitDemo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#1B2226" }}>
      <State i={frame} />
    </AbsoluteFill>
  );
};
export default PearlKitDemo;

// ---------------------------------------------------------------------------
// PearlPacificDemo (PACIFIC world, cut F), frames:
//   0 the Pacific wide (k 1.1): JAPAN_1941 + mandate dots, every strike in flight, targets arriving
//   1 the Pacific wide: every strike landed, every target ringed, labels
//   2 Oahu close (k 114): the carrier strike arriving from the north, Pearl Harbor's target arriving
//   3 the pull-back at k 14 (Oahu, Molokai, Maui): the deep LOD levels
//   4 Malaya (k 8.1): the convoy from Samah via the Gulf of Siam, Saigon -> Singapore, Indochina hatched
//   5 Formosa - Luzon (k 8.1): Takao -> Clark Field
//   6 the Marianas (k 14): Saipan -> Guam, mandate dots at map scale
//   7 Kwajalein - Wake (k 5): Roi -> Wake
// ---------------------------------------------------------------------------
export const PACIFIC_DURATION = 8;
const PF = PAC.FRAMINGS;
const strikePts = (id: PAC.Target): P2[] => {
  const s = PAC.STRIKES.find((q) => q.id === id)!;
  if (s.via) return viaPath([...PAC.CONVOY_VIA_LL, PAC.TARGETS_LL[s.to]].map(([lon, lat]) => PAC.project(lon, lat)), 14);
  return greatCirclePath(PAC.project, PAC.ORIGINS_LL[s.from], PAC.TARGETS_LL[s.to], id === "pearlHarbor" ? -0.1 : 0.12);
};
const STRIKE_PTS = Object.fromEntries(PAC.STRIKES.map((s) => [s.id, strikePts(s.id)])) as Record<PAC.Target, P2[]>;
const Strike: React.FC<{ id: PAC.Target; t: number; cam: Cam; size?: number }> = ({ id, t, cam, size }) => {
  const pts = STRIKE_PTS[id];
  const tg = PAC.TARGETS[id];
  const arrive = clamp01((t - 1) / 0.6 + (t >= 1 ? 0.001 : 0));
  return (
    <>
      <StrikeArc pts={pts} t={t} cam={cam} />
      <Target x={tg[0]} y={tg[1]} cam={cam} arrive={arrive} from={pts[pts.length - 4]} size={size} />
    </>
  );
};
const PacState: React.FC<{ i: number }> = ({ i }) => {
  const mandate = Object.values(PAC.MANDATE_POINTS);
  const ids = PAC.STRIKES.map((s) => s.id);
  if (i === 0 || i === 1) {
    const cam = { ...PF.PACIFIC_WIDE };
    return (
      <MapPage world="pacific" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={PAC.JAPAN_1941} cam={cam} id="j41" />
          <IslandDots pts={mandate} cam={cam} />
          {ids.map((id, j) => (
            <Strike key={id} id={id} t={i === 0 ? 0.35 + 0.08 * j : 1.6} cam={cam} />
          ))}
          {i === 1 ? (
            <>
              <Label x={PAC.TARGETS.pearlHarbor[0]} y={PAC.TARGETS.pearlHarbor[1]} text="PEARL HARBOR" appear={-30} frame={0} cam={cam} anchor="end" dx={24} dy={-46} />
              <Label x={PAC.TARGETS.singapore[0]} y={PAC.TARGETS.singapore[1]} text="SINGAPORE" appear={-30} frame={0} cam={cam} anchor="start" dx={10} dy={70} />
              <Label x={PAC.TARGETS.wake[0]} y={PAC.TARGETS.wake[1]} text="WAKE" appear={-30} frame={0} cam={cam} dy={70} />
              <Label x={PAC.TARGETS.guam[0]} y={PAC.TARGETS.guam[1]} text="GUAM" appear={-30} frame={0} cam={cam} dy={70} />
              <Label x={PAC.TARGETS.clarkField[0]} y={PAC.TARGETS.clarkField[1]} text="MANILA" appear={-30} frame={0} cam={cam} dx={40} dy={-40} anchor="start" />
              <Label x={PAC.PLACES.tokyo[0]} y={PAC.PLACES.tokyo[1]} text="TOKYO" appear={-30} frame={0} cam={cam} color={ACCENT} dy={-44} />
            </>
          ) : null}
        </WorldSvg>
        <Caption text={i === 0 ? "P0 · PACIFIC_WIDE k 1.1: JAPAN_1941 hatch + IslandDots (mandate), every StrikeArc in flight (t 0.35-0.99)" : "P1 · every strike landed: Target rings (Pearl Harbor, Kota Bharu, Singora, Pattani, Singapore, Clark, Wake, Guam, Shanghai)"} />
      </MapPage>
    );
  }
  if (i === 2) {
    const cam = { ...PF.OAHU_CLOSE, y: PF.OAHU_CLOSE.y - 0.4 };
    return (
      <MapPage world="pacific" cam={cam}>
        <WorldSvg cam={cam}>
          <Strike id="pearlHarbor" t={1.25} cam={cam} />
          <Label x={PAC.TARGETS.pearlHarbor[0]} y={PAC.TARGETS.pearlHarbor[1]} text="PEARL HARBOR" appear={-30} frame={0} cam={cam} dy={150} />
        </WorldSvg>
        <Caption text="P2 · OAHU_CLOSE k 114 (Oahu ~60% of the width, 10m coast): the carrier strike from the north has landed, Target arriving 0.4" />
      </MapPage>
    );
  }
  if (i === 3) {
    const cam = { x: PAC.TARGETS.pearlHarbor[0] + 6, y: PAC.TARGETS.pearlHarbor[1] + 4, k: 14 };
    return (
      <MapPage world="pacific" cam={cam}>
        <WorldSvg cam={cam}>
          <Strike id="pearlHarbor" t={1.6} cam={cam} />
        </WorldSvg>
        <Caption text="P3 · k 14 on the pull-back: Oahu, Molokai, Maui from the deep LOD levels" />
      </MapPage>
    );
  }
  if (i === 4) {
    const cam = { ...PF.MALAYA };
    return (
      <MapPage world="pacific" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={PAC.INDOCHINA} cam={cam} id="ic" />
          <Hatch region={PAC.OCCUPIED_CHINA} cam={cam} id="oc" />
          <Strike id="kotaBharu" t={1.3} cam={cam} />
          <Strike id="singora" t={0.92} cam={cam} />
          <Strike id="pattani" t={0.8} cam={cam} />
          <Strike id="singapore" t={0.7} cam={cam} />
          <Label x={PAC.TARGETS.kotaBharu[0]} y={PAC.TARGETS.kotaBharu[1]} text="KOTA BHARU" appear={-30} frame={0} cam={cam} anchor="start" dx={30} dy={50} />
          <Label x={PAC.TARGETS.singapore[0]} y={PAC.TARGETS.singapore[1]} text="SINGAPORE" appear={-30} frame={0} cam={cam} dy={70} />
        </WorldSvg>
        <Caption text="P4 · MALAYA k 8.1: the convoy (viaPath through CONVOY_VIA_LL) to Kota Bharu / Singora / Pattani; Saigon -> Singapore; INDOCHINA hatched" />
      </MapPage>
    );
  }
  if (i === 5) {
    const cam = { ...PF.FORMOSA_LUZON };
    return (
      <MapPage world="pacific" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={PAC.EMPIRE_1931} cam={cam} id="em" />
          <Hatch region={PAC.OCCUPIED_CHINA} cam={cam} id="oc" />
          <Strike id="clarkField" t={1.4} cam={cam} />
          <Label x={PAC.TARGETS.clarkField[0]} y={PAC.TARGETS.clarkField[1]} text="CLARK FIELD" appear={-30} frame={0} cam={cam} anchor="start" dx={40} dy={10} />
          <Label x={PAC.ORIGINS.takao[0]} y={PAC.ORIGINS.takao[1]} text="FORMOSA" appear={-30} frame={0} cam={cam} color={ACCENT} anchor="end" dx={-30} dy={-30} />
        </WorldSvg>
        <Caption text="P5 · FORMOSA_LUZON k 8.1: Takao -> Clark Field (great circle + bow), Taiwan in the 1931 empire" />
      </MapPage>
    );
  }
  if (i === 6) {
    const c = PAC.TARGETS.guam;
    const cam = { x: c[0] + 2, y: c[1] - 9, k: 14 };
    return (
      <MapPage world="pacific" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={PAC.MANDATE} cam={cam} id="md" />
          <IslandDots pts={mandate} cam={cam} />
          <Strike id="guam" t={1.3} cam={cam} />
          <Label x={c[0]} y={c[1]} text="GUAM" appear={-30} frame={0} cam={cam} dy={90} />
          <Label x={PAC.ORIGINS.saipan[0]} y={PAC.ORIGINS.saipan[1]} text="SAIPAN" appear={-30} frame={0} cam={cam} color={ACCENT} anchor="start" dx={50} />
        </WorldSvg>
        <Caption text="P6 · k 14: Saipan -> Guam; the Marianas (mandate) as IslandDots at map scale over their 10m land" />
      </MapPage>
    );
  }
  const w = PAC.TARGETS.wake;
  const cam = { x: w[0] + 3, y: (w[1] + PAC.ORIGINS.roi[1]) / 2, k: 5 };
  return (
    <MapPage world="pacific" cam={cam}>
      <WorldSvg cam={cam}>
        <IslandDots pts={mandate} cam={cam} />
        <Strike id="wake" t={0.75} cam={cam} />
        <Label x={w[0]} y={w[1]} text="WAKE" appear={-30} frame={0} cam={cam} dy={-50} />
      </WorldSvg>
      <Caption text="P7 · k 5: Roi (Kwajalein) -> Wake in flight; Marshalls as IslandDots" />
    </MapPage>
  );
};
export const PearlPacificDemo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#1B2226" }}>
      <PacState i={frame} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// PearlPacificPullback: a motion test of the deep LOD pyramid: Oahu close (k 114)
// -> the whole Pacific (k 1.1) in 96 frames, every strike landing on the way.
// ---------------------------------------------------------------------------
export const PULLBACK_DURATION = 96;
const OAHU = PF.OAHU_CLOSE;
const PULL_KEYS: CamKey[] = [
  { f: 0, x: OAHU.x, y: OAHU.y - 0.4, k: OAHU.k },
  { f: 26, x: OAHU.x - 2, y: OAHU.y, k: 16 },
  { f: 52, x: OAHU.x - 150, y: OAHU.y - 10, k: 3.2 },
  { f: 80, x: PF.PACIFIC_WIDE.x, y: PF.PACIFIC_WIDE.y, k: PF.PACIFIC_WIDE.k },
  { f: 120, x: PF.PACIFIC_WIDE.x - 4, y: PF.PACIFIC_WIDE.y, k: PF.PACIFIC_WIDE.k * 1.03 },
];
export const PearlPacificPullback: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = runCamera(PULL_KEYS, frame);
  const ids = PAC.STRIKES.map((s) => s.id);
  return (
    <AbsoluteFill style={{ backgroundColor: "#1B2226" }}>
      <MapPage world="pacific" cam={cam}>
        <WorldSvg cam={cam}>
          <Hatch region={PAC.JAPAN_1941} cam={cam} id="j41" />
          <IslandDots pts={Object.values(PAC.MANDATE_POINTS)} cam={cam} />
          {ids.map((id, j) => (
            <Strike key={id} id={id} t={id === "pearlHarbor" ? 1 + frame / 14 : lin(frame, 10 + 4 * j, 70 + 2 * j) * 1.0 + (frame > 70 + 2 * j ? (frame - 70 - 2 * j) / 14 : 0)} cam={cam} />
          ))}
          <Label x={PAC.TARGETS.pearlHarbor[0]} y={PAC.TARGETS.pearlHarbor[1]} text="PEARL HARBOR" appear={-30} frame={frame} cam={cam} anchor="middle" dy={110} out={[14, 26]} />
        </WorldSvg>
      </MapPage>
    </AbsoluteFill>
  );
};
