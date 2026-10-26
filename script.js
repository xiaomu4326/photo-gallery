(function () {
  'use strict';

  var PHOTOS = window.PHOTOS || [];
  var MEMO_KEY = 'yuri-memos';
  var BATCH = 60;

  // ---------- DOM ----------
  var filtersEl = document.getElementById('filters');
  var gridEl = document.getElementById('grid');
  var loadMoreEl = document.getElementById('loadMore');
  var emptyEl = document.getElementById('empty');
  var galleryView = document.getElementById('view-gallery');
  var memoView = document.getElementById('view-memo');
  var tabs = document.querySelectorAll('.tab');

  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCaption = document.getElementById('lbCaption');
  var lbClose = document.getElementById('lbClose');
  var lbPrev = document.getElementById('lbPrev');
  var lbNext = document.getElementById('lbNext');

  var memoInput = document.getElementById('memoInput');
  var memoAdd = document.getElementById('memoAdd');
  var memoList = document.getElementById('memoList');
  var memoEmpty = document.getElementById('memoEmpty');

  // ---------- 分类 ----------
  function buildCategories() {
    var map = {};
    PHOTOS.forEach(function (p) { map[p.cat] = (map[p.cat] || 0) + 1; });
    return Object.keys(map)
      .map(function (name) { return { name: name, count: map[name] }; })
      .sort(function (a, b) { return b.count - a.count; });
  }
  var CATEGORIES = buildCategories();

  // ---------- 状态 ----------
  var state = { filter: '全部', shown: 0 };
  var currentList = [];
  var lbIndex = -1;

  // ---------- 视图切换 ----------
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var view = tab.getAttribute('data-view');
      tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
      galleryView.classList.toggle('active', view === 'gallery');
      memoView.classList.toggle('active', view === 'memo');
    });
  });

  // ---------- 相册：筛选器 ----------
  function renderFilters() {
    var html = '<button class="chip active" data-cat="全部">全部<span class="count">' +
      PHOTOS.length + '</span></button>';
    CATEGORIES.forEach(function (c) {
      html += '<button class="chip" data-cat="' + escapeAttr(c.name) + '">' +
        escapeHtml(c.name) + '<span class="count">' + c.count + '</span></button>';
    });
    filtersEl.innerHTML = html;

    filtersEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      state.filter = btn.getAttribute('data-cat');
      filtersEl.querySelectorAll('.chip').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      applyFilter();
    });
  }

  function applyFilter() {
    currentList = state.filter === '全部'
      ? PHOTOS.slice()
      : PHOTOS.filter(function (p) { return p.cat === state.filter; });
    state.shown = 0;
    gridEl.innerHTML = '';
    renderBatch();
    emptyEl.hidden = currentList.length !== 0;
  }

  function renderBatch() {
    var end = Math.min(state.shown + BATCH, currentList.length);
    var frag = document.createDocumentFragment();
    for (var i = state.shown; i < end; i++) {
      var p = currentList[i];
      var fig = document.createElement('figure');
      fig.className = 'thumb';
      var img = document.createElement('img');
      img.src = p.src;
      img.alt = p.cat;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.dataset.index = i;
      img.addEventListener('load', function () { this.classList.add('loaded'); });
      img.addEventListener('error', function () { this.classList.add('loaded'); });
      fig.appendChild(img);
      frag.appendChild(fig);
    }
    gridEl.appendChild(frag);
    state.shown = end;
    loadMoreEl.hidden = state.shown >= currentList.length;
  }

  loadMoreEl.addEventListener('click', renderBatch);

  // 点击缩略图打开灯箱（事件委托）
  gridEl.addEventListener('click', function (e) {
    var img = e.target.closest('img');
    if (!img) return;
    openLightbox(parseInt(img.dataset.index, 10));
  });

  // ---------- 灯箱 ----------
  function openLightbox(i) {
    lbIndex = i;
    lightbox.hidden = false;
    document.body.classList.add('no-scroll');
    updateLightbox();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove('no-scroll');
    lbIndex = -1;
  }
  function updateLightbox() {
    var p = currentList[lbIndex];
    if (!p) return;
    lbImg.src = p.src;
    lbCaption.textContent = p.cat + ' · ' + filenameOf(p.src);
    var many = currentList.length > 1;
    lbPrev.hidden = !many;
    lbNext.hidden = !many;
  }
  function filenameOf(src) {
    var parts = src.split('/');
    return parts[parts.length - 1];
  }
  function stepLightbox(d) {
    if (!currentList.length) return;
    lbIndex = (lbIndex + d + currentList.length) % currentList.length;
    updateLightbox();
  }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', function () { stepLightbox(-1); });
  lbNext.addEventListener('click', function () { stepLightbox(1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') stepLightbox(-1);
    else if (e.key === 'ArrowRight') stepLightbox(1);
  });

  // ---------- 备忘录 ----------
  function loadMemos() {
    try { return JSON.parse(localStorage.getItem(MEMO_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveMemos(list) {
    localStorage.setItem(MEMO_KEY, JSON.stringify(list));
  }

  function renderMemos() {
    var memos = loadMemos();
    memoEmpty.hidden = memos.length !== 0;
    memoList.innerHTML = '';
    memos.slice().reverse().forEach(function (m) {
      var li = document.createElement('li');
      li.className = 'memo-item';

      var text = document.createElement('div');
      text.className = 'memo-text';
      text.textContent = m.text;

      var meta = document.createElement('div');
      meta.className = 'memo-meta';

      var time = document.createElement('span');
      time.className = 'memo-time';
      time.textContent = formatTime(m.time);

      var actions = document.createElement('div');
      actions.className = 'memo-actions';

      var editBtn = document.createElement('button');
      editBtn.className = 'memo-btn';
      editBtn.textContent = '编辑';

      var delBtn = document.createElement('button');
      delBtn.className = 'memo-btn danger';
      delBtn.textContent = '删除';

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      meta.appendChild(time);
      meta.appendChild(actions);
      li.appendChild(text);
      li.appendChild(meta);
      memoList.appendChild(li);

      delBtn.addEventListener('click', function () { deleteMemo(m.id); });
      editBtn.addEventListener('click', function () { startEdit(li, m); });
    });
  }

  function formatTime(t) {
    var d = new Date(t);
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function addMemo(text) {
    var v = text.trim();
    if (!v) return;
    var memos = loadMemos();
    memos.push({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      text: v,
      time: Date.now()
    });
    saveMemos(memos);
    renderMemos();
  }

  function deleteMemo(id) {
    saveMemos(loadMemos().filter(function (m) { return m.id !== id; }));
    renderMemos();
  }

  function updateMemo(id, text) {
    var v = text.trim();
    if (!v) { deleteMemo(id); return; }
    saveMemos(loadMemos().map(function (m) {
      return m.id === id ? { id: m.id, text: v, time: Date.now() } : m;
    }));
    renderMemos();
  }

  function startEdit(li, m) {
    if (li.querySelector('.memo-edit')) return;

    var box = document.createElement('div');
    box.className = 'memo-edit';

    var ta = document.createElement('textarea');
    ta.value = m.text;

    var btns = document.createElement('div');
    btns.className = 'memo-edit-actions';

    var save = document.createElement('button');
    save.className = 'memo-btn primary';
    save.textContent = '保存';

    var cancel = document.createElement('button');
    cancel.className = 'memo-btn';
    cancel.textContent = '取消';

    btns.appendChild(save);
    btns.appendChild(cancel);
    box.appendChild(ta);
    box.appendChild(btns);
    li.appendChild(box);

    var textEl = li.querySelector('.memo-text');
    var metaEl = li.querySelector('.memo-meta');
    textEl.style.display = 'none';
    metaEl.style.display = 'none';
    ta.focus();

    function finish() {
      li.removeChild(box);
      textEl.style.display = '';
      metaEl.style.display = '';
    }

    save.addEventListener('click', function () { updateMemo(m.id, ta.value); });
    cancel.addEventListener('click', finish);
  }

  memoAdd.addEventListener('click', function () {
    addMemo(memoInput.value);
    memoInput.value = '';
    memoInput.focus();
  });
  memoInput.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      addMemo(memoInput.value);
      memoInput.value = '';
    }
  });

  // ---------- 工具 ----------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---------- 初始化 ----------
  renderFilters();
  applyFilter();
  renderMemos();
})();
