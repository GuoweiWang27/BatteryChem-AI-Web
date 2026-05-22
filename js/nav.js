// BatteryChem-AI V3 — Shared Navigation Component
// Generates the <nav> element and inserts it into <div id="nav-container">

function buildNav(currentPage) {
  const pages = ['home', 'design', 'screening', 'evaluate', 'about'];
  const html = `
  <nav class="nav">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">
        <div class="nav-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <span class="nav-logo-text">Battery<span>Chem</span>-AI</span>
      </a>
      <ul class="nav-links" id="nav-links">
        ${pages.map(p => {
          const activeClass = p === currentPage ? ' class="active"' : '';
          const pageHref = p === 'home' ? 'index.html' : p + '.html';
          return `<li><a href="${pageHref}" data-i18n="nav.${p}"${activeClass}>${I18n.t('nav.' + p)}</a></li>`;
        }).join('')}
      </ul>
      <div class="nav-right">
        <a href="https://github.com/GuoweiWang27/BatteryChem-AI" target="_blank" class="icon-btn nav-github" title="GitHub" style="margin-right:var(--s1)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        </a>
        <div class="lang-switch">
          <button class="lang-btn" data-lang="zh" onclick="I18n.toggle()">中</button>
          <button class="lang-btn" data-lang="en" onclick="I18n.toggle()">EN</button>
        </div>
        <button class="hamburger" id="hamburger-btn" aria-label="Menu" onclick="toggleMobileNav()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </nav>`;

  const container = document.getElementById('nav-container');
  if (container) container.innerHTML = html;
}

function toggleMobileNav() {
  document.getElementById('nav-links').classList.toggle('open');
}

// Close mobile nav on outside click
document.addEventListener('click', (e) => {
  const nav = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger-btn');
  if (nav && nav.classList.contains('open') && !e.target.closest('#nav-links') && !e.target.closest('#hamburger-btn')) {
    nav.classList.remove('open');
  }
});
