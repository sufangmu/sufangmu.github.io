/**
 * 个人图书馆 — 支持 EPUB / PDF / MOBI
 */
(function () {
  'use strict';

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
    btnZoomIn: $('#btnZoomIn'),
    btnZoomOut: $('#btnZoomOut'),
    progressText: $('#progressText'),
    progressSlider: $('#progressSlider'),
    pageInfo: $('#pageInfo'),
    tocPanel: $('#tocPanel'),
    tocBody: $('#tocBody'),
    tocClose: $('#tocClose'),
    themeToggle: $('#themeToggle'),
    sidebarToggle: $('#sidebarToggle'),
    zoomLabel: $('#zoomLabel'),
    bookCount: $('#bookCount'),
  };

  // ====== 初始化 ======
  function init() {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    renderTree();
    bindEvents();
    bindKeyboard();
    initTheme();
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
    var labels = { 'leo_nce_notes': 'leo新概念英语笔记', 'novel': '小说', 'original_english_textbook': '英文原版书'};
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

    dom.bookTitle.textContent = book.title;
    dom.bookMeta.textContent = (book.author ? book.author + ' · ' : '') + book.format.toUpperCase();
    dom.formatBadge.textContent = book.format.toUpperCase();

    var path = book.path;
    if (!path) { showEmpty(); return; }

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
        state.toc = nav.toc;
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

      // 每次渲染后重绑滚轮（避免各种场景下的监听丢失）
      rendition.on('rendered', function () {
        if (isLoadStale(loadId)) return;
        setTimeout(function () { installEpubWheelHandler(); }, 200);
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
        var canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        return page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise.then(function () {
          var label = document.createElement('div');
          label.className = 'pdf-page-label';
          label.textContent = num + ' / ' + state.pdfTotal;
          dom.pdfView.appendChild(canvas);
          dom.pdfView.appendChild(label);
          state.pdfRendered.push(num);
          state.pdfRendered.sort(function (a, b) { return a - b; });
          state.pdfChanging = false;
          state.pdfPage = num;
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
    var canvases = dom.pdfView.querySelectorAll('canvas');
    // 页码从 1 开始，canvas 索引按渲染顺序
    var idx = state.pdfRendered.indexOf(num);
    if (idx !== -1 && canvases[idx]) {
      canvases[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // 跳转到指定页码（直接渲染目标页，不顺序渲染中间页，瞬间定位而非平滑滚动）
  function jumpToPdfPage(num) {
    if (num < 1 || num > state.pdfTotal) return Promise.resolve();
    state.pdfPage = num;
    updatePdfProgress();

    if (state.pdfRendered.indexOf(num) !== -1) {
      // 已渲染，直接跳到
      var canvases = dom.pdfView.querySelectorAll('canvas');
      var idx = state.pdfRendered.indexOf(num);
      if (idx !== -1 && canvases[idx]) {
        canvases[idx].scrollIntoView({ behavior: 'instant', block: 'start' });
      }
      return Promise.resolve();
    }

    // 未渲染，先渲染这一页再跳
    return renderPdfPage(num).then(function () {
      var canvases = dom.pdfView.querySelectorAll('canvas');
      var idx = state.pdfRendered.indexOf(num);
      if (idx !== -1 && canvases[idx]) {
        canvases[idx].scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
  }

  // PDF 连续滚动：到底部自动追加下一页
  function installPdfScrollDetect() {
    var el = dom.pdfView;
    if (!el) return;
    var lastPdfScrollTop = 0;
    el.addEventListener('scroll', function () {
      if (!state.pdfDoc || state.pdfChanging) return;
      var st = el.scrollTop;
      var sh = el.scrollHeight;
      var ch = el.clientHeight;

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
        dom.tocBody.innerHTML = '<p style="padding:16px;color:var(--text-muted);font-size:13px;">MOBI 暂不支持目录</p>';
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
    state.zoom = 1.0;
    updateZoomLabel();

    dom.epubView.style.display = 'none';
    dom.pdfView.style.display = 'none';
    dom.textView.style.display = 'none';
    dom.btnPrev.disabled = false;
    dom.btnNext.disabled = false;
    dom.progressSlider.disabled = false;
    dom.pageInfo.textContent = '';
    dom.progressText.textContent = '-- / --';
    dom.progressSlider.value = '0';
    dom.tocPanel.classList.remove('show');
    dom.tocBody.innerHTML = '';
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
      dom.tocBody.querySelectorAll('li').forEach(function (li) { li.classList.toggle('active', li.dataset.href === loc.start.href); });
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
    // 保存 PDF 阅读位置（恢复阶段不保存，避免覆盖被恢复的位置）
    if (!state._restoring) {
      saveReadingPosition(state.currentBook ? state.currentBook.id : null, { page: state.pdfPage, zoom: state.zoom });
    }
  }

  // ====== 目录 ======
  function renderToc(tocItems) {
    dom.tocBody.innerHTML = '';
    if (!tocItems || tocItems.length === 0) {
      dom.tocBody.innerHTML = '<p style="padding:16px;color:var(--text-muted);font-size:13px;">暂无目录</p>';
      return;
    }
    var ul = document.createElement('ul');
    tocItems.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item.label;
      li.dataset.href = item.href;
      li.addEventListener('click', function () {
        if (state.epubRendition) {
          state.epubRendition.display(item.href).then(function () { updateEpubProgress(); dom.tocPanel.classList.remove('show'); });
        }
      });
      ul.appendChild(li);
    });
    dom.tocBody.appendChild(ul);
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

    dom.btnToc.addEventListener('click', function () { dom.tocPanel.classList.toggle('show'); });
    dom.tocClose.addEventListener('click', function () { dom.tocPanel.classList.remove('show'); });
    document.addEventListener('click', function (e) {
      if (dom.tocPanel.classList.contains('show') && !dom.tocPanel.contains(e.target) && e.target !== dom.btnToc && !dom.btnToc.contains(e.target)) {
        dom.tocPanel.classList.remove('show');
      }
    });

    dom.btnZoomIn.addEventListener('click', function () { adjustZoom(1); });
    dom.btnZoomOut.addEventListener('click', function () { adjustZoom(-1); });

    dom.themeToggle.addEventListener('click', toggleTheme);

    // 侧栏收起/展开
    dom.sidebarToggle.addEventListener('click', function () {
      document.querySelector('.sidebar').classList.toggle('collapsed');
      document.body.classList.toggle('sidebar-hidden');
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
        case 'Escape': dom.tocPanel.classList.remove('show'); break;
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

  // ====== 主题 ======
  function initTheme() {
    if (localStorage.getItem('reader-theme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      dom.themeToggle.textContent = '☀️';
    }
  }

  function toggleTheme() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('reader-theme', 'light');
      dom.themeToggle.textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('reader-theme', 'dark');
      dom.themeToggle.textContent = '☀️';
    }
    if (state.epubRendition) setTimeout(function () { state.epubRendition.resize(); }, 100);
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
