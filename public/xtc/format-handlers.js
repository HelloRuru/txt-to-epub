// format-handlers.js — 多格式輸入路由
// XTEink XTC Converter 專案
// 依據格式類型分流至對應的渲染引擎
// 需搭配 markdown-parser.js 使用

// ==================== 格式設定 ====================

/**
 * 支援的檔案格式設定
 *
 * engine 類型說明：
 * - 'crengine'：CREngine WASM 原生支援，直接餵入原始 bytes
 * - 'markdown-to-crengine'：先轉 HTML 再餵入 CREngine
 * - 'pdfjs'：使用 PDF.js 獨立渲染管線
 * - 'pptx-renderer'：自訂 OOXML 渲染器（預留）
 *
 * @type {Object.<string, { engine: string, accept: string, mime: string, label: string }>}
 */
var FORMAT_CONFIG = {
  // CREngine WASM 原生格式（直接餵 raw bytes）
  epub: {
    engine: 'crengine',
    accept: '.epub',
    mime: 'application/epub+zip',
    label: 'EPUB 電子書'
  },
  mobi: {
    engine: 'crengine',
    accept: '.mobi,.azw,.prc,.pdb',
    mime: '',
    label: 'MOBI/PDB 電子書'
  },
  txt: {
    engine: 'crengine',
    accept: '.txt',
    mime: 'text/plain',
    label: '純文字檔'
  },
  doc: {
    engine: 'crengine',
    accept: '.doc',
    mime: '',
    label: 'Word 文件 (DOC)'
  },
  docx: {
    engine: 'crengine',
    accept: '.docx,.docm',
    mime: '',
    label: 'Word 文件 (DOCX)'
  },

  // 需要前處理再交給 CREngine
  md: {
    engine: 'markdown-to-crengine',
    accept: '.md,.markdown',
    mime: 'text/markdown',
    label: 'Markdown 文件'
  },

  // 獨立渲染管線
  pdf: {
    engine: 'pdfjs',
    accept: '.pdf',
    mime: 'application/pdf',
    label: 'PDF 文件'
  },

  // 預留擴充
  pptx: {
    engine: 'pptx-renderer',
    accept: '.pptx',
    mime: '',
    label: 'PowerPoint 簡報'
  }
};

// ==================== 工具函式 ====================

/**
 * 取得所有支援的副檔名（供 file input 的 accept 屬性使用）
 * @returns {string} 逗號分隔的副檔名字串，例如 ".epub,.mobi,.txt,..."
 */
function getAllAcceptedExtensions() {
  var extensions = [];
  var keys = Object.keys(FORMAT_CONFIG);
  for (var i = 0; i < keys.length; i++) {
    var acceptStr = FORMAT_CONFIG[keys[i]].accept;
    var parts = acceptStr.split(',');
    for (var j = 0; j < parts.length; j++) {
      var ext = parts[j].trim();
      if (ext && extensions.indexOf(ext) === -1) {
        extensions.push(ext);
      }
    }
  }
  return extensions.join(',');
}

/**
 * 取得使用者友善的格式說明清單
 * @returns {string} 格式化的說明文字
 */
function getSupportedFormatsLabel() {
  var labels = [];
  var keys = Object.keys(FORMAT_CONFIG);
  for (var i = 0; i < keys.length; i++) {
    labels.push(FORMAT_CONFIG[keys[i]].label + ' (' + FORMAT_CONFIG[keys[i]].accept + ')');
  }
  return labels.join(', ');
}

/**
 * 從檔案名稱或 MIME 類型偵測格式
 * @param {File} file - 使用者選取的檔案
 * @returns {{ format: string, config: Object } | null} 格式資訊，或 null 表示不支援
 */
function detectFormat(file) {
  var fileName = file.name.toLowerCase();
  var dotIndex = fileName.lastIndexOf('.');
  var ext = dotIndex !== -1 ? fileName.substring(dotIndex) : '';

  // 先用副檔名比對
  var keys = Object.keys(FORMAT_CONFIG);
  for (var i = 0; i < keys.length; i++) {
    var config = FORMAT_CONFIG[keys[i]];
    var acceptExts = config.accept.split(',');
    for (var j = 0; j < acceptExts.length; j++) {
      if (acceptExts[j].trim() === ext) {
        return { format: keys[i], config: config };
      }
    }
  }

  // 副檔名對不上，試 MIME 類型
  if (file.type) {
    for (var k = 0; k < keys.length; k++) {
      if (FORMAT_CONFIG[keys[k]].mime && FORMAT_CONFIG[keys[k]].mime === file.type) {
        return { format: keys[k], config: FORMAT_CONFIG[keys[k]] };
      }
    }
  }

  return null;
}

/**
 * 判斷某個格式是否可由 CREngine 直接處理（不需前處理）
 * @param {string} format - 格式名稱（FORMAT_CONFIG 的 key）
 * @returns {boolean}
 */
function isCREngineNative(format) {
  var config = FORMAT_CONFIG[format];
  return config && config.engine === 'crengine';
}

// ==================== 檔案處理路由 ====================

/**
 * 主要進入點：依格式路由檔案到對應的處理器
 *
 * @param {File} file - 使用者上傳的檔案
 * @param {Object} renderer - CREngine 的 EpubRenderer 實例
 * @param {Object} Module - CREngine WASM Module（提供 allocateMemory / HEAPU8 等）
 * @returns {Promise<{ success: boolean, engine: string, message: string }>}
 */
async function handleFile(file, renderer, Module) {
  var detected = detectFormat(file);

  if (!detected) {
    return {
      success: false,
      engine: null,
      message: '不支援的檔案格式：' + file.name + '\n支援的格式：' + getSupportedFormatsLabel()
    };
  }

  var format = detected.format;
  var config = detected.config;

  console.log('[format-handlers] 偵測到格式：' + format + '（' + config.label + '）');

  switch (config.engine) {
    case 'crengine':
      return await handleCREngineNative(file, renderer, Module);

    case 'markdown-to-crengine':
      return await handleMarkdown(file, renderer, Module);

    case 'pdfjs':
      return await handlePdf(file);

    case 'pptx-renderer':
      return handlePptx(file);

    default:
      return {
        success: false,
        engine: config.engine,
        message: '引擎「' + config.engine + '」尚未實作'
      };
  }
}

// ==================== CREngine 原生格式 ====================

/**
 * 處理 CREngine 原生支援的格式（EPUB、MOBI、TXT、DOC、DOCX）
 * 直接讀取檔案的 raw bytes 餵入 loadEpubFromMemory
 *
 * @param {File} file - 檔案
 * @param {Object} renderer - CREngine EpubRenderer
 * @param {Object} Module - CREngine WASM Module
 * @returns {Promise<{ success: boolean, engine: string, message: string }>}
 */
async function handleCREngineNative(file, renderer, Module) {
  try {
    var arrayBuffer = await file.arrayBuffer();
    var data = new Uint8Array(arrayBuffer);
    var ptr = Module.allocateMemory(data.length);
    Module.HEAPU8.set(data, ptr);

    try {
      renderer.loadEpubFromMemory(ptr, data.length);
    } finally {
      Module.freeMemory(ptr);
    }

    return {
      success: true,
      engine: 'crengine',
      message: '已載入：' + file.name
    };
  } catch (err) {
    console.error('[format-handlers] CREngine 載入失敗：', err);
    return {
      success: false,
      engine: 'crengine',
      message: '載入失敗：' + file.name + '\n' + (err.message || String(err))
    };
  }
}

// ==================== Markdown 處理 ====================

/**
 * 處理 Markdown 檔案：
 * 1. 讀取純文字
 * 2. 用 markdownToHtmlDocument() 轉為完整 HTML
 * 3. 將 HTML 字串編碼為 UTF-8 bytes 餵入 CREngine
 *
 * 需要先載入 markdown-parser.js
 *
 * @param {File} file - Markdown 檔案
 * @param {Object} renderer - CREngine EpubRenderer
 * @param {Object} Module - CREngine WASM Module
 * @returns {Promise<{ success: boolean, engine: string, message: string }>}
 */
async function handleMarkdown(file, renderer, Module) {
  // 確認 markdown-parser.js 已載入
  if (typeof markdownToHtmlDocument !== 'function') {
    return {
      success: false,
      engine: 'markdown-to-crengine',
      message: '缺少 markdown-parser.js，無法轉換 Markdown 檔案'
    };
  }

  try {
    // 讀取 Markdown 原始文字
    var text = await file.text();
    console.log('[format-handlers] Markdown 原文長度：' + text.length + ' 字元');

    // 轉為 HTML
    var htmlDoc = markdownToHtmlDocument(text);
    console.log('[format-handlers] 產生 HTML 長度：' + htmlDoc.length + ' 字元');

    // 編碼為 UTF-8 bytes
    var encoder = new TextEncoder();
    var data = encoder.encode(htmlDoc);

    // 餵入 CREngine（CREngine 也接受 HTML）
    var ptr = Module.allocateMemory(data.length);
    Module.HEAPU8.set(data, ptr);

    try {
      renderer.loadEpubFromMemory(ptr, data.length);
    } finally {
      Module.freeMemory(ptr);
    }

    return {
      success: true,
      engine: 'markdown-to-crengine',
      message: '已載入 Markdown：' + file.name + '（轉換為 HTML 後渲染）'
    };
  } catch (err) {
    console.error('[format-handlers] Markdown 處理失敗：', err);
    return {
      success: false,
      engine: 'markdown-to-crengine',
      message: 'Markdown 轉換失敗：' + file.name + '\n' + (err.message || String(err))
    };
  }
}

// ==================== 中文章節擷取（TXT/MOBI 輔助）====================

/**
 * 中文書籍章節標題的正規表達式模式
 * 用於從純文字內容擷取目錄結構
 * @type {RegExp[]}
 */
var CHINESE_CHAPTER_PATTERNS = [
  // 「第一章」「第二十三章」「第一章 相遇」（章節標記後只允許空白或標題文字）
  /^第[零一二三四五六七八九十百千]+[章回卷節篇集幕](\s+.+)?$/,
  // 「第1章」「第23章」「第3章 結局」
  /^第\d+[章回卷節篇集幕](\s+.+)?$/,
  // 「Chapter 1」「Chapter 1 Introduction」
  /^Chapter\s+\d+(\s+.+)?$/i,
  // 「卷一」「卷二 起始」
  /^卷[零一二三四五六七八九十百千]+(\s+.+)?$/,
  // 「序章」「終章」「楔子」「尾聲」等
  /^(序章|序|前言|引子|楔子|終章|尾聲|後記|附錄|番外)(\s+.+)?$/
];

/**
 * 從純文字內容擷取章節列表
 * 適用於 TXT 或從 MOBI 提取出的文字內容
 *
 * @param {string} text - 文件全文
 * @returns {{ title: string, offset: number, lineNumber: number }[]} 章節陣列
 */
function extractChaptersFromText(text) {
  var chapters = [];
  var lines = text.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var trimmed = lines[i].trim();
    if (trimmed === '') continue;

    for (var p = 0; p < CHINESE_CHAPTER_PATTERNS.length; p++) {
      if (CHINESE_CHAPTER_PATTERNS[p].test(trimmed)) {
        chapters.push({
          title: trimmed,
          offset: textOffsetAtLine(text, i),
          lineNumber: i + 1
        });
        break; // 一行只匹配一次
      }
    }
  }

  return chapters;
}

/**
 * 計算第 N 行在原始文字中的字元偏移量
 * @param {string} text - 全文
 * @param {number} lineIndex - 行索引（從 0 開始）
 * @returns {number} 字元偏移量
 */
function textOffsetAtLine(text, lineIndex) {
  var offset = 0;
  var currentLine = 0;
  for (var i = 0; i < text.length; i++) {
    if (currentLine === lineIndex) return i;
    if (text[i] === '\n') currentLine++;
  }
  return text.length;
}

// ==================== PDF 處理（PDF.js 管線）====================

/**
 * PDF.js CDN 路徑（按需載入）
 * @type {string}
 */
var PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs';
var PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs';

/** @type {Object|null} PDF.js 函式庫參照 */
var pdfjsLib = null;

/**
 * 按需載入 PDF.js 函式庫
 * @returns {Promise<Object>} pdfjsLib
 */
async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  try {
    pdfjsLib = await import(PDFJS_CDN);
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
    console.log('[format-handlers] PDF.js 載入完成');
    return pdfjsLib;
  } catch (err) {
    console.error('[format-handlers] PDF.js 載入失敗：', err);
    throw new Error('無法載入 PDF.js 函式庫。請確認網路連線正常。');
  }
}

/**
 * 處理 PDF 檔案
 * PDF 使用獨立的 PDF.js 渲染管線，不經過 CREngine
 *
 * @param {File} file - PDF 檔案
 * @returns {Promise<{ success: boolean, engine: string, message: string, pdfDoc?: Object }>}
 */
async function handlePdf(file) {
  try {
    var lib = await loadPdfJs();
    var arrayBuffer = await file.arrayBuffer();
    var loadingTask = lib.getDocument({ data: arrayBuffer });
    var pdfDoc = await loadingTask.promise;

    console.log('[format-handlers] PDF 已載入，共 ' + pdfDoc.numPages + ' 頁');

    return {
      success: true,
      engine: 'pdfjs',
      message: '已載入 PDF：' + file.name + '（' + pdfDoc.numPages + ' 頁）',
      pdfDoc: pdfDoc
    };
  } catch (err) {
    console.error('[format-handlers] PDF 載入失敗：', err);
    return {
      success: false,
      engine: 'pdfjs',
      message: 'PDF 載入失敗：' + file.name + '\n' + (err.message || String(err))
    };
  }
}

/**
 * 將 PDF 單頁渲染到 Canvas
 *
 * @param {Object} pdfDoc - PDF.js 文件物件
 * @param {number} pageNum - 頁碼（從 1 開始）
 * @param {HTMLCanvasElement} canvas - 目標 Canvas
 * @param {number} targetWidth - 目標寬度（像素）
 * @returns {Promise<void>}
 */
async function renderPdfPage(pdfDoc, pageNum, canvas, targetWidth) {
  var page = await pdfDoc.getPage(pageNum);
  var viewport = page.getViewport({ scale: 1 });
  var scale = targetWidth / viewport.width;
  var scaledViewport = page.getViewport({ scale: scale });

  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  var ctx = canvas.getContext('2d');
  await page.render({
    canvasContext: ctx,
    viewport: scaledViewport
  }).promise;
}

// ==================== PPTX 處理（預留）====================

/**
 * 處理 PPTX 檔案（目前為預留佔位）
 * OOXML 簡報格式需要自訂渲染器，尚未實作
 *
 * @param {File} file - PPTX 檔案
 * @returns {{ success: boolean, engine: string, message: string }}
 */
function handlePptx(file) {
  console.warn('[format-handlers] PPTX 渲染器尚未實作');
  return {
    success: false,
    engine: 'pptx-renderer',
    message: 'PPTX 格式目前尚未支援，預計未來版本加入。\n檔案：' + file.name
  };
}

// ==================== 批次處理 ====================

/**
 * 批次處理多個檔案，回傳每個檔案的處理結果
 *
 * @param {FileList|File[]} files - 多個檔案
 * @param {Object} renderer - CREngine EpubRenderer
 * @param {Object} Module - CREngine WASM Module
 * @param {function(number, number, string):void} [onProgress] - 進度回呼 (current, total, filename)
 * @returns {Promise<{ file: File, result: Object }[]>}
 */
async function handleFiles(files, renderer, Module, onProgress) {
  var results = [];
  var fileArray = Array.from(files);

  for (var i = 0; i < fileArray.length; i++) {
    var file = fileArray[i];
    if (typeof onProgress === 'function') {
      onProgress(i + 1, fileArray.length, file.name);
    }

    var result = await handleFile(file, renderer, Module);
    results.push({ file: file, result: result });
  }

  return results;
}

/**
 * 過濾出支援的檔案（從 FileList 或拖放事件）
 *
 * @param {FileList|File[]} files - 原始檔案清單
 * @returns {{ supported: File[], unsupported: File[] }}
 */
function filterSupportedFiles(files) {
  var supported = [];
  var unsupported = [];
  var fileArray = Array.from(files);

  for (var i = 0; i < fileArray.length; i++) {
    var detected = detectFormat(fileArray[i]);
    if (detected) {
      supported.push(fileArray[i]);
    } else {
      unsupported.push(fileArray[i]);
    }
  }

  return { supported: supported, unsupported: unsupported };
}

// ==================== 匯出 ====================

// 瀏覽器全域掛載
if (typeof window !== 'undefined') {
  window.FORMAT_CONFIG = FORMAT_CONFIG;
  window.getAllAcceptedExtensions = getAllAcceptedExtensions;
  window.getSupportedFormatsLabel = getSupportedFormatsLabel;
  window.detectFormat = detectFormat;
  window.isCREngineNative = isCREngineNative;
  window.handleFile = handleFile;
  window.handleCREngineNative = handleCREngineNative;
  window.handleMarkdown = handleMarkdown;
  window.handlePdf = handlePdf;
  window.handlePptx = handlePptx;
  window.renderPdfPage = renderPdfPage;
  window.extractChaptersFromText = extractChaptersFromText;
  window.handleFiles = handleFiles;
  window.filterSupportedFiles = filterSupportedFiles;
}
