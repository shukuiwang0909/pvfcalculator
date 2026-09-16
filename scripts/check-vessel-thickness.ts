/**
 * ASME VIII Div.1 壁厚计算引擎 —— 公开教材/工程文章算例对照校验。
 *
 * 运行：node --experimental-strip-types scripts/check-vessel-thickness.ts
 * （需 Node ≥ 22.6；本项目 engines 要求 >= 22.12。校验收敛标准：偏差 < 2%）
 *
 * 对照算例来源（2026-07 检索）：
 *  [1] EPCLand — LPG Storage Tanks 工程文章逐步算例：
 *      P=1.72 MPa, R=1500 mm, S=138 MPa(SA-516-70@55°C), E=1.00, CA=1.5
 *      → t = 2580/136.968 = 18.84 mm，加 CA 后 20.34 mm，名义取 22 mm
 *  [2] IJESAT 论文算例（SA-516-70 贮罐）：
 *      P=0.70 MPa, R=838.2 mm, S=115.15 MPa, E=0.85, CA=2.0
 *      → 纵缝(环向应力) T = 8.02 mm；环缝(轴向) T = 5.001 mm（均含 CA）
 *  [3] Cyclogen 24-in 立式容器算例（英制）：
 *      P=285 psi, R=11.516 in, S=19500 psi, E=1.00
 *      → t = 3282/19329 = 0.1698 in
 *  [4] IJESAT 论文碟形封头算例（简化式 0.885PL/(SE−0.1P)，无 M 因子）：
 *      P=0.70 MPa, L=1676.4 mm, S=115.15 MPa, E=0.85, CA=2.0
 *      → T = 12.618 mm（本引擎按规范全式含 M，此例仅作数量级回归）
 */

import { computeVesselThickness, mmToIn, type VesselInput } from '../src/lib/vessel-calculations.ts';

interface Check {
  name: string;
  input: VesselInput;
  /** 从公开算例摘录的期望值 */
  expected: { tDesignMm?: number; tWithCaMm?: number; tDesignIn?: number };
  tolPct: number;
}

const checks: Check[] = [
  {
    name: '[1] EPCLand LPG bullet shell (E=1.0)',
    input: {
      component: 'shell', units: 'metric', pressure: 1.72,
      dimMode: 'ir', dimValue: 1500, tempF: 130,
      materialId: 'sa516-70', jointE: 1.0, ca: 1.5,
    },
    expected: { tDesignMm: 18.84, tWithCaMm: 20.34 },
    tolPct: 2,
  },
  {
    name: '[2] IJESAT vessel shell (E=0.85)',
    input: {
      component: 'shell', units: 'metric', pressure: 0.70,
      dimMode: 'ir', dimValue: 838.2, tempF: 130,
      materialId: 'sa516-70', jointE: 0.85, ca: 2.0,
      sOverrideMpa: 115.15, // 算例所用版本规范 S 值（本表 130°F 档为 138 MPa）
    },
    expected: { tWithCaMm: 8.02 }, // 纵缝控制
    tolPct: 2,
  },
  {
    name: '[3] Cyclogen 24-in vessel shell (imperial)',
    input: {
      component: 'shell', units: 'imperial', pressure: 285,
      dimMode: 'ir', dimValue: 11.516, tempF: 300,
      materialId: 'sa516-70', jointE: 1.0, ca: 0,
      sOverrideMpa: 19500 * 0.006894757, // 算例给定 S=19500 psi
    },
    expected: { tDesignIn: 0.1698 },
    tolPct: 2,
  },
];

let pass = 0;
let fail = 0;

function compare(name: string, actual: number, expected: number, tolPct: number) {
  const dev = Math.abs((actual - expected) / expected) * 100;
  const ok = dev < tolPct;
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${name}: calc ${actual.toFixed(4)} vs published ${expected} ` +
    `(dev ${dev.toFixed(2)}%, tol <${tolPct}%)`,
  );
  if (ok) pass++; else fail++;
}

console.log('ASME VIII Div.1 thickness engine — public worked-example cross-checks\n');

for (const c of checks) {
  const r = computeVesselThickness(c.input);
  if (!r.valid) {
    console.log(`  FAIL  ${c.name}: engine returned invalid (${r.error ?? 'n/a'})`);
    fail++;
    continue;
  }
  console.log(c.name);
  if (c.expected.tDesignMm != null) compare('t design (mm)', r.tDesignMm, c.expected.tDesignMm, c.tolPct);
  if (c.expected.tWithCaMm != null) compare('t with CA (mm)', r.tWithCaMm, c.expected.tWithCaMm, c.tolPct);
  if (c.expected.tDesignIn != null) compare('t design (in)', mmToIn(r.tDesignMm), c.expected.tDesignIn, c.tolPct);
}

// 纵向/环向双向校核：[2] 公开算例中环缝(轴向)厚度 5.001 mm（含 CA）
{
  const r = computeVesselThickness({
    component: 'shell', units: 'metric', pressure: 0.70,
    dimMode: 'ir', dimValue: 838.2, tempF: 130,
    materialId: 'sa516-70', jointE: 0.85, ca: 2.0,
    sOverrideMpa: 115.15,
  });
  if (r.valid && r.shell) {
    compare('[2a] longitudinal seam t with CA (mm)', r.shell.tLongMm + 2.0, 5.001, 2);
    const gov = r.shell.governing === 'circ' ? 'circumferential (long. seam)' : 'longitudinal (circ. seam)';
    console.log(`        governing: ${gov} — matches UG-27 expectation: ${r.shell.governing === 'circ' ? 'PASS' : 'FAIL'}`);
  }
}

// 碟形封头回归：与规范全式手工值对照（M = ¼(3+√(L/r))，标准 F&D r=6%L）
{
  const p = 0.70, l = 1676.4, s = 115.15, e = 0.85, ca = 2.0;
  const rKnuckle = 0.06 * l;
  const m = 0.25 * (3 + Math.sqrt(l / rKnuckle));
  const handT = (0.885 * p * l * m) / (s * e - 0.1 * p) + ca;
  const r = computeVesselThickness({
    component: 'torispherical', units: 'metric', pressure: p,
    dimMode: 'id', dimValue: l, tempF: 130,
    materialId: 'sa516-70', jointE: e, ca,
    sOverrideMpa: s,
  });
  if (r.valid) compare('[4] torispherical head vs hand calc (mm)', r.tWithCaMm, handT, 0.1);
  console.log(`        published simplified-example value (no M): 12.618 mm — engine applies code M=${m.toFixed(3)} (conservative)`);
}

// 2:1 椭圆封头与半球封头封闭形式回归
{
  const p = 1.0, d = 2000, s = 138, e = 1.0;
  const handEllip = (p * d) / (2 * s * e - 0.2 * p);
  const r1 = computeVesselThickness({
    component: 'ellipsoidal21', units: 'metric', pressure: p,
    dimMode: 'id', dimValue: d, tempF: 130, materialId: 'sa516-70', jointE: e, ca: 0,
  });
  if (r1.valid) compare('2:1 ellipsoidal head closed form (mm)', r1.tDesignMm, handEllip, 0.1);

  const handHemi = (p * d / 2) / (2 * s * e - 0.2 * p);
  const r2 = computeVesselThickness({
    component: 'hemispherical', units: 'metric', pressure: p,
    dimMode: 'id', dimValue: d, tempF: 130, materialId: 'sa516-70', jointE: e, ca: 0,
  });
  if (r2.valid) compare('hemispherical head closed form (mm)', r2.tDesignMm, handHemi, 0.1);

  // MAWP 回算封闭性：以设计厚度反算应≈设计压力
  if (r1.valid) {
    const r3 = computeVesselThickness({
      component: 'ellipsoidal21', units: 'metric', pressure: p,
      dimMode: 'id', dimValue: d, tempF: 130, materialId: 'sa516-70', jointE: e, ca: 0,
    });
    if (r3.valid) {
      // nominal ≥ design → MAWP ≥ P
      const ok = r3.mawpMpa >= p;
      console.log(`  ${ok ? 'PASS' : 'FAIL'}  MAWP (${r3.mawpMpa.toFixed(3)} MPa) ≥ design P (${p} MPa) for selected nominal`);
      if (ok) pass++; else fail++;
    }
  }
}

console.log(`\n${fail === 0 ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
