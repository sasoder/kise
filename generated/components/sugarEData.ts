// ---------------------------------------------------------------------------
// sugarEData: the sea routes of cut E (KeepTheCaribbean) of the SarahWar clip
// "Britain let America go to keep its sugar islands", as [lon, lat] (deg E, deg N).
// Facts + URLs: <clip>/animation_source/notes/E_FACTS.md.
//  trunk  New York harbour (the enclave, B) -> the Narrows -> Sandy Hook -> south,
//         offshore of Cape Hatteras -> the open Atlantic east of the Bahamas, where the
//         column splits. (New York = the embarkation port of Grant's 5,000, 4 Nov 1778,
//         and of the 1782-83 withdrawals.) Its first point lies inland behind the
//         harbour only so the compact body has route behind its centre at lift-off.
//  west   -> Jamaica: the Caicos Passage, the Windward Passage (Cuba / Saint-Domingue),
//         round Morant Point to Port Royal / Kingston.
//  east   -> the Leewards + Barbados: outside the Antilles to Antigua (English Harbour,
//         the Leeward station) and on, east of French Guadeloupe and Martinique, to
//         Carlisle Bay, Barbados (Grant's route: Sandy Hook -> Barbados, 10 Dec 1778).
// Waypoints are plausible sail-era sea paths (the sources give ports, not tracks);
// scripts/build-sugarE-islands.mjs checks their clearance from Natural Earth 10m land.
// ---------------------------------------------------------------------------
export type LL = [number, number];

export const ROUTES_LL = {
  trunk: [[-74.13, 40.98], [-74.05, 40.66], [-74.04, 40.58], [-73.95, 40.44], [-73.2, 39.3], [-73.9, 35.4], [-72.7, 31.0], [-71.3, 27.4]],
  west: [[-72.55, 22.0], [-73.25, 20.72], [-73.85, 19.98], [-75.2, 18.35], [-75.95, 17.72], [-76.6, 17.84], [-76.84, 17.93]],
  east: [[-66.6, 22.9], [-62.3, 18.0], [-61.45, 17.05], [-60.6, 16.3], [-59.8, 14.6], [-59.7, 13.45], [-59.64, 13.1]],
} satisfies Record<string, LL[]>;

/** where the islands' garrisons settle (Port Royal / Kingston, English Harbour, Carlisle Bay) */
export const PORTS_LL = {
  portRoyal: [-76.84, 17.93],
  englishHarbour: [-61.76, 17.0],
  carlisleBay: [-59.62, 13.08],
} satisfies Record<string, LL>;
