/**
 * 个人图书馆 — 主题切换 + 字体大小调节
 * 依赖 window.ReaderApp (app.js)
 */
(function themeModule() {
  'use strict';
  var R = window.ReaderApp;
  if (!R || !R.state) { setTimeout(themeModule, 50); return; }

  var state = R.state;
  var _themeBound = false;
  var _epubThemesRegistered = false;

  // 注册 EPUB 主题（epub.js themes API）
  function registerEpubThemes() {
    if (!state.epubRendition || !state.epubRendition.themes) return;
    if (_epubThemesRegistered) return;
    try {
      // 暗色
      state.epubRendition.themes.register('dark', {
        body: { background: '#0b1120', color: '#f1f5f9' },
        a: { color: '#818cf8' }
      });
      // 护眼
      state.epubRendition.themes.register('sepia', {
        body: { background: '#f4ecd8', color: '#4a3728' },
        a: { color: '#8b6914' }
      });
      // 羊皮纸
      state.epubRendition.themes.register('parchment', {
        body: { background: '#e8dcc8', color: '#3d2b1f' },
        a: { color: '#6b4423' }
      });
      _epubThemesRegistered = true;
    } catch (e) { /* epub.js themes 不可用 */ }
  }

  // 应用主题到 epub.js（在 EPUB 加载后调用）
  function applyEpubTheme(themeName) {
    if (!state.epubRendition) return;
    registerEpubThemes();
    try {
      if (themeName === 'light') {
        // light 是默认样式，用 themes.default 恢复
        state.epubRendition.themes.default({
          body: {
            background: '#ffffff',
            color: '#1e293b',
            'font-size': state.fontSize + 'px!important'
          },
          a: { color: '#2563eb' }
        });
      } else {
        state.epubRendition.themes.select(themeName);
        // 主题切换后重设字体大小
        state.epubRendition.themes.default({
          body: { 'font-size': state.fontSize + 'px!important' }
        });
      }
    } catch (e) { /* 忽略 */ }
  }

  // 应用全局主题
  function setTheme(themeName) {
    state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    try { localStorage.setItem('reader-theme', themeName); } catch (e) {}
    applyEpubTheme(themeName);
    updateThemeButton();
  }

  var THEME_ICONS = { light: '☀️', dark: '🌙', sepia: '🍂', parchment: '📜' };
  var THEME_CYCLE = ['light', 'dark', 'sepia', 'parchment'];

  function updateThemeButton() {
    var btn = document.getElementById('btnThemeCycle');
    if (btn) btn.textContent = THEME_ICONS[state.theme] || '☀️';
    // also update legacy select if it still exists
    var sel = document.getElementById('themeSelect');
    if (sel) sel.value = state.theme;
  }

  // 初始化主题
  function initTheme() {
    var saved;
    try { saved = localStorage.getItem('reader-theme'); } catch (e) {}
    var theme = saved || 'light';
    setTheme(theme);
  }

  // 字体大小
  function initFontSize() {
    var saved;
    try { saved = localStorage.getItem('reader-font-size'); } catch (e) {}
    state.fontSize = parseInt(saved) || 16;
    updateFontSizeLabel();
    applyFontSize();
  }

  function adjustFontSize(dir) {
    if (state.currentFormat !== 'epub') return;
    state.fontSize = Math.min(28, Math.max(12, state.fontSize + dir));
    updateFontSizeLabel();
    applyFontSize();
    try { localStorage.setItem('reader-font-size', String(state.fontSize)); } catch (e) {}
  }

  function updateFontSizeLabel() {
    var lbl = document.getElementById('fontSizeLabel');
    if (lbl) lbl.textContent = state.fontSize + 'px';
  }

  function applyFontSize() {
    if (!state.epubRendition) return;
    try {
      state.epubRendition.themes.default({
        body: { 'font-size': state.fontSize + 'px!important' }
      });
      // 重新应用当前主题（非 light 时）
      if (state.theme !== 'light') {
        applyEpubTheme(state.theme);
      }
    } catch (e) { /* 忽略 */ }
  }

  // 事件绑定
  function bindThemeEvents() {
    // 侧栏主题循环按钮
    var btnCycle = document.getElementById('btnThemeCycle');
    if (btnCycle) {
      btnCycle.addEventListener('click', function () {
        var idx = THEME_CYCLE.indexOf(state.theme);
        var next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
        setTheme(next);
      });
    }
    // 旧版 select（如果仍存在）
    var sel = document.getElementById('themeSelect');
    if (sel) {
      sel.addEventListener('change', function () {
        setTheme(this.value);
      });
    }
    var btnUp = document.getElementById('btnFontUp');
    var btnDown = document.getElementById('btnFontDown');
    if (btnUp) btnUp.addEventListener('click', function () { adjustFontSize(1); });
    if (btnDown) btnDown.addEventListener('click', function () { adjustFontSize(-1); });
  }

  // 暴露
  R.initTheme = initTheme;
  R.initFontSize = initFontSize;
  R.setTheme = setTheme;
  R.applyEpubTheme = applyEpubTheme;
  R.registerEpubThemes = registerEpubThemes;
  R.adjustFontSize = adjustFontSize;

  // 在 DOM 就绪后绑定事件
  function ready() {
    if (_themeBound) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        if (!_themeBound) { bindThemeEvents(); _themeBound = true; }
      });
    } else {
      bindThemeEvents();
      _themeBound = true;
    }
  }
  ready();
})();
