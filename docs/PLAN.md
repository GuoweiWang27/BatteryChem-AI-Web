# BatteryChem-AI Web 前端规划方案 V3

> 修订时间：2026-05-22 | 部署：GitHub Pages | 无后端 · 无登录 · 零翻车

---

## 核心定位

**全球电池化学社区可用的开源电解液 AI 筛选工具。**

任何人打开网页即可使用，无需注册、无需登录、不依赖服务器。

---

## 页面结构（4 个核心页面）

```
/                    首页 — Hero + 价值主张 + 一键开始
├── /design          配方设计器（5 维预测 + 数据来源徽章）
├── /screening       高通量筛选（Top-100 表格 + 分面筛选）
├── /evaluate        模型评估台（CV R² + SHAP + 化学直觉说明）
└── /about           方法论 + 数据来源说明 + 致谢
```

**删除**：`/chat`（独立页面）、`/library`、`/paper`、`/api-doc`、`/export`

---

## 功能模块

### 模块 1：配方设计器 (`/design`)

- 溶剂混合物 / 锂盐 / 添加剂 / 浓度滑块
- 5 个预测属性，每个旁附**数据来源徽章**（点击展开）
- Plotly 雷达图（5 维评估可视化）
- 数据来源分级：🟢 高质量实验数据 / 🟡 半经验估算

### 模块 2：高通量筛选 (`/screening`)

- Top-100 预计算结果表格（直接读取 JSON，无需后端）
- 分面筛选（溶剂 / 锂盐 / 添加剂 / 浓度范围）
- 数据来源徽章列（区分实验数据 vs 估算数据）
- 导出 CSV 按钮

### 模块 3：模型评估台 (`/evaluate`) — Phase 2 优先交付

- 性能指标卡（CV R² / RMSE / Holdout R² / 样本量）
- 残差拟合散点图
- SHAP 全局重要性条形图
- SHAP 瀑布图（单次预测特征贡献分解）
- **化学直觉一致性说明模块**（瀑布图下方）

### 模块 4：AI 研究助手（内嵌 /design 侧边栏）

**纯浏览器端实现，无需后端服务器。**

用户需自备 **Claude API Key**（存储于浏览器 localStorage，永不发送至第三方服务器）。

- 自然语言输入配方需求
- 浏览器直接调用 Claude API（携带 API Key）
- AI 解析意图 → 展示配方参数
- 图表按需注入（雷达图 / SHAP）

```
用户输入自然语言配方需求
        ↓
  检查 localStorage 是否有 Claude API Key
        ↓
  [有 Key] → 浏览器直接 fetch Claude API
  [无 Key] → 显示"请在设置中填入您的 Claude API Key"
```

---

## 技术架构（极简版）

### 部署拓扑

```
GitHub Pages (github.io)
    ↓ 纯静态站点，零服务器
Next.js 15 (Static Export) + Plotly.js (CDN)
    ↓ 读取预计算 JSON
/data/top100_predictions.json      (4,800 条预测结果)
    ↓
浏览器端完整运行，无后端依赖
```

### 预计算 JSON 文件

| 文件 | 内容 | 用途 |
|------|------|------|
| `top100_predictions.json` | 4,800 条配方 + 预测值 + 数据来源 | /screening |
| `model_metrics.json` | CV R² / RMSE / 残差统计 | /evaluate |
| `shap_global.json` | SHAP 全局特征重要性 | /evaluate |
| `shap_examples.json` | 3 个典型配方的 SHAP 瀑布数据 | /evaluate |
| `radar_templates.json` | 5 维雷达图模板数据 | /design |

### 容灾方案

```
用户发起预测
        ↓
   /data/top100_predictions.json 健康检查（fetch）
        ↓
   [正常] → 从预计算结果中检索最接近配方 → 显示
        ↓ (失败)
   [降级] → 显示 amber "预计算参考值" 提示
   → 演示永不断线
```

### AI Chat 实现（纯浏览器）

```
/design 侧边栏
    ↓
前端 JS 调用 https://api.anthropic.com/v1/messages
    ↓
携带 localStorage 中的 Claude API Key
    ↓
返回流式文本 → 渲染 Markdown
    ↓
按需注入 Plotly / 雷达图
```

---

## 实施计划（5 周）

### Week 1：骨架 + 部署

- [ ] Next.js 15 项目初始化 + Tailwind CSS + Stanford 品牌
- [ ] 生成预计算 JSON（5 个文件）
- [ ] GitHub Pages 部署验证
- [ ] `/` 首页
- [ ] 容灾机制实现（JSON fetch + 降级提示）

### Week 2：/design + /evaluate（同步上线）

- [ ] `/design` 配方设计器
  - 参数选择面板
  - 5 维预测结果 + 数据来源徽章
  - Plotly 雷达图（CDN）
  - 本地 JSON 检索
- [ ] `/evaluate` 模型评估台
  - CV 性能指标卡
  - 残差散点图
  - SHAP 条形图 + 瀑布图
  - **化学直觉一致性说明**

### Week 3：/screening + /about

- [ ] `/screening` 高通量筛选
  - Top-100 表格（分页）
  - 分面筛选
  - 数据来源徽章列
  - CSV 导出
- [ ] `/about` 方法论
  - 数据收集说明（CALiSol-23 + 期刊来源）
  - 模型训练流程
  - 致谢 + LICENSE

### Week 4：AI 助手 + 打磨

- [ ] AI 研究助手（内嵌 /design 侧边栏）
  - Claude API Key 设置 UI（存储 localStorage）
  - 流式对话渲染
  - 配方意图解析
- [ ] 全站响应式优化
- [ ] 暗色模式切换
- [ ] Core Web Vitals < 2s

### Week 5：打磨 + 丘奖答辩材料

- [ ] 预计算 JSON 更新脚本（`scripts/export_predictions.py`）
- [ ] 丘奖答辩 PDF 材料（12 页版）
- [ ] README + LICENSE 整理
- [ ] GitHub 仓库发布

---

## 设计规范（继承 V2）

| 维度 | 规范 |
|------|------|
| 主色 | Cardinal Red `#8C1515` |
| 高质量数据徽章 | Deep Teal `#00897B` |
| 估算数据徽章 | Amber `#E67E22` |
| 正文字体 | Source Sans 3 |
| 学术字体 | Source Serif 4 |
| 间距 | 8px Grid |
| 卡片圆角 | 12px |

---

## 数据来源透明度规范

### 质量分级

| 等级 | 颜色 | 含义 | 示例 |
|------|------|------|------|
| A 级 | 🟢 Deep Teal | 真实实验，同行评审 | CALiSol-23, JES/JPS 期刊 |
| B 级 | 🟡 Amber | 文献外推 | 新浓度/温度范围外推 |
| C 级 | 🔴 Coral | 半经验估算 | DFT 描述符外推 |

### 徽章展开内容

```
数据来源：J. Electrochem. Soc. 2019
样本量：N = 127
置信区间：[11.8, 13.2] mS/cm
测量方法：电化学阻抗谱 (EIS)
[查看原始文献]  [下载数据]
```

---

## 化学直觉一致性说明模板

> 位于 SHAP 瀑布图下方，解释模型决策与领域共识的一致性。

```
模型将 [特征 X] 识别为首要正向贡献因子，这与电化学领域共识一致：
[化学解释]。这一对齐增强了预测的可信度。

Reference: [期刊年份], [DOI/引用]
```

---

## 丘奖答辩保障机制

1. **JSON Fallback**：无论网络/服务器状态，预计算数据永远可用
2. **纯静态部署**：GitHub Pages，零服务器成本，不怕宕机
3. **Phase 2 优先**：/evaluate（CV R²=0.91 + SHAP）Week 2 上线，答辩前充分展示
4. **无需登录**：评委打开网页即可使用，无门槛

---

*文档版本: 3.0 | 修订日期: 2026-05-22 | 路线：极简公开工具 · GitHub Pages · 无后端 · 无登录*
