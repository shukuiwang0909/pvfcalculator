/**
 * ASME B16.9 elbow weight calculation engine.
 *
 * Method (MVP, catalog-calibrated):
 *
 *   1. Look up the reference LR 90° elbow weight (carbon steel) for the
 *      requested NPS and schedule family (SCH 40 / SCH 80 catalog values;
 *      other schedules scale the SCH 40 value by a metal-mass factor;
 *      unlisted NPS sizes extrapolate from the nearest known size with
 *      metal volume ∝ NPS²).
 *   2. Apply the geometry factor:  90° LR = 1.0 · 90° SR = 0.7 · 45° LR = 0.6
 *      (a 45° elbow carries roughly 60% and a short-radius 90° roughly 70%
 *      of the metal in a long-radius 90° of the same NPS and schedule).
 *   3. Scale by material density relative to 7,850 kg/m³ carbon steel.
 *
 *   W = W_ref(NPS, SCH) × F_geo × (ρ / 7850)
 *
 * Center-to-end (dimension A) is reported for reference per ASME B16.9:
 *   90° LR: A = 1.5 × NPS in · 90° SR: A = 1.0 × NPS in · 45° LR: A = 0.625 × NPS in
 */

import {
  CS_DENSITY,
  LB_PER_KG,
  LR90_KG,
  NPS_LIST,
  SCHEDULE_FACTOR,
  type ElbowAngle,
  type RadiusType,
} from '../data/elbow-dimensions';

export interface ElbowResult {
  valid: boolean;
  angle: ElbowAngle;
  radius: RadiusType;
  nps: number;
  npsLabel: string;
  schedule: string;
  pipeOdMm: number;
  /** center-to-end dimension A (inches) per ASME B16.9 */
  centerToEndIn: number;
  centerToEndMm: number;
  /** geometry factor applied to the LR 90° reference weight */
  geometryFactor: number;
  /** schedule factor applied to the SCH 40 reference weight */
  scheduleFactor: number;
  /** LR 90° reference weight at the requested NPS/schedule, carbon steel (kg) */
  referenceKg: number;
  density: number;
  weightKg: number;
  weightLb: number;
}

const KNOWN_NPS = Object.keys(LR90_KG).map(Number).sort((a, b) => a - b);

/**
 * LR 90° reference weight (kg, carbon steel) for an NPS + wall family.
 * Direct catalog hit when available, otherwise nearest-known-size
 * extrapolation scaling with metal volume ∝ NPS².
 */
function lookupKg(nps: number, family: 'sch40' | 'sch80'): number {
  const direct = LR90_KG[nps];
  if (direct) return direct[family];
  let nearest = KNOWN_NPS[0];
  for (const k of KNOWN_NPS) {
    if (Math.abs(k - nps) < Math.abs(nearest - nps)) nearest = k;
  }
  return LR90_KG[nearest][family] * Math.pow(nps / nearest, 2);
}

/** LR 90° reference weight (kg) for an NPS + schedule */
export function referenceLR90Kg(nps: number, schedule: string): number {
  switch (schedule) {
    case 'SCH80':
    case 'XS':
      return lookupKg(nps, 'sch80');
    case 'SCH40':
    case 'STD':
      return lookupKg(nps, 'sch40');
    default:
      return lookupKg(nps, 'sch40') * (SCHEDULE_FACTOR[schedule] ?? 1);
  }
}

/** Schedule factor relative to SCH 40 (for display) */
export function scheduleFactorOf(schedule: string): number {
  switch (schedule) {
    case 'SCH40':
    case 'STD':
      return 1;
    case 'SCH80':
    case 'XS': {
      // ratio of the SCH 80 catalog value to the SCH 40 value at NPS 6
      // (representative mid-range); falls back to 1.5 off-table
      const a = LR90_KG[6];
      return a ? a.sch80 / a.sch40 : 1.5;
    }
    default:
      return SCHEDULE_FACTOR[schedule] ?? 1;
  }
}

export function computeElbowWeight(
  angle: ElbowAngle,
  radius: RadiusType,
  nps: number,
  schedule: string,
  density: number,
): ElbowResult {
  const info = NPS_LIST.find((n) => n.nps === nps);
  const effectiveRadius: RadiusType = angle === 45 ? 'LR' : radius;

  const geometryFactor =
    angle === 45 ? 0.6 : effectiveRadius === 'SR' ? 0.7 : 1.0;

  const centerToEndIn =
    angle === 45 ? 0.625 * nps : effectiveRadius === 'SR' ? 1.0 * nps : 1.5 * nps;

  const referenceKg = referenceLR90Kg(nps, schedule);
  const weightKg = referenceKg * geometryFactor * (density / CS_DENSITY);

  return {
    valid: Boolean(info),
    angle,
    radius: effectiveRadius,
    nps,
    npsLabel: info ? info.label : `${nps}"`,
    schedule,
    pipeOdMm: info ? info.pipeOd : 0,
    centerToEndIn,
    centerToEndMm: centerToEndIn * 25.4,
    geometryFactor,
    scheduleFactor: scheduleFactorOf(schedule),
    referenceKg,
    density,
    weightKg,
    weightLb: weightKg * LB_PER_KG,
  };
}
