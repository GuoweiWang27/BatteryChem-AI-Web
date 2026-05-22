// BatteryChem-AI V3 — i18n Engine
// Scans DOM for [data-i18n] attributes and replaces text with active language

const I18n = {
  _lang: 'zh',
  _dicts: { zh: I18N_ZH, en: I18N_EN },

  init() {
    // Read saved preference or browser language
    const saved = localStorage.getItem('batterychem-lang');
    if (saved && (saved === 'zh' || saved === 'en')) {
      this._lang = saved;
    } else if (navigator.language.startsWith('en')) {
      this._lang = 'en';
    }
    this.apply();
    this.updateSwitchUI();
  },

  toggle() {
    this._lang = this._lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('batterychem-lang', this._lang);
    this.apply();
    this.updateSwitchUI();
    // Dispatch event for JS-rendered content (Plotly charts, dynamic text)
    document.dispatchEvent(new CustomEvent('i18n-change', { detail: { lang: this._lang } }));
  },

  get lang() { return this._lang; },
  get dict() { return this._dicts[this._lang]; },

  t(key) {
    return this._dicts[this._lang][key] || this._dicts['en'][key] || key;
  },

  apply() {
    const dict = this._dicts[this._lang];
    // Replace text for elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        // Only replace if it's a simple text node (not complex HTML)
        if (el.children.length === 0) {
          el.textContent = dict[key];
        }
      }
    });
    // Replace innerHTML for elements with data-i18n-html (allows HTML tags)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });
    // Handle placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });
    // Handle aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (dict[key]) {
        el.setAttribute('aria-label', dict[key]);
      }
    });
    document.documentElement.lang = this._lang === 'zh' ? 'zh-CN' : 'en';
  },

  updateSwitchUI() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === this._lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
};
