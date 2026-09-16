/**
 * Valve weight calculation engine (catalog-calibrated).
 *
 *   W = W_base(type, class, NPS)          — catalog-calibrated WCB RF weight
 *     × F_end   (RF=1.0 · BW=0.97 · SW=0.82 · NPT=0.78)
 *     × F_op    (manual=1.0 · gear=1.18 for NPS ≥ 14 · actuated=1.12)
 *     × F_style (check valves only: swing=1.0 · lift=0.85 · wafer=0.45 · axial=0.7)
 *     × (ρ_material / ρ_WCB)
 *
 * Accuracy: the calibrated base values carry a ±10–15% band versus any
 * specific manufacturer's catalog (see valve-dimensions.ts header). The
 * result is an engineering estimate for freight, quoting and BOM purposes
 * — not a certified shipping weight.
 */

import {
  CHECK_STYLE_FACTORS,
  END_FACTORS,
  KG_TO_LB,
  OPERATION_FACTORS,
  VALVE_BASE_KG,
  VALVE_CLASSES,
  VALVE_FACE_TO_FACE_MM,
  VALVE_MATERIALS,
  VALVE_NPS_LIST,
  VALVE_TYPES,
  WCB_DENSITY,
  type ValveType,
} from '../data/valve-dimensions.ts';

export {
  CHECK_STYLE_FACTORS,
  END_FACTORS,
  KG_TO_LB,
  OPERATION_FACTORS,
  VALVE_CLASSES,
  VALVE_MATERIALS,
  VALVE_NPS_LIST,
  VALVE_TYPES,
};

export interface ValveWeightResult {
  valid: boolean;
  type: ValveType;
  typeName: string;
  cls: number;
  nps: number;
  npsLabel: string;
  material: string;
  end: string;
  operation: string;
  checkStyle: string;
  /** calibrated WCB RF base weight for this type/class/NPS (kg) */
  baseKg: number;
  endFactor: number;
  operationFactor: number;
  styleFactor: number;
  densityRatio: number;
  weightKg: number;
  weightLb: number;
  /** ASME B16.10 / API 6D face-to-face reference (mm, 0 if unknown) */
  faceToFaceMm: number;
}

/** NPS values valid for a class (600 stops at 12) */
export function validNpsFor(cls: number): number[] {
  const table = VALVE_BASE_KG.gate[cls as 150 | 300 | 600];
  if (!table) return [];
  return VALVE_NPS_LIST.filter((_, i) => table[i] > 0).map((n) => n.nps);
}

/** Base calibrated weight (kg, WCB, RF) for a type/class/NPS; 0 if not covered */
export function valveBaseKg(type: ValveType, cls: number, nps: number): number {
  const idx = VALVE_NPS_LIST.findIndex((n) => n.nps === nps);
  if (idx < 0) return 0;
  const table = VALVE_BASE_KG[type][cls as 150 | 300 | 600];
  return table ? table[idx] : 0;
}

export function computeValveWeight(
  type: ValveType,
  cls: number,
  nps: number,
  materialId: string,
  end: string,
  operation: string,
  checkStyle: string,
): ValveWeightResult {
  const info = VALVE_NPS_LIST.find((n) => n.nps === nps);
  const mat = VALVE_MATERIALS.find((m) => m.id === materialId) ?? VALVE_MATERIALS[0];
  const baseKg = valveBaseKg(type, cls, nps);

  const endF = END_FACTORS.find((e) => e.id === end)?.factor ?? 1;
  const opRaw = OPERATION_FACTORS.find((o) => o.id === operation)?.factor ?? 1;
  // Gear operators only make sense on large-bore multi-turn valves
  const opF = operation === 'gear' && nps < 14 ? 1.0 : opRaw;
  const styleF = type === 'check'
    ? (CHECK_STYLE_FACTORS.find((c) => c.id === checkStyle)?.factor ?? 1)
    : 1;

  const weightKg = baseKg * endF * opF * styleF * mat.ratio;

  const f2f = VALVE_FACE_TO_FACE_MM[type][cls as 150 | 300 | 600]?.[VALVE_NPS_LIST.findIndex((n) => n.nps === nps)] ?? 0;

  return {
    valid: Boolean(info) && baseKg > 0,
    type,
    typeName: VALVE_TYPES.find((t) => t.id === type)?.name ?? type,
    cls,
    nps,
    npsLabel: info ? info.label : `${nps}"`,
    material: mat.id,
    end,
    operation,
    checkStyle,
    baseKg,
    endFactor: endF,
    operationFactor: opF,
    styleFactor: styleF,
    densityRatio: mat.density / WCB_DENSITY,
    weightKg,
    weightLb: weightKg * KG_TO_LB,
    faceToFaceMm: f2f,
  };
}
