// ---------------------------------------------------------------------------
// The world the "three secret AI societies" cuts share.
//
// These graphics are cut into one edit seconds apart and one of them opens on
// the other's last frame, so every number that decides where something sits has
// to live in one place. None of it is visible inside a single piece; all of it
// is visible in a row.
// ---------------------------------------------------------------------------

export type P = { x: number; y: number };

export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export const WORLD_W = 1080;
export const WORLD_H = 3400;

export const SURFACE_Y = 1440;
export const SURFACE_HALF = 470;
export const GROUNDS = [2600, 2220, 1840]; // first society lowest, third highest
export const GROUND_HALF = 400;

// Each society is tighter and more heavily threaded than the one before it.
// The population shrinks — some of it stays on the floor as ash — so the
// organisation has to come from density, not from headcount.
export const SOC_W = [700, 640, 580];
export const SOC_H = [170, 158, 146];
export const CLEAR = 58; // gap between the lowest crowd row and its own floor
export const ROWS = 4;

// One population, conserved. Nothing new ever enters the frame — each society
// is built out of the previous one's dead, minus the ones left lying on the
// floor as ash. 34 -> 28 -> 22.
export const POP = 34;
export const LEFT_BEHIND = 6;
export const COUNTS = [POP, POP - LEFT_BEHIND, POP - 2 * LEFT_BEHIND];

// A crowd, not a lattice: each dot is thrown off its cell by up to 90% of the
// step and its radius varied, so the population reads as organic.
const layout = (gen: number): P[] => {
  const count = COUNTS[gen];
  const cols = Math.ceil(count / ROWS);
  const sx = SOC_W[gen] / cols;
  const sy = SOC_H[gen] / ROWS;
  const top = GROUNDS[gen] - CLEAR - SOC_H[gen];
  const pts: P[] = [];
  for (let s = 0; s < count; s++) {
    pts.push({
      x:
        540 -
        SOC_W[gen] / 2 +
        ((s % cols) + 0.5) * sx +
        (hash(s, 11 + gen) - 0.5) * sx * 0.9,
      y: top + (Math.floor(s / cols) + 0.5) * sy + (hash(s, 23 + gen) - 0.5) * sy * 0.9,
    });
  }
  return pts;
};
export const SLOTS = [layout(0), layout(1), layout(2)];

// Who dies where is drawn from a shuffled roll rather than an index range, so
// the ash left on a floor is scattered through the crowd's whole width instead
// of piling up in whichever corner held the lowest indices. Survivors are then
// shuffled again into their new slots, so the arcs cross on the way up rather
// than everyone rising in their own column.
export const ROLL = Array.from({ length: POP }, (_, i) => i).sort(
  (a, b) => hash(a, 91) - hash(b, 91),
);
const survivors = (from: number) =>
  ROLL.slice(from).sort((a, b) => hash(a, 5 + from) - hash(b, 5 + from));
export const TRAVEL = [survivors(LEFT_BEHIND), survivors(2 * LEFT_BEHIND)];
export const SLOT_OF: Map<number, number>[] = TRAVEL.map((ids) => {
  const m = new Map<number, number>();
  ids.forEach((id, s) => m.set(id, s));
  return m;
});
// Which dot is standing in slot `s` of generation `g`.
export const dotInSlot = (g: number, s: number) => (g === 0 ? s : TRAVEL[g - 1][s]);

// Ash lies in a loose band on the floor it died on, spread wider than the
// crowd was so a dead floor still reads as a floor with something on it.
export const ashRest = (i: number, gen: number): P => ({
  x: SLOTS[gen][gen === 0 ? i : (SLOT_OF[gen - 1].get(i) as number)].x + (hash(i, 45) - 0.5) * 96,
  y: GROUNDS[gen] - 9 - hash(i, 47) * 16,
});

// Threads between near neighbours. The crowd shrinks each time but binds itself
// harder: 16 -> 22 -> 28 threads.
export const THREAD_COUNTS = [16, 22, 28];
export type Thread = { a: number; b: number; k: number };
const threadsFor = (g: number): Thread[] => {
  const p = SLOTS[g];
  const cand: Thread[] = [];
  for (let a = 0; a < p.length; a++) {
    for (let b = a + 1; b < p.length; b++) {
      if (Math.hypot(p[a].x - p[b].x, p[a].y - p[b].y) < 155) {
        cand.push({ a, b, k: hash(a * 97 + b, 71 + g) });
      }
    }
  }
  cand.sort((x, y) => x.k - y.k);
  return cand.slice(0, THREAD_COUNTS[g]);
};
export const THREADS = [threadsFor(0), threadsFor(1), threadsFor(2)];

// Where each wipe came to rest, under the floor it killed.
export const LID_DROP = 15;

export const BG_OVERSIZE = 1.8;

export const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
