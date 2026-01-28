import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export async function generateEpub({ title, author, chapters, cover, writingMode }) {
  const zip = new JSZip()
  const bookId = `urn:uuid:${crypto.randomUUID()}`
  const isVertical = writingMode === 'vertical'

  // mimetype（必須第一個，且不壓縮）
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  // META-INF/container.xml
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`)

  // 封面處理
  let coverManifest = ''
  let coverSpine = ''
  if (cover) {
    const coverData = await cover.arrayBuffer()
    zip.file('OEBPS/images/cover.jpg', coverData)
    coverManifest = '<item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>'
    coverSpine = '<itemref idref="cover"/>'
    
    // 封面頁
    zip.file('OEBPS/cover.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>封面</title></head>
<body style="margin:0;padding:0;text-align:center;">
<img src="images/cover.jpg" alt="封面" style="max-width:100%;max-height:100vh;"/>
</body>
</html>`)
    coverManifest += '\n    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>'
  }

  // 樣式表
  const css = `
body {
  font-family: "Noto Serif TC", "Source Han Serif TC", serif;
  line-height: 1.8;
  padding: 1em;
  ${isVertical ? `
  writing-mode: vertical-rl;
  -webkit-writing-mode: vertical-rl;
  -epub-writing-mode: vertical-rl;
  ` : ''}
}
h1, h2 {
  font-weight: bold;
  margin: 1em 0;
}
p {
  text-indent: 2em;
  margin: 0.5em 0;
}
`
  zip.file('OEBPS/styles/main.css', css)

  // 章節檔案
  const chapterManifest = []
  const chapterSpine = []
  
  chapters.forEach((chapter, index) => {
    const id = `chapter${index + 1}`
    const filename = `${id}.xhtml`
    
    // 處理段落
    const paragraphs = chapter.content
      .split(/\n+/)
      .filter(p => p.trim())
      .map(p => `<p>${escapeHtml(p.trim())}</p>`)
      .join('\n')

    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles/main.css"/>
</head>
<body>
  <h1>${escapeHtml(chapter.title)}</h1>
  ${paragraphs}
</body>
</html>`

    zip.file(`OEBPS/${filename}`, xhtml)
    chapterManifest.push(`<item id="${id}" href="${filename}" media-type="application/xhtml+xml"/>`)
    chapterSpine.push(`<itemref idref="${id}"/>`)
  })

  // 目錄 (toc.ncx)
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
  </head>
  <docTitle><text>${escapeHtml(title)}</text></docTitle>
  <navMap>
    ${chapters.map((ch, i) => `
    <navPoint id="navpoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${escapeHtml(ch.title)}</text></navLabel>
      <content src="chapter${i + 1}.xhtml"/>
    </navPoint>`).join('')}
  </navMap>
</ncx>`
  zip.file('OEBPS/toc.ncx', tocNcx)

  // 目錄 (nav.xhtml - EPUB3)
  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>目錄</title>
</head>
<body>
  <nav epub:type="toc">
    <h1>目錄</h1>
    <ol>
      ${chapters.map((ch, i) => `<li><a href="chapter${i + 1}.xhtml">${escapeHtml(ch.title)}</a></li>`).join('\n      ')}
    </ol>
  </nav>
</body>
</html>`
  zip.file('OEBPS/nav.xhtml', navXhtml)

  // content.opf
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:title>${escapeHtml(title)}</dc:title>
    <dc:creator>${escapeHtml(author || '未知')}</dc:creator>
    <dc:language>zh-TW</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="styles/main.css" media-type="text/css"/>
    ${coverManifest}
    ${chapterManifest.join('\n    ')}
  </manifest>
  <spine toc="ncx"${isVertical ? ' page-progression-direction="rtl"' : ''}>
    ${coverSpine}
    ${chapterSpine.join('\n    ')}
  </spine>
</package>`
  zip.file('OEBPS/content.opf', opf)

  // 生成並下載
  const blob = await zip.generateAsync({ 
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  })
  
  saveAs(blob, `${title || '未命名'}.epub`)
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
