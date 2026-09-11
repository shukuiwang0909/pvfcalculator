# PVFCalculator — 钢管+管件+法兰出海工具站 PRD

> 参照物：meshcalculator.com（安平丝网站，已验证模式）
> 状态：待立项评审
> 日期：2026-09-11

## 目录

- [0. 结论先行](#0-结论先行)
- [1. 市场概述](#1-市场概述)
- [2. SERP 与竞品分析](#2-serp-与竞品分析)
- [3. 目标用户](#3-目标用户)
- [4. 产品定位](#4-产品定位)
- [5. 功能规划](#5-功能规划)
- [6. 页面信息架构](#6-页面信息架构)
- [7. 定价与变现](#7-定价与变现)
- [8. 域名与技术栈](#8-域名与技术栈)
- [9. GTM 策略](#9-gtm-策略)
- [10. 转化漏斗与埋点](#10-转化漏斗与埋点)
- [11. 风险评估](#11-风险评估)
- [12. P0 功能 Spec：法兰重量计算器](#12-p0-功能-spec法兰重量计算器详细开发规格)
- [13. 下一步行动（决策点）](#13-下一步行动决策点)

---

## 0. 结论先行

- **要不要做**：做。钢管/管件/法兰 SERP 三层验证全部通过（产地词、工具词、标准词前排全是中国中小厂站/工程师内容站，零大平台）。
- **一句话定位**：面向海外管道工程买家（EPC/经销商/采购工程师）的 PVF（Pipe + Fittings + Flanges）选型计算工具 + 沧州产业带源头工厂对接站。
- **首版做什么**：3 个核心计算器 + 2 组规格表矩阵 + 产品页矩阵 + 沧州产地页 + 工厂目录 + 询盘表单。全静态站，Cloudflare Pages 托管。
- **明确不做什么**：不做阀门（二期评估）、不做交易平台/在线下单、不爬企业信息、不做付费排名、不做纯机翻多语言（一期只 EN+ZH）。

### 与丝网站（meshcalculator）的关系

| 维度 | meshcalculator（丝网） | PVFCalculator（PVF） |
|---|---|---|
| 角色 | 第一站：跑通"工具引流→内容承接→询盘变现"闭环 | 第二站：复制已验证模式到客单价更高的品类 |
| 客单价/询盘价值 | 中低 | 高（项目型订单） |
| 用户专业度 | 工程终端+小B | 经销商+EPC+采购工程师，更专业 |
| 运营者专业匹配 | 一般 | **极高（备件技术背景 = 主场）** |
| 上线时机 | 已上线，跑数据中 | 建议丝网站 GA4 数据跑满 4-6 周后再启动开发 |

---

## 1. 市场概述

### 1.1 目标关键词分层（SERP 实扫证据，2026-09-11）

**钢管层**

| 层级 | 关键词 | SERP 前排构成 | 判断 |
|---|---|---|---|
| 头部词 | seamless steel pipe manufacturer china | uniasen、yuantaisteelpipe、baolaisteel、permanentsteelpipe —— 全是中国厂站 | ✅ 空旷 |
| 无修饰词 | erw steel pipe supplier | 美国本土经销商（California Steel、DNOW、Midwest） | ⚠️ 意图本地化，需 china 修饰 |
| 标准词 | api 5l pipe specification | fedsteel、api5lx.com、amerpipe、octalsteel | ✅ 内容站可排 |
| 工具词 | steel pipe weight calculator | triloksteel（印度）、pittsburghpipe、naspd | ✅ 有缝隙，印度站占位 = 需求已验证 |
| 表格词 | sch 40 pipe wall thickness chart | hu-steel（中国）、amardeepsteel（印度）、steeltubesindia | ✅ 可打 |
| 对比词 | carbon steel pipe vs stainless steel pipe | pipesandfittings、haywardpipe、fedsteel | ✅ 可打 |
| 产地词 | cangzhou steel pipe factory | cnspipes、czsggc、cangzhousteelpipe —— 沧州本地厂 | ✅ 产地词成立 |

**管件法兰层（前轮已扫，结论沿用）**

| 层级 | 关键词 | SERP 前排构成 | 判断 |
|---|---|---|---|
| 头部词 | flange manufacturer china | landeeflange、hsflanges、archpipes | ✅ 零大平台 |
| 产地词 | cangzhou flange manufacturer / mengcun pipe fittings | 沧州本地厂霸屏 | ✅ |
| 标准词 | asme b16.5 flange dimensions / wn rf flange dimensions | engineeringtoolbox、wermac、hardhatengineer | ✅ 工程师内容站可排 |
| 工具词 | flange weight calculator / pipe fittings weight calculator | regalsalescorp、kamleshmetal、vishalsteel（印度站） | ⚠️ 缝隙存在但被验证，需做得更准 |
| 对比词 | a105 vs a182 / sch 40 vs 80 fittings | octalsteel、apiint、texasflange | ✅ |

### 1.2 量级与商业价值

- **搜索量/KD/CPC：待验证**。环境无关键词工具 API，以上结论基于 SERP 竞争形态。
- **【2026-09-11 降级验证完成】Google Autocomplete 需求深度采样**（方法：根词建议数 + 6 字母长尾采样合计；DataForSEO 被墙/无 key，Google Trends 429，此为替代代理指标）：

| 关键词 | 组 | 长尾需求深度 | 对比基准 |
|---|---|---|---|
| pipe weight calculator | PVF工具 | 60 | ≈ mesh size chart (61) —— 基准组最强 |
| flange weight calculator | PVF工具 | 44 | > wire mesh weight calculator (27)，丝网已验证引流词 |
| asme b16.5 flange dimensions | PVF标准 | 55 | ≈ wire mesh supplier (55) |
| sch 40 pipe wall thickness | PVF标准 | 42 | — |
| pipe wall thickness chart | PVF工具 | 35 | — |
| steel pipe manufacturer china | PVF头部 | 20 | 商业词长尾浅属正常 |
| cangzhou pipe fittings | PVF产地 | 13 | 产地词有人搜，量级待估 |

- **代理指标结论**：PVF 工具词/标准词的需求深度 ≥ 丝网站已验证引流词（meshcalculator 的流量基本盘词同量级或更深）。需求存在性可以确认，精确量级仍待 DataForSEO 补齐。
- **立项前最终验证（可延后至开发前）**：DataForSEO 批量查量，门槛：
  - 钢管/管件/法兰主词（带 china 修饰）月搜合计 ≥ 3,000
  - 工具词+表格词月搜合计 ≥ 1,500（这是引流基本盘）
  - 若主词量级不足，降级为"先内容站+工具，不做工厂目录"
- 趋势判断：工业品长周期稳定需求，非热点型。PVF 受油气/基建周期影响，但 12 个月维度波动可接受（推断，非实测）。

### 1.3 机会判断（PRD skill 四问）

| 问题 | 判断 |
|---|---|
| 长期需求？ | ✅ 工业基建刚需，标准体系 30 年不变 |
| 小站能排进去？ | ✅ 三层 SERP 全部实锤 |
| 明确付费场景？ | ✅ 询盘线索卖给沧州工厂/外贸公司； verified listing 后期收费 |
| 低成本首版？ | ✅ 全静态 Astro + CF Pages，复用丝网站代码骨架，开发成本 ≈ 丝网站的 60% |

四问全过。

---

## 2. SERP 与竞品分析

### 2.1 三层竞品分级

| 层级 | 竞品 | 类型 | 弱点（你的机会） |
|---|---|---|---|
| Tier 1 直接 | landeeflange.com、octalsteel.com、permanentsteelpipe.com | 中国工厂/贸易公司英文站 | 内容糙（机翻味重）、工具只有一张静态表、无工程级解释 |
| Tier 1 直接 | regalsalescorp.com、amardeepsteel.com、triloksteel.com | 印度供应商站（工具词占位者） | 工具公式不公开、无 ASME 全等级覆盖、页面体验老旧 |
| Tier 1 直接 | engineeringtoolbox.com、wermac.org | 工程师参考站（标准词占位者） | 有内容无商业闭环，不做产地/工厂对接 |
| Tier 2 相邻 | texasflange.com、apiint.com | 美国本土法兰厂/经销商 | 不做 China sourcing，价格无优势 |
| Tier 2 相邻 | made-in-china.com、alibaba.com | B2B 平台 | 信息噪音大、无工具、无工程内容 |
| Tier 3 现状 | 买家直接发 RFQ 给认识的工厂、翻 PDF 手册 | 手动流程 | 无对比、无快速核算重量的工具 |

### 2.2 差异化核心

**不是"又一个工厂黄页"，而是"工程师工具 + 源头工厂"双轮：**

1. **工具准确度碾压**：法兰计算器覆盖 ASME B16.5 全压力等级 Class 150/300/600/900/1500/2500 × 全类型 WN/SO/BL/SW/TH/LJ；公式公开、可下载 PDF 结果。印度站的页面大多只有 Class 150-300 两张表。
2. **专业内容深度**：材质牌号体系（A106 Gr.B vs A53 vs API 5L X52；A105 vs A182 F11/F304）、SCH 壁厚逻辑、压力温度额定值——备件技术背景可直接产出工程师信任级内容，这是工厂站机翻内容永远达不到的。
3. **产地故事**：沧州盐山/孟村"中国管道装备之都"，产地页做深（产业集群地图、工厂数、主打产品、出口数据），复制 meshcalculator 的 anping-wire-mesh 页打法。

---

## 3. 目标用户

| 用户 | 画像 | 痛点 | 触发搜索 | 付费意愿 |
|---|---|---|---|---|
| **主力**：美国/中东/东南亚中小管道经销商 | 5-50 人公司，从中国补货或找 backup 供应商 | 找不到除阿里之外的可靠源头工厂；核算重量/报价慢 | flange weight calculator、carbon steel pipe fittings manufacturer china | 高——一单利润覆盖一年会员费 |
| EPC/工程公司采购工程师 | 做油气/化工/基建项目 BOM | 要快速核对规格是否符合 ASME 标准 | asme b16.5 flange dimensions、sch 40 wall thickness | 中——决策周期长但订单大 |
| 海外终端工程方（自建厂房/农场/围栏等） | 非专业采购 | 不知道选什么材质/等级 | carbon steel vs stainless steel pipe | 低——流量价值为主 |

主力用户锁定：**海外中小经销商**。他们有持续复购、看得懂规格表、是沧州工厂最真实的目标客户。

用户痛点证据：SERP 中印度站工具页常年占据前排且持续更新 = 该流量能转化为询盘（待 DataForSEO 验证量级）。

---

## 4. 产品定位

### 定位语句

```text
FOR 海外管道产品经销商和 EPC 采购工程师
WHO 需要核算 PVF 规格重量、核实 ASME 标准、并找到可靠的中国源头工厂
PVFCalculator IS A 管道装备（钢管+管件+法兰）选型计算与产业带对接平台
THAT 提供工程师级准确度的一站式工具、规格表和沧州工厂直供目录
UNLIKE 工厂黄页站（信息糙、无工具）和印度供应商站（工具简陋、无产地深度）
PVFCalculator 由管道行业专业人员维护，工具公式公开、标准数据完整、工厂信息自主填报
```

### 消息层级

- **Headline**: "Pipe, Fittings & Flanges — Calculators, Standards, and Direct from Cangzhou Factories"
- **Subhead**: "Engineer-grade ASME tools plus verified China PVF suppliers. Free to use, free to list."
- **Benefits**: ① 重量/规格 30 秒算完 ② 标准数据对照 ASME/ASTM 原文 ③ 跳过平台中间商直连工厂
- **禁词清单**: 不得声称 "verified/certified factory"（一期无验厂能力）；不得承诺价格最低；不得出现 "guaranteed quality"

---

## 5. 功能规划

### P0（首版必做）

**工具区（引流钩子）**
1. 钢管重量计算器（无缝/ERW/螺旋，公制+英制，按 SCH 自动取壁厚）
2. 法兰重量计算器（ASME B16.5 全等级 × WN/SO/BL/SW 类型，理论重量公式公开）——**详细开发规格见第 12 章**
3. 管件重量计算器（弯头/三通/异径管/管帽，A234 WPB 常用规格表）
4. SCH 壁厚速查表（Sch 5S-XXS 全系列，NPS 1/8-24，静态表页，SEO 主力）

**内容/SEO 区**
5. 规格表矩阵：ASME B16.5 法兰尺寸表（Class 150-2500）、ASME B16.9 管件尺寸表、法兰螺栓规格表
6. 标准解读页：API 5L、ASTM A106/A53、A234、A105/A182 各一页（What is + 化学成分/机械性能表 + 典型应用）
7. 对比页：carbon vs stainless pipe、seamless vs ERW、A105 vs A182、WN vs SO flange、Sch 40 vs 80
8. 产品页矩阵（承接询盘）：
   - 钢管：seamless / erw / lsaw / spiral / galvanized（5 页）
   - 管件：elbow / tee / reducer / cap / flange 子类（WN/SO/BL/SW/ threaded）（约 8 页）
9. 产地页：/cangzhou-pipe-fittings（管道装备之都产业集群页）、/mengcun-pipe-fittings、/yanshan-flange
10. 工厂目录 /factory-directory/（工厂自主提交表单，信息由工厂负责）
11. 询盘表单（Formspree，复用丝网站 15 字段询盘结构 + 询盘分级 A/B/C 逻辑）

### P1（上线后 4-8 周）
12. 博客矩阵（24 篇 / 3 个月，参照 meshcalculator-blog-pipeline 节奏）
13. 装箱优化工具（管件法兰装箱计算——集装箱空间利用率，差异化工具）
14. GSC 提交 + IndexNow + 内链强化

### P2（验证流量后）
15. Verified Listing 收费（$100-300/年，含验厂报告展示位）
16. ZH 全站版本
17. 阀门品类评估（泊头铸铁阀 SERP 复扫）
18. 西语/阿语版本（中东买家多）

### NOT-DO（明确不做）
- ❌ 不做在线交易/支付/担保（只信息流，免责声明兜底）
- ❌ 不爬取企业信息入库（全部工厂自主填报，提供删除通道）
- ❌ 不做付费搜索排名
- ❌ 不做纯机翻多语言
- ❌ 不做阀门（一期）
- ❌ 不做会员系统/登录（二期再评估）
- ❌ 不承诺交期、质量、资质（法定免责声明）

---

## 6. 页面信息架构

### 首页结构
```text
1. Hero：一句话定位 + 3 个工具入口卡片（首屏直达工具）
2. Popular Calculators（6 卡网格）
3. Standards Library（规格表矩阵入口）
4. Product Categories（钢管/管件/法兰三栏）
5. Why Cangzhou（产地故事 + 集群数据）
6. Featured Factories（自主入驻工厂展示位）
7. FAQ（8 条：起订量/材质/标准/付款/验厂/物流/样品/定制）
8. Footer CTA：Submit Your Factory / Request Quote
```

### SEO 页面矩阵（预计 60-80 页）

| 页面 | 目标词 | 优先级 |
|---|---|---|
| / | pipe fittings and flanges supplier china | P0 |
| /pipe-weight-calculator | steel pipe weight calculator | P0 |
| /flange-weight-calculator | flange weight calculator | P0（规格见第 12 章） |
| /pipe-fittings-weight-calculator | pipe fittings weight calculator | P0 |
| /sch-pipe-wall-thickness-chart | sch 40 pipe wall thickness chart | P0 |
| /asme-b16-5-flange-dimensions | asme b16.5 flange dimensions | P0 |
| /flange-bolt-chart | flange bolt size chart | P1 |
| /products/seamless-steel-pipe 等 13 个产品页 | 产品长尾词 | P0 |
| /cangzhou-pipe-fittings | cangzhou pipe fittings factory | P0 |
| /mengcun-pipe-fittings, /yanshan-flange | 产地长尾 | P1 |
| /factory-directory/ + /factory-directory/submit | supplier directory 长尾 | P0 |
| /standards/api-5l, /a106, /a234, /a105 等 | 标准词 | P1 |
| /vs/ 对比页 ×5 | 对比词 | P1 |
| /blog/ ×24 | 信息长尾 | P1 |

---

## 7. 定价与变现

### 阶段 1（0-3K PV/月）：囤流量
- 全部工具免费、工厂免费入驻、免费收询盘
- 变现：无（攒数据）

### 阶段 2（3-10K PV/月）：卖线索
- 询盘分级 A/B/C（复用丝网站逻辑：A 级 $100-300/条、B 级 $20-50、C 免费分发）
- 卖给沧州/盐山/孟村工厂 + 外贸公司

### 阶段 3（10K+ PV/月）：增值服务
- Verified Listing $100-300/年（验厂报告 + 首页展示位）
- 工厂英文站建设/谷歌推广代运营（服务型收入，客单价 $500-2000）

### 成本验算（首年）
| 项 | 金额 |
|---|---|
| 域名 | ~$12/年 |
| Cloudflare Pages + Workers | $0 |
| Formspree 免费档 | $0 |
| GA4/GSC/IndexNow | $0 |
| **首年现金成本 < $50** | 成本风险≈0，风险全在时间投入 |

---

## 8. 域名与技术栈

### 域名候选（可用性待查，立项时 24h 内注册）
| 候选 | 评价 |
|---|---|
| pvfcalculator.com | 与 meshcalculator 命名同构，品牌延续性强，首选 |
| pipeflangecalc.com | 直白，工具属性强 |
| cangzhoupvf.com | 产地词绑定，SEO 加分但品牌天花板低 |
| pipetoolspro.com | 备选 |

### 技术栈（照抄丝网站已验证方案）
- Astro 5 + Tailwind v4，静态输出
- Cloudflare Pages 部署（`wrangler pages deploy`，token 走环境变量）
- Workers 承接计算器 API（若纯前端可算则不需要，法兰理论重量可前端实现）
- GA4 + GSC + IndexNow + sitemap
- Formspree 询盘表单（新 endpoint）
- GitHub 私有/公开仓库 + 每次部署即 git commit（用户安全惯例）

---

## 9. GTM 策略

1. **上线前**：域名注册 → DataForSEO 关键词量级验证 → 30 个 P0 页面开发
2. **上线周**：GSC 提交 + IndexNow + 3-5 个相关行业 Reddit/论坛软推广（工具免费作为钩子）
3. **第 2-4 周**：博客第一批 8 篇（对标 meshcalculator Month 1 节奏）
4. **第 4-8 周**：博客 16 篇 + 内链强化 + 工厂目录冷启动（手动邀请 10-20 家沧州工厂免费入驻，参照河北工厂网的打法但反过来做深做准）
5. **引流杠杆**：借"河北工厂网/内卷"话题余热写 2-3 篇 industry commentary（河北产业集群出海观察），吃话题流量但不做主依赖

---

## 10. 转化漏斗与埋点

| 事件 | 含义 |
|---|---|
| page_view | 流量基线 |
| tool_start / tool_success | 工具使用深度（核心参与度指标） |
| cta_supplier_click | 工厂详情页点击（询盘前置） |
| inquiry_submit | A/B/C 分级打标 |
| factory_submit | 入驻表单（供给侧增长指标） |

北极星指标：**月询盘数**（不是 PV）。

---

## 11. 风险评估

| 风险 | 等级 | 缓解 |
|---|---|---|
| 关键词量级不足 | 中 | 立项门槛已设（主词≥3K/月）；不过线则只做工具+内容站 |
| 沧州工厂英文站密度高，竞争激烈 | 中 | 不拼数量拼深度：工具准确度+内容专业度+标准数据完整度 |
| PVF 受油气周期波动 | 低 | 钢管管件法兰下游分散（油气/化工/基建/市政），抗周期 |
| 美国关税/贸易政策 | 中 | 不受控；受众扩展到中东/东南亚/非洲对冲 |
| 工厂信息合规 | 低 | 全部自主填报+免责声明+删除通道（模式已在丝网站落地） |
| 个人精力：丝网站+PVF 站双线 | **高** | 建议丝网站数据跑满 4-6 周验证模式后再启动；PVF 开发可分批外包/用 cronjob 定时写作 |

---

## 12. P0 功能 Spec：法兰重量计算器（详细开发规格）

> 本文档为 PRD 第 12 章，由 p0-flange-weight-calculator-spec.md 合并而来，两者内容一致；**以 PRD 为单一事实源**，独立 spec 文件仅作历史存档。
> 状态：待开发
> 优先级：P0（站点核心引流工具）
> 参考：meshcalculator.com 的 wire-mesh-weight-calculator 模式
> 竞品对标：regalsalescorp.com（已审计，存在 10x 误差 + 平板模型错误）

### 12.1 功能定位

| 维度 | 说明 |
|------|------|
| 目标用户 | 海外采购工程师、EPC 项目经理、经销商 |
| 用户任务 | 快速核算法兰重量 → 估算运费/报价 → 对比供应商 |
| 流量词 | flange weight calculator (Autocomplete 深度 44) |
| 转化路径 | 工具页 → 产品页 → 询盘表单 |
| 差异化 | 按 ASME B16.5 几何建模，非平板近似；数据可溯源 |

### 12.2 输入参数

**12.2.1 法兰类型（5 种）**
- Weld Neck (WN)
- Slip On (SO)
- Blind (BL)
- Socket Weld (SW)
- Threaded (THD)

**12.2.2 压力等级（Class）**
- 150 / 300 / 400 / 600 / 900 / 1500 / 2500

**12.2.3 公称尺寸（NPS）**
- 1/2", 3/4", 1", 1-1/4", 1-1/2", 2", 2-1/2", 3", 3-1/2", 4", 5", 6", 8", 10", 12", 14", 16", 18", 20", 22", 24"

**12.2.4 材料密度（可选，默认碳钢 7850 kg/m³）**
- 碳钢 A105：7850 kg/m³
- 不锈钢 F304：8000 kg/m³
- 不锈钢 F316：7980 kg/m³
- 合金钢 F11：7820 kg/m³
- 自定义输入

### 12.3 计算模型

**12.3.1 几何建模（核心差异化）**

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

**12.3.2 重量计算**
```
Weight = V_total × Density × 10⁻⁹  (mm³ → kg)
```

**12.3.3 基准值自检**

| 基准 | 标准值 | 容差 |
|------|--------|------|
| WN 24" 150# | ~126 kg | ±5% |
| Blind 24" 150# | ~193.5 kg | ±3% |
| SO 6" 300# | ~10 kg | ±5% |

### 12.4 输出结果

**12.4.1 实时显示**
- 重量值（kg / lb 切换）
- 体积（cm³）
- 材料密度
- 法兰类型图示（SVG 简图）

**12.4.2 详细展开（可折叠）**
- 分段体积明细（端环 / Hub / 颈部）
- 关键尺寸表（OD / Bore / C / X / Y / Bolt Circle）
- 数据来源标注（ASME B16.5 Table / Table 编号）

**12.4.3 导出功能**
- PDF 下载（含输入参数 + 结果 + 免责声明）
- Excel/CSV 下载（批量计算时）

### 12.5 页面结构（SEO 优化）

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

### 12.6 技术实现

**12.6.1 技术栈**
- Astro 5（静态生成）
- TypeScript（类型安全）
- Tailwind CSS v4（样式）
- Vanilla JS（计算逻辑，无框架依赖）

**12.6.2 数据结构**
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

**12.6.3 数据来源**
- ASME B16.5-2020 表 8-14（WN/SO/BL/SW/THD 各等级）
- 数据录入时双人复核，避免 regalsalescorp 式的转录错误
- 每个值标注来源表号

**12.6.4 性能要求**
- 首屏加载 < 1.5s（Lighthouse）
- 计算响应 < 16ms（即时）
- 移动端完美适配（表格转卡片布局）

### 12.7 验收标准（6 条，来自竞品审计）

| # | 标准 | 验证方法 |
|---|------|----------|
| 1 | NPS 升序排列 | 默认视图 1/2" → 24"，无乱序 |
| 2 | Class 全等级覆盖 | 150/300/400/600/900/1500/2500 全部可计算 |
| 3 | 数据可溯源 | 每个值标注 ASME B16.5 表号 |
| 4 | 几何建模非平板近似 | WN 重量 ≠ 平板重量（差异 > 20%） |
| 5 | 基准值自检 | WN 24" 150# ≈ 126 kg（±5%） |
| 6 | 单位切换 | mm/inch/kg/lb 一键切换，无混用 |

### 12.8 后续迭代

| 版本 | 功能 |
|------|------|
| v1.0 | 单法兰计算（当前 Spec） |
| v1.1 | 批量计算（上传 Excel） |
| v1.2 | 对比模式（选 2 个法兰并排比较） |
| v2.0 | API 接口（供其他站调用） |

---

## 13. 下一步行动（决策点）

- [ ] DataForSEO/Ahrefs 验证关键词量级（半天）
- [ ] 域名注册（24h 内，防止被抢）
- [ ] 丝网站 GA4 数据回顾：确认"工具→询盘"转化假设成立（4-6 周后）
- [ ] 若 GO：按 Section 5 P0 清单开发，复用 meshcalculator 代码骨架
