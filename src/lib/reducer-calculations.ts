/**
 * ASME B16.9 reducer weight calculation engine.
 *
 * Method (catalog-calibrated):
 *
 *   1. Look up the reference CONCENTRIC reducer weight (carbon steel, SCH 40)
 *      for the requested large-end × small-end combination. Combinations not
 *      in the table are extrapolated from the nearest known combination,
 *      scaling with metal volume ∝ large-end NPS².
 *   2. Apply the schedule factor:  SCH 40 / STD = 1.0 · SCH 80 / XS = 1.5 ·
 *      other schedules scale the SCH 40 value by a metal-mass factor
 *      (ASME B36.10M wall ratios).
 *   3. Apply the reducer-type factor:  concentric = 1.0 · eccentric = 1.06
 *      (an eccentric reducer carries ≈ 6% more metal; equivalently
 *      W_con ≈ 0.80 × and W_ecc ≈ 0.85 × the straight-pipe weight of the
 *      large end size and schedule).
 *   4. Scale by material density relative to 7,850 kg/m³ carbon steel.
 *
 *   W = W_ref(large × small) × F_sch × F_type × (ρ / 7,850)
 *
 * Validation: the small end must be strictly smaller than the large end;
 * large ends cover NPS 3/4″–24″, small ends NPS 1/2″–20″.
 */

import {
  CON_SCH40_KG,
  CS_DENSITY,
  ECCENTRIC_FACTOR,
  LB_PER_KG,
  LARGE_END_MIN,
  NPS_LIST,
  SCH80_FACTOR,
  SCHEDULE_FACTOR,
  SMALL_END_MAX,
  type ReducerType,
} from '../data/reducer-dimensions';

export interface ReducerResult {
  valid: boolean;
  type: ReducerType;
  large: number;
  small: number;
  largeLabel: string;
  smallLabel: string;
  schedule: string;
  largeOdMm: number;
  smallOdMm: number;
  /** end-to-end length estimate (mm) — ≈ large-end OD; manufacturer-dependent */
  lengthMm: number;
  /** reducer-type factor (concentric = 1.0, eccentric = 1.06) */
  typeFactor: number;
  /** schedule factor relative to SCH 40 */
  scheduleFactor: number;
  /** concentric SCH 40 reference weight at the requested combination (kg, carbon steel) */
  referenceKg: number;
  density: number;
  weightKg: number;
  weightLb: number;
}

const ENTRIES = Object.entries(CON_SCH40_KG).map(([k, kg]) => {
  const [large, small] = k.split('x').map(Number);
  return { large, small, kg };
});

/**
 * Concentric SCH 40 reference weight (kg, carbon steel) for a
 * large × small combination. Direct catalog hit when available, otherwise
 * nearest-known-combination extrapolation scaling ∝ large-end NPS².
 */
export function referenceConKg(large: number, small: number): number {
  const direct = CON_SCH40_KG[`${large}x${small}`];
  if (direct !== undefined) return direct;
  let nearest = ENTRIES[0];
  let best = Infinity;
  for (const e of ENTRIES) {
    const d = Math.abs(Math.log(e.large / large));
    if (d < best) {
      best = d;
      nearest = e;
    }
  }
  return nearest.kg * Math.pow(large / nearest.large, 2);
}

/** Schedule factor relative to SCH 40 */
export function scheduleFactorOf(schedule: string): number {
  switch (schedule) {
    case 'SCH40':
    case 'STD':
      return 1;
    case 'SCH80':
    case 'XS':
      return SCH80_FACTOR;
    default:
      return SCHEDULE_FACTOR[schedule] ?? 1;
  }
}

export function computeReducerWeight(
  type: ReducerType,
  large: number,
  small: number,
  schedule: string,
  density: number,
): ReducerResult {
  const li = NPS_LIST.find((n) => n.nps === large);
  const si = NPS_LIST.find((n) => n.nps === small);
  const valid = Boolean(
    li && si && large >= LARGE_END_MIN && small <= SMALL_END_MAX && small < large,
  );

  const referenceKg = referenceConKg(large, small);
  const scheduleFactor = scheduleFactorOf(schedule);
  const typeFactor = type === 'ECC' ? ECCENTRIC_FACTOR : 1;
  const weightKg = valid
    ? referenceKg * scheduleFactor * typeFactor * (density / CS_DENSITY)
    : 0;

  return {
    valid,
    type,
    large,
    small,
    largeLabel: li ? li.label : `${large}"`,
    smallLabel: si ? si.label : `${small}"`,
    schedule,
    largeOdMm: li ? li.pipeOd : 0,
    smallOdMm: si ? si.pipeOd : 0,
    lengthMm: li ? li.pipeOd : 0,
    typeFactor,
    scheduleFactor,
    referenceKg,
    density,
    weightKg,
    weightLb: weightKg * LB_PER_KG,
  };
}
