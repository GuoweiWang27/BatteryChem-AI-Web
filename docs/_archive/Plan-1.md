# BatteryChem-AI 前端架构方案

**项目：** 电池电解液筛选工具的现代化 Web 前端  
**当前状态：** Streamlit 应用，位于 `/Users/YouMing/Desktop/AI4S-V6/web_app.py`  
**目标：** 独立的 HTML/CSS/JS 应用，斯坦福学术风格  
**赛事：** 2026 丘成桐科学奖

---

## 摘要

本方案为 BatteryChem-AI 设计一套完整的前端重构方案，将当前 Streamlit 原型升级为可投产的 Web 应用：

- **简洁学术风格**：参考斯坦福设计语言（避免通用 AI 紫色渐变风）
- **纯 HTML/CSS/JS** 实现（初期无构建工具，可后续迁移）
- **RESTful API 后端**（FastAPI 封装现有 XGBoost 模型）
- **交互式可视化**（雷达图、SHAP 瀑布图、分子描述符表）
- **无障碍优先设计**（符合 WCAG AA 标准）

### 关键发现（代码库分析）
- 当前模型只预测 **离子电导率**（单输出，而非原需求中的 5 个属性）
- 使用 15 维特征向量（基于分子描述符）
- 现有可视化：5 轴雷达图（电导率 + 4 个派生指标）
- 后端已实现 SHAP 可解释性

---

## 一、当前系统分析

### 后端架构（Python）
```
data_pipeline.py → experimental_training_data.csv
                ↓
            app.py → ultimate_academic_brain.pkl（XGBoost）
                ↓
          web_app.py（Streamlit UI）
```

### 已识别的核心组件

**数据库（来自 `data_pipeline.py`）：**
- **溶剂：** 7 种预设（DMC、DEC、EC、EMC、PC、DOL、DME）
- **添加剂：** 10 种预设（FEC、VC、PS、SN、ADN、DTD、Quercetin 槲皮素、Catechin 儿茶素、Gallic_Acid 没食子酸、Resveratrol 白藜芦醇）
- **锂盐：** 3 种（LiPF6、LiFSI、LiTFSI）

**分子描述符（每组分 5 个）：**
- MW（分子量）
- TPSA（拓扑极性表面积）
- LogP（油水分配系数）
- HOMO（最高占据分子轨道能量）
- LUMO（最低未占分子轨道能量）

**15 维特征向量：**
1-5：溶剂描述符（MW、TPSA、LogP、HOMO、LUMO）  
6-7：锂盐描述符（MW、TPSA）  
8-12：添加剂描述符（MW、TPSA、LogP、HOMO、LUMO）  
13：添加剂用量（wt%）  
14：Delta MW（添加剂 − 溶剂）  
15：量子跨能隙（添加剂 LUMO − 溶剂 HOMO）

**模型输出：**
- **主要：** 离子电导率（mS/cm）
- **派生指标**（用于雷达图）：
  - 粘度阻抗（基于 MW 计算）
  - 用量水平（归一化）
  - 稳定性场（基于 HOMO/LUMO 能隙）
  - 极性匹配度（基于 TPSA 差异）

---

## 二、页面布局与组件结构

### 2.1 总体布局

```
┌─────────────────────────────────────────────────────────┐
│ 页眉（固定，64px）                                        │
│ ┌─────────┐ BatteryChem-AI    [关于] [文档] [GitHub]    │
│ │  Logo   │                                              │
│ └─────────┘                                              │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ 主视觉区（最小高度 240px）                                │
│                                                           │
│   AI 驱动的电池电解液筛选平台                              │
│   基于实验数据训练的机器学习模型预测离子电导率              │
│                                                           │
│   [开始预测 ↓]                                            │
└─────────────────────────────────────────────────────────┘
┌──────────────────────┬──────────────────────────────────┐
│ 输入面板（35%）       │ 结果面板（65%）                    │
│ ┌──────────────────┐ │ ┌────────────────────────────┐   │
│ │ 电解液成分        │ │ │ 空状态 / 预测结果           │   │
│ ├──────────────────┤ │ │                            │   │
│ │ 1. 锂盐           │ │ │ • 电导率预测值              │   │
│ │   [LiPF6 ▼]      │ │ │ • 雷达图（5 个指标）        │   │
│ │                  │ │ │ • SHAP 特征重要性            │   │
│ │ 2. 溶剂           │ │ │ • 分子描述符明细             │   │
│ │   [预设 ▼]        │ │ │ • 导出选项                  │   │
│ │   或自定义 SMILES │ │ └────────────────────────────┘   │
│ │                  │ │                                    │
│ │ 3. 添加剂         │ │                                    │
│ │   [预设 ▼]        │ │                                    │
│ │   或自定义 SMILES │ │                                    │
│ │                  │ │                                    │
│ │ 4. 浓度           │ │                                    │
│ │   [━━●━━━] 2.0%  │ │                                    │
│ │                  │ │                                    │
│ │ [预测 →]          │ │                                    │
│ └──────────────────┘ │                                    │
└──────────────────────┴──────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ 页脚                                                      │
│ 引用 • MIT 许可 • 联系方式                                │
└─────────────────────────────────────────────────────────┘
```

### 2.2 组件层级

```
index.html
├── <header> 页眉（Logo、导航、移动菜单按钮）
├── <section class="hero"> 主视觉区
├── <main class="app-container">
│   ├── <aside class="input-panel"> 输入面板
│   │   ├── 锂盐选择器
│   │   ├── 溶剂输入（预设下拉 + 自定义 SMILES）
│   │   ├── 添加剂输入（预设下拉 + 自定义 SMILES）
│   │   ├── 浓度滑块
│   │   ├── 验证提示
│   │   └── 预测按钮
│   └── <section class="results-panel"> 结果面板
│       ├── 空状态
│       └── 结果展示
│           ├── 电导率卡片
│           ├── 雷达图容器
│           ├── SHAP 瀑布图容器
│           ├── 分子描述符表
│           └── 导出控件
└── <footer> 页脚
```

---

## 三、配色与字体系统

### 3.1 配色方案（斯坦福学术风）

```css
:root {
  /* 主红色 —— 斯坦福标志色，谨慎使用 */
  --color-cardinal: #8C1515;
  --color-cardinal-dark: #7A0F0F;
  --color-cardinal-light: #B83A4B;
  
  /* 中性色 —— 暖色调，学术气质 */
  --color-text-primary: #2E2D29;      /* 深暖灰 */
  --color-text-secondary: #544948;    /* 中暖灰 */
  --color-text-tertiary: #767676;     /* 浅灰 */
  
  --color-bg-primary: #FDFCFB;        /* 暖白底色 */
  --color-bg-surface: #FFFFFF;        /* 纯白卡片 */
  --color-bg-hover: #F8F7F5;          /* 悬浮态 */
  
  --color-border-light: #E4E1DD;      /* 浅边框 */
  --color-border-medium: #D5D2CA;     /* 中边框 */
  
  /* 语义色 */
  --color-success: #175E54;           /* 深青绿 */
  --color-warning: #B26F16;           /* 琥珀色 */
  --color-error: #8C1515;             /* 主红 */
  --color-info: #006B81;              /* 深青色 */
  
  /* 数据可视化（5 色雷达图） */
  --color-viz-1: #8C1515;  /* 主红 —— 电导率 */
  --color-viz-2: #007C92;  /* 数字蓝 —— 粘度 */
  --color-viz-3: #175E54;  /* 青绿 —— 用量 */
  --color-viz-4: #B26F16;  /* 金色 —— 稳定性 */
  --color-viz-5: #53284F;  /* 紫红 —— 极性匹配 */
}
```

**避免：** 紫色渐变、亮蓝霓虹、纯黑底色（这些是通用 AI 美学）

### 3.2 字体系统

```css
:root {
  /* 标题：衬线体，传达学术质感 */
  --font-heading: 'Source Serif 4', 'Source Serif Pro', 'Songti SC', Georgia, serif;
  
  /* 正文：现代无衬线，可读性优先 */
  --font-body: 'Source Sans 3', 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif;
  
  /* 等宽：用于 SMILES 字符串、技术数据 */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}
```

**字号比例（1.250 三度音阶）：**
```css
--text-xs: 0.64rem;     /* 10px 小字 */
--text-sm: 0.8rem;      /* 13px 标签 */
--text-base: 1rem;      /* 16px 正文 */
--text-lg: 1.25rem;     /* 20px 小标题 */
--text-xl: 1.563rem;    /* 25px 章节标题 */
--text-2xl: 1.953rem;   /* 31px 页面标题 */
--text-3xl: 2.441rem;   /* 39px 主视觉 */
```

**重要说明：** 避免使用 Inter 字体（已被通用 AI 产品过度使用），采用 Adobe 开源的 Source Serif/Sans 系列以获得学术质感。中文环境下回落到苹方/思源。

### 3.3 间距系统（8px 基准）

```css
--space-1: 4px;   --space-2: 8px;    --space-3: 12px;
--space-4: 16px;  --space-5: 24px;   --space-6: 32px;
--space-8: 48px;  --space-10: 64px;  --space-12: 96px;

--radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 12px;

--shadow-sm: 0 1px 2px rgba(46, 45, 41, 0.05);
--shadow-md: 0 4px 6px rgba(46, 45, 41, 0.07);
--shadow-lg: 0 10px 15px rgba(46, 45, 41, 0.08);
```

---

## 四、交互模式与动效

### 4.1 按钮状态

```css
.btn-primary {
  background: var(--color-cardinal);
  color: white;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-primary:hover {
  background: var(--color-cardinal-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.btn-primary:active {
  transform: translateY(0);
}
.btn-primary:disabled {
  background: var(--color-border-medium);
  cursor: not-allowed;
}
```

### 4.2 输入聚焦态

```css
input:focus, select:focus {
  outline: 2px solid var(--color-cardinal);
  outline-offset: 2px;
  border-color: var(--color-cardinal);
}
.smiles-input.valid { border-color: var(--color-success); }
.smiles-input.invalid { border-color: var(--color-error); }
```

### 4.3 加载态

**优先使用骨架屏，而非旋转 spinner：**
```css
.skeleton {
  background: linear-gradient(90deg,
    var(--color-bg-surface) 0%,
    var(--color-bg-hover) 50%,
    var(--color-bg-surface) 100%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
```

**预测加载顺序：**
1. 按钮显示「预测中...」并轻微脉动
2. 结果面板显示骨架卡片
3. 图表依次淡入（每个错开 100ms）

### 4.4 渐进式呈现

用户选择「自定义 SMILES」时，输入框平滑展开（300ms ease-out）。

### 4.5 动效时长

```css
--duration-fast: 150ms;     /* 状态变化 */
--duration-normal: 250ms;   /* 标准过渡 */
--duration-slow: 400ms;     /* 大块内容 */
--easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
```

**原则：** 动效要细微、有目的，绝不喧宾夺主。

---

## 五、API 端点设计

### 5.1 后端技术选择

**推荐：FastAPI**
- 现代异步 Python 框架
- 自动生成 OpenAPI 文档
- 基于类型提示的请求验证
- 性能优于 Flask

### 5.2 API 端点

#### POST /api/v1/predict —— 预测电导率

**请求：**
```json
{
  "salt": "LiPF6",
  "solvent": { "type": "preset", "value": "EC:DEC 1:1" },
  "additive": { "type": "custom", "value": "C1=C(C=C(C(=C1O)O)O)C(=O)O" },
  "concentration": 2.5
}
```

**响应（成功 200）：**
```json
{
  "prediction_id": "pred_20260522_abc123",
  "timestamp": "2026-05-22T14:30:00Z",
  "conductivity": {
    "value": 12.45,
    "unit": "mS/cm",
    "model_version": "v10.5"
  },
  "radar_metrics": {
    "conductivity_normalized": 0.78,
    "viscosity_resistance": 0.62,
    "dosage_level": 0.50,
    "stability_field": 0.85,
    "polarity_matching": 0.71
  },
  "shap_values": [
    {"feature": "Solvent_MW", "importance": 0.45, "direction": "positive"},
    {"feature": "Salt_TPSA", "importance": 0.32, "direction": "negative"},
    {"feature": "Additive_LogP", "importance": 0.28, "direction": "positive"},
    {"feature": "Dosage_Level", "importance": 0.15, "direction": "positive"},
    {"feature": "Quantum_Cross_Gap", "importance": 0.12, "direction": "negative"}
  ],
  "molecular_descriptors": {
    "solvent": {"mw": 104.11, "tpsa": 26.30, "logp": 0.50, "homo": -6.48, "lumo": 0.51},
    "salt": {"mw": 151.91, "tpsa": 0.00},
    "additive": {"mw": 170.12, "tpsa": 98.0, "logp": 0.71, "homo": -6.40, "lumo": 0.15}
  }
}
```

**响应（错误 400）：**
```json
{
  "error": {
    "code": "INVALID_SMILES",
    "message": "添加剂的 SMILES 字符串无效",
    "field": "additive.value",
    "details": "无法解析 SMILES：第 12 位字符异常"
  }
}
```

#### GET /api/v1/presets —— 获取预设列表

```json
{
  "solvents": [
    {"id": "dmc", "name": "DMC", "display": "碳酸二甲酯 (DMC)"},
    {"id": "ec", "name": "EC", "display": "碳酸乙烯酯 (EC)"}
  ],
  "additives": [
    {"id": "fec", "name": "FEC", "display": "氟代碳酸乙烯酯 (FEC)"},
    {"id": "quercetin", "name": "Quercetin", "display": "槲皮素（多酚类）"}
  ],
  "salts": [
    {"id": "lipf6", "name": "LiPF6", "display": "六氟磷酸锂 (LiPF₆)"},
    {"id": "lifsi", "name": "LiFSI", "display": "双氟磺酰亚胺锂 (LiFSI)"},
    {"id": "litfsi", "name": "LiTFSI", "display": "双三氟甲磺酰亚胺锂 (LiTFSI)"}
  ]
}
```

#### POST /api/v1/validate-smiles —— 验证 SMILES

```json
// 请求
{ "smiles": "C1=C(C=C(C(=C1O)O)O)C(=O)O", "component_type": "additive" }

// 响应
{
  "valid": true,
  "canonical_smiles": "O=C(O)c1cc(O)c(O)c(O)c1",
  "descriptors": {"mw": 170.12, "tpsa": 98.0, "logp": 0.71, "homo": -6.40, "lumo": 0.15},
  "formula": "C7H6O5",
  "warnings": []
}
```

#### GET /api/v1/health —— 健康检查

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "model_loaded": true,
  "model_version": "v10.5",
  "rdkit_available": true
}
```

### 5.3 限流与跨域

- 限流：30 次/分钟（每 IP），返回标准 `X-RateLimit-*` 头
- CORS：开发环境允许 localhost，生产环境白名单部署域名

---

## 六、文件结构

```
BatteryChem-AI-Web/
├── index.html                  # 主页面
├── about.html                  # 关于页
├── docs.html                   # 文档页
│
├── assets/
│   ├── css/
│   │   ├── reset.css          # CSS 重置
│   │   ├── variables.css      # 设计变量
│   │   ├── typography.css     # 字体样式
│   │   ├── components.css     # 组件样式
│   │   ├── layout.css         # 布局样式
│   │   └── main.css           # 主入口
│   │
│   ├── js/
│   │   ├── config.js          # API 地址、常量
│   │   ├── api.js             # API 客户端
│   │   ├── validation.js      # 输入验证
│   │   ├── charts.js          # Chart.js 配置
│   │   ├── ui.js              # UI 状态管理
│   │   ├── components/
│   │   │   ├── input-panel.js
│   │   │   ├── results-panel.js
│   │   │   ├── radar-chart.js
│   │   │   ├── shap-chart.js
│   │   │   └── toast.js
│   │   └── main.js            # 应用入口
│   │
│   ├── fonts/                 # 自托管字体
│   │   ├── source-serif-4/
│   │   ├── source-sans-3/
│   │   └── jetbrains-mono/
│   │
│   ├── images/
│   │   ├── logo.svg
│   │   └── icons/
│   │
│   └── data/
│       └── presets-cache.json # 预设缓存
│
├── backend/                   # FastAPI 后端
│   ├── main.py
│   ├── models.py              # Pydantic 模型
│   ├── predictor.py           # 预测逻辑
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/
│   ├── 前端架构方案.md         # 本文档
│   ├── api-reference.md
│   └── user-guide.md
│
├── tests/
│   ├── test_api.py
│   └── test_validation.js
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 七、技术选型与理由

### 7.1 前端技术栈

| 技术 | 选择 | 理由 |
|------|------|------|
| **HTML/CSS/JS** | 原生 ES6+ 模块 | 无需构建，调试简单，刷新即生效 |
| **图表库** | Chart.js 4.x | 功能与简洁性平衡最佳，文档完善 |
| **HTTP 客户端** | Fetch API | 浏览器原生，async/await 优雅 |
| **状态管理** | 普通 JS 对象 | 单页应用够用，无需引入框架 |
| **CSS 架构** | CSS 自定义属性 | 动态主题、无需预处理器 |

### 7.2 后端技术栈

| 技术 | 选择 | 理由 |
|------|------|------|
| **框架** | FastAPI | 现代异步、自动文档、类型安全 |
| **机器学习** | XGBoost（现有） | 已训练完成，性能稳定 |
| **化学库** | RDKit | 行业标准 SMILES 解析 |
| **验证** | Pydantic | 类型安全的请求/响应模型 |

### 7.3 字体加载策略

**自托管字体（非 Google Fonts CDN）：**
- 国内访问稳定
- 加载更快（无外部 DNS）
- 保护用户隐私

```css
@font-face {
  font-family: 'Source Serif 4';
  src: url('../fonts/source-serif-4/SourceSerif4-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

### 7.4 Chart.js 配置示例

**雷达图：**
```javascript
const radarConfig = {
  type: 'radar',
  data: {
    labels: ['AI 电导率', '粘度阻抗', '用量水平', '稳定性场', '极性匹配'],
    datasets: [{
      label: '预测结果',
      data: [0.78, 0.62, 0.50, 0.85, 0.71],
      backgroundColor: 'rgba(140, 21, 21, 0.15)',
      borderColor: '#8C1515',
      borderWidth: 2.5,
      pointBackgroundColor: '#8C1515'
    }]
  },
  options: {
    scales: { r: { min: 0, max: 1, grid: { color: '#E4E1DD' } } },
    plugins: { legend: { display: false } }
  }
};
```

**SHAP 瀑布图：**
```javascript
const shapConfig = {
  type: 'bar',
  data: {
    labels: ['溶剂 MW', '锂盐 TPSA', '添加剂 LogP', '用量', '量子能隙'],
    datasets: [{
      data: [0.45, -0.32, 0.28, 0.15, -0.12],
      backgroundColor: ctx => ctx.parsed.x >= 0 ? '#175E54' : '#8C1515'
    }]
  },
  options: {
    indexAxis: 'y',
    plugins: { title: { display: true, text: '特征重要性（SHAP 值）' } }
  }
};
```

### 7.5 无障碍设计（WCAG AA）

- ✅ 正文文字对比度 ≥ 4.5:1
- ✅ 大字号对比度 ≥ 3:1
- ✅ 所有交互元素具备焦点指示
- ✅ 图标按钮配 ARIA 标签
- ✅ 语义化 HTML（正确的标题层级）
- ✅ 键盘可完整操作
- ✅ 动态内容通过 live region 朗读

### 7.6 性能优化

**1. 关键 CSS 内联：** 首屏 CSS 内联，其余异步加载  
**2. 延迟加载：** Chart.js 在用户点击「预测」时才下载  
**3. 缓存策略：** 预设数据存 localStorage，24h 内复用

```javascript
const CACHE_KEY = 'batterychem_presets';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

async function getCachedPresets() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) return data;
  }
  const fresh = await fetch('/api/v1/presets').then(r => r.json());
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data: fresh, timestamp: Date.now() }));
  return fresh;
}
```

### 7.7 响应式断点

```css
/* 移动端优先 */
:root { --container-width: 100%; }

/* 平板 (768px+) */
@media (min-width: 48rem) {
  :root { --container-width: 720px; }
  .app-grid { grid-template-columns: 1fr; }
}

/* 桌面 (1024px+) */
@media (min-width: 64rem) {
  :root { --container-width: 960px; }
  .app-grid { grid-template-columns: 35% 65%; gap: 48px; }
}

/* 大屏 (1280px+) */
@media (min-width: 80rem) {
  :root { --container-width: 1200px; }
}
```

---

## 八、实施阶段规划

### 第 1 周：静态 HTML/CSS
**目标：** 完成视觉设计与响应式布局

- [ ] 编写 HTML 结构（index.html）
- [ ] 实现 CSS 设计系统（variables.css）
- [ ] 构建组件样式（components.css）
- [ ] 完成响应式布局（layout.css）
- [ ] 引入字体并配置 typography
- [ ] 落实无障碍特性
- [ ] 跨浏览器测试

**交付物：** 完整样式的静态页面

### 第 2 周：后端 API
**目标：** 用 FastAPI 封装现有模型

- [ ] 搭建 FastAPI 项目结构
- [ ] 编写 Pydantic 请求/响应模型
- [ ] 实现 /predict 端点
- [ ] 实现 /validate-smiles 端点
- [ ] 实现 /presets 端点
- [ ] 配置 CORS 中间件
- [ ] 添加限流
- [ ] 编写 API 测试
- [ ] 生成 OpenAPI 文档

**交付物：** 可运行的 REST API

### 第 3 周：前端 JavaScript
**目标：** 连接 UI 与 API

- [ ] 搭建 ES6 模块结构
- [ ] 实现 API 客户端（api.js）
- [ ] 编写输入面板逻辑（input-panel.js）
- [ ] 添加 SMILES 验证
- [ ] 实现预测流程
- [ ] 加入加载态
- [ ] 实现错误处理
- [ ] 添加 Toast 通知

**交付物：** 可交互的预测界面

### 第 4 周：可视化
**目标：** 接入交互式图表

- [ ] 集成 Chart.js
- [ ] 构建雷达图组件
- [ ] 构建 SHAP 瀑布图
- [ ] 添加图表动效
- [ ] 实现图表响应式
- [ ] 添加导出功能（CSV/JSON）
- [ ] 打磨过渡动画

**交付物：** 完整交互式应用

### 第 5 周：测试与部署
**目标：** 投产就绪

- [ ] 跨浏览器测试（Chrome、Firefox、Safari、Edge）
- [ ] 移动设备测试
- [ ] 无障碍审计（WAVE、axe DevTools）
- [ ] 性能优化（Lighthouse）
- [ ] 安全审查
- [ ] 撰写用户文档
- [ ] 搭建 CI/CD 流水线
- [ ] 部署上线

**交付物：** 线上可访问的应用

---

## 九、后端实现示例（FastAPI）

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
import joblib, time
import numpy as np
from datetime import datetime
from pydantic import BaseModel, validator
from typing import Literal
import shap

# 复用现有模块
from app import (
    REAL_ADDITIVES_DATABASE, REAL_SALTS_DATABASE,
    build_pure_uncoupled_15d_features
)
from data_pipeline import REAL_SOLVENTS_DATABASE

try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, Crippen, rdMolDescriptors
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False

app = FastAPI(title="BatteryChem-AI API", version="1.0.0")
limiter = Limiter(key_func=get_remote_address)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

brains = joblib.load("ultimate_academic_brain.pkl")
model = brains["cond_brain"]
explainer = shap.TreeExplainer(model)

class SolventInput(BaseModel):
    type: Literal["preset", "custom"]
    value: str

class AdditiveInput(BaseModel):
    type: Literal["preset", "custom"]
    value: str

class PredictionRequest(BaseModel):
    salt: Literal["LiPF6", "LiFSI", "LiTFSI"]
    solvent: SolventInput
    additive: AdditiveInput
    concentration: float
    
    @validator('concentration')
    def validate_concentration(cls, v):
        if not 0.5 <= v <= 5.0:
            raise ValueError('浓度必须在 0.5 ~ 5.0 wt% 之间')
        return v

def get_rdkit_descriptors(smiles: str, is_solvent: bool = True):
    if not RDKIT_AVAILABLE:
        raise HTTPException(500, "RDKit 不可用")
    
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise HTTPException(400, f"无效的 SMILES：{smiles}")
    
    mw = float(Descriptors.MolWt(mol))
    tpsa = float(Descriptors.TPSA(mol))
    logp = float(Crippen.MolLogP(mol))
    
    if is_solvent:
        homo = -6.50 + (tpsa / 100.0) * 0.2 - (mw / 1000.0) * 0.1
        lumo = 0.40 - (tpsa / 100.0) * 0.1 + (logp * 0.05)
    else:
        homo = -5.50 + (tpsa / 150.0) * 0.3 - (mw / 1000.0) * 0.05
        lumo = 0.60 - (tpsa / 150.0) * 0.1 + (logp * 0.08)
    
    return {"mw": mw, "tpsa": tpsa, "logp": logp,
            "homo": float(homo), "lumo": float(lumo)}

@app.post("/api/v1/predict")
@limiter.limit("30/minute")
async def predict(request: Request, payload: PredictionRequest):
    salt_meta = REAL_SALTS_DATABASE[payload.salt]
    
    if payload.solvent.type == "preset":
        s_desc = REAL_SOLVENTS_DATABASE.get(payload.solvent.value)
        if not s_desc:
            raise HTTPException(400, f"未知溶剂预设：{payload.solvent.value}")
    else:
        s_desc = get_rdkit_descriptors(payload.solvent.value, is_solvent=True)
    
    if payload.additive.type == "preset":
        a_desc = REAL_ADDITIVES_DATABASE.get(payload.additive.value)
        if not a_desc:
            raise HTTPException(400, f"未知添加剂预设：{payload.additive.value}")
    else:
        a_desc = get_rdkit_descriptors(payload.additive.value, is_solvent=False)
    
    X = np.array([build_pure_uncoupled_15d_features(
        s_desc["mw"], s_desc["tpsa"], s_desc["logp"], s_desc["homo"], s_desc["lumo"],
        salt_meta["mw"], salt_meta["tpsa"],
        payload.concentration,
        a_desc["mw"], a_desc["tpsa"], a_desc["logp"], a_desc["homo"], a_desc["lumo"]
    )])
    
    conductivity = float(model.predict(X)[0])
    shap_values = explainer.shap_values(X)[0]
    
    feature_names = [
        "Solvent_MW", "Solvent_TPSA", "Solvent_LogP", "Solvent_HOMO", "Solvent_LUMO",
        "Salt_MW", "Salt_TPSA",
        "Additive_MW", "Additive_TPSA", "Additive_LogP", "Additive_HOMO", "Additive_LUMO",
        "Dosage_Level", "Delta_Structure_MW", "Quantum_Cross_Gap"
    ]
    
    shap_sorted = sorted(
        [{"feature": n, "importance": float(abs(v)),
          "direction": "positive" if v > 0 else "negative"}
         for n, v in zip(feature_names, shap_values)],
        key=lambda x: x["importance"], reverse=True
    )[:5]
    
    radar = {
        "conductivity_normalized": float(np.clip(conductivity / 16.0, 0.1, 1.0)),
        "viscosity_resistance": float(np.clip(
            (s_desc["mw"]/100.0) * (1.0 + 0.05 * payload.concentration)
            * (salt_meta["mw"]/150.0) / 2.0, 0.1, 1.0)),
        "dosage_level": float(np.clip(payload.concentration / 5.0, 0.1, 1.0)),
        "stability_field": float(np.clip(
            (5.5 - abs(a_desc["lumo"] - s_desc["homo"])) / 5.5, 0.1, 1.0)),
        "polarity_matching": float(np.clip(
            (150.0 - abs(a_desc["tpsa"] - s_desc["tpsa"])) / 150.0, 0.1, 1.0))
    }
    
    return {
        "prediction_id": f"pred_{int(time.time())}",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "conductivity": {"value": round(conductivity, 2),
                         "unit": "mS/cm", "model_version": "v10.5"},
        "radar_metrics": radar,
        "shap_values": shap_sorted,
        "molecular_descriptors": {
            "solvent": s_desc, "salt": salt_meta, "additive": a_desc
        }
    }

@app.get("/api/v1/presets")
async def get_presets():
    return {
        "solvents": [{"id": k.lower(), "name": k, "display": k}
                     for k in REAL_SOLVENTS_DATABASE.keys()],
        "additives": [{"id": k.lower(), "name": k, "display": k.replace("_", " ")}
                      for k in REAL_ADDITIVES_DATABASE.keys()],
        "salts": [{"id": k.lower(), "name": k, "display": k}
                  for k in REAL_SALTS_DATABASE.keys()]
    }

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy", "version": "1.0.0",
        "model_loaded": model is not None,
        "model_version": "v10.5", "rdkit_available": RDKIT_AVAILABLE
    }
```

---

## 十、关键成功要素

### 设计原则
1. **学术可信度：** 斯坦福风格，非通用 AI 美学
2. **清晰优于聪明：** 简单可预期的交互
3. **性能优先：** 快速加载、响应迅速
4. **无障碍优先：** WCAG AA、键盘可达
5. **透明可解释：** 展示 SHAP 值与分子描述符

### 相比 Streamlit 的差异化
- **专业外观：** 自定义设计 vs Streamlit 默认主题
- **更好性能：** 静态资源 vs WebSocket 开销
- **移动友好：** 响应式设计 vs 桌面专属
- **可定制：** 完全控制 vs Streamlit 约束
- **可投产：** 任意部署 vs 依赖 Streamlit Cloud

### 风险控制
- **浏览器兼容：** 测试主流浏览器
- **API 可靠性：** 重试机制、错误兜底
- **模型精度：** 展示置信度、链接到验证图
- **用户困惑：** 清晰标签、帮助文案、完整文档

---

## 十一、后续增强（MVP 之后）

### 第 6 阶段：进阶功能
- [ ] 分子结构查看器（RDKit.js 或 Kekule.js）
- [ ] 批量预测模式（上传 CSV）
- [ ] 对比工具（多个预测并排展示）
- [ ] 导出带图表的 PDF 报告
- [ ] 深色模式切换
- [ ] 国际化（中/英文切换）

### 第 7 阶段：迁移到 React（可选）
- [ ] 评估是否需要框架
- [ ] 搭建 Vite + React
- [ ] 增量迁移组件
- [ ] 添加状态管理（Zustand/Jotai）
- [ ] 集成 React Query 处理 API

---

## 总结

本架构方案给出了 BatteryChem-AI 从 Streamlit 原型升级为投产 Web 应用的完整路线图。设计上重点关注：

1. **学术美学** —— 斯坦福风格、专业、可信
2. **现代 UX** —— 响应式、无障碍、高性能
3. **技术质量** —— 干净代码、RESTful API、类型安全
4. **科学严谨** —— SHAP 可解释、分子细节、透明可查

采用原生 JavaScript 方案以便快速迭代（无构建工具），同时模块化结构留出了未来迁移到 React 的可能。

---

## 关键实现文件清单

根据当前代码库的实际情况，最关键的几个文件：

1. `/Users/YouMing/Desktop/AI4S-V6/app.py` —— 核心模型与数据库
2. `/Users/YouMing/Desktop/AI4S-V6/data_pipeline.py` —— 溶剂/添加剂/锂盐数据库
3. `/Users/YouMing/Desktop/AI4S-V6/web_app.py` —— 当前 Streamlit UI（参考用）
4. `/Users/YouMing/Desktop/AI4S-V6/evaluate_and_explain.py` —— SHAP 实现
5. `/Users/YouMing/Desktop/AI4S-V6/ultimate_academic_brain.pkl` —— 已训练的 XGBoost 模型

