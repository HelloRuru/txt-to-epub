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
  const ICON_PLAY_SM = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>';
  const ICON_INSERT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

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
    if (state.audioFile) {
      audio.pause();
      state.isPlaying = false;
      URL.revokeObjectURL(audio.src);
    }

    state.audioFile = file;
    audio.src = URL.createObjectURL(file);
    audio.volume = $('volumeSlider').value / 100;

    $('uploadZone').style.display = 'none';
    $('playerSection').classList.add('visible');
    $('trackName').textContent = file.name.replace(/\.[^.]+$/, '');

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
    $('playBtn').addEventListener('click', togglePlay);

    $('rewindBtn').addEventListener('click', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    });
    $('forwardBtn').addEventListener('click', () => {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
    });

    $('volumeSlider').addEventListener('input', (e) => {
      audio.volume = e.target.value / 100;
    });

    $('progressBar').addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * (audio.duration || 0);
    });

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      $('progressFill').style.width = pct + '%';
      $('currentTime').textContent = formatTime(audio.currentTime);
      updateCurrentLyric();
    });

    audio.addEventListener('ended', () => {
      state.isPlaying = false;
      updatePlayIcon();
    });

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
    if (state.isPlaying) { audio.pause(); } else { audio.play(); }
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

    if (idx >= 0 && lines[idx]) {
      const el = lines[idx];
      const scrollTarget = el.offsetTop - scroll.clientHeight / 2 + el.clientHeight / 2;
      scroll.scrollTo({ top: scrollTarget, behavior: 'smooth' });
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
      '<div class="lyric-line" data-index="' + i + '">' +
        '<span class="lyric-time">' + formatTimeLRC(l.time) + '</span>' +
        '<span class="lyric-text">' + escapeHTML(l.text) + '</span>' +
      '</div>'
    ).join('');

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
    $('exportBtn').addEventListener('click', showExportPreview);
    $('tapBtn').addEventListener('click', openTapMode);
    $('tapStartBtn').addEventListener('click', startTapMode);
    $('tapCancelBtn').addEventListener('click', closeTapMode);
    $('exportModalClose').addEventListener('click', closeExportModal);
    $('exportCopyBtn').addEventListener('click', copyLRC);
    $('exportConfirmBtn').addEventListener('click', downloadLRC);

    /* Reference lyrics toggle */
    $('refToggle').addEventListener('click', () => {
      const content = $('refContent');
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? '' : 'none';
      $('refToggle').classList.toggle('open', isHidden);
    });
  }

  /* ══════════════════════════════════
     AI Recognition
     ══════════════════════════════════ */
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

    /* Check for reference lyrics — auto-clean non-lyric lines */
    var refText = $('refTextarea') ? $('refTextarea').value.trim() : '';
    var rawLines = refText ? refText.split('\n') : [];
    var refLines = cleanRefLines(rawLines);

    try {
      /* 1. Load Transformers.js + Whisper */
      if (!transcriber) {
        var transformers = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3');
        var createPipeline = transformers.pipeline;

        var device = 'wasm';
        var dtype = 'q8';
        if (navigator.gpu) {
          try {
            var adapter = await navigator.gpu.requestAdapter();
            if (adapter) { device = 'webgpu'; dtype = 'fp32'; }
          } catch (_) { /* fallback */ }
        }

        status.textContent = device === 'webgpu'
          ? '載入 AI 模型（WebGPU 加速）...'
          : '載入 AI 模型（WASM 模式）...';

        transcriber = await createPipeline(
          'automatic-speech-recognition',
          'onnx-community/whisper-small',
          {
            dtype: dtype,
            device: device,
            progress_callback: function (info) {
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

      /* 2. Process audio */
      status.textContent = '處理音檔中...';
      fill.style.width = '0%';
      var audioData = await decodeAudioTo16kMono(state.audioFile);

      /* 3. Transcribe */
      status.textContent = refLines.length
        ? '辨識時間標記中...（使用你提供的歌詞文字）'
        : '辨識歌詞中...（依歌曲長度約 1-5 分鐘）';
      fill.style.width = '50%';

      var lang = $('langSelect').value;
      var opts = {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        task: 'transcribe',
      };
      /* auto = 不指定語言，讓 Whisper 自己偵測 */
      if (lang !== 'auto') { opts.language = lang; }
      var result = await transcriber(audioData, opts);

      /* 4. Build lyrics — 保留 endTime 以便分配 */
      var chunks = [];
      if (result && result.chunks && result.chunks.length) {
        chunks = result.chunks
          .filter(function (c) { return c.text && c.text.trim(); })
          .map(function (c) {
            return {
              time: c.timestamp[0] || 0,
              endTime: c.timestamp[1] || 0,
              text: c.text.trim()
            };
          });
      } else if (result && result.text) {
        chunks = [{ time: 0, endTime: audio.duration || 180, text: result.text.trim() }];
      }

      /* 先清理重複 + 繁化姬轉正體（不管有沒有參考歌詞都要做） */
      chunks = chunks.map(function (c) { return { time: c.time, endTime: c.endTime, text: cleanRepeats(c.text) }; });

      status.textContent = '轉換為正體中文...';
      fill.style.width = '85%';

      var allText = chunks.map(function (c) { return c.text; }).join('\n');
      var tradText = await toTraditional(allText);
      var tradLines = tradText.split('\n');

      state.lyrics = chunks.map(function (c, i) {
        return { time: c.time, text: tradLines[i] !== undefined ? tradLines[i] : c.text };
      });

      /* 如果有參考歌詞：用 Whisper 的時間戳 + 參考歌詞修正文字 */
      if (refLines.length > 0 && state.lyrics.length > 0) {
        state.lyrics = replaceTextWithRef(state.lyrics, refLines);
        fill.style.width = '100%';
        status.textContent = '完成！AI 辨識 ' + state.lyrics.length + ' 段人聲，已用參考歌詞修正文字';
        showToast('AI 辨識人聲時間 + 參考歌詞修正文字');
      } else if (refLines.length > 0 && state.lyrics.length === 0) {
        /* Whisper 完全沒結果，只好用均勻分配 */
        state.lyrics = mapReferenceToTimestamps(refLines, chunks);
        fill.style.width = '100%';
        status.textContent = '未偵測到人聲，改用均勻分配，共 ' + state.lyrics.length + ' 行';
        showToast('未偵測到人聲，已均勻分配歌詞');
      } else {
        fill.style.width = '100%';
        status.textContent = '辨識完成！共 ' + state.lyrics.length + ' 行歌詞（已轉正體中文）';
        showToast('歌詞辨識完成！已自動轉為正體中文');
      }

      renderLyricsView();

    } catch (err) {
      console.error('AI Recognition error:', err);
      status.textContent = '辨識失敗';
      showToast('辨識失敗：' + err.message, 'error');
    } finally {
      state.isRecognizing = false;
      $('aiBtn').disabled = false;
      setTimeout(function () { prog.classList.remove('visible'); }, 3000);
    }
  }

  /** Decode audio file to 16kHz mono Float32Array for Whisper */
  async function decodeAudioTo16kMono(file) {
    var arrayBuffer = await file.arrayBuffer();
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    var decoded = await audioCtx.decodeAudioData(arrayBuffer);
    var mono = decoded.getChannelData(0);
    audioCtx.close();
    return mono;
  }

  /* ══════════════════════════════════
     Reference Lyrics — 修正文字
     ══════════════════════════════════ */
  /**
   * 用 Whisper 辨識的時間戳 + 參考歌詞修正文字
   * Whisper 負責人聲時間偵測，參考歌詞負責修正錯字
   */
  function replaceTextWithRef(lyrics, refLines) {
    var N = lyrics.length;  /* Whisper 辨識出的行數 */
    var M = refLines.length; /* 使用者提供的歌詞行數 */

    if (M === N) {
      /* 行數相同，直接 1-to-1 替換文字 */
      return lyrics.map(function (line, i) {
        return { time: line.time, text: refLines[i].trim() };
      });
    }

    if (M <= N) {
      /* 歌詞比 Whisper 行數少：取 M 個代表性時間點 */
      return refLines.map(function (text, i) {
        var ci = Math.round(i * (N - 1) / (M - 1 || 1));
        ci = Math.min(ci, N - 1);
        return { time: lyrics[ci].time, text: text.trim() };
      });
    }

    /* 歌詞比 Whisper 行數多：在 Whisper 時間戳之間插值 */
    return refLines.map(function (text, i) {
      var pos = i * (N - 1) / (M - 1 || 1);
      var lo = Math.floor(pos);
      var hi = Math.ceil(pos);
      if (lo >= N) lo = N - 1;
      if (hi >= N) hi = N - 1;
      var frac = pos - lo;
      var tLo = lyrics[lo].time;
      var tHi = (lo === hi) ? tLo : lyrics[hi].time;
      var t = tLo + frac * (tHi - tLo);
      return { time: Math.max(0, t), text: text.trim() };
    });
  }

  /* ══════════════════════════════════
     Fallback：Whisper 無結果時均勻分配
     ══════════════════════════════════ */
  function mapReferenceToTimestamps(refLines, chunks) {
    var M = refLines.length;
    if (!M) return [];
    var dur = audio.duration || 180;

    /* 決定歌詞的起止範圍 */
    var voiceStart, voiceEnd;

    if (chunks.length > 0) {
      voiceStart = chunks[0].time;
      var lastChunk = chunks[chunks.length - 1];
      voiceEnd = lastChunk.endTime || (lastChunk.time + 15);
      if (voiceEnd > dur) voiceEnd = dur;

      /* 如果 chunks 涵蓋範圍不到歌曲的 30%，代表時間戳不可靠 */
      var chunkSpan = voiceEnd - voiceStart;
      if (chunkSpan < dur * 0.3) {
        /* 時間戳不可靠，改用歌曲全長（跳過前 3 秒可能的前奏） */
        voiceStart = Math.min(3, dur * 0.05);
        voiceEnd = dur - 2;
      }
    } else {
      /* 沒有 chunks，跳過前 3 秒 */
      voiceStart = Math.min(3, dur * 0.05);
      voiceEnd = dur - 2;
    }

    if (voiceEnd <= voiceStart) voiceEnd = dur - 2;

    var voiceDuration = voiceEnd - voiceStart;
    var step = voiceDuration / M;

    return refLines.map(function (text, i) {
      return { time: Math.max(0, voiceStart + step * i), text: text.trim() };
    });
  }

  /* ══════════════════════════════════
     繁化姬 API — 簡轉正體中文（台灣用語）
     ══════════════════════════════════ */
  async function toTraditional(text) {
    if (!text) return text;
    try {
      var resp = await fetch('https://api.zhconvert.org/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text: text, converter: 'Taiwan' })
      });
      var data = await resp.json();
      if (data.code === 0 && data.data && data.data.text) {
        return data.data.text;
      }
    } catch (_) {
      /* API 失敗時回傳原文 */
    }
    return text;
  }

  /* ══════════════════════════════════
     Clean Reference Lyrics
     ══════════════════════════════════ */
  /**
   * 過濾使用者貼上的歌詞，自動移除非歌詞行：
   * - [Intro], [Verse 1], [Chorus], [Bridge], [Outro] 等段落標記
   * - (Vinyl crackle...), (instrumental) 等音效/演奏描述
   * - [Fade out], [Small Break] 等指示
   * - 空行
   */
  function cleanRefLines(lines) {
    return lines.filter(function (line) {
      var t = line.trim();
      if (!t) return false;
      /* 整行是 [xxx] 段落標記 */
      if (/^\[.+\]$/.test(t)) return false;
      /* 整行是 (xxx) 演奏描述 */
      if (/^\(.+\)$/.test(t)) return false;
      return true;
    });
  }

  /* ══════════════════════════════════
     Clean Repeats (Whisper hallucination fix)
     ══════════════════════════════════ */
  function cleanRepeats(text) {
    /* 單字重複 4+ 次 → 字～ */
    text = text.replace(/(.)\1{3,}/g, '$1～');
    /* 2-3 字片語重複 3+ 次 → 片語～ */
    text = text.replace(/(.{2,3})\1{2,}/g, '$1～');
    return text.trim();
  }

  /* ══════════════════════════════════
     LRC Upload
     ══════════════════════════════════ */
  function handleLrcUpload(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (ev) {
      var text = ev.target.result;
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

  /* ══════════════════════════════════
     Edit Mode (with insert row)
     ══════════════════════════════════ */
  function toggleEdit() {
    if (!state.lyrics.length) return;
    state.isEditing = !state.isEditing;

    if (state.isEditing) {
      renderEditView();
      $('editBtn').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 完成編輯';
    } else {
      saveEdits();
      renderLyricsView();
      $('editBtn').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 編輯歌詞';
      showToast('歌詞已更新');
    }
  }

  function renderEditView() {
    var scroll = $('lyricsScroll');
    var edit = $('editContainer');

    scroll.style.display = 'none';
    edit.classList.add('visible');
    edit.innerHTML = '';

    /* 逐行建立 edit row */
    state.lyrics.forEach(function (l) {
      edit.appendChild(createEditRow(l.time, l.text));
    });

    /* 底部「新增一行」按鈕 */
    var actionsDiv = document.createElement('div');
    actionsDiv.className = 'edit-actions';
    actionsDiv.innerHTML =
      '<button class="btn-action" id="addLineBtn">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
        ' 新增一行' +
      '</button>';
    edit.appendChild(actionsDiv);

    $('addLineBtn').addEventListener('click', function () {
      var rows = edit.querySelectorAll('.edit-row');
      var lastRow = rows[rows.length - 1];
      var lastTime = lastRow
        ? parseTimeLRC(lastRow.querySelector('[data-field="time"]').value.trim()) + 5
        : 0;
      var newRow = createEditRow(lastTime, '');
      edit.querySelector('.edit-actions').insertAdjacentElement('beforebegin', newRow);
      newRow.querySelector('[data-field="text"]').focus();
    });
  }

  /**
   * 建立單一 edit row（含播放、時間、歌詞、插入、刪除按鈕）
   */
  function createEditRow(time, text) {
    var row = document.createElement('div');
    row.className = 'edit-row';
    row.innerHTML =
      '<button class="btn-preview" title="從這裡播放">' + ICON_PLAY_SM + '</button>' +
      '<button class="btn-nudge" data-dir="-1" title="往前 0.5 秒">&laquo;</button>' +
      '<input type="text" class="edit-time" value="' + formatTimeLRC(time) + '" data-field="time">' +
      '<button class="btn-nudge" data-dir="1" title="往後 0.5 秒">&raquo;</button>' +
      '<input type="text" class="edit-text" value="' + escapeAttr(text) + '" placeholder="輸入歌詞..." data-field="text">' +
      '<button class="btn-insert-row" title="在下方插入一行">' + ICON_INSERT + '</button>' +
      '<button class="btn-delete-row" title="刪除這行">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>';

    /* 播放預覽 */
    row.querySelector('.btn-preview').addEventListener('click', function () {
      audio.currentTime = parseTimeLRC(row.querySelector('[data-field="time"]').value.trim());
      audio.play();
      state.isPlaying = true;
      updatePlayIcon();
    });

    /* 單行時間微調 << >> (0.5 秒) */
    row.querySelectorAll('.btn-nudge').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var timeInput = row.querySelector('[data-field="time"]');
        var cur = parseTimeLRC(timeInput.value.trim());
        var dir = parseInt(btn.dataset.dir, 10);
        var next = Math.max(0, cur + dir * 0.5);
        timeInput.value = formatTimeLRC(next);
      });
    });

    /* 插入一行（在目前這行的下方） */
    row.querySelector('.btn-insert-row').addEventListener('click', function () {
      var curTime = parseTimeLRC(row.querySelector('[data-field="time"]').value.trim());
      var newRow = createEditRow(curTime + 2, '');
      row.insertAdjacentElement('afterend', newRow);
      newRow.querySelector('[data-field="text"]').focus();
    });

    /* 刪除這行 */
    row.querySelector('.btn-delete-row').addEventListener('click', function () {
      row.remove();
    });

    return row;
  }

  function saveEdits() {
    var rows = $('editContainer').querySelectorAll('.edit-row');
    var newLyrics = [];
    rows.forEach(function (row) {
      var timeStr = row.querySelector('[data-field="time"]').value.trim();
      var text = row.querySelector('[data-field="text"]').value.trim();
      if (!text) return;
      var time = parseTimeLRC(timeStr);
      newLyrics.push({ time: time, text: text });
    });
    state.lyrics = newLyrics.sort(function (a, b) { return a.time - b.time; });
  }

  /* ══════════════════════════════════
     Export LRC (with preview modal)
     ══════════════════════════════════ */
  function buildLRC() {
    if (state.isEditing) saveEdits();
    var trackName = $('trackName').textContent || 'lyrics';
    return '[ti:' + trackName + ']\n[by:Lyric Player]\n\n' +
      state.lyrics.map(function (l) { return '[' + formatTimeLRC(l.time) + ']' + l.text; }).join('\n');
  }

  function showExportPreview() {
    if (!state.lyrics.length) return;
    $('exportPreviewText').textContent = buildLRC();
    $('exportModal').style.display = '';
  }

  function closeExportModal() {
    $('exportModal').style.display = 'none';
  }

  function copyLRC() {
    navigator.clipboard.writeText(buildLRC()).then(function () { showToast('已複製到剪貼簿'); });
  }

  function downloadLRC() {
    var trackName = $('trackName').textContent || 'lyrics';
    var blob = new Blob([buildLRC()], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = trackName + '.lrc';
    a.click();
    URL.revokeObjectURL(url);
    closeExportModal();
    showToast('LRC 已下載');
  }

  /* ══════════════════════════════════
     Tap Mode
     ══════════════════════════════════ */
  var tapLines = [];
  var tapIndex = 0;
  var tapActive = false;
  var tapKeyHandler = null;

  function openTapMode() {
    $('tapPanel').style.display = '';
    $('tapTextarea').value = '';
    $('tapTextarea').focus();
    $('tapStatus').style.display = 'none';
  }

  function closeTapMode() {
    $('tapPanel').style.display = 'none';
    stopTapMode();
  }

  function startTapMode() {
    var text = $('tapTextarea').value.trim();
    if (!text) { showToast('請先貼上歌詞文字', 'error'); return; }

    tapLines = text.split('\n').filter(function (l) { return l.trim(); });
    tapIndex = 0;
    tapActive = true;

    $('tapTextarea').style.display = 'none';
    $('tapStartBtn').style.display = 'none';
    $('tapStatus').style.display = '';
    $('tapProgress').textContent = '0 / ' + tapLines.length;

    state.lyrics = tapLines.map(function (l) { return { time: 0, text: l }; });
    renderLyricsView();

    audio.currentTime = 0;
    audio.play();
    state.isPlaying = true;
    updatePlayIcon();

    tapKeyHandler = function (e) {
      if (!tapActive) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (tapIndex < tapLines.length) {
          state.lyrics[tapIndex].time = audio.currentTime;
          tapIndex++;
          $('tapProgress').textContent = tapIndex + ' / ' + tapLines.length;

          var lines = $('lyricsScroll').querySelectorAll('.lyric-line');
          lines.forEach(function (el, i) {
            el.classList.toggle('active', i === tapIndex);
            el.classList.toggle('past', i < tapIndex);
          });

          if (tapIndex >= tapLines.length) {
            stopTapMode();
            renderLyricsView();
            showToast('打標記完成！共 ' + tapLines.length + ' 行');
          }
        }
      }
      if (e.code === 'Escape') {
        stopTapMode();
        renderLyricsView();
        showToast('打標記已結束，共標記 ' + tapIndex + ' 行');
      }
    };
    document.addEventListener('keydown', tapKeyHandler);
  }

  function stopTapMode() {
    tapActive = false;
    if (tapKeyHandler) {
      document.removeEventListener('keydown', tapKeyHandler);
      tapKeyHandler = null;
    }
    $('tapTextarea').style.display = '';
    $('tapStartBtn').style.display = '';
    $('tapStatus').style.display = 'none';
    $('tapPanel').style.display = 'none';

    $('editBtn').disabled = !state.lyrics.length;
    $('exportBtn').disabled = !state.lyrics.length;
  }

  /* ══════════════════════════════════
     LRC Parser / Formatter
     ══════════════════════════════════ */
  function parseLRC(text) {
    var lines = text.split('\n');
    var lyrics = [];
    var timeRe = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

    for (var k = 0; k < lines.length; k++) {
      var line = lines[k];
      var matches = [];
      var m;
      while ((m = timeRe.exec(line)) !== null) { matches.push(m); }
      timeRe.lastIndex = 0;
      var content = line.replace(timeRe, '').trim();
      timeRe.lastIndex = 0;
      if (!content || !matches.length) continue;

      for (var j = 0; j < matches.length; j++) {
        var mm = matches[j];
        var min = parseInt(mm[1], 10);
        var sec = parseInt(mm[2], 10);
        var ms = mm[3] ? parseInt(mm[3].padEnd(3, '0'), 10) : 0;
        lyrics.push({ time: min * 60 + sec + ms / 1000, text: content });
      }
    }
    return lyrics.sort(function (a, b) { return a.time - b.time; });
  }

  function formatTimeLRC(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    var cs = Math.round((sec % 1) * 100);
    return pad2(m) + ':' + pad2(s) + '.' + pad2(cs);
  }

  function parseTimeLRC(str) {
    var m = str.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (!m) return 0;
    var min = parseInt(m[1], 10);
    var sec = parseInt(m[2], 10);
    var ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0;
    return min * 60 + sec + ms / 1000;
  }

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + pad2(s);
  }

  function pad2(n) { return n.toString().padStart(2, '0'); }

  /* ══════════════════════════════════
     Utilities
     ══════════════════════════════════ */
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function showToast(msg, type) {
    var el = $('toast');
    el.textContent = msg;
    el.className = 'toast visible' + (type === 'error' ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 3000);
  }

  /* ══════════════════════════════════
     Bootstrap
     ══════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', init);
})();
