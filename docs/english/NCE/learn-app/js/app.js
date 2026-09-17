/**
 * 新概念英语 · 学习模式 — App 逻辑（卡通书架版）
 * - 书架首页（点书进入）+ 学习视图（单词/课文/表达）
 * - 单词/表达：卡片 / 列表 切换
 * - 课文：逐句 / 全文（音频 + 卡拉OK高亮 + 译文开关）
 * - 记录上次学习位置，一键「继续学习」
 * 注：单句音频因本地 seek 不可靠已移除，改用全文音频跟读。
 */
(function () {
  'use strict';

  const DATA = window.NCE_LEARN;
  const POS_KEY = 'nce-learn-pos';
  const BOOK_COLORS = ['#ff6f9f', '#2bb8a8', '#8b7cf6'];
  const LOOP_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';

  const STAGES = [
    { key: 'words', label: '单词', icon: '📖' },
    { key: 'text', label: '课文', icon: '📝' },
    { key: 'expressions', label: '表达', icon: '💡' },
  ];

  const state = {
    view: 'shelf',      // 'shelf' | 'learn'
    level: 'NCE3',
    lessonId: null,
    stage: 'words',
    idx: 0,
    textMode: 'line',   // 'line' | 'full'
    listMode: false,
    showZh: true,
    loop: false,
    pickerOpen: false,
  };

  let currentLesson = null;
  let lyrics = [];       // [{start, end, text}]
  let lyricsReady = false;

  const $ = (id) => document.getElementById(id);
  const els = {
    shelfView: $('shelfView'),
    learnView: $('learnView'),
    bookName: $('bookName'),
    lessonList: $('lessonList'),
    stepper: $('stepper'),
    stage: $('stage'),
    themeToggle: $('themeToggle'),
    continueBtn: $('continueBtn'),
    shelfBackBtn: $('shelfBackBtn'),
    toast: $('toast'),
  };

  /* ============================================================
     helpers
     ============================================================ */
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { els.toast.style.display = 'none'; }, 1800);
  }

  /* ============================================================
     theme
     ============================================================ */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    els.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('nce-learn-theme', theme);
  }
  function initTheme() {
    applyTheme(localStorage.getItem('nce-learn-theme') || 'light');
    els.themeToggle.addEventListener('click', () => {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ============================================================
     位置记忆
     ============================================================ */
  function savePos() {
    localStorage.setItem(POS_KEY, JSON.stringify({
      level: state.level,
      lessonId: state.lessonId,
      stage: state.stage,
      idx: state.idx,
      textMode: state.textMode,
      listMode: state.listMode,
    }));
  }
  function loadPos() {
    try {
      const p = JSON.parse(localStorage.getItem(POS_KEY));
      if (p && p.lessonId && DATA.lessons[p.lessonId]) return p;
    } catch (e) { /* ignore */ }
    return null;
  }
  function stageLabel(key) {
    const s = STAGES.find((x) => x.key === key);
    return s ? s.label : '';
  }
  function lessonNo(id) {
    const m = /-(\d+)$/.exec(id);
    return m ? parseInt(m[1], 10) : id;
  }

  /* ============================================================
     LRC
     ============================================================ */
  async function loadLrc(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('LRC ' + resp.status);
    const text = await resp.text();
    const lines = [];
    const re = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
    for (const raw of text.split('\n')) {
      const t = raw.trim();
      if (!t) continue;
      re.lastIndex = 0;
      const times = [];
      let m;
      while ((m = re.exec(t)) !== null) {
        const mins = parseInt(m[1], 10);
        const secs = parseInt(m[2], 10);
        let ms = parseInt(m[3], 10);
        if (m[3].length === 2) ms *= 10;
        times.push(mins * 60 + secs + ms / 1000);
      }
      if (!times.length) continue;
      const textPart = t.replace(/\[[^\]]*\]/g, '').trim();
      if (!textPart) continue;
      for (const ts of times) lines.push({ start: ts, text: textPart });
    }
    lines.sort((a, b) => a.start - b.start);
    for (let i = 0; i < lines.length; i++) {
      lines[i].end = i < lines.length - 1 ? lines[i + 1].start : lines[i].start + 10;
    }
    return lines;
  }
  function lyricIndexAtTime(t) {
    if (!lyrics.length) return -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (t >= lyrics[i].start && t < lyrics[i].end) return i;
    }
    if (t < lyrics[0].start) return -1;
    return lyrics.length - 1;
  }

  /* ============================================================
     书架
     ============================================================ */
  function renderShelf() {
    const books = DATA.levels.map((l, i) => {
      const manifest = DATA.manifest[l.key] || [];
      const hasContent = manifest.some((m) => DATA.lessons[`${l.key}-${m.n}`]);
      return { key: l.key, label: l.label, count: manifest.length, hasContent, color: BOOK_COLORS[i % BOOK_COLORS.length] };
    });

    els.shelfView.innerHTML = `
      <div class="shelf">
        ${books.map((b) => `
          <button class="book${b.hasContent ? '' : ' disabled'}" data-level="${b.key}" style="--book-color:${b.color}">
            <div class="book-cover">
              <div class="book-body">
                <span class="book-emoji">📘</span>
                <span class="book-name">新概念英语<br>${b.label}</span>
                <span class="book-meta">${b.hasContent ? b.count + ' 课' : '敬请期待'}</span>
              </div>
            </div>
          </button>`).join('')}
        <div class="shelf-board"></div>
      </div>`;

    els.shelfView.querySelectorAll('.book:not(.disabled)').forEach((btn) => {
      btn.addEventListener('click', () => enterBook(btn.dataset.level));
    });
    els.shelfView.querySelectorAll('.book.disabled').forEach((btn) => {
      btn.addEventListener('click', () => toast('这本书的内容还在准备中～'));
    });
  }

  function enterBook(level, resume) {
    state.view = 'learn';
    state.level = level;
    state.pickerOpen = false;
    els.shelfView.style.display = 'none';
    els.learnView.style.display = '';
    els.shelfBackBtn.style.display = '';
    els.continueBtn.style.display = 'none';

    renderBookName();
    renderLessonList();
    renderStepper();

    const id = resume ? resume.lessonId : firstContentLessonId(level);
    if (id) selectLesson(id, resume);
  }

  function backToShelf() {
    state.view = 'shelf';
    els.learnView.style.display = 'none';
    els.shelfView.style.display = '';
    els.shelfBackBtn.style.display = 'none';
    els.continueBtn.style.display = loadPos() ? '' : 'none';
    renderShelf();
  }

  function firstContentLessonId(level) {
    const manifest = DATA.manifest[level] || [];
    const found = manifest.find((m) => DATA.lessons[`${level}-${m.n}`]);
    return found ? `${level}-${found.n}` : null;
  }

  /* ============================================================
     学习视图：选册 / 选课 / 步骤条
     ============================================================ */
  function renderBookName() {
    const l = DATA.levels.find((x) => x.key === state.level);
    els.bookName.innerHTML = `<span class="bk-emoji">📘</span>新概念英语 · ${l ? l.label : state.level}`;
  }

  function renderLessonList() {
    const manifest = DATA.manifest[state.level] || [];
    if (!manifest.length) {
      els.lessonList.innerHTML = '<div class="lesson-empty">该册内容待完善</div>';
      return;
    }
    const current = DATA.lessons[state.lessonId];

    if (state.pickerOpen) {
      const chips = manifest.map((m) => {
        const id = `${state.level}-${m.n}`;
        const hasContent = !!DATA.lessons[id];
        const isCurrent = state.lessonId === id;
        return `<button class="lesson-chip${isCurrent ? ' active' : ''}${hasContent ? ' has-content' : ''}" data-n="${m.n}">
          <span class="ln">${String(m.n).padStart(2, '0')}</span>
          <span>${escapeHtml(m.title)}</span>
        </button>`;
      }).join('');
      els.lessonList.innerHTML = `
        <div class="picker-head">
          <span class="picker-hint">选择课文 · 共 ${manifest.length} 课</span>
          <button class="picker-close" id="pickerClose">✕ 收起</button>
        </div>
        <div class="lesson-grid">${chips}</div>`;
      els.lessonList.querySelector('#pickerClose').addEventListener('click', () => {
        state.pickerOpen = false;
        renderLessonList();
      });
    } else {
      els.lessonList.innerHTML = `
        <div class="cur-lesson" id="curLesson">
          <span class="cur-num">第 ${current ? String(current.n).padStart(2, '0') : '--'} 课</span>
          <span class="cur-title">${current ? escapeHtml(current.title) : '请选择课文'}</span>
          ${current && current.titleZh ? `<span class="cur-zh">${escapeHtml(current.titleZh)}</span>` : ''}
          <span class="cur-caret">▾</span>
        </div>`;
      els.lessonList.querySelector('#curLesson').addEventListener('click', () => {
        state.pickerOpen = true;
        renderLessonList();
      });
    }

    els.lessonList.querySelectorAll('.lesson-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = `${state.level}-${btn.dataset.n}`;
        if (!DATA.lessons[id]) {
          toast('内容待完善');
          return;
        }
        selectLesson(id);
      });
    });
  }

  function renderStepper() {
    if (!currentLesson) { els.stepper.innerHTML = ''; return; }
    const curIdx = state.stage === 'done' ? STAGES.length : STAGES.findIndex((s) => s.key === state.stage);
    els.stepper.innerHTML = STAGES.map((s, i) => {
      const cls = state.stage === s.key ? ' active' : (i < curIdx ? ' done' : '');
      return `<button class="step${cls}" data-stage="${s.key}">
        <span class="step-icon">${s.icon}</span>
        <span class="step-label">${s.label}</span>
      </button>`;
    }).join('');
    els.stepper.querySelectorAll('.step').forEach((btn) => {
      btn.addEventListener('click', () => gotoStage(btn.dataset.stage));
    });
  }

  async function selectLesson(id, resume, silent) {
    currentLesson = DATA.lessons[id];
    if (!currentLesson) return;
    state.lessonId = id;
    state.level = currentLesson.book;
    state.pickerOpen = false;

    if (resume && resume.lessonId === id) {
      state.stage = STAGES.some((s) => s.key === resume.stage) ? resume.stage : 'words';
      state.idx = resume.idx || 0;
      state.textMode = resume.textMode === 'full' ? 'full' : 'line';
      state.listMode = !!resume.listMode;
    } else {
      state.stage = 'words';
      state.idx = 0;
      state.textMode = 'line';
      state.listMode = false;
    }
    state.showZh = true;
    lyricsReady = false;

    renderLessonList();
    renderStepper();
    renderStage();
    if (!silent) savePos();

    try {
      lyrics = await loadLrc(currentLesson.lrc);
      lyricsReady = true;
    } catch (e) {
      console.warn('LRC 加载失败（全文高亮不可用）：', e);
    }
  }

  function gotoStage(stage) {
    if (!currentLesson) return;
    state.stage = stage;
    state.idx = 0;
    renderStepper();
    renderStage();
    savePos();
  }

  function prevCard() {
    if (state.idx > 0) { state.idx--; renderStage(); savePos(); }
  }
  function nextCard() {
    if (state.idx < stageTotal() - 1) { state.idx++; renderStage(); savePos(); }
    else if (state.stage === 'expressions') {
      state.stage = 'done';
      state.idx = 0;
      renderStepper();
      renderStage();
      savePos();
    } else {
      toast('本阶段已学完，可通过上方步骤条切换阶段');
    }
  }
  function stageTotal() {
    if (state.stage === 'words') return currentLesson.words.length;
    if (state.stage === 'text') return currentLesson.text.length;
    if (state.stage === 'expressions') return currentLesson.expressions.length;
    return 0;
  }

  /* ============================================================
     阶段渲染
     ============================================================ */
  function renderStage() {
    if (!currentLesson) return;
    switch (state.stage) {
      case 'words': renderWords(); break;
      case 'text': renderText(); break;
      case 'expressions': renderExpressions(); break;
      case 'done': renderDone(); break;
    }
  }

  function cardShell(body, opts = {}) {
    const wrapCls = opts.wide ? 'card-wrap wide' : 'card-wrap';
    const cardCls = opts.wide ? 'card card-wide' : 'card';
    const prev = opts.prev ? '<button class="nav-arrow nav-prev" id="navPrev">‹</button>' : '';
    const next = opts.next ? '<button class="nav-arrow nav-next" id="navNext">›</button>' : '';
    return `<div class="${wrapCls}">${prev}<div class="${cardCls}">${body}</div>${next}</div>`;
  }
  function stageHead(title, count, extra = '') {
    return `<div class="card-head">
      <div class="card-title">${title}<span class="card-count">${count}</span></div>
      ${extra}
    </div>`;
  }
  function listToggle() {
    return `<div class="mode-toggle">
      <button class="mode-btn${!state.listMode ? ' active' : ''}" data-list="0">卡片</button>
      <button class="mode-btn${state.listMode ? ' active' : ''}" data-list="1">列表</button>
    </div>`;
  }
  function textToggle() {
    return `<div class="mode-toggle">
      <button class="mode-btn${state.textMode === 'line' ? ' active' : ''}" data-tm="line">逐句</button>
      <button class="mode-btn${state.textMode === 'full' ? ' active' : ''}" data-tm="full">全文</button>
    </div>`;
  }
  function bindNav() {
    const prev = els.stage.querySelector('#navPrev');
    const next = els.stage.querySelector('#navNext');
    if (prev) prev.addEventListener('click', prevCard);
    if (next) next.addEventListener('click', nextCard);
  }

  /* ---------- 单词 ---------- */
  function renderWords() {
    const words = currentLesson.words;
    const head = stageHead('📖 单词', `${words.length} 个`, listToggle());

    if (state.listMode) {
      els.stage.innerHTML = cardShell(`
        ${head}
        <div class="word-grid">
          ${words.map((w) => `
            <div class="word-chip">
              <span class="chip-en">${escapeHtml(w.en)}${w.pos ? ` <span class="pos">${escapeHtml(w.pos)}</span>` : ''}</span>
              ${w.ipa ? `<span class="chip-ipa">${escapeHtml(w.ipa)}</span>` : ''}
              <span class="chip-zh">${escapeHtml(w.zh)}</span>
            </div>`).join('')}
        </div>`, { wide: true });
      bindListToggle();
      return;
    }

    const w = words[state.idx];
    els.stage.innerHTML = cardShell(`
      ${head}
      <div class="flashcard" id="flashcard">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-front">
            <span class="word">${escapeHtml(w.en)}</span>
            ${w.ipa ? `<span class="ipa">${escapeHtml(w.ipa)}</span>` : ''}
            ${w.pos ? `<span class="pos">${escapeHtml(w.pos)}</span>` : ''}
          </div>
          <div class="flashcard-face flashcard-back">
            <span class="meaning">${escapeHtml(w.zh)}</span>
          </div>
        </div>
      </div>
      <p class="card-hint" style="text-align:center;">点击卡片翻面 · ${state.idx + 1} / ${words.length}</p>`, {
        prev: state.idx > 0,
        next: state.idx < words.length - 1,
      });
    els.stage.querySelector('#flashcard').addEventListener('click', function () {
      this.classList.toggle('flipped');
    });
    bindNav();
    bindListToggle();
  }

  /* ---------- 课文 ---------- */
  function renderText() {
    if (state.textMode === 'full') renderTextFull();
    else renderTextLine();
  }

  function renderTextLine() {
    const sentences = currentLesson.text;
    const s = sentences[state.idx];
    const head = stageHead('📝 课文', `${state.idx + 1} / ${sentences.length}`, textToggle());

    els.stage.innerHTML = cardShell(`
      ${head}
      <div class="sentence-card" id="sentenceCard">
        <div class="sentence-en">${escapeHtml(s.en)}</div>
        <div class="sentence-zh">${escapeHtml(s.zh)}</div>
      </div>
      <p class="card-hint" style="text-align:center;">点击卡片显示译文 · ${state.idx + 1} / ${sentences.length}</p>`, {
        wide: true,
        prev: state.idx > 0,
        next: state.idx < sentences.length - 1,
      });

    els.stage.querySelector('#sentenceCard').addEventListener('click', function () {
      this.classList.toggle('revealed');
    });
    bindNav();
    bindTextToggle();
  }

  function renderTextFull() {
    const sentences = currentLesson.text;
    const head = stageHead('📝 课文', `${sentences.length} 句`, textToggle());

    els.stage.innerHTML = cardShell(`
      ${head}
      <div class="full-tools">
        <div class="audio-box">
          <span class="audio-label">🔊 整课音频</span>
          <audio controls id="fullAudio" src="${currentLesson.audio}"></audio>
        </div>
        <button class="btn btn-ghost btn-sm${state.loop ? ' active' : ''}" id="btnLoop">${LOOP_SVG} 循环</button>
        <button class="btn btn-ghost btn-sm" id="btnZh">${state.showZh ? '隐藏译文' : '显示译文'}</button>
      </div>
      <div class="full-text${state.showZh ? '' : ' hide-zh'}" id="fullText">
        ${sentences.map((s, i) => `
          <div class="sentence-line" data-i="${i}">
            <span class="e">${escapeHtml(s.en)}</span>
            <span class="z">${escapeHtml(s.zh)}</span>
          </div>`).join('')}
      </div>`, { wide: true });

    const audio = els.stage.querySelector('#fullAudio');
    if (audio) {
      audio.loop = state.loop;
      audio.addEventListener('timeupdate', () => syncFullHighlight(audio));
    }
    const loopBtn = els.stage.querySelector('#btnLoop');
    if (loopBtn) loopBtn.addEventListener('click', () => {
      state.loop = !state.loop;
      if (audio) audio.loop = state.loop;
      loopBtn.classList.toggle('active', state.loop);
    });
    els.stage.querySelector('#btnZh').addEventListener('click', () => {
      state.showZh = !state.showZh;
      renderStage();
    });
    bindTextToggle();
  }

  function syncFullHighlight(audio) {
    if (!lyricsReady) return;
    const intro = currentLesson.introLines || 0;
    const idx = lyricIndexAtTime(audio.currentTime) - intro;
    let changed = false;
    els.stage.querySelectorAll('.sentence-line').forEach((line) => {
      const i = parseInt(line.dataset.i, 10);
      const active = i === idx;
      if (line.classList.contains('active') !== active) {
        changed = true;
        line.classList.toggle('active', active);
      }
    });
    if (changed) {
      const active = els.stage.querySelector('.sentence-line.active');
      if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /* ---------- 表达 ---------- */
  function renderExpressions() {
    const exps = currentLesson.expressions;
    const head = stageHead('💡 表达', `${exps.length} 条`, listToggle());

    if (state.listMode) {
      els.stage.innerHTML = cardShell(`
        ${head}
        <div class="expr-list">
          ${exps.map((e) => `
            <div class="expr-row">
              <div class="expr-row-en">${escapeHtml(e.en)}</div>
              <div class="expr-row-zh">${escapeHtml(e.zh)}</div>
              ${e.examples ? e.examples.map((ex) => `<div class="expr-row-ex">${escapeHtml(ex)}</div>`).join('') : ''}
            </div>`).join('')}
        </div>`, { wide: true });
      bindListToggle();
      return;
    }

    const e = exps[state.idx];
    const examplesHtml = (e.examples && e.examples.length)
      ? e.examples.map((ex) => `<div class="expr-example"><span class="eg-label">例</span>${escapeHtml(ex)}</div>`).join('')
      : '';
    els.stage.innerHTML = cardShell(`
      ${head}
      <div class="expr-card" id="exprCard">
        <div class="expr-en">${escapeHtml(e.en)}</div>
        <div class="expr-zh">${escapeHtml(e.zh)}</div>
        ${examplesHtml}
      </div>
      <p class="card-hint" style="text-align:center;">点击卡片查看释义 · ${state.idx + 1} / ${exps.length}</p>`, {
        prev: state.idx > 0,
        next: state.idx < exps.length - 1,
      });
    els.stage.querySelector('#exprCard').addEventListener('click', function () {
      this.classList.toggle('revealed');
    });
    bindNav();
    bindListToggle();
  }

  /* ---------- 完成视图 ---------- */
  function renderDone() {
    els.stage.innerHTML = cardShell(`
      <div class="done-view">
        <span class="done-emoji">🎉</span>
        <h2>本课学完啦！</h2>
        <p>${currentLesson.n}. ${currentLesson.title} · ${currentLesson.titleZh}</p>
        <div class="done-actions">
          <button class="btn btn-primary" id="btnRestart">🔄 重新学习</button>
          <button class="btn btn-ghost" id="btnShelf">📚 返回首页</button>
        </div>
      </div>`);
    els.stage.querySelector('#btnRestart').addEventListener('click', () => {
      state.stage = 'words'; state.idx = 0; renderStepper(); renderStage(); savePos();
    });
    els.stage.querySelector('#btnShelf').addEventListener('click', backToShelf);
  }

  /* ============================================================
     切换绑定
     ============================================================ */
  function bindListToggle() {
    els.stage.querySelectorAll('.mode-btn[data-list]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.listMode = btn.dataset.list === '1';
        state.idx = 0;
        renderStage();
        savePos();
      });
    });
  }
  function bindTextToggle() {
    els.stage.querySelectorAll('.mode-btn[data-tm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.textMode = btn.dataset.tm;
        state.idx = 0;
        renderStage();
        savePos();
      });
    });
  }

  /* ============================================================
     init
     ============================================================ */
  function init() {
    initTheme();

    els.shelfBackBtn.addEventListener('click', backToShelf);
    els.continueBtn.addEventListener('click', () => {
      const pos = loadPos();
      if (pos) enterBook(pos.level, pos);
    });

    // 回车进入下一关（单词 / 逐句课文 / 表达卡片阶段）
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (state.view !== 'learn' || !currentLesson) return;
      if (state.stage === 'done' || state.listMode || state.pickerOpen) return;
      if (state.stage === 'text' && state.textMode === 'full') return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      nextCard();
    });

    renderShelf();
    if (loadPos()) els.continueBtn.style.display = '';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
