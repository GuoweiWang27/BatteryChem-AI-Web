// BatteryChem-AI V3 — Screening Table Logic

let allData = (typeof PREDICTION_DATA !== 'undefined') ? PREDICTION_DATA : [];
let filteredData = [...allData];
let currentPage = 1;
const pageSize = 15;

// Init
if (allData.length === 0) {
  document.getElementById('screening-tbody').innerHTML =
    '<tr><td colspan="10" style="text-align:center;padding:3rem;color:var(--text-tertiary)">Data loading... Run scripts/generate_predictions.py to generate prediction data</td></tr>';
}

// Read URL params for pre-filled filters (from design page "View in Screening")
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('solvent')) document.getElementById('filter-solvent').value = urlParams.get('solvent');
if (urlParams.get('salt')) document.getElementById('filter-salt').value = urlParams.get('salt');
if (urlParams.get('additive')) document.getElementById('filter-additive').value = urlParams.get('additive');
if (urlParams.get('solvent') || urlParams.get('salt') || urlParams.get('additive')) applyFilters();

// Rank badge
function rankBadge(rank) {
  if (rank === 1) return '<span class="rank-badge gold">1</span>';
  if (rank === 2) return '<span class="rank-badge silver">2</span>';
  if (rank === 3) return '<span class="rank-badge bronze">3</span>';
  return `<span class="rank-badge">${rank}</span>`;
}

function condClass(val) {
  if (val >= 12) return 'cond-hi';
  if (val >= 7) return 'cond-md';
  return 'cond-lo';
}

function confChip(conf) {
  if (conf >= 0.8) return `<span class="conf-chip chip-hi">●●● ${Math.round(conf*100)}%</span>`;
  if (conf >= 0.6) return `<span class="conf-chip chip-md">●●○ ${Math.round(conf*100)}%</span>`;
  return `<span class="conf-chip chip-lo">●○○ ${Math.round(conf*100)}%</span>`;
}

function qualityBadge(q) {
  if (q === 'A') return '<span class="badge badge-a">A</span>';
  if (q === 'B') return '<span class="badge badge-b">B</span>';
  return '<span class="badge badge-c">C</span>';
}

// Render table
function renderTable() {
  const tbody = document.getElementById('screening-tbody');
  if (!tbody) return;

  const start = (currentPage - 1) * pageSize;
  const page = filteredData.slice(start, start + pageSize);

  tbody.innerHTML = page.map(row => `
    <tr>
      <td>${rankBadge(row.rank)}</td>
      <td><strong>${row.solvent_display || row.solvent}</strong></td>
      <td>${row.salt}</td>
      <td>${row.additive_display || row.additive}</td>
      <td>${row.conc}</td>
      <td>${qualityBadge(row.quality)}</td>
      <td><span class="${condClass(row.conductivity)}" style="font-family:var(--font-code);font-weight:600">${row.conductivity.toFixed(1)}</span></td>
      <td>${confChip(row.confidence)}</td>
      <td>${(row.stability || 4.0).toFixed(2)}</td>
      <td>
        <button class="icon-btn icon-btn-sm" title="Details" onclick="alert('Formula: ${row.solvent_display || row.solvent} + ${row.salt} + ${row.conc}% ${row.additive_display || row.additive}\\nσ = ${row.conductivity} mS/cm\\nQuality: ${row.quality}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </td>
    </tr>
  `).join('');

  // Pagination info
  const total = filteredData.length;
  const showing = Math.min(pageSize, total - start);
  document.getElementById('pagination-info').textContent =
    `${I18n.t('screening.showing')} ${start + 1}–${start + showing} ${I18n.t('screening.of')} ${total} ${I18n.t('screening.total')}`;

  // Dynamic pagination buttons
  renderPagination(total);
}

// Dynamic pagination
function renderPagination(total) {
  const totalPages = Math.ceil(total / pageSize);
  const btnsDiv = document.querySelector('.pag-btns');
  if (!btnsDiv) return;

  let html = `<button class="page-btn" id="prev-btn" ${currentPage <= 1 ? 'disabled' : ''}>&lt;</button>`;

  // Show pages: first, last, and a window around current
  const pagesToShow = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
  } else {
    pagesToShow.push(1);
    if (currentPage > 3) pagesToShow.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pagesToShow.push(i);
    if (currentPage < totalPages - 2) pagesToShow.push('...');
    pagesToShow.push(totalPages);
  }

  pagesToShow.forEach(p => {
    if (p === '...') html += '<span class="page-btn" style="border:none;cursor:default;color:var(--text-tertiary)">...</span>';
    else html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  });

  html += `<button class="page-btn" id="next-btn" ${currentPage >= totalPages ? 'disabled' : ''}>&gt;</button>`;
  btnsDiv.innerHTML = html;

  // Re-bind events
  document.getElementById('prev-btn')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderTable(); }
  });
  document.getElementById('next-btn')?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; renderTable(); }
  });
  btnsDiv.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.getAttribute('data-page'));
      renderTable();
    });
  });
}

// Apply filters
function applyFilters() {
  const solvent = document.getElementById('filter-solvent')?.value || '';
  const salt = document.getElementById('filter-salt')?.value || '';
  const additive = document.getElementById('filter-additive')?.value || '';
  const concRange = document.getElementById('filter-conc')?.value || '';
  const search = (document.getElementById('search-input')?.value || '').toLowerCase();

  filteredData = allData.filter(row => {
    const rowSolvent = row.solvent_display || row.solvent || '';
    const rowAdditive = row.additive_display || row.additive || '';
    if (solvent && rowSolvent !== solvent) return false;
    if (salt && row.salt !== salt) return false;
    if (additive && rowAdditive !== additive) return false;
    if (concRange) {
      const [lo, hi] = concRange.split(',').map(Number);
      if (row.conc < lo || row.conc >= hi) return false;
    }
    if (search) {
      const text = `${rowSolvent} ${row.salt} ${rowAdditive}`.toLowerCase();
      if (!text.includes(search)) return false;
    }
    return true;
  });

  filteredData = filteredData.map((row, i) => ({ ...row, rank: i + 1 }));
  currentPage = 1;
  renderTable();
}

// Event listeners for filters
document.getElementById('filter-solvent')?.addEventListener('change', applyFilters);
document.getElementById('filter-salt')?.addEventListener('change', applyFilters);
document.getElementById('filter-additive')?.addEventListener('change', applyFilters);
document.getElementById('filter-conc')?.addEventListener('change', applyFilters);
document.getElementById('search-input')?.addEventListener('input', applyFilters);

document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
  document.getElementById('filter-solvent').value = '';
  document.getElementById('filter-salt').value = '';
  document.getElementById('filter-additive').value = '';
  document.getElementById('filter-conc').value = '';
  document.getElementById('search-input').value = '';
  applyFilters();
});

// CSV Export
document.getElementById('export-csv-btn')?.addEventListener('click', () => {
  const headers = ['Rank','Solvent','Salt','Additive','Conc_wt%','Quality','Conductivity_mS_cm','Confidence','Stability_V'];
  const rows = filteredData.map(r => [r.rank, r.solvent_display || r.solvent, r.salt, r.additive_display || r.additive, r.conc, r.quality, r.conductivity, r.confidence, r.stability]);
  const csv = [headers.join(',')].concat(rows.map(r => r.join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'batterychem_screening_results.csv';
  a.click();
  URL.revokeObjectURL(a.href);
});
