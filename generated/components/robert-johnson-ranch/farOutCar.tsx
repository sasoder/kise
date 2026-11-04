// ---------------------------------------------------------------------------
// farOutCar — FarOutOfAustin's (cut 6, take 2) vehicles and road furniture, in the clip's air-lit volumes:
//   <Sedan>        a late-1970s American four-door sedan (~5.6 m: long hood, formal roof, long trunk): slab sides with a
//                  chrome rub strip, door seams and handles; a dark slate greenhouse with a soft sky glint; pale chrome
//                  bumpers; quad rectangular headlights in a dark grille; muted red-brown tail lamps; four round wheels
//                  (black-brown tyres, pale hubcaps whose slots turn with the distance driven); front wheels steer; it
//                  sits on the ground's normal (pitch and roll); a soft contact shadow. Body dusty blue-grey by default.
//   <CattleGuard>  steel pipes across a ranch-road entrance over a dark pit between two concrete curbs, two stout cedar
//                  corner posts with H-braces, in a fence line.
//   <BarbedFence>  weathered cedar posts and four strands of barbed wire (barbs when close) along a polyline.
//   <DustPuffs>    soft caliche dust behind a car on the dirt road.
// Units: kit space (X, H up +, Z), U = 178 per metre; draw inside the cut's <WorldSvg> with its AirWorld A.
// Local car frame: a = forward, b = left, h = up (metres x 178).
// ---------------------------------------------------------------------------
import React from "react";
import { mixHex, type AirWorld, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { PAL, add, c01, cross, face3, facing, hash, lerp, line3, mul, n2, norm, outward, poly3, polyD, proj, Pt, sub, type P2, type Toner, type V3 } from "./farOutFaces";

// ===================================================================================================================
// MATERIALS
// ===================================================================================================================
export const CAR_MAT = {
  blueGrey: { lit: "#A7B2B3", mid: "#7E8B90", dark: "#4A565D" },
  oatmeal: { lit: "#CDBF9F", mid: "#A89A7C", dark: "#6B604C" },
  sage: { lit: "#A2AB92", mid: "#7E8770", dark: "#4C5444" },
  brickBrown: { lit: "#A07A66", mid: "#7C5A4A", dark: "#47332A" },
  cream: { lit: "#E3DCCB", mid: "#C3BBA7", dark: "#7D7768" },
  slate: { lit: "#8C949A", mid: "#646D74", dark: "#383F45" },
} satisfies Record<string, Mat>;
const CHROME: Mat = { lit: "#D6D1C3", mid: "#ABA597", dark: "#6A665D" };
const TYRE = "#2D2A26";
const TYRE_SIDE = "#3A3631";
const HUB = "#CFC9BA";
const GLASS = "#2E3A3A";
const GLINT = "#9DB2AB";
const GRILLE = "#34332F";
const LAMP = "#EEE7D4";
const TAIL = "#7E4438";
const WELL = "#26221E";
export const STEEL: Mat = { lit: "#A9ACA7", mid: "#80847F", dark: "#4B4F4C" };
export const CONCRETE: Mat = { lit: "#C4BDAE", mid: "#A29B8C", dark: "#625D53" };
export const CEDAR_POST: Mat = { lit: "#9A8F7E", mid: "#6F6657", dark: "#3A342C" };

// ===================================================================================================================
// THE SEDAN
// ===================================================================================================================
/** the body's dimensions (local units) */
export const CAR = { L2: 500, W2: 180, axleF: 300, axleR: -255, R: 66, wheelB: 156, sill: 48, belt: 150, roof: 244 };
/** a local frame on the ground: base point (kit), forward / left / up unit vectors */
export type CarFrame = { o: V3; F: V3; Lf: V3; Up: V3 };
export const carFrame = (o: V3, heading: [number, number], up: V3 = [0, 1, 0]): CarFrame => {
  const U = norm(up);
  const F0: V3 = [heading[0], 0, heading[1]];
  const F = norm(sub(F0, mul(U, F0[0] * U[0] + F0[1] * U[1] + F0[2] * U[2])));
  // (X, H, Z) is left-handed (X right, H up, Z away): left = F x Up
  const Lf = norm(cross(F, U));
  return { o, F, Lf, Up: U };
};
const at = (fr: CarFrame, a: number, b: number, h: number): V3 => add(add(add(fr.o, mul(fr.F, a)), mul(fr.Lf, b)), mul(fr.Up, h));

export type SedanProps = {
  A: AirWorld;
  /** the ground point under the car's centre (kit X, H, Z) */
  o: V3;
  /** heading as a unit vector in kit (X, Z) */
  heading: [number, number];
  /** the ground's normal (default straight up) */
  up?: V3;
  /** the wheels' turn angle (rad) = distance driven / R */
  roll?: number;
  /** front-wheel steer (rad, + = to the left) */
  steer?: number;
  /** a small body bounce (local units, + up) */
  bounce?: number;
  mat?: Mat;
  uid: string;
  tone?: Toner;
  shadow?: number;
};

export const Sedan: React.FC<SedanProps> = ({ A, o, heading, up, roll = 0, steer = 0, bounce = 0, mat = CAR_MAT.blueGrey, uid, tone, shadow = 1 }) => {
  const fr = carFrame(o, heading, up);
  const bfr: CarFrame = { ...fr, o: add(fr.o, mul(fr.Up, bounce)) };
  const P = (a: number, b: number, h: number) => at(bfr, a, b, h);
  const tn: Toner = tone ?? ((hex, Z, h) => A.tone(hex, Z, h));
  const Zc = o[2];
  const hc = o[1] + 120;
  const T = (hex: string) => tn(hex, Zc, hc);
  const lw = A.lw(0.8) * 0.85;
  const els: React.ReactNode[] = [];
  const C = CAR;
  const inBody = P(0, 0, 100);
  const inHouse = P(-70, 0, 196);
  const eye: V3 = [A.cam.cx, -A.P.opts.eyeY, -A.Dc];

  // ---- contact shadow (ground, offset away from the light, soft)
  const sh = [P(C.L2 + 30, C.W2 + 20, -bounce), P(C.L2 + 30, -C.W2 - 20, -bounce), P(-C.L2 - 30, -C.W2 - 20, -bounce), P(-C.L2 - 30, C.W2 + 20, -bounce)].map((p) => add(p, [70, 0, 40] as V3));
  const r = A.P.r(Zc);
  els.push(
    <g key="sh">
      <defs>
        <filter id={`${uid}-shf`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation={n2(Math.max(0.3, 34 * r))} />
        </filter>
      </defs>
      <path d={poly3(A, sh)} fill={PAL.shadow} opacity={0.5 * shadow * (1 - A.fog(Zc))} filter={`url(#${uid}-shf)`} />
      <path d={poly3(A, [P(C.L2 - 20, C.W2 - 10, -bounce), P(C.L2 - 20, -C.W2 + 10, -bounce), P(-C.L2 + 20, -C.W2 + 10, -bounce), P(-C.L2 + 20, C.W2 - 10, -bounce)])} fill={PAL.shadow} opacity={0.45 * shadow * (1 - A.fog(Zc))} filter={`url(#${uid}-shf)`} />
    </g>,
  );

  // ---- the wheel wells (dark, seen through the arches), then the four wheels, far ones first
  const wheels = [
    { a: C.axleF, s: 1, front: true },
    { a: C.axleF, s: -1, front: true },
    { a: C.axleR, s: 1, front: false },
    { a: C.axleR, s: -1, front: false },
  ].map((w) => {
    const c = at(fr, w.a, w.s * C.wheelB, C.R);
    const d = Math.hypot(c[0] - eye[0], c[1] - eye[1], c[2] - eye[2]);
    return { ...w, c, d };
  });
  wheels.sort((p, q) => q.d - p.d);
  for (const w of wheels) {
    const wc = at(bfr, w.a, w.s * 150, 74);
    const ring: V3[] = Array.from({ length: 18 }, (_, i) => {
      const t = (i / 18) * Math.PI * 2;
      return add(add(wc, mul(bfr.F, Math.cos(t) * 84)), mul(bfr.Up, Math.sin(t) * 84));
    });
    els.push(<path key={`well${w.a}${w.s}`} d={poly3(A, ring)} fill={T(WELL)} />);
  }
  for (const w of wheels) {
    const st = w.front ? steer : 0;
    const cs = Math.cos(st);
    const sn = Math.sin(st);
    const wf = norm(add(mul(fr.F, cs), mul(fr.Lf, sn)));
    const wl = norm(add(mul(fr.Lf, cs), mul(fr.F, -sn)));
    const ring = (boff: number, rad: number, n = 22): V3[] =>
      Array.from({ length: n }, (_, i) => {
        const t = (i / n) * Math.PI * 2;
        return add(add(add(w.c, mul(wf, Math.cos(t) * rad)), mul(fr.Up, Math.sin(t) * rad)), mul(wl, w.s * boff));
      });
    const outer = ring(21, C.R);
    const inner = ring(-21, C.R);
    const hull = hull2([...outer, ...inner].map((p) => proj(A, p)));
    els.push(<path key={`ty${w.a}${w.s}`} d={polyD(hull)} fill={T(TYRE)} />);
    const nOut = mul(wl, w.s);
    if (facing(A, add(w.c, mul(nOut, 21)), nOut)) {
      els.push(<path key={`sw${w.a}${w.s}`} d={poly3(A, ring(22, C.R * 0.94))} fill={T(TYRE_SIDE)} />);
      els.push(<path key={`hc${w.a}${w.s}`} d={poly3(A, ring(23, C.R * 0.6))} fill={T(HUB)} />);
      // the hubcap's slots and its centre: turn with the wheel (the top moves forward)
      let slots = "";
      for (let k = 0; k < 5; k++) {
        const ph = Math.PI / 2 + (k * 2 * Math.PI) / 5 - roll;
        const p0 = add(add(add(w.c, mul(wf, Math.cos(ph) * C.R * 0.22)), mul(fr.Up, Math.sin(ph) * C.R * 0.22)), mul(wl, w.s * 24));
        const p1 = add(add(add(w.c, mul(wf, Math.cos(ph) * C.R * 0.5)), mul(fr.Up, Math.sin(ph) * C.R * 0.5)), mul(wl, w.s * 24));
        slots += `M${Pt(proj(A, p0))}L${Pt(proj(A, p1))}`;
      }
      els.push(<path key={`sl${w.a}${w.s}`} d={slots} stroke={T("#6F6A5F")} strokeWidth={Math.max(lw, 7 * r)} strokeLinecap="round" />);
      els.push(<path key={`hh${w.a}${w.s}`} d={poly3(A, ring(24, C.R * 0.14, 10))} fill={T("#8F897C")} />);
    }
  }

  // ---- the lower body
  const B = C.belt;
  const frontQ: V3[] = [P(C.L2, -C.W2, C.sill + 2), P(C.L2, C.W2, C.sill + 2), P(C.L2 - 8, C.W2 - 2, 140), P(C.L2 - 8, -C.W2 + 2, 140)];
  const rearQ: V3[] = [P(-C.L2, C.W2, C.sill + 2), P(-C.L2, -C.W2, C.sill + 2), P(-C.L2 + 8, -C.W2 + 2, 146), P(-C.L2 + 8, C.W2 - 2, 146)];
  const frontSeen = facing(A, P(C.L2, 0, 95), fr.F);
  const rearSeen = facing(A, P(-C.L2, 0, 95), mul(fr.F, -1));
  const bumper = (s: number, key: string) => {
    const a0 = s > 0 ? C.L2 - 6 : -C.L2 + 6;
    const a1 = s > 0 ? C.L2 + 13 : -C.L2 - 13;
    const box: V3[][] = [];
    const ins = P((a0 + a1) / 2, 0, 68);
    const y0 = 54;
    const y1 = 82;
    const wb = C.W2 + 3;
    box.push([P(a1, -wb, y0), P(a1, wb, y0), P(a1, wb, y1), P(a1, -wb, y1)]);
    box.push([P(a0, -wb, y1), P(a1, -wb, y1), P(a1, wb, y1), P(a0, wb, y1)]);
    box.push([P(a0, wb, y0), P(a1, wb, y0), P(a1, wb, y1), P(a0, wb, y1)]);
    box.push([P(a0, -wb, y0), P(a1, -wb, y0), P(a1, -wb, y1), P(a0, -wb, y1)]);
    return box.map((q, i) => face3(A, q, ins, CHROME, `${key}${i}`, { tone: tn, lw }));
  };
  if (!frontSeen) els.push(...bumper(1, "bf"));
  if (!rearSeen) els.push(...bumper(-1, "br"));
  const bodyF = (q: V3[], key: string, o: { foot?: number } = {}) => face3(A, q, inBody, mat, key, { tone: tn, lw, foot: o.foot, uid });
  els.push(bodyF(frontQ, "fr", { foot: 0.2 }));
  els.push(bodyF(rearQ, "rr", { foot: 0.2 }));
  // the sides with their wheel arches
  const side = (s: number) => {
    const b = s * C.W2;
    const pts: V3[] = [];
    const arch = (ac: number) => {
      const t0 = Math.PI + 0.22;
      const t1 = -0.22;
      for (let i = 0; i <= 12; i++) {
        const t = lerp(t0, t1, i / 12);
        pts.push(P(ac + Math.cos(t) * 86, b, 70 + Math.sin(t) * 86));
      }
    };
    pts.push(P(-C.L2, b, C.sill + 2));
    arch(C.axleR);
    arch(C.axleF);
    pts.push(P(C.L2, b, C.sill + 2));
    pts.push(P(C.L2 - 8, b - s * 2, 140));
    pts.push(P(165, b, B));
    pts.push(P(-292, b, B + 2));
    pts.push(P(-C.L2 + 8, b - s * 2, 146));
    const n: V3 = mul(fr.Lf, s);
    if (!facing(A, P(0, b, 100), n)) return null;
    return { pts, n, b, s };
  };
  const sides = [side(1), side(-1)].filter((q): q is NonNullable<ReturnType<typeof side>> => !!q);
  for (const sd of sides) {
    // the slab side: lit by its normal, a soft darkening toward the sill
    els.push(face3(A, sd.pts, inBody, mat, `sd${sd.s}`, { tone: tn, lw, foot: 0.28, uid, noCull: true }));
    const b = sd.b + sd.s * 1.5;
    // the chrome rub strip, the door seams and handles, the arch lips
    const strip = line3(A, [P(-C.L2 + 20, b, 104), P(C.axleR - 92, b, 104)]) + line3(A, [P(C.axleR + 92, b, 104), P(C.axleF - 92, b, 104)]) + line3(A, [P(C.axleF + 92, b, 104), P(C.L2 - 20, b, 104)]);
    els.push(<path key={`st${sd.s}`} d={strip} stroke={T(CHROME.lit)} strokeWidth={Math.max(lw, 9 * r)} strokeLinecap="round" opacity={0.9} />);
    const seams = line3(A, [P(165, b, 147), P(165, b, 108), P(160, b, 64), P(150, b, 52)]) + line3(A, [P(-30, b, 147), P(-30, b, 52)]) + line3(A, [P(-200, b, 148), P(-196, b, 110), P(-178, b, 96)]);
    els.push(<path key={`se${sd.s}`} d={seams} stroke={T(mat.dark)} strokeWidth={lw * 0.9} fill="none" opacity={0.7} />);
    const handles = line3(A, [P(-4, b, 132), P(-34, b, 132)]) + line3(A, [P(-176, b, 132), P(-206, b, 132)]);
    els.push(<path key={`hd${sd.s}`} d={handles} stroke={T(CHROME.mid)} strokeWidth={Math.max(lw, 7 * r)} strokeLinecap="round" />);
  }
  // the top: hood, the strip under the greenhouse, the trunk deck
  els.push(bodyF([P(C.L2 - 8, -C.W2 + 2, 140), P(C.L2 - 8, C.W2 - 2, 140), P(165, C.W2, B), P(165, -C.W2, B)], "hood"));
  els.push(bodyF([P(165, -C.W2, B), P(165, C.W2, B), P(-292, C.W2, B + 2), P(-292, -C.W2, B + 2)], "mid"));
  els.push(bodyF([P(-292, -C.W2, B + 2), P(-292, C.W2, B + 2), P(-C.L2 + 8, C.W2 - 2, 146), P(-C.L2 + 8, -C.W2 + 2, 146)], "deck"));
  // the hood's centre crease and its cream rim along the front edge
  if (facing(A, P(300, 0, 146), outward([P(C.L2 - 8, -C.W2 + 2, 140), P(C.L2 - 8, C.W2 - 2, 140), P(165, C.W2, B)], inBody))) {
    els.push(<path key="crease" d={line3(A, [P(C.L2 - 12, 0, 141), P(170, 0, B + 0.5)])} stroke={T(mat.lit)} strokeWidth={lw * 1.2} opacity={0.5} />);
  }
  // front face details: grille, quad headlights; rear: tail lamps, plate
  if (frontSeen) {
    const fa = C.L2 + 0.5;
    const quad = (b0: number, b1: number, h0: number, h1: number, aa = fa): V3[] => [P(aa, b0, h0), P(aa, b1, h0), P(aa - 2, b1, h1), P(aa - 2, b0, h1)];
    els.push(<path key="gr" d={poly3(A, quad(-104, 104, 90, 130))} fill={T(GRILLE)} />);
    let bars = "";
    for (let bb = -90; bb <= 90; bb += 22) bars += line3(A, [P(fa + 0.5, bb, 92), P(fa - 1.5, bb, 128)]);
    els.push(<path key="grb" d={bars} stroke={T(CHROME.mid)} strokeWidth={Math.max(lw * 0.8, 4 * r)} opacity={0.8} />);
    for (const s of [1, -1]) {
      els.push(<path key={`hl${s}a`} d={poly3(A, quad(s * 114, s * 140, 96, 126))} fill={T(LAMP)} />);
      els.push(<path key={`hl${s}b`} d={poly3(A, quad(s * 146, s * 170, 96, 126))} fill={T(LAMP)} />);
    }
    els.push(...bumper(1, "bf"));
  }
  if (rearSeen) {
    const ra = -C.L2 - 0.5;
    const quad = (b0: number, b1: number, h0: number, h1: number): V3[] => [P(ra, b0, h0), P(ra, b1, h0), P(ra + 2, b1, h1), P(ra + 2, b0, h1)];
    for (const s of [1, -1]) els.push(<path key={`tl${s}`} d={poly3(A, quad(s * 108, s * 172, 104, 132))} fill={T(TAIL)} />);
    els.push(<path key="pl" d={poly3(A, quad(-46, 46, 92, 122))} fill={T("#D6CFBD")} />);
    els.push(<path key="tk" d={line3(A, [P(ra, -150, 138), P(ra, 150, 138)])} stroke={T(mat.dark)} strokeWidth={lw} opacity={0.6} />);
    els.push(...bumper(-1, "br"));
  }

  // ---- the greenhouse: windshield, roof, rear window, the sides with the door windows
  const FB = (s: number): V3 => P(165, s * 164, B);
  const FT = (s: number): V3 => P(40, s * 140, C.roof - 2);
  const RT = (s: number): V3 => P(-185, s * 140, C.roof);
  const RB = (s: number): V3 => P(-292, s * 164, B + 2);
  const house = (q: V3[], key: string) => face3(A, q, inHouse, mat, key, { tone: tn, lw });
  const gl = (q: V3[], key: string, n: V3, sky: number) => {
    const c = q.reduce((s0, p) => add(s0, p), [0, 0, 0] as V3);
    if (!facing(A, mul(c, 1 / q.length), n)) return null;
    const g = c01(0.35 + 0.5 * n[1] + 0.25 * -n[0]) * sky;
    return <path key={key} d={poly3(A, q)} fill={T(mixHex(GLASS, GLINT, 0.18 + 0.42 * g))} />;
  };
  const ws: V3[] = [FB(-1), FB(1), FT(1), FT(-1)];
  const roofQ: V3[] = [FT(-1), FT(1), RT(1), RT(-1)];
  const rw: V3[] = [RT(-1), RT(1), RB(1), RB(-1)];
  const nWs = outward(ws, inHouse);
  const nRw = outward(rw, inHouse);
  // the side greenhouses first (they sit behind the windshield / rear window edges)
  for (const s of [1, -1]) {
    const q: V3[] = [FB(s), FT(s), RT(s), RB(s)];
    const n = outward(q, inHouse);
    const c = mul(q.reduce((s0, p) => add(s0, p), [0, 0, 0] as V3), 0.25);
    if (!facing(A, c, n)) continue;
    els.push(house(q, `gs${s}`));
    const bh = (h: number) => s * (164 - (24 * (h - B)) / (C.roof - B));
    const aF = (h: number) => 165 - (125 * (h - B)) / (C.roof - B) - 13;
    const wFront: V3[] = [P(aF(158), bh(158), 158), P(-20, bh(158), 158), P(-20, bh(236), 236), P(aF(236), bh(236), 236)];
    const wRear: V3[] = [P(-42, bh(158), 158), P(-172, bh(158), 158), P(-152, bh(236), 236), P(-42, bh(236), 236)];
    const g1 = gl(wFront, `wf${s}`, n, 1);
    const g2 = gl(wRear, `wr${s}`, n, 1);
    if (g1) els.push(g1);
    if (g2) els.push(g2);
    // a soft glint streak across the front door window
    els.push(
      <path
        key={`gn${s}`}
        d={poly3(A, [P(aF(170) - 20, bh(170), 170), P(aF(170) - 60, bh(170), 170), P(aF(224) - 110, bh(224), 224), P(aF(224) - 70, bh(224), 224)])}
        fill={T(GLINT)}
        opacity={0.35}
      />,
    );
  }
  const wsEl = house(ws, "ws");
  if (wsEl) {
    els.push(wsEl);
    const inset = (q: V3[], f: number) => {
      const c = mul(q.reduce((s0, p) => add(s0, p), [0, 0, 0] as V3), 1 / q.length);
      return q.map((p) => add(c, mul(sub(p, c), f)));
    };
    const g = gl(inset(ws, 0.86), "wsg", nWs, 1.2);
    if (g) els.push(g);
    const iw = inset(ws, 0.86);
    els.push(<path key="wsgl" d={poly3(A, [iw[0], add(iw[0], mul(sub(iw[1], iw[0]), 0.28)), add(iw[3], mul(sub(iw[2], iw[3]), 0.5)), add(iw[3], mul(sub(iw[2], iw[3]), 0.3))])} fill={T(GLINT)} opacity={0.32} />);
  }
  const rwEl = house(rw, "rw");
  if (rwEl) {
    els.push(rwEl);
    const c = mul(rw.reduce((s0, p) => add(s0, p), [0, 0, 0] as V3), 0.25);
    const g = gl(
      rw.map((p) => add(c, mul(sub(p, c), 0.84))),
      "rwg",
      nRw,
      1,
    );
    if (g) els.push(g);
  }
  const rf = house(roofQ, "rf");
  if (rf) {
    els.push(rf);
    // the roof's cream rim on its front and left edges (the light's side)
    els.push(<path key="rrim" d={line3(A, [FT(1), FT(-1)]) + line3(A, [FT(1), RT(1)])} stroke={PAL.cream} strokeWidth={lw * 1.3} opacity={0.4 * (1 - A.fog(Zc))} strokeLinecap="round" />);
  }
  return <g>{els}</g>;
};

/** a convex hull (monotone chain) of 2D points */
export const hull2 = (pts: P2[]): P2[] => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const crs = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && crs(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const upp: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upp.length >= 2 && crs(upp[upp.length - 2], upp[upp.length - 1], q) <= 0) upp.pop();
    upp.push(q);
  }
  return lo.slice(0, -1).concat(upp.slice(0, -1));
};

// ===================================================================================================================
// FENCE POSTS AND BARBED WIRE
// ===================================================================================================================
/** a weathered cedar post (a slightly irregular round post, lit on its left) */
export const CedarPost: React.FC<{ A: AirWorld; X: number; Z: number; H: number; h?: number; w?: number; seed?: number; tone?: Toner }> = ({ A, X, Z, H, h = 250, w = 18, seed = 1, tone }) => {
  if (Z < A.P.zNear + 40) return null;
  const tn: Toner = tone ?? ((hex, z, hh) => A.tone(hex, z, hh));
  const lean = (hash(seed) - 0.5) * 18;
  const a = proj(A, [X, H, Z]);
  const b = proj(A, [X + lean, H + h * (0.94 + 0.08 * hash(seed + 3)), Z]);
  const r = A.P.r(Z);
  const ww = w * r;
  return (
    <g>
      <path d={`M${Pt(a)}L${Pt(b)}`} stroke={tn(CEDAR_POST.mid, Z, H + h / 2)} strokeWidth={ww} strokeLinecap="round" />
      <path d={`M${n2(a[0] - ww * 0.28)},${n2(a[1])}L${n2(b[0] - ww * 0.28)},${n2(b[1])}`} stroke={tn(CEDAR_POST.lit, Z, H + h / 2)} strokeWidth={ww * 0.32} strokeOpacity={0.75} />
      <path d={`M${n2(a[0] + ww * 0.3)},${n2(a[1])}L${n2(b[0] + ww * 0.3)},${n2(b[1])}`} stroke={tn(CEDAR_POST.dark, Z, H + h / 2)} strokeWidth={ww * 0.25} strokeOpacity={0.6} />
    </g>
  );
};
/** posts along a polyline (kit X, Z) every `spacing`, four strands of barbed wire, barbs when close */
export const BarbedFence: React.FC<{ A: AirWorld; pts: [number, number][]; ground: (X: number, Z: number) => number; spacing?: number; seed?: number; tone?: Toner; zMax?: number }> = ({ A, pts, ground, spacing = 900, seed = 1, tone, zMax = 1e12 }) => {
  const tn: Toner = tone ?? ((hex, z, hh) => A.tone(hex, z, hh));
  const zMin = A.P.zNear + 60;
  const posts: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / spacing));
    for (let k = 0; k < n; k++) posts.push([lerp(x0, x1, k / n), lerp(z0, z1, k / n)]);
  }
  posts.push(pts[pts.length - 1]);
  const els: React.ReactNode[] = [];
  const strands = [70, 125, 180, 235];
  for (let i = 0; i < posts.length - 1; i++) {
    const [x0, z0] = posts[i];
    const [x1, z1] = posts[i + 1];
    if (Math.min(z0, z1) < zMin || Math.min(z0, z1) > zMax) continue;
    const zm = (z0 + z1) / 2;
    const g0 = ground(x0, z0);
    const g1 = ground(x1, z1);
    let d = "";
    let barbs = "";
    const r = A.P.r(zm);
    const close = 60 * r * A.k > 9;
    for (const h of strands) {
      // a slight sag between posts
      const q: V3[] = [0, 0.25, 0.5, 0.75, 1].map((t) => [lerp(x0, x1, t), lerp(g0, g1, t) + h - 6 * Math.sin(Math.PI * t), lerp(z0, z1, t)]);
      d += line3(A, q);
      if (close) {
        const L = Math.hypot(x1 - x0, z1 - z0);
        for (let s = 40; s < L - 20; s += 70) {
          const t = s / L;
          const p = proj(A, [lerp(x0, x1, t), lerp(g0, g1, t) + h - 6 * Math.sin(Math.PI * t), lerp(z0, z1, t)]);
          const e = 7 * r;
          barbs += `M${n2(p[0] - e)},${n2(p[1] - e)}L${n2(p[0] + e)},${n2(p[1] + e)}M${n2(p[0] - e)},${n2(p[1] + e)}L${n2(p[0] + e)},${n2(p[1] - e)}`;
        }
      }
    }
    const col = tn("#5E5A52", zm, 150);
    els.push(<path key={`w${i}`} d={d} fill="none" stroke={col} strokeWidth={Math.max(A.lw(0.55), 3.2 * r)} strokeOpacity={0.85} />);
    if (barbs) els.push(<path key={`b${i}`} d={barbs} fill="none" stroke={col} strokeWidth={Math.max(A.lw(0.45), 2.4 * r)} strokeOpacity={0.8} />);
  }
  posts.forEach(([x, z], i) => {
    if (z < zMin || z > zMax) return;
    els.push(<CedarPost key={`p${i}`} A={A} X={x} Z={z} H={ground(x, z)} seed={seed * 31 + i} tone={tn} />);
  });
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE CATTLE GUARD
// ===================================================================================================================
/** the guard's size: along the travel `lHalf`, across the road `wHalf` (local units) */
export const GUARD = { lHalf: 260, wHalf: 400, pipes: 7, pipeR: 8, curb: 34 };
/** a cattle guard centred at (X, Z) on ground H: `across` = the unit (X, Z) along its pipes (the fence line); the
 *  travel runs perpendicular. Two stout cedar corner posts at its ends, each with an H-brace to the next post. */
export const CattleGuard: React.FC<{ A: AirWorld; X: number; Z: number; H: number; across: [number, number]; uid: string; tone?: Toner; part?: "bed" | "posts"; side?: -1 | 1 }> = ({ A, X, Z, H, across, uid, tone, part, side }) => {
  const tn: Toner = tone ?? ((hex, z, hh) => A.tone(hex, z, hh));
  const G = GUARD;
  const u: V3 = [across[0], 0, across[1]];
  const t: V3 = [-across[1], 0, across[0]];
  const P = (ta: number, ua: number, h: number): V3 => [X + t[0] * ta + u[0] * ua, H + h, Z + t[2] * ta + u[2] * ua];
  const els: React.ReactNode[] = [];
  const r = A.P.r(Z);
  if (part !== "posts") {
    // the pit: dark, a little sunken shade toward its edges
    const pit: V3[] = [P(-G.lHalf + G.curb, -G.wHalf, 1), P(G.lHalf - G.curb, -G.wHalf, 1), P(G.lHalf - G.curb, G.wHalf, 1), P(-G.lHalf + G.curb, G.wHalf, 1)];
    els.push(<path key="pit" d={poly3(A, pit)} fill={tn("#2B2722", Z, 0)} />);
    // the side walls of the pit (concrete), seen just inside its ends
    els.push(<path key="pitw" d={poly3(A, [P(-G.lHalf + G.curb, -G.wHalf, 1), P(G.lHalf - G.curb, -G.wHalf, 1), P(G.lHalf - G.curb, -G.wHalf + 26, -30), P(-G.lHalf + G.curb, -G.wHalf + 26, -30)])} fill={tn(CONCRETE.dark, Z, 0)} opacity={0.8} />);
    // the two concrete curbs at the travel ends (low boxes)
    for (const s of [-1, 1]) {
      const a0 = s * (G.lHalf - G.curb);
      const a1 = s * G.lHalf;
      const ins = P((a0 + a1) / 2, 0, 10);
      const box: V3[][] = [
        [P(a0, -G.wHalf - 30, 22), P(a1, -G.wHalf - 30, 22), P(a1, G.wHalf + 30, 22), P(a0, G.wHalf + 30, 22)],
        [P(a1, -G.wHalf - 30, 0), P(a1, G.wHalf + 30, 0), P(a1, G.wHalf + 30, 22), P(a1, -G.wHalf - 30, 22)],
        [P(a0, -G.wHalf - 30, 0), P(a0, G.wHalf + 30, 0), P(a0, G.wHalf + 30, 22), P(a0, -G.wHalf - 30, 22)],
        [P(a0, -G.wHalf - 30, 0), P(a1, -G.wHalf - 30, 0), P(a1, -G.wHalf - 30, 22), P(a0, -G.wHalf - 30, 22)],
        [P(a0, G.wHalf + 30, 0), P(a1, G.wHalf + 30, 0), P(a1, G.wHalf + 30, 22), P(a0, G.wHalf + 30, 22)],
      ];
      box.forEach((q, i) => els.push(face3(A, q, ins, CONCRETE, `cb${s}${i}`, { tone: tn, lw: A.lw(0.6) })));
    }
    // the pipes, across the travel, each a round steel pipe: a mid body, a lit top line, a dark underside line
    let body = "";
    let lit = "";
    let dark = "";
    for (let i = 0; i < G.pipes; i++) {
      const ta = lerp(-G.lHalf + G.curb + 20, G.lHalf - G.curb - 20, i / (G.pipes - 1));
      body += line3(A, [P(ta, -G.wHalf - 18, 20), P(ta, G.wHalf + 18, 20)]);
      lit += line3(A, [P(ta - 3, -G.wHalf - 14, 26), P(ta - 3, G.wHalf + 14, 26)]);
      dark += line3(A, [P(ta + 4, -G.wHalf - 14, 12), P(ta + 4, G.wHalf + 14, 12)]);
    }
    els.push(<path key="pd" d={dark} stroke={tn(STEEL.dark, Z, 20)} strokeWidth={Math.max(A.lw(0.5), G.pipeR * 1.5 * r)} strokeLinecap="round" />);
    els.push(<path key="pb" d={body} stroke={tn(STEEL.mid, Z, 20)} strokeWidth={Math.max(A.lw(0.6), G.pipeR * 2 * r)} strokeLinecap="round" />);
    els.push(<path key="pl" d={lit} stroke={tn(STEEL.lit, Z, 24)} strokeWidth={Math.max(A.lw(0.4), G.pipeR * 0.8 * r)} strokeLinecap="round" strokeOpacity={0.85} />);
  }
  if (part !== "bed") {
    // the corner posts (stout), each braced to a line post with a horizontal rail
    const posts: { ua: number; h: number; w: number }[] = [];
    const sides = side ? [side] : [-1, 1];
    for (const s of sides) {
      posts.push({ ua: s * (G.wHalf + 60), h: 330, w: 34 });
      posts.push({ ua: s * (G.wHalf + 60 + 640), h: 290, w: 26 });
    }
    posts.sort((p, q) => P(0, q.ua, 0)[2] - P(0, p.ua, 0)[2]);
    for (const s of sides) {
      const a = P(0, s * (G.wHalf + 60), 230);
      const b = P(0, s * (G.wHalf + 60 + 640), 230);
      els.push(<path key={`br${s}`} d={line3(A, [a, b])} stroke={tn(CEDAR_POST.mid, a[2], 230)} strokeWidth={Math.max(A.lw(0.6), 14 * r)} strokeLinecap="round" />);
      els.push(<path key={`bw${s}`} d={line3(A, [P(0, s * (G.wHalf + 60), 30), P(0, s * (G.wHalf + 60 + 640), 230)])} stroke={tn("#5E5A52", a[2], 150)} strokeWidth={Math.max(A.lw(0.4), 3 * r)} />);
    }
    posts.forEach((p, i) => {
      const q = P(0, p.ua, 0);
      els.push(<CedarPost key={`cp${i}`} A={A} X={q[0]} Z={q[2]} H={q[1]} h={p.h} w={p.w} seed={i + 7} tone={tn} />);
    });
  }
  void uid;
  return <g>{els}</g>;
};

// ===================================================================================================================
// DUST
// ===================================================================================================================
export type Puff = { X: number; Z: number; H: number; age: number; seed: number };
/** soft caliche dust puffs: each grows and thins with its age (frames); drawn as blurred ellipses */
export const DustPuffs: React.FC<{ A: AirWorld; puffs: Puff[]; uid: string; life?: number; amount?: number }> = ({ A, puffs, uid, life = 40, amount = 1 }) => {
  if (!puffs.length) return null;
  const els: React.ReactNode[] = [];
  const sorted = puffs.slice().sort((a, b) => b.Z - a.Z);
  sorted.forEach((p, i) => {
    if (p.Z < A.P.zNear + 80) return;
    const u = c01(p.age / life);
    const op = amount * 0.42 * Math.pow(1 - u, 1.4) * Math.min(1, p.age / 3 + 0.3) * (1 - A.fog(p.Z) * 0.7);
    if (op < 0.01) return;
    const rad = 90 + 260 * Math.sqrt(u) + 40 * hash(p.seed);
    const c = proj(A, [p.X + 30 * u, p.H + 40 + 110 * u, p.Z]);
    const r = A.P.r(p.Z);
    els.push(<ellipse key={i} cx={c[0]} cy={c[1]} rx={rad * r} ry={rad * r * 0.62} fill={A.tone(mixHex("#D9CFB5", "#C8BC9C", hash(p.seed + 2)), p.Z, p.H + 100)} opacity={op} />);
  });
  return (
    <g filter={`url(#${uid}-df)`}>
      <defs>
        <filter id={`${uid}-df`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={n2(Math.max(0.5, 26 * A.P.r(sorted[Math.floor(sorted.length / 2)].Z)))} />
        </filter>
      </defs>
      {els}
    </g>
  );
};
