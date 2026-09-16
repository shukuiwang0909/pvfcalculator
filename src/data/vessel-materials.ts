/**
 * ASME BPVC Section II Part D — 常用压力容器材料允许应力表（公开转载值）。
 *
 * 来源说明（重要）：
 *  - 本表数值为 ASME BPVC II-D Table 1A 的公开转载值（工程技术网站、教科书、
 *    论文算例中广泛转引），以 MPa 为基准、ksi 由 1 ksi = 6.894757 MPa 换算
 *    并保留 1 位小数。不同版本规范、英制/公制原表的数值可能略有差异。
 *  - 设计必须以手头最新版 ASME BPVC II-D 原文为准；本表仅供方案估算与教学演示。
 *
 * 核对过的公开来源（2026-07 检索）：
 *  - SA-516-70：常温~250°C 为 138 MPa（20.0 ksi），见公开工程文章
 *    （zc-steel-pipe.com、epcland.com 算例 S=138 MPa@55°C、
 *    ijsrp.org 算例 137.9 MPa@100°C、webthesis 136.4 MPa@280°C）
 *  - SA-387-11 Cl.2：≤425°C 为 148 MPa，见 pipingpipeline.com 转载 II-D 全表
 *  - SA-240 304：≤100°F 为 20.0 ksi（138 MPa），见 Eng-Tips / Nickel Institute
 *  - SA-240 316L（双认证 316/316L）：RT 138 MPa、200°C 134 MPa、400°C 111 MPa，
 *    见 Parker Hannifin 白皮书
 *  - SA-285 Gr.C：常温 15.7 ksi（108 MPa），见 getzenquery 材料表
 *
 * 温度档：100/200/300/400/500/600/650 °F（约 38/93/149/204/260/316/343 °C），
 * 即规范常用范围 -29°C(-20°F) ~ 343°C(650°F)。查表超出 650°F 视为无效。
 */

export interface VesselMaterial {
  id: string;
  name: string;
  standard: string;      // e.g. 'ASME II-D Table 1A'
  form: string;          // 板材/管材
  density: number;       // kg/m³
  /** 允许应力 MPa，与 TEMP_ROWS_F 一一对应 */
  stressMpa: number[];
  /** 允许应力 ksi（换算值，保留 1 位小数） */
  stressKsi: number[];
  notes?: string;
}

/** 温度档（°F），°C 为对照显示值 */
export const TEMP_ROWS_F = [100, 200, 300, 400, 500, 600, 650] as const;
export const TEMP_ROWS_C = [38, 93, 149, 204, 260, 316, 343] as const;

const ksi = (mpa: number) => Math.round((mpa / 6.894757) * 10) / 10;

export const VESSEL_MATERIALS: VesselMaterial[] = [
  {
    id: 'sa516-70',
    name: 'SA-516 Gr.70',
    standard: 'ASME II-D Table 1A',
    form: 'Plate · carbon steel',
    density: 7850,
    stressMpa: [138, 138, 138, 138, 138, 133, 127],
    stressKsi: [20.0, 20.0, 20.0, 20.0, 20.0, 19.3, 18.4],
    notes: '最常用压力容器钢板，UCS-66 豁免曲线 B',
  },
  {
    id: 'sa285-c',
    name: 'SA-285 Gr.C',
    standard: 'ASME II-D Table 1A',
    form: 'Plate · carbon steel',
    density: 7850,
    stressMpa: [108, 108, 108, 108, 106, 102, 98],
    stressKsi: [15.7, 15.7, 15.7, 15.7, 15.4, 14.8, 14.2],
    notes: '较低强度碳钢板，旧规范容器常见',
  },
  {
    id: 'sa106-b',
    name: 'SA-106 Gr.B',
    standard: 'ASME II-D Table 1A',
    form: 'Pipe · seamless carbon steel',
    density: 7850,
    stressMpa: [118, 118, 116, 112, 106, 97, 92],
    stressKsi: [17.1, 17.1, 16.8, 16.2, 15.4, 14.1, 13.3],
    notes: '无缝管，常用于筒节/接管计算参考',
  },
  {
    id: 'sa240-304',
    name: 'SA-240 Type 304',
    standard: 'ASME II-D Table 1A',
    form: 'Plate · austenitic SS',
    density: 8000,
    stressMpa: [138, 136, 131, 125, 119, 114, 111],
    stressKsi: [20.0, 19.7, 19.0, 18.1, 17.3, 16.5, 16.1],
    notes: '18-8 奥氏体不锈钢',
  },
  {
    id: 'sa240-316l',
    name: 'SA-240 Type 316L',
    standard: 'ASME II-D Table 1A',
    form: 'Plate · austenitic SS',
    density: 7980,
    stressMpa: [138, 137, 134, 128, 121, 115, 111],
    stressKsi: [20.0, 19.9, 19.4, 18.6, 17.6, 16.7, 16.1],
    notes: '含 Mo 耐点蚀，双认证 316/316L 值',
  },
  {
    id: 'sa387-11cl2',
    name: 'SA-387 Gr.11 Cl.2',
    standard: 'ASME II-D Table 1A',
    form: 'Plate · 1.25Cr-0.5Mo alloy',
    density: 7820,
    stressMpa: [148, 148, 148, 148, 148, 148, 148],
    stressKsi: [21.5, 21.5, 21.5, 21.5, 21.5, 21.5, 21.5],
    notes: '≤425°C 保持 148 MPa，高温抗蠕变',
  },
];

/** 按材料 id 查找 */
export function findVesselMaterial(id: string): VesselMaterial | undefined {
  return VESSEL_MATERIALS.find((m) => m.id === id);
}

/**
 * 温度线性插值查允许应力。
 * @param tempF 设计温度 °F
 * @returns MPa；设计温度超出 650°F 返回 null（无效，提示超表温）
 */
export function allowableStressMpa(material: VesselMaterial, tempF: number): number | null {
  if (tempF > TEMP_ROWS_F[TEMP_ROWS_F.length - 1]) return null; // 超表温
  if (tempF <= TEMP_ROWS_F[0]) return material.stressMpa[0];     // 低温端取首档
  for (let i = 1; i < TEMP_ROWS_F.length; i++) {
    if (tempF <= TEMP_ROWS_F[i]) {
      const t0 = TEMP_ROWS_F[i - 1];
      const t1 = TEMP_ROWS_F[i];
      const s0 = material.stressMpa[i - 1];
      const s1 = material.stressMpa[i];
      return s0 + ((tempF - t0) / (t1 - t0)) * (s1 - s0);
    }
  }
  return null;
}

/**
 * 焊缝系数 E（UW-12 Type No.(1) 对接接头）：
 *  - RT-1 100% 射线检测（ UW-11(a) 全检） → E = 1.00
 *  - RT-2 局部射线检测（UW-52 抽检，≥6 英寸/30 英尺焊缝） → E = 0.85
 *  - 不作射线检测 → E = 0.70
 * 注：环缝（Category B）与纵缝（Category A）可选用不同检测等级；
 * UG-27 纵缝公式用纵缝 E，环缝公式用环缝 E。
 */
export interface JointEfficiency {
  id: string;
  name: string;
  nameZh: string;
  e: number;
  desc: string;
}

export const JOINT_EFFICIENCIES: JointEfficiency[] = [
  {
    id: 'rt1', name: 'Full RT (RT-1)', nameZh: '100% 射线检测', e: 1.0,
    desc: 'UW-11(a) 全焊缝射线检测，UW-12 Type 1 → E = 1.00',
  },
  {
    id: 'rt2', name: 'Spot RT (RT-2)', nameZh: '局部射线检测', e: 0.85,
    desc: 'UW-52 抽检，UW-12 Type 1 → E = 0.85',
  },
  {
    id: 'nort', name: 'No radiography', nameZh: '不作射线检测', e: 0.7,
    desc: 'UW-12 Type 1 无检测 → E = 0.70',
  },
];

/**
 * 标准板厚系列（mm）——名义壁厚向上取整用。
 * 常用压力容器钢板可供货厚度（GB/EN/ASTM 市场通行系列）。
 */
export const STANDARD_PLATE_THICKNESSES_MM = [
  3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 30, 32, 36, 40, 45, 50,
  55, 60, 65, 70, 75, 80, 90, 100, 110, 120,
];

/** UG-16(b)：成形后（不含腐蚀裕量）最小厚度 1/16 in ≈ 1.5 mm */
export const UG16_MIN_THICKNESS_MM = 1.6; // 1/16 in = 1.5875 mm

/** 向上取标准板厚；required 超过最大系列值时返回该最大值（页面提示） */
export function roundUpPlateThickness(requiredMm: number): number {
  for (const t of STANDARD_PLATE_THICKNESSES_MM) {
    if (t >= requiredMm - 1e-9) return t;
  }
  return STANDARD_PLATE_THICKNESSES_MM[STANDARD_PLATE_THICKNESSES_MM.length - 1];
}
