/**
 * Catalog-calibrated valve weight data — cast steel valves, flanged RF ends.
 *
 * Base values are reference weights (kg) for ASTM A216 WCB carbon steel,
 * flanged raised-face ends, hand-wheel / lever operated, assembled with the
 * standard bonnet for the type. Compiled from published manufacturer
 * catalog weight charts (gate / globe / check values cross-checked against
 * widely-referenced public catalog tables, e.g. wermac.org valve weight
 * charts compiled from European/Asian mill catalogs; Class 150 ball valve
 * values cross-checked against a published API 6D full-bore ball valve
 * dimension & weight chart).
 *
 * ⚠ Calibration accuracy: these are CALIBRATED REFERENCE values, not
 * guaranteed shipping weights. Typical deviation from any specific
 * manufacturer's catalog is ±10–15% (some types/sizes ±20%). Weights vary
 * with wall thickness selection (ASME B16.34 permits multiple wall
 * options), bonnet type, trim, and foundry practice. Ball valve values for
 * NPS ≥ 8 include trunnion mounting and are gear-operator equipped in most
 * catalogs.
 *
 * Structure length (face-to-face) is governed by ASME B16.10, which defines
 * "short" (former API 594/609 style), "regular" and "long" (former
 * ASME/MSS) patterns per valve type — gate valves default to long pattern,
 * globe/check to long pattern, ball valves commonly to short pattern (API
 * 6D / ISO 14313 defines its own face-to-face for pipeline ball valves).
 * The faceToFaceMm values below are long-pattern RF references per
 * ASME B16.10 for gate/globe/check and per the referenced API 6D chart for
 * ball valves; use them for orientation only and always confirm the
 * pattern ordered.
 *
 * Per-type calibrated tables are stored directly (rather than a single
 * gate baseline × factors) because the globe/gate and check/gate mass
 * ratios are not constant across NPS — a globe valve is heavier than a
 * gate valve at small NPS but lighter at large NPS. The multiplicative
 * factors below apply on top of these tables for end style, operation,
 * check-valve style, and material.
 */

export type ValveType = 'gate' | 'globe' | 'check' | 'ball';

export interface ValveTypeInfo {
  id: ValveType;
  name: string;
  std: string;
  desc: string;
}

export const VALVE_TYPES: ValveTypeInfo[] = [
  { id: 'gate',  name: 'Gate Valve',  std: 'API 600 / ASME B16.34', desc: 'Straight-through on/off isolation, full port, low pressure drop' },
  { id: 'globe', name: 'Globe Valve', std: 'API 602/623 / ASME B16.34', desc: 'Throttling / regulation service, high pressure drop' },
  { id: 'check', name: 'Check Valve', std: 'API 594 / ASME B16.34', desc: 'Automatic back-flow protection (swing / lift / wafer styles)' },
  { id: 'ball',  name: 'Ball Valve',  std: 'API 608/6D / ASME B16.34', desc: 'Quarter-turn on/off, full or reduced bore, tight shutoff' },
];

export interface ValveNpsInfo {
  nps: number;
  label: string;
  pipeOd: number; // mm, ASME B36.10M
}

/** NPS covered by the valve tables (independent copy — keeps this module loadable standalone) */
export const VALVE_NPS_LIST: ValveNpsInfo[] = [
  { nps: 0.5,  label: '1/2"',   pipeOd: 21.3 },
  { nps: 0.75, label: '3/4"',   pipeOd: 26.7 },
  { nps: 1,    label: '1"',     pipeOd: 33.4 },
  { nps: 1.25, label: '1-1/4"', pipeOd: 42.2 },
  { nps: 1.5,  label: '1-1/2"', pipeOd: 48.3 },
  { nps: 2,    label: '2"',     pipeOd: 60.3 },
  { nps: 2.5,  label: '2-1/2"', pipeOd: 73.0 },
  { nps: 3,    label: '3"',     pipeOd: 88.9 },
  { nps: 4,    label: '4"',     pipeOd: 114.3 },
  { nps: 5,    label: '5"',     pipeOd: 141.3 },
  { nps: 6,    label: '6"',     pipeOd: 168.3 },
  { nps: 8,    label: '8"',     pipeOd: 219.1 },
  { nps: 10,   label: '10"',    pipeOd: 273.0 },
  { nps: 12,   label: '12"',    pipeOd: 323.8 },
  { nps: 14,   label: '14"',    pipeOd: 355.6 },
  { nps: 16,   label: '16"',    pipeOd: 406.4 },
  { nps: 18,   label: '18"',    pipeOd: 457.2 },
  { nps: 20,   label: '20"',    pipeOd: 508.0 },
  { nps: 24,   label: '24"',    pipeOd: 609.6 },
];

/** Classes covered; 600 limited to NPS ≤ 12 */
export const VALVE_CLASSES = [150, 300, 600] as const;

/**
 * Catalog-calibrated base weights (kg, WCB, RF flanged ends, manual
 * operation). Index-aligned with VALVE_NPS_LIST. 0 = size not offered /
 * not covered. Values without a public catalog cross-check are
 * interpolations/estimates (marked ≈ in derived tables); all values carry
 * the ±10–15% calibration band stated in the header.
 */
export const VALVE_BASE_KG: Record<ValveType, Record<number, number[]>> = {
  gate: {
    150: [4, 5, 6.5, 8.5, 11, 21, 28, 36, 53, 60, 84, 139, 201, 320, 430, 548, 744, 1117, 1466],
    300: [6, 7, 9, 12, 15, 28, 36, 51, 78, 107, 144, 228, 320, 450, 694, 1080, 1235, 1655, 2320],
    600: [9, 11, 14, 18, 24, 41, 57, 72, 128, 200, 266, 419, 754, 1000, 0, 0, 0, 0, 0],
  },
  globe: {
    150: [4.5, 6, 8, 10, 13, 21, 30, 37, 57, 78, 100, 156, 261, 308, 430, 560, 750, 1050, 1500],
    300: [7, 9, 12, 16, 20, 31, 44, 55, 84, 110, 150, 225, 385, 520, 760, 1050, 1350, 1850, 2600],
    600: [12, 15, 19, 25, 32, 45, 64, 78, 135, 212, 327, 480, 860, 1150, 0, 0, 0, 0, 0],
  },
  check: {
    150: [3.5, 4.5, 6, 8, 11, 19, 24, 28, 48, 63, 79, 130, 200, 300, 451, 556, 760, 1020, 1450],
    300: [6, 8, 10, 13, 17, 31, 39, 45, 68, 90, 136, 220, 315, 449, 640, 880, 1150, 1580, 2250],
    600: [11, 14, 18, 23, 30, 32, 42, 60, 110, 161, 221, 346, 628, 796, 0, 0, 0, 0, 0],
  },
  // Ball: NPS ≤ 6 floating ball; NPS ≥ 8 trunnion (catalogs usually quote
  // with gear operator). Class 150 cross-checked against a published API 6D
  // full-bore chart; 300/600 derived estimates (≈).
  ball: {
    150: [5, 6, 7.5, 9.5, 11, 12, 16, 24, 36, 60, 94, 234, 406, 596, 829, 1092, 1577, 2001, 3075],
    300: [6, 7.5, 9.5, 12, 14, 16, 22, 30, 48, 78, 125, 300, 520, 760, 1050, 1380, 1850, 2400, 3600],
    600: [9, 11, 14, 18, 23, 24, 34, 45, 75, 130, 190, 430, 720, 1050, 0, 0, 0, 0, 0],
  },
};

/**
 * Face-to-face reference (RF, mm). Gate/globe/check: ASME B16.10 long
 * pattern; ball: API 6D short pattern (from the referenced catalog chart).
 * 0 = not listed — confirm per order.
 */
export const VALVE_FACE_TO_FACE_MM: Record<ValveType, Record<number, number[]>> = {
  gate: {
    150: [108, 117, 127, 140, 165, 178, 191, 203, 229, 254, 267, 292, 330, 356, 381, 406, 432, 457, 508],
    300: [117, 127, 140, 152, 178, 216, 241, 254, 279, 318, 330, 368, 419, 457, 483, 508, 546, 584, 648],
    600: [140, 152, 165, 178, 203, 241, 267, 292, 330, 368, 394, 457, 508, 559, 0, 0, 0, 0, 0],
  },
  globe: {
    150: [108, 117, 127, 140, 165, 190, 216, 241, 282, 317, 343, 419, 470, 521, 584, 648, 711, 775, 915],
    300: [117, 127, 140, 152, 178, 216, 241, 267, 305, 356, 381, 457, 521, 584, 648, 711, 775, 838, 991],
    600: [140, 152, 165, 178, 203, 267, 292, 318, 368, 419, 457, 524, 610, 673, 0, 0, 0, 0, 0],
  },
  check: {
    150: [108, 117, 127, 140, 165, 203, 216, 241, 292, 330, 356, 495, 622, 698, 787, 864, 978, 1067, 1219],
    300: [117, 127, 140, 152, 178, 241, 254, 279, 330, 368, 394, 533, 660, 737, 826, 902, 1016, 1105, 1257],
    600: [140, 152, 165, 178, 203, 267, 292, 318, 368, 419, 457, 559, 686, 787, 0, 0, 0, 0, 0],
  },
  ball: {
    150: [108, 117, 127, 140, 165, 178, 191, 203, 229, 356, 394, 457, 533, 610, 686, 762, 864, 914, 1067],
    300: [140, 152, 165, 178, 190, 216, 241, 283, 305, 381, 457, 521, 559, 635, 762, 838, 914, 991, 1143],
    600: [165, 178, 190, 203, 229, 292, 330, 356, 432, 508, 559, 660, 787, 838, 0, 0, 0, 0, 0],
  },
};

/** End connection factors (relative to RF flanged baseline) */
export const END_FACTORS: { id: string; name: string; factor: number; desc: string }[] = [
  { id: 'RF',  name: 'RF Flanged',     factor: 1.0,  desc: 'Raised-face flanged ends (baseline)' },
  { id: 'FF',  name: 'FF Flanged',     factor: 0.99, desc: 'Flat-face flanged ends (cast iron style)' },
  { id: 'BW',  name: 'Butt Weld',      factor: 0.97, desc: 'Butt-weld ends — catalogs show ~3–10% lighter than RF' },
  { id: 'SW',  name: 'Socket Weld',    factor: 0.82, desc: 'Socket-weld ends, typically NPS ≤ 2' },
  { id: 'NPT', name: 'Threaded (NPT)', factor: 0.78, desc: 'Screwed ends, typically NPS ≤ 2' },
];

/** Operation factors */
export const OPERATION_FACTORS: { id: string; name: string; factor: number; desc: string }[] = [
  { id: 'manual', name: 'Manual (handwheel/lever)', factor: 1.0,  desc: 'Handwheel for multi-turn, lever for quarter-turn (baseline)' },
  { id: 'gear',   name: 'Gear operated',            factor: 1.18, desc: 'Bevel gearbox + mounting — applies to NPS ≥ 14 large valves' },
  { id: 'actuated', name: 'Actuated (pneumatic/electric)', factor: 1.12, desc: 'Actuator mounting hardware allowance, actuator mass excluded' },
];

/** Check valve style factors (relative to swing-check RF baseline) */
export const CHECK_STYLE_FACTORS: { id: string; name: string; factor: number; desc: string }[] = [
  { id: 'swing',  name: 'Swing check',            factor: 1.0,  desc: 'Bolted-bonnet swing check, RF flanged (baseline)' },
  { id: 'lift',   name: 'Lift check',             factor: 0.85, desc: 'Bolted / pressure-seal lift check, compact body' },
  { id: 'wafer',  name: 'Wafer check (dual plate)', factor: 0.45, desc: 'Dual-plate wafer style, fits between flanges' },
  { id: 'axial',  name: 'Axial nozzle check',     factor: 0.7,  desc: 'Spring-loaded axial / nozzle check, compact' },
];

/** Common valve body materials, relative to A216 WCB (7,850 kg/m³) */
export interface ValveMaterial {
  id: string;
  name: string;
  standard: string;
  density: number;
  /** density relative to WCB baseline */
  ratio: number;
}

export const VALVE_MATERIALS: ValveMaterial[] = [
  { id: 'WCB',   name: 'Carbon Steel WCB',        standard: 'ASTM A216', density: 7850, ratio: 1.0 },
  { id: 'LCB',   name: 'Low-Temp Carbon Steel LCB', standard: 'ASTM A352', density: 7850, ratio: 1.0 },
  { id: 'WCC',   name: 'Carbon Steel WCC',        standard: 'ASTM A216', density: 7850, ratio: 1.0 },
  { id: 'WC9',   name: 'Alloy Steel WC9 (Cr-Mo)', standard: 'ASTM A217', density: 7850, ratio: 1.0 },
  { id: 'WC6',   name: 'Alloy Steel WC6 (Cr-Mo)', standard: 'ASTM A217', density: 7850, ratio: 1.0 },
  { id: 'CF8',   name: 'Stainless CF8 (304)',     standard: 'ASTM A351', density: 8000, ratio: 1.019 },
  { id: 'CF8M',  name: 'Stainless CF8M (316)',    standard: 'ASTM A351', density: 7980, ratio: 1.016 },
  { id: 'CF3M',  name: 'Stainless CF3M (316L)',   standard: 'ASTM A351', density: 7980, ratio: 1.016 },
];

export const KG_TO_LB = 2.20462;
export const WCB_DENSITY = 7850;
