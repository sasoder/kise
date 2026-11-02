// nuclearFacts: every displayed fact of scott-nolan-uranium comes from here, filled by the director from the blind
// fact-check (full summary: FACT_CHECK.md in the clip's animation_source/notes/).

/** ISO 3166-1 alpha-2 codes of the countries that have enriched uranium. NumberOfCountries reads only this array. */
export const ENRICHMENT_COUNTRIES: readonly string[] = ["US", "RU", "GB", "FR", "CN", "DE", "NL", "JP", "BR", "PK", "IN", "IR", "KP", "ZA", "AR"];

/**
 * Enrichment capacity, million SWU per year. Source: WNA "Uranium Enrichment" page updated 27 Oct 2026, citing Nuclear
 * Fuel Report 2025, 2025 figures. Europe = Urenco's Almelo, Gronau and Capenhurst (17.3 minus Eunice 4.3) + Orano 7.5.
 * China is WNA's assumption, not measured.
 */
export const CAPACITY_MSWU = { russia: 29.133, europe: 20.5, china: 13.789 } as const;

/** Checker's estimate for Centrus's 16-machine Piketon cascade; no number goes on screen. */
export const US_OWNED_MSWU = 0.04;

/** DOE Paducah Site, approximate. For cut D. */
export const PADUCAH = { lat: 37.08, lon: -88.68 } as const;
