/**
 * ASME B16.9 butt-weld tee weight data (equal & reducing).
 *
 * Base values are catalog-calibrated EQUAL tee weights (kg, carbon steel
 * A106 / A234 WPB at 7,850 kg/m³) at SCH 40, per the reference table:
 *
 *   NPS 1/2: 0.3 · 3/4: 0.5 · 1: 0.8 · 1-1/4: 1.2 · 1-1/2: 1.6 · 2: 2.5 ·
 *   2-1/2: 4.0 · 3: 6.0 · 4: 10.0 · 6: 22.0 · 8: 40.0 · 10: 70.0 · 12: 110.0
 *
 * These equal-tee values correspond to ≈ 1.5 × the straight-pipe weight of
 * the same NPS and schedule (the reinforcement at the branch intersection
 * adds about half a pipe length of metal). Schedules are derived:
 *
 *  - SCH STD = SCH 40 (identical wall per ASME B36.10M)
 *  - SCH XS / SCH 80: × 1.5 the SCH 40 value (per the B16.9 reference data)
 *  - SCH 10–160 and XXS without a direct entry scale the SCH 40 value by an
 *    approximate metal-mass factor relative to SCH 40
 *  - NPS sizes above 12″ (not in the lookup) extrapolate from NPS 12 with
 *    metal volume ∝ NPS²
 *
 * Reducing tee weight is estimated from the RUN size only:
 *   W_reducing ≈ 1.3 × straight-pipe weight(run) = (1.3 / 1.5) × W_equal(run)
 * The branch size must be smaller than the run size (validated in the UI).
 *
 * Center-to-end dimensions (C, C1) per ASME B16.9: C = NPS (run),
 * C1 = branch NPS (reducing tees).
 */

import { NPS_LIST, MATERIALS } from './flange-dimensions';

export { NPS_LIST, MATERIALS };

export type TeeType = 'EQ' | 'RED';

export const TEE_TYPES: { id: TeeType; name: string; desc: string }[] = [
  { id: 'EQ',  name: 'Equal Tee',    desc: 'All three ends the same NPS — run and branch identical' },
  { id: 'RED', name: 'Reducing Tee', desc: 'Branch outlet smaller than the run — branch must be < run size' },
];

/** Equal-tee reference factor vs straight pipe: W_equal ≈ 1.5 × W_pipe */
export const EQUAL_PIPE_FACTOR = 1.5;
/** Reducing-tee reference factor vs straight pipe: W_reducing ≈ 1.3 × W_pipe */
export const REDUCING_PIPE_FACTOR = 1.3;
/** Implied equal→reducing factor: 1.3 / 1.5 ≈ 0.8667 */
export const REDUCING_VS_EQUAL = REDUCING_PIPE_FACTOR / EQUAL_PIPE_FACTOR;

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

/** Catalog-calibrated EQUAL tee weights (kg) — carbon steel, SCH 40 */
export const EQUAL_TEE_SCH40_KG: Record<number, number> = {
  0.5:  0.3,
  0.75: 0.5,
  1:    0.8,
  1.25: 1.2,
  1.5:  1.6,
  2:    2.5,
  2.5:  4.0,
  3:    6.0,
  4:    10.0,
  6:    22.0,
  8:    40.0,
  10:   70.0,
  12:   110.0,
};

/**
 * Approximate metal-mass factor relative to SCH 40 for schedules without a
 * direct catalog entry. SCH STD = 1.0 and SCH XS = 1.5 (identical to SCH 40
 * / SCH 80 per ASME B36.10M); SCH 80 itself is 1.5 per the B16.9 reference
 * data and is handled in the calculation engine, not listed here.
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

export const LB_PER_KG = 2.20462;
export const CS_DENSITY = 7850; // kg/m³ — density the lookup values are calibrated at
