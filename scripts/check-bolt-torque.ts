/**
 * Validation of src/lib/bolt-calculations.ts against publicly worked
 * examples and published torque tables.
 *
 * References (public):
 *  [1] Workshop Calcs — "Bolt Torque Chart & Grade 2/5/8" worked example:
 *      1/2-13 UNC, SAE Grade 5, dry K = 0.20, proof 85 ksi, preload 75% of
 *      proof -> A_t = 0.1419 in^2, F = 9,046 lbf, T = 75.4 ft*lb.
 *      https://workshopcalcs.com/articles/bolt-torque-chart-grade-2-5-8/
 *  [2] KWS Manufacturing O&M bolt torque guide (published table, UNC,
 *      plain/dry): 1/2" SAE Grade 8 -> 105 ft*lb
 *      (implied: proof 120 ksi, 75% preload, K = 0.20 -> 106.5 ft*lb).
 *  [3] ASME B1.1 tensile stress areas as tabulated in [1]/[2]
 *      (1/2-13: 0.1419/0.142, 3/4-10: 0.334, 1-8: 0.606 in^2).
 *  [4] Kasko Makine PCC-1 assembly guide: 3/4" stud, Class 600, lubricated
 *      threads torque region ~170-210 ft*lb.
 *      https://www.kaskomakine.com/blogs/flange-bolt-torque-assembly-asme-pcc-1
 *
 * Run: npx tsx scripts/check-bolt-torque.ts
 */

import {
  computeBoltTorque,
  tensileStressArea,
  torqueNm,
  boltLoadN,
  FT_LB_PER_NM,
} from '../src/lib/bolt-calculations';

let failures = 0;

function check(name: string, got: number, expected: number, tolPct: number) {
  const dev = ((got - expected) / expected) * 100;
  const ok = Math.abs(dev) <= tolPct;
  if (!ok) failures++;
  const digits = Math.abs(expected) < 10 ? 4 : 2;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${got.toFixed(digits)}, ref ${expected} (dev ${dev.toFixed(2)}%, tol +/-${tolPct}%)`);
}

console.log('--- ASME B1.1 tensile stress area vs published tables ---');
check('A_t 1/2-13 UNC', tensileStressArea(0.5, 13), 0.1419, 0.5);
check('A_t 5/8-11 UNC', tensileStressArea(0.625, 11), 0.226, 0.5);
check('A_t 3/4-10 UNC', tensileStressArea(0.75, 10), 0.334, 0.5);
check('A_t 1-8 UN/UNC', tensileStressArea(1, 8), 0.606, 0.5);

console.log('\n--- Public worked example [1]: 1/2-13 Grade 5, dry, 75% of 85 ksi proof ---');
{
  const stressKsi = 0.75 * 85; // 63.75 ksi
  const at = tensileStressArea(0.5, 13);
  const fLbf = (stressKsi * 1000 * at); // lbf
  const tLbIn = 0.2 * 0.5 * fLbf; // K * D(in) * F(lbf) -> lbf*in
  const tFtLb = tLbIn / 12;
  check('preload F (lbf)', fLbf, 9046, 0.5);
  check('torque (ft*lb)', tFtLb, 75.4, 2);
}

console.log('\n--- Published table [2]: 1/2-13 SAE Grade 8 dry -> 105 ft*lb ---');
{
  const stressKsi = 0.75 * 120; // Grade 8 proof 120 ksi
  const at = tensileStressArea(0.5, 13);
  const tFtLb = (0.2 * 0.5 * stressKsi * 1000 * at) / 12;
  check('torque (ft*lb)', tFtLb, 105, 2);
}

console.log('\n--- Engine end-to-end: 2" Class 300 B7, machine oil, 20 C ---');
{
  const r = computeBoltTorque({ cls: 300, nps: 2, materialId: 'b7', lubeId: 'oil', tempC: 20 });
  if (!r.valid) {
    failures++;
    console.log('FAIL  engine returned invalid:', r.reason);
  } else {
    // manual cross-check: 8 x 19.1 holes -> 5/8" studs, A_t = 0.226 in^2,
    // target 52.5 ksi, K = 0.15
    const t = torqueNm(0.15, 0.625, boltLoadN(52.5, 0.226));
    check('per-bolt torque (N*m)', r.torqueNm, t, 0.5);
    check('bolt count', r.count, 8, 0);
    check('pass 1 = 30%', r.passes[0].nm, r.torqueNm * 0.3, 0.01);
    console.log(`      ${r.npsLabel} Class 300: ${r.boltLabel}, ${r.count} bolts, ` +
      `${r.torqueNm.toFixed(1)} N*m (${r.torqueFtlb.toFixed(1)} ft*lb) per bolt, ` +
      `stress ${r.stressKsi.toFixed(1)} ksi`);
  }
}

console.log('\n--- Region check [4]: 3/4" stud lubricated Class 600 region 170-210 ft*lb ---');
{
  // Class 300 5" flange uses 8 x 22.2 holes -> 3/4" studs. A mid-band
  // target (gasket requiring above-floor seating stress, ~55% of yield)
  // with machine oil K = 0.15 must land in the published region.
  const r = computeBoltTorque({ cls: 300, nps: 5, materialId: 'b7', lubeId: 'oil', tempC: 20, stressPosition: 0.5 });
  const ft = r.torqueFtlb;
  const ok = r.valid && ft >= 170 && ft <= 210;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  3/4" B7 oil @55% yield: ${ft.toFixed(0)} ft*lb within published 170-210 ft*lb region`);
}

console.log('\n--- Temperature derating sanity ---');
{
  const cold = computeBoltTorque({ cls: 300, nps: 2, materialId: 'b7', lubeId: 'oil', tempC: 20 });
  const hot = computeBoltTorque({ cls: 300, nps: 2, materialId: 'b7', lubeId: 'oil', tempC: 400 });
  const ratio = hot.torqueNm / cold.torqueNm;
  const ok = ratio > 0.8 && ratio < 0.9 && hot.valid;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  torque @400C / @20C = ${(ratio * 100).toFixed(1)}% (expect ~85%)`);
  const over = computeBoltTorque({ cls: 300, nps: 2, materialId: 'b7', lubeId: 'oil', tempC: 500 });
  const okOver = !over.valid && !!over.reason;
  if (!okOver) failures++;
  console.log(`${okOver ? 'PASS' : 'FAIL'}  above B7 ceiling -> invalid with reason: ${over.reason ?? '(none)'}`);
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
