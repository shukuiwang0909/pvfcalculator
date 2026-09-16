/**
 * Cross-check of the catalog-calibrated valve weight tables against
 * published manufacturer catalog values (see src/data/valve-dimensions.ts
 * header for sources). Acceptance: deviation ≤ 15% on every spec.
 *
 * Run:  node --experimental-strip-types scripts/check-valve-weights.ts
 * (Node ≥ 22; imports inside src use explicit .ts extensions so this file
 *  runs without any transpiler or extra dependency.)
 */

import { computeValveWeight } from '../src/lib/valve-calculations.ts';

interface Check {
  label: string;
  type: 'gate' | 'globe' | 'check' | 'ball';
  cls: number;
  nps: number;
  catalogKg: number;
  source: string;
}

const CHECKS: Check[] = [
  // wermac.org gate valve chart (compiled from manufacturer catalogs)
  { label: '2" Class 150 gate, RF, WCB',      type: 'gate', cls: 150, nps: 2,  catalogKg: 21,   source: 'wermac gate 150' },
  { label: '6" Class 300 gate, RF, WCB',      type: 'gate', cls: 300, nps: 6,  catalogKg: 144,  source: 'wermac gate 300' },
  { label: '12" Class 150 gate, RF, WCB',     type: 'gate', cls: 150, nps: 12, catalogKg: 320,  source: 'wermac gate 150' },
  // wermac.org globe valve chart
  { label: '4" Class 300 globe, RF, WCB',     type: 'globe', cls: 300, nps: 4, catalogKg: 84,   source: 'wermac globe 300' },
  { label: '2" Class 600 globe, RF, WCB',     type: 'globe', cls: 600, nps: 2, catalogKg: 45,   source: 'wermac globe 600' },
  // wermac.org check valve chart
  { label: '8" Class 150 check (swing), RF',  type: 'check', cls: 150, nps: 8, catalogKg: 130,  source: 'wermac check 150' },
  { label: '2" Class 600 check (swing), RF',  type: 'check', cls: 600, nps: 2, catalogKg: 32,   source: 'wermac check 600' },
  // API 6D full-bore ball valve chart (Relia Valve, Class 150)
  { label: '4" Class 150 ball, RF, WCB',      type: 'ball',  cls: 150, nps: 4, catalogKg: 36,   source: 'API 6D ball 150' },
  { label: '6" Class 300 ball, RF, WCB (est.)', type: 'ball', cls: 300, nps: 6, catalogKg: 125, source: 'ball 300 estimate' },
];

const TOL = 15; // %
let failures = 0;

console.log('Valve weight calibration check (WCB, RF flanged ends, manual)\n');

for (const c of CHECKS) {
  const r = computeValveWeight(c.type, c.cls, c.nps, 'WCB', 'RF', 'manual', 'swing');
  if (!r.valid) {
    console.log(`FAIL  ${c.label}: engine returned invalid (size not covered?)`);
    failures++;
    continue;
  }
  const dev = ((r.weightKg - c.catalogKg) / c.catalogKg) * 100;
  const pass = Math.abs(dev) <= TOL;
  if (!pass) failures++;
  console.log(
    `${pass ? 'PASS' : 'FAIL'}  ${c.label}: calc ${r.weightKg.toFixed(1)} kg vs catalog ${c.catalogKg} kg (${c.source}) — dev ${dev >= 0 ? '+' : ''}${dev.toFixed(1)}%, tol ±${TOL}%`,
  );
}

// Sanity: BW end factor stays inside catalog band (wermac 150 gate 2" BW = 18 kg)
const bw = computeValveWeight('gate', 150, 2, 'WCB', 'BW', 'manual', 'swing');
console.log(`\nBW check 2" 150 gate: calc ${bw.weightKg.toFixed(1)} kg vs catalog ~18 kg (dev ${(((bw.weightKg - 18) / 18) * 100).toFixed(1)}%, informational)`);

// Sanity: gear factor on large-bore valve (wermac 300 gate 16" RF GO = 1172 kg)
const gear = computeValveWeight('gate', 300, 16, 'WCB', 'RF', 'gear', 'swing');
console.log(`Gear check 16" 300 gate: calc ${gear.weightKg.toFixed(0)} kg vs catalog ~1172 kg (dev ${(((gear.weightKg - 1172) / 1172) * 100).toFixed(1)}%, informational)`);

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
