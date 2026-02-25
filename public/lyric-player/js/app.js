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

    /* 勘誤按鈕 — 事後用參考歌詞修正文字，時間戳不動 */
    $('postCorrectBtn').addEventListener('click', applyPostCorrection);
    /* textarea 輸入時更新按鈕狀態 */
    $('refTextarea').addEventListener('input', updatePostCorrectBtn);
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

    /* 參考歌詞不再於辨識時處理，改由事後「勘誤」按鈕獨立修正 */

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
      var audioDur = audio.duration || 180;

      /* 3. 手動切塊辨識 — 自己切音檔，每塊獨立跑 Whisper
       *    時間戳 = 我們的切塊起點 + Whisper 段內偏移
       *    重疊 3 秒確保不切斷歌詞 */
      var lang = $('langSelect').value;
      var whisperOpts = { return_timestamps: true, task: 'transcribe' };
      if (lang !== 'auto') { whisperOpts.language = lang; }

      var CHUNK_SEC = 20;    /* 每塊 20 秒（Whisper 編碼器最大 30 秒，留餘量） */
      var OVERLAP_SEC = 3;   /* 重疊 3 秒（防止切斷句子） */
      var SAMPLE_RATE = 16000;
      var chunkSamples = CHUNK_SEC * SAMPLE_RATE;
      var stepSamples = (CHUNK_SEC - OVERLAP_SEC) * SAMPLE_RATE;
      var totalChunks = Math.max(1, Math.ceil(audioData.length / stepSamples));

      var chunks = [];
      var position = 0;
      var chunkIdx = 0;
      var internalNearZero = 0;  /* Whisper 段內時間戳 < 1 秒的次數 */
      var internalTotal = 0;

      while (position < audioData.length) {
        chunkIdx++;
        var endPos = Math.min(position + chunkSamples, audioData.length);
        var slice = audioData.slice(position, endPos);
        var offsetSec = position / SAMPLE_RATE;

        fill.style.width = (50 + Math.round((chunkIdx / totalChunks) * 35)) + '%';
        status.textContent = '辨識歌詞 (' + chunkIdx + '/' + totalChunks + ')...';

        var result = await transcriber(slice, whisperOpts);

        if (result && result.chunks && result.chunks.length) {
          result.chunks.forEach(function (c) {
            if (c.text && c.text.trim()) {
              internalTotal++;
              if ((c.timestamp[0] || 0) < 1.0) internalNearZero++;
              chunks.push({
                time: +(((c.timestamp[0] || 0) + offsetSec).toFixed(2)),
                endTime: +(((c.timestamp[1] || 0) + offsetSec).toFixed(2)),
                text: c.text.trim()
              });
            }
          });
        } else if (result && result.text && result.text.trim()) {
          chunks.push({
            time: +offsetSec.toFixed(2),
            endTime: +(endPos / SAMPLE_RATE).toFixed(2),
            text: result.text.trim()
          });
        }

        position += stepSamples;
      }

      /* 4. 去除重疊區域產生的重複文字 */
      chunks = deduplicateOverlap(chunks);

      /* 5. 時間戳品質檢查 */
      var internalReliable = internalTotal === 0 || (internalNearZero / internalTotal < 0.4);
      var tsReliable = checkTimestampQuality(chunks, audioDur) && internalReliable;
      if (!tsReliable && chunks.length > 1) {
        chunks = redistributeChunks(chunks, audioDur);
      }

      /* 6. 清理重複 + 繁化姬轉正體 */
      chunks = chunks.map(function (c) {
        return { time: c.time, endTime: c.endTime, text: cleanRepeats(c.text) };
      });

      status.textContent = '轉換為正體中文...';
      fill.style.width = '90%';

      var allText = chunks.map(function (c) { return c.text; }).join('\n');
      var tradText = await toTraditional(allText);
      var tradLines = tradText.split('\n');

      state.lyrics = chunks.map(function (c, i) {
        return { time: c.time, text: tradLines[i] !== undefined ? tradLines[i] : c.text };
      });

      fill.style.width = '100%';
      status.textContent = '辨識完成！共 ' + state.lyrics.length + ' 行歌詞（已轉正體中文）';
      showToast('歌詞辨識完成！可貼歌詞按「勘誤」修正文字');

      renderLyricsView();
      updatePostCorrectBtn();

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

  /* ══════════════════════════════════
     勘誤 — 事後用參考歌詞修正文字
     ══════════════════════════════════ */

  /** 啟用/停用勘誤按鈕 */
  function updatePostCorrectBtn() {
    var btn = $('postCorrectBtn');
    if (!btn) return;
    var hasLyrics = state.lyrics && state.lyrics.length > 0;
    var hasRef = $('refTextarea') && $('refTextarea').value.trim().length > 0;
    btn.disabled = !(hasLyrics && hasRef);
  }

  /** 勘誤：保留 Whisper 時間戳，只替換文字 */
  function applyPostCorrection() {
    var refText = $('refTextarea') ? $('refTextarea').value.trim() : '';
    if (!refText || !state.lyrics.length) return;

    var rawLines = refText.split('\n');
    var refLines = cleanRefLines(rawLines);
    if (!refLines.length) {
      showToast('沒有偵測到歌詞行（段落標記已自動過濾）', 'error');
      return;
    }

    /* 記住捲動位置 */
    var scroll = $('lyricsScroll');
    var savedTop = scroll ? scroll.scrollTop : 0;
    var savedPage = window.scrollY;

    state.lyrics = replaceTextWithRef(state.lyrics, refLines);

    /* 就地換文字，不重建 DOM */
    var lines = scroll.querySelectorAll('.lyric-line');
    state.lyrics.forEach(function (l, i) {
      if (lines[i]) {
        var textEl = lines[i].querySelector('.lyric-text');
        if (textEl) textEl.textContent = l.text;
      }
    });

    /* 強制還原捲動位置 */
    if (scroll) scroll.scrollTop = savedTop;
    window.scrollTo(0, savedPage);

    showToast('已修正歌詞文字，時間戳不變');
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
     Overlap Deduplication
     ══════════════════════════════════ */
  /**
   * 去除重疊區域產生的重複文字
   * 重疊 3 秒時，兩塊可能辨識出同樣的句子 → 保留前者
   */
  function deduplicateOverlap(chunks) {
    if (chunks.length <= 1) return chunks;
    /* 先按時間排序 */
    chunks.sort(function (a, b) { return a.time - b.time; });
    var result = [chunks[0]];
    for (var i = 1; i < chunks.length; i++) {
      var prev = result[result.length - 1];
      var curr = chunks[i];
      /* 時間幾乎重疊（差 < 4 秒）且文字完全相同 → 跳過 */
      if (Math.abs(curr.time - prev.time) < 4 && curr.text === prev.text) continue;
      /* 時間重疊且文字包含關係（切斷重複辨識）→ 保留較長的 */
      if (Math.abs(curr.time - prev.time) < 4 && isSubtext(prev.text, curr.text)) {
        if (curr.text.length > prev.text.length) {
          result[result.length - 1] = curr;
        }
        continue;
      }
      result.push(curr);
    }
    return result;
  }

  /**
   * 判斷兩段文字是否有包含關係（含尾段開頭重疊）
   */
  function isSubtext(a, b) {
    if (a.includes(b) || b.includes(a)) return true;
    /* 檢查 a 的結尾是否跟 b 的開頭重疊 */
    var minOverlap = Math.min(4, Math.min(a.length, b.length));
    for (var len = minOverlap; len <= Math.min(a.length, b.length); len++) {
      if (a.slice(-len) === b.slice(0, len)) return true;
    }
    return false;
  }

  /* ══════════════════════════════════
     Timestamp Quality Check
     ══════════════════════════════════ */
  /**
   * 檢查 Whisper 時間戳是否可靠
   * 如果所有時間戳擠在音檔前 30% → 不可靠（音樂常見問題）
   */
  function checkTimestampQuality(chunks, duration) {
    if (!chunks.length || duration <= 0) return false;
    if (chunks.length === 1) return true;

    var firstTime = chunks[0].time;
    var lastTime = chunks[chunks.length - 1].time;
    var span = lastTime - firstTime;

    /* 時間戳跨度不到歌曲 40% → 判定不可靠 */
    if (span < duration * 0.4) return false;

    /* 超過一半的 chunks 時間戳都是 0 → 不可靠 */
    var zeroCount = 0;
    for (var i = 0; i < chunks.length; i++) {
      if (chunks[i].time < 0.5) zeroCount++;
    }
    if (zeroCount > chunks.length * 0.5) return false;

    return true;
  }

  /**
   * 時間戳不可靠時：保留文字，均勻重新分配到歌曲時長
   * 跳過前 5% 和後 3%（前奏/尾奏）
   */
  function redistributeChunks(chunks, duration) {
    var N = chunks.length;
    if (N <= 0) return chunks;
    var start = Math.min(duration * 0.05, 5);   /* 前奏：最多 5 秒 */
    var end = duration - Math.min(duration * 0.03, 3); /* 尾奏前 */
    if (end <= start) end = duration;
    var usable = end - start;
    var step = usable / N;

    return chunks.map(function (c, i) {
      return {
        time: +(start + step * i).toFixed(2),
        endTime: +(start + step * (i + 1)).toFixed(2),
        text: c.text
      };
    });
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

    /* 不論 M > N 或 M < N，永遠保留 N 個原始時間戳
       把 M 行歌詞分配進 N 個桶，文字換行合併 */
    var buckets = lyrics.map(function () { return []; });

    for (var i = 0; i < M; i++) {
      var idx = Math.round(i * (N - 1) / (M - 1 || 1));
      idx = Math.min(idx, N - 1);
      buckets[idx].push(refLines[i].trim());
    }

    return lyrics.map(function (line, i) {
      var text = buckets[i].length > 0
        ? buckets[i].join('\n')
        : line.text; /* 沒分配到歌詞的保留原文 */
      return { time: line.time, text: text };
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
     Song Structure — 段落感知時間分配
     ══════════════════════════════════ */

  /** 檢查歌詞是否包含段落標記（至少 2 個才算有結構） */
  function hasStructureMarkers(rawLines) {
    var count = 0;
    for (var i = 0; i < rawLines.length; i++) {
      if (/^\[.+\]$/.test(rawLines[i].trim())) count++;
    }
    return count >= 2;
  }

  /** 解析歌詞段落結構 → [{ type, lines }] */
  function parseSongStructure(rawLines) {
    var sections = [];
    var current = { type: 'verse', lines: [] };

    for (var i = 0; i < rawLines.length; i++) {
      var t = rawLines[i].trim();
      if (!t) continue;

      /* 段落標記 [Intro], [Verse 1] 等 */
      if (/^\[.+\]$/.test(t)) {
        if (current.lines.length > 0 || sections.length > 0) {
          sections.push(current);
        }
        var tag = t.slice(1, -1).toLowerCase();
        var type = 'verse';
        if (/intro/.test(tag)) type = 'intro';
        else if (/chorus|hook/.test(tag)) type = 'chorus';
        else if (/bridge/.test(tag)) type = 'bridge';
        else if (/outro/.test(tag)) type = 'outro';
        else if (/instrumental|solo|interlude/.test(tag)) type = 'instrumental';
        else if (/break/.test(tag)) type = 'break';
        else if (/fade/.test(tag)) type = 'fade';
        current = { type: type, lines: [] };
        continue;
      }

      /* 演奏描述 (xxx) → 跳過 */
      if (/^\(.+\)$/.test(t)) continue;

      current.lines.push(t);
    }
    if (current.lines.length > 0 || sections.length > 0) {
      sections.push(current);
    }
    return sections;
  }

  /**
   * 段落感知時間分配 — 根據歌詞結構 + 音檔長度估算每行時間
   * [Intro] → 前奏空白、[Break] → 短暫間隔、[Instrumental] → 長間奏
   * 歌詞行依總行數均分剩餘唱歌時間
   */
  function structuredDistribute(rawLines, duration) {
    var sections = parseSongStructure(rawLines);

    /* 非歌詞段落的預估秒數 */
    var gapEstimates = {
      intro: Math.min(duration * 0.06, 12),
      break: 3,
      instrumental: Math.min(duration * 0.08, 18),
      fade: Math.min(duration * 0.03, 5)
    };

    /* 第一輪：計算總間奏時間 + 歌詞行數 */
    var totalGap = 0;
    var totalLines = 0;
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s.lines.length === 0) {
        totalGap += gapEstimates[s.type] || 3;
      } else {
        totalLines += s.lines.length;
      }
    }

    /* 可用唱歌時間（至少佔歌曲 50%） */
    var outroReserve = Math.min(duration * 0.02, 3);
    var singTime = Math.max(duration - totalGap - outroReserve, duration * 0.5);
    var timePerLine = totalLines > 0 ? singTime / totalLines : 3;

    /* 第二輪：逐段分配 */
    var result = [];
    var currentTime = 0;

    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s.lines.length === 0) {
        /* 空段落（前奏/間奏/淡出）→ 跳過時間 */
        currentTime += gapEstimates[s.type] || 3;
      } else {
        for (var j = 0; j < s.lines.length; j++) {
          result.push({
            time: +currentTime.toFixed(2),
            text: s.lines[j]
          });
          currentTime += timePerLine;
        }
      }
    }

    return result;
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
