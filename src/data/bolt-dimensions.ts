/**
 * Imperial bolt / nut dimensional data for ASME B16.5 flange bolting, bolting
 * material data, lubrication (nut factor) references and target assembly
 * bolt stresses in the spirit of ASME PCC-1 Appendix O.
 *
 * Sources & approximation notes (read before reusing):
 *  - Tensile stress area per ASME B1.1:
 *      A_t = 0.7854 * (d - 0.9743 / n)^2   [in^2],  n = threads per inch.
 *  - Thread series: studs <= 1" use UNC; studs >= 1-1/8" use the 8UN
 *    constant-pitch series (8 threads/in), which is standard practice for
 *    B16.5 flange stud bolts. The A_t formula applies to both.
 *  - Heavy-hex nut across-flats per ASME B18.2.2 (A194 2H / 2HM / 7 / 8 / 8M
 *    heavy hex nuts share these widths). Socket / wrench size = nut AF.
 *  - HOLE_TO_DIAMETER_IN maps ASME B16.5 bolt-hole diameters (the values
 *    stored in CLASS_DATA `bolts` strings, e.g. "8 x 22.2") to the standard
 *    stud diameter. Hole = stud + 1/8" clearance for studs <= 2-1/4",
 *    stud + 1/4" for larger studs, matching B16.5 hole sizes.
 *  - Nut factor K values are conventional mid-range engineering values from
 *    published literature (Shigley, Machinery's Handbook, PCC-1 commentary).
 *    K is empirical, not a material constant: scatter of +/-25% or more is
 *    normal for a given condition. Always verify safety-critical joints by
 *    measurement (skidmore / ultrasound), not by table.
 *  - TARGET_STRESSES follows the ASME PCC-1 Appendix O framework: the
 *    permissible assembly bolt stress band is 40%-70% of the material's
 *    specified minimum yield at ambient (the 40/70 framework is quoted in
 *    public adoption of Appendix O, e.g. API 660; 70% x 105 ksi Sy of
 *    A193 B7 = 73.5 ksi, the widely cited Appendix O default maximum for
 *    B7 <= 2-1/2"). No authoritative public reprint of the PCC-1 (2013)
 *    Table O-3 target-stress table could be located, so the DEFAULT target
 *    is set at 50% of yield (mid-band) and the values are labelled
 *    approximate engineering defaults, NOT code tabulations. Final target
 *    stress must come from the joint calculation (gasket seating stress,
 *    flange limits) per PCC-1 Appendix O.
 *  - `retention` tables are approximate yield-retention curves used for
 *    linear-interpolation temperature derating. Above `tempLimitC` the
 *    material is outside normal rating and the calculator returns invalid.
 */

export interface BoltSpec {
  dIn: number;        // nominal diameter (in)
  label: string;      // display label, e.g. '1/2"-13 UNC'
  tpi: number;        // threads per inch (UNC or 8UN)
  tensileAreaIn2: number; // ASME B1.1 A_t
  nutAfIn: number;    // heavy-hex nut across-flats (in)
}

const frac = (x: number): string => {
  // decimal inches -> nearest common fraction label (up to 1/16)
  const whole = Math.floor(x + 1e-9);
  const rem = x - whole;
  if (rem < 1e-9) return `${whole}`;
  let bn = 0;
  let bd = 1;
  let bestErr = Infinity;
  for (let d = 2; d <= 16; d++) {
    const n = Math.round(rem * d);
    const err = Math.abs(rem - n / d);
    if (n <= d && err < bestErr) { bestErr = err; bn = n; bd = d; }
  }
  if (bn === bd) return `${whole + 1}`;
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
  const gcd = g(bn, bd);
  bn /= gcd;
  bd /= gcd;
  return whole > 0 ? `${whole}-${bn}/${bd}` : `${bn}/${bd}`;
};

function spec(dIn: number, tpi: number, nutAfIn: number): BoltSpec {
  const series = dIn <= 1 ? 'UNC' : '8UN';
  return { dIn, tpi, nutAfIn, tensileAreaIn2: 0, label: `${frac(dIn)}"-${tpi} ${series}` };
}

// Nominal diameters used for B16.5 flange studs. Thread series: <=1" UNC
// (13, 11, 10, 9, 8 tpi), >=1-1/8" 8UN (8 tpi). Nut AF per ASME B18.2.2.
const RAW: [number, number, number][] = [
  // [dIn, tpi, nutAfIn]
  [0.5, 13, 0.875],
  [0.625, 11, 1.0625],
  [0.75, 10, 1.25],
  [0.875, 9, 1.4375],
  [1, 8, 1.625],
  [1.125, 8, 1.8125],
  [1.25, 8, 2.0],
  [1.375, 8, 2.1875],
  [1.5, 8, 2.375],
  [1.625, 8, 2.5625],
  [1.75, 8, 2.75],
  [1.875, 8, 2.9375],
  [2, 8, 3.125],
  [2.25, 8, 3.375],
  [2.5, 8, 3.75],
  [2.75, 8, 4.125],
  [3, 8, 4.5],
  [3.25, 8, 4.875],
  [3.5, 8, 5.25],
  [3.75, 8, 5.625],
  [4, 8, 6.0],
];

export const BOLT_SPECS: BoltSpec[] = RAW.map(([d, tpi, af]) => {
  const s = spec(d, tpi, af);
  s.tensileAreaIn2 = 0.7854 * Math.pow(d - 0.9743 / tpi, 2);
  return s;
});

/** Socket / wrench size (in) for a nut across-flats — same numeric size. */
export function wrenchSizeIn(nutAfIn: number): number {
  return nutAfIn;
}

/**
 * Map of ASME B16.5 bolt-hole diameter (mm, as stored in CLASS_DATA.bolts)
 * to the standard stud diameter (in). Derived: hole = stud + 3.2 mm (1/8")
 * for studs up to 2-1/4", stud + 6.4 mm (1/4") for larger studs.
 */
export const HOLE_TO_DIAMETER_IN: Record<number, number> = {
  15.9: 0.5, 19.1: 0.625, 22.2: 0.75, 25.4: 0.875, 28.6: 1.0,
  31.8: 1.125, 34.9: 1.25, 35.1: 1.25, 38.1: 1.375, 41.3: 1.5,
  44.5: 1.625, 47.6: 1.75, 50.8: 1.875, 54.0: 2.0, 60.3: 2.25,
  63.5: 2.25, 66.7: 2.5, 69.9: 2.5, 73.0: 2.75, 76.2: 2.75,
  82.6: 3.0, 88.9: 3.25, 101.6: 3.75,
};

/** Nearest standard spec at or below a given diameter (in). */
export function boltSpecFor(dIn: number): BoltSpec | undefined {
  let best: BoltSpec | undefined;
  for (const s of BOLT_SPECS) {
    if (s.dIn <= dIn + 1e-9) best = s;
  }
  return best ?? BOLT_SPECS[0];
}

/** Standard spec for a B16.5 bolt-hole diameter (mm). */
export function boltSpecForHole(holeMm: number): BoltSpec | undefined {
  const exact = HOLE_TO_DIAMETER_IN[holeMm];
  if (exact) return boltSpecFor(exact);
  // fallback: nearest known hole
  let bestKey = 15.9;
  let bestErr = Infinity;
  for (const k of Object.keys(HOLE_TO_DIAMETER_IN)) {
    const err = Math.abs(Number(k) - holeMm);
    if (err < bestErr) { bestErr = err; bestKey = Number(k); }
  }
  return boltSpecFor(HOLE_TO_DIAMETER_IN[bestKey]);
}

export interface BoltMaterial {
  id: string;
  name: string;
  spec: string;
  yieldKsi: number;    // specified min yield, <=2-1/2" dia, ambient
  tensileKsi: number;  // specified min tensile, ambient
  eGpa: number;        // elastic modulus reference (~200 GPa for steel bolting)
  tempLimitC: number;  // sustained service ceiling used here (approximate)
  retention: [number, number][]; // [tempC, yield retention factor] — APPROXIMATE
  note: string;
}

export const BOLT_MATERIALS: BoltMaterial[] = [
  {
    id: 'b7', name: 'A193 B7 (Cr-Mo)', spec: 'ASTM A193 B7',
    yieldKsi: 105, tensileKsi: 125, eGpa: 200, tempLimitC: 454,
    retention: [[20, 1.0], [100, 0.97], [200, 0.94], [300, 0.90], [350, 0.88], [400, 0.85], [454, 0.83]],
    note: 'Quenched & tempered Cr-Mo; standard process-plant stud. Yield 105 ksi applies <= 2-1/2" dia.',
  },
  {
    id: 'b7m', name: 'A193 B7M (sour service)', spec: 'ASTM A193 B7M',
    yieldKsi: 80, tensileKsi: 100, eGpa: 200, tempLimitC: 343,
    retention: [[20, 1.0], [100, 0.97], [200, 0.93], [300, 0.89], [343, 0.86]],
    note: 'Hardness-controlled B7 variant for NACE MR0175 sour service; lower strength than B7.',
  },
  {
    id: 'b8', name: 'A193 B8 Cl.2 (304 SS)', spec: 'ASTM A193 B8 Cl.2',
    yieldKsi: 75, tensileKsi: 125, eGpa: 193, tempLimitC: 538,
    retention: [[20, 1.0], [100, 0.86], [200, 0.76], [300, 0.71], [400, 0.68], [538, 0.65]],
    note: 'Strain-hardened 304 stainless, class 2. Yield varies by dia (75 ksi <= 3/4", lower above). Galling-prone — lubrication mandatory.',
  },
  {
    id: 'b8m', name: 'A193 B8M Cl.2 (316 SS)', spec: 'ASTM A193 B8M Cl.2',
    yieldKsi: 75, tensileKsi: 110, eGpa: 193, tempLimitC: 538,
    retention: [[20, 1.0], [100, 0.88], [200, 0.82], [300, 0.79], [400, 0.77], [538, 0.75]],
    note: 'Strain-hardened 316 stainless, class 2. Better high-temperature retention than B8; same galling caution.',
  },
  {
    id: 'l7', name: 'A320 L7 (low temp)', spec: 'ASTM A320 L7',
    yieldKsi: 105, tensileKsi: 125, eGpa: 200, tempLimitC: 343,
    retention: [[20, 1.0], [100, 0.98], [200, 0.95], [300, 0.92], [343, 0.90]],
    note: 'Impact-rated Cr-Mo for low-temperature service (rated to about -73 deg C); same strength class as B7 at ambient.',
  },
];

export interface Lubrication {
  id: string;
  name: string;
  K: number; // empirical nut factor
  note: string;
}

/**
 * K is the empirical nut factor in T = K*D*F — NOT a pure friction
 * coefficient. Conventional mid-range values; actual K for a given
 * lubricant/condition can scatter +/-25%.
 */
export const LUBRICATIONS: Lubrication[] = [
  { id: 'dry', name: 'Dry (as-received)', K: 0.20, note: 'No intentional lubricant. Conservative table value; real dry assemblies can run much higher K (0.25-0.35+).' },
  { id: 'oil', name: 'Machine oil', K: 0.15, note: 'Light machine oil on threads and nut bearing face.' },
  { id: 'moly', name: 'MoS2 paste', K: 0.13, note: 'Molybdenum-disulfide based anti-friction paste, threads + nut face.' },
  { id: 'ptfe', name: 'PTFE / anti-seize coating', K: 0.12, note: 'PTFE-based coating or anti-seize compound; lowest typical K.' },
];

export interface TargetStress {
  materialId: string;
  targetKsi: number;  // default assembly bolt stress @ ambient (APPROXIMATE)
  minKsi: number;     // ~40% of yield (lower band edge)
  maxKsi: number;     // ~70% of yield (Appendix O style upper cap)
  basis: string;
}

/**
 * Approximate target assembly bolt stresses per the PCC-1 Appendix O
 * framework (40-70% of yield band; default = 50% of yield). Stainless
 * defaults sit at the band floor because PCC-1 practice treats
 * strain-hardened stainless conservatively (galling / seizing control).
 * See file header: these are NOT code tabulations.
 */
export const TARGET_STRESSES: TargetStress[] = [
  { materialId: 'b7',  targetKsi: 52.5, minKsi: 42.0, maxKsi: 73.5, basis: '50% of 105 ksi yield (band 40-70%)' },
  { materialId: 'b7m', targetKsi: 40.0, minKsi: 32.0, maxKsi: 56.0, basis: '50% of 80 ksi yield (band 40-70%)' },
  { materialId: 'b8',  targetKsi: 30.0, minKsi: 30.0, maxKsi: 52.5, basis: '~40% of 75 ksi yield; stainless kept at band floor (galling control)' },
  { materialId: 'b8m', targetKsi: 30.0, minKsi: 30.0, maxKsi: 52.5, basis: '~40% of 75 ksi yield; stainless kept at band floor (galling control)' },
  { materialId: 'l7',  targetKsi: 52.5, minKsi: 42.0, maxKsi: 73.5, basis: '50% of 105 ksi yield (band 40-70%)' },
];

export function targetStressFor(materialId: string): TargetStress {
  return TARGET_STRESSES.find((t) => t.materialId === materialId) ?? TARGET_STRESSES[0];
}

export function materialById(id: string): BoltMaterial {
  return BOLT_MATERIALS.find((m) => m.id === id) ?? BOLT_MATERIALS[0];
}

export function lubricationById(id: string): Lubrication {
  return LUBRICATIONS.find((l) => l.id === id) ?? LUBRICATIONS[0];
}
