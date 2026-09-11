/**
 * ASME B16.9 tee weight calculation engine (equal & reducing).
 *
 * Method (catalog-calibrated):
 *
 *   1. Equal tee reference weight: catalog-calibrated SCH 40 carbon-steel
 *      values for NPS 1/2″–12″; NPS 14″–24″ extrapolate from NPS 12 with
 *      metal volume ∝ NPS². These values equal ≈ 1.5 × the straight-pipe
 *      weight of the same NPS and schedule (branch reinforcement).
 *   2. Schedule factor: SCH STD = SCH 40 (× 1.0), SCH XS / SCH 80 = × 1.5,
 *      SCH 10–160 and XXS scale the SCH 40 value by their ASME B36.10M
 *      metal-mass factor.
 *   3. Tee-type factor: equal tee = 1.0; reducing tee = 1.3 / 1.5 ≈ 0.8667
 *      of the equal-tee weight AT THE RUN SIZE (reducing tees are estimated
 *      from the run pipe only, per the reference method
 *      W_reducing ≈ 1.3 × straight-pipe weight(run)).
 *   4. Density scaling relative to 7,850 kg/m³ carbon steel.
 *
 *   W_equal     = W_ref(NPS_run, SCH) × 1.0 × (ρ / 7,850)
 *   W_reducing  = W_ref(NPS_run, SCH) × (1.3 / 1.5) × (ρ / 7,850)
 *
 * Center-to-end dimensions (C, C1) are reported for reference per ASME B16.9:
 * equal tee C = NPS; reducing tee C = run NPS, C1 = branch NPS.
 */

import {
  CS_DENSITY,
  EQUAL_TEE_SCH40_KG,
  LB_PER_KG,
  NPS_LIST,
  REDUCING_VS_EQUAL,
  SCHEDULE_FACTOR,
  type TeeType,
} from '../data/tee-dimensions';

export interface TeeResult {
  valid: boolean;
  type: TeeType;
  runNps: number;
  branchNps: number;
  runLabel: string;
  branchLabel: string;
  schedule: string;
  pipeOdMm: number;
  branchPipeOdMm: number;
  /** center-to-end dimension C (run), inches, per ASME B16.9 */
  centerToEndIn: number;
  centerToEndMm: number;
  /** center-to-end dimension C1 (branch), inches — reducing tees only */
  branchCenterToEndIn: number;
  branchCenterToEndMm: number;
  /** tee-type factor: 1.0 equal, 1.3/1.5 reducing */
  typeFactor: number;
  /** schedule factor relative to SCH 40 */
  scheduleFactor: number;
  /** equal-tee SCH-40 reference weight at the run NPS, carbon steel (kg) */
  referenceKg: number;
  density: number;
  weightKg: number;
  weightLb: number;
}

const KNOWN_NPS = Object.keys(EQUAL_TEE_SCH40_KG).map(Number).sort((a, b) => a - b);

/**
 * Equal-tee SCH 40 reference weight (kg, carbon steel) for an NPS.
 * Direct catalog hit when available, otherwise nearest-known-size
 * extrapolation scaling with metal volume ∝ NPS².
 */
export function equalTeeSch40Kg(nps: number): number {
  const direct = EQUAL_TEE_SCH40_KG[nps];
  if (direct) return direct;
  let nearest = KNOWN_NPS[KNOWN_NPS.length - 1];
  for (const k of KNOWN_NPS) {
    if (Math.abs(k - nps) < Math.abs(nearest - nps)) nearest = k;
  }
  return EQUAL_TEE_SCH40_KG[nearest] * Math.pow(nps / nearest, 2);
}

/** Schedule factor relative to SCH 40 (SCH STD = SCH 40; SCH XS = SCH 80 × 1.5) */
export function scheduleFactorOf(schedule: string): number {
  switch (schedule) {
    case 'SCH40':
    case 'STD':
      return 1;
    case 'SCH80':
    case 'XS':
      return 1.5;
    default:
      return SCHEDULE_FACTOR[schedule] ?? 1;
  }
}

export function computeTeeWeight(
  type: TeeType,
  runNps: number,
  branchNps: number,
  schedule: string,
  density: number,
): TeeResult {
  const runInfo = NPS_LIST.find((n) => n.nps === runNps);
  const effBranch = type === 'EQ' ? runNps : branchNps;
  const branchInfo = NPS_LIST.find((n) => n.nps === effBranch);

  // Reducing tee: branch must be strictly smaller than the run
  const valid = Boolean(runInfo) && Boolean(branchInfo) &&
    (type === 'EQ' || effBranch < runNps);

  const scheduleFactor = scheduleFactorOf(schedule);
  const typeFactor = type === 'EQ' ? 1 : REDUCING_VS_EQUAL;
  const referenceKg = equalTeeSch40Kg(runNps);
  const weightKg = valid ? referenceKg * scheduleFactor * typeFactor * (density / CS_DENSITY) : 0;

  return {
    valid,
    type,
    runNps,
    branchNps: effBranch,
    runLabel: runInfo ? runInfo.label : `${runNps}"`,
    branchLabel: branchInfo ? branchInfo.label : `${effBranch}"`,
    schedule,
    pipeOdMm: runInfo ? runInfo.pipeOd : 0,
    branchPipeOdMm: branchInfo ? branchInfo.pipeOd : 0,
    centerToEndIn: runNps,
    centerToEndMm: runNps * 25.4,
    branchCenterToEndIn: effBranch,
    branchCenterToEndMm: effBranch * 25.4,
    typeFactor,
    scheduleFactor,
    referenceKg,
    density,
    weightKg,
    weightLb: weightKg * LB_PER_KG,
  };
}
