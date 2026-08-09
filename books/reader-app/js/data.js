/**
 * 个人图书馆 — 数据导出/导入 + 本地书架拖拽导入
 * 依赖 window.ReaderApp (app.js)
 */
(function dataModule() {
  'use strict';
  var R = window.ReaderApp;
  if (!R || !R.state) { setTimeout(dataModule, 50); return; }
  var _dataBound = false;

  // ====== 自定义确认弹窗 ======
  function showConfirm(opts, onOk) {
    var overlay = document.getElementById('confirmOverlay');
    var icon = document.getElementById('confirmIcon');
    var title = document.getElementById('confirmTitle');
    var body = document.getElementById('confirmBody');
    var btnOk = document.getElementById('confirmOk');
    var btnCancel = document.getElementById('confirmCancel');
    if (!overlay) return;

    icon.textContent = opts.icon || '⚠️';
    title.textContent = opts.title || '确认操作';
    body.innerHTML = opts.body || '';
    btnOk.textContent = opts.okText || '确定';
    btnOk.className = 'ctrl-btn confirm-ok' + (opts.danger ? '' : ' confirm-ok-safe');
    if (!opts.danger) {
      btnOk.style.background = 'var(--primary)';
      btnOk.style.color = '#fff';
      btnOk.style.borderColor = 'var(--primary)';
    } else {
      btnOk.style.background = '#e53935';
      btnOk.style.color = '#fff';
      btnOk.style.borderColor = '#e53935';
    }

    overlay.style.display = '';

    function cleanup() {
      overlay.style.display = 'none';
    }

    btnOk.onclick = function () { cleanup(); if (onOk) onOk(); };
    btnCancel.onclick = cleanup;
    overlay.onclick = function (e) { if (e.target === overlay) cleanup(); };
  }

  function showToast(msg) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = '';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.style.display = 'none';
    }, 2000);
  }

  // ====== 清除全部本地数据 ======
  function clearAllData() {
    showConfirm({
      icon: '🗑',
      title: '清除所有本地数据',
      body: '将删除：<br>• 阅读进度<br>• 所有书签<br>• 主题和字体设置<br>• 本地导入的书籍<br>• 所有标记与笔记<br><br><b style="color:#e53935;">此操作不可撤销！</b>',
      okText: '确认清除',
      danger: true
    }, function () {
      showConfirm({
        icon: '⚠️',
        title: '再次确认',
        body: '真的要清除<b>所有</b>数据吗？<br>此操作后页面将自动刷新。',
        okText: '是的，清除',
        danger: true
      }, function () {
        var keys = ['reader-positions', 'reader-annotations', 'reader-bookmarks',
                    'reader-theme', 'reader-font-size', 'reader-local-books'];
        keys.forEach(function (key) {
          try { localStorage.removeItem(key); } catch (e) {}
        });
        showToast('✅ 所有数据已清除，即将刷新…');
        setTimeout(function () { location.reload(); }, 1500);
      });
    });
  }

  // ====== 导出全部数据 ======
  function exportAllData() {
    var data = {};
    var keys = ['reader-positions', 'reader-annotations', 'reader-bookmarks',
                'reader-theme', 'reader-font-size', 'reader-local-books'];
    keys.forEach(function (key) {
      try {
        var val = localStorage.getItem(key);
        if (val) data[key] = JSON.parse(val);
      } catch (e) { data[key] = null; }
    });

    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'reader-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ====== 导入全部数据 ======
  function importAllData(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        var imported = 0;
        Object.keys(data).forEach(function (key) {
          if (key.indexOf('reader-') === 0 && data[key] !== null) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            imported++;
          }
        });
        showToast('✅ 成功导入 ' + imported + ' 项数据，刷新后生效');
        // 如果导入了当前书籍的数据，重新加载
        if (R.state && R.state.currentBook) {
          if (R.loadAnnotations) R.loadAnnotations(R.state.currentBook.id);
          if (R.renderAnnotationsList) R.renderAnnotationsList();
        }
        if (R.loadBookmarks) R.loadBookmarks();
      } catch (err) {
        showToast('❌ 导入失败：无效的 JSON 文件');
      }
    };
    reader.readAsText(file);
  }

  function triggerImportFile() {
    var input = document.getElementById('importFileInput');
    if (input) input.click();
  }

  // ====== IndexedDB 文件存储 ======
  var DB_NAME = 'reader-local-files';
  var DB_STORE = 'files';

  function openDB() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore(DB_STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function saveFileToDB(id, buffer) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(buffer, id);
        tx.oncomplete = function () { db.close(); resolve(); };
        tx.onerror = function () { db.close(); reject(tx.error); };
      });
    });
  }

  function getFileFromDB(id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, 'readonly');
        var req = tx.objectStore(DB_STORE).get(id);
        req.onsuccess = function () { db.close(); resolve(req.result); };
        req.onerror = function () { db.close(); reject(req.error); };
      });
    });
  }

  function deleteFileFromDB(id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).delete(id);
        tx.oncomplete = function () { db.close(); resolve(); };
        tx.onerror = function () { db.close(); reject(tx.error); };
      });
    });
  }

  // ====== 移除本地导入的书籍 ======
  function removeLocalBook(bookId) {
    if (!bookId) return;
    var book = (window.EBOOK_CATALOG || []).filter(function (b) { return b.id === bookId; })[0];
    var title = book ? book.title : bookId;

    showConfirm({
      icon: '🗑',
      title: '移除本地书籍',
      body: '确定要移除 <b>' + (R.escapeHtml ? R.escapeHtml(title) : title) + '</b> 吗？<br><span style="color:var(--text-secondary);">书籍文件将从浏览器中删除。</span>',
      okText: '确认移除',
      danger: true
    }, function () {
      // 1. 从 IndexedDB 删除文件
      var localId = book && book.path ? book.path.split(':')[1] : bookId;
      if (localId) {
        deleteFileFromDB(localId).catch(function () {});
      }

      // 2. 从 localStorage 元数据中移除
      try {
        var localBooks = JSON.parse(localStorage.getItem('reader-local-books') || '[]');
        localBooks = localBooks.filter(function (b) { return b.id !== bookId; });
        localStorage.setItem('reader-local-books', JSON.stringify(localBooks));
      } catch (e) {}

      // 3. 从全局书单中移除
      window.EBOOK_CATALOG = (window.EBOOK_CATALOG || []).filter(function (b) { return b.id !== bookId; });

      // 4. 如果当前正在读这本书，清空阅读区
      if (R.state && R.state.currentBook && R.state.currentBook.id === bookId) {
        R.state.currentBook = null;
        R.state.currentFormat = null;
        if (R.showWelcome) R.showWelcome();
      }

      // 5. 刷新书架
      if (R.renderTree) R.renderTree();

      showToast('✅ 已移除「' + title + '」');
    });
  }

  // ====== 本地书架拖拽导入 ======
  function initDropZone() {
    document.addEventListener('dragenter', function (e) {
      e.preventDefault();
      var dropOverlay = document.getElementById('dropOverlay');
      if (dropOverlay) dropOverlay.style.display = '';
    });

    document.addEventListener('dragleave', function (e) {
      if (e.target === document || e.target === document.body) {
        var dropOverlay = document.getElementById('dropOverlay');
        if (dropOverlay) dropOverlay.style.display = 'none';
      }
    });

    document.addEventListener('dragover', function (e) { e.preventDefault(); });

    document.addEventListener('drop', function (e) {
      e.preventDefault();
      var dropOverlay = document.getElementById('dropOverlay');
      if (dropOverlay) dropOverlay.style.display = 'none';
      var files = e.dataTransfer.files;
      if (files && files.length > 0) handleFileDrop(files);
    });
  }

  function handleFileDrop(files) {
    var accepted = [];
    for (var i = 0; i < files.length; i++) {
      var name = files[i].name.toLowerCase();
      if (name.endsWith('.pdf') || name.endsWith('.epub')) accepted.push(files[i]);
    }
    if (accepted.length === 0) { showToast('⚠️ 仅支持 PDF 和 EPUB 文件'); return; }

    var localBooks = [];
    try { localBooks = JSON.parse(localStorage.getItem('reader-local-books') || '[]'); } catch (e) {}

    var processed = 0;
    accepted.forEach(function (file) {
      var exists = localBooks.some(function (b) { return b.originalName === file.name; });
      if (exists) { processed++; checkDone(); return; }

      var reader = new FileReader();
      reader.onload = function (e) {
        var buffer = e.target.result; // ArrayBuffer
        var format = file.name.toLowerCase().endsWith('.epub') ? 'epub' : 'pdf';
        var id = 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        var book = {
          id: id, title: file.name.replace(/\.(pdf|epub)$/i, ''),
          originalName: file.name, author: '本地导入',
          category: 'local_import', format: format,
          path: '__local__:' + id,  // 特殊路径标记
          description: '拖拽导入'
        };
        // 文件存 IndexedDB，元数据存 localStorage
        saveFileToDB(id, buffer).then(function () {
          localBooks.push(book);
          processed++;
          checkDone();
        }).catch(function () {
          showToast('❌ 保存 ' + file.name + ' 失败（文件过大）');
          processed++;
          checkDone();
        });
      };
      reader.onerror = function () { processed++; checkDone(); };
      reader.readAsArrayBuffer(file);
    });

    function checkDone() {
      if (processed >= accepted.length) {
        localStorage.setItem('reader-local-books', JSON.stringify(localBooks));
        mergeLocalBooks(localBooks);
        showToast('📚 成功导入，请查看"本地导入"分类');
      }
    }
  }

  function mergeLocalBooks(localBooks) {
    var catalog = (window.EBOOK_CATALOG || []).filter(function (b) { return b.category !== 'local_import'; });
    localBooks.forEach(function (b) { catalog.push(b); });
    window.EBOOK_CATALOG = catalog;
    // 直接刷新书架树
    if (R.renderTree) R.renderTree();
  }

  function loadLocalBooks() {
    try {
      var localBooks = JSON.parse(localStorage.getItem('reader-local-books') || '[]');
      if (localBooks.length > 0) mergeLocalBooks(localBooks);
    } catch (e) {}
  }

  // 拦截 loadBook 为本地书籍提供 IndexedDB 加载
  R._getLocalFile = getFileFromDB;

  // ====== 事件绑定 ======
  function bindDataEvents() {
    var btnClear = document.getElementById('btnClearAllData');
    if (btnClear) btnClear.addEventListener('click', clearAllData);

    var btnExport = document.getElementById('btnExportAll');
    if (btnExport) btnExport.addEventListener('click', exportAllData);

    var btnImport = document.getElementById('btnImportAll');
    if (btnImport) btnImport.addEventListener('click', triggerImportFile);

    var fileInput = document.getElementById('importFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files[0]) {
          importAllData(fileInput.files[0]);
          fileInput.value = '';
        }
      });
    }

    // 本地书架导入
    var localInput = document.getElementById('localBookInput');
    if (localInput) {
      localInput.addEventListener('change', function () {
        if (localInput.files && localInput.files.length > 0) {
          handleFileDrop(localInput.files);
          localInput.value = '';
        }
      });
    }

    // 侧栏底部「导入本地书」按钮
    var btnLocal = document.getElementById('btnImportLocal');
    if (btnLocal) {
      btnLocal.addEventListener('click', function () {
        var input = document.getElementById('localBookInput');
        if (input) input.click();
      });
    }

    // 帮助面板
    var btnHelp = document.getElementById('btnHelp');
    var helpOverlay = document.getElementById('helpOverlay');
    var helpClose = document.getElementById('helpPanelClose');
    if (btnHelp && helpOverlay) {
      btnHelp.addEventListener('click', function () {
        helpOverlay.style.display = '';
      });
      if (helpClose) {
        helpClose.addEventListener('click', function () {
          helpOverlay.style.display = 'none';
        });
      }
      helpOverlay.addEventListener('click', function (e) {
        if (e.target === helpOverlay) helpOverlay.style.display = 'none';
      });
    }

    initDropZone();
  }

  // ====== 暴露 ======
  R.exportAllData = exportAllData;
  R.importAllData = importAllData;
  R.loadLocalBooks = loadLocalBooks;
  R.removeLocalBook = removeLocalBook;

  function initData() {
    loadLocalBooks();
    if (!_dataBound) { bindDataEvents(); _dataBound = true; }
  }
  R.initData = initData;

  function ready() {
    if (_dataBound) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        if (!_dataBound) { bindDataEvents(); _dataBound = true; }
        loadLocalBooks();
      });
    } else {
      bindDataEvents();
      _dataBound = true;
      loadLocalBooks();
    }
  }
  ready();
})();
