// ---------------------------------------------------------------------------
// sugarCDData: places and routes for cuts C (DownAPeg) and D (GlobalWar) of the
// SarahWar clip "Britain let America go to keep its sugar islands", as
// [lon, lat] (deg E, deg N). Every figure, date and source URL is in
// <clip>/animation_source/notes/CD_FACTS.md; waypoints marked PLAUSIBLE there
// are shortest sea/land paths the sources do not give.
// ---------------------------------------------------------------------------
export type LL = [number, number];

export const PLACES = {
  london: [-0.128, 51.507],
  paris: [2.352, 48.857],
  philadelphia: [-75.164, 39.952],
  hague: [4.3, 52.078],
  savannah: [-81.09, 32.08],
  tybee: [-80.85, 32.0],
  newOrleans: [-90.063, 29.957],
  fortBute: [-91.1369, 30.3236],
  batonRouge: [-91.133, 30.45],
  brest: [-4.49, 48.39],
  plymouth: [-4.14, 50.37],
  isleOfWight: [-1.3, 50.67],
  spithead: [-1.1, 50.76],
  ushantBattle: [-7.3828, 48.5603],
  gibraltar: [-5.3551, 36.1397],
  cadiz: [-6.29, 36.53],
  mahon: [4.26, 39.89],
  mesquida: [4.28, 39.91],
  portoPraya: [-23.5049, 14.9073],
  pondicherry: [79.8339, 11.9342],
  madras: [80.29, 13.08],
  mahe: [75.53, 11.7],
  tellicherry: [75.49, 11.75],
} satisfies Record<string, LL>;

/** the Spanish lines across the isthmus: Fort San Felipe (W shore) -> Fort Santa Barbara (E shore) */
export const GIB_LINE: LL[] = [
  [-5.364, 36.158],
  [-5.353, 36.159],
  [-5.343, 36.156],
];

export const ROUTES = {
  /** C: the tie, the colonies (Congress at Philadelphia) -> Paris; a diplomatic tie, drawn as an arc */
  tie: [
    [-75.164, 39.952],
    [-60, 44.2],
    [-45, 47.0],
    [-30, 48.6],
    [-18, 49.4],
    [-8, 49.4],
    [-3.0, 49.2],
    [2.352, 48.857],
  ],
  /** C: Britain declares war on the Dutch, London -> The Hague (symbolic, across the southern North Sea) */
  dutch: [
    [-0.128, 51.507],
    [1.6, 51.75],
    [3.2, 51.98],
    [4.3, 52.078],
  ],
  /** D1: d'Estaing's last leg, from the open sea east of the Bahamas past Tybee to Savannah
   *  (he sailed from Cap-Francais; the open-sea points are PLAUSIBLE) */
  savannah: [
    [-74.0, 24.6],
    [-75.5, 26.5],
    [-79.0, 30.5],
    [-80.4, 31.75],
    [-80.75, 31.98],
    [-80.85, 32.0],
    [-81.09, 32.08],
  ],
  /** D2: Galvez, New Orleans up the Mississippi -> Fort Bute -> Baton Rouge (river bends approx.) */
  louisiana: [
    [-90.063, 29.957],
    [-90.25, 29.99],
    [-90.55, 30.05],
    [-90.83, 30.02],
    [-90.99, 30.1],
    [-91.08, 30.2],
    [-91.1369, 30.3236],
    [-91.133, 30.45],
  ],
  /** D3: the Armada of 1779, Brest -> past Ushant -> up-Channel -> off Plymouth, heading for the
   *  Isle of Wight, where it stopped (DASHED) */
  armada: [
    [-4.49, 48.39],
    [-5.3, 48.55],
    [-5.25, 49.15],
    [-4.6, 49.75],
    [-3.9, 50.08],
  ],
  /** D4: Keppel out of Spithead down-Channel to the battle (intermediate points PLAUSIBLE) */
  ushantBritish: [
    [-1.1, 50.76],
    [-3.0, 50.0],
    [-5.3, 49.8],
    [-6.6, 49.0],
    [-7.3828, 48.5603],
  ],
  /** D4: d'Orvilliers out of Brest past Ushant to the battle */
  ushantFrench: [
    [-4.49, 48.39],
    [-5.4, 48.45],
    [-6.5, 48.5],
    [-7.3828, 48.5603],
  ],
  /** D5: Crillon's fleet (out of Cadiz 23 Jul 1781, sheltered near Cartagena) from off Cartagena
   *  -> Mesquida (open-sea points PLAUSIBLE) */
  menorca: [
    [-0.98, 37.45],
    [0.5, 37.9],
    [3.2, 39.1],
    [4.2, 39.6],
    [4.42, 39.85],
    [4.33, 39.93],
    [4.28, 39.91],
  ],
  /** D6: Suffren, sailing south from Brest, onto Porto Praya out of the north (PLAUSIBLE approach) */
  portoPraya: [
    [-22.75, 18.7],
    [-23.15, 16.8],
    [-23.45, 15.3],
    [-23.5049, 14.9073],
  ],
  /** D7: Munro, Madras overland down the coast -> Pondicherry */
  pondicherry: [
    [80.29, 13.08],
    [80.19, 12.62],
    [79.98, 12.25],
    [79.8339, 11.9342],
  ],
  /** D7: Braithwaite onto Mahe from the sea (PLAUSIBLE: the sources give no route) */
  mahe: [
    [72.9, 12.95],
    [74.0, 12.35],
    [74.9, 11.9],
    [75.53, 11.7],
  ],
} satisfies Record<string, LL[]>;
