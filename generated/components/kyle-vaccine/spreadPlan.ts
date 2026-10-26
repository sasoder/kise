// ---------------------------------------------------------------------------
// spreadPlan: the plum spread of SpreadsForACentury (kyle-vaccine, cut 53) as data. Pure (no React).
//
// The practice (variolation, SMALLPOX plum) travels along TRAILS: each a chain of real towns (lon/lat) whose front
// moves at a constant speed between its start and end frames, so each town's arrival frame is its arclength share of
// the trail. A trail that leaves a town of another trail starts at (or after) that town's arrival (cause first: the
// stain is already there). A town's ink dot spreads when the trail's tip reaches it; its stain disc grows round it.
// Everything here is world px (spreadMapData.project); the ground shader (spreadGround.tsx) draws it.
//
// SOURCES (verified history; no years on screen): variolation documented in China by the 16th c. (nasal
// insufflation of powdered scabs), the line comes in along the Silk Road (Samarkand, Bukhara, Merv, Nishapur, Rey,
// Tabriz) and the Ottoman caravan road (Erzurum, Erzincan, Sivas, Tokat, Amasya, Tosya, Bolu, Izmit) to Constantinople;
// Smyrna (Pylarini's report, 1714) and Aleppo on branches. West Africa (Onesimus, an enslaved West African man in
// Boston, described it to Cotton Mather, 1721): the Akan / Hausa lands (Kumasi, Ouagadougou, Djenne, Timbuktu, Gao,
// Old Oyo, Zaria, Kano, Katsina, Sokoto), north over the trans-Saharan roads (Agadez, Ghat, Murzuq -> Tripoli;
// Taoudenni, Sijilmasa -> Fez) to the Ottoman regencies (Tripoli, Tunis, Algiers). Lady Mary Wortley Montagu saw it in
// Constantinople (letter of 1 April 1717), had her son inoculated there (1718) and her daughter in London (1721); the
// trail across Europe follows her 1716-17 road (London, Rotterdam, Cologne, Frankfurt, Nuremberg, Regensburg, Vienna,
// Buda, Belgrade, Sofia, Plovdiv, Adrianople, Constantinople), drawn the other way. From London it spread over Britain
// (the Suttons at Ingatestone, Essex, 1760s) and Europe (Paris, Geneva, The Hague, Hanover, Berlin, Copenhagen,
// Stockholm...). Jenner: BERKELEY, Gloucestershire (2.46 W, 51.69 N), 14 May 1796, the first vaccination (cowpox).
// Town coordinates: their modern centres (Wikipedia / GeoNames), to 0.01 deg.
// ---------------------------------------------------------------------------
import { project } from "./spreadMapData";
import { BANDS, DURATION, camAt, toScreen } from "./spreadCamera";

export type Town = [name: string, lon: number, lat: number, size?: number];
/** a trail: its towns, start / end frames of its front, the stain half-width w of the trail and the town stain R */
export type Trail = { id: string; from?: string; t0: number; t1: number; w: number; R: number; towns: Town[] };

// sizes: 1.3 the named hubs, 1.15 Berkeley, 1 a town, 0.8 a small station
export const TRAILS: Trail[] = [
  // ---- the African source, already inked at f0 ----
  { id: "w1", t0: -70, t1: -26, w: 88, R: 168, towns: [["Kumasi", -1.62, 6.69], ["Ouagadougou", -1.52, 12.37], ["Djenne", -4.55, 13.9], ["Timbuktu", -3.0, 16.77]] },
  { id: "w2", t0: -64, t1: -22, w: 88, R: 168, towns: [["Old Oyo", 4.13, 8.93], ["Zaria", 7.7, 11.1], ["Kano", 8.52, 12.0], ["Katsina", 7.6, 13.0]] },
  { id: "w3", from: "Kumasi", t0: -60, t1: -40, w: 80, R: 154, towns: [["Kumasi", -1.62, 6.69], ["Abomey", 1.99, 7.18], ["Old Oyo", 4.13, 8.93]] },
  { id: "w4", from: "Timbuktu", t0: -26, t1: -10, w: 80, R: 154, towns: [["Timbuktu", -3.0, 16.77], ["Gao", -0.04, 16.27]] },
  { id: "w5", from: "Katsina", t0: -22, t1: -12, w: 80, R: 154, towns: [["Katsina", 7.6, 13.0], ["Sokoto", 5.24, 13.06]] },
  // ---- the line from China, coming in at the frame's east edge (its tip at Erzurum on f0) ----
  { id: "e0", t0: -96, t1: 0, w: 76, R: 140, towns: [["Samarkand", 66.97, 39.65], ["Bukhara", 64.42, 39.77], ["Merv", 61.84, 37.66], ["Mashhad", 59.6, 36.3], ["Nishapur", 58.8, 36.2], ["Rey", 51.43, 35.6], ["Qazvin", 50.0, 36.27], ["Tabriz", 46.29, 38.08], ["Erzurum", 41.27, 39.9]] },
  // ---- f0 on: west across Anatolia to Constantinople ----
  { id: "e1", from: "Erzurum", t0: 0, t1: 22, w: 42, R: 119, towns: [["Erzurum", 41.27, 39.9], ["Erzincan", 39.49, 39.75], ["Sivas", 37.02, 39.75], ["Tokat", 36.55, 40.31], ["Amasya", 35.83, 40.65], ["Tosya", 34.04, 41.01], ["Bolu", 31.6, 40.73], ["Izmit", 29.92, 40.77], ["Constantinople", 28.98, 41.01, 1.3]] },
  { id: "e2", from: "Sivas", t0: 10, t1: 26, w: 35, R: 98, towns: [["Sivas", 37.02, 39.75], ["Kayseri", 35.48, 38.73], ["Konya", 32.48, 37.87], ["Afyon", 30.54, 38.76], ["Smyrna", 27.14, 38.42]] },
  { id: "e3", from: "Tabriz", t0: 3, t1: 24, w: 35, R: 98, towns: [["Tabriz", 46.29, 38.08], ["Mosul", 43.13, 36.34], ["Urfa", 38.79, 37.16], ["Aleppo", 37.16, 36.2]] },
  // ---- up from West Africa over the Sahara ----
  { id: "n1", from: "Kano", t0: -10, t1: 26, w: 42, R: 119, towns: [["Kano", 8.52, 12.0], ["Agadez", 7.99, 16.97], ["Ghat", 10.17, 24.96], ["Murzuq", 13.92, 25.92], ["Tripoli", 13.19, 32.89]] },
  { id: "n2", from: "Timbuktu", t0: 4, t1: 30, w: 42, R: 119, towns: [["Timbuktu", -3.0, 16.77], ["Taoudenni", -3.98, 22.68], ["Sijilmasa", -4.27, 31.28], ["Fez", -5.0, 34.03]] },
  { id: "n3", from: "Tripoli", t0: 28, t1: 31, w: 35, R: 98, towns: [["Tripoli", 13.19, 32.89], ["Tunis", 10.18, 36.8], ["Algiers", 3.06, 36.75]] },
  // ---- Constantinople across Europe to London (Lady Mary's road, the other way) ----
  { id: "c1", from: "Constantinople", t0: 22, t1: 49, w: 21, R: 56, towns: [["Constantinople", 28.98, 41.01, 1.3], ["Adrianople", 26.56, 41.68], ["Plovdiv", 24.75, 42.15], ["Sofia", 23.32, 42.7], ["Nis", 21.9, 43.32], ["Belgrade", 20.46, 44.82], ["Buda", 19.04, 47.5], ["Vienna", 16.37, 48.21], ["Linz", 14.29, 48.31], ["Regensburg", 12.1, 49.02], ["Nuremberg", 11.08, 49.45], ["Frankfurt", 8.68, 50.11], ["Cologne", 6.96, 50.94], ["Rotterdam", 4.48, 51.92], ["London", -0.13, 51.51, 1.3]] },
  { id: "c2", from: "Vienna", t0: 36, t1: 41, w: 17, R: 43, towns: [["Vienna", 16.37, 48.21], ["Venice", 12.33, 45.44]] },
  { id: "c3", from: "Frankfurt", t0: 42, t1: 52, w: 17, R: 43, towns: [["Frankfurt", 8.68, 50.11], ["Metz", 6.18, 49.12], ["Reims", 4.03, 49.26], ["Paris", 2.35, 48.86]] },
  // ---- from London: the last stations of the old trick, Berkeley the last ----
  { id: "l1", from: "London", t0: 49, t1: 62, w: 8, R: 28, towns: [["London", -0.13, 51.51, 1.3], ["Reading", -0.97, 51.45, 0.8], ["Oxford", -1.26, 51.75], ["Gloucester", -2.24, 51.86], ["Berkeley", -2.46, 51.69, 1.15]] },
  { id: "l2", from: "London", t0: 50, t1: 60, w: 8, R: 28, towns: [["London", -0.13, 51.51, 1.3], ["Hertford", -0.08, 51.8, 0.8], ["Cambridge", 0.12, 52.2], ["Norwich", 1.3, 52.63]] },
  { id: "l3", from: "London", t0: 50, t1: 58, w: 8, R: 28, towns: [["London", -0.13, 51.51, 1.3], ["Ingatestone", 0.38, 51.67, 0.8], ["Colchester", 0.9, 51.89], ["Ipswich", 1.15, 52.06, 0.8]] },
  { id: "l4", from: "Oxford", t0: 56, t1: 92, w: 8, R: 28, towns: [["Oxford", -1.26, 51.75], ["Northampton", -0.9, 52.24, 0.8], ["Leicester", -1.13, 52.64], ["Nottingham", -1.15, 52.95, 0.8], ["York", -1.08, 53.96], ["Newcastle", -1.61, 54.97], ["Edinburgh", -3.19, 55.95]] },
  { id: "l5", from: "Gloucester", t0: 60, t1: 96, w: 8, R: 28, towns: [["Gloucester", -2.24, 51.86], ["Worcester", -2.22, 52.19, 0.8], ["Birmingham", -1.9, 52.48], ["Chester", -2.89, 53.19], ["Dublin", -6.26, 53.35]] },
  { id: "l6", from: "Reading", t0: 52, t1: 64, w: 8, R: 28, towns: [["Reading", -0.97, 51.45, 0.8], ["Salisbury", -1.79, 51.07], ["Exeter", -3.53, 50.72], ["Plymouth", -4.14, 50.38, 0.8]] },
  // ---- from London over the near continent ----
  { id: "l7", from: "London", t0: 50, t1: 56, w: 9, R: 29, towns: [["London", -0.13, 51.51, 1.3], ["Dover", 1.31, 51.13, 0.8], ["Calais", 1.86, 50.95, 0.8], ["Amiens", 2.3, 49.89]] },
    { id: "l9", from: "Amiens", t0: 56, t1: 60, w: 9, R: 29, towns: [["Amiens", 2.3, 49.89], ["Rouen", 1.1, 49.44]] },
  { id: "l10", from: "Rotterdam", t0: 48, t1: 60, w: 9, R: 29, towns: [["Rotterdam", 4.48, 51.92], ["Antwerp", 4.4, 51.22], ["Brussels", 4.35, 50.85], ["Lille", 3.06, 50.63]] },
  { id: "l11", from: "Rotterdam", t0: 48, t1: 92, w: 12, R: 35, towns: [["Rotterdam", 4.48, 51.92], ["The Hague", 4.3, 52.08, 0.8], ["Amsterdam", 4.9, 52.37], ["Hanover", 9.73, 52.37], ["Berlin", 13.4, 52.52], ["Copenhagen", 12.57, 55.68], ["Stockholm", 18.07, 59.33]] },
];

// ---------------------------------------------------------------------------
// derived: towns (deduplicated by name, first arrival wins) and segments
// ---------------------------------------------------------------------------
export type Dot = { name: string; x: number; z: number; arrive: number; size: number; R: number };
export type Seg = { trail: string; x0: number; z0: number; x1: number; z1: number; a0: number; a1: number; w: number };

/** town stain radii that override their trails' (London and Rotterdam sit in the end frame among Britain's small stains) */
const R_OVERRIDE: Record<string, number> = { London: 35, Rotterdam: 32 };
const build = () => {
  const dots = new Map<string, Dot>();
  const segs: Seg[] = [];
  for (const t of TRAILS) {
    const pts = t.towns.map(([, lon, lat]) => project(lon, lat));
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1];
    // a trail that leaves another trail's town starts no earlier than the stain's arrival there (cause first)
    let t0 = t.t0;
    if (t.from) {
      const src = dots.get(t.from);
      if (!src) throw new Error(`spreadPlan: trail ${t.id} leaves ${t.from}, which no earlier trail reaches`);
      if (t.towns[0][0] !== t.from) throw new Error(`spreadPlan: trail ${t.id} must start at ${t.from}`);
      t0 = Math.max(t0, src.arrive);
    }
    if (t.t1 <= t0) throw new Error(`spreadPlan: trail ${t.id} ends (f${t.t1}) before it starts (f${t0.toFixed(1)})`);
    const at = (i: number) => t0 + ((t.t1 - t0) * cum[i]) / L;
    t.towns.forEach(([name, , , size = 1], i) => {
      const a = at(i);
      const prev = dots.get(name);
      if (!prev || a < prev.arrive) dots.set(name, { name, x: pts[i][0], z: pts[i][1], arrive: prev ? Math.min(prev.arrive, a) : a, size: prev ? Math.max(prev.size, size) : size, R: prev ? Math.max(prev.R, t.R) : t.R });
    });
    for (let i = 1; i < pts.length; i++) segs.push({ trail: t.id, x0: pts[i - 1][0], z0: pts[i - 1][1], x1: pts[i][0], z1: pts[i][1], a0: at(i - 1), a1: at(i), w: t.w });
  }
  // the hubs' own stains stay town-sized (the trail's width carries the spread)
  for (const [name, R] of Object.entries(R_OVERRIDE)) {
    const d = dots.get(name);
    if (d) d.R = R;
  }
  return { dots: [...dots.values()], segs };
};
export const PLAN = build();
export const DOTS = PLAN.dots;
export const SEGS = PLAN.segs;
export const dotOf = (name: string) => {
  const d = DOTS.find((q) => q.name === name);
  if (!d) throw new Error(`spreadPlan: no town ${name}`);
  return d;
};

// ---------------------------------------------------------------------------
// growth laws (the shader uses the same numbers: spreadGround.tsx)
// ---------------------------------------------------------------------------
/** a town's ink dot spreads over INK_T frames from the tip's arrival */
export const INK_T = 8;
/** a town's stain disc: grows over STAIN_T frames, then keeps creeping slowly */
export const STAIN_T = 16;
/** the dot's world radius: base * size * (D / D1)^0.6 (screen-steady-ish under the long descent, as lw() does) */
export const DOT_R = 8.4;

// ---------------------------------------------------------------------------
// the orange: at the Berkeley dot, kindling on "Jenner" (first lit frame f71), a soft glow by "discovered" (f87)
// ---------------------------------------------------------------------------
export const BERKELEY = dotOf("Berkeley");
export const KINDLE = { f0: 70, f1: 87 };

// ---------------------------------------------------------------------------
// the two labels: AFRICA over the West African source, FROM / CHINA (stacked) ON the incoming line, a little west of
// where it enters the frame (FROM keeps that honest: the line comes from China, off the map to the east). They lie on the
// ground (world space) and slide up while fading in on f0-f10; each sinks back into the air (slides down, fades)
// before the camera's move would carry it into a caption band or out of the frame (state from its screen position).
// ---------------------------------------------------------------------------
/** size: the font size in screen px at f0 (caps ~0.43 of it, ~34-36 px; the label is world space: it scales with the camera after) */
export type GLabel = { text: string; pre?: string; lon: number; lat: number; size: number };
export const LABELS: GLabel[] = [
  { text: "AFRICA", lon: 6.5, lat: 28, size: 84 },
  { text: "CHINA", pre: "FROM", lon: 33, lat: 41.0, size: 78 },
];

// ---------------------------------------------------------------------------
// checks (run by the cut's check script; cheap enough to run at module load in dev)
// ---------------------------------------------------------------------------
export const BAND_PAD = 8;
const inBandY = (y: number) => BANDS.some(([a, b]) => y > a - BAND_PAD && y < b + BAND_PAD);
/** every leading-edge event (a trail tip moving, a dot inking) that sits in a caption band on its frame */
export const bandReport = () => {
  const out: string[] = [];
  for (let f = 0; f < DURATION; f++) {
    const cam = camAt(f);
    for (const s of SEGS) {
      if (f < s.a0 || f > s.a1) continue;
      const q = (f - s.a0) / Math.max(1e-6, s.a1 - s.a0);
      const p = toScreen(cam, s.x0 + (s.x1 - s.x0) * q, 0, s.z0 + (s.z1 - s.z0) * q);
      if (p.x > -20 && p.x < 1100 && inBandY(p.y)) out.push(`f${f} tip ${s.trail} at (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`);
    }
    for (const d of DOTS) {
      if (f < d.arrive || f > d.arrive + INK_T) continue;
      const p = toScreen(cam, d.x, 0, d.z);
      if (p.x > -20 && p.x < 1100 && inBandY(p.y)) out.push(`f${f} dot ${d.name} at (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`);
    }
  }
  return out;
};
