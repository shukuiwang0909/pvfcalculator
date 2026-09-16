/**
 * Control/shutoff valve Cv (flow coefficient) sizing data.
 *
 * Equations follow the ISA-75.01 / IEC 60534-2-1 convention as popularized
 * in the Emerson/Fisher control valve handbook:
 *
 *  LIQUID (turbulent, non-choked):
 *      Cv = Q · √(SG / ΔP)             Q in gpm, ΔP in psi
 *    Choked when ΔP ≥ FL² · (P1 − F_F · Pv). This calculator uses the
 *    simplified screening check ΔP ≥ FL² · P1 (vapor-pressure-free) and
 *    flags it as a choking warning.
 *
 *  GAS / VAPOUR (non-choked, expansion-factor form):
 *      Cv = Q / (N8 · P1 · Y) · √(G_g · T1 · Z / x)
 *    with Q in scfh (60 °F, 14.696 psia), P1 in psia, T1 in °R,
 *    x = ΔP/P1, N8 = 19.3, and
 *      Y = 1 − x / (3 · F_k · x_T) ,   F_k = k / 1.4
 *    valid for x < F_k · x_T (non-choked). At x ≥ F_k · x_T the flow is
 *    choked; Y floors at 2/3 and flow no longer increases with ΔP.
 *
 *  STEAM (simplified saturated-steam mass-flow form):
 *      Cv = w / (N6 · Y · √(ΔP · P1 · ρ1))
 *    with w in lb/h, P in psia, ρ1 = inlet saturated-steam density in
 *    lb/ft³ (small lookup table below), N6 = 2.09. Same choking rule.
 *
 * All rated-Cv values in RATED_CV are TYPICAL PUBLISHED REFERENCE values
 * for full-port valves of each type (manufacturer catalogs vary — use them
 * for order-of-magnitude comparison only, never as a substitute for the
 * manufacturer's published Cv of the specific valve).
 */

export type CvFluidKind = 'liquid' | 'gas' | 'steam';

export interface CvModeInfo {
  id: 'sizing' | 'flow' | 'dp';
  name: string;
  desc: string;
}

export const CV_MODES: CvModeInfo[] = [
  { id: 'sizing', name: 'Size the valve (find Cv)', desc: 'Known flow and pressure drop → required Cv' },
  { id: 'flow', name: 'Max flow from known Cv', desc: 'Known Cv and pressure drop → flow rate' },
  { id: 'dp', name: 'Pressure drop from known Cv', desc: 'Known Cv and flow → required / resulting ΔP' },
];

/** Common liquids — specific gravity (water = 1.0 at 60 °F) */
export const LIQUIDS: { id: string; name: string; sg: number; note?: string }[] = [
  { id: 'water',    name: 'Water (fresh)',      sg: 1.0 },
  { id: 'seawater', name: 'Seawater',           sg: 1.025 },
  { id: 'gasoline', name: 'Gasoline (petrol)',  sg: 0.74 },
  { id: 'diesel',   name: 'Diesel / heating oil', sg: 0.85 },
  { id: 'kerosene', name: 'Kerosene (jet A-1)', sg: 0.81 },
  { id: 'ethanol',  name: 'Ethanol',            sg: 0.789 },
  { id: 'glycerin', name: 'Glycerin (glycerol)', sg: 1.26 },
  { id: 'crude',    name: 'Crude oil (typical)', sg: 0.86, note: 'varies 0.79–0.92 by field' },
];

/** Common gases — specific gravity G_g (air = 1.0) and ratio of specific heats k */
export const GASES: { id: string; name: string; gg: number; k: number }[] = [
  { id: 'air',      name: 'Air',             gg: 1.0,    k: 1.40 },
  { id: 'nitrogen', name: 'Nitrogen (N₂)',   gg: 0.967,  k: 1.40 },
  { id: 'oxygen',   name: 'Oxygen (O₂)',     gg: 1.105,  k: 1.40 },
  { id: 'natgas',   name: 'Natural gas (typ.)', gg: 0.60, k: 1.31 },
  { id: 'hydrogen', name: 'Hydrogen (H₂)',   gg: 0.0696, k: 1.41 },
  { id: 'co2',      name: 'Carbon dioxide (CO₂)', gg: 1.52, k: 1.30 },
  { id: 'argon',    name: 'Argon (Ar)',      gg: 1.38,   k: 1.67 },
];

/** Steam (simplified): k used for F_k; density from saturated table */
export const STEAM_K = 1.3;

/**
 * Saturated steam density lookup (inlet pressure psia → lb/ft³).
 * Ideal for quick sizing; enter the calculator with the actual flowing
 * pressure and the engine interpolates this table.
 */
export const STEAM_RHO: [number, number][] = [
  [15, 0.0373], [50, 0.1174], [100, 0.2255], [150, 0.3316], [200, 0.4370],
  [250, 0.5418], [300, 0.6480], [400, 0.8610], [500, 1.0770], [600, 1.2990],
  [800, 1.7570], [1000, 2.2430], [1500, 3.6180],
];

/** Valve style factors: liquid pressure-recovery factor FL and gas choking parameter xT */
export const VALVE_STYLE: {
  id: string; name: string; fl: number; xt: number; note: string;
}[] = [
  { id: 'ball',    name: 'Full-port ball valve',      fl: 0.95, xt: 0.25, note: 'High recovery, low loss' },
  { id: 'gate',    name: 'Gate valve (full port)',    fl: 0.95, xt: 0.20, note: 'Treat as low-loss fitting' },
  { id: 'butterfly', name: 'Butterfly valve (60–90° open)', fl: 0.85, xt: 0.35, note: 'xT varies strongly with disc angle' },
  { id: 'globe',   name: 'Globe / control valve',     fl: 0.90, xt: 0.70, note: 'Low recovery — resists choking' },
  { id: 'check',   name: 'Swing check valve',         fl: 0.85, xt: 0.40, note: 'Cracking pressure not modeled' },
  { id: 'plug',    name: 'Plug valve (full port)',    fl: 0.93, xt: 0.27, note: '' },
];

/**
 * Typical published rated Cv of FULL-PORT valves, by NPS — for side-by-side
 * comparison only. Compiled from common manufacturer catalog charts; real
 * values span roughly ±25% around these. Globe values assume a contoured
 * plug at 100% travel.
 */
export const RATED_CV: Record<'ball' | 'gate' | 'globe', Record<number, number>> = {
  ball: {
    0.5: 24, 0.75: 52, 1: 96, 1.25: 160, 1.5: 230, 2: 420, 2.5: 700, 3: 1100,
    4: 1900, 5: 3200, 6: 5000, 8: 10000, 10: 17000, 12: 25000,
  },
  gate: {
    0.5: 20, 0.75: 45, 1: 80, 1.25: 135, 1.5: 190, 2: 380, 2.5: 620, 3: 1000,
    4: 1700, 5: 2900, 6: 4500, 8: 9000, 10: 15000, 12: 22000,
  },
  globe: {
    0.5: 7, 0.75: 12, 1: 22, 1.25: 36, 1.5: 55, 2: 100, 2.5: 165, 3: 250,
    4: 420, 5: 700, 6: 1100, 8: 1900, 10: 3200, 12: 4600,
  },
};

export const RATED_CV_NPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12];

/** ISA-75.01 / Fisher numerical constants (US customary units) */
export const N8 = 19.3; // scfh, psia, °R
export const N6 = 2.09; // lb/h, psia, lb/ft³

export const PSI_TO_BAR = 0.0689476;
export const BAR_TO_PSI = 14.5038;
export const GPM_TO_M3H = 0.227125;
export const M3H_TO_GPM = 4.40287;
export const SCFH_TO_NM3H = 0.0268;
