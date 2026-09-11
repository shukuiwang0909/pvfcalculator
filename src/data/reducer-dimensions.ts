/**
 * ASME B16.9 butt-weld reducer weight data.
 *
 * Base values are catalog-calibrated CONCENTRIC reducer weights (kg, carbon
 * steel A234 WPB at 7,850 kg/m³) for the common large-end × small-end NPS
 * combinations in SCH 40. Other sizes, schedules and types are derived:
 *
 *  - Combinations not in the lookup are extrapolated from the nearest known
 *    combination, scaling with metal volume ∝ large-end NPS².
 *  - SCH 80 / XS walls carry ≈ 1.5 × the SCH 40 metal mass (× 1.5 factor);
 *    SCH STD maps onto SCH 40. Other schedules use an approximate
 *    metal-mass factor relative to SCH 40 (ASME B36.10M ratios).
 *  - Eccentric reducers carry ≈ 6% more metal than a concentric reducer of
 *    the same combination and schedule (× 1.06 factor), consistent with
 *    W_ecc ≈ 0.85 × straight-pipe weight versus W_con ≈ 0.80 ×.
 *
 * End-to-end length is NOT standardized by ASME B16.9; typical manufacturer
 * lengths ≈ the large-end outside diameter and vary by supplier.
 */

import { NPS_LIST, MATERIALS } from './flange-dimensions';

export { NPS_LIST, MATERIALS };

export type ReducerType = 'CON' | 'ECC';

export const REDUCER_TYPES: { id: ReducerType; name: string; desc: string }[] = [
  { id: 'CON', name: 'Concentric Reducer', desc: 'Center lines aligned — the standard reducer for vertical runs and pump suction' },
  { id: 'ECC', name: 'Eccentric Reducer', desc: 'Flat bottom (or top) — keeps the bottom of horizontal pump suction lines level to avoid air pockets' },
];

export const SCHEDULES: { id: string; name: string }[] = [
  { id: 'SCH10',  name: 'SCH 10' },
  { id: 'SCH20',  name: 'SCH 20' },
  { id: 'SCH30',  name: 'SCH 30' },
  { id: 'STD',    name: 'SCH STD' },
  { id: 'SCH40',  name: 'SCH 40' },
  { id: 'SCH60',  name: 'SCH 60' },
  { id: 'SCH80',  name: 'SCH 80' },
  { id: 'XS',     name: 'SCH XS' },
  { id: 'SCH100', name: 'SCH 100' },
  { id: 'SCH120', name: 'SCH 120' },
  { id: 'SCH140', name: 'SCH 140' },
  { id: 'SCH160', name: 'SCH 160' },
  { id: 'XXS',    name: 'SCH XXS' },
];

/**
 * Catalog-calibrated CONCENTRIC reducer weights (kg) — carbon steel,
 * SCH 40. Key = "largeNPS x smallNPS" (e.g. "6x4" = 6″ × 4″).
 */
export const CON_SCH40_KG: Record<string, number> = {
  '0.75x0.5': 0.15,
  '1x0.5':    0.20,
  '1x0.75':   0.18,
  '1.25x1':   0.30,
  '1.5x1':    0.40,
  '2x1':      0.50,
  '2x1.5':    0.45,
  '2.5x2':    0.70,
  '3x2':      0.90,
  '3x2.5':    0.80,
  '4x3':      1.30,
  '4x2':      1.50,
  '6x4':      2.50,
  '6x3':      2.80,
  '8x6':      4.00,
  '8x4':      4.50,
  '10x8':     6.00,
  '10x6':     6.50,
  '12x10':    8.50,
  '12x8':     9.00,
};

/** Large × small combinations from CON_SCH40_KG, sorted by large then small */
export const COMBO_LIST: { large: number; small: number }[] = Object.keys(CON_SCH40_KG)
  .map((k) => {
    const [large, small] = k.split('x').map(Number);
    return { large, small };
  })
  .sort((a, b) => a.large - b.large || b.small - a.small);

/**
 * Approximate metal-mass factor relative to SCH 40 for schedules without a
 * direct catalog entry. Derived from typical ASME B36.10M wall-thickness
 * ratios (t·(OD−t) relative to SCH 40 at mid-range NPS).
 * SCH STD maps onto SCH 40 and SCH XS onto SCH 80 (× 1.5), so neither is listed.
 */
export const SCHEDULE_FACTOR: Record<string, number> = {
  SCH10:  0.55,
  SCH20:  0.75,
  SCH30:  0.88,
  SCH60:  1.22,
  SCH100: 1.35,
  SCH120: 1.45,
  SCH140: 1.55,
  SCH160: 1.65,
  XXS:    2.0,
};

/** SCH 80 / XS walls carry ≈ 1.5 × the SCH 40 metal mass */
export const SCH80_FACTOR = 1.5;

/** Eccentric reducers carry ≈ 6% more metal than concentric of the same sizes */
export const ECCENTRIC_FACTOR = 1.06;

/** Smallest large end offered by the calculator (NPS 3/4″) */
export const LARGE_END_MIN = 0.75;

/** Largest small end offered by the calculator (NPS 20″) */
export const SMALL_END_MAX = 20;

export const LB_PER_KG = 2.20462;
export const CS_DENSITY = 7850; // kg/m³ — density the lookup values are calibrated at
