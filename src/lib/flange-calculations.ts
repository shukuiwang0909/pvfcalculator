/**
 * ASME B16.5 flange weight calculation engine.
 *
 * Geometric model (true 3-D solids, NOT a flat-plate approximation):
 *
 *   Weld Neck (WN):
 *     V = disc(OD, bore, t)                     — flange ring
 *       + frustum(X → OD, L = Y − t)            — tapered hub
 *       − cylinder(bore, L)                     — bore through hub
 *       + raised face annulus (rfDia, h)
 *
 *   Slip On / Socket Weld / Threaded (SO / SW / THD):
 *     V = disc(OD, bore, t)                     — flange ring
 *       + cylinder(X, L = max(0, Y − t))        — straight hub
 *       − cylinder(bore, L)
 *       + raised face annulus
 *
 *   Blind (BL):
 *     V = disc(OD, tBl) + raised face disc (rfDia, h)
 *
 * All dimensions in mm → volume in mm³ → weight = V × ρ × 1e−9 kg (ρ in kg/m³).
 * Bolt holes are not deducted, matching standard manufacturer catalog weights.
 */

import {
  CLASS_DATA,
  NPS_LIST,
  soThickness,
  npsIndex,
} from '../data/flange-dimensions';

export type FlangeType = 'WN' | 'SO' | 'BL' | 'SW' | 'THD';

export const FLANGE_TYPES: { id: FlangeType; name: string; desc: string }[] = [
  { id: 'WN',  name: 'Weld Neck',     desc: 'Tapered hub, butt-weld end' },
  { id: 'SO',  name: 'Slip On',       desc: 'Straight hub, slips over pipe' },
  { id: 'BL',  name: 'Blind',         desc: 'Solid disk, bolts over open end' },
  { id: 'SW',  name: 'Socket Weld',   desc: 'Straight hub, socket fillet weld' },
  { id: 'THD', name: 'Threaded',      desc: 'Straight hub, threaded bore' },
];

const PI = Math.PI;

/** Volume of a solid disc / annulus, mm³ */
function discVolume(od: number, id: number, t: number): number {
  return (PI / 4) * (od * od - id * id) * t;
}

/** Volume of a conical frustum between radii r1/r2 over length L, mm³ */
function frustumVolume(d1: number, d2: number, l: number): number {
  const r1 = d1 / 2;
  const r2 = d2 / 2;
  return (PI * l / 3) * (r1 * r1 + r1 * r2 + r2 * r2);
}

export interface VolumeBreakdown {
  ringMm3: number;   // flange ring disc
  hubMm3: number;    // hub (frustum for WN, cylinder for others) minus bore
  faceMm3: number;   // raised face
  totalMm3: number;
}

export interface FlangeResult {
  valid: boolean;
  type: FlangeType;
  cls: number;
  nps: number;
  npsLabel: string;
  density: number;
  dims: {
    od: number; bore: number; t: number; x: number; y: number;
    rfDia: number; rfHeight: number; bcd: number; bolts: string;
  };
  volumes: VolumeBreakdown;
  volumeCm3: number;
  weightKg: number;
  weightLb: number;
}

export function computeFlangeWeight(
  type: FlangeType,
  cls: number,
  nps: number,
  density: number
): FlangeResult {
  const empty: FlangeResult = {
    valid: false, type, cls, nps, npsLabel: '', density,
    dims: { od: 0, bore: 0, t: 0, x: 0, y: 0, rfDia: 0, rfHeight: 0, bcd: 0, bolts: '—' },
    volumes: { ringMm3: 0, hubMm3: 0, faceMm3: 0, totalMm3: 0 },
    volumeCm3: 0, weightKg: 0, weightLb: 0,
  };

  const cd = CLASS_DATA[cls];
  const idx = npsIndex(nps);
  if (!cd || idx < 0 || !cd.validNps.includes(nps)) return empty;

  const od = cd.od[idx];
  if (!od) return empty;

  const npsInfo = NPS_LIST[idx];
  const rfDia = cd.rfDia[idx];
  const rfH = cd.rfHeight;
  const bcd = cd.bcd[idx];
  const bolts = cd.bolts[idx] ?? '—';

  let bore: number;
  let t: number;
  let x: number;
  let y: number;
  let ringMm3 = 0;
  let hubMm3 = 0;
  let faceMm3 = 0;

  if (type === 'BL') {
    t = cd.tBl[idx];
    bore = 0;
    x = 0;
    y = 0;
    ringMm3 = discVolume(od, 0, t);
    faceMm3 = discVolume(rfDia, 0, rfH);
  } else {
    bore = npsInfo.stdBore;
    t = soThickness(cls, cd.tWn[idx]);
    x = cd.x[idx];
    y = cd.y[idx];
    ringMm3 = discVolume(od, bore, t);
    const hubLen = Math.max(0, y - t);
    if (type === 'WN') {
      hubMm3 = frustumVolume(od, x, hubLen) - discVolume(bore, 0, hubLen);
    } else {
      // SO / SW / THD — straight cylindrical hub
      hubMm3 = discVolume(x, bore, hubLen);
    }
    faceMm3 = discVolume(rfDia, bore, rfH);
  }

  const totalMm3 = ringMm3 + hubMm3 + faceMm3;
  const weightKg = totalMm3 * density * 1e-9;

  return {
    valid: true,
    type, cls, nps,
    npsLabel: npsInfo.label,
    density,
    dims: { od, bore, t, x, y, rfDia, rfHeight: rfH, bcd, bolts },
    volumes: { ringMm3, hubMm3, faceMm3, totalMm3 },
    volumeCm3: totalMm3 / 1000,
    weightKg,
    weightLb: weightKg * 2.2046226218,
  };
}

/** Flat-plate approximation for comparison (what inaccurate calculators do) */
export function plateApproximationKg(
  type: FlangeType,
  cls: number,
  nps: number,
  density: number
): number {
  const cd = CLASS_DATA[cls];
  const idx = npsIndex(nps);
  if (!cd || idx < 0 || !cd.validNps.includes(nps) || !cd.od[idx]) return 0;
  const od = cd.od[idx];
  const bore = NPS_LIST[idx].stdBore;
  const t = type === 'BL' ? cd.tBl[idx] : soThickness(cls, cd.tWn[idx]);
  return discVolume(od, type === 'BL' ? 0 : bore, t) * density * 1e-9;
}

export const KG_TO_LB = 2.2046226218;
