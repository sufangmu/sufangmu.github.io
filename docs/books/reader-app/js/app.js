/**
 * 个人图书馆 — 支持 EPUB / PDF / MOBI
 * 核心模块：state, dom, 加载, 渲染, 事件
 */
(function () {
  'use strict';

  var R = window.ReaderApp = window.ReaderApp || {};

  var state = {
    currentBook: null,
    currentFormat: null,
    epubBook: null,
    epubRendition: null,
    pdfDoc: null,
    pdfPage: 1,
    pdfTotal: 0,
    toc: [],
    zoom: 1.0,
    _restoring: false,  // 恢复阅读位置中，跳过保存，防止覆盖
    scrollAccum: 0,
    pdfChanging: false,
    pdfRendered: [],  // 已渲染的页码列表
    _loadId: 0,       // 加载序号，用于避免竞态（快速切换书籍）
    _xhr: null,       // 当前下载中的 XHR（仅允许一个活跃下载）
    _fileCache: {},   // 已下载完成的文件缓存 { path: buffer }
    _lastTocHref: null, // EPUB 用户最近一次点击的目录项 href
    markerMode: false, // 画笔标记模式开关
    pdfStrokes: {},    // 画笔笔迹 { pageNum: [{points:[{x,y},...], color, size}] }
    currentStroke: null, // 当前正在绘制的笔迹
    penSize: 10,
    penColor: 'rgba(255,235,59,0.45)',
    theme: 'light',          // 'light'|'dark'|'sepia'|'parchment'
    fontSize: 16,            // EPUB 字体大小 px
    annotations: {},          // 标记数据缓存 { bookId: {strokes:{}, epubHighlights:[]} }
    pendingAnnotation: null,  // 等待笔记输入的标记
    navHistory: [],           // [{page, cfi, bookId, title}]
    bookmarks: {},            // { bookId: [{id, page, cfi, title, createdAt}] }
    dualPageMode: false,     // PDF 双页模式
    annotationsSidebarOpen: false,
    thumbnailsOpen: false,
  };

  var $ = function (s) { return document.querySelector(s); };

  var dom = {
    treeMenu: $('#treeMenu'),
    emptyState: $('#emptyState'),
    loadingState: $('#loadingState'),
    loadingText: $('#loadingText'),
    loadingFill: $('#loadingFill'),
    loadingPct: $('#loadingPct'),
    readerContent: $('#readerContent'),
    epubView: $('#epubView'),
    pdfView: $('#pdfView'),
    textView: $('#textView'),
    bottomBar: $('#bottomBar'),
    bookTitle: $('#bookTitle'),
    bookMeta: $('#bookMeta'),
    formatBadge: $('#formatBadge'),
    btnPrev: $('#btnPrev'),
    btnNext: $('#btnNext'),
    btnToc: $('#btnToc'),
    btnMarker: $('#btnMarker'),
    penTools: $('#penTools'),
    penSize: $('#penSize'),
    penSizeVal: $('#penSizeVal'),
    btnUndoStroke: $('#btnUndoStroke'),
    btnClearStrokes: $('#btnClearStrokes'),
    btnZoomIn: $('#btnZoomIn'),
    btnZoomOut: $('#btnZoomOut'),
    progressText: $('#progressText'),
    progressSlider: $('#progressSlider'),
    pageInfo: $('#pageInfo'),
    tocSidebar: $('#tocSidebar'),
    tocTree: $('#tocTree'),
    sidebarToggle: $('#sidebarToggle'),
    zoomLabel: $('#zoomLabel'),
    bookCount: $('#bookCount'),
  };

  // 暴露给其他模块
  R.state = state;
  R.dom = dom;

  // ====== 初始化 ======
  function init() {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    renderTree();
    bindEvents();
    bindKeyboard();
    // 初始状态：未打开书籍，目录侧栏收起
    dom.tocSidebar.classList.add('collapsed');
    // 初始状态：不加载任何书，显示空状态说明
    showWelcome();
  }

  function showWelcome() {
    dom.emptyState.style.display = '';
    dom.loadingState.classList.remove('show');
    dom.readerContent.style.display = 'none';
    dom.bottomBar.style.display = 'none';
    dom.emptyState.innerHTML =
      '<span class="empty-icon">📚</span>' +
      '<p style="font-size:18px;font-weight:500;margin-top:8px;">欢迎来到个人图书馆</p>' +
      '<div style="max-width:400px;text-align:left;margin-top:12px;line-height:1.8;color:var(--text-secondary);font-size:14px;">' +
      '<p>📖 从左侧 <strong>分类菜单</strong> 选择一本书开始阅读</p>' +
      '<p>🖱️ 滚轮翻页 · ← → 键翻页 · Ctrl+滚轮缩放</p>' +
      '</div>';
  }

  function getAllBooks() { return window.EBOOK_CATALOG || []; }

  function getCategories() {
    var map = {};
    getAllBooks().forEach(function (b) {
      if (b.category) map[b.category] = (map[b.category] || 0) + 1;
    });
    return Object.keys(map).map(function (k) {
      return { id: k, label: categoryLabel(k), count: map[k] };
    }).sort(function (a, b) { return b.count - a.count; });
  }

  function categoryLabel(id) {
    var labels = { 'leo_nce_notes': 'leo新概念英语笔记', 'novel': '小说', 'original_english_textbook': '英文原版书', 'go': '围棋', 'local_import': '本地导入'};
    return labels[id] || id;
  }

  function getFormatIcon(fmt) {
    if (fmt === 'pdf') return '📕';
    if (fmt === 'mobi' || fmt === 'azw3') return '📘';
    return '📗';
  }

  // ====== 树形菜单 ======
  function renderTree() {
    var cats = getCategories();
    var all = getAllBooks();
    dom.bookCount.textContent = all.length;
    var html = '';

    cats.forEach(function (cat) {
      var books = all.filter(function (b) { return b.category === cat.id; });
      var expanded = ' collapsed';
      if (state.currentBook && books.some(function (b) { return b.id === state.currentBook.id; })) {
        expanded = '';
      }

      html += '<div class="tree-cat' + expanded + '" data-cat="' + cat.id + '">';
      html += '<div class="tree-cat-header"><span class="tree-cat-arrow">▼</span><span class="tree-cat-name">' + cat.label + '</span><span class="tree-cat-count">' + cat.count + '</span></div>';
      html += '<div class="tree-items"><div class="tree-items-inner">';

      books.forEach(function (book) {
        var active = state.currentBook && state.currentBook.id === book.id ? ' active' : '';
        html += '<div class="tree-item' + active + '" data-id="' + book.id + '">';
        html += '<span class="tree-item-icon">' + getFormatIcon(book.format) + '</span>';
        html += '<span class="tree-item-title">' + escapeHtml(book.title) + '</span>';
        html += '<span class="tree-item-format">' + book.format.toUpperCase() + '</span>';
        html += '</div>';
      });

      html += '</div></div></div>';
    });
    dom.treeMenu.innerHTML = html;

    dom.treeMenu.querySelectorAll('.tree-cat-header').forEach(function (hdr) {
      hdr.addEventListener('click', function () {
        this.closest('.tree-cat').classList.toggle('collapsed');
      });
    });
    dom.treeMenu.querySelectorAll('.tree-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var id = this.dataset.id;
        var book = getAllBooks().filter(function (b) { return b.id === id; })[0];
        if (book) loadBook(book);
      });
    });
  }

  function updateTreeSelection() {
    dom.treeMenu.querySelectorAll('.tree-item').forEach(function (item) {
      item.classList.toggle('active', item.dataset.id === state.currentBook.id);
    });
    dom.treeMenu.querySelectorAll('.tree-cat').forEach(function (cat) {
      if (cat.querySelector('.tree-item.active')) cat.classList.remove('collapsed');
    });
  }

  // ====== 加载入口 ======
  function loadBook(book) {
    if (!book) return;

    // 中断当前下载中的 XHR（只保留一个活跃下载，避免域名连接排队）
    abortDownload();

    // 递增加载序号，用于检测过期操作
    state._loadId += 1;
    var loadId = state._loadId;

    state.currentBook = book;
    state.currentFormat = book.format;
    state.toc = [];
    cleanupReader();
    updateTreeSelection();

    // 加载标记
    if (R.loadAnnotations) R.loadAnnotations(book.id);
    if (R.renderAnnotationsList) R.renderAnnotationsList();
    // 加载书签
    if (R.loadBookmarks) R.loadBookmarks();
    if (R.updateBookmarkButton) R.updateBookmarkButton();

    dom.bookTitle.textContent = book.title;
    dom.bookMeta.textContent = (book.author ? book.author + ' · ' : '') + book.format.toUpperCase();
    dom.formatBadge.textContent = book.format.toUpperCase();

    var path = book.path;
    if (!path) { showEmpty(); return; }

    // 本地导入书籍：从 IndexedDB 加载
    if (path.indexOf('__local__:') === 0) {
      var localId = path.split(':')[1];
      if (R._getLocalFile) {
        R._getLocalFile(localId).then(function (buffer) {
          if (isLoadStale(loadId)) return;
          if (!buffer) { showError('本地文件数据丢失，请重新导入'); return; }
          if (book.format === 'epub') loadEpubFromBuffer(buffer, loadId);
          else if (book.format === 'pdf') loadPdfFromBuffer(buffer, loadId);
          else if (book.format === 'mobi' || book.format === 'azw3') loadMobi(book, loadId);
        }).catch(function () {
          if (isLoadStale(loadId)) return;
          showError('读取本地文件失败');
        });
        return;
      }
    }

    if (book.format === 'epub') loadEpub(path, loadId);
    else if (book.format === 'pdf') loadPdf(path, loadId);
    else if (book.format === 'mobi' || book.format === 'azw3') loadMobi(book, loadId);
    else showEmpty();
  }

  function isLoadStale(loadId) {
    return loadId !== state._loadId;
  }

  // ====== 阅读位置保存/恢复 ======
  function saveReadingPosition(bookId, position) {
    if (!bookId) return;
    try {
      var positions = JSON.parse(localStorage.getItem('reader-positions') || '{}');
      positions[bookId] = position;
      localStorage.setItem('reader-positions', JSON.stringify(positions));
    } catch (e) {}
  }

  function getReadingPosition(bookId) {
    if (!bookId) return null;
    try {
      var positions = JSON.parse(localStorage.getItem('reader-positions') || '{}');
      return positions[bookId] || null;
    } catch (e) { return null; }
  }

  // 从 ArrayBuffer 加载 EPUB（跳过 XHR）
  function loadEpubFromBuffer(buffer, loadId) {
    if (typeof ePub === 'undefined') { showError('epub.js 库未加载'); return; }
    showProgress('正在加载 EPUB …');
    setProgress(30);

    dom.readerContent.style.display = '';
    dom.bottomBar.style.display = '';
    dom.epubView.style.display = '';
    dom.epubView.innerHTML = '';

    var book = ePub(buffer);
    state.epubBook = book;
    book.ready.then(function () {
      return book;
    }).then(function (book) {
      if (isLoadStale(loadId)) { destroyEpubBook(); return; }
      setProgressMsg(70, '正在生成目录 …');
      book.loaded.navigation.then(function (nav) {
        state.toc = normalizeEpubToc(nav.toc || []);
        renderToc(state.toc);
      }).catch(function () {});

      setProgressMsg(80, '正在渲染 …');
      var rendition = book.renderTo('epubView', {
        width: '100%', height: '100%', spread: 'none', flow: 'paginated', allowScriptedContent: false,
      });
      state.epubRendition = rendition;

      rendition.on('rendered', function () {
        if (isLoadStale(loadId)) return;
        setTimeout(function () {
          installEpubWheelHandler();
          if (R.initEpubHighlight) R.initEpubHighlight();
          if (R.registerEpubThemes) R.registerEpubThemes();
          if (R.renderEpubHighlights) R.renderEpubHighlights();
        }, 200);
      });

      rendition.on('relocated', function () {
        if (isLoadStale(loadId)) return;
        updateEpubProgress();
      });

      rendition.display().then(function () {
        if (isLoadStale(loadId)) { destroyEpubBook(); return; }
        setProgressMsg(100, '加载完成');
        book.locations.generate(800).then(function () {
          dom.progressSlider.max = '100';
        }).catch(function () { dom.progressSlider.max = '100'; });
        showReader();
        state._restoring = true;
        updateEpubProgress();
        state._restoring = false;
      }).catch(function (err) {
        if (isLoadStale(loadId)) { destroyEpubBook(); return; }
        showError('EPUB 渲染失败: ' + (err.message || err));
      });
    }).catch(function (err) {
      if (isLoadStale(loadId)) return;
      showError('EPUB 加载失败: ' + (err.message || err));
    });
  }

  // 从 ArrayBuffer 加载 PDF（跳过 XHR）
  function loadPdfFromBuffer(buffer, loadId) {
    if (typeof pdfjsLib === 'undefined') { showError('PDF.js 库未加载'); return; }
    showProgress('正在解析 PDF …');
    setProgress(60);

    pdfjsLib.getDocument(buffer).promise.then(function (pdfDoc) {
      if (isLoadStale(loadId)) { pdfDoc.destroy(); return; }
      state.pdfDoc = pdfDoc;
      state.pdfPage = 1;
      state.pdfTotal = pdfDoc.numPages;

      pdfDoc.getOutline().then(function (outline) {
        if (isLoadStale(loadId)) return;
        return parsePdfOutline(outline, pdfDoc);
      }).then(function (toc) {
        if (isLoadStale(loadId)) return;
        state.toc = toc || [];
        renderToc(state.toc);
      }).catch(function () { state.toc = []; renderToc([]); });

      setProgressMsg(90, '正在渲染 …');
      dom.progressSlider.max = String(pdfDoc.numPages);
      dom.epubView.style.display = 'none';
      dom.textView.style.display = 'none';
      dom.pdfView.style.display = '';
      dom.pdfView.innerHTML = '';
      state.pdfRendered = [];

      var savedPos = getReadingPosition(state.currentBook ? state.currentBook.id : null);
      state._restoring = !!savedPos;

      renderPdfPage(1).then(function () {
        if (isLoadStale(loadId)) return;
        setProgressMsg(100, '加载完成');
        setTimeout(function () {
          installPdfScrollDetect();
          installPdfWheelFallback();
          showReader();
          updatePdfProgress();
          if (savedPos && savedPos.page > 1) {
            jumpToPdfPage(savedPos.page).then(function () {
              state._restoring = false;
              updatePdfProgress();
            });
          } else {
            state._restoring = false;
          }
        }, 200);
      });
    }).catch(function (err) {
      if (isLoadStale(loadId)) return;
      showError('PDF 加载失败: ' + (err.message || err));
    });
  }

  function abortDownload() {
    if (state._xhr) {
      try { state._xhr.abort(); } catch (e) {}
      state._xhr = null;
    }
  }

  // ==========================================================================
  //  进度条
  // ==========================================================================
  function showProgress(msg) {
    dom.emptyState.style.display = 'none';
    dom.loadingState.classList.add('show');
    dom.readerContent.style.display = 'none';
    dom.bottomBar.style.display = 'none';
    dom.loadingText.textContent = msg || '加载中…';
    dom.loadingFill.style.width = '1%';
    dom.loadingPct.textContent = '1%';
  }

  function setProgress(pct) {
    if (!dom.loadingFill) return;
    var p = Math.min(Math.max(pct, 0), 100);
    dom.loadingFill.style.width = p + '%';
    dom.loadingPct.textContent = Math.round(p) + '%';
  }

  function setProgressMsg(pct, msg) {
    if (msg) dom.loadingText.textContent = msg;
    setProgress(pct);
  }

  function hideProgress() { dom.loadingState.classList.remove('show'); }

  function showReader() {
    dom.emptyState.style.display = 'none';
    hideProgress();
    dom.readerContent.style.display = '';
    dom.bottomBar.style.display = '';
    updateMarkerButton();
    updateFormatButtons();
  }

  // PDF 画笔 / EPUB 文本高亮 模式
  function updateMarkerButton() {
    var isPdf = state.currentFormat === 'pdf';
    var isEpub = state.currentFormat === 'epub';
    var isMobi = state.currentFormat === 'mobi' || state.currentFormat === 'azw3';
    var canMark = isPdf || isEpub || isMobi;
    dom.btnMarker.disabled = !canMark;
    dom.btnMarker.title = isPdf ? '画笔标记（按住 Shift 画直线）' : '文本高亮 — 选中文字即可标记';
    var label = dom.btnMarker.querySelector('.marker-label');
    if (label) label.textContent = '🖊';
    // 非支持格式时退出标记模式
    if (!isPdf && !isEpub && state.markerMode) {
      state.markerMode = false;
      state._markerReady = false;
      dom.btnMarker.classList.remove('active', 'has-config');
      document.querySelector('.reader-panel').classList.remove('pen-active', 'highlight-mode');
      if (dom.penTools) dom.penTools.style.display = 'none';
      updateMarkerButtonAppearance();
    }
    // EPUB 模式下调整画笔工具栏显示
    if (dom.penTools) updatePenToolsForFormat();
  }

  // 更新标记按钮外观（显示颜色点 + 大小）
  function updateMarkerButtonAppearance() {
    var label = dom.btnMarker.querySelector('.marker-label');
    var dot = dom.btnMarker.querySelector('.marker-dot');
    var sizeBadge = dom.btnMarker.querySelector('.marker-size');
    var isPdf = state.currentFormat === 'pdf';

    if (state.markerMode && state._markerReady) {
      // 绘制模式：显示颜色点 + 大小
      if (label) label.textContent = '🖊';
      if (dot) {
        dot.style.display = 'inline-block';
        dot.style.background = extractColorCSS(state.penColor);
      }
      if (sizeBadge && isPdf) {
        sizeBadge.style.display = 'inline';
        sizeBadge.textContent = state.penSize;
      } else if (sizeBadge) {
        sizeBadge.style.display = 'none';
      }
    } else {
      // 配置模式或关闭模式：只显示文字
      if (label) {
        label.textContent = state.currentFormat === 'epub' ? '🖊' : '🖊';
      }
      if (dot) dot.style.display = 'none';
      if (sizeBadge) sizeBadge.style.display = 'none';
    }
  }

  function extractColorCSS(rgba) {
    var m = rgba.match(/[\d.]+/g);
    if (m && m.length >= 3) {
      return 'rgba(' + m[0] + ',' + m[1] + ',' + m[2] + ',0.8)';
    }
    return rgba;
  }

  // 根据格式调整画笔工具栏
  function updatePenToolsForFormat() {
    var isPdf = state.currentFormat === 'pdf';
    // 非 PDF 隐藏粗细滑块（在 main row 中）
    var sizeSlider = document.getElementById('penSize');
    var sizeVal = document.getElementById('penSizeVal');
    var divider = document.querySelector('.pen-dropdown-divider');
    if (sizeSlider) sizeSlider.style.display = isPdf ? '' : 'none';
    if (sizeVal) sizeVal.style.display = isPdf ? '' : 'none';
    if (divider) divider.style.display = isPdf ? '' : 'none';
    // 非 PDF 隐藏撤销/清除
    var actions = document.querySelector('.pen-dropdown-row-actions');
    if (actions) actions.style.display = isPdf ? '' : 'none';
  }

  // 根据当前格式启用/禁用相关按钮
  function updateFormatButtons() {
    var isPdf = state.currentFormat === 'pdf';
    var isEpub = state.currentFormat === 'epub';
    var isMobi = state.currentFormat === 'mobi' || state.currentFormat === 'azw3';
    var hasBook = !!state.currentBook;

    // PDF 专属：双页、缩略图
    var btnDual = document.getElementById('btnDualPage');
    var btnThumb = document.getElementById('btnThumbnails');
    if (btnDual) btnDual.style.display = isPdf ? '' : 'none';
    if (btnThumb) btnThumb.style.display = isPdf ? '' : 'none';

    // EPUB 专属：字体大小
    var btnFontUp = document.getElementById('btnFontUp');
    var btnFontDown = document.getElementById('btnFontDown');
    var fontSizeLabel = document.getElementById('fontSizeLabel');
    if (btnFontUp) btnFontUp.style.display = isEpub ? '' : 'none';
    if (btnFontDown) btnFontDown.style.display = isEpub ? '' : 'none';
    if (fontSizeLabel) fontSizeLabel.style.display = isEpub ? '' : 'none';

    // 所有格式通用
    var btnMarker = document.getElementById('btnMarker');
    if (btnMarker) { btnMarker.disabled = !isPdf && !isEpub && !isMobi; }
    var btnAnn = document.getElementById('btnAnnotations');
    if (btnAnn) btnAnn.disabled = !hasBook;
    var btnBookmark = document.getElementById('btnBookmark');
    if (btnBookmark) btnBookmark.disabled = !hasBook;

    updatePenToolsForFormat();
  }

  function showError(msg) {
    hideProgress();
    dom.readerContent.style.display = 'none';
    dom.bottomBar.style.display = 'none';
    dom.emptyState.style.display = '';
    var p = dom.emptyState.querySelector('p');
    if (p) p.textContent = msg || '加载失败';
  }

  function showEmpty() {
    hideProgress();
    dom.readerContent.style.display = 'none';
    dom.bottomBar.style.display = 'none';
    dom.emptyState.style.display = '';
    var p = dom.emptyState.querySelector('p');
    if (p) p.textContent = '从左侧选择一本书开始阅读';
  }

  // ==========================================================================
  //  EPUB 加载
  //  XHR 下载（真实进度 0-50%）→ URL 传给 epub.js（本地缓存，快）→ display
  //  进度条不卡死：下载后自动脉冲动画，直到渲染完成
  // ==========================================================================
  function loadEpub(path, loadId) {
    if (typeof ePub === 'undefined') { showError('epub.js 库未加载'); return; }

    var fromCache = !!state._fileCache[path];
    if (!fromCache) showProgress('正在下载 EPUB …');

    (fromCache ? Promise.resolve(state._fileCache[path].slice(0)) : xhrDownload(path, function (pct) {
      if (isLoadStale(loadId)) return;
      setProgress(Math.round(pct * 50));
    })).then(function (buffer) {
      if (isLoadStale(loadId)) return;
      if (!fromCache) setProgressMsg(52, '正在准备容器 …');

      // 先显示容器，等布局完成再加载
      if (!fromCache) dom.loadingState.classList.add('show');
      dom.readerContent.style.display = '';
      dom.bottomBar.style.display = '';
      dom.epubView.style.display = '';
      dom.epubView.innerHTML = '';
      dom.epubView.style.minHeight = (dom.epubView.clientHeight || 600) + 'px';

      return new Promise(function (r) { requestAnimationFrame(r); }).then(function () {
        return buffer;
      });
    }).then(function (buffer) {
      if (isLoadStale(loadId)) return;
      if (!fromCache) setProgressMsg(55, '正在加载 EPUB …');

      var book = ePub(buffer);
      state.epubBook = book;

      // 等 epub 解析完成
      return book.ready.then(function () {
        return book;
      });
    }).then(function (book) {
      if (isLoadStale(loadId)) { destroyEpubBook(); return; }
      if (!fromCache) setProgressMsg(70, '正在生成目录 …');
      book.loaded.navigation.then(function (nav) {
        state.toc = normalizeEpubToc(nav.toc || []);
        renderToc(state.toc);
      }).catch(function () {});

      if (!fromCache) setProgressMsg(75, '正在渲染 …');
      var rendition = book.renderTo('epubView', {
        width: '100%', height: '100%', spread: 'none', flow: 'paginated', allowScriptedContent: false,
      });
      state.epubRendition = rendition;

      // 进度条脉冲（渲染期间不会卡死）
      var pulseTimer = fromCache ? null : setInterval(function () {
        if (isLoadStale(loadId)) { clearInterval(pulseTimer); return; }
        var cur = parseFloat(dom.loadingFill.style.width) || 75;
        if (cur < 95) {
          dom.loadingFill.style.width = Math.min(cur + 0.5, 95) + '%';
        }
      }, 200);

      // 每次渲染后重绑滚轮 + 注入高亮 + 注册主题
      rendition.on('rendered', function () {
        if (isLoadStale(loadId)) return;
        setTimeout(function () {
          installEpubWheelHandler();
          if (R.initEpubHighlight) R.initEpubHighlight();
          if (R.registerEpubThemes) R.registerEpubThemes();
          if (R.renderEpubHighlights) R.renderEpubHighlights();
        }, 200);
      });

      // 位置变化时同步进度与高亮
      rendition.on('relocated', function () {
        if (isLoadStale(loadId)) return;
        updateEpubProgress();
      });

      rendition.display().then(function () {
        if (pulseTimer) clearInterval(pulseTimer);
        if (isLoadStale(loadId)) { destroyEpubBook(); return; }
        if (!fromCache) {
          setProgress(100);
          dom.loadingText.textContent = '加载完成';
        }
        // 生成索引
        book.locations.generate(800).then(function () {
          dom.progressSlider.max = '100';
        }).catch(function () { dom.progressSlider.max = '100'; });
        showReader();
        // 恢复阶段禁止 save（防止被初始位置覆盖）
        state._restoring = true;
        updateEpubProgress();
        var saved = getReadingPosition(state.currentBook ? state.currentBook.id : null);
        if (saved && saved.cfi) {
          rendition.display(saved.cfi).then(function () {
            updateEpubProgress();
            state._restoring = false;
          }).catch(function () { state._restoring = false; });
        } else {
          state._restoring = false;
        }
      }).catch(function (err) {
        if (pulseTimer) clearInterval(pulseTimer);
        if (isLoadStale(loadId)) { destroyEpubBook(); return; }
        showError('EPUB 渲染失败: ' + (err.message || err));
      });
    }).catch(function (err) {
      if (isLoadStale(loadId)) return;
      showError('EPUB 加载失败: ' + (err.message || err));
    });
  }

  // ==========================================================================
  //  PDF 目录解析（保持嵌套结构，便于树形展示）
  // ==========================================================================
  function parsePdfOutline(outline, pdfDoc) {
    if (!outline || outline.length === 0) return Promise.resolve([]);

    function walk(items, depth) {
      return Promise.all(items.map(function (item) {
        return getPdfOutlinePage(pdfDoc, item).then(function (page) {
          var tocItem = null;
          if (page > 0) {
            tocItem = {
              label: item.title || '未命名',
              href: '#page=' + page,
              page: page,
              depth: depth
            };
          }
          if (item.items && item.items.length > 0) {
            return walk(item.items, depth + 1).then(function (children) {
              if (tocItem) {
                tocItem.children = children;
                return [tocItem];
              }
              return children;
            });
          }
          return tocItem ? [tocItem] : [];
        });
      })).then(function (arrays) {
        return arrays.reduce(function (acc, arr) { return acc.concat(arr); }, []);
      });
    }

    return walk(outline, 0);
  }

  function getPdfOutlinePage(pdfDoc, item) {
    if (!item || !item.dest) return Promise.resolve(0);
    var dest = item.dest;
    if (typeof dest === 'string') {
      return pdfDoc.getDestination(dest).then(function (d) {
        return resolvePdfDestPage(pdfDoc, d);
      }).catch(function () { return 0; });
    }
    return resolvePdfDestPage(pdfDoc, dest);
  }

  function resolvePdfDestPage(pdfDoc, dest) {
    if (!dest) return Promise.resolve(0);
    if (Array.isArray(dest) && dest.length > 0) {
      return pdfDoc.getPageIndex(dest[0]).then(function (idx) {
        return idx + 1; // 页码从 1 开始
      }).catch(function () { return 0; });
    }
    if (typeof dest === 'string') {
      return pdfDoc.getDestination(dest).then(function (d) {
        return resolvePdfDestPage(pdfDoc, d);
      }).catch(function () { return 0; });
    }
    return Promise.resolve(0);
  }

  // ==========================================================================
  //  PDF 加载 — XHR 下载（带进度）→ ArrayBuffer → pdf.js
  // ==========================================================================
  function loadPdf(path, loadId) {
    if (typeof pdfjsLib === 'undefined') { showError('PDF.js 库未加载'); return; }

    var fromCache = !!state._fileCache[path];
    if (!fromCache) showProgress('正在下载 PDF …');

    (fromCache ? Promise.resolve(state._fileCache[path].slice(0)) : xhrDownload(path, function (pct) {
      if (isLoadStale(loadId)) return;
      setProgress(Math.round(pct * 82));
    })).then(function (buffer) {
      if (isLoadStale(loadId)) return;
      if (!fromCache) setProgressMsg(85, '正在解析 PDF …');
      return pdfjsLib.getDocument(buffer).promise;
    }).then(function (pdfDoc) {
      if (isLoadStale(loadId)) { pdfDoc.destroy(); return; }
      state.pdfDoc = pdfDoc;
      state.pdfPage = 1;
      state.pdfTotal = pdfDoc.numPages;

      // 解析 PDF 内部目录
      pdfDoc.getOutline().then(function (outline) {
        if (isLoadStale(loadId)) return;
        return parsePdfOutline(outline, pdfDoc);
      }).then(function (toc) {
        if (isLoadStale(loadId)) return;
        state.toc = toc || [];
        renderToc(state.toc);
      }).catch(function (err) {
        console.warn('[PDF] 解析目录失败:', err);
        state.toc = [];
        renderToc([]);
      });

      if (!fromCache) setProgressMsg(92, '正在渲染 …');
      dom.progressSlider.max = String(pdfDoc.numPages);
      dom.epubView.style.display = 'none';
      dom.textView.style.display = 'none';
      dom.pdfView.style.display = '';
      dom.pdfView.innerHTML = '';
      state.pdfRendered = [];

      // 先读出保存的位置，再设 _restoring，防止 renderPdfPage 内部的 updatePdfProgress 覆盖它
      var savedPos = getReadingPosition(state.currentBook ? state.currentBook.id : null);
      state._restoring = !!savedPos;  // 有保存位置时才阻止保存，避免覆盖

      renderPdfPage(1).then(function () {
        if (isLoadStale(loadId)) return;
        if (!fromCache) setProgressMsg(100, '加载完成');
        setTimeout(function () {
          installPdfScrollDetect();
          installPdfWheelFallback();
          showReader();
          updatePdfProgress();  // _restoring=true 时不会保存到 localStorage
          if (savedPos && savedPos.page > 1) {
            jumpToPdfPage(savedPos.page).then(function () {
              // 恢复完成后保存正确的位置，然后解除保护
              state._restoring = false;
              updatePdfProgress();
            });
          } else {
            state._restoring = false;
          }
        }, 200);
      });
    }).catch(function (err) {
      if (isLoadStale(loadId)) return;
      showError('PDF 加载失败: ' + (err.message || err));
    });
  }

  function renderPdfPage(num) {
    return new Promise(function (resolve, reject) {
      if (!state.pdfDoc) { resolve(); return; }
      // 已渲染过则跳过
      if (state.pdfRendered.indexOf(num) !== -1) { resolve(); return; }
      state.pdfChanging = true;

      state.pdfDoc.getPage(num).then(function (page) {
        var viewport = page.getViewport({ scale: state.zoom });
        var wrapper = document.createElement('div');
        wrapper.className = 'pdf-page-wrapper';
        wrapper.dataset.page = String(num);

        var canvas = document.createElement('canvas');
        canvas.className = 'pdf-render-canvas';
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        var hCanvas = document.createElement('canvas');
        hCanvas.className = 'pdf-highlight-canvas';
        hCanvas.width = viewport.width;
        hCanvas.height = viewport.height;

        wrapper.appendChild(canvas);
        wrapper.appendChild(hCanvas);

        return page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise.then(function () {
          var label = document.createElement('div');
          label.className = 'pdf-page-label';
          label.textContent = num + ' / ' + state.pdfTotal;
          wrapper.appendChild(label);
          dom.pdfView.appendChild(wrapper);
          state.pdfRendered.push(num);
          state.pdfRendered.sort(function (a, b) { return a - b; });
          state.pdfChanging = false;
          state.pdfPage = num;
          bindPenEvents(hCanvas, num, viewport.width, viewport.height);
          drawPageStrokes(num, hCanvas, viewport.width, viewport.height);
          updatePdfProgress();
          resolve();
        });
      }).catch(function (err) {
        console.warn('[PDF] 渲染页 ' + num + ' 失败:', err);
        state.pdfChanging = false;
        resolve();
      });
    });
  }

  // 平滑滚动到指定页码
  function smoothScrollToPage(num) {
    var wrapper = dom.pdfView.querySelector('.pdf-page-wrapper[data-page="' + num + '"]');
    if (wrapper) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // 跳转到指定页码（直接渲染目标页，不顺序渲染中间页，瞬间定位而非平滑滚动）
  function jumpToPdfPage(num) {
    if (num < 1 || num > state.pdfTotal) return Promise.resolve();
    state.pdfPage = num;
    updatePdfProgress();

    var wrapper = dom.pdfView.querySelector('.pdf-page-wrapper[data-page="' + num + '"]');
    if (wrapper) {
      wrapper.scrollIntoView({ behavior: 'instant', block: 'start' });
      return Promise.resolve();
    }

    // 未渲染，先渲染这一页再跳
    return renderPdfPage(num).then(function () {
      var w = dom.pdfView.querySelector('.pdf-page-wrapper[data-page="' + num + '"]');
      if (w) {
        w.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
  }

  // ====== 自由画笔标记 ======
  function bindPenEvents(canvas, page, width, height) {
    function toCanvasPos(e) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    canvas.addEventListener('mousedown', function (e) {
      if (!state.markerMode) return;
      e.preventDefault();
      var pos = toCanvasPos(e);
      state.currentStroke = {
        page: page,
        points: [{ x: pos.x / width, y: pos.y / height }],
        color: state.penColor,
        size: state.penSize,
        canvas: canvas,
        width: width,
        height: height
      };
    });

    canvas.addEventListener('mousemove', function (e) {
      if (!state.markerMode || !state.currentStroke || state.currentStroke.page !== page) return;
      e.preventDefault();
      var pos = toCanvasPos(e);
      state.currentStroke.points.push({ x: pos.x / width, y: pos.y / height });
      state.currentStroke.shiftKey = e.shiftKey;
      drawPageStrokes(page, canvas, width, height, state.currentStroke);
    });

    function endDraw(e) {
      if (!state.markerMode || !state.currentStroke || state.currentStroke.page !== page) return;
      var stroke = state.currentStroke;
      var hasNewStroke = false;
      if (stroke.points.length >= 2) {
        // Shift 直线模式：只保留首尾两点
        if (stroke.shiftKey && stroke.points.length > 2) {
          stroke.points = [stroke.points[0], stroke.points[stroke.points.length - 1]];
        }
        if (!state.pdfStrokes[page]) state.pdfStrokes[page] = [];
        var newStroke = {
          points: stroke.points,
          color: stroke.color,
          size: stroke.size,
          id: 's_' + Date.now(),
          note: '',
          createdAt: Date.now()
        };
        state.pdfStrokes[page].push(newStroke);
        hasNewStroke = true;
      }
      state.currentStroke = null;
      drawPageStrokes(page, canvas, width, height);
      // 通知外部模块
      if (hasNewStroke && R.onStrokeCompleted) R.onStrokeCompleted(page);
      if (hasNewStroke && R.saveAnnotations) R.saveAnnotations(state.currentBook ? state.currentBook.id : null);
    }

    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
  }

  // 绘制页面上的所有笔迹
  function drawPageStrokes(page, canvas, width, height, activeStroke) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // 绘制已保存的笔迹
    var strokes = state.pdfStrokes[page] || [];
    strokes.forEach(function (s) { drawStroke(ctx, s, width, height); });

    // 绘制正在进行的笔迹
    if (activeStroke) {
      drawStroke(ctx, activeStroke, width, height);
    }
  }

  // 重绘指定页的笔迹（从当前 DOM 中找到 canvas 并刷新）
  function redrawPageStrokes(page) {
    var hCanvas = document.querySelector('.pdf-page-wrapper[data-page="' + page + '"] .pdf-highlight-canvas');
    if (hCanvas) {
      drawPageStrokes(page, hCanvas, hCanvas.width, hCanvas.height);
    }
  }

  function drawStroke(ctx, stroke, width, height) {
    if (!stroke.points || stroke.points.length < 2) return;
    var pts = stroke.points;
    var size = stroke.size || 10;
    var color = stroke.color || 'rgba(255,235,59,0.45)';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.moveTo(pts[0].x * width, pts[0].y * height);
    // 按住 Shift 时只画首尾连线（直线预览），否则跟随所有点（自由曲线）
    if (stroke.shiftKey && pts.length > 2) {
      var last = pts.length - 1;
      ctx.lineTo(pts[last].x * width, pts[last].y * height);
    } else {
      for (var i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x * width, pts[i].y * height);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // 获取当前视口中最靠上的可见页码
  function getVisiblePage() {
    var wrappers = dom.pdfView.querySelectorAll('.pdf-page-wrapper');
    var bestPage = state.pdfPage || 1;
    var bestTop = Infinity;
    var viewTop = dom.pdfView.scrollTop;
    var viewBot = viewTop + dom.pdfView.clientHeight;

    wrappers.forEach(function (w) {
      var rect = w.getBoundingClientRect();
      var containerRect = dom.pdfView.getBoundingClientRect();
      var relTop = rect.top - containerRect.top;
      var relBot = rect.bottom - containerRect.top;
      // 与视口有交集
      if (relBot > 0 && relTop < containerRect.height) {
        if (relTop < bestTop && relTop > -rect.height * 0.6) {
          bestTop = relTop;
          bestPage = parseInt(w.dataset.page) || bestPage;
        }
      }
    });
    return bestPage;
  }

  // PDF 连续滚动：到底部自动追加下一页 + 跟踪当前可见页
  function installPdfScrollDetect() {
    var el = dom.pdfView;
    if (!el) return;
    var lastPdfScrollTop = 0;
    var scrollTick = null;
    el.addEventListener('scroll', function () {
      if (!state.pdfDoc || state.pdfChanging) return;
      var st = el.scrollTop;
      var sh = el.scrollHeight;
      var ch = el.clientHeight;

      // 更新当前可见页（防抖）
      if (scrollTick) clearTimeout(scrollTick);
      scrollTick = setTimeout(function () {
        state.pdfPage = getVisiblePage();
      }, 150);

      // 往下滚到接近底部 → 自动渲染并加载下一页
      if (st > lastPdfScrollTop && sh - st - ch < 100 && state.pdfRendered.length < state.pdfTotal) {
        var nextPage = state.pdfRendered[state.pdfRendered.length - 1] + 1;
        if (nextPage <= state.pdfTotal) {
          renderPdfPage(nextPage);
        }
      }
      lastPdfScrollTop = st;
    }, { passive: true });
  }

  // PDF 滚轮兜底（首屏不满一页时直接滚动）
  function installPdfWheelFallback() {
    var el = dom.pdfView;
    if (!el) return;
    el.addEventListener('wheel', function (e) {
      if (!state.pdfDoc || e.ctrlKey || e.metaKey) return;
      if (el.scrollHeight <= el.clientHeight + 1) {
        e.preventDefault();
        navigatePage(e.deltaY > 0 ? 1 : -1);
      }
    }, { passive: false });
  }

  // ==========================================================================
  //  EPUB iframe 滚轮事件（iframe 会拦截所有 wheel 事件，需绑定到 contentWindow）
  // ==========================================================================
  function installEpubWheelHandler() {
    var iframe = dom.epubView.querySelector('iframe');
    if (!iframe) { setTimeout(installEpubWheelHandler, 500); return; }
    var win;
    try { win = iframe.contentWindow; } catch (e) {}
    if (!win) { setTimeout(installEpubWheelHandler, 500); return; }

    // 移除旧监听（若旧 contentWindow 还在，防重复）
    if (iframe._epubWheelFn) {
      try { win.removeEventListener('wheel', iframe._epubWheelFn); } catch (e) {}
    }

    var fn = function (e) {
      if (state.currentFormat !== 'epub' || !state.epubRendition) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        adjustZoom(e.deltaY < 0 ? 1 : -1);
        return;
      }
      e.preventDefault();
      state.scrollAccum += e.deltaY;
      if (Math.abs(state.scrollAccum) >= 80) {
        navigatePage(state.scrollAccum > 0 ? 1 : -1);
        state.scrollAccum = 0;
      }
    };

    iframe._epubWheelFn = fn;
    win.addEventListener('wheel', fn, { passive: false });
  }

  // ==========================================================================
  //  MOBI 加载
  // ==========================================================================
  function loadMobi(book, loadId) {
    var path = book.path;
    var fromCache = !!state._fileCache[path];
    if (!fromCache) showProgress('正在下载 MOBI …');

    (fromCache ? Promise.resolve(state._fileCache[path].slice(0)) : xhrDownload(path, function (pct) {
      if (isLoadStale(loadId)) return;
      setProgress(Math.round(pct * 85));
    })).then(function (buffer) {
      if (isLoadStale(loadId)) return;
      if (!fromCache) setProgressMsg(95, '正在提取文本 …');
      setTimeout(function () {
        if (isLoadStale(loadId)) return;
        dom.epubView.style.display = 'none';
        dom.pdfView.style.display = 'none';
        dom.textView.style.display = '';
        dom.textView.innerHTML = extractTextFromMobi(buffer, book.path);
        dom.tocTree.innerHTML = '<p class="toc-empty">MOBI 暂不支持目录</p>';
        dom.btnPrev.disabled = true;
        dom.btnNext.disabled = true;
        dom.progressSlider.disabled = true;
        dom.progressText.textContent = 'MOBI';
        if (!fromCache) setProgressMsg(100, '加载完成');
        setTimeout(function () { showReader(); }, 150);
      }, 200);
    }).catch(function (err) {
      if (isLoadStale(loadId)) return;
      showError('MOBI 加载失败: ' + (err.message || err));
    });
  }

  function extractTextFromMobi(buffer, path) {
    var data = new Uint8Array(buffer), text = '';
    try {
      var decoded = new TextDecoder('utf-8', { fatal: false }).decode(data);
      var lines = decoded.split('\n').filter(function (l) { return l.length > 2 && /[一-鿿 -~]/.test(l); });
      if (lines.length > 10) text = lines.slice(0, 5000).join('\n');
    } catch (e) {}

    var html = '<div class="mobi-download-msg"><p>⚠️ 浏览器无法完美渲染 MOBI 格式</p>';
    if (text.length < 50) {
      var title = '';
      for (var i = 0; i < 32; i++) { if (data[i] === 0) break; title += String.fromCharCode(data[i]); }
      if (title.trim()) html += '<h2>' + escapeHtml(title.trim()) + '</h2>';
    }
    if (text.length > 50) {
      html += '<hr style="margin:12px 0;border:none;border-top:1px solid var(--border);">';
      html += '<p style="font-size:13px;">以下是从文件中提取的文本内容（可能不完整）：</p></div>';
      html += text.split(/\n\s*\n/).map(function (p) {
        p = p.trim();
        if (!p) return '';
        return (p.length < 60 && !p.endsWith('。') && !p.endsWith('.') && !p.endsWith('?') && !p.endsWith('!'))
          ? '<h3>' + escapeHtml(p) + '</h3>' : '<p>' + escapeHtml(p) + '</p>';
      }).join('\n');
    } else {
      html += '<p>无法提取文本内容，请使用 Calibre 或 Kindle 阅读。</p></div>';
    }
    html += '<div style="text-align:center;margin:30px 0;padding:20px;border-top:1px solid var(--border);">';
    html += '<a href="' + path + '" download class="ctrl-btn" style="text-decoration:none;">⬇ 下载此文件</a></div>';
    return html;
  }

  // ==========================================================================
  //  通用 XHR 下载（带进度通知）
  // ==========================================================================
  function xhrDownload(url, onProgress) {
    // 有缓存则直接返回副本（原 buffer 可能被 pdf.js/epub.js detach）
    if (state._fileCache[url]) {
      return Promise.resolve(state._fileCache[url].slice(0));
    }

    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      state._xhr = xhr;
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';

      xhr.onprogress = function (e) {
        if (e.lengthComputable && onProgress) {
          onProgress(e.loaded / e.total);
        }
      };

      xhr.onload = function () {
        if (state._xhr === xhr) state._xhr = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          // 缓存一个副本，后续取用时始终 slice(0) 返回新副本
          state._fileCache[url] = xhr.response.slice(0);
          resolve(xhr.response);
        } else {
          reject(new Error('HTTP ' + xhr.status));
        }
      };

      xhr.onerror = function () {
        if (state._xhr === xhr) state._xhr = null;
        reject(new Error('网络错误'));
      };
      xhr.onabort = function () {
        if (state._xhr === xhr) state._xhr = null;
      };

      xhr.send();
    });
  }

  // ====== 清理 ======
  function cleanupReader() {
    if (state.epubRendition) { try { state.epubRendition.destroy(); } catch (e) {} state.epubRendition = null; }
    state.epubBook = null;
    state.pdfDoc = null;
    state.pdfPage = 1;
    state.pdfTotal = 0;
    state.pdfRendered = [];
    state.toc = [];
    state._lastTocHref = null;
    state.markerMode = false;
    state._markerReady = false;
    state.pdfStrokes = {};
    state.currentStroke = null;
    state.annotations = {};
    state.pendingAnnotation = null;
    state.navHistory = [];
    state.dualPageMode = false;
    state.zoom = 1.0;
    updateZoomLabel();

    dom.epubView.style.display = 'none';
    dom.pdfView.style.display = 'none';
    dom.textView.style.display = 'none';
    dom.btnPrev.disabled = false;
    dom.btnNext.disabled = false;
    dom.progressSlider.disabled = false;
    dom.btnMarker.classList.remove('active', 'has-config');
    var markerLabel = dom.btnMarker.querySelector('.marker-label');
    if (markerLabel) markerLabel.textContent = '🖊';
    var markerDot = dom.btnMarker.querySelector('.marker-dot');
    if (markerDot) markerDot.style.display = 'none';
    var markerSize = dom.btnMarker.querySelector('.marker-size');
    if (markerSize) markerSize.style.display = 'none';
    document.querySelector('.reader-panel').classList.remove('pen-active', 'highlight-mode');
    if (dom.penTools) dom.penTools.style.display = 'none';
    dom.pageInfo.textContent = '';
    dom.progressText.textContent = '-- / --';
    dom.progressSlider.value = '0';
    dom.tocTree.innerHTML = '<p class="toc-empty">选择一本书以查看目录</p>';
    dom.tocSidebar.classList.add('collapsed');
    // 关闭标记侧栏、缩略图、清除激活按钮
    var annSidebar = document.getElementById('annotationsSidebar');
    if (annSidebar) annSidebar.classList.add('collapsed');
    var thumbStrip = document.getElementById('thumbnailsStrip');
    if (thumbStrip) thumbStrip.classList.add('collapsed');
    if (R.resetActiveButtons) R.resetActiveButtons();
    // 清空标记面板
    var annList = document.getElementById('annotationsList');
    if (annList) annList.innerHTML = '<p class="annotations-empty">暂无标记</p>';
    // 重置格式相关按钮
    updateFormatButtons();
  }

  // 销毁过期加载的 epub 资源（不干扰当前 UI）
  function destroyEpubBook() {
    if (state.epubRendition) { try { state.epubRendition.destroy(); } catch (e) {} state.epubRendition = null; }
    state.epubBook = null;
    hideProgress();
  }

  // ====== 缩放控制 ======
  function updateZoomLabel() {
    if (dom.zoomLabel) dom.zoomLabel.textContent = Math.round(state.zoom * 100) + '%';
  }

  function adjustZoom(dir) {
    if (state.currentFormat === 'pdf' && state.pdfDoc) {
      state.zoom = dir > 0 ? Math.min(state.zoom + 0.25, 4.0) : Math.max(state.zoom - 0.25, 0.5);
      // 缩放后清空重绘
      var currentPage = state.pdfPage;
      dom.pdfView.innerHTML = '';
      state.pdfRendered = [];

      // 只渲染当前页，立即定位（不顺序渲染中间页）
      renderPdfPage(currentPage).then(function () {
        smoothScrollToPage(currentPage);
      });
    } else if (state.currentFormat === 'epub' && state.epubRendition) {
      state.zoom = dir > 0 ? Math.min(state.zoom + 0.1, 2.0) : Math.max(state.zoom - 0.1, 0.5);
      state.epubRendition.themes.default({ 'body': { 'font-size': (state.zoom * 100) + '%!important' } });
    }
    updateZoomLabel();
  }

  // ====== 翻页进度 ======
  function updateEpubProgress() {
    if (!state.epubRendition || !state.epubBook) return;
    var loc = state.epubRendition.currentLocation();
    if (!loc || !loc.start) return;

    if (loc.start.displayed) {
      var page = loc.start.displayed.page || 0;
      var total = loc.start.displayed.total || 0;
      dom.progressText.textContent = total > 0 ? page + ' / ' + total : 'EPUB';
      dom.pageInfo.textContent = total > 0 ? '共 ' + total + ' 页' : '';
      if (total > 0 && state.epubBook.locations) {
        try { dom.progressSlider.value = Math.round(state.epubBook.locations.percentageFromCfi(loc.start.cfi) * 100); } catch (e) {}
      }
    }

    if (loc.start.href) {
      var activeHref = null;
      var locBase = stripHash(loc.start.href);
      // 如果用户最近点击的目录项仍在当前 spine 文件内，优先高亮它
      // （EPUB.js 当前位置只返回 spine 文件，不返回具体锚点）
      if (state._lastTocHref && stripHash(state._lastTocHref) === locBase) {
        activeHref = state._lastTocHref;
      } else {
        activeHref = findBestTocHref(loc.start.href);
        state._lastTocHref = null;
      }
      if (activeHref) {
        updateTocHighlight(activeHref);
      }
    }

    // 保存 EPUB 阅读位置（恢复阶段不保存，避免覆盖被恢复的位置）
    if (!state._restoring && loc.start.cfi) {
      saveReadingPosition(state.currentBook ? state.currentBook.id : null, { cfi: loc.start.cfi, zoom: state.zoom });
    }
  }

  function updatePdfProgress() {
    if (!state.pdfDoc) return;
    dom.progressText.textContent = state.pdfPage + ' / ' + state.pdfTotal;
    dom.progressSlider.value = String(state.pdfPage);
    dom.pageInfo.textContent = '共 ' + state.pdfTotal + ' 页';

    // 高亮当前页面对应的目录项（递归匹配最近的章节）
    if (state.toc && state.toc.length > 0) {
      var currentPage = state.pdfPage;
      var matched = findTocItemByPage(state.toc, currentPage);
      if (matched) {
        updateTocHighlight(matched.href);
      }
    }

    // 更新缩略图高亮
    if (R.updateThumbnailHighlight) R.updateThumbnailHighlight(state.pdfPage);
    // 更新书签按钮状态
    if (R.updateBookmarkButton) R.updateBookmarkButton();

    // 保存 PDF 阅读位置（恢复阶段不保存，避免覆盖被恢复的位置）
    if (!state._restoring) {
      saveReadingPosition(state.currentBook ? state.currentBook.id : null, { page: state.pdfPage, zoom: state.zoom });
    }
  }

  // ====== 目录 ======
  function normalizeEpubToc(items) {
    if (!items || items.length === 0) return [];
    return items.map(function (item) {
      var normalized = {
        label: item.label || '未命名',
        href: item.href,
        children: []
      };
      if (item.subitems && item.subitems.length > 0) {
        normalized.children = normalizeEpubToc(item.subitems);
      }
      return normalized;
    });
  }

  function renderToc(tocItems) {
    dom.tocTree.innerHTML = '';
    if (!tocItems || tocItems.length === 0) {
      dom.tocTree.innerHTML = '<p class="toc-empty">暂无目录</p>';
      return;
    }
    dom.tocTree.appendChild(buildTocTree(tocItems, 0));
  }

  function buildTocTree(items, depth) {
    var ul = document.createElement('ul');
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.dataset.href = item.href;
      if (item.page) li.dataset.page = String(item.page);

      var hasChildren = item.children && item.children.length > 0;
      if (hasChildren) {
        li.className = 'toc-node collapsed';
        var header = document.createElement('div');
        header.className = 'toc-node-header';
        var arrow = document.createElement('span');
        arrow.className = 'toc-node-arrow';
        arrow.textContent = '▼';
        var label = document.createElement('span');
        label.className = 'toc-node-label';
        label.textContent = item.label;
        header.appendChild(arrow);
        header.appendChild(label);
        li.appendChild(header);

        header.addEventListener('click', function (e) {
          // 点击标签文字导航，点击箭头/空白处展开收起
          if (e.target === label) {
            e.stopPropagation();
            navigateToc(item);
            return;
          }
          li.classList.toggle('collapsed');
        });

        li.appendChild(buildTocTree(item.children, depth + 1));
      } else {
        var label = document.createElement('span');
        label.className = 'toc-node-label leaf';
        label.textContent = item.label;
        li.appendChild(label);
        label.addEventListener('click', function () { navigateToc(item); });
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function navigateToc(item) {
    // 记录用户点击的目录项，便于 EPUB 同文件内小章节高亮
    state._lastTocHref = item.href;
    if (state.currentFormat === 'epub' && state.epubRendition) {
      state.epubRendition.display(item.href).then(function () { updateEpubProgress(); });
    } else if (state.currentFormat === 'pdf' && state.pdfDoc && item.page) {
      jumpToPdfPage(item.page);
    }
    // 移动端点击目录项后自动收起目录侧栏
    if (window.innerWidth <= 768) {
      dom.tocSidebar.classList.add('collapsed');
    }
  }

  function findTocItemByPage(items, page) {
    var matched = null;
    items.forEach(function (item) {
      if (item.page && item.page <= page && (!matched || item.page > matched.page)) {
        matched = item;
      }
      if (item.children && item.children.length > 0) {
        var childMatched = findTocItemByPage(item.children, page);
        if (childMatched && (!matched || childMatched.page > matched.page)) {
          matched = childMatched;
        }
      }
    });
    return matched;
  }

  function updateTocHighlight(activeHref) {
    if (!activeHref || !dom.tocTree) return;
    var activeLi = null;
    dom.tocTree.querySelectorAll('li').forEach(function (li) {
      var isActive = li.dataset.href === activeHref;
      li.classList.toggle('active', isActive);
      if (isActive) activeLi = li;
    });
    if (!activeLi) return;

    // 展开所有父级节点
    var parent = activeLi.parentElement;
    while (parent) {
      if (parent.tagName === 'UL') {
        var nodeLi = parent.parentElement;
        if (nodeLi && nodeLi.classList.contains('toc-node')) {
          nodeLi.classList.remove('collapsed');
        }
      }
      parent = parent.parentElement;
    }

    // 滚动到可视区域
    activeLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function stripHash(href) {
    if (!href) return '';
    var idx = href.indexOf('#');
    return idx === -1 ? href : href.slice(0, idx);
  }

  function findBestTocHref(locHref) {
    if (!locHref || !dom.tocTree) return null;
    var items = Array.prototype.slice.call(dom.tocTree.querySelectorAll('li'));
    if (items.length === 0) return null;

    // 优先精确匹配
    var exact = items.filter(function (li) { return li.dataset.href === locHref; });
    if (exact.length > 0) return exact[0].dataset.href;

    // 其次按去掉锚点后的路径匹配（EPUB 当前位置 href 通常不带锚点）
    var locBase = stripHash(locHref);
    var baseMatches = items.filter(function (li) { return stripHash(li.dataset.href) === locBase; });
    if (baseMatches.length > 0) return baseMatches[0].dataset.href;

    // 再按文件名匹配（处理 EPUB 包内不同基准路径的情况）
    var locName = locBase.split('/').pop();
    var nameMatches = items.filter(function (li) {
      return stripHash(li.dataset.href).split('/').pop() === locName;
    });
    if (nameMatches.length > 0) return nameMatches[0].dataset.href;

    return null;
  }

  // ====== 事件 ======
  function bindEvents() {
    dom.btnPrev.addEventListener('click', function () { navigatePage(-1); });
    dom.btnNext.addEventListener('click', function () { navigatePage(1); });

    dom.progressSlider.addEventListener('input', function () {
      if (state.currentFormat === 'epub' && state.epubRendition && state.epubBook) {
        var pct = parseInt(this.value) / 100;
        if (state.epubBook.locations) {
          try { state.epubRendition.display(state.epubBook.locations.cfiFromPercentage(pct)).then(function () { updateEpubProgress(); }); } catch (e) {}
        }
      } else if (state.currentFormat === 'pdf' && state.pdfDoc) {
        var pageNum = parseInt(this.value);
        if (pageNum >= 1 && pageNum <= state.pdfTotal) {
          jumpToPdfPage(pageNum);
        }
      }
    });

    dom.btnToc.addEventListener('click', function () {
      dom.tocSidebar.classList.toggle('collapsed');
      setTimeout(function () {
        if (state.epubRendition) { state.epubRendition.resize(); }
        installEpubWheelHandler();
      }, 400);
    });

    // 标记按钮 — 三态切换 + 下拉面板
    dom.btnMarker.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!state.markerMode) {
        // 状态 0→1：进入配置模式，展开下拉面板
        state.markerMode = true;
        state._markerReady = false;
        enterConfigMode();
      } else if (!state._markerReady) {
        // 状态 1→2：确认配置，收起面板进入绘制模式
        state._markerReady = true;
        enterDrawMode();
      } else {
        // 状态 2→0：退出标记模式
        state.markerMode = false;
        state._markerReady = false;
        exitMarkerMode();
      }
    });

    function enterConfigMode() {
      dom.btnMarker.classList.add('active');
      var readerPanel = document.querySelector('.reader-panel');
      var isPdf = state.currentFormat === 'pdf';
      if (isPdf) {
        readerPanel.classList.add('pen-active');
        readerPanel.classList.remove('highlight-mode');
      } else {
        readerPanel.classList.add('highlight-mode');
        readerPanel.classList.remove('pen-active');
      }
      if (dom.penTools) {
        dom.penTools.style.display = 'flex';
        updatePenToolsForFormat();
      }
      updateMarkerButtonAppearance();
    }

    function enterDrawMode() {
      dom.btnMarker.classList.add('active', 'has-config');
      var readerPanel = document.querySelector('.reader-panel');
      // 保持 pen-active / highlight-mode（已在 config 模式设置）
      if (dom.penTools) dom.penTools.style.display = 'none';
      updateMarkerButtonAppearance();
    }

    function exitMarkerMode() {
      dom.btnMarker.classList.remove('active', 'has-config');
      var readerPanel = document.querySelector('.reader-panel');
      readerPanel.classList.remove('pen-active', 'highlight-mode');
      if (dom.penTools) dom.penTools.style.display = 'none';
      updateMarkerButtonAppearance();
    }

    // 点击空白区域关闭下拉面板（配置模式下）
    document.addEventListener('click', function (e) {
      if (state.markerMode && !state._markerReady) {
        var wrap = document.getElementById('markerWrap');
        if (wrap && !wrap.contains(e.target)) {
          enterDrawMode();
        }
      }
    });

    // 画笔大小变更
    if (dom.penSize) {
      dom.penSize.addEventListener('input', function () {
        state.penSize = parseInt(this.value);
        if (dom.penSizeVal) dom.penSizeVal.textContent = this.value;
      });
    }

    // 画笔颜色选择
    document.querySelector('.pen-tools').addEventListener('click', function (e) {
      var colorEl = e.target.closest('.pen-color');
      if (!colorEl) return;
      document.querySelectorAll('.pen-color').forEach(function (c) { c.classList.remove('active'); });
      colorEl.classList.add('active');
      state.penColor = colorEl.dataset.color;
    });

    // 撤销上一笔
    if (dom.btnUndoStroke) {
      dom.btnUndoStroke.addEventListener('click', function () {
        if (!state.pdfDoc) return;
        var page = getVisiblePage();
        if (state.pdfStrokes[page] && state.pdfStrokes[page].length > 0) {
          state.pdfStrokes[page].pop();
          redrawPageStrokes(page);
        }
      });
    }

    // 清除本页所有标记
    if (dom.btnClearStrokes) {
      dom.btnClearStrokes.addEventListener('click', function () {
        if (!state.pdfDoc) return;
        var page = getVisiblePage();
        state.pdfStrokes[page] = [];
        redrawPageStrokes(page);
      });
    }

    // 移动端点击目录侧栏外部区域关闭目录
    document.addEventListener('click', function (e) {
      if (window.innerWidth > 768) return;
      if (!dom.tocSidebar.classList.contains('collapsed') &&
          !dom.tocSidebar.contains(e.target) &&
          e.target !== dom.btnToc && !dom.btnToc.contains(e.target)) {
        dom.tocSidebar.classList.add('collapsed');
      }
    });

    dom.btnZoomIn.addEventListener('click', function () { adjustZoom(1); });
    dom.btnZoomOut.addEventListener('click', function () { adjustZoom(-1); });

    // 侧栏收起/展开
    dom.sidebarToggle.addEventListener('click', function () {
      document.querySelector('.sidebar').classList.toggle('collapsed');
      // 收起/展开后通知 epub.js 重绘，并重新装滚轮事件
      // 侧栏 CSS transition 完成后重设 epub 尺寸 + 重绑滚轮
      setTimeout(function () {
        if (state.epubRendition) {
          state.epubRendition.resize();
        }
        installEpubWheelHandler();
      }, 400);
    });

    // PDF 滚轮翻页（PDF 视图没有 iframe 遮罩，直接监听）
    var renderArea = document.querySelector('.render-area');
    if (renderArea) {
      renderArea.addEventListener('wheel', function (e) {
        if (state.currentFormat === 'pdf' && state.pdfDoc) {
          // Ctrl+滚轮 → 缩放
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            adjustZoom(e.deltaY < 0 ? 1 : -1);
          }
        }
      }, { passive: false });
    }
  }

  function bindKeyboard() {
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); navigatePage(-1); break;
        case 'ArrowRight': e.preventDefault(); navigatePage(1); break;
        case 'Escape': dom.tocSidebar.classList.add('collapsed'); break;
      }
    });
  }

  function navigatePage(dir) {
    if (state.currentFormat === 'epub' && state.epubRendition) {
      (dir < 0 ? state.epubRendition.prev() : state.epubRendition.next()).then(function () { updateEpubProgress(); });
    } else if (state.currentFormat === 'pdf' && state.pdfDoc) {
      var newPage = state.pdfPage + dir;
      if (newPage < 1 || newPage > state.pdfTotal) return;
      state.pdfPage = newPage;
      updatePdfProgress();

      if (state.pdfRendered.indexOf(newPage) !== -1) {
        smoothScrollToPage(newPage);
      } else {
        renderPdfPage(newPage).then(function () { smoothScrollToPage(newPage); });
      }
    }
  }

  // ====== 工具 ======
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ====== 导出 API ======
  R.loadBook = loadBook;
  R.renderTree = renderTree;
  R.showReader = showReader;
  R.getVisiblePage = getVisiblePage;
  R.drawPageStrokes = drawPageStrokes;
  R.redrawPageStrokes = redrawPageStrokes;
  R.jumpToPdfPage = jumpToPdfPage;
  R.renderPdfPage = renderPdfPage;
  R.smoothScrollToPage = smoothScrollToPage;
  R.escapeHtml = escapeHtml;
  R.updateEpubProgress = updateEpubProgress;
  R.updatePdfProgress = updatePdfProgress;
  R.updateMarkerButton = updateMarkerButton;
  R.renderAnnotationsList = null;  // 由 annotations.js 设置
  R.renderEpubHighlights = null;   // 由 annotations.js 设置

  function boot() {
    init();
    // 调用各模块的初始化
    if (R.initTheme) R.initTheme();
    if (R.initFontSize) R.initFontSize();
    if (R.initAnnotations) R.initAnnotations();
    if (R.initNavigation) R.initNavigation();
    if (R.initData) R.initData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
