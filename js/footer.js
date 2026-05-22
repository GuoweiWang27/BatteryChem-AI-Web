// BatteryChem-AI V3 — Shared Footer Component

function buildFooter() {
  const html = `
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-logo" style="text-align:center;margin-bottom:var(--s4)">Battery<span>Chem</span>-AI</div>
      <nav class="footer-nav">
        <a href="design.html" data-i18n="nav.design">${I18n.t('nav.design')}</a>
        <a href="screening.html" data-i18n="nav.screening">${I18n.t('nav.screening')}</a>
        <a href="evaluate.html" data-i18n="nav.evaluate">${I18n.t('nav.evaluate')}</a>
        <a href="about.html" data-i18n="nav.about">${I18n.t('nav.about')}</a>
        <a href="https://github.com/GuoweiWang27/BatteryChem-AI" target="_blank" data-i18n="footer.github">${I18n.t('footer.github')}</a>
      </nav>
      <div class="footer-bottom">
        <span data-i18n="footer.copyright">${I18n.t('footer.copyright')}</span>
        <span data-i18n="footer.tagline">${I18n.t('footer.tagline')}</span>
      </div>
    </div>
  </footer>`;

  const container = document.getElementById('footer-container');
  if (container) container.innerHTML = html;
}
