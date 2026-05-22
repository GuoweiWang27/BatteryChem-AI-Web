# BatteryChem-AI Web 前端全面规划方案

> 调研时间：2026-05-22 | 覆盖平台：20+ | 目标：丘奖/I SEF 级别学术展示

---

## 一、整体定位与设计方向

### 1.1 目标愿景

打造一个**全球电池化学社区可用的开源电解液 AI 筛选平台**，对标 Materials Project / BatElyte 的专业度，同时具备 Perplexity AI 的 AI 原生交互体验。

### 1.2 设计哲学

```
学术严谨感 (Stanford Source Serif 4 + Cardinal Red #8C1515)
        +
AI 活力感 (Perplexity 过程可视化 + teal 强调色 #20B2AA)
        +
科研可信度 (Nature/Science 图表规范 + Viridis 无障碍色板)
```

### 1.3 视觉规范速查

| 维度 | 规范 |
|------|------|
| **主色** | Cardinal Red `#8C1515` |
| **互动蓝** | Lagunita Blue `#007C92` |
| **正向色** | Palo Alto Green `#009B76` |
| **AI 预测色** | Model Purple `#6C5CE7` |
| **正文字体** | Source Sans 3 (Google Fonts) |
| **学术字体** | Source Serif 4 |
| **代码/SMILES** | JetBrains Mono |
| **公式渲染** | KaTeX |
| **图表色板** | Okabe-Ito (Nature 期刊推荐，无障碍) |
| **间距系统** | 8px Grid |
| **卡片圆角** | 12px |

---

## 二、五大功能模块

### 模块 1：配方设计器 (`/design`) — 核心交互页

**定位**：AI 原生配方探索工具，类似 Perplexity 的单栏对话 + 即时可视化。

**子功能**：
- **输入模式 A**：下拉选择（溶剂混合物 / 锂盐 / 添加剂 / 浓度滑块）
- **输入模式 B**：SMILES 自由输入 + SmilesDrawer 2D 结构即时渲染
- **输出**：离子电导率预测值 + 置信区间 + 稳定性窗口 + 雷达图
- **数据溯源**：每个预测值标注来源（如 "Based on CALiSol-23 dataset · EC:DMC baseline"）

### 模块 2：AI 研究助手 (`/chat`) — 对话引擎

**定位**：自然语言配方分析助手，用户用中文/英文描述需求，AI 调用 XGBoost 模型返回结构化结果。

**核心交互**：
- Intent Preview（发送前显示 AI 将调用的参数）
- Confidence Signal（每个数值旁边显示置信度徽章）
- Action Audit（对话历史自动记录每次预测参数）

### 模块 3：高通量筛选库 (`/screening`) — 数据浏览

**定位**：AFLOW/Materials Project 风格的高通量筛选界面。

**子功能**：
- 分面筛选面板（溶剂体系 / 锂盐 / 添加剂 / 浓度范围）
- 结果表格（排名 / 溶剂 / 盐 / 添加剂 / 电导率 / 置信度）
- Top-100 海选榜单（独立 Tab）

### 模块 4：模型评估台 (`/evaluate`) — 学术验证页

**定位**：5 折 CV + SHAP 可解释性的完整学术展示。

**子功能**：
- 性能指标卡（CV R² / RMSE / Holdout R² / 数据规模）
- 残差拟合图（蓝色 CV 散点 + 红色盲测三角）
- SHAP 全局重要性图（水平条形图）
- SHAP 瀑布图（单次预测的特征贡献分解）

### 模块 5：学术报告导出 (`/export`) — 丘奖论文配套

**定位**：一键生成符合学术规范的图表和报告。

**子功能**：
- 图表导出（PNG 300 DPI / SVG / PDF + LaTeX 标注）
- 配方报告 PDF 生成（ACS 期刊格式）
- BibTeX/APA 引用生成器
- 配方对比报告（2-5 个配方并排比较）

---

## 三、页面结构与路由

```
/                    首页 - Hero + 价值主张 + CTA
├── /design          配方设计器（核心交互）
├── /chat            AI 研究助手
├── /screening       高通量筛选（分面筛选 + 表格）
│   └── /top100      Top-100 海选榜单
├── /evaluate        模型评估台（CV + SHAP）
├── /library         个人配方收藏库
├── /export          学术报告导出
├── /about           项目介绍 / 方法论
├── /paper           论文配套（PDF + 引用）
└── /api-doc         API 文档（Swagger）
```

---

## 四、技术架构

### 4.1 架构总览

```
┌──────────────────────────────────────────────────────┐
│               Next.js 15 (App Router)                 │
│         TypeScript + Tailwind CSS + Plotly            │
├──────────────────────────────────────────────────────┤
│                    Vercel Edge                        │
│         (SSR/SSG + AI SDK 流式输出)                   │
├──────────────────────────────────────────────────────┤
│                   FastAPI (Python)                    │
│   /predict · /screening/batch · /shap · /validate    │
│   ← 直接 import app.py 的 XGBoost brain               │
├──────────────────────────────────────────────────────┤
│               Railway (Python Runtime)                │
├──────────────────────────────────────────────────────┤
│                  Supabase (PostgreSQL)                │
│   users · formulas · chat_history · api_usage         │
│   + Auth + RLS + pgvector                             │
└──────────────────────────────────────────────────────┘
```

### 4.2 V6 → V7 迁移评估

| V6 文件 | 迁移到 | 复杂度 |
|---------|--------|--------|
| `app.py` | FastAPI `/predict` | **零成本** |
| `web_app.py` | Next.js `/design` | 中等 |
| `search_all_families.py` | `/screening/batch` | 低 |
| `evaluate_and_explain.py` | `/evaluate` | 中等 |
| `data_pipeline.py` | `/validate` | 低 |

---

## 五、实施阶段

| Phase | 内容 | 时间 |
|-------|------|------|
| 1 | Next.js + Tailwind + FastAPI 骨架 + Supabase | Week 1-2 |
| 2 | `/design` 配方设计器 + Plotly 雷达图 | Week 2-4 |
| 3 | `/screening` 高通量筛选 + 结果表格 | Week 3-4 |
| 4 | `/evaluate` 模型评估台（CV + SHAP） | Week 4-5 |
| 5 | `/chat` AI 研究助手（Vercel AI SDK + Claude） | Week 4-6 |
| 6 | `/export` 学术报告导出（300 DPI + LaTeX + BibTeX） | Week 5-6 |
| 7 | CI/CD 部署 + SEO + 多语言 | Week 7-8 |
| 8 | 公开上线 + 丘奖/I SEF 答辩材料 | Week 8+ |

---

## 六、关键设计决策

| 决策 | 方案 | 理由 |
|------|------|------|
| 前端框架 | Next.js 15 + App Router | SSR/SSG + SEO 友好 |
| 后端框架 | FastAPI（直接复用 app.py） | 零迁移成本 |
| 数据库 | Supabase PostgreSQL | Auth + RLS 同平台 |
| AI 对话 | Vercel AI SDK + Claude | 流式输出 + Function Calling |
| 图表库 | Plotly.js (React) | 与 V6 Python Plotly 同源 |
| 分子可视化 | SmilesDrawer + RDKit.js | 2D 即时渲染 + WASM |
| 公式渲染 | KaTeX | 比 MathJax 快 5-10x |
| 字体 | Source Sans 3 + Source Serif 4 | Stanford 官方字体 |
| 部署 | Vercel + Railway | 学术项目零成本 |

---

## 七、配色系统

### Stanford 官方色彩

| 用途 | 颜色名 | HEX |
|------|--------|-----|
| 主色 | Cardinal Red | `#8C1515` |
| 互动强调 | Lagunita Blue | `#007C92` |
| 成功/正向 | Palo Alto Green | `#009B76` |
| 背景 | Off White | `#F0F4F5` |
| 正文文字 | Deep Charcoal | `#2E2D29` |

### AI4S 扩展色彩

| 类别 | HEX | 象征 |
|------|-----|------|
| Electrolyte Blue | `#0066CC` | 离子传导 |
| Ion Orange | `#E67E22` | 锂离子运动 |
| Thermal Red | `#D63031` | 热失控警示 |
| Model Purple | `#6C5CE7` | AI 预测 |
| Stable Green | `#00B894` | 循环稳定性 |

---

## 八、字体系统

| 类型 | 字体 | 用途 |
|------|------|------|
| 标题字体 | Source Serif 4 Bold | H1/H2 主标题 |
| 正文字体 | Source Sans 3 Regular | Body / UI |
| 代码/SMILES | JetBrains Mono | 数据 / 分子式 |
| 学术引用 | Source Serif 4 Italic | 引用 / 文献 |

---

*文档版本: 1.0 | 创建日期: 2026-05-22 | 适用范围: AI4S BatteryChem-AI 平台前端开发*
