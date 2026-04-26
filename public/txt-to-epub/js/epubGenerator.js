/**
 * EPUB 生成器
 */

var SIZE_MAP = { 'small': '0.9em', 'medium': '1em', 'large': '1.15em', 'xlarge': '1.3em' };
var LINE_HEIGHT_MAP = { 'compact': '1.5', 'normal': '1.8', 'relaxed': '2.0', 'loose': '2.3' };
var INDENT_MAP = { 'none': '0', 'one': '1em', 'two': '2em' };

var FONT_CONFIG = {
  'noto-sans': { id: 'noto-sans', name: '思源黑體', family: 'Noto Sans TC', description: '清晰俐落，適合螢幕閱讀' },
  'noto-serif': { id: 'noto-serif', name: '思源宋體', family: 'Noto Serif TC', description: '典雅正式，適合長篇小說' },
  'guankiap': { id: 'guankiap', name: '原俠正楷', family: 'GuanKiapTsingKhai TW', description: '手寫楷書，溫暖文青感' },
  'huninn': { id: 'huninn', name: 'jf 粉圓', family: 'jf-openhuninn', description: '可愛圓體，活潑輕鬆' },
  'custom': { id: 'custom', name: '自訂字體', family: 'CustomUserFont', description: '上傳你自己的字體檔（請確認授權）' },
};

// 副檔名對應的 MIME type 與 EPUB 內檔名
function getCustomFontMeta(file) {
  var name = (file.name || '').toLowerCase();
  if (name.endsWith('.woff2')) return { ext: 'woff2', mime: 'font/woff2', format: 'woff2' };
  if (name.endsWith('.woff')) return { ext: 'woff', mime: 'font/woff', format: 'woff' };
  if (name.endsWith('.otf')) return { ext: 'otf', mime: 'font/otf', format: 'opentype' };
  return { ext: 'ttf', mime: 'font/ttf', format: 'truetype' };
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.EpubGenerator = {
  FONT_CONFIG: FONT_CONFIG,

  generateEpub: async function (opts) {
    var title = opts.title || '未命名';
    var author = opts.author || '';
    var chapters = opts.chapters || [];
    var cover = opts.cover || null;
    var writingMode = opts.writingMode || 'horizontal';
    var fontFamily = opts.fontFamily || 'noto-sans';
    var fontSize = opts.fontSize || 'medium';
    var lineHeight = opts.lineHeight || 'normal';
    var textIndent = opts.textIndent || 'two';
    var customFont = opts.customFont || null;  // File 物件（使用者上傳的字體）
    var onProgress = opts.onProgress || function () {};

    var zip = new JSZip();
    var bookId = 'urn:uuid:' + crypto.randomUUID();
    var isVertical = writingMode === 'vertical';

    var useCustom = fontFamily === 'custom' && customFont;
    var fontConfig = useCustom ? FONT_CONFIG['custom'] : (FONT_CONFIG[fontFamily] || FONT_CONFIG['noto-sans']);
    // 自訂字體拿不到時退回思源黑體
    if (fontFamily === 'custom' && !customFont) fontConfig = FONT_CONFIG['noto-sans'];
    var fontFamilyCSS = '"' + fontConfig.family + '", "Noto Sans TC", sans-serif';
    var fontSizeValue = SIZE_MAP[fontSize] || SIZE_MAP['medium'];
    var lineHeightValue = LINE_HEIGHT_MAP[lineHeight] || LINE_HEIGHT_MAP['normal'];
    var textIndentValue = INDENT_MAP[textIndent] || INDENT_MAP['two'];

    onProgress({ stage: 'structure', message: '正在建立 EPUB 結構...' });

    // mimetype
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // container.xml
    zip.file('META-INF/container.xml',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n' +
      '  <rootfiles>\n' +
      '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n' +
      '  </rootfiles>\n' +
      '</container>'
    );

    // Cover
    var coverManifest = '';
    var coverSpine = '';
    if (cover) {
      var coverData = await cover.arrayBuffer();
      zip.file('OEBPS/images/cover.jpg', coverData);
      coverManifest = '<item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>';
      coverSpine = '<itemref idref="cover"/>';
      zip.file('OEBPS/cover.xhtml',
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<!DOCTYPE html>\n' +
        '<html xmlns="http://www.w3.org/1999/xhtml">\n' +
        '<head><title>封面</title></head>\n' +
        '<body style="margin:0;padding:0;text-align:center;">\n' +
        '<img src="images/cover.jpg" alt="封面" style="max-width:100%;max-height:100vh;"/>\n' +
        '</body>\n</html>'
      );
      coverManifest += '\n    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>';
    }

    onProgress({ stage: 'css', message: '正在產生樣式表...' });

    // 自訂字體：把檔案塞進 EPUB，並用 @font-face 注入
    var fontFaceCSS = '';
    var fontManifest = '';
    if (useCustom) {
      onProgress({ stage: 'font', message: '正在嵌入自訂字體...' });
      var fontMeta = getCustomFontMeta(customFont);
      var fontData = await customFont.arrayBuffer();
      var fontFilename = 'user-font.' + fontMeta.ext;
      zip.file('OEBPS/fonts/' + fontFilename, fontData);
      fontFaceCSS =
        '@font-face {\n' +
        '  font-family: "CustomUserFont";\n' +
        '  src: url("fonts/' + fontFilename + '") format("' + fontMeta.format + '");\n' +
        '  font-weight: normal;\n' +
        '  font-style: normal;\n' +
        '}\n\n';
      fontManifest = '<item id="user-font" href="fonts/' + fontFilename + '" media-type="' + fontMeta.mime + '"/>';
    }

    // CSS
    var verticalCSS = isVertical ? '\n  writing-mode: vertical-rl;\n  -webkit-writing-mode: vertical-rl;\n  -epub-writing-mode: vertical-rl;\n  text-orientation: mixed;' : '';
    var css = fontFaceCSS +
      'body {\n' +
      '  font-family: ' + fontFamilyCSS + ';\n' +
      '  font-size: ' + fontSizeValue + ';\n' +
      '  line-height: ' + lineHeightValue + ';\n' +
      '  padding: 1em;\n' +
      '  margin: 0;\n' +
      '  text-align: justify;' + verticalCSS + '\n' +
      '}\n\n' +
      'h1 {\n' +
      '  font-size: 1.5em;\n' +
      '  font-weight: bold;\n' +
      '  margin: 1.5em 0 1em 0;\n' +
      '  line-height: 1.3;\n' +
      '  text-align: ' + (isVertical ? 'center' : 'left') + ';\n' +
      '}\n\n' +
      'p {\n' +
      '  text-indent: ' + textIndentValue + ';\n' +
      '  margin: 0.5em 0;\n' +
      '  hanging-punctuation: allow-end;\n' +
      '}\n';
    zip.file('OEBPS/styles/main.css', css);

    onProgress({ stage: 'chapters', message: '正在處理章節...' });

    // Chapters
    var chapterManifest = [];
    var chapterSpine = [];

    for (var i = 0; i < chapters.length; i++) {
      var id = 'chapter' + (i + 1);
      var fname = id + '.xhtml';

      var paragraphs = chapters[i].content
        .split(/\n+/)
        .filter(function (p) { return p.trim(); })
        .map(function (p) { return '<p>' + escapeHtml(p.trim()) + '</p>'; })
        .join('\n');

      var xhtml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<!DOCTYPE html>\n' +
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">\n' +
        '<head>\n  <meta charset="UTF-8"/>\n  <title>' + escapeHtml(chapters[i].title) + '</title>\n' +
        '  <link rel="stylesheet" type="text/css" href="styles/main.css"/>\n</head>\n' +
        '<body>\n  <h1>' + escapeHtml(chapters[i].title) + '</h1>\n  ' + paragraphs + '\n</body>\n</html>';

      zip.file('OEBPS/' + fname, xhtml);
      chapterManifest.push('<item id="' + id + '" href="' + fname + '" media-type="application/xhtml+xml"/>');
      chapterSpine.push('<itemref idref="' + id + '"/>');
    }

    onProgress({ stage: 'toc', message: '正在建立目錄...' });

    // toc.ncx
    var navPoints = chapters.map(function (ch, i) {
      return '    <navPoint id="navpoint-' + (i + 1) + '" playOrder="' + (i + 1) + '">\n' +
        '      <navLabel><text>' + escapeHtml(ch.title) + '</text></navLabel>\n' +
        '      <content src="chapter' + (i + 1) + '.xhtml"/>\n    </navPoint>';
    }).join('\n');

    zip.file('OEBPS/toc.ncx',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n' +
      '  <head><meta name="dtb:uid" content="' + bookId + '"/></head>\n' +
      '  <docTitle><text>' + escapeHtml(title) + '</text></docTitle>\n' +
      '  <navMap>\n' + navPoints + '\n  </navMap>\n</ncx>'
    );

    // nav.xhtml
    var navItems = chapters.map(function (ch, i) {
      return '      <li><a href="chapter' + (i + 1) + '.xhtml">' + escapeHtml(ch.title) + '</a></li>';
    }).join('\n');

    zip.file('OEBPS/nav.xhtml',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<!DOCTYPE html>\n' +
      '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">\n' +
      '<head><meta charset="UTF-8"/><title>目錄</title>\n' +
      '  <link rel="stylesheet" type="text/css" href="styles/main.css"/>\n</head>\n' +
      '<body>\n  <nav epub:type="toc">\n    <h1>目錄</h1>\n    <ol>\n' +
      navItems + '\n    </ol>\n  </nav>\n</body>\n</html>'
    );

    onProgress({ stage: 'opf', message: '正在產生套件描述...' });

    // content.opf
    var opf =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">\n' +
      '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n' +
      '    <dc:identifier id="bookid">' + bookId + '</dc:identifier>\n' +
      '    <dc:title>' + escapeHtml(title) + '</dc:title>\n' +
      '    <dc:creator>' + escapeHtml(author || '未知') + '</dc:creator>\n' +
      '    <dc:language>zh-TW</dc:language>\n' +
      '    <meta property="dcterms:modified">' + new Date().toISOString().split('.')[0] + 'Z</meta>\n' +
      '  </metadata>\n' +
      '  <manifest>\n' +
      '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n' +
      '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n' +
      '    <item id="css" href="styles/main.css" media-type="text/css"/>\n' +
      (fontManifest ? '    ' + fontManifest + '\n' : '') +
      '    ' + coverManifest + '\n' +
      '    ' + chapterManifest.join('\n    ') + '\n' +
      '  </manifest>\n' +
      '  <spine toc="ncx"' + (isVertical ? ' page-progression-direction="rtl"' : '') + '>\n' +
      '    ' + coverSpine + '\n' +
      '    ' + chapterSpine.join('\n    ') + '\n' +
      '  </spine>\n' +
      '</package>';
    zip.file('OEBPS/content.opf', opf);

    onProgress({ stage: 'compress', message: '正在壓縮檔案...' });

    var blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    onProgress({ stage: 'done', message: '完成！' });
    return blob;
  }
};
