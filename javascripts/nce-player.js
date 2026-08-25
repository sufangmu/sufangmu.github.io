/**
 * NCE 嵌入式音频播放器（升级 <audio class="nce-audio">）
 * 提供：播放/暂停、可拖拽进度条、时间显示、播放模式切换、播放速度切换（按钮仅图标，说明见悬浮提示）。
 */
(function () {
  'use strict';

  function fmt(t) {
    t = Math.max(0, Math.floor(t || 0));
    var m = Math.floor(t / 60);
    var s = t % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function build(audio) {
    if (audio.dataset.nceBuilt) return;
    audio.dataset.nceBuilt = '1';

    var wrap = document.createElement('div');
    wrap.className = 'nce-player';

    var playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'nce-btn nce-btn-play';
    playBtn.textContent = '▶';
    playBtn.title = '播放/暂停';
    playBtn.setAttribute('aria-label', '播放/暂停');

    var progress = document.createElement('div');
    progress.className = 'nce-progress';
    var fill = document.createElement('div');
    fill.className = 'nce-progress-fill';
    progress.appendChild(fill);

    var time = document.createElement('span');
    time.className = 'nce-time';
    time.textContent = '0:00 / 0:00';

    var modeBtn = document.createElement('button');
    modeBtn.type = 'button';
    modeBtn.className = 'nce-btn nce-btn-mode';
    modeBtn.setAttribute('aria-label', '切换播放模式');

    var speedBtn = document.createElement('button');
    speedBtn.type = 'button';
    speedBtn.className = 'nce-btn nce-btn-speed';
    speedBtn.setAttribute('aria-label', '播放速度');

    wrap.appendChild(playBtn);
    wrap.appendChild(progress);
    wrap.appendChild(time);
    wrap.appendChild(modeBtn);
    wrap.appendChild(speedBtn);

    // 将 audio 移入 wrapper 并隐藏原生控件
    audio.parentNode.insertBefore(wrap, audio);
    audio.removeAttribute('controls');
    audio.style.display = 'none';
    wrap.insertBefore(audio, wrap.firstChild);

    playBtn.addEventListener('click', function () {
      if (audio.paused) audio.play();
      else audio.pause();
    });
    audio.addEventListener('play', function () { playBtn.textContent = '⏸'; });
    audio.addEventListener('pause', function () { playBtn.textContent = '▶'; });
    audio.addEventListener('ended', function () { playBtn.textContent = '▶'; });

    // 播放模式：顺序播放 / 循环播放
    var modes = [
      { loop: false, icon: '▶️', label: '顺序播放' },
      { loop: true,  icon: '🔁', label: '循环播放' },
    ];
    var modeIdx = 0;
    function renderMode() {
      var m = modes[modeIdx];
      modeBtn.textContent = m.icon;
      audio.loop = m.loop;
      modeBtn.title = '当前：' + m.label + '（点击切换）';
    }
    modeBtn.addEventListener('click', function () {
      modeIdx = 1 - modeIdx;
      renderMode();
    });
    renderMode();

    // 播放速度：点击循环切换倍数
    var speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    var speedIdx = 2;
    function renderSpeed() {
      var s = speeds[speedIdx];
      speedBtn.textContent = s + 'x';
      audio.playbackRate = s;
      speedBtn.title = '播放速度 ' + s + 'x（点击切换）';
    }
    speedBtn.addEventListener('click', function () {
      speedIdx = (speedIdx + 1) % speeds.length;
      renderSpeed();
    });
    renderSpeed();

    function render() {
      var d = audio.duration || 0;
      var pct = d ? (audio.currentTime / d) * 100 : 0;
      fill.style.width = pct + '%';
      time.textContent = fmt(audio.currentTime) + ' / ' + fmt(d);
    }
    audio.addEventListener('timeupdate', render);
    audio.addEventListener('loadedmetadata', render);

    // 可拖拽进度条（点击 + 拖动 seek）
    var dragging = false;
    function ratioFromEvent(e) {
      var rect = progress.getBoundingClientRect();
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      var r = (x - rect.left) / rect.width;
      return Math.max(0, Math.min(1, r));
    }
    function seek(e) {
      if (audio.duration) {
        audio.currentTime = ratioFromEvent(e) * audio.duration;
        render();
      }
    }
    progress.addEventListener('mousedown', function (e) {
      dragging = true;
      e.preventDefault();
      seek(e);
    });
    document.addEventListener('mousemove', function (e) { if (dragging) seek(e); });
    document.addEventListener('mouseup', function () { dragging = false; });
    progress.addEventListener('touchstart', function (e) { dragging = true; seek(e); }, { passive: true });
    progress.addEventListener('touchmove', function (e) { if (dragging) seek(e); }, { passive: true });
    progress.addEventListener('touchend', function () { dragging = false; });
  }

  function init() {
    var nodes = document.querySelectorAll('audio.nce-audio');
    for (var i = 0; i < nodes.length; i++) build(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
