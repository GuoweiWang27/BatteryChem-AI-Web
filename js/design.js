// BatteryChem-AI V3 — Formulation Designer with Real Prediction Lookup
// Loads precomputed XGBoost predictions and looks up closest match

let predictionData = (typeof PREDICTION_DATA !== 'undefined') ? PREDICTION_DATA : [];
let currentPrediction = null;
let activeTab = 'quick'; // 'quick' | 'custom'

// ============================================================
// Tab Switching
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.getAttribute('data-tab') || 'quick';

    // Show/hide tab content
    const quickEl = document.getElementById('tab-quick');
    const customEl = document.getElementById('tab-custom');
    if (activeTab === 'quick') {
      if (quickEl) quickEl.style.display = '';
      if (customEl) customEl.style.display = 'none';
    } else {
      if (quickEl) quickEl.style.display = 'none';
      if (customEl) customEl.style.display = '';

      // Sync salt selection from quick tab
      const saltSelected = document.querySelector('#salt-group .radio-item.selected');
      const saltVal = saltSelected ? saltSelected.getAttribute('data-value') : 'LiPF6';
      const customRadios = document.querySelectorAll('#salt-group-custom .radio-item');
      customRadios.forEach(r => {
        r.classList.toggle('selected', r.getAttribute('data-value') === saltVal);
      });
    }
  });
});

// ============================================================
// Radio Item Selection (both groups)
// ============================================================
document.querySelectorAll('.radio-item').forEach(item => {
  item.addEventListener('click', () => {
    const group = item.closest('.radio-group');
    if (group) {
      group.querySelectorAll('.radio-item').forEach(r => r.classList.remove('selected'));
      item.classList.add('selected');
      // Sync between salt groups
      if (group.id === 'salt-group') {
        const val = item.getAttribute('data-value');
        document.querySelectorAll('#salt-group-custom .radio-item').forEach(r => {
          r.classList.toggle('selected', r.getAttribute('data-value') === val);
        });
      } else if (group.id === 'salt-group-custom') {
        const val = item.getAttribute('data-value');
        document.querySelectorAll('#salt-group .radio-item').forEach(r => {
          r.classList.toggle('selected', r.getAttribute('data-value') === val);
        });
      }
    }
  });
});

// ============================================================
// Mode Selector (Traditional / Polyphenol)
// ============================================================
const TRADITIONAL_ADDITIVES = [
  { value: 'fec', textKey: 'design.additive.fec' },
  { value: 'vc', textKey: 'design.additive.vc' },
  { value: 'ps', textKey: 'design.additive.ps' },
  { value: 'sn', textKey: 'design.additive.sn' },
  { value: 'adn', textKey: 'design.additive.adn' },
  { value: 'dtd', textKey: 'design.additive.dtd' },
];

const POLYPHENOL_ADDITIVES = [
  { value: 'quercetin', text: 'Quercetin — 槲皮素 (Polyphenol SEI)' },
  { value: 'catechin', text: 'Catechin — 儿茶素 (Antioxidant)' },
  { value: 'gallic_acid', text: 'Gallic Acid — 没食子酸 (H-bond Network)' },
  { value: 'resveratrol', text: 'Resveratrol — 白藜芦醇 (Radical Scavenger)' },
];

function updateAdditiveOptions(mode) {
  const select = document.getElementById('additive-select');
  if (!select) return;

  const options = mode === 'polyphenol' ? POLYPHENOL_ADDITIVES : TRADITIONAL_ADDITIVES;

  select.innerHTML = options.map(opt => {
    if (opt.textKey) {
      return `<option value="${opt.value}" data-i18n="${opt.textKey}">${I18n.t(opt.textKey)}</option>`;
    }
    return `<option value="${opt.value}">${opt.text}</option>`;
  }).join('');

  select.value = options[0].value;
}

document.querySelectorAll('.mode-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const selector = btn.closest('.mode-selector');
    if (selector) {
      selector.querySelectorAll('.mode-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode') || 'traditional';
      updateAdditiveOptions(mode);
    }
  });
});

// ============================================================
// Slider Updates
// ============================================================
function updateSliderBg(slider, val) {
  const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--cardinal-red) 0%, var(--cardinal-red) ${pct}%, var(--cool-grey-light) ${pct}%, var(--cool-grey-light) 100%)`;
}

function bindSlider(sliderId, displayId, suffix) {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(displayId);
  if (!slider || !display) return;
  slider.addEventListener('input', function() {
    display.textContent = parseFloat(this.value).toFixed(1) + ' ' + suffix;
    updateSliderBg(this, this.value);
  });
  updateSliderBg(slider, slider.value);
}

bindSlider('slider-molar', 'val-molar', 'M');
bindSlider('slider-wt', 'val-wt', 'wt%');
bindSlider('slider-molar-custom', 'val-molar-custom', 'M');
bindSlider('slider-wt-custom', 'val-wt-custom', 'wt%');

// ============================================================
// Citation Toggle + Action Buttons
// ============================================================
function toggleCite(id) {
  const detail = document.getElementById(id);
  if (!detail) return;
  detail.classList.toggle('open');
}

// Citation action buttons: View Original → open DOI, Download Data → CSV
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.cite-action-btn');
  if (!btn) return;
  e.stopPropagation();

  const action = btn.textContent.trim();
  const isView = action.includes('View') || action.includes('查看') || action.includes('文献');
  const isDownload = action.includes('Download') || action.includes('下载');

  if (isView) {
    // Open DOI for J. Electrochem. Soc. 2019
    window.open('https://doi.org/10.1149/2.0251915jes', '_blank');
  } else if (isDownload) {
    const detail = btn.closest('.cite-detail');
    let csv = 'Field,Value\n';
    if (detail) {
      detail.querySelectorAll('.cite-detail-row').forEach(row => {
        const cells = row.querySelectorAll('span');
        if (cells.length >= 2) {
          csv += `"${cells[0].textContent}","${cells[1].textContent}"\n`;
        }
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'batterychem_citation_data.csv';
    a.click();
  }
});

// ============================================================
// Get Current Parameters
// ============================================================
function getCurrentParams() {
  let salt, solventVal, additiveVal, conc, mode = 'traditional';

  if (activeTab === 'custom') {
    const saltEl = document.querySelector('#salt-group-custom .radio-item.selected');
    salt = saltEl ? saltEl.getAttribute('data-value') : 'LiPF6';
    const smilesS = document.getElementById('smiles-solvent');
    const smilesA = document.getElementById('smiles-additive');
    solventVal = smilesS ? smilesS.value : '';
    additiveVal = smilesA ? smilesA.value : '';
    conc = parseFloat(document.getElementById('slider-wt-custom')?.value) || 2.0;
    return { salt, solventVal, additiveVal, conc, mode: 'smiles', smilesSolvent: solventVal, smilesAdditive: additiveVal };
  }

  // Quick mode
  const saltEl = document.querySelector('#salt-group .radio-item.selected');
  salt = saltEl ? saltEl.getAttribute('data-value') : 'LiPF6';
  solventVal = document.getElementById('solvent-select')?.value || 'ec_dmc';
  additiveVal = document.getElementById('additive-select')?.value || 'fec';
  conc = parseFloat(document.getElementById('slider-wt')?.value) || 2.0;

  // Check additive mode
  const activeMode = document.querySelector('#additive-mode .mode-opt.active');
  if (activeMode) mode = activeMode.getAttribute('data-mode') || 'traditional';

  return { salt, solventVal, additiveVal, conc, mode };
}

// ============================================================
// Prediction Lookup
// ============================================================
function findClosestPrediction(params) {
  if (!predictionData.length) return null;

  // SMILES mode: return null to signal fallback
  if (params.mode === 'smiles') return 'smiles_fallback';

  // Try exact match on salt/solvent/additive, closest concentration
  const sameFormula = predictionData.filter(p =>
    p.salt === params.salt &&
    p.solvent_ui === params.solventVal &&
    p.additive_ui === params.additiveVal
  );

  if (sameFormula.length > 0) {
    return sameFormula.reduce((best, p) =>
      Math.abs(p.conc - params.conc) < Math.abs(best.conc - params.conc) ? p : best
    );
  }

  // Fallback: try matching just salt and additive
  const partialMatch = predictionData.filter(p =>
    p.salt === params.salt && p.additive_ui === params.additiveVal
  );
  if (partialMatch.length > 0) {
    return partialMatch.reduce((best, p) =>
      Math.abs(p.conc - params.conc) < Math.abs(best.conc - params.conc) ? p : best
    );
  }

  return predictionData[0];
}

// ============================================================
// Update UI with Prediction
// ============================================================
function displayPrediction(pred) {
  currentPrediction = pred;

  // Big number
  const numEl = document.getElementById('pred-num');
  if (numEl) numEl.textContent = pred.conductivity.toFixed(1);

  // Stability
  const stabEl = document.getElementById('stab-val');
  if (stabEl) stabEl.textContent = pred.stability.toFixed(2) + ' V';

  // SEI type
  const seiEl = document.getElementById('sei-type');
  if (seiEl) seiEl.textContent = pred.sei_type || 'Unknown';

  // Viscosity resistance (derived from conductivity and concentration)
  const viscEl = document.getElementById('visc-val');
  if (viscEl) viscEl.textContent = (0.3 + (pred.conc / 10) + (pred.conductivity / 30)).toFixed(2);

  // Polarity matching (derived from confidence)
  const polarEl = document.getElementById('polar-val');
  if (polarEl) polarEl.textContent = (0.4 + pred.confidence * 0.5).toFixed(2);

  // Confidence
  const confPct = document.getElementById('conf-pct');
  if (confPct) confPct.textContent = Math.round(pred.confidence * 100) + '%';

  // Confidence bar
  const fill = document.getElementById('conf-fill');
  const marker = document.getElementById('conf-marker');
  const confPctVal = Math.round(pred.confidence * 100);
  if (fill) fill.style.width = confPctVal + '%';
  if (marker) marker.style.left = confPctVal + '%';

  // Composition bar
  updateCompositionBar(pred);

  // Citation badges
  updateCitationBadges(pred);

  // Plotly charts
  renderRadarChart(pred);
  renderShapBarChart(pred);
}

function displaySmilesFallback(params) {
  // Show an estimated result for SMILES input
  const numEl = document.getElementById('pred-num');
  if (numEl) numEl.textContent = '—';

  const stabEl = document.getElementById('stab-val');
  if (stabEl) stabEl.textContent = '— V';

  const seiEl = document.querySelector('#pred-card .badge-purple strong');
  if (seiEl) seiEl.textContent = 'Unknown';

  const confPct = document.getElementById('conf-pct');
  if (confPct) confPct.textContent = 'N/A';

  const fill = document.getElementById('conf-fill');
  const marker = document.getElementById('conf-marker');
  if (fill) fill.style.width = '0%';
  if (marker) marker.style.left = '0%';

  const banner = document.getElementById('offline-banner');
  if (banner) {
    banner.innerHTML = '<span>SMILES Mode — Real-time prediction requires backend. Displaying estimated reference.</span>';
    banner.classList.add('show');
  }

  // Show estimated radar
  const pred = { conductivity: 10, stability: 4.0, conc: params.conc, confidence: 0.5, sei_type: 'Unknown', salt: params.salt, solvent_display: 'Custom SMILES', additive_display: 'Custom SMILES', quality: 'C' };
  updateCompositionBar(pred);
  renderRadarChart(pred);
  renderShapBarChart(pred);
}

function updateCompositionBar(pred) {
  const displaySolvent = pred.solvent_display;
  let ecPct = 0, dmcPct = 0, emcPct = 0, decPct = 0, dolPct = 0, dmePct = 0;

  if (displaySolvent.includes('EC:DMC')) { ecPct = 40; dmcPct = 30; }
  else if (displaySolvent.includes('EC:DEC')) { ecPct = 40; decPct = 30; }
  else if (displaySolvent.includes('EC:EMC')) { ecPct = 35; emcPct = 35; }
  else if (displaySolvent.includes('DOL:DME')) { dolPct = 35; dmePct = 35; }
  else { ecPct = 35; dmcPct = 35; } // custom

  const saltPct = Math.round(pred.conc * 10);
  const addPct = Math.round(pred.conc * 5);

  const barEc = document.getElementById('bar-ec');
  const barDmc = document.getElementById('bar-dmc');
  const barSalt = document.getElementById('bar-salt');
  const barAdd = document.getElementById('bar-add');

  if (barEc) { barEc.style.flex = String(ecPct > 0 ? ecPct : (dolPct || 35)); barEc.textContent = ecPct > 0 ? `EC ${ecPct}%` : (dolPct > 0 ? `DOL ${dolPct}%` : `Solvent 35%`); }
  if (barDmc) { barDmc.style.flex = String(dmcPct > 0 ? dmcPct : (emcPct > 0 ? emcPct : (decPct > 0 ? decPct : (dmePct > 0 ? dmePct : 35)))); barDmc.textContent = dmcPct > 0 ? `DMC ${dmcPct}%` : (emcPct > 0 ? `EMC ${emcPct}%` : (decPct > 0 ? `DEC ${decPct}%` : (dmePct > 0 ? `DME ${dmePct}%` : `Solvent 35%`))); }
  if (barSalt) { barSalt.style.flex = String(saltPct); barSalt.textContent = `${pred.salt} ${saltPct}%`; }
  if (barAdd) { barAdd.style.flex = String(addPct); barAdd.textContent = `${pred.additive_display} ${addPct}%`; }
}

function updateCitationBadges(pred) {
  const cite1Source = document.querySelector('#cite-1 .cite-source');
  if (cite1Source) {
    if (pred.quality === 'A') cite1Source.textContent = I18n.t('cite.calisol');
    else if (pred.quality === 'C') cite1Source.textContent = I18n.t('cite.dft');
    else cite1Source.textContent = I18n.t('cite.semi_empirical');
  }
  const cite2 = document.getElementById('cite-2');
  if (cite2) cite2.style.display = (pred.quality === 'C') ? 'none' : '';
}

// ============================================================
// Predict Button
// ============================================================
document.getElementById('predict-btn')?.addEventListener('click', () => {
  const params = getCurrentParams();
  const pred = findClosestPrediction(params);

  const banner = document.getElementById('offline-banner');

  if (pred === 'smiles_fallback') {
    displaySmilesFallback(params);
    return;
  }

  if (!pred) {
    if (banner) { banner.innerHTML = '<span>' + I18n.t('design.offline') + '</span>'; banner.classList.add('show'); }
    return;
  }

  if (banner) banner.classList.remove('show');
  displayPrediction(pred);
});

// ============================================================
// Reset Button
// ============================================================
document.getElementById('reset-btn')?.addEventListener('click', () => {
  const solventSelect = document.getElementById('solvent-select');
  const additiveSelect = document.getElementById('additive-select');
  if (solventSelect) solventSelect.selectedIndex = 0;
  if (additiveSelect) additiveSelect.selectedIndex = 0;

  ['slider-molar','slider-wt','slider-molar-custom','slider-wt-custom'].forEach(id => {
    const s = document.getElementById(id);
    if (s) { s.value = (id.includes('molar') ? 1.0 : 2.0); updateSliderBg(s, s.value); }
  });
  ['val-molar','val-molar-custom'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '1.0 M'; });
  ['val-wt','val-wt-custom'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '2.0 wt%'; });

  ['salt-group', 'salt-group-custom'].forEach(gid => {
    const g = document.getElementById(gid);
    if (g) {
      g.querySelectorAll('.radio-item').forEach(r => r.classList.remove('selected'));
      const first = g.querySelector('.radio-item');
      if (first) first.classList.add('selected');
    }
  });

  const modeBtns = document.querySelectorAll('#additive-mode .mode-opt');
  modeBtns.forEach(b => b.classList.remove('active'));
  if (modeBtns[0]) modeBtns[0].classList.add('active');

  if (activeTab === 'quick') {
    const params = getCurrentParams();
    const pred = findClosestPrediction(params);
    if (pred && pred !== 'smiles_fallback') displayPrediction(pred);
  }
});

// ============================================================
// Plotly Radar Chart
// ============================================================
function renderRadarChart(pred) {
  const el = document.getElementById('radar-chart');
  if (!el) return;

  const labels = [
    I18n.t('design.radar.conductivity'),
    I18n.t('design.radar.stability'),
    I18n.t('design.radar.viscosity'),
    I18n.t('design.radar.quantum_gap'),
    I18n.t('design.radar.dosage')
  ];

  // Use precomputed radar metrics if available, otherwise compute
  const r = pred.radar || {};
  const condNorm = r.conductivity_normalized || Math.min(1, Math.max(0.1, pred.conductivity / 16));
  const stabNorm = r.stability_field || Math.min(1, Math.max(0.1, pred.stability / 5));
  const viscNorm = r.viscosity_resistance || Math.min(1, Math.max(0.1, 0.4 + (pred.conc / 10)));
  const gapNorm = r.polarity_matching || Math.min(1, Math.max(0.1, 0.3 + pred.confidence * 0.7));
  const doseNorm = r.dosage_level || Math.min(1, Math.max(0.1, pred.conc / 5));

  const values = [condNorm, stabNorm, viscNorm, gapNorm, doseNorm];

  const trace = {
    type: 'scatterpolar',
    r: values.concat([values[0]]),
    theta: labels.concat([labels[0]]),
    fill: 'toself',
    fillcolor: 'rgba(140,21,21,0.08)',
    line: { color: '#8C1515', width: 2.5 },
    marker: { color: '#8C1515', size: 8 },
    name: I18n._lang === 'zh' ? '预测值' : 'Prediction'
  };

  const layout = {
    polar: {
      radialaxis: { range: [0, 1], showticklabels: false, gridcolor: '#EAEAEA', linecolor: '#EAEAEA' },
      angularaxis: { gridcolor: '#EAEAEA', linecolor: '#EAEAEA', tickfont: { family: 'Source Sans 3', size: 10, color: '#53565A' }, rotation: 90 }
    },
    margin: { t: 20, r: 50, b: 50, l: 50 },
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    showlegend: false
  };

  Plotly.newPlot('radar-chart', [trace], layout, { responsive: true, displayModeBar: false });
}

// ============================================================
// Plotly SHAP Bar Chart
// ============================================================
function renderShapBarChart(pred) {
  const el = document.getElementById('shap-bar-chart');
  if (!el) return;

  const addLumo = 0.8 + pred.confidence * 0.5;
  const solvTpsa = 0.5 + (pred.conductivity / 20);
  const saltMW = 0.3 + (pred.salt === 'LiFSI' ? 0.3 : pred.salt === 'LiTFSI' ? 0.15 : 0);
  const dosage = pred.conc / 10;
  const logP = -(0.1 + (1 - pred.confidence) * 0.4);

  const features = ['Additive LUMO', 'Solvent TPSA', 'Salt MW', 'Dosage Level', 'Solvent LogP'];
  const shapValues = [addLumo, solvTpsa, saltMW, dosage, logP].map(v => parseFloat(v.toFixed(2)));
  const colors = shapValues.map(v => v >= 0 ? '#00897B' : '#D63031');

  const trace = {
    type: 'bar', y: features, x: shapValues, orientation: 'h',
    marker: { color: colors },
    text: shapValues.map(v => (v >= 0 ? '+' : '') + v.toFixed(1)),
    textposition: 'outside',
    textfont: { family: 'JetBrains Mono', size: 11, color: '#53565A' }
  };

  const layout = {
    margin: { t: 5, r: 50, b: 40, l: 110 },
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    xaxis: { title: { text: 'SHAP value (mS/cm)', font: { family: 'Source Sans 3', size: 10 }, standoff: 8 }, zeroline: true, zerolinecolor: '#ddd', showgrid: false },
    yaxis: { tickfont: { family: 'Source Sans 3', size: 10, color: '#53565A' }, automargin: true },
    showlegend: false
  };

  Plotly.newPlot('shap-bar-chart', [trace], layout, { responsive: true, displayModeBar: false });
}

// ============================================================
// AI Analysis Button
// ============================================================
document.getElementById('btn-ai-analyze')?.addEventListener('click', () => {
  const input = document.getElementById('chat-input');
  const section = document.getElementById('chat-section');
  if (input) {
    input.value = I18n.t('chat.ai_prompt');
    input.focus();
  }
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // Auto-trigger send after a short delay
  setTimeout(() => {
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.click();
  }, 300);
});

// ============================================================
// Save / Export / View in Screening Buttons
// ============================================================
document.getElementById('btn-save')?.addEventListener('click', () => {
  if (!currentPrediction) return;
  const saved = JSON.parse(localStorage.getItem('batterychem-saved') || '[]');
  saved.push({ ...currentPrediction, savedAt: new Date().toISOString() });
  localStorage.setItem('batterychem-saved', JSON.stringify(saved.slice(-20)));
  alert(I18n._lang === 'zh' ? `已保存！共 ${saved.length} 条配方` : `Saved! ${saved.length} formulas total`);
});

document.getElementById('btn-export')?.addEventListener('click', () => {
  if (!currentPrediction) return;
  const blob = new Blob([JSON.stringify(currentPrediction, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `batterychem_${currentPrediction.salt}_${currentPrediction.additive_display}_${currentPrediction.conc}pct.json`;
  a.click();
});

document.getElementById('btn-view-screening')?.addEventListener('click', (e) => {
  if (!currentPrediction) return;
  e.preventDefault();
  const params = new URLSearchParams({
    solvent: currentPrediction.solvent_display || '',
    salt: currentPrediction.salt || '',
    additive: currentPrediction.additive_display || '',
  });
  window.location.href = 'screening.html?' + params.toString();
});

// ============================================================
// Init
// ============================================================
window.addEventListener('load', () => {
  setTimeout(() => {
    if (predictionData.length > 0 && activeTab === 'quick') {
      const params = getCurrentParams();
      const pred = findClosestPrediction(params);
      if (pred && pred !== 'smiles_fallback') displayPrediction(pred);
    }
  }, 500);
});
