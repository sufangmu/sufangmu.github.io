/**
 * 个人图书馆 — 导航历史 + 书签 + PDF双页模式 + 缩略图
 * 依赖 window.ReaderApp (app.js)
 */
(function navModule() {
  'use strict';
  var R = window.ReaderApp;
  if (!R || !R.state) { setTimeout(navModule, 50); return; }

  var state = R.state;
  var _navBound = false;

  // ====== 书签 ======
  function loadBookmarks() {
    try {
      var raw = localStorage.getItem('reader-bookmarks');
      state.bookmarks = raw ? JSON.parse(raw) : {};
    } catch (e) { state.bookmarks = {}; }
  }

  function saveBookmarks() {
    try { localStorage.setItem('reader-bookmarks', JSON.stringify(state.bookmarks)); } catch (e) {}
  }

  function toggleBookmark() {
    var bookId = state.currentBook ? state.currentBook.id : null;
    if (!bookId) return;

    state.bookmarks[bookId] = state.bookmarks[bookId] || [];

    var page = state.currentFormat === 'pdf' ? state.pdfPage : null;
    var cfi = null;
    if (state.currentFormat === 'epub' && state.epubRendition) {
      try {
        var loc = state.epubRendition.currentLocation();
        if (loc && loc.start) cfi = loc.start.cfi;
      } catch (e) {}
    }

    // 检查是否已存在
    var existing = state.bookmarks[bookId].filter(function (b) {
      if (page && b.page === page) return true;
      if (cfi && b.cfi === cfi) return true;
      return false;
    });

    if (existing.length > 0) {
      // 移除书签
      state.bookmarks[bookId] = state.bookmarks[bookId].filter(function (b) {
        return existing.indexOf(b) === -1;
      });
      updateBookmarkButton(false);
    } else {
      // 添加书签
      var title = '';
      if (state.currentFormat === 'pdf') {
        title = '第 ' + state.pdfPage + ' 页';
      } else {
        title = state.currentBook ? state.currentBook.title : '';
      }
      state.bookmarks[bookId].push({
        id: 'b_' + Date.now(),
        page: page,
        cfi: cfi,
        title: title,
        bookTitle: state.currentBook ? state.currentBook.title : '',
        createdAt: Date.now()
      });
      updateBookmarkButton(true);
    }
    saveBookmarks();
  }

  function updateBookmarkButton(isBookmarked) {
    var btn = document.getElementById('btnBookmark');
    if (!btn) return;
    if (isBookmarked === undefined) {
      var bookId = state.currentBook ? state.currentBook.id : null;
      var page = state.currentFormat === 'pdf' ? state.pdfPage : null;
      var bookmarks = (state.bookmarks[bookId] || []);
      isBookmarked = bookmarks.some(function (b) { return page && b.page === page; });
    }
    btn.classList.toggle('active', isBookmarked);
  }

  function showBookmarksPanel() {
    var overlay = document.getElementById('bookmarksOverlay');
    var list = document.getElementById('bookmarksPanelList');
    if (!overlay || !list) return;

    var bookId = state.currentBook ? state.currentBook.id : null;
    var items = [];
    if (bookId) {
      items = (state.bookmarks[bookId] || []).slice();
    } else {
      // 所有书籍的书签
      Object.keys(state.bookmarks).forEach(function (bid) {
        (state.bookmarks[bid] || []).forEach(function (b) {
          b._bookId = bid;
          items.push(b);
        });
      });
    }

    items.sort(function (a, b) { return b.createdAt - a.createdAt; });

    if (items.length === 0) {
      list.innerHTML = '<p class="annotations-empty">暂无书签</p>';
    } else {
      var html = '';
      items.forEach(function (b) {
        html += '<div class="bookmark-item" data-book-id="' + (b._bookId || bookId) + '" data-page="' + (b.page || '') + '" data-cfi="' + (b.cfi || '') + '">';
        html += '<span class="bm-icon">🔖</span>';
        html += '<div class="bm-info">';
        html += '<div class="bm-title">' + R.escapeHtml(b.title || b.bookTitle || '未命名') + '</div>';
        if (b.page) html += '<div class="bm-page">第 ' + b.page + ' 页</div>';
        html += '</div>';
        html += '<button class="bm-delete" title="删除书签">✕</button>';
        html += '</div>';
      });
      list.innerHTML = html;

      // 点击跳转
      list.querySelectorAll('.bookmark-item').forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.closest('.bm-delete')) return;
          pushNavHistory();
          var targetBookId = el.dataset.bookId;
          var page = parseInt(el.dataset.page);
          var cfi = el.dataset.cfi;

          if (targetBookId !== (state.currentBook ? state.currentBook.id : null)) {
            var allBooks = (window.EBOOK_CATALOG || []).concat(
              JSON.parse(localStorage.getItem('reader-local-books') || '[]')
            );
            var book = allBooks.filter(function (b) { return b.id === targetBookId; })[0];
            if (book) {
              R.loadBook(book);
              if (page) setTimeout(function () { R.jumpToPdfPage(page); }, 1500);
            }
          } else if (page && state.pdfDoc) {
            R.jumpToPdfPage(page);
          } else if (cfi && state.epubRendition) {
            try { state.epubRendition.display(cfi); } catch (e) {}
          }
          overlay.style.display = 'none';
        });
      });

      // 删除
      list.querySelectorAll('.bm-delete').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var itemEl = btn.closest('.bookmark-item');
          var targetBookId = itemEl.dataset.bookId;
          var bmId = ''; // 从 data 推断
          state.bookmarks[targetBookId] = (state.bookmarks[targetBookId] || []).filter(function (b) {
            return String(b.page) !== itemEl.dataset.page || b.cfi !== itemEl.dataset.cfi;
          });
          saveBookmarks();
          showBookmarksPanel();
        });
      });
    }

    overlay.style.display = '';
  }

  function hideBookmarksPanel() {
    var overlay = document.getElementById('bookmarksOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  // 重置所有格式相关按钮的 active 状态
  function resetActiveButtons() {
    var btnAnn = document.getElementById('btnAnnotations');
    var btnDual = document.getElementById('btnDualPage');
    var btnThumb = document.getElementById('btnThumbnails');
    if (btnAnn) btnAnn.classList.remove('active');
    if (btnDual) btnDual.classList.remove('active');
    if (btnThumb) btnThumb.classList.remove('active');
    state.annotationsSidebarOpen = false;
    state.dualPageMode = false;
    state.thumbnailsOpen = false;
  }
  R.resetActiveButtons = resetActiveButtons;

  // ====== PDF 双页模式（纯 CSS flexbox，无需 DOM 操作） ======
  function toggleDualPageMode() {
    if (state.currentFormat !== 'pdf') return;
    state.dualPageMode = !state.dualPageMode;
    var pdfView = document.getElementById('pdfView');
    if (pdfView) {
      pdfView.classList.toggle('dual-page', state.dualPageMode);
    }
    var btn = document.getElementById('btnDualPage');
    if (btn) btn.classList.toggle('active', state.dualPageMode);
    if (!state.dualPageMode) {
      var wrapper = pdfView.querySelector('.pdf-page-wrapper[data-page="' + state.pdfPage + '"]');
      if (wrapper) wrapper.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }

  // ====== PDF 页面缩略图 ======
  function toggleThumbnailsStrip() {
    if (state.currentFormat !== 'pdf') return;
    var strip = document.getElementById('thumbnailsStrip');
    if (!strip) return;
    strip.classList.toggle('collapsed');
    state.thumbnailsOpen = !strip.classList.contains('collapsed');
    var btn = document.getElementById('btnThumbnails');
    if (btn) btn.classList.toggle('active', state.thumbnailsOpen);
    if (state.thumbnailsOpen) {
      renderThumbnails();
    }
  }

  function renderThumbnails() {
    var inner = document.getElementById('thumbnailsInner');
    if (!inner || !state.pdfDoc) return;
    inner.innerHTML = '';

    var total = state.pdfTotal;
    var thumbScale = 0.15;

    for (var i = 1; i <= total; i++) {
      (function (pageNum) {
        var item = document.createElement('div');
        item.className = 'thumb-item';
        if (pageNum === state.pdfPage) item.classList.add('active');
        item.title = '第 ' + pageNum + ' 页';
        item.addEventListener('click', function () {
          R.jumpToPdfPage(pageNum);
        });

        var canvas = document.createElement('canvas');
        canvas.className = 'thumb-canvas';
        item.appendChild(canvas);

        var label = document.createElement('div');
        label.className = 'thumb-label';
        label.textContent = pageNum;
        item.appendChild(label);

        inner.appendChild(item);

        // 懒加载：使用 IntersectionObserver
        if (window.IntersectionObserver) {
          var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                renderThumbnailCanvas(pageNum, canvas, thumbScale);
                observer.unobserve(item);
              }
            });
          }, { root: inner, rootMargin: '200px' });
          observer.observe(item);
        } else {
          // 降级：延迟渲染
          setTimeout(function () { renderThumbnailCanvas(pageNum, canvas, thumbScale); }, pageNum * 30);
        }
      })(i);
    }
  }

  function renderThumbnailCanvas(pageNum, canvas, scale) {
    if (!state.pdfDoc) return;
    state.pdfDoc.getPage(pageNum).then(function (page) {
      var viewport = page.getViewport({ scale: scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      var ctx = canvas.getContext('2d');
      page.render({ canvasContext: ctx, viewport: viewport });
    }).catch(function () {});
  }

  // 更新缩略图高亮
  function updateThumbnailHighlight(pageNum) {
    var inner = document.getElementById('thumbnailsInner');
    if (!inner) return;
    inner.querySelectorAll('.thumb-item').forEach(function (item) {
      item.classList.toggle('active', parseInt(item.title.match(/\d+/)) === pageNum);
    });
    // 滚动到可见
    var activeItem = inner.querySelector('.thumb-item.active');
    if (activeItem) activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // ====== 事件绑定 ======
  function bindNavigationEvents() {
    var btnBookmark = document.getElementById('btnBookmark');
    if (btnBookmark) {
      btnBookmark.addEventListener('click', toggleBookmark);
      // 长按显示书签列表
      btnBookmark.addEventListener('dblclick', function () {
        showBookmarksPanel();
      });
    }

    var btnDual = document.getElementById('btnDualPage');
    if (btnDual) btnDual.addEventListener('click', toggleDualPageMode);

    var btnThumb = document.getElementById('btnThumbnails');
    if (btnThumb) btnThumb.addEventListener('click', toggleThumbnailsStrip);

    // 书签面板
    var btnClose = document.getElementById('bookmarksPanelClose');
    if (btnClose) btnClose.addEventListener('click', hideBookmarksPanel);

    var overlay = document.getElementById('bookmarksOverlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) hideBookmarksPanel();
      });
    }

    // 键盘
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        hideBookmarksPanel();
      }
    });
  }

  // ====== 暴露 ======
  R.toggleBookmark = toggleBookmark;
  R.showBookmarksPanel = showBookmarksPanel;
  R.toggleDualPageMode = toggleDualPageMode;
  R.toggleThumbnailsStrip = toggleThumbnailsStrip;
  R.renderThumbnails = renderThumbnails;
  R.updateThumbnailHighlight = updateThumbnailHighlight;
  R.loadBookmarks = loadBookmarks;
  R.updateBookmarkButton = updateBookmarkButton;

  function initNavigation() {
    loadBookmarks();
    if (!_navBound) { bindNavigationEvents(); _navBound = true; }
  }
  R.initNavigation = initNavigation;

  function ready() {
    if (_navBound) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        if (!_navBound) { bindNavigationEvents(); _navBound = true; }
      });
    } else {
      bindNavigationEvents();
      _navBound = true;
    }
  }
  ready();
})();
