/**
 * 个人图书馆 — 标记持久化 + EPUB 高亮 + 标记面板 + 笔记 + 导出
 * 依赖 window.ReaderApp (app.js)
 */
(function annotationsModule() {
  'use strict';
  var R = window.ReaderApp;
  if (!R || !R.state) { setTimeout(annotationsModule, 50); return; }

  var state = R.state;

  // ====== 持久化 ======
  function loadAnnotations(bookId) {
    if (!bookId) { state.annotations = {}; return; }
    try {
      var raw = localStorage.getItem('reader-annotations');
      var all = raw ? JSON.parse(raw) : {};
      state.annotations = all[bookId] || { strokes: {}, epubHighlights: [] };
      // 恢复 PDF 笔迹到 pdfStrokes
      var loadedStrokes = state.annotations.strokes || {};
      state.pdfStrokes = {};
      Object.keys(loadedStrokes).forEach(function (page) {
        state.pdfStrokes[parseInt(page)] = loadedStrokes[page];
      });
    } catch (e) {
      state.annotations = { strokes: {}, epubHighlights: [] };
    }
  }

  function saveAnnotations(bookId) {
    if (!bookId) return;
    try {
      // 同步 pdfStrokes 到 annotations
      if (state.currentFormat === 'pdf') {
        state.annotations.strokes = {};
        Object.keys(state.pdfStrokes).forEach(function (page) {
          state.annotations.strokes[String(page)] = state.pdfStrokes[page];
        });
      }
      var raw = localStorage.getItem('reader-annotations');
      var all = raw ? JSON.parse(raw) : {};
      all[bookId] = state.annotations;
      localStorage.setItem('reader-annotations', JSON.stringify(all));
    } catch (e) { /* 静默失败 */ }
  }

  // ====== EPUB 文本高亮 ======
  function initEpubHighlight() {
    if (state.currentFormat !== 'epub' || !state.epubRendition) return;
    // 等待 iframe 就绪后注入高亮样式和事件
    setTimeout(injectEpubHighlightSupport, 800);
  }

  function injectEpubHighlightSupport() {
    var iframe = document.querySelector('#epubView iframe');
    if (!iframe) { setTimeout(injectEpubHighlightSupport, 500); return; }
    var doc;
    try { doc = iframe.contentDocument || iframe.contentWindow.document; } catch (e) { return; }
    if (!doc) return;

    // 注入高亮样式（只注入一次）
    if (!doc.getElementById('reader-highlight-style')) {
      var style = doc.createElement('style');
      style.id = 'reader-highlight-style';
      style.textContent = '.epub-highlight{background:rgba(255,235,59,0.4);cursor:pointer;border-radius:2px;transition:background 0.15s;}' +
        '.epub-highlight:hover{background:rgba(255,235,59,0.6);}' +
        '.epub-highlight.has-note{border-bottom:2px dotted #f59e0b;}' +
        '.epub-highlight.green{background:rgba(76,175,80,0.35);}' +
        '.epub-highlight.green:hover{background:rgba(76,175,80,0.55);}' +
        '.epub-highlight.red{background:rgba(244,67,54,0.3);}' +
        '.epub-highlight.red:hover{background:rgba(244,67,54,0.5);}' +
        '.epub-highlight.blue{background:rgba(33,150,243,0.3);}' +
        '.epub-highlight.blue:hover{background:rgba(33,150,243,0.5);}';
      doc.head.appendChild(style);
    }

    // 监听选中文本（避免重复绑定）
    if (!doc._highlightListenerBound) {
      doc._highlightListenerBound = true;
      doc.addEventListener('mouseup', function (e) {
        var evt = e;
        setTimeout(function () {
          handleEpubSelection(doc, evt);
        }, 10);
      });
    }

    // 点击已有高亮 → 编辑笔记（避免重复绑定）
    if (!doc._highlightClickBound) {
      doc._highlightClickBound = true;
      doc.addEventListener('click', function (e) {
        var target = e.target;
        // 向上查找 .epub-highlight 元素
        var hl = target.closest ? target.closest('.epub-highlight') : null;
        if (!hl) {
          // closest 可能不存在于 iframe 的 DOM，手动查找
          while (target && target !== doc.body) {
            if (target.classList && target.classList.contains('epub-highlight')) { hl = target; break; }
            target = target.parentElement;
          }
        }
        if (!hl) {
          // 点击空白区域 → 自动保存并关闭笔记弹窗
          dismissNotePopup(true);
          return;
        }
        e.stopPropagation();
        e.preventDefault();
        handleEpubHighlightClick(hl, doc);
      });
    }
  }

  // 获取颜色对应的 CSS class
  function getHighlightColorClass(color) {
    if (!color) return '';
    if (color.indexOf('76,175,80') !== -1) return 'green';
    if (color.indexOf('244,67,54') !== -1) return 'red';
    if (color.indexOf('33,150,243') !== -1) return 'blue';
    return ''; // 默认黄色，不需要额外 class
  }

  function handleEpubSelection(doc, mouseEvent) {
    if (!state.markerMode) return;
    var sel = doc.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

    var text = sel.toString().trim();
    if (text.length < 2) return;

    // 获取 CFI（使用当前位置，保证跳转有效）
    var cfi;
    try {
      if (state.epubRendition) {
        var loc = state.epubRendition.currentLocation();
        if (loc && loc.start && loc.start.cfi) cfi = loc.start.cfi;
      }
    } catch (e) { /* CFI 获取失败 */ }

    // 获取选中文字在视口中的位置
    var selViewportPos = getSelectionViewportPos(doc, sel);

    var highlight = {
      id: 'h_' + Date.now(),
      cfi: cfi || '',
      text: text,
      color: state.penColor,
      note: '',
      createdAt: Date.now()
    };

    if (!state.annotations.epubHighlights) state.annotations.epubHighlights = [];
    state.annotations.epubHighlights.push(highlight);
    saveAnnotations(state.currentBook ? state.currentBook.id : null);

    // 直接在 DOM 中包裹选中文本（不依赖 epub.js annotations API）
    wrapSelectionInSpan(doc, sel, highlight);
    renderAnnotationsList();

    // 弹出笔记（在选中文字下方）
    var mx, my;
    if (selViewportPos) {
      mx = selViewportPos.left + (selViewportPos.right - selViewportPos.left) / 2;
      my = selViewportPos.bottom;
    } else if (mouseEvent) {
      mx = mouseEvent.clientX;
      my = mouseEvent.clientY;
    }
    showNotePopupForAnnotation(highlight, mx, my);

    // 保留选中以便用户看到高亮位置
    setTimeout(function () {
      try { sel.removeAllRanges(); } catch (e) {}
    }, 300);
  }

  // 直接在 DOM 中包裹选中文本
  function wrapSelectionInSpan(doc, sel, highlight) {
    try {
      var range = sel.getRangeAt(0);
      var span = doc.createElement('span');
      span.classList.add('epub-highlight');
      var colorClass = getHighlightColorClass(highlight.color);
      if (colorClass) span.classList.add(colorClass);
      span.dataset.annId = highlight.id;
      span.title = highlight.note || highlight.text;
      if (highlight.note) span.classList.add('has-note');

      try {
        range.surroundContents(span);
      } catch (e2) {
        // surroundContents 跨元素边界时失败，改用 extractContents + insertNode
        var frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      }
    } catch (e) { /* DOM 操作失败，静默忽略 */ }
  }

  // 获取选区相对于视口的坐标
  function getSelectionViewportPos(doc, sel) {
    try {
      var range = sel.getRangeAt(0);
      var rect = range.getBoundingClientRect();
      var iframe = document.querySelector('#epubView iframe');
      if (iframe) {
        var iframeRect = iframe.getBoundingClientRect();
        return {
          left: iframeRect.left + rect.left,
          top: iframeRect.top + rect.top,
          right: iframeRect.left + rect.right,
          bottom: iframeRect.top + rect.bottom
        };
      }
      return rect;
    } catch (e) { return null; }
  }

  // 点击已有高亮 → 查找对应批注并弹出笔记
  function handleEpubHighlightClick(hl, doc) {
    if (!state.annotations.epubHighlights) return;
    // 通过 data-id 匹配
    var annId = hl.dataset.annId;
    var ann = null;
    if (annId) {
      var found = state.annotations.epubHighlights.filter(function (h) { return h.id === annId; });
      if (found.length > 0) ann = found[0];
    }
    // 降级：通过文本匹配
    if (!ann) {
      var hlText = (hl.textContent || '').trim();
      var matches = state.annotations.epubHighlights.filter(function (h) { return h.text === hlText; });
      if (matches.length > 0) ann = matches[matches.length - 1];
    }
    if (!ann) return;

    // 获取高亮元素在视口中的位置
    var rect = hl.getBoundingClientRect();
    var iframe = document.querySelector('#epubView iframe');
    if (iframe) {
      var ifr = iframe.getBoundingClientRect();
      rect = {
        left: ifr.left + rect.left,
        top: ifr.top + rect.top,
        right: ifr.left + rect.right,
        bottom: ifr.top + rect.bottom
      };
    }
    showNotePopupForAnnotation(ann,
      rect.left + (rect.right - rect.left) / 2,
      rect.bottom);
  }

  // 在 iframe 文档中搜索文本并包裹为高亮 span
  function wrapTextInDoc(doc, highlight) {
    if (!highlight.text) return;
    var text = highlight.text;
    var walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    while (walker.nextNode()) {
      var node = walker.currentNode;
      // 跳过已经在高亮 span 内的文本节点
      if (node.parentElement && node.parentElement.classList.contains('epub-highlight')) continue;
      // 跳过脚本和样式
      if (node.parentElement && (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE')) continue;
      if (node.nodeValue && node.nodeValue.indexOf(text) !== -1) {
        textNodes.push(node);
      }
    }
    // 只包裹第一个匹配（避免重复高亮）
    if (textNodes.length > 0) {
      var node = textNodes[0];
      var idx = node.nodeValue.indexOf(text);
      if (idx !== -1) {
        var before = node.nodeValue.substring(0, idx);
        var match = node.nodeValue.substring(idx, idx + text.length);
        var after = node.nodeValue.substring(idx + text.length);
        var parent = node.parentNode;

        var span = doc.createElement('span');
        span.classList.add('epub-highlight');
        var colorClass = getHighlightColorClass(highlight.color);
        if (colorClass) span.classList.add(colorClass);
        span.dataset.annId = highlight.id;
        span.title = highlight.note || highlight.text;
        if (highlight.note) span.classList.add('has-note');
        span.textContent = match;

        var afterNode = doc.createTextNode(after);
        node.nodeValue = before;
        parent.insertBefore(span, node.nextSibling);
        if (after) {
          parent.insertBefore(afterNode, span.nextSibling);
        }
      }
    }
  }

  function renderEpubHighlights() {
    if (state.currentFormat !== 'epub') return;
    if (!state.annotations.epubHighlights || !state.annotations.epubHighlights.length) return;
    // epub.js 重渲染后需重新注入
    setTimeout(function () {
      var iframe = document.querySelector('#epubView iframe');
      if (!iframe) return;
      var doc;
      try { doc = iframe.contentDocument || iframe.contentWindow.document; } catch (e) { return; }
      if (!doc || !doc.body) return;
      state.annotations.epubHighlights.forEach(function (h) {
        wrapTextInDoc(doc, h);
      });
    }, 600);
  }

  R.renderEpubHighlights = renderEpubHighlights;

  // ====== 笔迹完成后处理 ======
  // 由 app.js 在 endDraw 中调用
  function onStrokeCompleted(page) {
    var bookId = state.currentBook ? state.currentBook.id : null;
    if (!bookId) return;
    // 同步到 annotations
    state.annotations.strokes = state.annotations.strokes || {};
    state.annotations.strokes[String(page)] = state.pdfStrokes[page] || [];
    saveAnnotations(bookId);

    // 找最近一笔
    var strokes = state.pdfStrokes[page] || [];
    if (strokes.length > 0) {
      var last = strokes[strokes.length - 1];
      last.page = page;
      last.id = 's_' + Date.now();
      last.createdAt = Date.now();
      showNotePopupForAnnotation(last);
    }

    renderAnnotationsList();
  }

  // ====== 笔记弹窗 ======
  function showNotePopupForAnnotation(ann, mouseX, mouseY) {
    state.pendingAnnotation = ann;
    var popup = document.getElementById('notePopup');
    var input = document.getElementById('notePopupInput');
    if (!popup || !input) return;

    input.value = ann.note || '';
    popup.style.display = 'block';

    // 定位（position: fixed，使用视口坐标）
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    if (mouseX !== undefined && mouseY !== undefined) {
      var left = mouseX - 150;
      var top = mouseY + 20;
      if (left < 10) left = 10;
      if (left + 320 > vw) left = vw - 330;
      if (top + 110 > vh) top = mouseY - 120;
      if (top < 10) top = 10;
      popup.style.left = left + 'px';
      popup.style.top = top + 'px';
    } else {
      popup.style.left = Math.max(10, (vw - 300) / 2) + 'px';
      popup.style.top = Math.max(10, vh * 0.5) + 'px';
    }

    setTimeout(function () { input.focus(); }, 100);
  }

  function saveNote() {
    if (!state.pendingAnnotation) return;
    var input = document.getElementById('notePopupInput');
    var noteText = input ? input.value.trim() : '';
    state.pendingAnnotation.note = noteText;

    var bookId = state.currentBook ? state.currentBook.id : null;
    if (bookId) {
      saveAnnotations(bookId);
    }
    updateHighlightDom(state.pendingAnnotation);
    dismissNotePopup(false); // 已手动保存，不再自动保存
    renderAnnotationsList();
  }

  function dismissNotePopup(saveFirst) {
    // 如果有输入内容，自动保存
    if (saveFirst !== false && state.pendingAnnotation) {
      var input = document.getElementById('notePopupInput');
      if (input && input.value.trim()) {
        state.pendingAnnotation.note = input.value.trim();
        saveAnnotations(state.currentBook ? state.currentBook.id : null);
        updateHighlightDom(state.pendingAnnotation);
        renderAnnotationsList();
      }
    }
    state.pendingAnnotation = null;
    var popup = document.getElementById('notePopup');
    if (popup) popup.style.display = 'none';
  }

  // 同步 DOM 高亮元素：添加/移除 has-note class 和 title
  function updateHighlightDom(ann) {
    if (!ann || !ann.id) return;
    if (state.currentFormat !== 'epub') return;
    var iframe = document.querySelector('#epubView iframe');
    if (!iframe) return;
    var doc;
    try { doc = iframe.contentDocument || iframe.contentWindow.document; } catch (e) { return; }
    if (!doc) return;
    var span = doc.querySelector('.epub-highlight[data-ann-id="' + ann.id + '"]');
    if (span) {
      span.title = ann.note || ann.text || '';
      if (ann.note) {
        span.classList.add('has-note');
      } else {
        span.classList.remove('has-note');
      }
    }
  }

  // ====== 标记列表面板 ======
  function toggleAnnotationsSidebar() {
    var sidebar = document.getElementById('annotationsSidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('collapsed');
    state.annotationsSidebarOpen = !sidebar.classList.contains('collapsed');
    var btn = document.getElementById('btnAnnotations');
    if (btn) btn.classList.toggle('active', state.annotationsSidebarOpen);
    if (state.annotationsSidebarOpen) {
      renderAnnotationsList();
    }
  }

  function renderAnnotationsList() {
    var list = document.getElementById('annotationsList');
    if (!list) return;

    var bookId = state.currentBook ? state.currentBook.id : null;
    if (!bookId) {
      list.innerHTML = '<p class="annotations-empty">请先选择一本书</p>';
      return;
    }

    // 同步当前笔迹
    if (state.currentFormat === 'pdf') {
      state.annotations.strokes = state.annotations.strokes || {};
      Object.keys(state.pdfStrokes).forEach(function (p) {
        state.annotations.strokes[p] = state.pdfStrokes[p] || [];
      });
    }

    var annotations = state.annotations;
    var allItems = [];

    // 收集笔迹
    var strokes = annotations.strokes || {};
    Object.keys(strokes).forEach(function (page) {
      (strokes[page] || []).forEach(function (s, idx) {
        allItems.push({
          id: s.id || ('s_' + page + '_' + idx),
          type: 'stroke',
          page: parseInt(page),
          color: s.color || 'rgba(255,235,59,0.45)',
          note: s.note || '',
          createdAt: s.createdAt || 0,
          order: parseInt(page) * 1000 + idx
        });
      });
    });

    // 收集文本类标记（高亮 + 自由笔记）
    (annotations.epubHighlights || []).forEach(function (h) {
      allItems.push({
        id: h.id,
        type: h.type || 'highlight',
        text: h.text || '',
        cfi: h.cfi,
        page: h.page || null,
        color: h.color || 'rgba(255,235,59,0.45)',
        note: h.note || '',
        createdAt: h.createdAt || 0,
        order: h.createdAt
      });
    });

    if (allItems.length === 0) {
      list.innerHTML = '<p class="annotations-empty">暂无标记</p>';
      return;
    }

    // 排序
    var sortBy = document.getElementById('annotationsSort');
    var sort = sortBy ? sortBy.value : 'page';
    if (sort === 'time') {
      allItems.sort(function (a, b) { return b.createdAt - a.createdAt; });
    } else {
      allItems.sort(function (a, b) { return a.order - b.order; });
    }

    // 筛选
    var filterBtn = document.querySelector('.annotations-filter-btn.active');
    var filter = filterBtn ? filterBtn.dataset.filter : 'all';
    if (filter === 'stroke') allItems = allItems.filter(function (i) { return i.type === 'stroke'; });
    if (filter === 'highlight') allItems = allItems.filter(function (i) { return i.type === 'highlight'; });
    if (filter === 'note') allItems = allItems.filter(function (i) { return i.type === 'freetext' || !!i.note; });

    var html = '';
    allItems.forEach(function (item) {
      var typeBadge, colorHex;
      if (item.type === 'freetext') {
        typeBadge = '📝 笔记';
        colorHex = '#6366f1';
      } else if (item.type === 'stroke') {
        typeBadge = '✏️ 笔迹';
        colorHex = extractColorHex(item.color);
      } else {
        typeBadge = '📖 高亮';
        colorHex = extractColorHex(item.color);
      }
      html += '<div class="annotation-item" data-id="' + item.id + '" data-type="' + item.type + '" data-page="' + (item.page || '') + '" data-cfi="' + (item.cfi || '') + '" data-text="' + R.escapeHtml(item.text || '') + '">';
      html += '<span class="ann-color-dot" style="background:' + colorHex + ';"></span>';
      html += '<div class="ann-info">';
      html += '<div class="ann-page"><span class="ann-type-badge">' + typeBadge + '</span>';
      if (item.page) html += ' 第 ' + item.page + ' 页';
      html += '</div>';
      if (item.text) html += '<div class="ann-text">' + R.escapeHtml(item.text.substring(0, 120)) + '</div>';
      if (item.note) html += '<div class="ann-note">💬 ' + R.escapeHtml(item.note.substring(0, 80)) + '</div>';
      html += '<div class="ann-time">' + formatTime(item.createdAt) + '</div>';
      html += '</div>';
      html += '<button class="ann-delete" title="删除标记">✕</button>';
      html += '</div>';
    });
    list.innerHTML = html;

    // 单击 = 跳转原文，双击笔记文字 = 编辑
    list.querySelectorAll('.annotation-item').forEach(function (el) {
      var jump = function () {
        var page = parseInt(el.dataset.page);
        var cfi = el.dataset.cfi;
        var type = el.dataset.type;
        if (type === 'highlight' && cfi && state.epubRendition) {
          try { state.epubRendition.display(cfi); } catch (e) {}
        } else if (page && state.pdfDoc) {
          R.jumpToPdfPage(page);
        } else if (type === 'highlight' && el.dataset.text && (state.currentFormat === 'mobi' || state.currentFormat === 'azw3')) {
          var tv = document.getElementById('textView');
          if (tv) {
            var txt = el.dataset.text;
            var h = tv.innerHTML;
            var idx = h.indexOf(txt);
            if (idx !== -1) tv.scrollTop = (idx / h.length) * tv.scrollHeight;
          }
        }
      };
      el.addEventListener('click', function (e) {
        if (e.target.closest('.ann-delete')) return;
        jump();
      });
      // 双击笔记文字 = 编辑笔记
      var noteEl = el.querySelector('.ann-note');
      if (noteEl) {
        noteEl.addEventListener('dblclick', function (e) {
          e.stopPropagation();
          e.preventDefault();
          editExistingNote(el.dataset.id, el.dataset.type);
        });
      }
    });

    // 删除按钮
    list.querySelectorAll('.ann-delete').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var itemEl = btn.closest('.annotation-item');
        var id = itemEl.dataset.id;
        var type = itemEl.dataset.type;
        deleteAnnotation(id, type);
      });
    });
  }

  // 编辑已有笔记
  function editExistingNote(id, type) {
    var ann = null;
    if (type === 'stroke') {
      Object.keys(state.pdfStrokes).forEach(function (page) {
        (state.pdfStrokes[page] || []).forEach(function (s, i) {
          if ((s.id || ('s_' + page + '_' + i)) === id) ann = s;
        });
      });
    } else {
      (state.annotations.epubHighlights || []).forEach(function (h) {
        if (h.id === id) ann = h;
      });
    }
    if (ann) {
      if (type === 'stroke' && !ann.page) ann.page = parseInt(Object.keys(state.pdfStrokes).find(function (p) {
        return (state.pdfStrokes[p] || []).indexOf(ann) !== -1;
      }));
      showNotePopupForAnnotation(ann);
    }
  }

  function deleteAnnotation(id, type) {
    if (type === 'stroke') {
      Object.keys(state.pdfStrokes).forEach(function (page) {
        state.pdfStrokes[page] = (state.pdfStrokes[page] || []).filter(function (s, i) {
          return (s.id || ('s_' + page + '_' + i)) !== id;
        });
        if (state.pdfStrokes[page].length === 0) delete state.pdfStrokes[page];
      });
    } else {
      // highlight / freetext
      state.annotations.epubHighlights = (state.annotations.epubHighlights || []).filter(function (h) {
        return h.id !== id;
      });
    }
    saveAnnotations(state.currentBook ? state.currentBook.id : null);
    renderAnnotationsList();
    if (state.currentFormat === 'pdf') {
      var page = R.getVisiblePage();
      R.redrawPageStrokes(page);
    }
  }

  function extractColorHex(rgba) {
    var m = rgba.match(/[\d.]+/g);
    if (m && m.length >= 3) {
      return '#' + [parseInt(m[0]), parseInt(m[1]), parseInt(m[2])]
        .map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
    }
    return '#f5d742';
  }

  function formatTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0');
  }

  // ====== 导出 Markdown（笔迹笔记 + 高亮原文+笔记 + 自由文本） ======
  function exportAnnotationsAsMarkdown() {
    var bookId = state.currentBook ? state.currentBook.id : null;
    if (!bookId) return;

    // 同步
    if (state.currentFormat === 'pdf') {
      state.annotations.strokes = state.annotations.strokes || {};
      Object.keys(state.pdfStrokes).forEach(function (p) {
        state.annotations.strokes[p] = state.pdfStrokes[p] || [];
      });
    }

    var title = state.currentBook ? state.currentBook.title : '未命名';
    var md = '# ' + title + ' — 读书笔记\n\n';
    md += '> 导出时间：' + new Date().toLocaleString() + '\n\n';

    var hasContent = false;

    // 1. PDF 笔迹（仅导出有笔记的）
    var strokes = state.annotations.strokes || {};
    var strokeKeys = Object.keys(strokes).filter(function (page) {
      return (strokes[page] || []).some(function (s) { return !!s.note; });
    }).sort(function (a, b) { return parseInt(a) - parseInt(b); });

    if (strokeKeys.length > 0) {
      md += '## ✏️ 笔迹笔记\n\n';
      strokeKeys.forEach(function (page) {
        var notesOnPage = (strokes[page] || []).filter(function (s) { return !!s.note; });
        if (notesOnPage.length === 0) return;
        md += '### 第 ' + page + ' 页\n\n';
        notesOnPage.forEach(function (s, i) {
          md += (i + 1) + '. ' + s.note + '\n';
        });
        md += '\n';
      });
      hasContent = true;
    }

    // 2. EPUB/MOBI 文本高亮（导出所有高亮及其原文，有笔记的附笔记）
    var highlights = (state.annotations.epubHighlights || []).filter(function (h) {
      return (!h.type || h.type === 'highlight') && !!h.text;
    });
    if (highlights.length > 0) {
      md += '## 📖 文本高亮\n\n';
      highlights.forEach(function (h, i) {
        md += '### ' + (i + 1) + '.\n\n';
        md += '> ' + h.text + '\n\n';
        if (h.note) {
          md += '💬 ' + h.note + '\n\n';
        }
        md += '---\n\n';
      });
      hasContent = true;
    }

    // 3. 自由文本笔记（📝 按钮写的）
    var freetexts = (state.annotations.epubHighlights || []).filter(function (h) {
      return h.type === 'freetext' && !!h.text;
    });
    if (freetexts.length > 0) {
      md += '## 📝 文本笔记\n\n';
      freetexts.forEach(function (h, i) {
        md += '### ' + (i + 1) + '.';
        if (h.page) md += ' （第 ' + h.page + ' 页）';
        md += '\n\n';
        md += h.text + '\n\n';
        md += '---\n\n';
      });
      hasContent = true;
    }

    if (!hasContent) {
      showToastNote('没有可导出的内容。\n\n画一笔并输入笔记，或使用 📝 写文本笔记。');
      return;
    }

    // 下载
    var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = title.replace(/[\/\\:*?"<>|]/g, '_') + '_笔记.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ====== 自由文本笔记 ======
  function showFreeNoteDialog() {
    var dialog = document.getElementById('freeTextDialog');
    var input = document.getElementById('freeTextInput');
    var locEl = document.getElementById('freeTextLocation');
    if (!dialog || !input) return;

    // 显示当前位置
    var locText = '';
    if (state.currentFormat === 'pdf' && state.pdfDoc) {
      locText = '📍 ' + (state.currentBook ? state.currentBook.title : '') + ' — 第 ' + state.pdfPage + ' 页';
    } else if (state.currentFormat === 'epub') {
      locText = '📍 ' + (state.currentBook ? state.currentBook.title : '');
    } else {
      locText = '📍 ' + (state.currentBook ? state.currentBook.title : '');
    }
    if (locEl) locEl.textContent = locText;

    input.value = '';
    dialog.style.display = '';
    setTimeout(function () { input.focus(); }, 100);
  }

  function hideFreeNoteDialog() {
    var dialog = document.getElementById('freeTextDialog');
    if (dialog) dialog.style.display = 'none';
  }

  function saveFreeNote() {
    var input = document.getElementById('freeTextInput');
    var text = input ? input.value.trim() : '';
    if (!text) { hideFreeNoteDialog(); return; }

    var bookId = state.currentBook ? state.currentBook.id : null;
    if (!bookId) { hideFreeNoteDialog(); return; }

    var note = {
      id: 'fn_' + Date.now(),
      type: 'freetext',
      text: text,
      page: state.currentFormat === 'pdf' ? state.pdfPage : null,
      createdAt: Date.now()
    };

    if (!state.annotations.epubHighlights) state.annotations.epubHighlights = [];
    state.annotations.epubHighlights.push(note);
    saveAnnotations(bookId);

    hideFreeNoteDialog();
    showToastNote('✅ 文本笔记已保存');
  }

  function showToastNote(msg) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = '';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.style.display = 'none'; }, 1800);
  }

  // ====== MOBI / 纯文本 选中高亮 ======
  function initTextviewHighlight() {
    var tv = document.getElementById('textView');
    if (!tv || tv._highlightBound) return;
    tv._highlightBound = true;
    tv.addEventListener('mouseup', function (e) {
      if (!state.markerMode) return;
      setTimeout(function () {
        var sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
        var text = sel.toString().trim();
        if (text.length < 2) return;

        var highlight = {
          id: 'h_' + Date.now(),
          text: text,
          color: state.penColor,
          note: '',
          createdAt: Date.now()
        };
        if (!state.annotations.epubHighlights) state.annotations.epubHighlights = [];
        state.annotations.epubHighlights.push(highlight);
        saveAnnotations(state.currentBook ? state.currentBook.id : null);
        renderAnnotationsList();
        showNotePopupForAnnotation(highlight, e.clientX, e.clientY);
        sel.removeAllRanges();
      }, 10);
    });
  }

  // ====== 事件绑定 ======
  function bindAnnotationsEvents() {
    // 📋 笔记按钮：打开/关闭标记面板
    var btnAnn = document.getElementById('btnAnnotations');
    if (btnAnn) {
      btnAnn.addEventListener('click', function () {
        var sidebar = document.getElementById('annotationsSidebar');
        if (!sidebar) return;
        var wasOpen = !sidebar.classList.contains('collapsed');
        if (wasOpen) {
          sidebar.classList.add('collapsed');
          state.annotationsSidebarOpen = false;
          btnAnn.classList.remove('active');
        } else {
          sidebar.classList.remove('collapsed');
          state.annotationsSidebarOpen = true;
          btnAnn.classList.add('active');
          renderAnnotationsList();
        }
      });
    }

    // 点击标记面板标题收起
    var annHeader = document.querySelector('.annotations-sidebar-header h3');
    if (annHeader) {
      annHeader.addEventListener('click', function () {
        var sidebar = document.getElementById('annotationsSidebar');
        if (!sidebar) return;
        sidebar.classList.add('collapsed');
        state.annotationsSidebarOpen = false;
        if (btnAnn) btnAnn.classList.remove('active');
      });
    }

    // 📝 文本按钮：添加自由文本笔记
    var btnFreeNote = document.getElementById('btnFreeNote');
    if (btnFreeNote) {
      btnFreeNote.addEventListener('click', function () {
        showFreeNoteDialog();
      });
    }

    var btnExport = document.getElementById('btnExportAnnotations');
    if (btnExport) btnExport.addEventListener('click', exportAnnotationsAsMarkdown);

    // 筛选按钮
    document.querySelectorAll('.annotations-filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.annotations-filter-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderAnnotationsList();
      });
    });

    // 排序
    var sortSel = document.getElementById('annotationsSort');
    if (sortSel) sortSel.addEventListener('change', renderAnnotationsList);

    // 笔记弹窗
    var noteSave = document.getElementById('notePopupSave');
    var noteDismiss = document.getElementById('notePopupDismiss');
    var noteInput = document.getElementById('notePopupInput');
    if (noteSave) noteSave.addEventListener('click', saveNote);
    if (noteDismiss) noteDismiss.addEventListener('click', dismissNotePopup);
    if (noteInput) {
      noteInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveNote(); }
        if (e.key === 'Escape') { e.preventDefault(); dismissNotePopup(true); }
      });
    }

    // 点击空白处自动保存并关闭
    document.addEventListener('click', function (e) {
      var popup = document.getElementById('notePopup');
      if (!popup || popup.style.display === 'none') return;
      if (!popup.contains(e.target)) {
        dismissNotePopup(true);
      }
    });

    // 自由文本笔记弹窗事件
    var freeTextSave = document.getElementById('freeTextSave');
    var freeTextClose = document.getElementById('freeTextClose');
    var freeTextInput = document.getElementById('freeTextInput');
    var freeTextDialog = document.getElementById('freeTextDialog');
    if (freeTextSave) freeTextSave.addEventListener('click', saveFreeNote);
    if (freeTextClose) freeTextClose.addEventListener('click', hideFreeNoteDialog);
    if (freeTextInput) {
      freeTextInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveFreeNote(); }
        if (e.key === 'Escape') { e.preventDefault(); hideFreeNoteDialog(); }
      });
    }
    if (freeTextDialog) {
      freeTextDialog.addEventListener('click', function (e) {
        if (e.target === freeTextDialog) hideFreeNoteDialog();
      });
    }

    // MOBI / 纯文本视图高亮
    initTextviewHighlight();
  }

  // ====== 暴露 ======
  R.loadAnnotations = loadAnnotations;
  R.saveAnnotations = saveAnnotations;
  R.initEpubHighlight = initEpubHighlight;
  R.onStrokeCompleted = onStrokeCompleted;
  R.renderAnnotationsList = renderAnnotationsList;
  R.exportAnnotationsAsMarkdown = exportAnnotationsAsMarkdown;
  R.deleteAnnotation = deleteAnnotation;

  var _annotationsEventsBound = false;
  function initAnnotations() {
    if (!_annotationsEventsBound) {
      bindAnnotationsEvents();
      _annotationsEventsBound = true;
    }
  }
  R.initAnnotations = initAnnotations;

  function ready() {
    if (!_annotationsEventsBound) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          if (!_annotationsEventsBound) { bindAnnotationsEvents(); _annotationsEventsBound = true; }
        });
      } else {
        bindAnnotationsEvents();
        _annotationsEventsBound = true;
      }
    }
  }
  ready();
})();
