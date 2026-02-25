/* ─── Lyric Player — App Logic ─── */
(function () {
  'use strict';

  /* ══════════════════════════════════
     State
     ══════════════════════════════════ */
  const state = {
    audioFile: null,
    lyrics: [],        // [{ time: Number, text: String }]
    currentLine: -1,
    isPlaying: false,
    isEditing: false,
    isRecognizing: false,
  };

  const audio = new Audio();
  let transcriber = null;
  let toastTimer = null;

  /* ══════════════════════════════════
     DOM Helpers
     ══════════════════════════════════ */
  const $ = (id) => document.getElementById(id);

  /* SVG Icons (Lucide style) */
  const ICON_PLAY = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>';
  const ICON_PAUSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>';
  const ICON_SUN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const ICON_MOON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  /* ══════════════════════════════════
     Init
     ══════════════════════════════════ */
  function init() {
    initDarkMode();
    initUpload();
    initPlayer();
    initActions();
  }

  /* ══════════════════════════════════
     Dark Mode
     ══════════════════════════════════ */
  function initDarkMode() {
    const btn = $('themeToggle');
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    }
    btn.addEventListener('click', () => {
      root.classList.toggle('dark');
      localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
      updateThemeIcon();
    });
    updateThemeIcon();
  }

  function updateThemeIcon() {
    $('themeToggle').innerHTML = document.documentElement.classList.contains('dark') ? ICON_SUN : ICON_MOON;
  }

  /* ══════════════════════════════════
     Upload
     ══════════════════════════════════ */
  function initUpload() {
    const zone = $('uploadZone');
    const input = $('audioInput');

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) loadAudio(file);
      else showToast('請上傳音訊檔案', 'error');
    });
    input.addEventListener('change', (e) => {
      if (e.target.files[0]) loadAudio(e.target.files[0]);
    });
  }

  function loadAudio(file) {
    /* Clean up previous */
    if (state.audioFile) {
      audio.pause();
      state.isPlaying = false;
      URL.revokeObjectURL(audio.src);
    }

    state.audioFile = file;
    audio.src = URL.createObjectURL(file);
    audio.volume = $('volumeSlider').value / 100;

    /* Show player, hide upload */
    $('uploadZone').style.display = 'none';
    $('playerSection').classList.add('visible');

    /* Track name */
    $('trackName').textContent = file.name.replace(/\.[^.]+$/, '');

    /* Reset lyrics */
    state.lyrics = [];
    state.currentLine = -1;
    state.isEditing = false;
    renderLyricsView();
    $('editBtn').disabled = true;
    $('exportBtn').disabled = true;

    audio.addEventListener('loadedmetadata', function onMeta() {
      $('totalTime').textContent = formatTime(audio.duration);
      audio.removeEventListener('loadedmetadata', onMeta);
    });

    updatePlayIcon();
  }

  /* ══════════════════════════════════
     Player
     ══════════════════════════════════ */
  function initPlayer() {
    /* Play / Pause */
    $('playBtn').addEventListener('click', togglePlay);

    /* Rewind / Forward */
    $('rewindBtn').addEventListener('click', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    });
    $('forwardBtn').addEventListener('click', () => {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
    });

    /* Volume */
    $('volumeSlider').addEventListener('input', (e) => {
      audio.volume = e.target.value / 100;
    });

    /* Progress bar click */
    $('progressBar').addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * (audio.duration || 0);
    });

    /* Time update */
    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      $('progressFill').style.width = pct + '%';
      $('currentTime').textContent = formatTime(audio.currentTime);
      updateCurrentLyric();
    });

    /* Ended */
    audio.addEventListener('ended', () => {
      state.isPlaying = false;
      updatePlayIcon();
    });

    /* Change song */
    $('changeBtn').addEventListener('click', () => {
      audio.pause();
      state.isPlaying = false;
      state.audioFile = null;
      state.lyrics = [];
      state.currentLine = -1;
      $('uploadZone').style.display = '';
      $('playerSection').classList.remove('visible');
      $('audioInput').value = '';
      $('progressFill').style.width = '0%';
      $('currentTime').textContent = '0:00';
      $('totalTime').textContent = '0:00';
    });
  }

  function togglePlay() {
    if (!state.audioFile) return;
    if (state.isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    state.isPlaying = !state.isPlaying;
    updatePlayIcon();
  }

  function updatePlayIcon() {
    $('playBtn').innerHTML = state.isPlaying ? ICON_PAUSE : ICON_PLAY;
  }

  /* ══════════════════════════════════
     Lyrics Sync
     ══════════════════════════════════ */
  function updateCurrentLyric() {
    if (!state.lyrics.length || state.isEditing) return;
    const t = audio.currentTime;
    let idx = -1;
    for (let i = state.lyrics.length - 1; i >= 0; i--) {
      if (t >= state.lyrics[i].time) { idx = i; break; }
    }
    if (idx === state.currentLine) return;
    state.currentLine = idx;

    const scroll = $('lyricsScroll');
    const lines = scroll.querySelectorAll('.lyric-line');
    lines.forEach((el, i) => {
      el.classList.toggle('active', i === idx);
      el.classList.toggle('past', i < idx);
    });

    /* Auto-scroll to center the active line */
    if (idx >= 0 && lines[idx]) {
      const container = scroll;
      const el = lines[idx];
      const scrollTarget = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
      container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    }
  }

  /* ══════════════════════════════════
     Render Lyrics
     ══════════════════════════════════ */
  function renderLyricsView() {
    const placeholder = $('lyricsPlaceholder');
    const scroll = $('lyricsScroll');
    const edit = $('editContainer');

    edit.classList.remove('visible');
    edit.innerHTML = '';

    if (!state.lyrics.length) {
      placeholder.style.display = '';
      scroll.style.display = 'none';
      return;
    }

    placeholder.style.display = 'none';
    scroll.style.display = '';
    scroll.innerHTML = state.lyrics.map((l, i) =>
      '<div class="lyric-line" data-index="' + i + '">' + escapeHTML(l.text) + '</div>'
    ).join('');

    /* Click to seek */
    scroll.querySelectorAll('.lyric-line').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index, 10);
        audio.currentTime = state.lyrics[idx].time;
        if (!state.isPlaying) { audio.play(); state.isPlaying = true; updatePlayIcon(); }
      });
    });

    $('editBtn').disabled = false;
    $('exportBtn').disabled = false;
    state.currentLine = -1;
  }

  /* ══════════════════════════════════
     Actions
     ══════════════════════════════════ */
  function initActions() {
    $('aiBtn').addEventListener('click', startRecognition);
    $('lrcInput').addEventListener('change', handleLrcUpload);
    $('editBtn').addEventListener('click', toggleEdit);
    $('exportBtn').addEventListener('click', exportLRC);
  }

  /* ── AI Recognition ── */
  async function startRecognition() {
    if (state.isRecognizing || !state.audioFile) return;
    state.isRecognizing = true;

    const prog = $('aiProgress');
    const fill = $('aiProgressFill');
    const status = $('aiStatus');
    prog.classList.add('visible');
    fill.style.width = '0%';
    status.textContent = '載入 AI 模型中（首次約 1-2 分鐘下載）...';
    $('aiBtn').disabled = true;

    try {
      /* 1. Load Transformers.js + Whisper */
      if (!transcriber) {
        const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3');

        /* Try WebGPU first, fallback to WASM */
        let device = 'wasm';
        let dtype = 'q8';
        if (navigator.gpu) {
          try {
            const adapter = await navigator.gpu.requestAdapter();
            if (adapter) { device = 'webgpu'; dtype = 'fp32'; }
          } catch (_) { /* fallback */ }
        }

        status.textContent = device === 'webgpu'
          ? '載入 AI 模型（WebGPU 加速）...'
          : '載入 AI 模型（WASM 模式）...';

        transcriber = await pipeline(
          'automatic-speech-recognition',
          'onnx-community/whisper-small',
          {
            dtype: dtype,
            device: device,
            progress_callback: (info) => {
              if (info.status === 'progress' && info.progress) {
                fill.style.width = Math.round(info.progress) + '%';
                status.textContent = '下載模型：' + Math.round(info.progress) + '%';
              }
              if (info.status === 'ready') {
                status.textContent = '模型載入完成！';
              }
            }
          }
        );
      }

      /* 2. Process audio → 16kHz mono Float32Array */
      status.textContent = '處理音檔中...';
      fill.style.width = '0%';

      const audioData = await decodeAudioTo16kMono(state.audioFile);

      /* 3. Transcribe */
      status.textContent = '辨識歌詞中...（依歌曲長度約 1-5 分鐘）';
      fill.style.width = '50%';

      const lang = $('langSelect').value;
      const result = await transcriber(audioData, {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        language: lang,
        task: 'transcribe',
      });

      /* 4. Convert to lyrics array */
      if (result && result.chunks && result.chunks.length) {
        state.lyrics = result.chunks
          .filter((c) => c.text && c.text.trim())
          .map((c) => ({
            time: c.timestamp[0] || 0,
            text: c.text.trim()
          }));
      } else if (result && result.text) {
        /* Fallback: single block without timestamps */
        state.lyrics = [{ time: 0, text: result.text.trim() }];
      }

      fill.style.width = '100%';
      status.textContent = '辨識完成！共 ' + state.lyrics.length + ' 行歌詞';
      renderLyricsView();
      showToast('歌詞辨識完成！');

    } catch (err) {
      console.error('AI Recognition error:', err);
      status.textContent = '辨識失敗';
      showToast('辨識失敗：' + err.message, 'error');
    } finally {
      state.isRecognizing = false;
      $('aiBtn').disabled = false;
      setTimeout(() => prog.classList.remove('visible'), 3000);
    }
  }

  /** Decode audio file to 16kHz mono Float32Array for Whisper */
  async function decodeAudioTo16kMono(file) {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    const mono = decoded.getChannelData(0); // first channel
    audioCtx.close();
    return mono;
  }

  /* ── LRC Upload ── */
  function handleLrcUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      state.lyrics = parseLRC(text);
      if (state.lyrics.length) {
        renderLyricsView();
        showToast('已載入 ' + state.lyrics.length + ' 行歌詞');
      } else {
        showToast('LRC 檔案格式無法解析', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  /* ── Edit Mode ── */
  function toggleEdit() {
    if (!state.lyrics.length) return;
    state.isEditing = !state.isEditing;

    if (state.isEditing) {
      renderEditView();
      $('editBtn').querySelector('svg + *') || ($('editBtn').childNodes[1].textContent = ' 完成編輯');
      /* Replace button text */
      $('editBtn').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 完成編輯';
    } else {
      saveEdits();
      renderLyricsView();
      $('editBtn').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 編輯歌詞';
      showToast('歌詞已更新');
    }
  }

  function renderEditView() {
    const scroll = $('lyricsScroll');
    const edit = $('editContainer');

    scroll.style.display = 'none';
    edit.classList.add('visible');

    let html = state.lyrics.map((l, i) =>
      '<div class="edit-row" data-index="' + i + '">' +
        '<input type="text" class="edit-time" value="' + formatTimeLRC(l.time) + '" data-field="time">' +
        '<input type="text" class="edit-text" value="' + escapeAttr(l.text) + '" data-field="text">' +
        '<button class="btn-delete-row" title="刪除這行">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>'
    ).join('');

    html += '<div class="edit-actions">' +
      '<button class="btn-action" id="addLineBtn">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
        ' 新增一行' +
      '</button>' +
    '</div>';

    edit.innerHTML = html;

    /* Delete row */
    edit.querySelectorAll('.btn-delete-row').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.closest('.edit-row').remove();
      });
    });

    /* Add line */
    $('addLineBtn').addEventListener('click', () => {
      const lastTime = state.lyrics.length ? state.lyrics[state.lyrics.length - 1].time + 5 : 0;
      const row = document.createElement('div');
      row.className = 'edit-row';
      row.innerHTML =
        '<input type="text" class="edit-time" value="' + formatTimeLRC(lastTime) + '" data-field="time">' +
        '<input type="text" class="edit-text" value="" placeholder="輸入歌詞..." data-field="text">' +
        '<button class="btn-delete-row" title="刪除這行">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>';
      row.querySelector('.btn-delete-row').addEventListener('click', () => row.remove());
      edit.querySelector('.edit-actions').insertAdjacentElement('beforebegin', row);
    });
  }

  function saveEdits() {
    const rows = $('editContainer').querySelectorAll('.edit-row');
    const newLyrics = [];
    rows.forEach((row) => {
      const timeStr = row.querySelector('[data-field="time"]').value.trim();
      const text = row.querySelector('[data-field="text"]').value.trim();
      if (!text) return;
      const time = parseTimeLRC(timeStr);
      newLyrics.push({ time, text });
    });
    state.lyrics = newLyrics.sort((a, b) => a.time - b.time);
  }

  /* ── Export LRC ── */
  function exportLRC() {
    if (!state.lyrics.length) return;

    if (state.isEditing) saveEdits();

    const trackName = $('trackName').textContent || 'lyrics';
    const lrcContent = '[ti:' + trackName + ']\n[by:Lyric Player]\n\n' +
      state.lyrics.map((l) => '[' + formatTimeLRC(l.time) + ']' + l.text).join('\n');

    const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = trackName + '.lrc';
    a.click();
    URL.revokeObjectURL(url);
    showToast('LRC 已下載');
  }

  /* ══════════════════════════════════
     LRC Parser / Formatter
     ══════════════════════════════════ */
  function parseLRC(text) {
    const lines = text.split('\n');
    const lyrics = [];
    const timeRe = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

    for (const line of lines) {
      const matches = [...line.matchAll(timeRe)];
      const content = line.replace(timeRe, '').trim();
      if (!content || !matches.length) continue;

      for (const m of matches) {
        const min = parseInt(m[1], 10);
        const sec = parseInt(m[2], 10);
        const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0;
        lyrics.push({ time: min * 60 + sec + ms / 1000, text: content });
      }
    }
    return lyrics.sort((a, b) => a.time - b.time);
  }

  /** Format seconds → mm:ss.xx (LRC standard) */
  function formatTimeLRC(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.round((sec % 1) * 100);
    return pad2(m) + ':' + pad2(s) + '.' + pad2(cs);
  }

  /** Parse mm:ss.xx → seconds */
  function parseTimeLRC(str) {
    const m = str.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (!m) return 0;
    const min = parseInt(m[1], 10);
    const sec = parseInt(m[2], 10);
    const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0;
    return min * 60 + sec + ms / 1000;
  }

  /** Format seconds → m:ss for player display */
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + pad2(s);
  }

  function pad2(n) { return n.toString().padStart(2, '0'); }

  /* ══════════════════════════════════
     Utilities
     ══════════════════════════════════ */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function showToast(msg, type) {
    const el = $('toast');
    el.textContent = msg;
    el.className = 'toast visible' + (type === 'error' ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
  }

  /* ══════════════════════════════════
     Bootstrap
     ══════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', init);
})();
