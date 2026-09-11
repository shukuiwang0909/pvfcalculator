# P0 功能 Spec：法兰重量计算器

> ⚠️ **已合并至 PRD.md 第 12 章（2026-09-11）**：本文件仅作历史存档，内容修改请以 PRD.md 为单一事实源。
> 状态：待开发
> 优先级：P0（站点核心引流工具）
> 参考：meshcalculator.com 的 wire-mesh-weight-calculator 模式
> 竞品对标：regalsalescorp.com（已审计，存在 10x 误差 + 平板模型错误）

---

## 1. 功能定位

| 维度 | 说明 |
|------|------|
| 目标用户 | 海外采购工程师、EPC 项目经理、经销商 |
| 用户任务 | 快速核算法兰重量 → 估算运费/报价 → 对比供应商 |
| 流量词 | flange weight calculator (Autocomplete 深度 44) |
| 转化路径 | 工具页 → 产品页 → 询盘表单 |
| 差异化 | 按 ASME B16.5 几何建模，非平板近似；数据可溯源 |

---

## 2. 输入参数

### 2.1 法兰类型（5 种）
- Weld Neck (WN)
- Slip On (SO)
- Blind (BL)
- Socket Weld (SW)
- Threaded (THD)

### 2.2 压力等级（Class）
- 150 / 300 / 400 / 600 / 900 / 1500 / 2500

### 2.3 公称尺寸（NPS）
- 1/2", 3/4", 1", 1-1/4", 1-1/2", 2", 2-1/2", 3", 3-1/2", 4", 5", 6", 8", 10", 12", 14", 16", 18", 20", 22", 24"

### 2.4 材料密度（可选，默认碳钢 7850 kg/m³）
- 碳钢 A105：7850 kg/m³
- 不锈钢 F304：8000 kg/m³
- 不锈钢 F316：7980 kg/m³
- 合金钢 F11：7820 kg/m³
- 自定义输入

---

## 3. 计算模型

### 3.1 几何建模（核心差异化）

**不是平板 + 钻孔！** 按 ASME B16.5 真实几何分三段：

```
Weld Neck 法兰几何模型：

┌─────────────────────────────────────┐
│  端环 (End Ring)                     │
│  ├── 外径 = B16.5 表列 OD            │
│  ├── 内径 = B16.5 表列 Bore          │
│  └── 厚度 = B16.5 表列 C (hub end)   │
├─────────────────────────────────────┤
│  Hub 锥段 (Tapered Hub)              │
│  ├── 起始直径 = 端环 OD              │
│  ├── 终止直径 = B16.5 表列 X (hub    │
│  │   diameter at weld end)           │
│  ├── 长度 = B16.5 表列 Y (length     │
│  │   through hub)                   │
│  └── 锥度 = (OD - X) / Y             │
├─────────────────────────────────────┤
│  颈部 (Neck)                         │
│  ├── 外径 = X (hub diameter)         │
│  ├── 内径 = 管子外径 - 2 × 管子壁厚   │
│  │   （或 B16.5 表列 Bore）          │
│  └── 长度 = B16.5 表列 Y             │
└─────────────────────────────────────┘
```

**体积公式：**
```
V_total = V_ring + V_hub_cone + V_neck

V_ring = π/4 × (OD² - Bore²) × C

V_hub_cone = π/12 × Y × (OD² + OD×X + X²) - π/4 × Bore² × Y

V_neck = π/4 × (X² - Bore²) × Y
```

### 3.2 重量计算
```
Weight = V_total × Density × 10⁻⁹  (mm³ → kg)
```

### 3.3 基准值自检

| 基准 | 标准值 | 容差 |
|------|--------|------|
| WN 24" 150# | ~126 kg | ±5% |
| Blind 24" 150# | ~193.5 kg | ±3% |
| SO 6" 300# | ~10 kg | ±5% |

---

## 4. 输出结果

### 4.1 实时显示
- 重量值（kg / lb 切换）
- 体积（cm³）
- 材料密度
- 法兰类型图示（SVG 简图）

### 4.2 详细展开（可折叠）
- 分段体积明细（端环 / Hub / 颈部）
- 关键尺寸表（OD / Bore / C / X / Y / Bolt Circle）
- 数据来源标注（ASME B16.5 Table / Table 编号）

### 4.3 导出功能
- PDF 下载（含输入参数 + 结果 + 免责声明）
- Excel/CSV 下载（批量计算时）

---

## 5. 页面结构（SEO 优化）

```
H1: Flange Weight Calculator (ASME B16.5)

├─ 工具区（首屏）
│   ├─ 类型选择（5 个图标按钮）
│   ├─ Class 下拉
│   ├─ NPS 下拉
│   ├─ 材料密度选择
│   ├─ [Calculate] 按钮
│   └─ 结果卡片（大字体重量值 + 单位切换）
│
├─ 详细尺寸表（可折叠，默认展开当前选中类型）
│   └─ 表头：NPS | OD | Bore | C | X | Y | Bolt Circle | Weight
│
├─ 计算原理说明（工程师向）
│   ├─ 几何模型图示（SVG）
│   ├─ 公式推导
│   └─ 与平板近似的差异说明
│
├─ FAQ（结构化数据）
│   ├─ How do you calculate flange weight?
│   ├─ What is the difference between WN and SO flange weight?
│   ├─ How accurate is this calculator?
│   └─ ...（8-10 个）
│
├─ 内链区
│   ├─ → Flange Dimensions Chart
│   ├─ → Pipe Weight Calculator
│   ├─ → Cangzhou Flange Manufacturers
│   └─ → Request a Quote
│
└─ 免责声明
    "Calculated weights are theoretical values based on ASME B16.5 
     dimensions. Actual weights may vary due to manufacturing tolerances. 
     For critical applications, verify with manufacturer."
```

---

## 6. 技术实现

### 6.1 技术栈
- Astro 5（静态生成）
- TypeScript（类型安全）
- Tailwind CSS v4（样式）
- Vanilla JS（计算逻辑，无框架依赖）

### 6.2 数据结构
```typescript
interface FlangeDimensions {
  nps: string;           // "24\""
  od: number;            // mm
  bore: number;          // mm
  c: number;             // mm (hub end thickness)
  x: number;             // mm (hub diameter at weld end)
  y: number;             // mm (length through hub)
  boltCircle: number;    // mm
  boltHoles: number;
  boltDiameter: number;  // mm
}

interface FlangeTypeData {
  [key: string]: {       // "WN_150_24"
    dimensions: FlangeDimensions;
    weight: number;      // kg (pre-calculated)
  };
}
```

### 6.3 数据来源
- ASME B16.5-2020 表 8-14（WN/SO/BL/SW/THD 各等级）
- 数据录入时双人复核，避免 regalsalescorp 式的转录错误
- 每个值标注来源表号

### 6.4 性能要求
- 首屏加载 < 1.5s（Lighthouse）
- 计算响应 < 16ms（即时）
- 移动端完美适配（表格转卡片布局）

---

## 7. 验收标准（6 条，来自竞品审计）

| # | 标准 | 验证方法 |
|---|------|----------|
| 1 | NPS 升序排列 | 默认视图 1/2" → 24"，无乱序 |
| 2 | Class 全等级覆盖 | 150/300/400/600/900/1500/2500 全部可计算 |
| 3 | 数据可溯源 | 每个值标注 ASME B16.5 表号 |
| 4 | 几何建模非平板近似 | WN 重量 ≠ 平板重量（差异 > 20%） |
| 5 | 基准值自检 | WN 24" 150# ≈ 126 kg（±5%） |
| 6 | 单位切换 | mm/inch/kg/lb 一键切换，无混用 |

---

## 8. 后续迭代

| 版本 | 功能 |
|------|------|
| v1.0 | 单法兰计算（当前 Spec） |
| v1.1 | 批量计算（上传 Excel） |
| v1.2 | 对比模式（选 2 个法兰并排比较） |
| v2.0 | API 接口（供其他站调用） |
