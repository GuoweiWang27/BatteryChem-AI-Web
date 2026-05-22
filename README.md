# BatteryChem-AI Web V3

AI-driven lithium-ion battery electrolyte formulation screening platform.  
Pure static site — GitHub Pages deployable — no backend required.

**Stack**: HTML/CSS/JS + Plotly.js CDN + Claude API (browser-side)  
**Design**: Stanford Academic Design System (Cardinal Red `#8C1515`, Source Serif 4)  
**i18n**: Chinese / English toggle (localStorage persistent)

## Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Hero, value proposition, module overview |
| Design | `design.html` | Formulation designer + Plotly radar chart + SHAP attribution + AI chat sidebar |
| Screening | `screening.html` | Top-40 table + facet filters (solvent/salt/additive/conc) + CSV export |
| Evaluate | `evaluate.html` | CV R²=0.91 metrics + Plotly scatter/SHAP bar/waterfall + chemical intuition |
| About | `about.html` | Methodology (3-step), data sources, acknowledgments |

## Data Files

| File | Content |
|------|---------|
| `data/top100_predictions.json` | 40 example screening results |
| `data/model_metrics.json` | CV R² / RMSE / Holdout R² metrics |
| `data/shap_global.json` | 15-feature global SHAP importance |
| `data/shap_waterfall.json` | 3 example waterfall decompositions |

## AI Chat

The `/design` page includes a Claude API chat sidebar.  
Users enter their own Claude API Key (stored in `localStorage`, never sent to third parties).  
The browser directly calls `https://api.anthropic.com/v1/messages` via `fetch`.

## Quick Start

```bash
# Open in browser
open index.html

# Or serve locally
python3 -m http.server 8080
```

## Deployment

Push to `main` branch, enable GitHub Pages from `/docs` or root.  
No build step. No server. No environment variables.

## Design Tokens

See `css/design-system.css` for the complete Stanford Academic Design System:
- Cardinal Red `#8C1515` — primary brand
- Lagunita Blue `#007C92` — interactive emphasis
- Palo Alto Green `#009B76` — positive/success
- Source Serif 4 — headings
- Source Sans 3 — body
- 8px grid spacing system

## License

MIT — BatteryChem-AI is open source for the global electrochemistry community.
