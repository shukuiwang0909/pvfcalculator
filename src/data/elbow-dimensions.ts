/**
 * ASME B16.9 butt-weld elbow weight data.
 *
 * Base values are catalog-calibrated LR 90° elbow weights (kg, carbon steel
 * A106 / A234 WPB at 7,850 kg/m³) for the common NPS × SCH 40 / SCH 80
 * combinations. Other sizes and schedules are derived:
 *
 *  - NPS sizes not in the lookup are extrapolated from the nearest known
 *    size, scaling with metal volume ∝ NPS².
 *  - Schedules without a direct catalog value use an approximate
 *    metal-mass factor relative to SCH 40 (SCH STD = SCH 40, SCH XS =
 *    SCH 80 per ASME B36.10M).
 *  - Geometry factors per the task specification:
 *      90° LR = 1.0 (reference), 90° SR = 0.7, 45° LR = 0.6.
 *    ASME B16.9 defines 45° elbows as long-radius only, so there is no
 *    SR 45° combination.
 *
 * Center-to-end dimensions (A) per ASME B16.9:
 *  - 90° LR: A = 1.5 × NPS (in)
 *  - 90° SR: A = 1.0 × NPS (in)
 *  - 45° LR: A = 0.625 × NPS (in)  (5/8 × NPS)
 */

import { NPS_LIST, MATERIALS } from './flange-dimensions';

export { NPS_LIST, MATERIALS };

export type ElbowAngle = 90 | 45;
export type RadiusType = 'LR' | 'SR';

export const ELBOW_ANGLES: { id: ElbowAngle; name: string; desc: string }[] = [
  { id: 90, name: '90° Elbow', desc: 'Quarter bend — full right-angle change of direction' },
  { id: 45, name: '45° Elbow', desc: 'Half bend — long radius only, per ASME B16.9' },
];

export const RADIUS_TYPES: { id: RadiusType; name: string; desc: string }[] = [
  { id: 'LR', name: 'Long Radius', desc: 'Center-to-end = 1.5 × NPS (1.5D) — the B16.9 default' },
  { id: 'SR', name: 'Short Radius', desc: 'Center-to-end = 1.0 × NPS (1D) — 90° elbows only' },
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

/** Catalog-calibrated LR 90° elbow weights (kg) — carbon steel, SCH 40 / SCH 80 */
export const LR90_KG: Record<number, { sch40: number; sch80: number }> = {
  0.5:  { sch40: 0.2,  sch80: 0.25 },
  0.75: { sch40: 0.3,  sch80: 0.4 },
  1:    { sch40: 0.5,  sch80: 0.7 },
  1.25: { sch40: 0.8,  sch80: 1.1 },
  1.5:  { sch40: 1.1,  sch80: 1.5 },
  2:    { sch40: 1.8,  sch80: 2.5 },
  2.5:  { sch40: 3.0,  sch80: 4.2 },
  3:    { sch40: 4.5,  sch80: 6.5 },
  4:    { sch40: 8.0,  sch80: 11.5 },
  6:    { sch40: 18.0, sch80: 28.0 },
  8:    { sch40: 32.0, sch80: 50.0 },
  10:   { sch40: 55.0, sch80: 85.0 },
  12:   { sch40: 85.0, sch80: 130.0 },
};

/**
 * Approximate metal-mass factor relative to SCH 40 for schedules that have
 * no direct catalog entry in LR90_KG. Derived from typical ASME B36.10M
 * wall-thickness ratios (t·(OD−t) relative to SCH 40 at mid-range NPS).
 * SCH STD and SCH XS map directly onto SCH 40 / SCH 80 and are not listed.
 */
export const SCHEDULE_FACTOR: Record<string, number> = {
  SCH10: 0.55,
  SCH20: 0.75,
  SCH30: 0.88,
  SCH60: 1.22,
  SCH100: 1.35,
  SCH120: 1.45,
  SCH140: 1.55,
  SCH160: 1.65,
  XXS: 2.0,
};

export const LB_PER_KG = 2.20462;
export const CS_DENSITY = 7850; // kg/m³ — density the lookup values are calibrated at
