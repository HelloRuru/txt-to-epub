// markdown-parser.js — Markdown to HTML for CREngine WASM
// No external dependencies
// XTEink XTC Converter 專案：自製 Markdown 轉 HTML 轉換器

/**
 * 內嵌 CSS 樣式，針對電子紙顯示最佳化
 * - 高對比度、清晰排版
 * - serif 字體作為預設（電子紙閱讀較舒適）
 * - 避免過多裝飾，以黑白灰為主
 * @type {string}
 */
const MARKDOWN_HTML_STYLE = `
body {
  font-family: serif;
  font-size: 16px;
  line-height: 1.6;
  margin: 1em;
  color: #000;
  background: #fff;
}
h1 { font-size: 2em; margin: 0.67em 0; border-bottom: 1px solid #ccc; padding-bottom: 0.3em; }
h2 { font-size: 1.5em; margin: 0.75em 0; border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
h3 { font-size: 1.2em; margin: 0.83em 0; }
h4 { font-size: 1em; margin: 1em 0; font-weight: bold; }
h5 { font-size: 0.9em; margin: 1em 0; font-weight: bold; }
h6 { font-size: 0.85em; margin: 1em 0; font-weight: bold; color: #555; }
p { margin: 0.8em 0; }
a { color: #000; text-decoration: underline; }
strong { font-weight: bold; }
em { font-style: italic; }
code {
  font-family: monospace;
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}
pre {
  background: #f0f0f0;
  padding: 1em;
  overflow-x: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  line-height: 1.4;
}
pre code {
  background: none;
  padding: 0;
  border-radius: 0;
}
blockquote {
  border-left: 3px solid #ccc;
  padding-left: 1em;
  margin-left: 0;
  color: #444;
  font-style: italic;
}
ul, ol { padding-left: 2em; margin: 0.5em 0; }
li { margin: 0.25em 0; }
hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th { border: 1px solid #aaa; padding: 8px 12px; text-align: left; background: #f0f0f0; font-weight: bold; }
td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
img { max-width: 100%; height: auto; }
del { text-decoration: line-through; }
`.trim();

// ==================== 內部工具函式 ====================

/**
 * 跳脫 HTML 特殊字元，防止 XSS
 * @param {string} text - 原始文字
 * @returns {string} 跳脫後的文字
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 處理行內 Markdown 語法（粗體、斜體、行內程式碼、連結、圖片、刪除線）
 * @param {string} text - 單行文字
 * @returns {string} 轉換後的 HTML
 */
function parseInline(text) {
  // 行內程式碼（先處理，避免內部被其他規則影響）
  // 雙反引號包裹
  text = text.replace(/``(.+?)``/g, function(_, code) {
    return '<code>' + escapeHtml(code) + '</code>';
  });
  // 單反引號包裹
  text = text.replace(/`(.+?)`/g, function(_, code) {
    return '<code>' + escapeHtml(code) + '</code>';
  });

  // 圖片 ![alt](url "title")
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function(_, alt, url, title) {
    var titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
    return '<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(alt) + '"' + titleAttr + '>';
  });

  // 連結 [text](url "title")
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function(_, linkText, url, title) {
    var titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
    return '<a href="' + escapeHtml(url) + '"' + titleAttr + '>' + linkText + '</a>';
  });

  // 粗斜體 ***text*** 或 ___text___
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');

  // 粗體 **text** 或 __text__
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // 斜體 *text* 或 _text_
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/\b_(.+?)_\b/g, '<em>$1</em>');

  // 刪除線 ~~text~~
  text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

  return text;
}

// ==================== 區塊級解析器 ====================

/**
 * 解析表格區塊（GFM 風格）
 * @param {string[]} lines - 表格的所有行
 * @returns {string} 表格 HTML
 */
function parseTable(lines) {
  if (lines.length < 2) return null;

  // 第二行必須是分隔行（至少含有 - 和 |）
  var separatorLine = lines[1].trim();
  if (!/^[\s|:\-]+$/.test(separatorLine)) return null;

  /**
   * 拆解表格一行的儲存格
   * @param {string} line
   * @returns {string[]}
   */
  function splitRow(line) {
    var trimmed = line.trim();
    // 移除首尾的 |
    if (trimmed.startsWith('|')) trimmed = trimmed.substring(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.substring(0, trimmed.length - 1);
    return trimmed.split('|').map(function(cell) { return cell.trim(); });
  }

  // 解析對齊方式
  var separatorCells = splitRow(separatorLine);
  var alignments = separatorCells.map(function(cell) {
    var left = cell.startsWith(':');
    var right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    return 'left';
  });

  // 表頭
  var headerCells = splitRow(lines[0]);
  var html = '<table>\n<thead>\n<tr>\n';
  for (var h = 0; h < headerCells.length; h++) {
    var align = alignments[h] || 'left';
    html += '<th style="text-align:' + align + '">' + parseInline(headerCells[h]) + '</th>\n';
  }
  html += '</tr>\n</thead>\n';

  // 表身
  if (lines.length > 2) {
    html += '<tbody>\n';
    for (var r = 2; r < lines.length; r++) {
      var cells = splitRow(lines[r]);
      html += '<tr>\n';
      for (var c = 0; c < headerCells.length; c++) {
        var cellAlign = alignments[c] || 'left';
        var content = (c < cells.length) ? cells[c] : '';
        html += '<td style="text-align:' + cellAlign + '">' + parseInline(content) + '</td>\n';
      }
      html += '</tr>\n';
    }
    html += '</tbody>\n';
  }

  html += '</table>';
  return html;
}

/**
 * 解析清單區塊（支援巢狀、有序/無序混合）
 * @param {string[]} lines - 清單行
 * @param {number} baseIndent - 基礎縮排層級
 * @returns {{ html: string, consumed: number }}
 */
function parseList(lines, baseIndent) {
  var result = '';
  var i = 0;

  /**
   * 判斷一行是有序還是無序清單項目
   * @param {string} line
   * @returns {{ type: string, indent: number, content: string } | null}
   */
  function detectListItem(line) {
    // 無序清單：- item / * item / + item
    var ulMatch = line.match(/^(\s*)([-*+])\s+(.*)/);
    if (ulMatch) {
      return { type: 'ul', indent: ulMatch[1].length, content: ulMatch[3] };
    }
    // 有序清單：1. item / 1) item
    var olMatch = line.match(/^(\s*)(\d+)[.)]\s+(.*)/);
    if (olMatch) {
      return { type: 'ol', indent: olMatch[1].length, content: olMatch[3] };
    }
    return null;
  }

  if (i >= lines.length) return { html: '', consumed: 0 };

  var firstItem = detectListItem(lines[i]);
  if (!firstItem) return { html: '', consumed: 0 };

  var listType = firstItem.type;
  var currentIndent = firstItem.indent;
  result += '<' + listType + '>\n';

  while (i < lines.length) {
    var item = detectListItem(lines[i]);
    if (!item) break;
    if (item.indent < currentIndent) break;

    if (item.indent === currentIndent && item.type === listType) {
      // 同層級的清單項目
      result += '<li>' + parseInline(item.content);
      i++;

      // 檢查子清單
      if (i < lines.length) {
        var nextItem = detectListItem(lines[i]);
        if (nextItem && nextItem.indent > currentIndent) {
          var sub = parseList(lines.slice(i), nextItem.indent);
          result += '\n' + sub.html;
          i += sub.consumed;
        }
      }

      result += '</li>\n';
    } else if (item.indent > currentIndent) {
      // 子清單（由上面的邏輯處理）
      var subList = parseList(lines.slice(i), item.indent);
      // 把子清單附加到前一個 li（移除 </li> 再加回來）
      if (result.endsWith('</li>\n')) {
        result = result.substring(0, result.length - 6);
        result += '\n' + subList.html + '</li>\n';
      } else {
        result += subList.html;
      }
      i += subList.consumed;
    } else {
      break;
    }
  }

  result += '</' + listType + '>';
  return { html: result, consumed: i };
}

/**
 * 將完整 Markdown 文字轉換為 HTML 文件字串
 *
 * 支援語法：
 * - 標題 (#-######)
 * - 粗體、斜體、刪除線
 * - 程式碼區塊（圍欄式 ``` 和縮排式）
 * - 行內程式碼
 * - 有序/無序清單（支援巢狀）
 * - 引用區塊（支援巢狀 >）
 * - 水平線
 * - 連結與圖片
 * - 表格（GFM 風格）
 *
 * @param {string} markdownText - Markdown 原始文字
 * @returns {string} 完整的 HTML 文件（含 DOCTYPE、head、style）
 */
function markdownToHtmlDocument(markdownText) {
  var lines = markdownText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  var html = [];
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];

    // ---- 空行 ----
    if (line.trim() === '') {
      i++;
      continue;
    }

    // ---- 圍欄式程式碼區塊 ``` ----
    var fenceMatch = line.match(/^(`{3,}|~{3,})\s*(.*)?$/);
    if (fenceMatch) {
      var fence = fenceMatch[1];
      var lang = (fenceMatch[2] || '').trim();
      var codeLines = [];
      i++;
      while (i < lines.length) {
        if (lines[i].trim().startsWith(fence.charAt(0).repeat(fence.length))) {
          i++;
          break;
        }
        codeLines.push(lines[i]);
        i++;
      }
      var langAttr = lang ? ' class="language-' + escapeHtml(lang) + '"' : '';
      html.push('<pre><code' + langAttr + '>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
      continue;
    }

    // ---- 縮排式程式碼區塊（四個空格或一個 tab）----
    if (/^(    |\t)/.test(line)) {
      var indentCodeLines = [];
      while (i < lines.length && (/^(    |\t)/.test(lines[i]) || lines[i].trim() === '')) {
        if (lines[i].trim() === '') {
          indentCodeLines.push('');
        } else {
          // 移除前綴的 4 空格或 1 tab
          indentCodeLines.push(lines[i].replace(/^(    |\t)/, ''));
        }
        i++;
      }
      // 移除尾端空行
      while (indentCodeLines.length > 0 && indentCodeLines[indentCodeLines.length - 1] === '') {
        indentCodeLines.pop();
      }
      html.push('<pre><code>' + escapeHtml(indentCodeLines.join('\n')) + '</code></pre>');
      continue;
    }

    // ---- 標題 # ~ ###### ----
    var headingMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
    if (headingMatch) {
      var level = headingMatch[1].length;
      var headingContent = parseInline(headingMatch[2].trim());
      html.push('<h' + level + '>' + headingContent + '</h' + level + '>');
      i++;
      continue;
    }

    // ---- 水平線 --- / *** / ___ ----
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      html.push('<hr>');
      i++;
      continue;
    }

    // ---- 表格（偵測：當前行含 | 且下一行是分隔行）----
    if (line.includes('|') && i + 1 < lines.length && /^[\s|:\-]+$/.test(lines[i + 1].trim())) {
      var tableLines = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        tableLines.push(lines[i]);
        i++;
      }
      var tableHtml = parseTable(tableLines);
      if (tableHtml) {
        html.push(tableHtml);
      }
      continue;
    }

    // ---- 引用區塊 > ----
    if (/^\s*>/.test(line)) {
      var quoteLines = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        // 移除 > 前綴（支援巢狀 >>）
        var quoteLine = lines[i].replace(/^\s*>\s?/, '');
        quoteLines.push(quoteLine);
        i++;
      }
      // 遞迴處理引用內容（支援巢狀引用與其他語法）
      var innerHtml = markdownToHtmlBody(quoteLines.join('\n'));
      html.push('<blockquote>' + innerHtml + '</blockquote>');
      continue;
    }

    // ---- 清單（有序/無序）----
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      var listLines = [];
      while (i < lines.length && (/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) || /^\s{2,}/.test(lines[i]))) {
        listLines.push(lines[i]);
        i++;
      }
      var listResult = parseList(listLines, 0);
      html.push(listResult.html);
      continue;
    }

    // ---- Setext 風格標題（=== 或 ---）----
    if (i + 1 < lines.length) {
      var nextLine = lines[i + 1];
      if (/^={2,}\s*$/.test(nextLine)) {
        html.push('<h1>' + parseInline(line.trim()) + '</h1>');
        i += 2;
        continue;
      }
      if (/^-{2,}\s*$/.test(nextLine) && !/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
        html.push('<h2>' + parseInline(line.trim()) + '</h2>');
        i += 2;
        continue;
      }
    }

    // ---- 一般段落 ----
    var paragraphLines = [];
    while (i < lines.length && lines[i].trim() !== '' &&
      !/^(#{1,6}\s|```|~~~|>|\s*([-*+]|\d+[.)])\s|(\s*[-*_]\s*){3,}$)/.test(lines[i]) &&
      !(i + 1 < lines.length && /^[=-]{2,}\s*$/.test(lines[i + 1]))) {
      paragraphLines.push(lines[i]);
      i++;
    }
    if (paragraphLines.length > 0) {
      html.push('<p>' + parseInline(paragraphLines.join('\n').replace(/\n/g, '<br>\n')) + '</p>');
    } else {
      // 保底：如果什麼都沒匹配到，避免無限迴圈
      i++;
    }
  }

  // 組合完整 HTML 文件
  var fullHtml = '<!DOCTYPE html>\n' +
    '<html lang="zh-TW">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<style>\n' + MARKDOWN_HTML_STYLE + '\n</style>\n' +
    '</head>\n' +
    '<body>\n' +
    html.join('\n') + '\n' +
    '</body>\n' +
    '</html>';

  return fullHtml;
}

/**
 * 僅輸出 body 內容（供引用區塊遞迴呼叫）
 * @param {string} markdownText
 * @returns {string} HTML 片段（不含文件外殼）
 */
function markdownToHtmlBody(markdownText) {
  var lines = markdownText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  var html = [];
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];

    if (line.trim() === '') { i++; continue; }

    // 圍欄式程式碼區塊
    var fenceMatch = line.match(/^(`{3,}|~{3,})\s*(.*)?$/);
    if (fenceMatch) {
      var fence = fenceMatch[1];
      var lang = (fenceMatch[2] || '').trim();
      var codeLines = [];
      i++;
      while (i < lines.length) {
        if (lines[i].trim().startsWith(fence.charAt(0).repeat(fence.length))) { i++; break; }
        codeLines.push(lines[i]);
        i++;
      }
      var langAttr = lang ? ' class="language-' + escapeHtml(lang) + '"' : '';
      html.push('<pre><code' + langAttr + '>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
      continue;
    }

    // 標題
    var headingMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
    if (headingMatch) {
      var level = headingMatch[1].length;
      html.push('<h' + level + '>' + parseInline(headingMatch[2].trim()) + '</h' + level + '>');
      i++;
      continue;
    }

    // 水平線
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      html.push('<hr>');
      i++;
      continue;
    }

    // 巢狀引用
    if (/^\s*>/.test(line)) {
      var quoteLines = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      html.push('<blockquote>' + markdownToHtmlBody(quoteLines.join('\n')) + '</blockquote>');
      continue;
    }

    // 清單
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      var listLines = [];
      while (i < lines.length && (/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) || /^\s{2,}/.test(lines[i]))) {
        listLines.push(lines[i]);
        i++;
      }
      html.push(parseList(listLines, 0).html);
      continue;
    }

    // 一般段落
    var pLines = [];
    while (i < lines.length && lines[i].trim() !== '' &&
      !/^(#{1,6}\s|```|~~~|>|\s*([-*+]|\d+[.)])\s)/.test(lines[i])) {
      pLines.push(lines[i]);
      i++;
    }
    if (pLines.length > 0) {
      html.push('<p>' + parseInline(pLines.join(' ')) + '</p>');
    } else {
      i++;
    }
  }

  return html.join('\n');
}

// ==================== 匯出 ====================

// 支援瀏覽器全域和 ES Module 兩種用法
if (typeof window !== 'undefined') {
  window.markdownToHtmlDocument = markdownToHtmlDocument;
  window.MARKDOWN_HTML_STYLE = MARKDOWN_HTML_STYLE;
}
