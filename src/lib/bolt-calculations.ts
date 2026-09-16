/**
 * Flange bolt torque calculation engine (short-form nut-factor method).
 *
 *   T = K * D * F
 *     K = empirical nut factor (lubrication condition)
 *     D = nominal bolt diameter (consistent length unit with T result)
 *     F = target bolt preload per bolt = S_target * A_t
 *
 *   A_t (tensile stress area, ASME B1.1) = 0.7854 * (d - 0.9743/n)^2  [in^2]
 *
 * Target bolt stress S_target follows the ASME PCC-1 Appendix O framework
 * (40-70% of yield band, default 50% — see src/data/bolt-dimensions.ts
 * header). Temperature derating linearly interpolates an approximate
 * yield-retention table; above a material's ceiling the result is invalid.
 *
 * This is the screening-grade method. For critical joints, target stress
 * must come from the full PCC-1 Appendix O joint calculation (gasket
 * seating stress, flange stress limits) and be verified by measurement.
 */

import {
  BOLT_MATERIALS,
  LUBRICATIONS,
  boltSpecFor,
  boltSpecForHole,
  lubricationById,
  materialById,
  targetStressFor,
  type BoltMaterial,
  type BoltSpec,
} from '../data/bolt-dimensions';
import { CLASS_DATA, NPS_LIST, npsIndex } from '../data/flange-dimensions';

export const KG_TO_LB = 2.2046226218;
export const IN_TO_MM = 25.4;
export const LBF_TO_N = 4.4482216152605;
export const FT_LB_PER_NM = 0.7375621493;
export const KSI_TO_MPA = 6.894757293;

/** Tensile stress area per ASME B1.1 (in^2). */
export function tensileStressArea(dInch: number, tpi: number): number {
  return 0.7854 * Math.pow(dInch - 0.9743 / tpi, 2);
}

/** Bolt preload (N) from target stress (ksi) and tensile stress area (in^2). */
export function boltLoadN(stressKsi: number, areaIn2: number): number {
  return stressKsi * 1000 * areaIn2 * LBF_TO_N;
}

/** Tightening torque (N*m) from nut factor K, nominal dia (in) and load (N). */
export function torqueNm(K: number, dInch: number, loadN: number): number {
  return K * ((dInch * IN_TO_MM) / 1000) * loadN;
}

/** Multi-pass torque sequence (default PCC-1 style 30 / 60 / 100%). */
export function perPassTorques(totalNm: number, passes: number[] = [0.3, 0.6, 1.0]): number[] {
  return passes.map((p) => totalNm * p);
}

export interface TempFactor {
  ok: boolean;
  factor: number;
  reason?: string;
}

/** Approximate yield-retention factor at tempC (linear interpolation). */
export function temperatureFactor(material: BoltMaterial, tempC: number): TempFactor {
  if (tempC > material.tempLimitC) {
    return {
      ok: false,
      factor: 0,
      reason: `${material.spec} is not normally rated for sustained service above ~${material.tempLimitC} deg C — the joint needs case-specific engineering.`,
    };
  }
  const r = material.retention;
  if (tempC <= r[0][0]) return { ok: true, factor: r[0][1] };
  for (let i = 1; i < r.length; i++) {
    if (tempC <= r[i][0]) {
      const [t0, f0] = r[i - 1];
      const [t1, f1] = r[i];
      return { ok: true, factor: f0 + ((f1 - f0) * (tempC - t0)) / (t1 - t0) };
    }
  }
  return { ok: true, factor: r[r.length - 1][1] };
}

export interface FlangeBoltInfo {
  valid: boolean;
  reason?: string;
  cls: number;
  nps: number;
  npsLabel: string;
  count: number;
  holeMm: number;
  bcdMm: number;
  spec: BoltSpec | null;
}

/** Parse CLASS_DATA bolt info ("8 x 22.2") and map hole dia to stud spec. */
export function flangeBolts(cls: number, nps: number): FlangeBoltInfo {
  const empty: FlangeBoltInfo = {
    valid: false, cls, nps, npsLabel: '', count: 0, holeMm: 0, bcdMm: 0, spec: null,
  };
  const cd = CLASS_DATA[cls];
  const idx = npsIndex(nps);
  if (!cd || idx < 0 || !cd.validNps.includes(nps)) return empty;
  const cell = cd.bolts[idx];
  if (!cell || cell === '—') return empty;
  const m = cell.match(/^(\d+)\s*[×x]\s*([\d.]+)/);
  if (!m) return empty;
  const holeMm = Number(m[2]);
  return {
    valid: true,
    cls, nps,
    npsLabel: NPS_LIST[idx].label,
    count: Number(m[1]),
    holeMm,
    bcdMm: cd.bcd[idx],
    spec: boltSpecForHole(holeMm) ?? null,
  };
}

export interface BoltTorqueInput {
  cls: number;
  nps: number;
  materialId: string;
  lubeId: string;
  tempC: number;
  /** 0..1 position of target stress within the material band (gasket selector). */
  stressPosition?: number;
  /** Absolute target stress override (ksi). */
  stressOverrideKsi?: number;
  boltCountOverride?: number;
  boltDiaOverrideIn?: number;
}

export interface BoltTorqueResult {
  valid: boolean;
  reason?: string;
  // per-bolt torque
  torqueNm: number;
  torqueFtlb: number;
  // whole joint
  totalNm: number;
  totalFtlb: number;
  // loads
  loadKn: number;
  totalLoadKn: number;
  // stress basis
  stressKsi: number;
  stressMpa: number;
  stressAmbientKsi: number;
  tempFactor: number;
  band: { minKsi: number; maxKsi: number };
  passes: { pct: number; nm: number; ftlb: number }[];
  // bolt / joint description
  count: number;
  boltDiaIn: number;
  tpi: number;
  areaIn2: number;
  boltLabel: string;
  nutAfIn: number;
  bcdMm: number;
  npsLabel: string;
  K: number;
  materialName: string;
  materialSpec: string;
  lubeName: string;
  tempC: number;
  materialNote: string;
}

const EMPTY: BoltTorqueResult = {
  valid: false, torqueNm: 0, torqueFtlb: 0, totalNm: 0, totalFtlb: 0,
  loadKn: 0, totalLoadKn: 0, stressKsi: 0, stressMpa: 0, stressAmbientKsi: 0,
  tempFactor: 1, band: { minKsi: 0, maxKsi: 0 },
  passes: [], count: 0, boltDiaIn: 0, tpi: 0, areaIn2: 0, boltLabel: '',
  nutAfIn: 0, bcdMm: 0, npsLabel: '', K: 0, materialName: '', materialSpec: '',
  lubeName: '', tempC: 20, materialNote: '',
};

export function computeBoltTorque(input: BoltTorqueInput): BoltTorqueResult {
  const info = flangeBolts(input.cls, input.nps);
  if (!info.valid) return { ...EMPTY, reason: `No bolting data for NPS ${input.nps}" Class ${input.cls}.` };

  const material = materialById(input.materialId);
  const lube = lubricationById(input.lubeId);
  const ts = targetStressFor(material.id);

  let spec = info.spec;
  if (input.boltDiaOverrideIn && input.boltDiaOverrideIn > 0) {
    spec = boltSpecFor(input.boltDiaOverrideIn) ?? spec;
  }
  if (!spec) return { ...EMPTY, reason: 'No standard stud size matches this flange.' };

  const tf = temperatureFactor(material, input.tempC);
  if (!tf.ok) return { ...EMPTY, reason: tf.reason };

  // Target stress: explicit override > band position (gasket selector)
  let stressAmbient = ts.targetKsi;
  if (input.stressOverrideKsi && input.stressOverrideKsi > 0) {
    stressAmbient = Math.min(Math.max(input.stressOverrideKsi, ts.minKsi), ts.maxKsi);
  } else if (typeof input.stressPosition === 'number') {
    const p = Math.min(Math.max(input.stressPosition, 0), 1);
    stressAmbient = ts.minKsi + (ts.maxKsi - ts.minKsi) * p;
  }
  const stressKsi = stressAmbient * tf.factor;

  const area = spec.tensileAreaIn2;
  const load = boltLoadN(stressKsi, area);
  const torque = torqueNm(lube.K, spec.dIn, load);
  const count = input.boltCountOverride && input.boltCountOverride > 0
    ? Math.floor(input.boltCountOverride)
    : info.count;

  return {
    valid: true,
    torqueNm: torque,
    torqueFtlb: torque * FT_LB_PER_NM,
    totalNm: torque * count,
    totalFtlb: torque * FT_LB_PER_NM * count,
    loadKn: load / 1000,
    totalLoadKn: (load * count) / 1000,
    stressKsi,
    stressMpa: stressKsi * KSI_TO_MPA,
    stressAmbientKsi: stressAmbient,
    tempFactor: tf.factor,
    band: { minKsi: ts.minKsi, maxKsi: ts.maxKsi },
    passes: [0.3, 0.6, 1.0].map((p) => ({
      pct: p,
      nm: torque * p,
      ftlb: torque * p * FT_LB_PER_NM,
    })),
    count,
    boltDiaIn: spec.dIn,
    tpi: spec.tpi,
    areaIn2: area,
    boltLabel: spec.label,
    nutAfIn: spec.nutAfIn,
    bcdMm: info.bcdMm,
    npsLabel: info.npsLabel,
    K: lube.K,
    materialName: material.name,
    materialSpec: material.spec,
    lubeName: lube.name,
    tempC: input.tempC,
    materialNote: material.note,
  };
}

export { BOLT_MATERIALS, LUBRICATIONS };
