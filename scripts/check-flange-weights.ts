import { computeFlangeWeight, plateApproximationKg } from '../src/lib/flange-calculations';

const checks: [string, string, number, number, number][] = [
  // [type, nps, class, expected, tol%]
  ['WN', '24', 150, 126, 5],
  ['SO', '6', 300, 10, 5],
  ['BL', '24', 150, 193.5, 3],
];

for (const [type, npsLabel, cls, expected, tol] of checks) {
  const nps = npsLabel === '6' ? 6 : 24;
  const r = computeFlangeWeight(type as any, cls, nps, 7850);
  const dev = ((r.weightKg - expected) / expected) * 100;
  console.log(
    `${type} ${nps}" ${cls}#: ${r.weightKg.toFixed(1)} kg (spec ref ${expected} kg, dev ${dev.toFixed(1)}%, tol ±${tol}%)`
  );
}

// Plate-model comparison (acceptance: WN geo ≠ plate, diff > 20%)
const wn24 = computeFlangeWeight('WN', 150, 24, 7850).weightKg;
const plate24 = plateApproximationKg('WN', 150, 24, 7850);
console.log(`WN 24" 150# geo ${wn24.toFixed(1)} vs plate ${plate24.toFixed(1)} kg, diff ${(((wn24 - plate24) / plate24) * 100).toFixed(0)}%`);

// Cross-check several sizes against known catalog weights
const catalog: [string, number, number, number][] = [
  // type, nps, class, approx real catalog kg
  ['WN', 2, 150, 2.7], ['WN', 12, 150, 39.5], ['WN', 4, 600, 18.6],
  ['SO', 2, 150, 1.9], ['SO', 6, 300, 19],
  ['BL', 2, 150, 2.6], ['BL', 12, 150, 68], ['BL', 6, 300, 23.6],
  ['SW', 2, 300, 3.4], ['THD', 2, 150, 1.9],
];
for (const [t, nps, cls, real] of catalog) {
  const r = computeFlangeWeight(t as any, cls, nps, 7850);
  console.log(`${t} ${nps}" ${cls}#: calc ${r.weightKg.toFixed(2)} kg vs catalog ~${real} kg (${(((r.weightKg - real) / real) * 100).toFixed(0)}%)`);
}
