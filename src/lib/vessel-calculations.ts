/**
 * ASME VIII Div.1 内压圆筒 / 封头壁厚计算引擎（UG-27 / UG-32）。
 *
 * 统一内部单位：mm + MPa；英制输入先换算（1 in = 25.4 mm, 1 psi = 0.006894757 MPa）。
 *
 * 公式（以内径/内半径、腐蚀前为基准）：
 *  UG-27(c)(1) 圆筒纵缝（环向应力控制）: t = P·R / (S·E − 0.6P)
 *  UG-27(c)(2) 圆筒环缝（轴向应力）:    t = P·R / (2S·E + 0.4P)
 *  UG-32(d)   2:1 椭圆封头（K=1）:     t = P·D / (2S·E − 0.2P)
 *                                        等价半球法：L = 0.9D, t = P·L / (2S·E − 0.2P)
 *  UG-32(e)   碟形封头:                t = 0.885·P·L·M / (S·E − 0.1P)
 *                                        M = ¼(3 + √(L/r))，L 球冠内半径，r 转角内半径
 *  UG-32(f)   半球封头:                t = P·R / (2S·E − 0.2P)
 *
 * 适用范围校核：t ≤ R/2 或 P ≤ 0.385·S·E（UG-27(c) 注 / UG-32 注）。
 * 外压设计本期不做（见 UG-28 / Subpart 3 of Section II Part D）。
 */

import {
  allowableStressMpa,
  findVesselMaterial,
  roundUpPlateThickness,
  UG16_MIN_THICKNESS_MM,
  type VesselMaterial,
} from '../data/vessel-materials.ts';

export type VesselComponent = 'shell' | 'ellipsoidal21' | 'torispherical' | 'hemispherical';

export const COMPONENT_LIST: { id: VesselComponent; name: string; nameZh: string; desc: string; descZh: string }[] = [
  { id: 'shell', name: 'Cylindrical Shell', nameZh: '圆筒', desc: 'UG-27 — both seam directions', descZh: 'UG-27 — 纵缝/环缝双向校核' },
  { id: 'ellipsoidal21', name: '2:1 Ellipsoidal Head', nameZh: '2:1 椭圆封头', desc: 'UG-32(d), K = 1', descZh: 'UG-32(d)，K = 1' },
  { id: 'torispherical', name: 'Torispherical (F&D) Head', nameZh: '碟形封头', desc: 'UG-32(e), M from L/r', descZh: 'UG-32(e)，M 由 L/r 求得' },
  { id: 'hemispherical', name: 'Hemispherical Head', nameZh: '半球封头', desc: 'UG-32(f)', descZh: 'UG-32(f)' },
];

export interface VesselInput {
  component: VesselComponent;
  /** 输入单位制：metric → P=MPa, 尺寸=mm, CA=mm；imperial → P=psi, 尺寸=in, CA=in */
  units: 'metric' | 'imperial';
  pressure: number;
  /** 尺寸输入方式：内径或内半径 */
  dimMode: 'id' | 'ir';
  /** 内径或内半径数值（单位随 units） */
  dimValue: number;
  /** 设计温度 °F（允许表按 °F 档位插值） */
  tempF: number;
  materialId: string;
  /** 焊缝系数 E（UW-12 Type 1：RT-1=1.00 / RT-2=0.85 / 无 RT=0.70） */
  jointE: number;
  ca: number;
  /**
   * 允许应力覆盖值（MPa）：用于按其它版本规范/自定义 S 复算公开算例。
   * 缺省时按 materialId + tempF 自动查表插值。
   */
  sOverrideMpa?: number;
  /** 碟形封头附加：球冠半径 L（与 dimValue 同单位；默认取内径） */
  crownL?: number;
  /** 碟形封头附加：转角半径 r（同单位；默认 0.06·L 标准 F&D） */
  knuckleR?: number;
}

export interface VesselResult {
  valid: boolean;
  error?: string;
  warnings: string[];
  component: VesselComponent;
  material: VesselMaterial | null;
  /** 查表插值得到的允许应力 */
  sMpa: number;
  sKsi: number;
  /** 设计壁厚（公式值，不含 CA） */
  tDesignMm: number;
  /** 加腐蚀裕量后 */
  tWithCaMm: number;
  /** 建议名义壁厚（标准板厚系列向上取整） */
  nominalMm: number;
  /** 用名义壁厚（扣 CA 的腐蚀后厚度）回算 MAWP，设计温度 */
  mawpMpa: number;
  mawpPsi: number;
  /** 圆筒双向结果 */
  shell?: {
    tCircMm: number;
    tLongMm: number;
    governing: 'circ' | 'long';
  };
  /** 封头附加参数 */
  head?: {
    dMm: number;
    crownLMm?: number;
    knuckleRMm?: number;
    mFactor?: number;
  };
  /** UG-16(b) 校核：成形后最小厚度（不含 CA）1/16 in ≈ 1.6 mm */
  ug16Ok: boolean;
  /** 适用范围校核 P ≤ 0.385·S·E */
  pressureLimitOk: boolean;
}

const PSI_TO_MPA = 0.006894757;
const IN_TO_MM = 25.4;
const MM_TO_IN = 1 / 25.4;

function toMetric(input: VesselInput): { pMpa: number; rMm: number; dMm: number; caMm: number } {
  const p = input.units === 'imperial' ? input.pressure * PSI_TO_MPA : input.pressure;
  const dim = input.units === 'imperial' ? input.dimValue * IN_TO_MM : input.dimValue;
  const ca = input.units === 'imperial' ? input.ca * IN_TO_MM : input.ca;
  const dMm = input.dimMode === 'id' ? dim : dim * 2;
  return { pMpa: p, rMm: dMm / 2, dMm, caMm: ca };
}

/** UG-27 圆筒 */
function shellThickness(pMpa: number, rMm: number, sMpa: number, e: number) {
  const tCirc = (pMpa * rMm) / (sMpa * e - 0.6 * pMpa);
  const tLong = (pMpa * rMm) / (2 * sMpa * e + 0.4 * pMpa);
  return { tCirc, tLong, governing: (tCirc >= tLong ? 'circ' : 'long') as 'circ' | 'long' };
}

/** UG-32(d) 2:1 椭圆封头，K=1：t = P·D/(2SE − 0.2P)，等价 L=0.9D 半球 */
function ellip21Thickness(pMpa: number, dMm: number, sMpa: number, e: number) {
  return (pMpa * dMm) / (2 * sMpa * e - 0.2 * pMpa);
}

/** UG-32(e) 碟形封头：t = 0.885·P·L·M/(SE − 0.1P)，M = ¼(3+√(L/r)) */
export function torisphericalMFactor(lMm: number, rMm: number): number {
  return 0.25 * (3 + Math.sqrt(lMm / rMm));
}

function torisphericalThickness(pMpa: number, lMm: number, rMm: number, sMpa: number, e: number) {
  const m = torisphericalMFactor(lMm, rMm);
  return (0.885 * pMpa * lMm * m) / (sMpa * e - 0.1 * pMpa);
}

/** UG-32(f) 半球封头 */
function hemisphericalThickness(pMpa: number, rMm: number, sMpa: number, e: number) {
  return (pMpa * rMm) / (2 * sMpa * e - 0.2 * pMpa);
}

/** MAWP 回算（腐蚀后厚度 tc = 名义 − CA） */
function mawpFor(
  component: VesselComponent,
  sMpa: number,
  e: number,
  tcMm: number,
  rMm: number,
  dMm: number,
  lMm: number,
  knuckleMm: number,
): number {
  if (tcMm <= 0) return 0;
  switch (component) {
    case 'shell':
      // 取环向（控制向）反算
      return (sMpa * e * tcMm) / (rMm + 0.6 * tcMm);
    case 'ellipsoidal21':
      // UG-32(d) K=1 反算：t = P·D/(2SE − 0.2P) → P = 2SE·t/(D + 0.2t)
      return (2 * sMpa * e * tcMm) / (dMm + 0.2 * tcMm);
    case 'torispherical': {
      const m = torisphericalMFactor(lMm, knuckleMm);
      return (sMpa * e * tcMm) / (0.885 * lMm * m + 0.1 * tcMm);
    }
    case 'hemispherical':
      return (2 * sMpa * e * tcMm) / (rMm + 0.2 * tcMm);
  }
}

export function computeVesselThickness(input: VesselInput): VesselResult {
  const base: VesselResult = {
    valid: false,
    warnings: [],
    component: input.component,
    material: null,
    sMpa: 0,
    sKsi: 0,
    tDesignMm: 0,
    tWithCaMm: 0,
    nominalMm: 0,
    mawpMpa: 0,
    mawpPsi: 0,
    ug16Ok: true,
    pressureLimitOk: true,
  };

  const material = findVesselMaterial(input.materialId);
  if (!material) {
    base.error = 'Unknown material';
    return base;
  }
  base.material = material;

  let sMpa: number;
  if (input.sOverrideMpa != null && input.sOverrideMpa > 0) {
    sMpa = input.sOverrideMpa;
  } else {
    const looked = allowableStressMpa(material, input.tempF);
    if (looked === null) {
      base.error = 'over-temperature';
      base.warnings.push(
        `Design temperature ${input.tempF}°F exceeds the tabulated range (≤650°F). Interpolation is not permitted — use the latest ASME II-D for time-dependent values.`,
      );
      return base;
    }
    sMpa = looked;
  }
  base.sMpa = sMpa;
  base.sKsi = sMpa / 6.894757;

  const { pMpa, rMm, dMm, caMm } = toMetric(input);
  if (!(pMpa > 0) || !(rMm > 0) || !(input.jointE > 0)) {
    base.error = 'invalid-input';
    return base;
  }
  if (caMm < 0) {
    base.error = 'invalid-input';
    return base;
  }

  const e = input.jointE;
  const pressureLimit = 0.385 * sMpa * e;
  if (pMpa > pressureLimit) {
    base.pressureLimitOk = false;
    base.warnings.push(
      `P (${pMpa.toFixed(3)} MPa) exceeds 0.385·S·E (${pressureLimit.toFixed(2)} MPa) — outside the UG-27/UG-32 thin-wall formula scope. Special analysis required.`,
    );
  }

  let tDesign: number;
  if (input.component === 'shell') {
    const s = shellThickness(pMpa, rMm, sMpa, e);
    tDesign = s.governing === 'circ' ? s.tCirc : s.tLong;
    base.shell = {
      tCircMm: s.tCirc,
      tLongMm: s.tLong,
      governing: s.governing,
    };
  } else if (input.component === 'ellipsoidal21') {
    tDesign = ellip21Thickness(pMpa, dMm, sMpa, e);
    base.head = { dMm, crownLMm: 0.9 * dMm };
  } else if (input.component === 'torispherical') {
    const lMm = input.crownL != null
      ? (input.units === 'imperial' ? input.crownL * IN_TO_MM : input.crownL)
      : dMm;
    const rKnuckle = input.knuckleR != null
      ? (input.units === 'imperial' ? input.knuckleR * IN_TO_MM : input.knuckleR)
      : 0.06 * lMm;
    if (!(lMm > 0) || !(rKnuckle > 0)) {
      base.error = 'invalid-input';
      return base;
    }
    tDesign = torisphericalThickness(pMpa, lMm, rKnuckle, sMpa, e);
    base.head = { dMm, crownLMm: lMm, knuckleRMm: rKnuckle, mFactor: torisphericalMFactor(lMm, rKnuckle) };
  } else {
    tDesign = hemisphericalThickness(pMpa, rMm, sMpa, e);
    base.head = { dMm, crownLMm: rMm };
  }

  if (!(tDesign > 0)) {
    base.error = 'invalid-input';
    return base;
  }

  const tWithCa = tDesign + caMm;
  const nominal = roundUpPlateThickness(tWithCa);
  const tc = nominal - caMm;

  const lForMawp = input.component === 'torispherical' ? (base.head?.crownLMm ?? dMm) : (base.head?.crownLMm ?? rMm);
  const knuckleForMawp = base.head?.knuckleRMm ?? 0.06 * lForMawp;
  const mawpMpa = mawpFor(input.component, sMpa, e, tc, rMm, dMm, lForMawp, knuckleForMawp);

  base.valid = true;
  base.tDesignMm = tDesign;
  base.tWithCaMm = tWithCa;
  base.nominalMm = nominal;
  base.mawpMpa = mawpMpa;
  base.mawpPsi = mawpMpa / PSI_TO_MPA;

  // UG-16(b)：成形后最小厚度（不含 CA）≥ 1/16 in
  base.ug16Ok = tc >= UG16_MIN_THICKNESS_MM - 1e-9;
  if (!base.ug16Ok) {
    base.warnings.push(
      `Nominal ${nominal} mm minus CA ${caMm.toFixed(2)} mm = ${tc.toFixed(2)} mm < UG-16(b) minimum 1/16 in (≈1.6 mm, excluding CA). Increase nominal thickness.`,
    );
  }
  if (tWithCa > nominal - 1e-9 + 0) {
    // roundUpPlateThickness 保证 nominal ≥ tWithCa；系列上限 120mm 截断时提示
    if (tWithCa > 120) {
      base.warnings.push('Required thickness exceeds the 120 mm standard plate series — special plate/shell design required.');
    }
  }

  return base;
}

/** 换算辅助：mm → in，MPa → psi */
export const mmToIn = (mm: number) => mm * MM_TO_IN;
export const mpaToPsi = (mpa: number) => mpa / PSI_TO_MPA;
