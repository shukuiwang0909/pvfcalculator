/**
 * Valve Cv sizing engine — ISA-75.01 / IEC 60534-2-1 (Fisher handbook form).
 *
 * Three fluid modes (liquid / gas / steam) × three solve modes:
 *   sizing : known flow + ΔP → required Cv
 *   flow   : known Cv + ΔP   → max flow (gpm / scfh / lb/h)
 *   dp     : known Cv + flow → resulting ΔP
 *
 * Choking:
 *  - Liquid : warn when ΔP ≥ FL²·P1 (simplified vapor-pressure-free screen;
 *             rigorous form is ΔP ≥ FL²·(P1 − F_F·Pv)).
 *  - Gas/steam : x = ΔP/P1; choked when x ≥ F_k·x_T. Non-choked results use
 *             Y = 1 − x/(3·F_k·x_T); choked results cap Y at 2/3 and
 *             recompute the flow at the choking pressure ratio.
 */

import {
  GASES,
  LIQUIDS,
  N6,
  N8,
  RATED_CV,
  RATED_CV_NPS,
  STEAM_K,
  STEAM_RHO,
  VALVE_STYLE,
  type CvFluidKind,
} from '../data/valve-cv.ts';

export { GASES, LIQUIDS, RATED_CV, RATED_CV_NPS, VALVE_STYLE };

export type CvSolveMode = 'sizing' | 'flow' | 'dp';

export interface CvInput {
  fluid: CvFluidKind;
  mode: CvSolveMode;
  /** liquid: flow gpm · gas: flow scfh · steam: mass flow lb/h */
  flow?: number;
  cv?: number;
  /** pressures in psia (absolute) */
  p1: number;
  p2?: number;
  /** pressure drop psi (sizing/flow modes) */
  dp?: number;
  /** liquid specific gravity (water = 1) */
  sg?: number;
  /** gas specific gravity (air = 1) */
  gg?: number;
  /** gas/steam absolute inlet temperature, °R for gas · °F for steam (superheat) */
  t1?: number;
  /** compressibility factor (gas) */
  z?: number;
  valveStyle: string;
}

export interface CvResult {
  valid: boolean;
  error?: string;
  fluid: CvFluidKind;
  mode: CvSolveMode;
  cv: number;
  /** solved quantities */
  flowGpm?: number;
  flowScfh?: number;
  massLbPerHr?: number;
  dp: number;
  p1: number;
  p2: number;
  choked: boolean;
  x: number;
  y: number;
  fk: number;
  xt: number;
  fl: number;
  /** flow at choking when choked (for the given Cv), same units as input flow */
  chokedFlowLimit?: number;
  note?: string;
}

const styleOf = (id: string) => VALVE_STYLE.find((s) => s.id === id) ?? VALVE_STYLE[0];

function fail(input: CvInput, error: string): CvResult {
  return {
    valid: false, error, fluid: input.fluid, mode: input.mode,
    cv: 0, dp: input.dp ?? 0, p1: input.p1, p2: input.p2 ?? 0,
    choked: false, x: 0, y: 1, fk: 1, xt: 0, fl: 0,
  };
}

function bisect(fn: (x: number) => number, lo: number, hi: number, target = 0): number {
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const v = fn(mid) - target;
    if (Math.abs(v) < 1e-9) return mid;
    if (v > 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Saturated steam density (lb/ft³) at pressure psia — linear interpolation */
export function steamDensity(pPsia: number): number {
  if (pPsia <= STEAM_RHO[0][0]) {
    return (STEAM_RHO[0][1] / STEAM_RHO[0][0]) * pPsia; // rough low-pressure linearization
  }
  for (let i = 1; i < STEAM_RHO.length; i++) {
    if (pPsia <= STEAM_RHO[i][0]) {
      const [p0, r0] = STEAM_RHO[i - 1];
      const [p1v, r1] = STEAM_RHO[i];
      return r0 + ((r1 - r0) * (pPsia - p0)) / (p1v - p0);
    }
  }
  const [p0, r0] = STEAM_RHO[STEAM_RHO.length - 2];
  const [p1v, r1] = STEAM_RHO[STEAM_RHO.length - 1];
  const slope = (r1 - r0) / (p1v - p0);
  return r1 + slope * (pPsia - p1v);
}

// ---------------------------------------------------------------- liquid

function liquid(input: CvInput): CvResult {
  const st = styleOf(input.valveStyle);
  const sg = input.sg ?? 1;
  if (!(input.p1 > 0)) return fail(input, 'P1 must be positive (psia).');

  if (input.mode === 'sizing') {
    const dp = input.dp ?? 0;
    if (!(input.flow! > 0)) return fail(input, 'Flow must be positive.');
    if (!(dp > 0)) return fail(input, 'ΔP must be positive.');
    const choked = dp >= st.fl * st.fl * input.p1;
    return {
      valid: true, fluid: 'liquid', mode: 'sizing',
      cv: input.flow! * Math.sqrt(sg / dp), dp, p1: input.p1, p2: input.p1 - dp,
      choked, x: dp / input.p1, y: 1, fk: 1, xt: 0, fl: st.fl,
      chokedFlowLimit: choked ? st.fl * Math.sqrt(st.fl * st.fl * input.p1 / sg) : undefined,
      note: choked ? 'Liquid flow is choked (ΔP ≥ F_L²·P1). The required Cv is computed on the requested ΔP; flow will not increase beyond the choked limit.' : undefined,
    };
  }
  if (input.mode === 'flow') {
    const dp = input.dp ?? 0;
    if (!(input.cv! > 0)) return fail(input, 'Cv must be positive.');
    if (dp < 0) return fail(input, 'ΔP must not be negative.');
    const choked = dp >= st.fl * st.fl * input.p1;
    const effDp = choked ? st.fl * st.fl * input.p1 : dp;
    return {
      valid: true, fluid: 'liquid', mode: 'flow',
      cv: input.cv!, flowGpm: input.cv! * Math.sqrt(effDp / sg),
      dp: effDp, p1: input.p1, p2: input.p1 - effDp,
      choked, x: effDp / input.p1, y: 1, fk: 1, xt: 0, fl: st.fl,
      note: choked ? 'Requested ΔP exceeds the choked limit — flow is capped at the choking pressure drop ΔP = F_L²·P1.' : undefined,
    };
  }
  // dp mode
  if (!(input.cv! > 0) || !(input.flow! > 0)) return fail(input, 'Cv and flow must be positive.');
  const dp = sg * Math.pow(input.flow! / input.cv!, 2);
  const choked = dp >= st.fl * st.fl * input.p1;
  return {
    valid: true, fluid: 'liquid', mode: 'dp',
    cv: input.cv!, flowGpm: input.flow!, dp: Math.min(dp, st.fl * st.fl * input.p1),
    p1: input.p1, p2: input.p1 - Math.min(dp, st.fl * st.fl * input.p1),
    choked, x: dp / input.p1, y: 1, fk: 1, xt: 0, fl: st.fl,
    note: choked ? 'The required ΔP exceeds the choked limit — the valve cannot pass this flow at any ΔP. Increase Cv.' : undefined,
  };
}

// -------------------------------------------------------- gas and steam

function gasLike(input: CvInput, fluid: 'gas' | 'steam'): CvResult {
  const st = styleOf(input.valveStyle);
  if (!(input.p1 > 0)) return fail(input, 'P1 must be positive (psia).');

  const k = input.k ?? (fluid === 'gas' ? 1.4 : STEAM_K);
  const fk = k / 1.4;
  const xChoke = fk * st.xt;

  // capacity(x) = Y·sqrt(x)  — non-choked branch
  const cap = (x: number) => (1 - x / (3 * xChoke)) * Math.sqrt(x);

  const params = (x: number) => {
    const choked = x >= xChoke;
    const y = choked ? 2 / 3 : 1 - x / (3 * xChoke);
    return { choked, y, xEff: Math.min(x, xChoke) };
  };

  const solve = (x: number) => {
    const { choked, y, xEff } = params(x);
    let cv: number;
    if (fluid === 'gas') {
      cv = input.flow! / (N8 * input.p1 * y) * Math.sqrt(((input.gg ?? 1) * (input.t1 ?? 520) * (input.z ?? 1)) / xEff);
    } else {
      const rho1 = steamDensity(input.p1);
      cv = input.massLbPerHr ? input.massLbPerHr / (N6 * y * Math.sqrt(xEff * input.p1 * rho1)) : NaN;
    }
    return { cv, choked, y, xEff };
  };

  if (input.mode === 'sizing') {
    const flowGiven = fluid === 'gas' ? input.flow : input.massLbPerHr;
    if (!(flowGiven! > 0)) return fail(input, 'Flow must be positive.');
    const dp = input.dp ?? 0;
    if (!(dp > 0)) return fail(input, 'ΔP must be positive.');
    const x = dp / input.p1;
    const { cv, choked, y, xEff } = solve(x);
    const r: CvResult = {
      valid: true, fluid, mode: 'sizing', cv, dp: xEff * input.p1, p1: input.p1,
      p2: input.p1 - xEff * input.p1, choked, x, y, fk, xt: st.xt, fl: st.fl,
    };
    if (fluid === 'gas') r.flowScfh = input.flow; else r.massLbPerHr = input.massLbPerHr;
    if (choked) {
      r.note = 'Flow is CHOKED (x ≥ F_k·x_T). Reported Cv uses the choking pressure ratio with Y = 2/3 — a larger ΔP will not increase flow.';
    }
    return r;
  }

  if (input.mode === 'flow') {
    if (!(input.cv! > 0)) return fail(input, 'Cv must be positive.');
    const dp = input.dp ?? 0;
    if (dp < 0) return fail(input, 'ΔP must not be negative.');
    const xReq = dp / input.p1;
    const choked = xReq >= xChoke;
    const xEff = Math.min(xReq, xChoke);
    const y = choked ? 2 / 3 : 1 - xEff / (3 * xChoke);
    const r: CvResult = {
      valid: true, fluid, mode: 'flow', cv: input.cv!, dp: xEff * input.p1,
      p1: input.p1, p2: input.p1 - xEff * input.p1, choked, x: xReq, y, fk, xt: st.xt, fl: st.fl,
    };
    if (fluid === 'gas') {
      r.flowScfh = input.cv! * N8 * input.p1 * y * Math.sqrt(xEff / ((input.gg ?? 1) * (input.t1 ?? 520) * (input.z ?? 1)));
      r.chokedFlowLimit = r.flowScfh;
    } else {
      const rho1 = steamDensity(input.p1);
      r.massLbPerHr = input.cv! * N6 * y * Math.sqrt(xEff * input.p1 * rho1);
      r.chokedFlowLimit = r.massLbPerHr;
    }
    if (choked) r.note = 'Requested ΔP produces choked flow — the valve passes its maximum (sonic) flow. Reduce ΔP or increase Cv for more flow.';
    return r;
  }

  // dp mode: known Cv + flow → required ΔP
  if (!(input.cv! > 0)) return fail(input, 'Cv must be positive.');
  const flowGiven = fluid === 'gas' ? input.flow : input.massLbPerHr;
  if (!(flowGiven! > 0)) return fail(input, 'Flow must be positive.');

  // flow = Cv·N8·P1·Y·sqrt(x/A)  →  Y·sqrt(x) = flow·sqrt(A)/(Cv·N8·P1)  (gas; analogous for steam)
  let target: number;
  if (fluid === 'gas') {
    target = (input.flow! * Math.sqrt((input.gg ?? 1) * (input.t1 ?? 520) * (input.z ?? 1))) / (input.cv! * N8 * input.p1);
  } else {
    const rho1 = steamDensity(input.p1);
    target = input.massLbPerHr! / (input.cv! * N6 * Math.sqrt(input.p1 * rho1));
  }
  const maxCap = cap(xChoke);
  if (target >= maxCap) {
    const r: CvResult = {
      valid: true, fluid, mode: 'dp', cv: input.cv!, dp: xChoke * input.p1,
      p1: input.p1, p2: input.p1 - xChoke * input.p1, choked: true, x: xChoke, y: 2 / 3,
      fk, xt: st.xt, fl: st.fl,
      note: 'Even at choking, this Cv is too small for the requested flow. Increase Cv (valve is undersized).',
    };
    if (fluid === 'gas') r.flowScfh = input.flow; else r.massLbPerHr = input.massLbPerHr;
    return r;
  }
  const x = bisect((xv) => cap(xv), 1e-6, xChoke, target);
  const y = 1 - x / (3 * xChoke);
  const r: CvResult = {
    valid: true, fluid, mode: 'dp', cv: input.cv!, dp: x * input.p1,
    p1: input.p1, p2: input.p1 - x * input.p1, choked: false, x, y, fk, xt: st.xt, fl: st.fl,
  };
  if (fluid === 'gas') r.flowScfh = input.flow; else r.massLbPerHr = input.massLbPerHr;
  return r;
}

// ----------------------------------------------------------------- main

export function computeCv(input: CvInput & { k?: number }): CvResult {
  if (input.fluid === 'liquid') return liquid(input);
  return gasLike(input, input.fluid);
}

/** Convenience: liquid sizing shortcut */
export function liquidCv(flowGpm: number, sg: number, dpPsi: number): number {
  return flowGpm * Math.sqrt(sg / dpPsi);
}
