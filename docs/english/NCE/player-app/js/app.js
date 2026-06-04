/**
 * NCE Learning App — Main Application Logic
 * Manages lesson list, UI interactions, and player integration.
 */

(function () {
  'use strict';

  // --- State ---
  const state = {
    currentLevel: 'NCE1',
    currentLesson: null,
    lessonsByLevel: {},
    player: new NCEPlayer(),
    searchQuery: '',
    autoPlay: false,
  };

  // --- DOM Refs ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    levelTabs: $('#levelTabs'),
    lessonList: $('#lessonList'),
    lessonSearch: $('#lessonSearch'),
    lessonCount: $('#lessonCount'),
    lyricArea: $('#lyricArea'),
    btnPlay: $('#btnPlay'),
    btnPrev: $('#btnPrev'),
    btnNext: $('#btnNext'),
    btnPrevLesson: $('#btnPrevLesson'),
    btnNextLesson: $('#btnNextLesson'),
    progressBar: $('#progressBar'),
    progressFill: $('#progressFill'),
    timeCurrent: $('#timeCurrent'),
    timeDuration: $('#timeDuration'),
    modeBtns: $$('.mode-btn'),
    speedSelect: $('#speedSelect'),
    emptyState: $('#emptyState'),
    lyricContent: $('#lyricContent'),
    lyricLines: $('#lyricLines'),
    lessonInfo: $('#lessonInfo'),
    lessonTitle: $('#lessonTitle'),
    lessonMeta: $('#lessonMeta'),
  };

  // --- Initialize ---
  function init() {
    if (typeof window.NCE_LESSONS === 'undefined') {
      console.error('NCE_LESSONS not found. Run generate_manifest.py first.');
      return;
    }

    // Group lessons by level
    for (const lesson of window.NCE_LESSONS) {
      if (!state.lessonsByLevel[lesson.level]) {
        state.lessonsByLevel[lesson.level] = [];
      }
      state.lessonsByLevel[lesson.level].push(lesson);
    }

    renderLevelTabs();
    renderLessonList();
    bindEvents();
    bindPlayerEvents();
    bindKeyboard();

    // Auto-select first lesson if any
    const firstLevelLessons = state.lessonsByLevel[state.currentLevel];
    if (firstLevelLessons && firstLevelLessons.length > 0) {
      selectLesson(firstLevelLessons[0]);
    }
  }

  // --- Render Level Tabs ---
  function renderLevelTabs() {
    const levels = Object.keys(state.lessonsByLevel).sort();
    dom.levelTabs.innerHTML = levels
      .map((level) => {
        const count = state.lessonsByLevel[level].length;
        const levelName = level.replace('NCE', '第') + '册';
        const active = level === state.currentLevel ? ' active' : '';
        return `
          <button class="level-tab${active}" data-level="${level}">
            ${levelName}
            <span class="count">${count} 课</span>
          </button>
        `;
      })
      .join('');
  }

  // --- Render Lesson List ---
  function renderLessonList() {
    const lessons = state.lessonsByLevel[state.currentLevel] || [];
    const query = state.searchQuery.toLowerCase().trim();

    const filtered = query
      ? lessons.filter(
          (l) =>
            l.title.toLowerCase().includes(query) ||
            l.fileName.toLowerCase().includes(query) ||
            String(l.sortKey).includes(query)
        )
      : lessons;

    dom.lessonCount.textContent = `${filtered.length} 课`;

    dom.lessonList.innerHTML = filtered
      .map((lesson) => {
        const active =
          state.currentLesson && state.currentLesson.id === lesson.id
            ? ' active'
            : '';
        return `
          <div class="lesson-item${active}" data-id="${lesson.id}">
            <span class="lesson-num">#${lesson.sortKey}</span>
            <span class="lesson-title">${escapeHTML(lesson.title)}</span>
          </div>
        `;
      })
      .join('');
  }

  // --- Select & Load Lesson ---
  function selectLesson(lesson) {
    state.currentLesson = lesson;
    state.player.pause();
    renderLessonList(); // update active state in sidebar

    // Show lesson info
    dom.emptyState.style.display = 'none';
    dom.lyricContent.style.display = 'block';
    dom.lessonInfo.style.display = '';
    dom.lessonTitle.textContent = lesson.title;
    dom.lessonMeta.textContent = `${lesson.level.replace('NCE', '第')}册 · Lesson ${lesson.sortKey}`;

    // Show loading state
    dom.lyricLines.innerHTML =
      '<div class="empty-state"><p>加载中...</p></div>';

    // Load into player
    state.player.load(lesson.audioPath, lesson.lrcPath);
  }

  // --- Render Lyrics ---
  function renderLyrics(lyrics) {
    if (!lyrics || lyrics.length === 0) {
      dom.lyricLines.innerHTML =
        '<div class="empty-state"><p>暂无歌词数据</p></div>';
      return;
    }

    dom.lyricLines.innerHTML = lyrics
      .map((line, i) => {
        return `
          <div class="lyric-line" data-index="${i}">
            <span class="line-num">${i + 1}</span>
            <span class="line-text">${escapeHTML(line.text)}</span>
          </div>
        `;
      })
      .join('');
  }

  // --- Update Lyric Highlight ---
  function updateLyricHighlight(index) {
    const lines = dom.lyricLines.querySelectorAll('.lyric-line');
    lines.forEach((el, i) => {
      el.classList.remove('past', 'current');
      if (i < index) el.classList.add('past');
      if (i === index) {
        el.classList.add('current');
        // Auto-scroll to current line
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }

  function clearLyricHighlight() {
    const lines = dom.lyricLines.querySelectorAll('.lyric-line');
    lines.forEach((el) => {
      el.classList.remove('past', 'current');
    });
  }

  // --- Update Progress Bar ---
  function updateProgress(currentTime, duration) {
    if (!duration || duration <= 0) {
      dom.progressFill.style.width = '0%';
      dom.timeCurrent.textContent = '0:00';
      dom.timeDuration.textContent = '0:00';
      return;
    }
    const pct = Math.min((currentTime / duration) * 100, 100);
    dom.progressFill.style.width = pct + '%';
    dom.timeCurrent.textContent = formatTime(currentTime);
    dom.timeDuration.textContent = formatTime(duration);
  }

  // --- Update Play Button ---
  function updatePlayButton(isPlaying) {
    dom.btnPlay.textContent = isPlaying ? '⏸' : '▶';
  }

  // --- Update Mode Buttons ---
  function updateModeButtons(mode) {
    dom.modeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  // --- Bind Player Events ---
  function bindPlayerEvents() {
    state.player.onUpdate((event, data) => {
      switch (event) {
        case 'loaded':
          renderLyrics(state.player.lyrics);
          updateProgress(0, state.player.getDuration());
          // Auto-play on double-click
          if (state.autoPlay) {
            state.autoPlay = false;
            state.player.play();
          }
          break;

        case 'timeUpdate':
          updateProgress(data.currentTime, data.duration);
          break;

        case 'lyricChange':
          updateLyricHighlight(data.index);
          break;

        case 'playState':
          updatePlayButton(data.isPlaying);
          break;

        case 'modeChange':
          updateModeButtons(data.mode);
          break;

        case 'ended':
          updatePlayButton(false);
          clearLyricHighlight();
          break;

        case 'seek':
          updateLyricHighlight(data.index);
          break;
      }
    });
  }

  // --- Bind UI Events ---
  function bindEvents() {
    // Level tabs
    dom.levelTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.level-tab');
      if (!tab) return;
      state.currentLevel = tab.dataset.level;
      state.searchQuery = '';
      dom.lessonSearch.value = '';
      renderLevelTabs();
      renderLessonList();

      // Auto-select first lesson
      const lessons = state.lessonsByLevel[state.currentLevel];
      if (lessons && lessons.length > 0) {
        selectLesson(lessons[0]);
      }
    });

    // Lesson list — single click: select
    dom.lessonList.addEventListener('click', (e) => {
      const item = e.target.closest('.lesson-item');
      if (!item) return;
      const id = parseInt(item.dataset.id, 10);
      const lesson = window.NCE_LESSONS.find((l) => l.id === id);
      if (lesson) {
        selectLesson(lesson);
      }
    });

    // Lesson list — double click: select + auto-play
    dom.lessonList.addEventListener('dblclick', (e) => {
      const item = e.target.closest('.lesson-item');
      if (!item) return;
      const id = parseInt(item.dataset.id, 10);
      const lesson = window.NCE_LESSONS.find((l) => l.id === id);
      if (lesson) {
        state.autoPlay = true;
        selectLesson(lesson);
      }
    });

    // Search
    dom.lessonSearch.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderLessonList();
    });

    // Play/Pause button
    dom.btnPlay.addEventListener('click', () => {
      if (!state.currentLesson) return;
      state.player.toggle();
    });

    // Prev/Next sentence buttons
    dom.btnPrev.addEventListener('click', () => {
      state.player.prevSentence();
    });

    dom.btnNext.addEventListener('click', () => {
      state.player.nextSentence();
    });

    // Progress bar click
    dom.progressBar.addEventListener('click', (e) => {
      const duration = state.player.getDuration();
      if (!duration) return;
      const rect = dom.progressBar.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const time = pct * duration;
      state.player.seekToTime(time);
    });

    // Lyric line click → seek
    dom.lyricLines.addEventListener('click', (e) => {
      const line = e.target.closest('.lyric-line');
      if (!line) return;
      const index = parseInt(line.dataset.index, 10);
      state.player.seekTo(index);
      if (!state.player.isPlaying) {
        state.player.play();
      }
    });

    // Prev/Next lesson buttons
    dom.btnPrevLesson.addEventListener('click', () => {
      navigateLesson(-1);
    });

    dom.btnNextLesson.addEventListener('click', () => {
      navigateLesson(1);
    });

    // Mode buttons
    dom.modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        state.player.setMode(mode);
      });
    });

    // Playback speed
    dom.speedSelect.addEventListener('change', () => {
      const speed = parseFloat(dom.speedSelect.value);
      state.player.audio.playbackRate = speed;
    });
  }

  // --- Keyboard Shortcuts ---
  function bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger when typing in input
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT'
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          state.player.toggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          state.player.prevSentence();
          break;
        case 'ArrowRight':
          e.preventDefault();
          state.player.nextSentence();
          break;
        case 'ArrowUp':
          e.preventDefault();
          // Select previous lesson
          navigateLesson(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          // Select next lesson
          navigateLesson(1);
          break;
      }
    });
  }

  // --- Navigate between lessons ---
  function navigateLesson(direction) {
    const lessons = state.lessonsByLevel[state.currentLevel] || [];
    if (!state.currentLesson || lessons.length === 0) return;

    const currentIdx = lessons.findIndex(
      (l) => l.id === state.currentLesson.id
    );
    if (currentIdx === -1) return;

    const newIdx = currentIdx + direction;
    if (newIdx >= 0 && newIdx < lessons.length) {
      selectLesson(lessons[newIdx]);
      // Scroll lesson into view in sidebar
      const item = dom.lessonList.querySelector(
        `.lesson-item[data-id="${lessons[newIdx].id}"]`
      );
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }

  // --- Utilities ---
  function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Boot ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
